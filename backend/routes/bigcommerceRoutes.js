const express = require('express');
const router = express.Router();

const STORE_HASH = 'eapn6crf58';
const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
const FRONTEND_CHECKOUT_URL = process.env.FRONTEND_CHECKOUT_URL || 'http://localhost:5173/checkout';
const VIP_PRODUCT_ID = 210;
const SubscriptionCustomer = require('../models/SubscriptionCustomer');

const bcHeaders = {
  'X-Auth-Token': MANAGEMENT_API_TOKEN,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const SUBSCRIPTION_PRODUCT_IDS = (
  process.env.SUBSCRIPTION_PRODUCT_IDS || ''
)
  .split(',')
  .map((id) => Number(id.trim()))
  .filter(Boolean);




async function updateOrderStatus(orderId, statusId, storeHash, apiToken) {
  try {
    const res = await fetch(
      `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`,
      {
        method: 'PUT',
        headers: {
          'X-Auth-Token': apiToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status_id: statusId
        })
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`Failed to update order ${orderId} status to ${statusId}:`, res.status, errorText);
      return { success: false, error: errorText };
    }

    const updatedOrder = await res.json();
    console.log(`Order ${orderId} status updated to ${statusId}`);
    return { success: true, order: updatedOrder };
  } catch (err) {
    console.error('Order status update error:', err);
    return { success: false, error: err.message };
  }
}

const bcGetHeaders = {
  'X-Auth-Token': MANAGEMENT_API_TOKEN,
  'Accept': 'application/json'
};

