const mongoose = require('mongoose')

const SellingPlanSchema = new mongoose.Schema(
  {
    storeHash: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    chargeAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    chargeShipping: {
      type: String,
      enum: ['yes', 'no', 'first_invoice_only'],
      default: 'yes',
    },

    chargeSalesTax: {
      type: Boolean,
      default: true,
    },

    enableCustomerPortal: {
      type: Boolean,
      default: true,
    },

    billingCycleStartDayUTC: {
      type: Number,
      min: 1,
      max: 31,
    },

    billingCycleStartTimeUTC: {
      type: String, // HH:mm
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    freeTrialDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    installments: {
      type: Number,
      default: null,
      min: 1,
    },

    customerCancellationBehaviour: {
      type: String,
      enum: [
        'cancel_immediately',
        'cancel_at_period_end',
        'do_not_allow',
      ],
      default: 'cancel_at_period_end',
    },

    setupCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled',
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
)

module.exports = mongoose.model('SellingPlan', SellingPlanSchema)
