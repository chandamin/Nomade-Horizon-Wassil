// const express = require('express');
// const router = express.Router();
// const airwallex = require('../services/airwallex');

// router.get('/ping', async (req, res) => {
//     try {
//         const result = await airwallex.billing.listPlans({ page_size: 1 });
//         res.json({ success: true, result });
//     } catch (err) {
//         res.status(500).json({
//             error: err.message,
//             details: err.response?.data,
//         });
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getAccessToken, AIRWALLEX_BASE_URL } = require('../services/airwallex');

router.get('/ping', async (req, res) => {
    try {
        const token = await getAccessToken();

        res.json({
            success: true,
            token_preview: token.slice(0, 15) + '...',
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
            details: err.response?.data,
        });
    }
});

router.get('/plans', async (req, res) => {
    try {
        const token = await getAccessToken();

        console.log('Using token:', token.slice(0, 15) + '...');
        console.log('Client ID:', process.env.AIRWALLEX_CLIENT_ID);
        console.log('API Key exists:', !!process.env.AIRWALLEX_API_KEY);

        const result = await axios.get(
            `${AIRWALLEX_BASE_URL}/api/v1/billing/plans`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // 'x-client-id': process.env.AIRWALLEX_CLIENT_ID,
                    // 'x-api-key': process.env.AIRWALLEX_API_KEY,
                    // 'Content-Type': 'application/json',
                    'Content-Type': 'application/json',
                    'api-version': '2025-09-30',
                    'x-account-id': '47407007313',
                },
            }
        );

        res.json(result.data);
    } catch (err) {
        res.status(err.response?.status || 500).json({
            error: err.message,
            details: err.response?.data,
        });
    }
});


module.exports = router;

