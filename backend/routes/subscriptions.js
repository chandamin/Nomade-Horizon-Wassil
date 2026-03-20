const express = require('express');
const router = express.Router();

const Subscription = require('../models/Subscription');
const CustomerSubscription = require('../models/CustomerSubscription');
const SubscriptionCustomer = require('../models/SubscriptionCustomer');

const {
  fetchAirwallexSubscription,
  cancelAirwallexSubscription,
  updateAirwallexSubscription,
  upsertSubscriptionProjection,
  syncLocalSubscriptionFromAirwallex,
} = require('../lib/airwallex/subscriptionAdmin');

function logRoute(label, payload = null) {
  const now = new Date().toISOString();
  if (payload !== null) {
    console.log(`[subscriptions] ${now} ${label}`, payload);
  } else {
    console.log(`[subscriptions] ${now} ${label}`);
  }
}

function logError(label, err) {
  console.error(`[subscriptions] ${new Date().toISOString()} ${label}`);
  console.error('message:', err.message);
  if (err.response?.status) console.error('status:', err.response.status);
  if (err.response?.data) console.error('response data:', err.response.data);
  if (err.stack) console.error(err.stack);
}

/**
 * LIST SUBSCRIPTIONS (ADMIN)
 * GET /api/subscriptions
 */
router.get('/', async (req, res) => {
  try {
    logRoute('GET / hit', {
      query: req.query,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
      },
    });

    const { status, customerId, productId, externalSubscriptionId } = req.query;

    const query = {};

    if (status) query.status = status;
    if (customerId) query.bigcommerceCustomerId = Number(customerId);
    if (productId) query.productId = Number(productId);
    if (externalSubscriptionId) query.externalSubscriptionId = externalSubscriptionId;

    logRoute('GET / mongo query', query);

    const subs = await Subscription.find(query).sort({ createdAt: -1 });

    logRoute('GET / result', {
      count: subs.length,
      ids: subs.map((s) => s._id.toString()),
    });

    return res.json(subs);
  } catch (err) {
    logError('GET / failed', err);
    return res.status(500).json({
      error: 'Failed to list subscriptions',
      details: err.message,
    });
  }
});

/**
 * UPSERT ADMIN PROJECTION FROM CUSTOMER SUBSCRIPTION
 * POST /api/subscriptions/internal/upsert-from-customer-subscription
 */
router.post('/internal/upsert-from-customer-subscription', async (req, res) => {
  try {
    logRoute('POST /internal/upsert-from-customer-subscription hit', {
      body: req.body,
    });

    const { customerSubscriptionId, airwallexSubscriptionId } = req.body;

    let customerSubscription = null;

    if (customerSubscriptionId) {
      customerSubscription = await CustomerSubscription.findById(customerSubscriptionId);
      logRoute('lookup by customerSubscriptionId', {
        customerSubscriptionId,
        found: !!customerSubscription,
      });
    } else if (airwallexSubscriptionId) {
      customerSubscription = await CustomerSubscription.findOne({
        airwallexSubscriptionId,
      });
      logRoute('lookup by airwallexSubscriptionId', {
        airwallexSubscriptionId,
        found: !!customerSubscription,
      });
    }

    if (!customerSubscription) {
      logRoute('CustomerSubscription not found');
      return res.status(404).json({ error: 'CustomerSubscription not found' });
    }

    logRoute('customerSubscription found', {
      id: customerSubscription._id,
      airwallexSubscriptionId: customerSubscription.airwallexSubscriptionId,
      bigcommerceCustomerId: customerSubscription.bigcommerceCustomerId,
      bigcommerceProductId: customerSubscription.bigcommerceProductId,
      status: customerSubscription.status,
    });

    const projection = await upsertSubscriptionProjection(customerSubscription, {
      lastSyncedAt: new Date(),
    });

    logRoute('projection upserted', {
      projectionId: projection._id,
      externalSubscriptionId: projection.externalSubscriptionId,
      status: projection.status,
    });

    return res.status(201).json({
      success: true,
      subscription: projection,
    });
  } catch (err) {
    logError('POST /internal/upsert-from-customer-subscription failed', err);
    return res.status(500).json({
      error: 'Failed to upsert subscription projection',
      details: err.message,
    });
  }
});

