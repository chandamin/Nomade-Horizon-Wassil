const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');

router.get('/', async (req, res) => {
    const subs = await Subscription.find({ storeHash: 'eapn6crf58' });
    const totalOrders = subs.reduce(
        (sum, s) => sum + (s.orders?.length || 0),
        0
    );


    res.json({
        stats: {
            totalSubscribers: subs.length,
            activeSubscriptions: subs.filter(s => s.status === 'active').length,
            pausedSubscriptions: subs.filter(s => s.status === 'paused').length,
            cancelledSubscriptions: subs.filter(s => s.status === 'cancelled').length,
        },
        recentActivity: subs
            .slice(-5)
            .reverse()
            .map(s => ({
                customer: s.customerEmail,
                action: s.status,
                plan: s.plan,
                date: s.updatedAt.toISOString().split('T')[0],
            })),
        totalSubscriptionOrders: totalOrders,

    });
});

module.exports = router;
