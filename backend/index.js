require('dotenv').config();

const express = require('express');
const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});


const cors = require('cors');
const connectDB = require('./db/mongo');


/**
 * ---------------------------------------
 * Middleware
 * ---------------------------------------
 */
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'https://unpenciled-unhumored-thora.ngrok-free.dev', 'https://airwall.kaswebtechsolutions.com','http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

app.use('/api/webhooks', require('./routes/webhooks'));
/**
 * ---------------------------------------
 * Routes
 * ---------------------------------------
 */
app.use('/api', require('./routes/auth'));


app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/sync-orders', require('./routes/syncOrders'));
// app.use('/api/airwallex', require('./routes/airwallexTest'));
app.use('/api/selling-plans', require('./routes/airwallexLivePlan'));
app.use('/api/subscription-plans', require('./routes/airwallexTestPlan'));

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

/**
 * GET /api/cart
 * Query params:
 *   - cartId
 *   - token (Storefront API token)
 */
 
//Working Backend: /api/cart endpoint
// app.get("/api/cart", async (req, res) => {
//   const { cartId } = req.query;

//   if (!cartId) {
//     return res.status(400).json({ error: "Missing cartId" });
//   }

//   const STORE_HASH = 'eapn6crf58';
//   const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN; // Your X-Auth-Token from .env

//   console.log('📦 Fetching cart:', cartId);

//   try {
//     //  Use Management API with YOUR server-side token
//     const cartRes = await fetch(
//       `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=redirect_urls,line_items.physical_items.options`,
//       {
//         headers: {
//           'X-Auth-Token': MANAGEMENT_API_TOKEN,
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         }
//       }
//     );

//     if (!cartRes.ok) {
//       const errorText = await cartRes.text();
//       console.error(' Cart fetch failed:', cartRes.status, errorText);
//       return res.status(cartRes.status).json({ 
//         error: 'Cart not found',
//         status: cartRes.status,
//         details: errorText 
//       });
//     }

//     const cartData = await cartRes.json();
    
//     console.log(' Cart found:', {
//       id: cartData.data.id,
//       items: cartData.data.line_items.physical_items.length,
//       total: cartData.data.cart_amount
//     });

//     return res.json({
//       success: true,
//       cart: cartData.data,
//       // cartId: cart.data.id,
//       checkoutUrl: cartData.data.redirect_urls?.checkout_url
//     });

//   } catch (err) {
//     console.error('💥 Server error:', err);
//     return res.status(500).json({ 
//       error: 'Server error',
//       message: err.message 
//     });
//   }
// });

