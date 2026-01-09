const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const Store = require('../models/Store');
const registerWebhooks = require('../services/registerWebhooks');

const router = express.Router();
const crypto = require('crypto');

/**
 * ---------------------------------------
 * AUTH + INSTALL
 * GET /api/auth
 * ---------------------------------------
 */
router.get('/auth', async (req, res) => {
    const { code, context, scope, client_id } = req.query;

    /**
     * Step 1: Initial install (no code)
     */
    if (!code || !context) {
        const installUrl =
            `https://login.bigcommerce.com/oauth2/authorize` +
            `?client_id=${client_id}` +
            `&scope=${scope}` +
            `&redirect_uri=${process.env.BIGCOMMERCE_REDIRECT_URI}` +
            `&response_type=code` +
            `&context=${context}`;

        return res.redirect(installUrl);
    }

    /**
     * Step 2: OAuth callback
     */
    try {
        const tokenResponse = await axios.post(
            'https://login.bigcommerce.com/oauth2/token',
            {
                client_id: process.env.BIGCOMMERCE_CLIENT_ID,
                client_secret: process.env.BIGCOMMERCE_CLIENT_SECRET,
                code,
                context,
                scope,
                grant_type: 'authorization_code',
                redirect_uri: process.env.BIGCOMMERCE_REDIRECT_URI,
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('Redirect URI:', process.env.BIGCOMMERCE_REDIRECT_URI);
        const { access_token, context: storeContext } = tokenResponse.data;
        const storeHash = storeContext.split('/')[1];

        // Save store
        await Store.findOneAndUpdate(
            { storeHash },
            { storeHash, accessToken: access_token, scope },
            { upsert: true }
        );

        // Register webhooks ONCE per install
        await registerWebhooks({
            storeHash,
            accessToken: access_token,
        });

        return res.redirect(
            `${process.env.FRONTEND_URL}?store_hash=${storeHash}`
        );

    } catch (err) {
        console.error('OAuth failed:', err.response?.data || err.message);
        return res.status(500).json({ error: 'OAuth failed' });
    }
});

/**
 * ---------------------------------------
 * LOAD CALLBACK
 * GET /api/load
 * ---------------------------------------
 */
router.get('/load', (req, res) => {
    const { signed_payload_jwt } = req.query;

    try {
        const decoded = jwt.verify(
            signed_payload_jwt,
            process.env.BIGCOMMERCE_CLIENT_SECRET,
            { algorithms: ['HS256'] }
        );

        return res.redirect(
            `${process.env.FRONTEND_URL}?store_hash=${decoded.store_hash}`
        );

    } catch {
        return res.status(401).send('Invalid signed payload');
    }
});




// const { URL } = require('url');



// router.get('/load', (req, res) => {
//     const url = new URL(req.originalUrl, `http://${req.headers.host}`);
//     const signed_payload = url.searchParams.get('signed_payload');

//     if (!signed_payload) {
//         return res.status(401).send('Missing signed payload');
//     }

//     const parts = signed_payload.split('.');
//     if (parts.length !== 2) {
//         return res.status(401).send('Malformed signed payload');
//     }

//     const [encodedData, encodedSignature] = parts;

//     // ✅ BigCommerce uses HEX for signature
//     const receivedSignature = Buffer.from(encodedSignature, 'hex');

//     const expectedSignature = crypto
//         .createHmac('sha256', process.env.BIGCOMMERCE_CLIENT_SECRET)
//         .update(encodedData)
//         .digest(); // Buffer (32 bytes)

//     if (receivedSignature.length !== expectedSignature.length) {
//         return res.status(401).send('Invalid signed payload');
//     }

//     if (!crypto.timingSafeEqual(receivedSignature, expectedSignature)) {
//         return res.status(401).send('Invalid signed payload');
//     }

//     const payload = JSON.parse(
//         Buffer.from(encodedData, 'base64').toString('utf8')
//     );

//     const storeHash = payload.context.split('/')[1];

//     res.send(`
//         <!DOCTYPE html>
//         <html>
//           <head><title>Dashboard</title></head>
//           <body>
//             <h1>App Dashboard</h1>
//             <p>Store: ${storeHash}</p>
//             <p>User: ${payload.user.email}</p>
//           </body>
//         </html>
//     `);
// });





// const { URL } = require('url');

// router.get('/load', (req, res) => {
//     const debug = {};

//     try {
//         // 1️⃣ RAW URL INSPECTION
//         debug.originalUrl = req.originalUrl;

//         const url = new URL(req.originalUrl, `http://${req.headers.host}`);
//         const signed_payload = url.searchParams.get('signed_payload');

//         debug.hasSignedPayload = !!signed_payload;
//         debug.signedPayloadLength = signed_payload?.length;

//         if (!signed_payload) {
//             return res.status(401).json({ error: 'Missing signed payload', debug });
//         }

//         // 2️⃣ SPLIT PAYLOAD
//         const parts = signed_payload.split('.');
//         debug.partsCount = parts.length;

//         if (parts.length !== 2) {
//             return res.status(401).json({ error: 'Malformed signed payload', debug });
//         }

//         const [encodedData, encodedSignature] = parts;

//         debug.encodedDataLength = encodedData.length;
//         debug.encodedSignatureLength = encodedSignature.length;

//         // 3️⃣ BASE64URL → BUFFER
//         const base64UrlToBuffer = (str) =>
//             Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

//         const receivedSignature = base64UrlToBuffer(encodedSignature);
//         debug.receivedSignatureBytes = receivedSignature.length;

//         // 4️⃣ HMAC GENERATION
//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.BIGCOMMERCE_CLIENT_SECRET)
//             .update(encodedData)
//             .digest();

//         debug.expectedSignatureBytes = expectedSignature.length;

//         // 5️⃣ LENGTH CHECK
//         debug.lengthsMatch =
//             receivedSignature.length === expectedSignature.length;

//         if (!debug.lengthsMatch) {
//             return res.status(401).json({
//                 error: 'Signature length mismatch',
//                 debug,
//             });
//         }

//         // 6️⃣ TIMING SAFE COMPARE
//         debug.signatureMatch = crypto.timingSafeEqual(
//             receivedSignature,
//             expectedSignature
//         );

//         if (!debug.signatureMatch) {
//             return res.status(401).json({
//                 error: 'Signature mismatch',
//                 debug,
//             });
//         }

//         // 7️⃣ PAYLOAD DECODE
//         const payloadJson = Buffer.from(encodedData, 'base64').toString('utf8');
//         debug.payloadJsonPreview = payloadJson.slice(0, 100);

//         const payload = JSON.parse(payloadJson);
//         debug.hasContext = !!payload.context;
//         debug.hasUser = !!payload.user;

//         return res.json({
//             success: true,
//             debug,
//             payloadSummary: {
//                 context: payload.context,
//                 userEmail: payload.user?.email,
//             },
//         });
//     } catch (err) {
//         return res.status(500).json({
//             error: 'Exception thrown',
//             message: err.message,
//             debug,
//         });
//     }
// });



/**
 * ---------------------------------------
 * UNINSTALL CALLBACK
 * GET /api/uninstall
 * ---------------------------------------
 */
router.get('/uninstall', async (req, res) => {
    const { signed_payload_jwt } = req.query;

    try {
        const decoded = jwt.verify(
            signed_payload_jwt,
            process.env.BIGCOMMERCE_CLIENT_SECRET,
            { algorithms: ['HS256'] }
        );

        await Store.deleteOne({ storeHash: decoded.store_hash });

        return res.status(200).send('Uninstalled');
    } catch {
        return res.status(401).send('Invalid signed payload');
    }
});

module.exports = router;
