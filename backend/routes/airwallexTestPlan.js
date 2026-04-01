const express = require('express')
const axios = require('axios');
const router = express.Router()
const requireSession = require('../middleware/requireSession');
const SubscriptionPlan = require('../models/SubscriptionPlan.js');
// const BillingCustomer = require('../models/BillingCustomer.js');
const CustomerSubscription = require('../models/CustomerSubscription.js');
const dayjs = require('dayjs');
const crypto = require('crypto');
const utc = require('dayjs/plugin/utc');  //  ADD UTC PLUGIN
const {
  findDistinctSubscriptionProducts,
  getEnabledSubscriptionProductIds,
} = require('../lib/subscriptionProducts');
dayjs.extend(utc);     // EXTEND DAYJS WITH UTC

const TEST_BASE = process.env.AIRWALLEX_BASE_URL || 'https://api.airwallex.com';

async function getAirwallexToken() {
  try {
    const res = await axios.post(
      `${TEST_BASE}/api/v1/authentication/login`,
      {}, //  EMPTY BODY
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.AIRWALLEX_API_KEY,
          'x-client-id': process.env.AIRWALLEX_CLIENT_ID,
        },
      }
    );

    return res.data.token;
  } catch (err) {
    console.error(
      'Airwallex auth error:',
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error('Failed to authenticate with Airwallex');
  }
}

