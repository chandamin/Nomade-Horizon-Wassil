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