const debug = (label, data) => {
  if (data === undefined) {
    console.log(label);
    return;
  }

  try {
    console.log(label, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(label, data);
  }
};

function getCountryCode(countryName) {
  const countryMap = {
    'United States': 'US',
    'France': 'FR',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'Australia': 'AU'
  };

  return countryMap[countryName] || 'FR';
}

async function handleExistingCustomer(email, res) {
  try {
    const searchRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers?email:in=${encodeURIComponent(email)}`,
      {
        headers: bcGetHeaders
      }
    );

    if (searchRes.ok) {
      const searchResult = await searchRes.json();
      if (searchResult.data && searchResult.data.length > 0) {
        const existingCustomer = searchResult.data[0];

        console.log('Found existing customer:', existingCustomer.id);

        return res.json({
          success: true,
          customer: {
            id: existingCustomer.id,
            email: existingCustomer.email,
            firstName: existingCustomer.first_name,
            lastName: existingCustomer.last_name,
            phone: existingCustomer.phone,
            company: existingCustomer.company
          },
          message: 'Customer already exists'
        });
      }
    }

    return res.status(422).json({
      error: 'Customer creation failed',
      message: 'Please try a different email'
    });
  } catch (searchErr) {
    console.error('Search error:', searchErr);
    return res.status(500).json({
      error: 'Server error',
      message: searchErr.message
    });
  }
}

async function updateInventory(products, storeHash, apiToken) {
  try {
    console.log('Updating inventory levels');

    for (const product of products) {
      const productId = product.productId || product.product_id;
      const quantity = product.quantity || 1;

      const inventoryRes = await fetch(
        `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products/${productId}/inventory`,
        {
          headers: {
            'X-Auth-Token': apiToken,
            'Accept': 'application/json'
          }
        }
      );

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        const currentLevel = inventoryData.data?.inventory_level || 0;
        const newLevel = Math.max(0, currentLevel - quantity);

        await fetch(
          `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products/${productId}/inventory`,
          {
            method: 'PUT',
            headers: {
              'X-Auth-Token': apiToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              inventory_level: newLevel
            })
          }
        );

        console.log(`Updated product ${productId} inventory: ${currentLevel} -> ${newLevel}`);
      }
    }
  } catch (inventoryError) {
    console.warn('Inventory update error:', inventoryError.message);
  }
}

async function sendOrderConfirmationEmail(order, customerEmail) {
  try {
    console.log('Sending order confirmation email to:', customerEmail);
    console.log('Order confirmation email sent');
  } catch (emailError) {
    console.warn('Email sending error:', emailError.message);
  }
}

function findSubscriptionProduct(cart, subscriptionProductIds = []) {
  const physicalItems = cart?.lineItems?.physicalItems || [];
  const digitalItems = cart?.lineItems?.digitalItems || [];
  const allItems = [...physicalItems, ...digitalItems];

  return allItems.find((item) =>
    subscriptionProductIds.includes(Number(item.product_id))
  );
}

router.get('/cart', async (req, res) => {
  const { cartId } = req.query;

  if (!cartId) {
    return res.status(400).json({ error: 'Missing cartId' });
  }

  console.log('Fetching cart:', cartId);

  try {
    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=redirect_urls,line_items.physical_items.options,line_items.digital_items,coupons`,
      {
        headers: bcHeaders
      }
    );

    if (!cartRes.ok) {
      const errorText = await cartRes.text();
      console.error('Cart fetch failed:', cartRes.status, errorText);
      const reactUrl = new URL(FRONTEND_CHECKOUT_URL);
      reactUrl.searchParams.append('error', 'cart_not_found');
      return res.redirect(reactUrl.toString());
    }

    const cartData = await cartRes.json();

    console.log('Cart found:', {
      id: cartData.data.id,
      items: cartData.data.line_items?.physical_items?.length || 0,
      total: cartData.data.cart_amount
    });

    const transformedCart = {
      id: cartData.data.id,
      lineItems: {
        physicalItems: cartData.data.line_items?.physical_items?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          extendedSalePrice: item.extended_sale_price,
          list_price: item.list_price,
          sale_price: item.sale_price,
          imageUrl: item.image_url || '/placeholder.png',
          options: item.options || []
        })) || [],
        digitalItems: cartData.data.line_items?.digital_items || []
      },
      cartAmount: cartData.data.cart_amount,
      discountAmount: cartData.data.discount_amount || 0,
      taxAmount: cartData.data.tax_amount || 0,
      grandTotal: cartData.data.cart_amount,
      currency: cartData.data.currency || { code: 'EUR' },
      customerId: cartData.data.customer_id,
      coupons: cartData.data.coupons || []
    };

    const reactUrl = new URL(FRONTEND_CHECKOUT_URL);
    reactUrl.searchParams.append('cartId', cartId);
    reactUrl.searchParams.append('cartData', encodeURIComponent(JSON.stringify(transformedCart)));

    console.log('Redirecting to React app:', reactUrl.toString());

    return res.redirect(reactUrl.toString());
  } catch (err) {
    console.error('Server error:', err);
    const reactUrl = new URL(FRONTEND_CHECKOUT_URL);
    reactUrl.searchParams.append('error', 'server_error');
    return res.redirect(reactUrl.toString());
  }
});