// In your backend server (Node.js/Express)
app.get("/api/cart", async (req, res) => {
  const { cartId } = req.query;

  if (!cartId) {
    return res.status(400).json({ error: "Missing cartId" });
  }

  const STORE_HASH = 'eapn6crf58';
  const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;

  console.log(' Fetching cart:', cartId);

  try {
    // Use Management API with YOUR server-side token
    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}?include=redirect_urls,line_items.physical_items.options,line_items.digital_items,coupons`,
      {
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!cartRes.ok) {
      const errorText = await cartRes.text();
      console.error(' Cart fetch failed:', cartRes.status, errorText);
      // Redirect to React with error
      const reactUrl = new URL('http://localhost:5173/checkout'); // Your React app URL
      reactUrl.searchParams.append('error', 'cart_not_found');
      return res.redirect(reactUrl.toString());
    }

    const cartData = await cartRes.json();
    console.log(cartData, "CartData");
    
    console.log('Cart found:', {
      id: cartData.data.id,
      items: cartData.data.line_items?.physical_items?.length || 0,
      total: cartData.data.cart_amount
    });

    // CRITICAL: Transform the data to match your OrderSummary component's expected format
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

    //  Now redirect to React with the cart data
    const reactUrl = new URL('http://localhost:5173/checkout'); // Your React app URL
    reactUrl.searchParams.append('cartId', cartId);
    reactUrl.searchParams.append('cartData', encodeURIComponent(JSON.stringify(transformedCart)));
    
    console.log('🔗 Redirecting to React app:', reactUrl.toString());
    
    return res.redirect(reactUrl.toString());

  } catch (err) {
    console.error('Server error:', err);
    const reactUrl = new URL('http://localhost:5173/checkout');
    reactUrl.searchParams.append('error', 'server_error');
    return res.redirect(reactUrl.toString());
  }
});


// 1. Create new customer
app.post("/api/customers", async (req, res) => {

  console.log("Create Customer");
  try {
    const { email, firstName, lastName, phone, company } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    // Generate a secure password (email + random suffix)
    // const passwordSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const passwordSuffix = "+32Acd";
    const generatedPassword = `${email}+${passwordSuffix}`;
    
    const customerData = {
      email: email,
      first_name: firstName || '',
      last_name: lastName || '',
      phone: phone || '',
      company: company || '',
      authentication: {
        new_password: generatedPassword
      }
    };
    
    console.log('👤 Creating customer:', { email, firstName, lastName, generatedPassword });
    
    const customerRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify([customerData]) // Note: API expects array
      }
    );
    
    if (!customerRes.ok) {
      const errorText = await customerRes.text();
      console.error('❌ Customer creation failed:', customerRes.status, errorText);
      
      // Check if customer already exists
      if (customerRes.status === 422) {
        // Customer might already exist, try to get existing customer
        return await handleExistingCustomer(email, res);
      }
      
      return res.status(customerRes.status).json({ 
        error: 'Failed to create customer',
        details: errorText 
      });
    }
    
    const customerResult = await customerRes.json();
    const createdCustomer = customerResult.data[0];
    
    console.log(' Customer created:', createdCustomer.id);
    
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
    console.error('💥 Customer creation error:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});

// Helper function to handle existing customers
async function handleExistingCustomer(email, res) {
  try {
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    // Search for existing customer by email
    const searchRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers?email:in=${encodeURIComponent(email)}`,
      {
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Accept': 'application/json'
        }
      }
    );
    
    if (searchRes.ok) {
      const searchResult = await searchRes.json();
      if (searchResult.data && searchResult.data.length > 0) {
        const existingCustomer = searchResult.data[0];
        
        console.log(' Found existing customer:', existingCustomer.id);
        
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

// 2. Get customer by email
app.get("/api/customers/search", async (req, res) => {
  try {
    let { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: "Email is required" 
      });
    }
    
    //  DECODE the email parameter
    email = decodeURIComponent(email);
    console.log('🔍 Searching customer by email (decoded):', email);
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    // Search for customer by email in BigCommerce
    const searchRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers?email:in=${encodeURIComponent(email)}`,
      {
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Always return JSON, even on errors
    if (!searchRes.ok) {
      console.warn('❌ Customer search failed:', searchRes.status);
      return res.status(200).json({ 
        success: true,
        exists: false,
        message: 'Customer not found'
      });
    }
    
    const searchResult = await searchRes.json();
    
    if (searchResult.data && searchResult.data.length > 0) {
      const customer = searchResult.data[0];
      console.log(' Customer found:', customer.id);
      
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
    } else {
      return res.json({
        success: true,
        exists: false,
        message: 'No customer found with this email'
      });
    }
    
  } catch (err) {
    console.error('💥 Customer search error:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
});

// 3. Update cart with customer ID
app.post("/api/cart/assign-customer", async (req, res) => {
  console.log("Assign Customers");
  try {
    const { cartId, customerId } = req.body;
    
    if (!cartId || !customerId) {
      return res.status(400).json({ error: "Cart ID and Customer ID are required" });
    }
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    console.log('🔄 Assigning customer to cart:', { cartId, customerId });
    
    // Update cart with customer ID
    const updateRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}`,
      {
        method: 'PUT',
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          customer_id: parseInt(customerId)
        })
      }
    );
    
    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error('❌ Cart update failed:', updateRes.status, errorText);
      return res.status(updateRes.status).json({ 
        error: 'Failed to assign customer to cart',
        details: errorText 
      });
    }
    
    const updateResult = await updateRes.json();
    
    console.log(' Cart updated with customer ID');
    
    res.json({
      success: true,
      cart: updateResult.data,
      message: 'Customer assigned to cart successfully'
    });
    
  } catch (err) {
    console.error('💥 Cart update error:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
});



