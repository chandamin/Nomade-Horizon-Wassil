const express = require('express')
const axios = require('axios');
const router = express.Router()
const SubscriptionPlan = require('../models/SubscriptionPlan.js');



async function getAirwallexToken() {
  try {
    const res = await axios.post(
      'https://api-demo.airwallex.com/api/v1/authentication/login',
      {
        client_id: process.env.AIRWALLEX_CLIENT_ID,
        api_key: process.env.AIRWALLEX_API_KEY,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data.token; // use this token for subsequent API calls
  } catch (err) {
    console.error('Airwallex auth error:', err.response?.data || err.message);
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
      { headers: { Authorization: `Bearer ${token}` } }
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

module.exports = router;
