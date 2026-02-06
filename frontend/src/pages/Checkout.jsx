// import { useEffect, useState } from "react";
// import { useSearchParams } from 'react-router-dom';
// import CheckoutLayout from "../components/Checkout/CheckoutLayout";

// export default function Checkout() {
//   const [cart, setCart] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchParams] = useSearchParams();

//   // Improved customer creation function
//   const handleCustomerCreation = async (customerData, cartId) => {
//     try {
//       console.log('👤 Processing customer creation:', { 
//         email: customerData.email, 
//         cartId,
//         firstName: customerData.firstName,
//         lastName: customerData.lastName
//       });
      
//       let customerId = null;
      
      
//       // 1. Check if customer exists
//       try {
//         console.log('🔍 Checking if customer exists...');
//         const searchResponse = await fetch(
//           `https://unpenciled-unhumored-thora.ngrok-free.dev/api/customers/search?email=${customerData.email}`,
//           {
//             method: 'GET',
//             headers: {
//               'Accept': 'application/json',
//               'ngrok-skip-browser-warning': 'true'
//             },

//           }
//         );
//         console.log(searchResponse);
//         console.log('redirected:', searchResponse.redirected);
// console.log('final url:', searchResponse.url);
        
//         console.log('📊 Search response status:', searchResponse.status);
        
//         if (searchResponse.ok) {
//           const responseText = await searchResponse.text();
//           console.log(responseText);
//           console.log('📋 Raw search response:', responseText.substring(0, 200));
          
//           try {
//             const searchResult = JSON.parse(responseText);
//             console.log('✅ Parsed search result:', searchResult);
            
//             if (searchResult.exists) {
//               // Use existing customer
//               customerId = searchResult.customer.id;
//               console.log('✅ Using existing customer:', customerId);
//             } else {
//               // Create new customer
//               console.log('🆕 Creating new customer...');
//               const createResponse = await fetch(
//                 'https://unpenciled-unhumored-thora.ngrok-free.dev/api/customers',
//                 {
//                   method: 'POST',
//                   headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                   },
//                   mode: 'cors',
//                   body: JSON.stringify({
//                     email: customerData.email,
//                     firstName: customerData.firstName || '',
//                     lastName: customerData.lastName || '',
//                     phone: customerData.phone || ''
//                   })
//                 }
//               );
              
//               console.log('📊 Create response status:', createResponse.status);
              
//               if (createResponse.ok) {
//                 const createResult = await createResponse.json();
//                 console.log(' Create result:', createResult);
                
//                 if (createResult.success) {
//                   customerId = createResult.customer.id;
//                   console.log(' Created new customer:', customerId);
//                 } else {
//                   console.warn('⚠️ Customer creation failed:', createResult.error);
//                 }
//               } else {
//                 const errorText = await createResponse.text();
//                 console.warn('⚠️ Customer creation API error:', createResponse.status, errorText);
//               }
//             }
//           } catch (parseError) {
//             console.error('Failed to parse JSON:', parseError.message);
//             console.log('Response that failed to parse:', responseText.substring(0, 500));
//           }
//         } else {
//           const errorText = await searchResponse.text();
//           console.warn('⚠️ Customer search failed:', searchResponse.status, errorText.substring(0, 200));
//         }
//       } catch (networkError) {
//         console.error('Network error checking customer:', networkError.message);
//       }
      
//       // 2. If we have a customer ID, assign it to cart
//       if (customerId && cartId) {
//         try {
//           console.log('🔄 Assigning customer to cart...');
//           const assignResponse = await fetch(
//             'https://unpenciled-unhumored-thora.ngrok-free.dev/api/cart/assign-customer',
//             {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//               },
//               mode: 'cors',
//               body: JSON.stringify({
//                 cartId: cartId,
//                 customerId: customerId
//               })
//             }
//           );
          
//           console.log('📊 Assign response status:', assignResponse.status);
          
//           if (assignResponse.ok) {
//             console.log('Customer assigned to cart');
//           } else {
//             const errorText = await assignResponse.text();
//             console.warn('Failed to assign customer to cart:', assignResponse.status, errorText.substring(0, 200));
//           }
//         } catch (assignErr) {
//           console.warn('Cart assignment error:', assignErr.message);
//         }
//       } else {
//         console.log(' No customer ID to assign to cart');
//       }
      
