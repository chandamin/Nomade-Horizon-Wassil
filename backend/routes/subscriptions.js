// const express = require('express');
// const router = express.Router();
// const Subscription = require('../models/Subscription');

// /**
//  * GET /api/subscriptions
//  */
// router.get('/', async (req, res) => {
//     const subs = await Subscription.find({ storeHash: 'eapn6crf58' });
//     res.json(subs);
// });

// /**
//  * PATCH /api/subscriptions/:id
//  */
// router.patch('/:id', async (req, res) => {
//     const { status } = req.body;

//     const updated = await Subscription.findByIdAndUpdate(
//         req.params.id,
//         { status },
//         { new: true }
//     );

//     if (!updated) {
//         return res.status(404).json({ error: 'Subscription not found' });
//     }

//     res.json(updated);
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');


router.get('/', async (req, res) => {
    const subs = await Subscription.find({ storeHash: 'eapn6crf58' });
    res.json(subs);
});
/**
 * CREATE SUBSCRIPTION (B9.1)
 * POST /api/subscriptions
 */

router.patch('/:id', async (req, res) => {
    const { status } = req.body;

    const updated = await Subscription.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    );

    if (!updated) {
        return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(updated);
});

router.post('/', async (req, res) => {
  try {
    const { email, productId, storeHash } = req.body;

    if (!email || !productId || !storeHash) {
      return res.status(400).json({
        error: 'email, productId, and storeHash are required',
      });
    }

    // Prevent duplicates (same email + product)
    const existing = await Subscription.findOne({
      customerEmail: email,
      productId,
      storeHash,
      status: { $in: ['pending', 'active'] },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Subscription already exists',
      });
    }

    const subscription = await Subscription.create({
      customerEmail: email,
      productId,
      storeHash,
      status: 'pending',
    });

    return res.status(201).json(subscription);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