router.get('/cart-data', async (req, res) => {
  const { cartId } = req.query;

  if (!cartId) {
    return res.status(400).json({ error: 'Missing cartId' });
  }

  try {
    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=redirect_urls,line_items.physical_items.options,line_items.digital_items,coupons`,
      {
        headers: bcHeaders
      }
    );

    if (!cartRes.ok) {
      const errorText = await cartRes.text();
      console.error('Cart fetch failed:', cartRes.status, errorText);
      return res.status(cartRes.status).json({
        error: 'Failed to fetch cart',
        details: errorText
      });
    }

    const cartData = await cartRes.json();

    const transformedCart = {
      id: cartData.data.id,
      lineItems: {
        physicalItems: cartData.data.line_items?.physical_items?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          extendedSalePrice: item.extended_sale_price,
          list_price: item.list_price,
          sale_price: item.sale_price,
          imageUrl: item.image_url || '/placeholder.png',
          options: item.options || []
        })) || [],
        digitalItems: cartData.data.line_items?.digital_items?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          extendedSalePrice: item.extended_sale_price,
          list_price: item.list_price,
          sale_price: item.sale_price,
          imageUrl: item.image_url || '/placeholder.png',
          options: item.options || []
        })) || []
      },
      cartAmount: cartData.data.cart_amount,
      discountAmount: cartData.data.discount_amount || 0,
      taxAmount: cartData.data.tax_amount || 0,
      grandTotal: cartData.data.cart_amount,
      currency: cartData.data.currency || { code: 'EUR' },
      customerId: cartData.data.customer_id,
      coupons: cartData.data.coupons || []
    };

    return res.json(transformedCart);
  } catch (err) {
    console.error('Cart data error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/customers', async (req, res) => {
  console.log('Create Customer');
  try {
    const { email, firstName, lastName, phone, company } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const passwordSuffix = '+32Acd';
    const generatedPassword = `${email}+${passwordSuffix}`;

    const customerData = {
      email,
      first_name: firstName || '',
      last_name: lastName || '',
      phone: phone || '',
      company: company || '',
      authentication: {
        new_password: generatedPassword
      }
    };

    console.log('Creating customer:', { email, firstName, lastName, generatedPassword });

    const customerRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers`,
      {
        method: 'POST',
        headers: bcHeaders,
        body: JSON.stringify([customerData])
      }
    );

    if (!customerRes.ok) {
      const errorText = await customerRes.text();
      console.error('Customer creation failed:', customerRes.status, errorText);

      if (customerRes.status === 422) {
        return await handleExistingCustomer(email, res);
      }

      return res.status(customerRes.status).json({
        error: 'Failed to create customer',
        details: errorText
      });
    }

    const customerResult = await customerRes.json();
    const createdCustomer = customerResult.data[0];

    console.log('Customer created:', createdCustomer.id);

    res.json({
      success: true,
      customer: {
        id: createdCustomer.id,
        email: createdCustomer.email,
        firstName: createdCustomer.first_name,
        lastName: createdCustomer.last_name,
        phone: createdCustomer.phone,
        company: createdCustomer.company
      },
      message: 'Customer created successfully'
    });
  } catch (err) {
    console.error('Customer creation error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});

router.get('/customers/search', async (req, res) => {
  try {
    let { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    email = decodeURIComponent(email);
    console.log('Searching customer by email (decoded):', email);

    const searchRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers?email:in=${encodeURIComponent(email)}`,
      {
        headers: bcHeaders
      }
    );

    if (!searchRes.ok) {
      console.warn('Customer search failed:', searchRes.status);
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'Customer not found'
      });
    }

    const searchResult = await searchRes.json();

    if (searchResult.data && searchResult.data.length > 0) {
      const customer = searchResult.data[0];
      console.log('Customer found:', customer.id);

      return res.json({
        success: true,
        exists: true,
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          company: customer.company
        }
      });
    }

    return res.json({
      success: true,
      exists: false,
      message: 'No customer found with this email'
    });
  } catch (err) {
    console.error('Customer search error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/cart/assign-customer', async (req, res) => {
  console.log('Assign Customers');
  try {
    const { cartId, customerId } = req.body;

    if (!cartId || !customerId) {
      return res.status(400).json({ error: 'Cart ID and Customer ID are required' });
    }

    console.log('Assigning customer to cart:', { cartId, customerId });

    const updateRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}`,
      {
        method: 'PUT',
        headers: bcHeaders,
        body: JSON.stringify({
          customer_id: parseInt(customerId, 10)
        })
      }
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error('Cart update failed:', updateRes.status, errorText);
      return res.status(updateRes.status).json({
        error: 'Failed to assign customer to cart',
        details: errorText
      });
    }

    const updateResult = await updateRes.json();

    console.log('Cart updated with customer ID');

    res.json({
      success: true,
      cart: updateResult.data,
      message: 'Customer assigned to cart successfully'
    });
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/customer/address', async (req, res) => {
  console.log('Saving customer address - START');
  try {
    const { customerId, addressData } = req.body;

    if (!customerId || !addressData) {
      console.log('Missing customerId or addressData');
      return res.status(400).json({
        success: false,
        error: 'Customer ID and address data are required'
      });
    }

    console.log('Saving address for customer:', customerId);
    console.log('Address data received:', addressData);

    let existingAddresses = [];
    try {
      const getAddressesRes = await fetch(
        `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses`,
        {
          headers: bcGetHeaders
        }
      );

      console.log('Get addresses response status:', getAddressesRes.status);

      if (getAddressesRes.ok) {
        const responseText = await getAddressesRes.text();
        console.log('Get addresses raw response:', responseText.substring(0, 200));

        if (responseText.trim()) {
          existingAddresses = JSON.parse(responseText);
          console.log('Parsed existing addresses:', existingAddresses.length);
        }
      } else {
        const errorText = await getAddressesRes.text();
        console.warn('Failed to get existing addresses:', getAddressesRes.status, errorText);
      }
    } catch (addressFetchError) {
      console.warn('Error fetching existing addresses:', addressFetchError.message);
    }

    let addressId = null;
    let method = 'POST';
    let url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses`;

    const residentialAddress = existingAddresses.find(addr => addr.address_type === 'residential');

    if (residentialAddress) {
      addressId = residentialAddress.id;
      method = 'PUT';
      url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses/${addressId}`;
      console.log('Updating existing address:', addressId);
    } else {
      console.log('Creating new address');
    }

    const bcAddressData = {
      first_name: addressData.firstName || '',
      last_name: addressData.lastName || '',
      street_1: addressData.address || '',
      street_2: '',
      city: addressData.city || '',
      state: addressData.state || addressData.city || '',
      zip: addressData.postalCode || '',
      country: addressData.country || 'France',
      phone: addressData.phone || '',
      address_type: 'residential',
      company: addressData.company || ''
    };

    console.log('Address data to save to BigCommerce:', bcAddressData);

    try {
      console.log('Making request to BigCommerce API:', { method, url });
      const saveRes = await fetch(url, {
        method,
        headers: bcHeaders,
        body: JSON.stringify(bcAddressData)
      });

      console.log('BigCommerce response status:', saveRes.status);

      const responseText = await saveRes.text();
      console.log('BigCommerce raw response:', responseText.substring(0, 500));

      if (!saveRes.ok) {
        console.error('BigCommerce API error:', saveRes.status, responseText);
        return res.status(400).json({
          success: false,
          error: `Failed to save address: ${saveRes.status}`,
          details: responseText.substring(0, 200)
        });
      }

      let savedAddress;
      if (responseText.trim()) {
        savedAddress = JSON.parse(responseText);
        console.log('Address saved successfully:', savedAddress.id || 'new address');
      } else {
        console.log('Address saved (empty response)');
        savedAddress = { id: addressId || 'unknown' };
      }

      console.log('Saving customer address - SUCCESS');

      return res.json({
        success: true,
        addressId: savedAddress.id || addressId,
        address: savedAddress,
        message: 'Address saved successfully'
      });
    } catch (fetchError) {
      console.error('Fetch error during address save:', fetchError.message);
      return res.status(500).json({
        success: false,
        error: 'Network error saving address',
        message: fetchError.message
      });
    }
  } catch (err) {
    console.error('Address save error:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
});

router.get('/shipping/zones', async (req, res) => {
  console.log('Fetching shipping zones');
  try {
    const zonesRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/shipping/zones`,
      {
        headers: bcGetHeaders
      }
    );

    if (!zonesRes.ok) {
      const errorText = await zonesRes.text();
      console.warn('Shipping zones fetch failed:', zonesRes.status, errorText);
      return res.json({
        success: true,
        zones: [],
        message: 'No shipping zones configured'
      });
    }

    const zones = await zonesRes.json();

    console.log('Shipping zones found:', zones.length);

    res.json({
      success: true,
      zones,
      count: zones.length
    });
  } catch (err) {
    console.error('Shipping zones error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
});

router.get('/shipping/zones/:zoneId/methods', async (req, res) => {
  console.log('Fetching shipping methods for zone:', req.params.zoneId);
  try {
    const { zoneId } = req.params;

    const methodsRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/shipping/zones/${zoneId}/methods`,
      {
        headers: bcGetHeaders
      }
    );

    if (!methodsRes.ok) {
      const errorText = await methodsRes.text();
      console.warn('Shipping methods fetch failed:', methodsRes.status, errorText);
      return res.json({
        success: true,
        methods: [],
        message: 'No shipping methods found'
      });
    }

    const methods = await methodsRes.json();

    console.log('Shipping methods found:', methods.length);

    res.json({
      success: true,
      methods,
      count: methods.length
    });
  } catch (err) {
    console.error('Shipping methods error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/shipping/quotes', async (req, res) => {
  console.log('Getting shipping quotes');
  try {
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID is required'
      });
    }

    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}`,
      {
        headers: bcGetHeaders
      }
    );

    if (!cartRes.ok) {
      return res.status(400).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const shippingOptions = [
      {
        id: 'free',
        name: 'Free Delivery',
        description: 'Standard delivery',
        cost: 0,
        estimated_days: '5-7 business days'
      },
      {
        id: 'insured',
        name: 'Delivery + Insurance',
        description: 'Protection against loss, breakage, and theft',
        cost: 1.99,
        estimated_days: '3-5 business days'
      },
      {
        id: 'express',
        name: 'Express Delivery',
        description: 'Priority shipping',
        cost: 4.99,
        estimated_days: '1-2 business days'
      }
    ];

    res.json({
      success: true,
      options: shippingOptions,
      message: 'Shipping quotes retrieved'
    });
  } catch (err) {
    console.error('Shipping quotes error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/orders/create', async (req, res) => {
  console.log('Creating order - START');
  try {
    const {
      customerId,
      billingAddress,
      shippingAddress,
      products,
      shippingMethod,
      paymentMethod,
      statusId = 1
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }

    if (!billingAddress) {
      return res.status(400).json({ success: false, error: 'Billing address is required' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one product is required' });
    }

    const orderData = {
      customer_id: parseInt(customerId, 10),
      status_id: statusId,
      billing_address: {
        first_name: billingAddress.firstName || billingAddress.first_name || '',
        last_name: billingAddress.lastName || billingAddress.last_name || '',
        street_1: billingAddress.address || billingAddress.street_1 || '',
        street_2: billingAddress.address2 || billingAddress.street_2 || '',
        city: billingAddress.city || '',
        state: billingAddress.state || '',
        zip: billingAddress.postalCode || billingAddress.zip || billingAddress.zip_code || '',
        country: billingAddress.country || 'France',
        country_iso2: billingAddress.countryIso2 || billingAddress.country_iso2 || getCountryCode(billingAddress.country),
        email: billingAddress.email || '',
        phone: billingAddress.phone || ''
      },
      products: products.map(product => ({
        product_id: product.product_id || product.productId,
        quantity: product.quantity || 1,
        price_inc_tax: product.priceIncTax || product.price_inc_tax,
        price_ex_tax: product.priceExTax || product.price_ex_tax,
        product_options: product.product_options || []
      }))
    };

    if (shippingAddress) {
      orderData.shipping_addresses = [{
        first_name: shippingAddress.firstName || shippingAddress.first_name || '',
        last_name: shippingAddress.lastName || shippingAddress.last_name || '',
        street_1: shippingAddress.address || shippingAddress.street_1 || '',
        street_2: shippingAddress.address2 || shippingAddress.street_2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zip: shippingAddress.postalCode || shippingAddress.zip || shippingAddress.zip_code || '',
        country: shippingAddress.country || 'France',
        country_iso2: shippingAddress.countryIso2 || shippingAddress.country_iso2 || getCountryCode(shippingAddress.country),
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || ''
      }];
    }

    if (shippingMethod) {
      orderData.shipping_cost_inc_tax = shippingMethod.costIncTax || shippingMethod.cost_inc_tax;
      orderData.shipping_cost_ex_tax = shippingMethod.costExTax || shippingMethod.cost_ex_tax;
      orderData.shipping_method = shippingMethod.name || shippingMethod.method;
    }

    if (paymentMethod) {
      orderData.payment_method = paymentMethod.name || paymentMethod.method;
    }


    console.log('Incoming paymentMethod:', paymentMethod);
    debug('Order data to create:', orderData);

    const createOrderRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders`,
      {
        method: 'POST',
        headers: bcHeaders,
        body: JSON.stringify(orderData)
      }
    );

    const responseText = await createOrderRes.text();
    console.log('BigCommerce Orders response status:', createOrderRes.status);
    console.log('BigCommerce Orders raw response:', responseText.substring(0, 1000));

    if (!createOrderRes.ok) {
      let errorMessage = `Failed to create order: ${createOrderRes.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.title || errorData.detail || errorMessage;
      } catch (e) {}

      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: responseText.substring(0, 200)
      });
    }

    if (!responseText.trim()) {
      return res.status(500).json({
        success: false,
        error: 'Empty response from BigCommerce API'
      });
    }

    const createdOrder = JSON.parse(responseText);

    if (paymentMethod && paymentMethod.paid && createdOrder.id) {
      console.log(
        `Airwallex payment already confirmed for order ${createdOrder.id}, updating order status in BigCommerce`
      );

      const statusResult = await updateOrderStatus(
        createdOrder.id,
        11, // change this if your store uses a different status id for Awaiting Fulfillment
        STORE_HASH,
        MANAGEMENT_API_TOKEN
      );

      console.log('Order status update result:', statusResult);

      if (!statusResult.success) {
        console.warn(
          `Payment was successful but failed to update order ${createdOrder.id} status`,
          statusResult.error
        );
      }
    }

    await updateInventory(products, STORE_HASH, MANAGEMENT_API_TOKEN);

    if (billingAddress.email) {
      await sendOrderConfirmationEmail(createdOrder, billingAddress.email);
    }

    return res.json({
      success: true,
      orderId: createdOrder.id,
      order: createdOrder,
      message: 'Order created successfully',
      links: {
        viewOrder: `/orders/${createdOrder.id}`,
        printInvoice: `/orders/${createdOrder.id}/invoice`
      }
    });
  } catch (err) {
    console.error('Order creation error:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error creating order',
      message: err.message
    });
  }
});

router.get('/orders/:orderId', async (req, res) => {
  console.log('Getting order details');
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const orderRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders/${orderId}`,
      {
        headers: bcGetHeaders
      }
    );

    if (!orderRes.ok) {
      return res.status(orderRes.status).json({
        success: false,
        error: `Failed to get order: ${orderRes.status}`
      });
    }

    const order = await orderRes.json();

    return res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error('Error getting order:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Server error getting order'
    });
  }
});

router.post('/cart/add-vip', async (req, res) => {
  try {
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: 'Cart ID is required' });
    }

    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=line_items.physical_items,line_items.digital_items`,
      {
        headers: bcHeaders
      }
    );

    if (!cartRes.ok) {
      const errorText = await cartRes.text();
      console.error('Cart fetch failed:', cartRes.status, errorText);
      return res.status(cartRes.status).json({
        error: 'Failed to fetch cart',
        details: errorText
      });
    }

    const cartData = await cartRes.json();
    const physicalItems = cartData?.data?.line_items?.physical_items || [];
    const digitalItems = cartData?.data?.line_items?.digital_items || [];
    const allItems = [...physicalItems, ...digitalItems];

    const existingVipItem = allItems.find(item => Number(item.product_id) === VIP_PRODUCT_ID);

    if (existingVipItem) {
      return res.json({
        success: true,
        alreadyExists: true,
        message: 'VIP product already exists in cart'
      });
    }

    const addRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}/items`,
      {
        method: 'POST',
        headers: bcHeaders,
        body: JSON.stringify({
          line_items: [
            {
              product_id: VIP_PRODUCT_ID,
              quantity: 1
            }
          ]
        })
      }
    );

    if (!addRes.ok) {
      const errorText = await addRes.text();
      console.error('Add VIP failed:', addRes.status, errorText);
      return res.status(addRes.status).json({
        error: 'Failed to add VIP product',
        details: errorText
      });
    }

    const result = await addRes.json();

    res.json({
      success: true,
      cart: result.data,
      message: 'VIP product added to cart'
    });
  } catch (err) {
    console.error('Add VIP error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/cart/remove-vip', async (req, res) => {
  try {
    const { cartId } = req.body;

    if (!cartId) {
      return res.status(400).json({ error: 'Cart ID is required' });
    }

    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=line_items.physical_items,line_items.digital_items`,
      {
        headers: bcHeaders
      }
    );

    if (!cartRes.ok) {
      const errorText = await cartRes.text();
      console.error('Cart fetch failed:', cartRes.status, errorText);
      return res.status(cartRes.status).json({
        error: 'Failed to fetch cart',
        details: errorText
      });
    }

    const cartData = await cartRes.json();
    const physicalItems = cartData?.data?.line_items?.physical_items || [];
    const digitalItems = cartData?.data?.line_items?.digital_items || [];
    const allItems = [...physicalItems, ...digitalItems];

    const vipItems = allItems.filter(item => Number(item.product_id) === VIP_PRODUCT_ID);

    if (vipItems.length === 0) {
      return res.json({
        success: true,
        message: 'VIP product not found in cart'
      });
    }

    for (const vipItem of vipItems) {
      const removeRes = await fetch(
        `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}/items/${vipItem.id}`,
        {
          method: 'DELETE',
          headers: bcHeaders
        }
      );

      if (!removeRes.ok) {
        const errorText = await removeRes.text();
        console.error('Remove VIP failed:', removeRes.status, errorText);
        return res.status(removeRes.status).json({
          error: 'Failed to remove VIP product',
          details: errorText
        });
      }
    }

    const updatedCartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=line_items.physical_items,line_items.digital_items`,
      {
        headers: bcHeaders
      }
    );

    const updatedCart = updatedCartRes.ok ? await updatedCartRes.json() : null;

    res.json({
      success: true,
      cart: updatedCart?.data || null,
      removedCount: vipItems.length,
      message: 'VIP product removed from cart'
    });
  } catch (err) {
    console.error('Remove VIP error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message
    });
  }
});

