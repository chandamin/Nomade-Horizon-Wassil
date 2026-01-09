// const mongoose = require('mongoose');

// const OrderSchema = new mongoose.Schema({
//     orderId: Number,
//     orderNumber: String,
//     total: Number,
//     createdAt: Date,
// });

// const SubscriptionSchema = new mongoose.Schema({
//     storeHash: {
//         type: String,
//         required: true,
//         index: true,
//     },

//     customerId: Number,
//     customerEmail: String,

//     productId: Number,
//     productName: String,

//     plan: String, // e.g. monthly / yearly
//     interval: String, // month | year

//     status: {
//         type: String,
//         enum: ['pending_payment', 'active', 'paused', 'cancelled'],
//         default: 'pending_payment',
//     },

//     externalSubscriptionId: String, // Airwallex later

//     orders: [OrderSchema],

// }, { timestamps: true });

// module.exports = mongoose.model('Subscription', SubscriptionSchema);


const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: Number,
    orderNumber: String,
    total: Number,
    createdAt: Date,
})

const SubscriptionSchema = new mongoose.Schema({
    storeHash: {type: String, required:true},
    customerEmail: {type: String, required:true},
    productId: {type: Number, required: true},

    status: {
        type: String,
        enum: ['pending', 'active', 'paused', 'cancelled'],
        default: 'pending',
    },
    startedAt: {type: Date, default: Date.now},
    orders: [OrderSchema],
    
},{ timestamps: true })

module.exports = mongoose.model('Subscription', SubscriptionSchema);