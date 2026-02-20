const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/bc/products?keyword=shirt&page=1&limit=20
router.get('/bc/products', async (req, res) => {
  const { keyword = '', page = 1, limit = 20 } = req.query;

  // TODO: load storeHash + accessToken from your DB/session for this merchant
  const { storeHash, accessToken } = await getBigCommerceAuth(req);

  const url = `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products` +
              `?keyword=${encodeURIComponent(keyword)}` +
              `&page=${page}&limit=${limit}&include=images`;

  const r = await axios.get(url, {
    headers: {
      'X-Auth-Token': accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  // Return only what picker needs
  const items = (r.data?.data || []).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku || null,
    has_variants: !!p.variants?.length, // may be false if not included
    image_url: p.images?.[0]?.url_thumbnail || null,
  }));

  res.json({ items, meta: r.data?.meta || {} });
});

module.exports = router;