router.get('/plans', requireSession, async (req, res) => {
  try {
    const { interval, currency, status } = req.query;

    const query = {};
    if (interval) query.interval = interval;
    if (currency) query.currency = currency;
    if (status) query.status = status;

    const plans = await SubscriptionPlan
      .find(query)
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});



/**
 * CREATE AIRWALLEX PRODUCT and PRICE
 */
router.post('/plans', requireSession, async (req, res) => {
  try {
    const {
      name,
      description,
      amount,
      currency = 'USD',
      interval = 'MONTH',
      trialDays = 14,
      active,
      bigcommerceProductId,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount is required' });
    }

    if (!bigcommerceProductId) {
      return res.status(400).json({ error: 'bigcommerceProductId is required' });
    }

    // 1️⃣ Prevent duplicates
    const exists = await SubscriptionPlan.findOne({
      $or: [{ name }, { bigcommerceProductId }],
    });
    if (exists) {
      return res.status(400).json({
        error: 'Plan already exists for this name or BigCommerce product',
      });
    }

    const token = await getAirwallexToken();

    // 2️⃣ Create Product
    const productRes = await axios.post(
      `${TEST_BASE}/api/v1/products/create`,
      {
        request_id: crypto.randomUUID(),
        name,
        description,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );


    // 3️⃣ Create Price
    const priceRes = await axios.post(
      `${TEST_BASE}/api/v1/prices/create`,
      {
        request_id: crypto.randomUUID(),
        product_id: productRes.data.id,
        currency,
        pricing_model: 'FLAT',
        flat_amount: amount,
        recurring: {
          period: 1,
          period_unit: interval,
        },
      },
      { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      }
    );

    // 4️⃣ Save to MongoDB
    const plan = await SubscriptionPlan.create({
      name,
      description,
      amount,
      currency,
      interval,
      trialDays,
      active,
      bigcommerceProductId,
      airwallexProductId: productRes.data.id,
      airwallexPriceId: priceRes.data.id,
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});


/**
 * UPDATE AIRWALLEX PRODUCT
 */


router.put('/plans/:id', requireSession, async (req, res) => {
  try {
    const {
      name,
      description,
      active,
      metadata,
      unit,
    } = req.body;

    // 1️⃣ Find plan
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const token = await getAirwallexToken();

    // 2️⃣ Update Airwallex Product
    await axios.post(
      `${TEST_BASE}/api/v1/products/${plan.airwallexProductId}/update`,
      {
        request_id: crypto.randomUUID(),
        ...(name && { name }),
        ...(description && { description }),
        ...(typeof active === 'boolean' && { active }),
        ...(unit && { unit }),
        ...(metadata && { metadata }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 3️⃣ Update MongoDB (mirror only)
    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    // if (active !== undefined) plan.status = active ? 'enabled' : 'disabled';
    if (typeof active === 'boolean') {
      plan.status = active ? 'enabled' : 'disabled';
    }

    await plan.save();

    res.json(plan);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});


/**
 * PUBLIC: GET ENABLED SUBSCRIPTION PRODUCT IDS FOR STOREFRONT
 */
router.get('/public/enabled-product-ids', async (req, res) => {
  try {
    const plans = await SubscriptionPlan
      .find({ status: 'enabled' })
      .select('bigcommerceProductId -_id')
      .lean();

    const ids = [...new Set(
      plans
        .map((plan) => Number(plan.bigcommerceProductId))
        .filter((id) => Number.isInteger(id) && id > 0)
    )];

    res.json({ productIds: ids });
  } catch (err) {
    console.error('Failed to fetch enabled subscription product IDs:', err.message);
    res.status(500).json({ error: 'Failed to fetch enabled subscription product IDs' });
  }
});

/**
 * CREATE AIRWALLEX BILLING CUSTOMER + SAVE TO DB + List Customers for deduplication
 */

/**
 * CREATE OR FIND AIRWALLEX BILLING CUSTOMER
 * Checks for existing customer by email before creating new one
 */
router.post('/billing-customers', async (req, res) => {
  try {
    const {
      name,
      email,
      type = 'INDIVIDUAL',
      phone_number,
      tax_identification_number,
      default_billing_currency,
      default_legal_entity_id,
      description,
      nickname,
      address,
      metadata,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required for deduplication' });
    }

    if (type && !['BUSINESS', 'INDIVIDUAL'].includes(type)) {
      return res.status(400).json({ error: 'Invalid customer type' });
    }

    if (address && !address.country_code) {
      return res.status(400).json({ error: 'address.country_code is required' });
    }

    const token = await getAirwallexToken();

    // 🔍 STEP 1: Search for existing customer by email in Airwallex
    let existingCustomer = null;
    try {
      //  CORRECT ENDPOINT: /api/v1/billing_customers (NOT /list)
      const listRes = await axios.get(
        `${TEST_BASE}/api/v1/billing_customers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          params: {
            email: email,  //  Simple query param, no special formatting
            page_size: 10, //  Optional: limit results
          },
        }
      );

      //  CORRECT RESPONSE STRUCTURE: items array
      const customers = listRes.data?.items || [];

      console.log("Customer search results:", customers);
      
      // Find exact email match (case-insensitive for safety)
      existingCustomer = customers.find(
        (c) => c.email?.toLowerCase() === email.toLowerCase()
      );
      
    } catch (searchErr) {
      console.warn('⚠️ Could not search Airwallex customers:', {
        message: searchErr.message,
        status: searchErr.response?.status,
        data: searchErr.response?.data
      });
      // Continue to create new customer if search fails (fail-safe)
    }

    //  STEP 2: If found, return existing customer
    if (existingCustomer) {
      console.log(' Found existing Airwallex customer:', existingCustomer.id);
      return res.status(200).json({
        success: true,
        duplicate: true,
        customer: {
          airwallexCustomerId: existingCustomer.id,
          name: existingCustomer.name,
          email: existingCustomer.email,
          type: existingCustomer.type,
          phone_number: existingCustomer.phone_number,
          tax_identification_number: existingCustomer.tax_identification_number,
          default_billing_currency: existingCustomer.default_billing_currency,
          default_legal_entity_id: existingCustomer.default_legal_entity_id,
          description: existingCustomer.description,
          nickname: existingCustomer.nickname,
          address: existingCustomer.address,
          metadata: existingCustomer.metadata,
          createdAt: existingCustomer.created_at,
          updatedAt: existingCustomer.updated_at,
        },
      });
    }

    // ➕ STEP 3: Create new customer if not found
    console.log('🆕 Creating new Airwallex customer for:', email);
    const airwallexRes = await axios.post(
      `${TEST_BASE}/api/v1/billing_customers/create`,
      {
        request_id: crypto.randomUUID(),
        ...(name && { name }),
        ...(email && { email }),
        ...(type && { type }),
        ...(phone_number && { phone_number }),
        ...(tax_identification_number && { tax_identification_number }),
        ...(default_billing_currency && { default_billing_currency }),
        ...(default_legal_entity_id && { default_legal_entity_id }),
        ...(description && { description }),
        ...(nickname && { nickname }),
        ...(address && { address }),
        ...(metadata && { metadata }),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const awCustomer = airwallexRes.data;

    res.status(201).json({
      success: true,
      duplicate: false,
      customer: {
        airwallexCustomerId: awCustomer.id,
        name: awCustomer.name,
        email: awCustomer.email,
        type: awCustomer.type,
        phone_number: awCustomer.phone_number,
        tax_identification_number: awCustomer.tax_identification_number,
        default_billing_currency: awCustomer.default_billing_currency,
        default_legal_entity_id: awCustomer.default_legal_entity_id,
        description: awCustomer.description,
        nickname: awCustomer.nickname,
        address: awCustomer.address,
        metadata: awCustomer.metadata,
        createdAt: awCustomer.created_at,
        updatedAt: awCustomer.updated_at,
      },
    });
  } catch (err) {
    console.error(
      'Create/find billing customer error:',
      err.response?.status,
      err.response?.data || err.message
    );
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to process billing customer',
    });
  }
});


/**
 * CREATE AIRWALLEX BILLING CUSTOMER
 * NOTE: Do NOT save to Mongo here.
 */
// router.post('/billing-customers', async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       type = 'INDIVIDUAL',
//       phone_number,
//       tax_identification_number,
//       default_billing_currency,
//       default_legal_entity_id,
//       description,
//       nickname,
//       address,
//       metadata,
//     } = req.body;

//     if (type && !['BUSINESS', 'INDIVIDUAL'].includes(type)) {
//       return res.status(400).json({ error: 'Invalid customer type' });
//     }

//     if (address && !address.country_code) {
//       return res.status(400).json({
//         error: 'address.country_code is required',
//       });
//     }

//     const token = await getAirwallexToken();

//     const airwallexRes = await axios.post(
//       `${TEST_BASE}/api/v1/billing_customers/create`,
//       {
//         request_id: crypto.randomUUID(),
//         ...(name && { name }),
//         ...(email && { email }),
//         ...(type && { type }),
//         ...(phone_number && { phone_number }),
//         ...(tax_identification_number && { tax_identification_number }),
//         ...(default_billing_currency && { default_billing_currency }),
//         ...(default_legal_entity_id && { default_legal_entity_id }),
//         ...(description && { description }),
//         ...(nickname && { nickname }),
//         ...(address && { address }),
//         ...(metadata && { metadata }),
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const awCustomer = airwallexRes.data;

//     res.status(201).json({
//       success: true,
//       customer: {
//         airwallexCustomerId: awCustomer.id,
//         name: awCustomer.name,
//         email: awCustomer.email,
//         type: awCustomer.type,
//         phone_number: awCustomer.phone_number,
//         tax_identification_number: awCustomer.tax_identification_number,
//         default_billing_currency: awCustomer.default_billing_currency,
//         default_legal_entity_id: awCustomer.default_legal_entity_id,
//         description: awCustomer.description,
//         nickname: awCustomer.nickname,
//         address: awCustomer.address,
//         metadata: awCustomer.metadata,
//         createdAt: awCustomer.created_at,
//         updatedAt: awCustomer.updated_at,
//       },
//     });
//   } catch (err) {
//     console.error(
//       'Create billing customer error:',
//       err.response?.status,
//       err.response?.data || err.message
//     );

//     res.status(err.response?.status || 500).json({
//       error: err.response?.data || 'Failed to create billing customer',
//     });
//   }
// });


/**
 * CREATE CHECKOUT (used by Checkout.jsx)
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { email, priceId, requestId } = req.body;

    if (!email || !priceId || !requestId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = await getAirwallexToken();

    // Trial end (14 days)
    const trialEndsAt = dayjs()
      .add(30, 'days')
      .format('YYYY-MM-DDTHH:mm:ssZZ');

    const checkoutRes = await axios.post(
      `${TEST_BASE}/api/v1/billing_checkouts/create`,
      {
        request_id: requestId,
        mode: 'SUBSCRIPTION',
        customer_data: { email },
        line_items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_ends_at: trialEndsAt,
        },
        legal_entity_id: process.env.AIRWALLEX_LEGAL_ENTITY_ID,
        linked_payment_account_id: process.env.AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID,
        success_url: 'https://yoursite.com/success',
        cancel_url: 'https://yoursite.com/cancel',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ url: checkoutRes.data.url });
  } catch (err) {
    console.error(
      'Checkout error:',
      err.response?.data || err.message
    );
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});



/**
 * CREATE OR RETRIEVE AIRWALLEX PAYMENT CUSTOMER (cus_)
 * Required to enable payment_consent on payment intents (for mtd_ reusable payment methods)
 */
router.post('/payment-customers', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const token = await getAirwallexToken();

    // Search for existing payment customer by merchant_customer_id (email)
    try {
      const searchRes = await axios.get(
        `${TEST_BASE}/api/v1/pa/customers`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { merchant_customer_id: email, page_size: 5 },
        }
      );

      const customers = searchRes.data?.items || [];
      const existing = customers.find(c => c.merchant_customer_id === email);

      if (existing) {
        console.log('Reusing existing payment customer:', existing.id);
        return res.json({ id: existing.id });
      }
    } catch (searchErr) {
      console.warn('Payment customer search failed, will create new:', searchErr.response?.data || searchErr.message);
    }

    // Create new payment customer
    const createRes = await axios.post(
      `${TEST_BASE}/api/v1/pa/customers/create`,
      {
        request_id: crypto.randomUUID(),
        merchant_customer_id: email,
        email,
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log('Payment customer created:', createRes.data.id);
    res.status(201).json({ id: createRes.data.id });
  } catch (err) {
    console.error('Create payment customer error:', err.response?.status, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to create payment customer',
    });
  }
});


/**
 * CREATE PAYMENT CONSENT (merchant-triggered, unscheduled)
 * Must be created BEFORE the payment intent so the dropIn can verify it during payment.
 */
router.post('/payment-consents', async (req, res) => {
  try {
    const { payment_customer_id, currency } = req.body;

    if (!payment_customer_id || !currency) {
      return res.status(400).json({ error: 'payment_customer_id and currency are required' });
    }

    const token = await getAirwallexToken();

    const consentRes = await axios.post(
      `${TEST_BASE}/api/v1/pa/payment_consents/create`,
      {
        request_id: crypto.randomUUID(),
        customer_id: payment_customer_id,
        currency,
        next_triggered_by: 'merchant',
        merchant_trigger_reason: 'unscheduled',
        payment_method_type: 'card',
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log('[payment-consents] created:', consentRes.data.id, 'status:', consentRes.data.status);
    res.status(201).json({
      id: consentRes.data.id,
      client_secret: consentRes.data.client_secret,
      status: consentRes.data.status,
    });
  } catch (err) {
    console.error('Create payment consent error:', err.response?.status, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to create payment consent',
    });
  }
});


/**
 * CREATE PAYMENT INTENT
 */

router.post('/payment-intents', async (req, res) => {
  try {
    const { amount, currency = "CNY", merchant_order_id, payment_customer_id } = req.body;

    if (!amount || !merchant_order_id) {
      return res.status(400).json({
        error: "amount and merchant_order_id are required"
      });
    }

    const token = await getAirwallexToken();

    const airwallexRes = await axios.post(
      `${TEST_BASE}/api/v1/pa/payment_intents/create`,
      {
        request_id: crypto.randomUUID(),
        amount,
        currency,
        merchant_order_id,
        return_url: `${process.env.FRONTEND_URL}`,
        ...(payment_customer_id && { customer_id: payment_customer_id }),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("PaymentIntent created:", {
      id: airwallexRes.data.id,
    });
    console.log("Airwallex payment intent response:", airwallexRes.data);
    res.json(airwallexRes.data);

  } catch (err) {
    console.error(
      "Create payment intent error:",
      err.response?.status,
      err.response?.data || err.message
    );

    res.status(err.response?.status || 500).json({
      error: err.response?.data || "Failed to create payment intent"
    });
  }
});



/**
 * RETRIEVE PAYMENT INTENT
 */

router.get('/payment-intents/:id', async (req, res) => {
  try {
    const token = await getAirwallexToken();

    const airwallexRes = await axios.get(
      `${TEST_BASE}/api/v1/pa/payment_intents/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("📥 Fetched payment intent:", airwallexRes.data); 

    res.json(airwallexRes.data);
  } catch (err) {
    console.error(
      'Get payment intent error:',
      err.response?.status,
      err.response?.data || err.message
    );

    res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to fetch payment intent',
    });
  }
});


router.post('/subscriptions/provision', async (req, res) => {
  console.log("Provision")
  try {
    const {
      orderId,
      cart,
      bigcommerceCustomer,
      airwallexCustomer,
      paymentSourceId,
    } = req.body;

    console.log('📥 [PROVISION] Received request:', {
      orderId,
      paymentSourceId,
      paymentSourceIdPrefix: paymentSourceId?.substring(0, 4),
      hasAirwallexCustomer: !!airwallexCustomer,
      airwallexCustomerId: airwallexCustomer?.airwallexCustomerId || airwallexCustomer?.id,
    });

    if (!orderId || !cart || !bigcommerceCustomer || !airwallexCustomer) {
      return res.status(400).json({
        error: 'orderId, cart, bigcommerceCustomer and airwallexCustomer are required',
      });
    }

    if (!bigcommerceCustomer.id) {
      return res.status(400).json({
        error: 'bigcommerceCustomer.id is required',
      });
    }


    if (!paymentSourceId) {
      console.error('❌ [PROVISION] Missing paymentSourceId for AUTO_CHARGE subscription', {
        orderId,
        airwallexCustomerId: airwallexCustomer?.airwallexCustomerId || airwallexCustomer?.id,
        collection_method: 'AUTO_CHARGE',
      });

      return res.status(400).json({
        error: 'paymentSourceId is required for AUTO_CHARGE subscription provisioning',
        code: 'MISSING_PAYMENT_SOURCE_ID',
        details: {
          orderId,
          collection_method: 'AUTO_CHARGE',
          hasAirwallexCustomer: !!airwallexCustomer,
          hasBigcommerceCustomer: !!bigcommerceCustomer,
        },
      });
    }


    // Validate paymentSourceId format - must start with 'psrc_'
    if (paymentSourceId && !paymentSourceId.startsWith('psrc_')) {
      console.error('❌ [PROVISION] Invalid paymentSourceId format:', {
        paymentSourceId,
        prefix: paymentSourceId?.substring(0, 4),
        expected: 'psrc_',
      });
      return res.status(400).json({
        error: `Invalid paymentSourceId format. Expected 'psrc_xxx', got '${paymentSourceId?.substring(0, 4)}xxx'`,
        code: 'INVALID_PAYMENT_SOURCE_ID',
        received_id: paymentSourceId,
        expected_prefix: 'psrc_',
        received_prefix: paymentSourceId?.substring(0, 4),
      });
    }
    
    const airwallexCustomerId =
      airwallexCustomer.airwallexCustomerId || airwallexCustomer.id;

    if (!airwallexCustomerId) {
      return res.status(400).json({
        error: 'airwallex customer id is required',
      });
    }

    const subscriptionProductIds = await getEnabledSubscriptionProductIds();
    const subscriptionProducts = findDistinctSubscriptionProducts(
      cart,
      subscriptionProductIds
    );

    if (subscriptionProducts.length === 0) {
      return res.json({
        success: true,
        provisioned: false,
        message: 'No subscription product found in order cart',
        subscriptions: [],
        subscription: null,
      });
    }
    const token = await getAirwallexToken();
    const { upsertSubscriptionProjection } = require('../lib/airwallex/subscriptionAdmin');
    const subscriptions = [];
    const errors = [];

    for (const subscriptionProduct of subscriptionProducts) {
      const productId = Number(subscriptionProduct.product_id);
      try {
        const plan = await SubscriptionPlan.findOne({
          bigcommerceProductId: productId,
        });

      if (!plan) {
        errors.push({
          productId,
          error: 'No SubscriptionPlan found for BigCommerce product',
        });
        continue;
      }
      if (plan.status === 'disabled' || plan.active === false) {
        errors.push({
          productId,
          error: 'SubscriptionPlan is disabled',
        });
        continue;
      }

    // const existing = await CustomerSubscription.findOne({
    //   bigcommerceProductId: Number(subscriptionProduct.product_id),
    // });

      const existing = await CustomerSubscription.findOne({
        airwallexCustomerId,
        airwallexProductId: plan.airwallexProductId,
      });

      if (existing) {
        subscriptions.push(existing);
        continue;
      }

    let trialEndsAt = null;
    if (plan.trialDays && plan.trialDays > 0) {
      // Use UTC + start of day to avoid timezone/daylight saving issues
      trialEndsAt = dayjs.utc()
        .add(plan.trialDays + 1, 'day')
        .startOf('day')  // Set to 00:00:00 to match Airwallex example format
        .format('YYYY-MM-DDTHH:mm:ss') + '+0000';  // [Z] outputs literal "Z" for UTC
      
      console.log('🧮 Calculated trial_ends_at:', trialEndsAt, `(+$ {plan.trialDays} days)`);
      console.log('🔍 Debug: Current UTC time:', dayjs.utc().format('YYYY-MM-DDTHH:mm:ss')+ '+0000');
      console.log('🔍 Debug: Trial start (created_at will be set by Airwallex)');
    }


        const subscriptionPayload = {
      request_id: crypto.randomUUID(),
      billing_customer_id: airwallexCustomerId,
      collection_method: 'AUTO_CHARGE',
      currency: plan.currency,
      items: [
        {
          price_id: plan.airwallexPriceId,
          quantity: 1,
        },
      ],
      duration: {
        period_unit: plan.interval,
        period: 1,
      },
      ...(trialEndsAt && { trial_ends_at: trialEndsAt }),
      legal_entity_id: process.env.AIRWALLEX_LEGAL_ENTITY_ID,
      linked_payment_account_id: process.env.AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID,
      payment_source_id: paymentSourceId,
      metadata: {
        bigcommerceOrderId: String(orderId),
        bigcommerceCustomerId: String(bigcommerceCustomer.id),
        bigcommerceProductId: String(productId),
      },
    };

    console.log(
      '📤 [SUBSCRIPTION CREATE] Sending payload:\n',
      JSON.stringify(
        {
          billing_customer_id: subscriptionPayload.billing_customer_id,
          collection_method: subscriptionPayload.collection_method,
          currency: subscriptionPayload.currency,
          items: subscriptionPayload.items,
          duration: subscriptionPayload.duration,
          trial_ends_at: subscriptionPayload.trial_ends_at || null,
          legal_entity_id: subscriptionPayload.legal_entity_id,
          linked_payment_account_id: subscriptionPayload.linked_payment_account_id,
          payment_source_id: subscriptionPayload.payment_source_id,
          metadata: subscriptionPayload.metadata,
        },
        null,
        2
      )
    );

    const subscriptionRes = await axios.post(
      `${TEST_BASE}/api/v1/subscriptions/create`,
      subscriptionPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // const subscriptionRes = await axios.post(
    //   `${TEST_BASE}/api/v1/subscriptions/create`,
    //   {
    //     request_id: crypto.randomUUID(),
    //     billing_customer_id: airwallexCustomerId,
    //     // collection_method: 'OUT_OF_BAND',
    //     collection_method: 'AUTO_CHARGE',
    //     currency: plan.currency,
    //     items: [
    //       {
    //         price_id: plan.airwallexPriceId,
    //         quantity: 1,
    //       },
    //     ],
    //     duration: {
    //       period_unit: plan.interval,
    //       period: 1,
    //     },
    //     ...(trialEndsAt && { trial_ends_at: trialEndsAt }),
    //     legal_entity_id: process.env.AIRWALLEX_LEGAL_ENTITY_ID,
    //     linked_payment_account_id: process.env.AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID,
    //     payment_source_id: paymentSourceId,
    //     metadata: {
    //       bigcommerceOrderId: String(orderId),
    //       bigcommerceCustomerId: String(bigcommerceCustomer.id),
    //       bigcommerceProductId: String(productId),
    //     },
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //   }
    // );

    console.log('🔍 [SUBSCRIPTION CREATE] Request payload sent:', {
      billing_customer_id: airwallexCustomerId,
      price_id: plan.airwallexPriceId,
      currency: plan.currency,
      interval: plan.interval,
      trialDays: plan.trialDays,
      trial_period: plan.trialDays > 0 ? { period: plan.trialDays, period_unit: 'DAY' } : 'NOT INCLUDED',
      payment_source_id: paymentSourceId?.substring(0, 10) + '...',
    });

    console.log('📥 [SUBSCRIPTION CREATE] Airwallex response:', {
      status: subscriptionRes.status,
      subscription_id: subscriptionRes.data?.id,
      status_value: subscriptionRes.data?.status,
      trial_ends_at: subscriptionRes.data?.trial_ends_at,
      next_billing_at: subscriptionRes.data?.next_billing_at,
      created_at: subscriptionRes.data?.created_at,
      raw_response: JSON.stringify(subscriptionRes.data, null, 2),
    });

    //  Verify trial was applied
    if (plan.trialDays > 0) {
      if (subscriptionRes.data?.status === 'IN_TRIAL') {
        console.log(' Trial successfully applied! Status: trialing');
      } else {
        console.warn('⚠️ Expected status "IN_TRIAL" but got:', subscriptionRes.data?.status);
      }
      
      if (subscriptionRes.data?.trial_ends_at) {
        console.log(' trial_ends_at present:', subscriptionRes.data.trial_ends_at);
      } else {
        console.warn('⚠️ trial_ends_at missing from response - trial may not have been applied');
      }
    }

    const awSubscription = subscriptionRes.data;

    const saved = await CustomerSubscription.create({
      bigcommerceOrderId: Number(orderId),
      bigcommerceCustomerId: Number(bigcommerceCustomer.id),
      bigcommerceProductId: productId,

      airwallexCustomerId,
      airwallexProductId: plan.airwallexProductId,
      airwallexPriceId: plan.airwallexPriceId,
      airwallexSubscriptionId: awSubscription.id,

      planName: plan.name,
      status: awSubscription.status || 'active',

      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      trialDays: plan.trialDays,

      startedAt: awSubscription.created_at
        ? dayjs(awSubscription.created_at).toDate()
        : new Date(),
      nextBillingAt: awSubscription.next_billing_at
        ? dayjs(awSubscription.next_billing_at).toDate()
        : null,

      metadata: {
        source: 'bigcommerce-checkout',
      },
    });

    const subscriptionProjection = await upsertSubscriptionProjection(
      saved,
      {
        lastSyncedAt: new Date(),
        syncStatus: 'ok',
      }
    );

    console.log('[order-flow] Subscription projection upserted:', {
      subscriptionId: subscriptionProjection._id,
      externalSubscriptionId: subscriptionProjection.externalSubscriptionId,
    });

        subscriptions.push(saved);
            } catch (productErr) {
        const errorBody = productErr.response?.data || null;

        console.error(
          '❌ [PROVISION][PRODUCT ERROR]',
          JSON.stringify(
            {
              productId,
              status: productErr.response?.status || 500,
              message: productErr.message,
              data: errorBody,
            },
            null,
            2
          )
        );

        errors.push({
          productId,
          status: productErr.response?.status || 500,
          error: errorBody || productErr.message,
        });
      }
    }

    if (subscriptions.length === 0) {
      return res.status(400).json({
        success: false,
        provisioned: false,
        error: 'Failed to provision any subscriptions for this order',
        subscriptions: [],
        subscription: null,
        errors,
      });
    }

    return res.status(201).json({
      success: true,
      provisioned: true,
      subscriptions,
      subscription: subscriptions[0] || null,
      errors,
    });
  } catch (err) {
    console.error(
      'Provision subscription error:',
      err.response?.status,
      err.response?.data || err.message
    );

    return res.status(err.response?.status || 500).json({
      error: err.response?.data || 'Failed to provision subscription',
    });
  }
});


/**
 * CREATE PAYMENT SOURCE (for AUTO_CHARGE subscriptions)
 * Call this AFTER successful payment to get reusable psrc_ ID
 */
router.post('/payment-sources/create', async (req, res) => {
  try {
    const {
      billing_customer_id,
      payment_method_id,
      payment_customer_id, // cus_ ID — used to find verified payment consent
    } = req.body;

    if (!billing_customer_id || !payment_method_id) {
      return res.status(400).json({
        error: "billing_customer_id and payment_method_id are required"
      });
    }

    const linked_payment_account_id = process.env.AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID;

    if (!linked_payment_account_id) {
      return res.status(500).json({
        error: "AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID is not configured on the server"
      });
    }

    // Wait for the payment consent to become VERIFIED (it is set asynchronously after capture).
    // Poll the payment consents for this customer up to 5 times with a 2s gap.
    let verifiedMethodId = payment_method_id;

    if (payment_customer_id) {
      const RETRIES = 5;
      const DELAY_MS = 2000;

      for (let attempt = 1; attempt <= RETRIES; attempt++) {
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

        try {
          const token = await getAirwallexToken();
          const consentsRes = await axios.get(
            `${TEST_BASE}/api/v1/pa/payment_consents`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { customer_id: payment_customer_id, page_size: 20 },
            }
          );

          const consents = consentsRes.data?.items || [];
          console.log(`[payment-sources] attempt ${attempt}: consents for ${payment_customer_id}:`,
            JSON.stringify(consents.map(c => ({
              id: c.id,
              status: c.status,
              next_triggered_by: c.next_triggered_by,
              merchant_trigger_reason: c.merchant_trigger_reason,
              pm: c.payment_method?.id,
            })), null, 2)
          );

          // Find a verified merchant-triggered consent (required for AUTO_CHARGE payment source)
          const verified = consents.find(
            c =>
              c.status === 'VERIFIED' &&
              c.next_triggered_by === 'merchant' &&
              c.payment_method?.id
          );

          if (verified) {
            verifiedMethodId = verified.payment_method.id;
            console.log(`[payment-sources] verified merchant consent found on attempt ${attempt}:`, verified.id, 'mtd:', verifiedMethodId);
            break;
          }

          if (attempt === RETRIES) {
            console.warn('[payment-sources] consent not verified after all retries — proceeding anyway');
          }
        } catch (pollErr) {
          console.warn(`[payment-sources] consent poll attempt ${attempt} failed:`, pollErr.message);
        }
      }
    }

    const token = await getAirwallexToken();



    console.log(`[payment-sources] Checking for existing payment source: billing_customer_id=${billing_customer_id}, external_id=${verifiedMethodId}`);
    
    try {
      const listRes = await axios.get(
        `${TEST_BASE}/api/v1/payment_sources`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            billing_customer_id: billing_customer_id,
            page_size: 50,
          },
        }
      );

      const existingSources = listRes.data?.items || [];
      const existingSource = existingSources.find(
        src => src.external_id === verifiedMethodId 
      );

      if (existingSource) {
        console.log(` Payment source already exists, returning:`, existingSource.id);
        return res.status(200).json({
          success: true,
          duplicate: true,
          paymentSource: {
            id: existingSource.id,
            billing_customer_id: existingSource.billing_customer_id,
            external_id: existingSource.external_id,
            linked_payment_account_id: existingSource.linked_payment_account_id,
            created_at: existingSource.created_at,
            status: existingSource.status,
          }
        });
      }
      console.log(`ℹ️ No existing payment source found, proceeding to create new one`);
    } catch (listErr) {
      console.warn(`⚠️ Could not list payment sources, proceeding to create:`, listErr.message);
      // Continue to create if listing fails (fail-safe)
    }
    const airwallexRes = await axios.post(
      `${TEST_BASE}/api/v1/payment_sources/create`,
      {
        request_id: crypto.randomUUID(),
        billing_customer_id,
        external_id: verifiedMethodId,
        linked_payment_account_id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("PaymentSource created:", {
      id: airwallexRes.data.id,
      billing_customer_id: airwallexRes.data.billing_customer_id,
      external_id: airwallexRes.data.external_id,
    });

    res.status(201).json({
      success: true,
      paymentSource: {
        id: airwallexRes.data.id,
        billing_customer_id: airwallexRes.data.billing_customer_id,
        external_id: airwallexRes.data.external_id,
        linked_payment_account_id: airwallexRes.data.linked_payment_account_id,
        created_at: airwallexRes.data.created_at,
      }
    });
  } catch (err) {
    console.error("Create payment source error:", err.response?.status, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data || "Failed to create payment source"
    });
  }
});

module.exports = router;
