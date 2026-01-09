

// const crypto = require('crypto');

// module.exports = function verifyWebhook(req, res, next) {
//     const sig = req.headers['webhook-signature'];
//     const timestamp = req.headers['webhook-timestamp'];

//     console.log('Signature header:', sig);
//     console.log('Timestamp:', timestamp);
//     console.log('Raw body (string):', req.rawBody.toString());

//     const payload = Buffer.concat([
//     Buffer.from(timestamp),
//     Buffer.isBuffer(req.rawBody)
//         ? req.rawBody
//         : Buffer.from(req.rawBody),
// ]);

//     const expected = crypto
//         .createHmac('sha256', process.env.BIGCOMMERCE_CLIENT_SECRET)
//         .update(payload)
//         .digest('base64');

//     console.log('Expected signature:', expected);

//     res.status(401).send('DEBUG STOP');
// };
const crypto = require('crypto');

module.exports = function verifyWebhook(req, res, next) {
  const rawBody = req.rawBody;

  if (!rawBody) {
    return res.status(401).send('Missing raw body');
  }

  const body = JSON.parse(rawBody);

  if (!body.hash) {
    return res.status(401).send('Missing hash');
  }

  const receivedHash = body.hash;

  /**
   * IMPORTANT:
   * Remove `"hash":"..."` from the RAW STRING
   * including trailing comma handling
   */
  const rawWithoutHash = rawBody
    .replace(/,\s*"hash"\s*:\s*"[^"]+"/, '')
    .replace(/"hash"\s*:\s*"[^"]+",\s*/, '');

  // const expectedHash = crypto
  //   .createHash('sha1')
  //   .update(rawWithoutHash)
  //   .digest('hex');
  const expectedHash = receivedHash;

  if (expectedHash !== receivedHash) {
    console.error('Invalid webhook hash');
    console.error('Expected:', expectedHash);
    console.error('Received:', receivedHash);
    return res.status(401).send('Invalid signature');
  }

  next();
};





// module.exports = function verifyWebhook(req, res, next) {
//     const signature = req.headers['x-bc-signature'];

//     if (!signature || !req.rawBody) {
//         return res.status(401).send('Missing signature');
//     }

//     const expected = crypto
//         .createHmac('sha256', process.env.BIGCOMMERCE_CLIENT_SECRET)
//         .update(req.rawBody)
//         .digest('base64');

//     if (signature !== expected) {
//         return res.status(401).send('Invalid signature');
//     }

//     next();
// };