// 4. Create or update customer address
// app.post("/api/customer/address", async (req, res) => {
//   console.log("📦 Saving customer address");
//   try {
//     const { customerId, addressData } = req.body;
    
//     if (!customerId || !addressData) {
//       return res.status(400).json({ 
//         success: false,
//         error: "Customer ID and address data are required" 
//       });
//     }
    
//     const STORE_HASH = 'eapn6crf58';
//     const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
//     console.log('🏠 Saving address for customer:', customerId);
//     console.log('📍 Address data:', addressData);
    
//     // First, check if customer has existing addresses
//     const getAddressesRes = await fetch(
//       `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses`,
//       {
//         headers: {
//           'X-Auth-Token': MANAGEMENT_API_TOKEN,
//           'Accept': 'application/json'
//         }
//       }
//     );
    
//     let addressId = null;
//     let method = 'POST';
//     let url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses`;
    
//     if (getAddressesRes.ok) {
//       const existingAddresses = await getAddressesRes.json();
//       console.log('📋 Existing addresses:', existingAddresses.length);
      
//       // Check if there's an existing residential address
//       const residentialAddress = existingAddresses.find(addr => 
//         addr.address_type === 'residential'
//       );
      
//       if (residentialAddress) {
//         // Update existing address
//         addressId = residentialAddress.id;
//         method = 'PUT';
//         url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses/${addressId}`;
//         console.log('🔄 Updating existing address:', addressId);
//       } else {
//         console.log('🆕 Creating new address');
//       }
//     } else {
//       console.log('🆕 No existing addresses found, creating new');
//     }
    
//     // Prepare address data for BigCommerce
//     const bcAddressData = {
//       first_name: addressData.firstName || '',
//       last_name: addressData.lastName || '',
//       street_1: addressData.address || '',
//       street_2: '',
//       city: addressData.city || '',
//       state: addressData.state || addressData.city || '', // Fallback to city if no state
//       zip: addressData.postalCode || '',
//       country: addressData.country || 'France',
//       phone: addressData.phone || '',
//       address_type: 'residential',
//       company: addressData.company || ''
//     };
    
//     console.log('📤 Address data to save:', bcAddressData);
    
//     // Save address to BigCommerce
//     const saveRes = await fetch(url, {
//       method: method,
//       headers: {
//         'X-Auth-Token': MANAGEMENT_API_TOKEN,
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       },
//       body: JSON.stringify(bcAddressData)
//     });
    
//     if (!saveRes.ok) {
//       const errorText = await saveRes.text();
//       console.error('❌ Address save failed:', saveRes.status, errorText);
//       return res.status(400).json({ 
//         success: false,
//         error: 'Failed to save address'
//       });
//     }
    
//     const savedAddress = await saveRes.json();
    
//     console.log('✅ Address saved successfully:', savedAddress.id || 'new address');
    
//     res.json({
//       success: true,
//       addressId: savedAddress.id || addressId,
//       address: savedAddress,
//       message: 'Address saved successfully'
//     });
    
