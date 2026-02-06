//Working
// import { useState, useEffect } from "react";
// import ClientStep from "./ClientStep";
// import ShippingStep from "./ShippingStep";
// import PaymentStep from "./PaymentStep";
// import OrderSummary from "./OrderSummary";

// export default function CheckoutLayout({ cart, onCustomerCreate }) {
//   /**
//    * activeStep controls which section is expanded.
//    * Order: client → delivery → payment
//    */
//   const [activeStep, setActiveStep] = useState("client");

//   /**
//    * Static state holders for now
//    * (will be hydrated later via BigCommerce SDK)
//    */
//   const [clientData, setClientData] = useState({});
//   const [deliveryData, setDeliveryData] = useState({});
//   const [paymentData, setPaymentData] = useState({});

//   // Timer logic from working version
//   const DISCOUNT_DURATION = 10 * 60; // 10 minutes in seconds
//   const [timeLeft, setTimeLeft] = useState(DISCOUNT_DURATION);
  
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
//   const seconds = String(timeLeft % 60).padStart(2, "0");

//   const validUntilDate = new Date();
//   validUntilDate.setDate(validUntilDate.getDate() + 1);
//   const formattedDate = validUntilDate.toLocaleDateString("en-GB");

//   // Delivery completion check from working version
//   const isDeliveryComplete = !!(
//     deliveryData?.address &&
//     deliveryData?.city &&
//     deliveryData?.method
//   );

//   const hasReachedDelivery = activeStep === "delivery" || activeStep === "payment";

//   // Enhanced client continue handler with customer creation
//   const handleClientContinue = async (clientFormData) => {
//     // First, store the client data locally
//     setClientData(clientFormData);
    
//     // Then, if we have the customer creation handler and cart ID,
//     // try to create/assign the customer in the background
//     if (onCustomerCreate && cart?.id) {
//       try {
//         // This runs asynchronously - don't wait for it to complete
//         onCustomerCreate(clientFormData, cart.id)
//           .then(customerId => {
//             if (customerId) {
//               console.log('Customer processed successfully:', customerId);
//               // Optionally update clientData with customer ID if needed
//               setClientData(prev => ({
//                 ...prev,
//                 customerId: customerId
//               }));
//             }
//           })
//           .catch(err => {
//             console.warn('Customer creation completed with warnings:', err);
//             // Don't block checkout flow even if customer creation has issues
//           });
//       } catch (err) {
//         console.error('Error initiating customer creation:', err);
//         // Continue checkout anyway - customer creation is optional
//       }
//     }
    
//     // Move to next step immediately (don't wait for customer creation)
//     setActiveStep("delivery");
//   };

//   return (
//     <div className="min-h-screen bg-[#fff]">
//       {/* ================= HEADER ================= */}
//       <header className="bg-white border-b">
//         <div className="max-w-[1200px] mx-auto py-4 text-center px-[20px]">
//           <img
//             src="https://images.unsplash.com/photo-1607082349566-1870e33f43d1?w=200"
//             alt="Flashventes"
//             className="h-7 mx-auto object-contain"
//           />
//         </div>
//       </header>

//       {/* ================= PROMO BANNER (using old styles but new logic) ================= */}
//       <div className="max-w-[1200px] mx-auto px-[20px] mb-6">
//         <div className="nr-date-time-wr text-white bg-[#3b4450] rounded-[5px] py-[8px] px-[10px] text-center">
//           <p className="nr-date-time-txt-fir text-[14px] md:text-[16px]">
//             Félicitations, votre promo a été appliquée.
//           </p>
//           <p className="nr-date-time-txt-sec text-[13px] md:text-[16px]">
//             Il vous reste <span className="text-[#f4d54c] font-[600]">{minutes}:{seconds}</span> pour en bénéficier. 
//             Valable ce <b>{formattedDate}</b>
//           </p>
//         </div>
//       </div>

