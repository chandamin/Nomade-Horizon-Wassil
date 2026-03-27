const SubscriptionPlan = require('../models/SubscriptionPlan');

function parseSubscriptionProductIds(input = '') {
  return [...new Set(
    String(input)
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0)
  )];
}

function getEnvSubscriptionProductIds() {
  return parseSubscriptionProductIds(process.env.SUBSCRIPTION_PRODUCT_IDS || '');
}

async function getEnabledSubscriptionProductIds() {
  try {
    const plans = await SubscriptionPlan.find({ status: 'enabled' }).select('bigcommerceProductId');
    return [...new Set(
      plans
        .map((plan) => Number(plan.bigcommerceProductId))
        .filter((value) => Number.isInteger(value) && value > 0)
    )];
  } catch (err) {
    console.warn(
      '[subscriptionProducts] failed to load enabled plans, falling back to SUBSCRIPTION_PRODUCT_IDS:',
      err.message
    );
    return getEnvSubscriptionProductIds();
  }
}

function findDistinctSubscriptionProducts(cart, subscriptionProductIds = []) {
  const physicalItems = cart?.lineItems?.physicalItems || [];
  const digitalItems = cart?.lineItems?.digitalItems || [];
  const allItems = [...physicalItems, ...digitalItems];
  const seen = new Set();

  return allItems.filter((item) => {
    const productId = Number(item.product_id);

    if (!subscriptionProductIds.includes(productId) || seen.has(productId)) {
      return false;
    }

    seen.add(productId);
    return true;
  });
}

module.exports = {
  findDistinctSubscriptionProducts,
  getEnabledSubscriptionProductIds,
  getEnvSubscriptionProductIds,
  parseSubscriptionProductIds,
};