/**
 * GET SUBSCRIPTION DETAIL
 * GET /api/subscriptions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    logRoute('GET /:id hit', {
      params: req.params,
    });

    const subscription = await Subscription.findById(req.params.id).lean();

    logRoute('GET /:id subscription lookup result', {
      found: !!subscription,
      id: req.params.id,
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    let customerSubscription = null;
    let subscriptionCustomer = null;

    if (subscription.externalSubscriptionId) {
      customerSubscription = await CustomerSubscription.findOne({
        airwallexSubscriptionId: subscription.externalSubscriptionId,
      }).lean();

      logRoute('lookup customerSubscription by externalSubscriptionId', {
        externalSubscriptionId: subscription.externalSubscriptionId,
        found: !!customerSubscription,
      });
    }

    if (!customerSubscription && subscription.bigcommerceCustomerId && subscription.productId) {
      customerSubscription = await CustomerSubscription.findOne({
        bigcommerceCustomerId: subscription.bigcommerceCustomerId,
        bigcommerceProductId: subscription.productId,
      })
        .sort({ createdAt: -1 })
        .lean();

      logRoute('fallback lookup customerSubscription by bc ids', {
        bigcommerceCustomerId: subscription.bigcommerceCustomerId,
        productId: subscription.productId,
        found: !!customerSubscription,
      });
    }

    if (customerSubscription) {
      subscriptionCustomer = await SubscriptionCustomer.findOne({
        bigcommerceCustomerId: customerSubscription.bigcommerceCustomerId,
        subscriptionProductId: customerSubscription.bigcommerceProductId,
      }).lean();

      logRoute('lookup subscriptionCustomer result', {
        found: !!subscriptionCustomer,
      });
    }

    return res.json({
      subscription,
      customerSubscription,
      subscriptionCustomer,
    });
  } catch (err) {
    logError('GET /:id failed', err);
    return res.status(500).json({
      error: 'Failed to fetch subscription details',
      details: err.message,
    });
  }
});

/**
 * SYNC SUBSCRIPTION FROM AIRWALLEX
 * POST /api/subscriptions/:id/sync
 */
router.post('/:id/sync', async (req, res) => {
  try {
    logRoute('POST /:id/sync hit', {
      params: req.params,
    });

    const projection = await Subscription.findById(req.params.id);

    logRoute('sync projection lookup', {
      found: !!projection,
      id: req.params.id,
    });

    if (!projection) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!projection.externalSubscriptionId) {
      logRoute('sync aborted: missing externalSubscriptionId', {
        projectionId: projection._id,
      });

      return res.status(400).json({
        error: 'Subscription does not have externalSubscriptionId',
      });
    }

    logRoute('fetching Airwallex subscription', {
      externalSubscriptionId: projection.externalSubscriptionId,
    });

    const airwallexSubscription = await fetchAirwallexSubscription(
      projection.externalSubscriptionId
    );

    logRoute('Airwallex subscription fetched', {
      id: airwallexSubscription?.id,
      status: airwallexSubscription?.status,
      next_billing_at: airwallexSubscription?.next_billing_at,
    });

    const result = await syncLocalSubscriptionFromAirwallex(airwallexSubscription);

    logRoute('local sync completed', {
      localSubscriptionId: result.localSubscription?._id,
      projectionId: result.projection?._id,
      projectionStatus: result.projection?.status,
    });

    return res.json({
      success: true,
      subscription: result.projection,
      customerSubscription: result.localSubscription,
      airwallex: airwallexSubscription,
    });
  } catch (err) {
    logError('POST /:id/sync failed', err);
    return res.status(500).json({
      error: 'Failed to sync subscription',
      details: err.response?.data || err.message,
    });
  }
});

/**
 * CANCEL SUBSCRIPTION IN AIRWALLEX + LOCAL
 * POST /api/subscriptions/:id/cancel
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    logRoute('POST /:id/cancel hit', {
      params: req.params,
    });

    const projection = await Subscription.findById(req.params.id);

    logRoute('cancel projection lookup', {
      found: !!projection,
      id: req.params.id,
    });

    if (!projection) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!projection.externalSubscriptionId) {
      return res.status(400).json({
        error: 'Subscription does not have externalSubscriptionId',
      });
    }

    logRoute('calling Airwallex cancel', {
      externalSubscriptionId: projection.externalSubscriptionId,
    });

    const airwallexResponse = await cancelAirwallexSubscription(
      projection.externalSubscriptionId
    );

    logRoute('Airwallex cancel response received', airwallexResponse);

    projection.status = 'cancelled';
    projection.lastSyncedAt = new Date();
    projection.syncStatus = 'ok';
    projection.syncError = null;
    await projection.save();

    const updatedCustomerSub = await CustomerSubscription.findOneAndUpdate(
      { airwallexSubscriptionId: projection.externalSubscriptionId },
      {
        $set: {
          status: 'cancelled',
          nextBillingAt: null,
          'metadata.cancelledFromAdminAt': new Date().toISOString(),
        },
      },
      { new: true }
    );

    logRoute('local cancel persisted', {
      projectionId: projection._id,
      updatedCustomerSubscriptionId: updatedCustomerSub?._id || null,
    });

    return res.json({
      success: true,
      subscription: projection,
      airwallex: airwallexResponse,
    });
  } catch (err) {
    logError('POST /:id/cancel failed', err);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      details: err.response?.data || err.message,
    });
  }
});

/**
 * LOCAL PATCH
 * PATCH /api/subscriptions/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    logRoute('PATCH /:id hit', {
      params: req.params,
      body: req.body,
    });

    const { status } = req.body;

    const updated = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    logRoute('PATCH /:id result', {
      found: !!updated,
      updatedId: updated?._id || null,
      updatedStatus: updated?.status || null,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    return res.json(updated);
  } catch (err) {
    logError('PATCH /:id failed', err);
    return res.status(500).json({
      error: 'Failed to update subscription',
      details: err.message,
    });
  }
});

/**
 * OPTIONAL AIRWALLEX UPDATE BRIDGE
 * POST /api/subscriptions/:id/update-airwallex
 */