//   } catch (err) {
//     console.error('💥 Address save error:', err);
//     res.status(500).json({ 
//       success: false,
//       error: 'Server error',
//       message: err.message 
//     });
//   }
// });
// 4. Create or update customer address - FIXED VERSION
app.post("/api/customer/address", async (req, res) => {
  console.log("📦 Saving customer address - START");
  try {
    const { customerId, addressData } = req.body;
    
    if (!customerId || !addressData) {
      console.log("❌ Missing customerId or addressData");
      return res.status(400).json({ 
        success: false,
        error: "Customer ID and address data are required" 
      });
    }
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    console.log('🏠 Saving address for customer:', customerId);
    console.log('📍 Address data received:', addressData);
    
    // First, check if customer has existing addresses
    let existingAddresses = [];
    try {
      const getAddressesRes = await fetch(
        `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses`,
        {
          headers: {
            'X-Auth-Token': MANAGEMENT_API_TOKEN,
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('🔍 Get addresses response status:', getAddressesRes.status);
      
      if (getAddressesRes.ok) {
        const responseText = await getAddressesRes.text();
        console.log('📋 Get addresses raw response:', responseText.substring(0, 200));
        
        if (responseText.trim()) {
          existingAddresses = JSON.parse(responseText);
          console.log('✅ Parsed existing addresses:', existingAddresses.length);
        }
      } else {
        const errorText = await getAddressesRes.text();
        console.warn('⚠️ Failed to get existing addresses:', getAddressesRes.status, errorText);
      }
    } catch (addressFetchError) {
      console.warn('⚠️ Error fetching existing addresses:', addressFetchError.message);
    }
    
    let addressId = null;
    let method = 'POST';
    let url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses`;
    
    // Check if there's an existing residential address
    const residentialAddress = existingAddresses.find(addr => 
      addr.address_type === 'residential'
    );
    
    if (residentialAddress) {
      // Update existing address
      addressId = residentialAddress.id;
      method = 'PUT';
      url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}/addresses/${addressId}`;
      console.log('🔄 Updating existing address:', addressId);
    } else {
      console.log('🆕 Creating new address');
    }
    
    // Prepare address data for BigCommerce
    const bcAddressData = {
      first_name: addressData.firstName || '',
      last_name: addressData.lastName || '',
      street_1: addressData.address || '',
      street_2: '',
      city: addressData.city || '',
      state: addressData.state || addressData.city || '', // Fallback to city if no state
      zip: addressData.postalCode || '',
      country: addressData.country || 'France',
      phone: addressData.phone || '',
      address_type: 'residential',
      company: addressData.company || ''
    };
    
    console.log('📤 Address data to save to BigCommerce:', bcAddressData);
    
    // Save address to BigCommerce with better error handling
    let saveRes;
    try {
      console.log('📤 Making request to BigCommerce API:', { method, url });
      saveRes = await fetch(url, {
        method: method,
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bcAddressData)
      });
      
      console.log('📥 BigCommerce response status:', saveRes.status);
      
      // Handle empty or invalid responses
      const responseText = await saveRes.text();
      console.log('📋 BigCommerce raw response:', responseText.substring(0, 500));
      
      if (!saveRes.ok) {
        console.error('❌ BigCommerce API error:', saveRes.status, responseText);
        return res.status(400).json({ 
          success: false,
          error: `Failed to save address: ${saveRes.status}`,
          details: responseText.substring(0, 200)
        });
      }
      
      let savedAddress;
      if (responseText.trim()) {
        savedAddress = JSON.parse(responseText);
        console.log('✅ Address saved successfully:', savedAddress.id || 'new address');
      } else {
        // Handle empty response (some APIs return 200 with no body on success)
        console.log('✅ Address saved (empty response)');
        savedAddress = { id: addressId || 'unknown' };
      }
      
      console.log('📦 Saving customer address - SUCCESS');
      
      return res.json({
        success: true,
        addressId: savedAddress.id || addressId,
        address: savedAddress,
        message: 'Address saved successfully'
      });
      
    } catch (fetchError) {
      console.error('❌ Fetch error during address save:', fetchError.message);
      return res.status(500).json({ 
        success: false,
        error: 'Network error saving address',
        message: fetchError.message
      });
    }
    
  } catch (err) {
    console.error('💥 Address save error:', err.message, err.stack);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
});

// 5. Get shipping zones
app.get("/api/shipping/zones", async (req, res) => {
  console.log("🚚 Fetching shipping zones");
  try {
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    const zonesRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/shipping/zones`,
      {
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!zonesRes.ok) {
      const errorText = await zonesRes.text();
      console.warn('⚠️ Shipping zones fetch failed:', zonesRes.status, errorText);
      return res.json({
        success: true,
        zones: [],
        message: 'No shipping zones configured'
      });
    }
    
    const zones = await zonesRes.json();
    
    console.log('✅ Shipping zones found:', zones.length);
    
    res.json({
      success: true,
      zones: zones,
      count: zones.length
    });
    
  } catch (err) {
    console.error('💥 Shipping zones error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
});

// 6. Get shipping methods for a zone
app.get("/api/shipping/zones/:zoneId/methods", async (req, res) => {
  console.log("🚚 Fetching shipping methods for zone:", req.params.zoneId);
  try {
    const { zoneId } = req.params;
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    const methodsRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/shipping/zones/${zoneId}/methods`,
      {
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!methodsRes.ok) {
      const errorText = await methodsRes.text();
      console.warn('⚠️ Shipping methods fetch failed:', methodsRes.status, errorText);
      return res.json({
        success: true,
        methods: [],
        message: 'No shipping methods found'
      });
    }
    
    const methods = await methodsRes.json();
    
    console.log('✅ Shipping methods found:', methods.length);
    
    res.json({
      success: true,
      methods: methods,
      count: methods.length
    });
    
  } catch (err) {
    console.error('💥 Shipping methods error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
});

// 7. Get shipping quotes (optional - for dynamic pricing)
app.post("/api/shipping/quotes", async (req, res) => {
  console.log("🚚 Getting shipping quotes");
  try {
    const { cartId, customerId, address } = req.body;
    
    if (!cartId) {
      return res.status(400).json({ 
        success: false,
        error: "Cart ID is required" 
      });
    }
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    // Get cart items to calculate shipping
    const cartRes = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/carts/${cartId}`,
      {
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!cartRes.ok) {
      return res.status(400).json({ 
        success: false,
        error: "Cart not found" 
      });
    }
    
    const cartData = await cartRes.json();
    
    // For now, return static shipping options
    // In production, you'd integrate with shipping carrier APIs
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
    console.error('💥 Shipping quotes error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
});

// 8. Create Order
// Create order endpoint

// ---------- Debug helper ----------
const debug = (label, data) => {
  if (data === undefined) {
    console.log(label);
    return;
  }

  try {
    console.log(label, typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2)
    );
  } catch (err) {
    console.log(label, data);
  }
};
// ---------------------------------





app.post("/api/orders/create", async (req, res) => {
  console.log("🛒 Creating order - START");
  try {
    const { 
      customerId, 
      billingAddress, 
      shippingAddress,
      products,
      shippingMethod,
      paymentMethod,
      statusId = 1 // Default to pending status
    } = req.body;
    
    // Validate required fields
    if (!customerId) {
      console.log(" Missing customerId");
      return res.status(400).json({ 
        success: false,
        error: "Customer ID is required" 
      });
    }
    
    if (!billingAddress) {
      console.log(" Missing billingAddress");
      return res.status(400).json({ 
        success: false,
        error: "Billing address is required" 
      });
    }
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log(" Invalid or empty products array");
      return res.status(400).json({ 
        success: false,
        error: "At least one product is required" 
      });
    }
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    console.log('👤 Creating order for customer:', customerId);
    console.log('📦 Products count:', products.length);
    console.log('🏷️ Status ID:', statusId);
    
    // Prepare order data for BigCommerce
    const orderData = {
      customer_id: parseInt(customerId),
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
        // name: product.name,
        // sku: product.sku,
        product_options: product.product_options || product.product_options || []
      }))
    };
    
    // Add shipping address if provided
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
    
    // Add shipping method if provided
    if (shippingMethod) {
      orderData.shipping_cost_inc_tax = shippingMethod.costIncTax || shippingMethod.cost_inc_tax;
      orderData.shipping_cost_ex_tax = shippingMethod.costExTax || shippingMethod.cost_ex_tax;
      orderData.shipping_method = shippingMethod.name || shippingMethod.method;
    }
    
    // Add payment method if provided
    if (paymentMethod) {
      orderData.payment_method = paymentMethod.name || paymentMethod.method;
      
      // If it's a paid payment method, mark as paid
      if (paymentMethod.paid && statusId === 1) {
        orderData.status_id = 10; // Completed status
      }
    }
    
    console.log('📤 Order data to create:', JSON.stringify(orderData, null, 2));
    
    // Create order in BigCommerce
    const url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders`;
    
    console.log('📤 Making request to BigCommerce Orders API');
    const createOrderRes = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Auth-Token': MANAGEMENT_API_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    console.log('📥 BigCommerce Orders response status:', createOrderRes.status);
    
    const responseText = await createOrderRes.text();
    console.log('📋 BigCommerce Orders raw response:', responseText.substring(0, 1000));
    
    if (!createOrderRes.ok) {
      console.error(' BigCommerce API error creating order:', createOrderRes.status, responseText);
      
      // Try to parse error for better message
      let errorMessage = `Failed to create order: ${createOrderRes.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.title || errorData.detail || errorMessage;
      } catch (e) {
        // Keep default error message
      }
      
      return res.status(400).json({ 
        success: false,
        error: errorMessage,
        details: responseText.substring(0, 200)
      });
    }
    
    let createdOrder;
    if (responseText.trim()) {
      createdOrder = JSON.parse(responseText);
      console.log('✅ Order created successfully:', createdOrder.id);
    } else {
      console.error(' Empty response from BigCommerce');
      return res.status(500).json({ 
        success: false,
        error: 'Empty response from BigCommerce API'
      });
    }
    
    // Optionally update inventory levels
    await updateInventory(products, STORE_HASH, MANAGEMENT_API_TOKEN);
    
    // Optionally send confirmation email
    if (billingAddress.email) {
      await sendOrderConfirmationEmail(createdOrder, billingAddress.email);
    }
    
    console.log('🛒 Creating order - SUCCESS');
    
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
    console.error('💥 Order creation error:', err.message, err.stack);
    return res.status(500).json({ 
      success: false,
      error: 'Server error creating order',
      message: err.message 
    });
  }
});

// Helper function to get country ISO2 code
function getCountryCode(countryName) {
  const countryMap = {
    'United States': 'US',
    'France': 'FR',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Germany': 'DE',
    'Australia': 'AU'
    // Add more countries as needed
  };
  
  return countryMap[countryName] || 'FR';
}

// Helper function to update inventory
async function updateInventory(products, storeHash, apiToken) {
  try {
    console.log('📊 Updating inventory levels');
    
    for (const product of products) {
      const productId = product.productId || product.product_id;
      const quantity = product.quantity || 1;
      
      // Get current inventory
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
        
        // Update inventory (reduce by quantity ordered)
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
        
        console.log(`📦 Updated product ${productId} inventory: ${currentLevel} → ${newLevel}`);
      }
    }
  } catch (inventoryError) {
    console.warn('⚠️ Inventory update error:', inventoryError.message);
    // Don't fail the order if inventory update fails
  }
}

// Helper function to send order confirmation email
async function sendOrderConfirmationEmail(order, customerEmail) {
  try {
    console.log('📧 Sending order confirmation email to:', customerEmail);
    
    // You would implement your email sending logic here
    // This could be using Nodemailer, SendGrid, etc.
    
    // Example placeholder
    /*
    const emailResponse = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders/${order.id}/emails`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Token': MANAGEMENT_API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Order Confirmation #${order.id}`,
          // ... other email details
        })
      }
    );
    */
    
    console.log('✅ Order confirmation email sent');
  } catch (emailError) {
    console.warn('⚠️ Email sending error:', emailError.message);
    // Don't fail the order if email fails
  }
}

// Get order by ID endpoint
app.get("/api/orders/:orderId", async (req, res) => {
  console.log("📄 Getting order details");
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        error: "Order ID is required" 
      });
    }
    
    const STORE_HASH = 'eapn6crf58';
    const MANAGEMENT_API_TOKEN = process.env.BC_API_TOKEN;
    
    const url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders/${orderId}`;
    
    const orderRes = await fetch(url, {
      headers: {
        'X-Auth-Token': MANAGEMENT_API_TOKEN,
        'Accept': 'application/json'
      }
    });
    
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

/**
 * ---------------------------------------
 * Start Server
 * ---------------------------------------
 */
connectDB()
    .then(() => {
        console.log('MongoDB connected');
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error', err);
        process.exit(1);
    });
 