//       {/* ================= MAIN CONTENT ================= */}
//       <main className="max-w-[1200px] mx-auto gap-8 py-8 px-[20px] grid grid-cols-1 sm:grid-cols-12 md:grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-12">
//         {/* ================= LEFT COLUMN ================= */}
//         <section className="col-span-7">
//           <div className="bg-white rounded pt-[24px] space-y-6">
//             {/* CLIENT STEP with updated onContinue handler */}
//             <ClientStep
//               active={activeStep === "client"}
//               data={clientData}
//               onContinue={handleClientContinue}  // Updated to use new handler
//               onEdit={() => setActiveStep("client")}
//               isDisabled={activeStep !== "client"}
//               cart={cart}
//             />

//             {/* DELIVERY STEP with cart prop and hasReached logic */}
//             <ShippingStep
//               active={activeStep === "delivery"}
//               hasReached={hasReachedDelivery}
//               data={deliveryData}
//               isComplete={isDeliveryComplete}
//               onContinue={(data) => {
//                 setDeliveryData(data);
//                 setActiveStep("payment");
//               }}
//               onEdit={() => setActiveStep("delivery")}
//               isDisabled={activeStep !== "delivery"}
//               cart={cart}
//             />

//             {/* PAYMENT STEP with cart prop */}
//             <PaymentStep 
//               active={activeStep === "payment"} 
//               data={paymentData}
//               onContinue={(data) => setPaymentData(data)}
//               isDisabled={activeStep !== "payment"}
//               cart={cart}
//             />

//             {/* ORDER BUTTON & SECURITY SECTION */}
//             {activeStep === "payment" && (
//               <>
//                 <button
//                   type="button"
//                   className="w-full cursor-pointer bg-[#2fb34a] hover:bg-[#28a745] transition text-white font-semibold py-3 rounded"
//                   onClick={async () => {
//                     // Here you would integrate with order creation API
//                     console.log('Placing order with:', {
//                       cartId: cart?.id,
//                       clientData,
//                       deliveryData,
//                       paymentData
//                     });
                    
//                     // TODO: Implement order creation logic
//                     // await createOrderInBigCommerce({
//                     //   cartId: cart.id,
//                     //   customerData: clientData,
//                     //   shippingData: deliveryData,
//                     //   paymentData: paymentData
//                     // });
//                   }}
//                 >
//                   PLACE AN ORDER
//                 </button>

//                 <div className="text-xs text-gray-600 text-center mt-3">
//                   🔒 Secure 256-bit SSL encryption
//                 </div>

//                 <div className="flex justify-center gap-6 mt-4">
//                   <img
//                     src="https://upload.wikimedia.org/wikipedia/commons/3/3a/McAfee_logo.png"
//                     alt="McAfee"
//                     className="h-6"
//                   />
//                   <img
//                     src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Norton_logo.svg"
//                     alt="Norton"
//                     className="h-6"
//                   />
//                   <img
//                     src="https://upload.wikimedia.org/wikipedia/commons/5/5b/TRUSTe_logo.png"
//                     alt="TRUSTe"
//                     className="h-6"
//                   />
//                 </div>
//               </>
//             )}
//           </div>
//         </section>

//         {/* ================= RIGHT COLUMN ================= */}
//         <aside className="col-span-5">
//           {/* Pass cart prop to OrderSummary */}
//           <OrderSummary deliveryPrice={deliveryData?.price ?? 0} cart={cart} />
//         </aside>
//       </main>

//       {/* ================= FOOTER ================= */}
//       <footer className="text-xs text-gray-500 text-center py-6 space-y-2">
//         <div className="space-x-3">
//           <a href="#" className="hover:underline">
//             General Terms and Conditions
//           </a>
//           <a href="#" className="hover:underline">
//             Shipping Policies and Rates
//           </a>
//           <a href="#" className="hover:underline">
//             Privacy Policy
//           </a>
//         </div>
//         <div>
//           <a href="#" className="hover:underline">
//             Exchanges and Returns
//           </a>
//         </div>
//       </footer>
//     </div>
//   );
// }



import { useState, useEffect } from "react";
import ClientStep from "./ClientStep";
import ShippingStep from "./ShippingStep";
import PaymentStep from "./PaymentStep";
import OrderSummary from "./OrderSummary";