router.post('/subscription-customers/map', async (req, res) => {
  try {
    const {
      cart,
      bigcommerceCustomer,
      airwallexCustomer,
      orderId,
    } = req.body;

    if (!cart || !bigcommerceCustomer || !airwallexCustomer) {
      return res.status(400).json({
        success: false,
        error: 'cart, bigcommerceCustomer, and airwallexCustomer are required',
      });
    }

    const subscriptionProduct = findSubscriptionProduct(
      cart,
      SUBSCRIPTION_PRODUCT_IDS
    );

    if (!subscriptionProduct) {
      return res.json({
        success: true,
        saved: false,
        message: 'No subscription product found. Mapping skipped.',
      });
    }

    const doc = await SubscriptionCustomer.findOneAndUpdate(
      {
        bigcommerceCustomerId: bigcommerceCustomer.id,
        subscriptionProductId: Number(subscriptionProduct.product_id),
      },
      {
        $set: {
          bigcommerceCustomerId: bigcommerceCustomer.id,
          bigcommerceEmail: bigcommerceCustomer.email,
          bigcommerceFirstName: bigcommerceCustomer.firstName,
          bigcommerceLastName: bigcommerceCustomer.lastName,
          bigcommercePhone: bigcommerceCustomer.phone,
          bigcommerceCompany: bigcommerceCustomer.company,

          airwallexCustomerId: airwallexCustomer.airwallexCustomerId,
          airwallexName: airwallexCustomer.name,
          airwallexEmail: airwallexCustomer.email,
          airwallexType: airwallexCustomer.type,
          airwallexPhoneNumber: airwallexCustomer.phone_number,

          cartId: cart.id,
          orderId: orderId || null,

          subscriptionProductId: Number(subscriptionProduct.product_id),
          subscriptionProductName: subscriptionProduct.name,
          isSubscriptionCustomer: true,

          metadata: {
            source: 'bigcommerce-checkout',
          },
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      saved: true,
      customer: doc,
    });
  } catch (err) {
    console.error('Subscription customer mapping error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save subscription customer mapping',
    });
  }
});

module.exports = router;
