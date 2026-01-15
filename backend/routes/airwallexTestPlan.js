const express = require('express')
const axios = require('axios');
const router = express.Router()
const SubscriptionPlan = require('../models/SubscriptionPlan.js');
const dayjs = require('dayjs');



async function getAirwallexToken() {
  try {
    const res = await axios.post(
      'https://api-demo.airwallex.com/api/v1/authentication/login',
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

router.post('/plans', async (req, res) => {
  try {
    const {
      name,
      description,
      amount,
      currency = 'USD',
      interval = 'MONTH',
      trialDays = 14,
    } = req.body;

    // 1️⃣ Prevent duplicates
    const exists = await SubscriptionPlan.findOne({ name });
    if (exists) {
      return res.status(400).json({ error: 'Plan already exists' });
    }

    const token = await getAirwallexToken();

    // 2️⃣ Create Product
    const productRes = await axios.post(
      'https://api-demo.airwallex.com/api/v1/products/create',
      {
        request_id: crypto.randomUUID(),
        name,
        description,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 3️⃣ Create Price
    const priceRes = await axios.post(
      'https://api-demo.airwallex.com/api/v1/prices/create',
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
      'https://api-demo.airwallex.com/api/v1/billing_checkouts/create',
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


module.exports = router;
