const express = require('express')
const router = express.Router()
const SellingPlan = require('../models/SellingPlan')

/**
 * GET all selling plans
 */
router.get('/', async (req, res) => {
  try {
    const plans = await SellingPlan.find({
      storeHash: '', // replace later with real store hash
    }).sort({ createdAt: -1 })

    res.json(plans)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch selling plans' })
  }
})

/**
 * CREATE a selling plan
 */
router.post('/', async (req, res) => {
  try {
    const plan = await SellingPlan.create({
      storeHash: '', // inject from auth later
      name: req.body.name,
      chargeAmount: req.body.chargeAmount,
      chargeShipping: req.body.chargeShipping,
      chargeSalesTax: req.body.chargeSalesTax,
      enableCustomerPortal: req.body.enableCustomerPortal,
      billingCycleStartDayUTC: req.body.billingCycleStartDayUTC,
      billingCycleStartTimeUTC: req.body.billingCycleStartTimeUTC,
      freeTrialDays: req.body.freeTrialDays,
      installments: req.body.installments,
      customerCancellationBehaviour:
        req.body.customerCancellationBehaviour,
      setupCharge: req.body.setupCharge,
    })

    res.status(201).json(plan)
  } catch (err) {
    console.error(err)
    res.status(400).json({
      error: 'Failed to create selling plan',
      details: err.message,
    })
  }
})

/**
 * UPDATE a selling plan
 */
router.patch('/:id', async (req, res) => {
  try {
    const updated = await SellingPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'Failed to update selling plan' })
  }
})

/**
 * ENABLE / DISABLE plan
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const updated = await SellingPlan.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )

    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: 'Failed to update status' })
  }
})

module.exports = router
