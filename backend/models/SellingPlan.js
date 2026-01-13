const mongoose = require('mongoose')

const SellingPlanSchema = new mongoose.Schema(
  {
    // BigCommerce
    storeHash: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'inactive',
      index: true,
    },

    // Pricing
    currency: {
      type: String,
      default: 'USD',
    },

    chargeAmount: {
      type: Number,
      required: true,
    },

    setupCharge: {
      type: Number,
      default: 0,
    },

    freeTrialDays: {
      type: Number,
      default: 0,
    },

    installments: {
      type: Number,
      default: null, // null = infinite
    },

    billingInterval: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      required: true,
    },

    billingIntervalCount: {
      type: Number,
      required: true,
    },

    billingCycleStartDayUTC: Number,
    billingCycleStartTimeUTC: String,

    chargeShipping: {
      type: Boolean,
      default: true,
    },

    chargeSalesTax: {
      type: Boolean,
      default: true,
    },

    customerCancellationBehaviour: {
      type: String,
      enum: ['cancel_immediately', 'cancel_at_period_end'],
      default: 'cancel_at_period_end',
    },

    enableCustomerPortal: {
      type: Boolean,
      default: true,
    },

    /**
     * Airwallex mapping
     */
    airwallex: {
      productId: String,
      priceId: String,
      planId: String,
      linkedPaymentAccountId: String,
      subscriptionPlanId: String,
    },

    /**
     * Soft delete / toggle
     */
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('SellingPlan', SellingPlanSchema)



// const mongoose = require('mongoose')

// const SellingPlanSchema = new mongoose.Schema(
//   {
//     storeHash: {
//       type: String,
//       required: true,
//       index: true,
//     },

//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     chargeAmount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     chargeShipping: {
//       type: String,
//       enum: ['yes', 'no', 'first_invoice_only'],
//       default: 'yes',
//     },

//     chargeSalesTax: {
//       type: Boolean,
//       default: true,
//     },

//     enableCustomerPortal: {
//       type: Boolean,
//       default: true,
//     },

//     billingCycleStartDayUTC: {
//       type: Number,
//       min: 1,
//       max: 31,
//     },

//     billingCycleStartTimeUTC: {
//       type: String, // HH:mm
//       match: /^([01]\d|2[0-3]):([0-5]\d)$/,
//     },

//     freeTrialDays: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     installments: {
//       type: Number,
//       default: null,
//       min: 1,
//     },

//     customerCancellationBehaviour: {
//       type: String,
//       enum: [
//         'cancel_immediately',
//         'cancel_at_period_end',
//         'do_not_allow',
//       ],
//       default: 'cancel_at_period_end',
//     },

//     setupCharge: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     status: {
//       type: String,
//       enum: ['enabled', 'disabled'],
//       default: 'enabled',
//     },
//   },
//   {
//     timestamps: true, // createdAt / updatedAt
//   }
// )

// module.exports = mongoose.model('SellingPlan', SellingPlanSchema)