router.post('/:id/update-airwallex', async (req, res) => {
  try {
    logRoute('POST /:id/update-airwallex hit', {
      params: req.params,
      body: req.body,
    });

    const { payload = {} } = req.body;

    const projection = await Subscription.findById(req.params.id);

    logRoute('update-airwallex projection lookup', {
      found: !!projection,
      id: req.params.id,
    });

    if (!projection) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!projection.externalSubscriptionId) {
      return res.status(400).json({
        error: 'Subscription does not have externalSubscriptionId',
      });
    }

    logRoute('calling Airwallex update', {
      externalSubscriptionId: projection.externalSubscriptionId,
      payload,
    });

    const airwallexResponse = await updateAirwallexSubscription(
      projection.externalSubscriptionId,
      payload
    );

    logRoute('Airwallex update response', airwallexResponse);

    const latest = await fetchAirwallexSubscription(projection.externalSubscriptionId);

    logRoute('Airwallex latest fetched after update', {
      id: latest?.id,
      status: latest?.status,
    });

    const result = await syncLocalSubscriptionFromAirwallex(latest);

    logRoute('local sync completed after update', {
      projectionId: result.projection?._id,
      projectionStatus: result.projection?.status,
    });

    return res.json({
      success: true,
      subscription: result.projection,
      customerSubscription: result.localSubscription,
      airwallex: airwallexResponse,
    });
  } catch (err) {
    logError('POST /:id/update-airwallex failed', err);
    return res.status(500).json({
      error: 'Failed to update Airwallex subscription',
      details: err.response?.data || err.message,
    });
  }
});

/**
 * CREATE SUBSCRIPTION PLACEHOLDER (LOCAL ONLY)
 * NOTE: aligned to current schema
 */
router.post('/', async (req, res) => {
  try {
    logRoute('POST / hit', {
      body: req.body,
    });

    const {
      subscriptionCustomerId,
      customerSubscriptionId,
      externalSubscriptionId,
      bigcommerceCustomerId,
      airwallexCustomerId,
      productId,
      planName,
      price,
      currency,
      interval,
      status,
      nextBillingAt,
    } = req.body;

    if (
      !subscriptionCustomerId ||
      !customerSubscriptionId ||
      !externalSubscriptionId
    ) {
      return res.status(400).json({
        error:
          'subscriptionCustomerId, customerSubscriptionId, and externalSubscriptionId are required',
      });
    }

    const existing = await Subscription.findOne({
      externalSubscriptionId,
    });

    logRoute('POST / existing lookup', {
      externalSubscriptionId,
      found: !!existing,
    });

    if (existing) {
      return res.status(409).json({
        error: 'Subscription already exists',
      });
    }

    const subscription = await Subscription.create({
      subscriptionCustomerId,
      customerSubscriptionId,
      externalSubscriptionId,
      airwallexCustomerId: airwallexCustomerId || null,
      bigcommerceCustomerId: bigcommerceCustomerId || null,
      planName: planName || null,
      productId: productId || null,
      price: price || null,
      currency: currency || null,
      interval: interval || null,
      status: status || 'pending',
      nextBillingAt: nextBillingAt || null,
      lastSyncedAt: new Date(),
    });

    logRoute('POST / created subscription', {
      id: subscription._id,
      externalSubscriptionId: subscription.externalSubscriptionId,
    });

    return res.status(201).json(subscription);
  } catch (err) {
    logError('POST / failed', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
});

module.exports = router;