export default function CheckoutLayout({ 
  cart, 
  onCustomerCreate,
  onShippingAddress,
  onFetchShippingOptions 
}) {
  /**
   * activeStep controls which section is expanded.
   * Order: client → delivery → payment
   */
  const [activeStep, setActiveStep] = useState("client");

  /**
   * Static state holders for now
   * (will be hydrated later via BigCommerce SDK)
   */
  const [clientData, setClientData] = useState({});
  const [deliveryData, setDeliveryData] = useState({});
  const [paymentData, setPaymentData] = useState({});
  const [customerId, setCustomerId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Timer logic from working version
  const DISCOUNT_DURATION = 10 * 60; // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(DISCOUNT_DURATION);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 1);
  const formattedDate = validUntilDate.toLocaleDateString("en-GB");

  // Delivery completion check from working version
  const isDeliveryComplete = !!(
    deliveryData?.address &&
    deliveryData?.city &&
    deliveryData?.method
  );

  const hasReachedDelivery = activeStep === "delivery" || activeStep === "payment";

  // Enhanced client continue handler with customer creation
  const handleClientContinue = async (clientFormData) => {
    // First, store the client data locally
    setClientData(clientFormData);
    
    // Then, if we have the customer creation handler and cart ID,
    // try to create/assign the customer in the background
    if (onCustomerCreate && cart?.id) {
      try {
        console.log('👤 Starting customer creation...');
        const result = await onCustomerCreate(clientFormData, cart.id);
        
        if (result && result.customerId) {
          console.log('✅ Customer created/retrieved:', result.customerId);
          // Store customer ID for shipping step
          setCustomerId(result.customerId);
          // Update clientData with customer information
          setClientData(prev => ({
            ...prev,
            customerId: result.customerId,
            ...result.customerData
          }));
        } else {
          console.warn('⚠️ Customer creation returned no customer ID');
        }
      } catch (err) {
        console.error('❌ Error during customer creation:', err);
        // Continue checkout anyway - customer creation is optional
      }
    }
    
    // Move to next step immediately (don't wait for customer creation)
    setActiveStep("delivery");
  };

  // Shipping continue handler with address saving
  const handleDeliveryContinue = async (deliveryFormData) => {
    // Store delivery data locally
    setDeliveryData(deliveryFormData);
    
    // Save address to BigCommerce if we have the handler and customer ID
    if (onShippingAddress && customerId) {
      setIsSavingAddress(true);
      try {
        console.log('🏠 Saving shipping address...');
        const addressResult = await onShippingAddress(deliveryFormData, customerId, clientData);
        
        if (addressResult) {
          console.log('✅ Address saved:', addressResult.addressId);
          // Update delivery data with address ID
          setDeliveryData(prev => ({
            ...prev,
            addressId: addressResult.addressId,
            ...addressResult.address
          }));
        } else {
          console.warn('⚠️ Address save failed or returned no result');
        }
      } catch (err) {
        console.error('❌ Error saving address:', err);
        // Continue checkout even if address save fails
      } finally {
        setIsSavingAddress(false);
      }
    } else {
      console.warn('⚠️ No customer ID or shipping address handler available');
      if (!customerId) {
        console.warn('⚠️ Customer ID is null. Customer creation may have failed.');
      }
    }
    
    // Move to payment step
    setActiveStep("payment");
  };


  // Order creation function
  const handlePlaceOrder = async () => {
    if (!cart?.id) {
      alert("No cart found. Please refresh the page.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      console.log('🛒 Starting order creation...');
      // Prepare the order data
      const orderData = {
        customerId: customerId || 0, // Use 0 if no customer ID (guest checkout)
        statusId: 1, // Pending status
        billingAddress: {
          first_name: clientData.firstName || deliveryData.firstName || '',
          last_name: clientData.lastName || deliveryData.lastName || '',
          street_1: deliveryData.address || '',
          city: deliveryData.city || '',
          state: deliveryData.state || deliveryData.city || '',
          zip: deliveryData.postalCode || '',
          country: deliveryData.country || 'France',
          country_iso2: getCountryCode(deliveryData.country || 'France'),
          email: clientData.email || '',
          phone: clientData.phone || deliveryData.phone || ''
        },
        products: cart?.lineItems?.physicalItems?.map(item => ({
          product_id: item.product_id,  
          quantity: item.quantity || 1,
          // product_options: item.options?.map(opt => ({
          //   id: opt.id || parseInt(opt.productOptionId) || 0,
          //   value: opt.value || opt.valueText || ''
          // })) || []
          product_options: item.options?.map(opt => ({
            id: opt.nameId,        
            value: opt.valueId
          })) || []
        })) || []
      };
      // Add shipping address if available
      if (deliveryData.address) {
        orderData.shipping_addresses = [{
          first_name: deliveryData.firstName || clientData.firstName || '',
          last_name: deliveryData.lastName || clientData.lastName || '',
          street_1: deliveryData.address || '',
          city: deliveryData.city || '',
          state: deliveryData.state || deliveryData.city || '',
          zip: deliveryData.postalCode || '',
          country: deliveryData.country || 'France',
          country_iso2: getCountryCode(deliveryData.country || 'France'),
          email: clientData.email || '',
          phone: clientData.phone || deliveryData.phone || ''
        }];
      }
      // console.log('📤 Order data:', orderData);
      console.log('📤 SENDING to /api/orders/create:', {
        url: 'https://unpenciled-unhumored-thora.ngrok-free.dev/api/orders/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData, null, 2)
      });

      // Call the order creation endpoint
      const response = await fetch(
        'https://unpenciled-unhumored-thora.ngrok-free.dev/api/orders/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(orderData)
        }
      );
      const responseText = await response.text();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        if (result.success) {
          alert(`✅ Order #${result.orderId} created successfully!`);
          console.log('✅ Order created:', result);
          // Optionally redirect or clear cart
          // window.location.href = `/order-confirmation?orderId=${result.orderId}`;
        } else {
          throw new Error(result.error || 'Failed to create order');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 100)}`);
      }
      } catch (error) {
      console.error('❌ Order creation error:', error);
      alert(`Failed to create order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Helper function to get country code
  const getCountryCode = (countryName) => {
    const countryMap = {
      'United States': 'US',
      'France': 'FR',
      'Canada': 'CA',
      'United Kingdom': 'GB',
      'Germany': 'DE',
      'Australia': 'AU'
    };
    return countryMap[countryName] || 'FR';
  };


  // Optional: Fetch shipping options when delivery step becomes active
  useEffect(() => {
    if (activeStep === "delivery" && onFetchShippingOptions) {
      // You could fetch shipping options based on address when user starts filling it
      console.log('🚚 Delivery step active, ready to fetch shipping options');
    }
  }, [activeStep, onFetchShippingOptions]);

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* ================= HEADER ================= */}
      <header className="bg-white border-b">
        <div className="max-w-[1200px] mx-auto py-4 text-center px-[20px]">
          <img
            src="https://images.unsplash.com/photo-1607082349566-1870e33f43d1?w=200"
            alt="Flashventes"
            className="h-7 mx-auto object-contain"
          />
        </div>
      </header>

      {/* ================= PROMO BANNER (using old styles but new logic) ================= */}
      <div className="max-w-[1200px] mx-auto px-[20px] mb-6">
        <div className="nr-date-time-wr text-white bg-[#3b4450] rounded-[5px] py-[8px] px-[10px] text-center">
          <p className="nr-date-time-txt-fir text-[14px] md:text-[16px]">
            Félicitations, votre promo a été appliquée.
          </p>
          <p className="nr-date-time-txt-sec text-[13px] md:text-[16px]">
            Il vous reste <span className="text-[#f4d54c] font-[600]">{minutes}:{seconds}</span> pour en bénéficier. 
            Valable ce <b>{formattedDate}</b>
          </p>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-[1200px] mx-auto gap-8 py-8 px-[20px] grid grid-cols-1 sm:grid-cols-12 md:grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-12">
        {/* ================= LEFT COLUMN ================= */}
        <section className="col-span-7">
          <div className="bg-white rounded pt-[24px] space-y-6">
            {/* CLIENT STEP with updated onContinue handler */}
            <ClientStep
              active={activeStep === "client"}
              data={clientData}
              onContinue={handleClientContinue}
              onEdit={() => setActiveStep("client")}
              isDisabled={activeStep !== "client"}
              cart={cart}
            />

            {/* DELIVERY STEP with enhanced props */}
            <ShippingStep
              active={activeStep === "delivery"}
              hasReached={hasReachedDelivery}
              data={deliveryData}
              isComplete={isDeliveryComplete}
              onContinue={handleDeliveryContinue}
              onEdit={() => setActiveStep("delivery")}
              isDisabled={activeStep !== "delivery" || isSavingAddress}
              cart={cart}
              customerData={clientData}
              isLoading={isSavingAddress}
            />

            {/* PAYMENT STEP with cart prop */}
            <PaymentStep 
              active={activeStep === "payment"} 
              data={paymentData}
              onContinue={(data) => setPaymentData(data)}
              isDisabled={activeStep !== "payment"}
              cart={cart}
            />

            {/* ORDER BUTTON & SECURITY SECTION */}
            {activeStep === "payment" && (
              <>

              <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className={`w-full cursor-pointer ${
                    isPlacingOrder 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#2fb34a] hover:bg-[#28a745]'
                  } transition text-white font-semibold py-3 rounded flex items-center justify-center gap-2`}
                >

                  {isPlacingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      PROCESSING ORDER...
                    </>
                  ) : (
                    'PLACE AN ORDER'
                  )}

                </button>
                {/* <button
                  type="button"
                  className="w-full cursor-pointer bg-[#2fb34a] hover:bg-[#28a745] transition text-white font-semibold py-3 rounded"
                  onClick={async () => {
                    // Here you would integrate with order creation API
                    console.log('🎯 Placing order with data:', {
                      cartId: cart?.id,
                      customerId: customerId,
                      clientData,
                      deliveryData,
                      paymentData,
                      customerEmail: clientData.email,
                      shippingAddress: {
                        firstName: deliveryData.firstName || clientData.firstName,
                        lastName: deliveryData.lastName || clientData.lastName,
                        address: deliveryData.address,
                        city: deliveryData.city,
                        postalCode: deliveryData.postalCode,
                        country: deliveryData.country,
                        phone: deliveryData.phone || clientData.phone
                      },
                      shippingMethod: deliveryData.method,
                      shippingPrice: deliveryData.price
                    });
                    
                    // TODO: Implement order creation logic
                    // You'll need to create an order in BigCommerce using:
                    // 1. Cart ID
                    // 2. Customer ID
                    // 3. Shipping address
                    // 4. Payment method
                    // 5. Shipping method
                    
                    // Example endpoint to create:
                    // await createOrderInBigCommerce({
                    //   cartId: cart.id,
                    //   customerId: customerId,
                    //   billingAddress: { ... },
                    //   shippingAddress: { ... },
                    //   shippingMethodId: deliveryData.method,
                    //   paymentMethod: paymentData.method
                    // });
                  }}
                >
                  PLACE AN ORDER
                </button> */}

                <div className="text-xs text-gray-600 text-center mt-3">
                  🔒 Secure 256-bit SSL encryption
                </div>

                <div className="flex justify-center gap-6 mt-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3a/McAfee_logo.png"
                    alt="McAfee"
                    className="h-6"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Norton_logo.svg"
                    alt="Norton"
                    className="h-6"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/5b/TRUSTe_logo.png"
                    alt="TRUSTe"
                    className="h-6"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* ================= RIGHT COLUMN ================= */}
        <aside className="col-span-5">
          {/* Pass cart prop to OrderSummary */}
          <OrderSummary 
            deliveryPrice={deliveryData?.price ?? 0} 
            cart={cart} 
          />
        </aside>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="text-xs text-gray-500 text-center py-6 space-y-2">
        <div className="space-x-3">
          <a href="#" className="hover:underline">
            General Terms and Conditions
          </a>
          <a href="#" className="hover:underline">
            Shipping Policies and Rates
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
        </div>
        <div>
          <a href="#" className="hover:underline">
            Exchanges and Returns
          </a>
        </div>
      </footer>
    </div>
  );
}