//       return customerId;
      
//     } catch (err) {
//       console.error('Customer handling error:', err.message, err.stack);
//       return null;
//     }
//   };

//   // Also update ClientStep.jsx to skip API check temporarily
//   // Add this to ClientStep.jsx as a temporary fix:
//   /*
//   const checkEmailExists = async (email) => {
//     console.log('🔍 Checking email (temporary skip):', email);
//     // TEMPORARY: Always return valid for now
//     return { valid: true };
//   };
//   */

//   useEffect(() => {
//     const initializeCart = async () => {
//       try {
//         const cartId = searchParams.get('cartId');
//         const cartDataParam = searchParams.get('cartData');
//         const errorParam = searchParams.get('error');

//         console.log('📥 URL Parameters:', { cartId, cartDataParam, errorParam });

//         if (errorParam) {
//           setError(`Checkout error: ${errorParam}`);
//           setLoading(false);
//           return;
//         }

//         if (cartDataParam) {
//           try {
//             const decodedCartData = JSON.parse(decodeURIComponent(cartDataParam));
//             console.log('📦 Decoded cart data:', decodedCartData);
            
//             const normalizedCart = {
//               ...decodedCartData,
//               lineItems: decodedCartData.lineItems || {
//                 physicalItems: [],
//                 digitalItems: []
//               },
//               cartAmount: decodedCartData.cartAmount || 0,
//               currency: decodedCartData.currency || { code: 'EUR' },
//               customerId: decodedCartData.customerId || 0,
//               customerEmail: decodedCartData.customerEmail || ''
//             };
            
//             setCart(normalizedCart);
//             setLoading(false);
            
//           } catch (parseError) {
//             console.error('❌ Failed to parse cart data:', parseError);
//             setError('Invalid cart data format');
//             setLoading(false);
//           }
//         } else if (cartId) {
//           await fetchCartById(cartId);
//         } else {
//           setError('Invalid checkout link');
//           setLoading(false);
//         }
//       } catch (err) {
//         console.error('❌ Initialization error:', err);
//         setError('Failed to load checkout');
//         setLoading(false);
//       }
//     };

//     initializeCart();
//   }, [searchParams]);

//   const fetchCartById = async (cartId) => {
//     try {
//       console.log('🔍 Fetching cart from backend:', cartId);
//       const response = await fetch(
//         `https://unpenciled-unhumored-thora.ngrok-free.dev/api/cart-data?cartId=${cartId}`,
//         {
//           headers: {
//             'Accept': 'application/json'
//           },
//           mode: 'cors'
//         }
//       );
      
//       if (!response.ok) {
//         throw new Error(`Failed to fetch cart: ${response.status}`);
//       }
      
//       const data = await response.json();
//       console.log('📦 Cart data:', data);
      
//       const transformedCart = {
//         id: data.id || cartId,
//         lineItems: {
//           physicalItems: (data.line_items?.physical_items || []).map(item => ({
//             id: item.id,
//             name: item.name,
//             quantity: item.quantity,
//             extendedSalePrice: item.extended_sale_price,
//             imageUrl: item.image_url || '/placeholder.png',
//             options: item.options || []
//           })),
//           digitalItems: data.line_items?.digital_items || []
//         },
//         cartAmount: data.cart_amount || 0,
//         currency: data.currency || { code: 'EUR' },
//         discountAmount: data.discount_amount || 0,
//         taxAmount: data.tax_amount || 0,
//         grandTotal: data.cart_amount || 0,
//         customerId: data.customer_id || 0,
//         customerEmail: data.email || ''
//       };
      
//       setCart(transformedCart);
//       setLoading(false);
//     } catch (err) {
//       console.error('❌ Cart fetch error:', err);
//       setError('Failed to load cart');
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading your cart...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg text-center">
//           <h2 className="text-xl font-semibold text-red-800 mb-2">Checkout Error</h2>
//           <p className="text-red-600 mb-4">{error}</p>
//           <a 
//             href="https://your-bigcommerce-store.com/cart" 
//             className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//           >
//             Return to Cart
//           </a>
//         </div>
//       </div>
//     );
//   }

