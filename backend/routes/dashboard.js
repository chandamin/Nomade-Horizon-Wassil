// const express = require('express');
// const router = express.Router();

// // /**
// //  * GET /api/dashboard
// //  * Dummy data for now
// //  */
// // router.get('/', (req, res) => {
// //     console.log("Dashboard route hit!");  // Add logging here
// //     res.json({
// //         stats: {
// //             totalSubscribers: 128,
// //             activeSubscriptions: 94,
// //             pausedSubscriptions: 21,
// //             cancelledSubscriptions: 13,
// //         },
// //         recentActivity: [
// //             {
// //                 customer: 'john@example.com',
// //                 action: 'Subscribed',
// //                 plan: 'Monthly Box',
// //                 date: '2026-01-01',
// //             },
// //             {
// //                 customer: 'alice@example.com',
// //                 action: 'Paused',
// //                 plan: 'Weekly Delivery',
// //                 date: '2025-12-31',
// //             },
// //             {
// //                 customer: 'mike@example.com',
// //                 action: 'Cancelled',
// //                 plan: 'Monthly Box',
// //                 date: '2025-12-30',
// //             },
// //         ],
// //     });
// // });



// router.get('/', (req, res) => {
//     try {
//         res.json({
//             stats: {
//                 totalSubscribers: 128,
//                 activeSubscriptions: 94,
//                 pausedSubscriptions: 21,
//                 cancelledSubscriptions: 13,
//             },
//             recentActivity: [
//                 { customer: 'john@example.com', action: 'Subscribed', plan: 'Monthly Box', date: '2026-01-01' },
//                 { customer: 'alice@example.com', action: 'Paused', plan: 'Weekly Delivery', date: '2025-12-31' },
//                 { customer: 'mike@example.com', action: 'Cancelled', plan: 'Monthly Box', date: '2025-12-30' },
//             ],
//         });
//     } catch (error) {
//         console.error('Error in backend:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
// module.exports = router;

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
