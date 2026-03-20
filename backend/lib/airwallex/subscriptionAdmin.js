const axios = require('axios');
const dayjs = require('dayjs');

const Subscription = require('../../models/Subscription');
const CustomerSubscription = require('../../models/CustomerSubscription');
const SubscriptionCustomer = require('../../models/SubscriptionCustomer');
const { getAirwallexToken } = require('./token');

const STORE_HASH = process.env.BC_STORE_HASH || 'eapn6crf58';
const AIRWALLEX_BASE_URL =
  process.env.AIRWALLEX_BASE_URL || 'https://api-demo.airwallex.com/api/v1';

function normaliseStatus(status) {
  const value = String(status || '').toUpperCase();

  const statusMap = {
    DRAFT: 'pending_payment',
    PENDING: 'pending_payment',
    PENDING_PAYMENT: 'pending_payment',
    IN_TRIAL: 'active',
    TRIALING: 'active',
    ACTIVE: 'active',
    PAUSED: 'paused',
    PAST_DUE: 'paused',
    UNPAID: 'paused',
    CANCELED: 'cancelled',
    CANCELLED: 'cancelled',
    ENDED: 'cancelled',
    EXPIRED: 'cancelled',
  };

  return statusMap[value] || 'pending_payment';
}

function asDate(value) {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : null;
}

async function airwallexRequest(config, retry = true) {
  try {
    const token = await getAirwallexToken();

    return await axios({
      baseURL: AIRWALLEX_BASE_URL,
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
    });
  } catch (err) {
    const status = err.response?.status;

    if (status === 401 && retry) {
      const freshToken = await getAirwallexToken(true);

      return axios({
        baseURL: AIRWALLEX_BASE_URL,
        ...config,
        headers: {
          Authorization: `Bearer ${freshToken}`,
          'Content-Type': 'application/json',
          ...(config.headers || {}),
        },
      });
    }

    throw err;
  }
}

async function fetchAirwallexSubscription(airwallexSubscriptionId) {
  const response = await airwallexRequest({
    method: 'GET',
    url: `/pa/subscriptions/${airwallexSubscriptionId}`,
  });

  return response.data;
}

async function cancelAirwallexSubscription(airwallexSubscriptionId) {
  const response = await airwallexRequest({
    method: 'POST',
    url: `/pa/subscriptions/${airwallexSubscriptionId}/cancel`,
    data: {},
  });

  return response.data;
}

async function updateAirwallexSubscription(airwallexSubscriptionId, payload) {
  const response = await airwallexRequest({
    method: 'POST',
    url: `/pa/subscriptions/${airwallexSubscriptionId}/update`,
    data: payload,
  });

  return response.data;
}

async function buildProjectionPayload(customerSubscriptionDoc, overrides = {}) {
  const subscriptionCustomer = await SubscriptionCustomer.findOne({
    bigcommerceCustomerId: customerSubscriptionDoc.bigcommerceCustomerId,
    subscriptionProductId: customerSubscriptionDoc.bigcommerceProductId,
  }).lean();

  const customerName = [
    subscriptionCustomer?.bigcommerceFirstName,
    subscriptionCustomer?.bigcommerceLastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const existingProjection = await Subscription.findOne({
    externalSubscriptionId: customerSubscriptionDoc.airwallexSubscriptionId,
  }).lean();

  return {
    storeHash: overrides.storeHash || existingProjection?.storeHash || STORE_HASH,
    customerId: customerSubscriptionDoc.bigcommerceCustomerId,
    customerEmail:
      overrides.customerEmail ||
      subscriptionCustomer?.bigcommerceEmail ||
      existingProjection?.customerEmail ||
      null,
    productId: customerSubscriptionDoc.bigcommerceProductId,
    productName:
      overrides.productName ||
      subscriptionCustomer?.subscriptionProductName ||
      existingProjection?.productName ||
      null,

    plan: customerSubscriptionDoc.planName || existingProjection?.plan || null,
    interval: customerSubscriptionDoc.interval || existingProjection?.interval || null,

    status: normaliseStatus(overrides.status || customerSubscriptionDoc.status),

    externalSubscriptionId: customerSubscriptionDoc.airwallexSubscriptionId,

    orders: existingProjection?.orders || [],

    metadata: {
      customerName: customerName || null,
      airwallexCustomerId: customerSubscriptionDoc.airwallexCustomerId,
      subscriptionCustomerId: subscriptionCustomer?._id || null,
      customerSubscriptionId: customerSubscriptionDoc._id,
      amount: customerSubscriptionDoc.amount || null,
      currency: customerSubscriptionDoc.currency || null,
      startedAt: customerSubscriptionDoc.startedAt || null,
      nextBillingAt:
        overrides.nextBillingAt ||
        customerSubscriptionDoc.nextBillingAt ||
        null,
      cancelAtPeriodEnd: Boolean(overrides.cancelAtPeriodEnd),
      lastSyncedAt: overrides.lastSyncedAt || new Date(),
      syncError: overrides.syncError || null,
      ...(existingProjection?.metadata || {}),
      ...(customerSubscriptionDoc.metadata || {}),
      ...(subscriptionCustomer?.metadata || {}),
      ...(overrides.metadata || {}),
    },
  };
}

async function upsertSubscriptionProjection(customerSubscriptionDoc, overrides = {}) {
  const payload = await buildProjectionPayload(customerSubscriptionDoc, overrides);

  return Subscription.findOneAndUpdate(
    { externalSubscriptionId: customerSubscriptionDoc.airwallexSubscriptionId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function syncLocalSubscriptionFromAirwallex(airwallexSubscription, options = {}) {
  const externalSubscriptionId = airwallexSubscription.id;
  const airwallexCustomerId =
    airwallexSubscription.billing_customer_id ||
    airwallexSubscription.customer_id ||
    options.airwallexCustomerId;

  let localSubscription = await CustomerSubscription.findOne({
    airwallexSubscriptionId: externalSubscriptionId,
  });

  if (!localSubscription && airwallexCustomerId) {
    localSubscription = await CustomerSubscription.findOne({
      airwallexCustomerId,
    }).sort({ createdAt: -1 });
  }

  if (!localSubscription) {
    throw new Error('Local CustomerSubscription not found for Airwallex subscription');
  }

  localSubscription.status = airwallexSubscription.status || localSubscription.status;
  localSubscription.nextBillingAt =
    asDate(airwallexSubscription.next_billing_at) || localSubscription.nextBillingAt;
  localSubscription.startedAt =
    asDate(airwallexSubscription.created_at) || localSubscription.startedAt;

  localSubscription.metadata = {
    ...(localSubscription.metadata || {}),
    latestAirwallexSyncAt: new Date().toISOString(),
    airwallexRawStatus: airwallexSubscription.status,
  };

  await localSubscription.save();

  const projection = await upsertSubscriptionProjection(localSubscription, {
    status: airwallexSubscription.status,
    cancelAtPeriodEnd: airwallexSubscription.cancel_at_period_end,
    nextBillingAt: asDate(airwallexSubscription.next_billing_at),
    lastSyncedAt: new Date(),
    metadata: {
      latestAirwallexSyncAt: new Date().toISOString(),
    },
  });

  return { localSubscription, projection };
}

module.exports = {
  normaliseStatus,
  fetchAirwallexSubscription,
  cancelAirwallexSubscription,
  updateAirwallexSubscription,
  upsertSubscriptionProjection,
  syncLocalSubscriptionFromAirwallex,
};