//   return <CheckoutLayout cart={cart} onCustomerCreate={handleCustomerCreation} />;
// }


import { useEffect, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import CheckoutLayout from "../components/Checkout/CheckoutLayout";

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  // Enhanced customer creation function
  const handleCustomerCreation = async (customerData, cartId) => {
    try {
      console.log('👤 Processing customer creation:', { 
        email: customerData.email, 
        cartId,
        firstName: customerData.firstName,
        lastName: customerData.lastName
      });
      
      let customerId = null;
      let createdCustomerData = null;
      
      // 1. Check if customer exists
      try {
        console.log('🔍 Checking if customer exists...');
        const searchResponse = await fetch(
          `https://unpenciled-unhumored-thora.ngrok-free.dev/api/customers/search?email=${customerData.email}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          }
        );
        
        console.log('📊 Search response status:', searchResponse.status);
        
        if (searchResponse.ok) {
          const responseText = await searchResponse.text();
          console.log('📋 Raw search response:', responseText.substring(0, 200));
          
          try {
            const searchResult = JSON.parse(responseText);
            console.log('✅ Parsed search result:', searchResult);
            
            if (searchResult.exists) {
              // Use existing customer
              customerId = searchResult.customer.id;
              createdCustomerData = searchResult.customer;
              console.log('✅ Using existing customer:', customerId);
            } else {
              // Create new customer
              console.log('🆕 Creating new customer...');
              const createResponse = await fetch(
                'https://unpenciled-unhumored-thora.ngrok-free.dev/api/customers',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({
                    email: customerData.email,
                    firstName: customerData.firstName || '',
                    lastName: customerData.lastName || '',
                    phone: customerData.phone || ''
                  })
                }
              );
              
              console.log('📊 Create response status:', createResponse.status);
              
              if (createResponse.ok) {
                const createResult = await createResponse.json();
                console.log('✅ Create result:', createResult);
                
                if (createResult.success) {
                  customerId = createResult.customer.id;
                  createdCustomerData = createResult.customer;
                  console.log('✅ Created new customer:', customerId);
                } else {
                  console.warn('⚠️ Customer creation failed:', createResult.error);
                }
              } else {
                const errorText = await createResponse.text();
                console.warn('⚠️ Customer creation API error:', createResponse.status, errorText);
              }
            }
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError.message);
            console.log('📋 Response that failed to parse:', responseText.substring(0, 500));
          }
        } else {
          const errorText = await searchResponse.text();
          console.warn('⚠️ Customer search failed:', searchResponse.status, errorText.substring(0, 200));
        }
      } catch (networkError) {
        console.error('❌ Network error checking customer:', networkError.message);
      }
      
      // 2. If we have a customer ID, assign it to cart
      if (customerId && cartId) {
        try {
          console.log('🔄 Assigning customer to cart...');
          const assignResponse = await fetch(
            'https://unpenciled-unhumored-thora.ngrok-free.dev/api/cart/assign-customer',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                cartId: cartId,
                customerId: customerId
              })
            }
          );
          
          console.log('📊 Assign response status:', assignResponse.status);
          
          if (assignResponse.ok) {
            console.log('✅ Customer assigned to cart');
          } else {
            const errorText = await assignResponse.text();
            console.warn('⚠️ Failed to assign customer to cart:', assignResponse.status, errorText.substring(0, 200));
          }
        } catch (assignErr) {
          console.warn('⚠️ Cart assignment error:', assignErr.message);
        }
      } else {
        console.log('ℹ️ No customer ID to assign to cart');
      }
      
      // Return customer data for use in shipping step
      return {
        customerId: customerId,
        customerData: createdCustomerData || customerData
      };
      
    } catch (err) {
      console.error('❌ Customer handling error:', err.message);
      return null;
    }
  };

  // Shipping address handler function
  const handleShippingAddress = async (addressData, customerId, clientData) => {
    try {
      console.log('🏠 Saving shipping address for customer:', customerId);
      console.log('📍 Address data:', addressData);
      
      if (!customerId) {
        console.warn('⚠️ No customer ID, skipping address save');
        return null;
      }
      
      const response = await fetch(
        'https://unpenciled-unhumored-thora.ngrok-free.dev/api/customer/address',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            customerId: customerId,
            addressData: {
              firstName: addressData.firstName || clientData?.firstName || '',
              lastName: addressData.lastName || clientData?.lastName || '',
              address: addressData.address || '',
              city: addressData.city || '',
              postalCode: addressData.postalCode || '',
              country: addressData.country || 'France',
              phone: addressData.phone || clientData?.phone || '',
              state: addressData.state || addressData.city || ''
            }
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Address saved:', result.addressId);
        return result;
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Address save failed:', response.status, errorText);
        return null;
      }
    } catch (err) {
      console.error('❌ Address save error:', err);
      return null;
    }
  };

  // Shipping method handler (optional - for dynamic shipping)
  const fetchShippingOptions = async (addressData) => {
    try {
      console.log('🚚 Fetching shipping options for address:', addressData);
      
      // Example: Fetch shipping zones
      const zonesResponse = await fetch(
        'https://unpenciled-unhumored-thora.ngrok-free.dev/api/shipping/zones',
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (zonesResponse.ok) {
        const zonesData = await zonesResponse.json();
        console.log('✅ Shipping zones:', zonesData.zones);
        return zonesData;
      }
      
      return null;
    } catch (err) {
      console.warn('⚠️ Shipping options fetch error:', err);
      return null;
    }
  };

  useEffect(() => {
    const initializeCart = async () => {
      try {
        const cartId = searchParams.get('cartId');
        const cartDataParam = searchParams.get('cartData');
        const errorParam = searchParams.get('error');

        console.log('📥 URL Parameters:', { cartId, cartDataParam, errorParam });

        if (errorParam) {
          setError(`Checkout error: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (cartDataParam) {
          try {
            const decodedCartData = JSON.parse(decodeURIComponent(cartDataParam));
            console.log('📦 Decoded cart data:', decodedCartData);
            
            const normalizedCart = {
              ...decodedCartData,
              lineItems: decodedCartData.lineItems || {
                physicalItems: [],
                digitalItems: []
              },
              cartAmount: decodedCartData.cartAmount || 0,
              currency: decodedCartData.currency || { code: 'EUR' },
              customerId: decodedCartData.customerId || 0,
              customerEmail: decodedCartData.customerEmail || ''
            };
            
            setCart(normalizedCart);
            setLoading(false);
            
          } catch (parseError) {
            console.error('❌ Failed to parse cart data:', parseError);
            setError('Invalid cart data format');
            setLoading(false);
          }
        } else if (cartId) {
          await fetchCartById(cartId);
        } else {
          setError('Invalid checkout link');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError('Failed to load checkout');
        setLoading(false);
      }
    };

    initializeCart();
  }, [searchParams]);

  const fetchCartById = async (cartId) => {
    try {
      console.log('🔍 Fetching cart from backend:', cartId);
      const response = await fetch(
        `https://unpenciled-unhumored-thora.ngrok-free.dev/api/cart-data?cartId=${cartId}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Cart data:', data);
      
      const transformedCart = {
        id: data.id || cartId,
        lineItems: {
          physicalItems: (data.line_items?.physical_items || []).map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            extendedSalePrice: item.extended_sale_price,
            imageUrl: item.image_url || '/placeholder.png',
            options: item.options || []
          })),
          digitalItems: data.line_items?.digital_items || []
        },
        cartAmount: data.cart_amount || 0,
        currency: data.currency || { code: 'EUR' },
        discountAmount: data.discount_amount || 0,
        taxAmount: data.tax_amount || 0,
        grandTotal: data.cart_amount || 0,
        customerId: data.customer_id || 0,
        customerEmail: data.email || ''
      };
      
      setCart(transformedCart);
      setLoading(false);
    } catch (err) {
      console.error('❌ Cart fetch error:', err);
      setError('Failed to load cart');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Checkout Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <a 
            href="https://your-bigcommerce-store.com/cart" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Cart
          </a>
        </div>
      </div>
    );
  }

  console.log("Cart Data: ",cart);

  return (
    <CheckoutLayout 
      cart={cart} 
      onCustomerCreate={handleCustomerCreation}
      onShippingAddress={handleShippingAddress}
      onFetchShippingOptions={fetchShippingOptions}
    />
  );
}