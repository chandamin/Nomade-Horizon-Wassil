import { useState, useEffect } from "react";
import ClientStep from "./ClientStep";
import ShippingStep from "./ShippingStep";
import PaymentStep from "./PaymentStep";
import OrderSummary from "./OrderSummary";
import ThankYouStep from "./ThankYouStep";
import { useNavigate } from "react-router-dom";


export default function CheckoutLayout({ 
  cart, 
  onCustomerCreate,
  onShippingAddress,
  onFetchShippingOptions,
  onAddVipToCart,
  onRemoveVipFromCart,
  onFetchLatestCart,
  onCreateAirwallexCustomer,
  onMapSubscriptionCustomer,
  onProvisionSubscription,
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
  const [bigcommerceCustomer, setBigcommerceCustomer] = useState(null);
  const [airwallexCustomer, setAirwallexCustomer] = useState(null);
  const navigate = useNavigate();
  const [orderComplete, setOrderComplete] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const VIP_PRODUCT_ID = 210; // replace
  const [isVipLoading, setIsVipLoading] = useState(false);


  // const vipSelected = !!cart?.lineItems?.physicalItems?.some(
  //   (item) => item.product_id === VIP_PRODUCT_ID
  // );
  const vipSelected = !![
    ...(cart?.lineItems?.physicalItems || []),
    ...(cart?.lineItems?.digitalItems || []),
  ].some((item) => Number(item.product_id) === VIP_PRODUCT_ID);

  // Timer logic from working version
  const DISCOUNT_DURATION = 10 * 60; // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(DISCOUNT_DURATION);


  useEffect(() => {
    const storedPayment = sessionStorage.getItem("airwallex_payment_result");
    if (!storedPayment) return;

    try {
      const parsed = JSON.parse(storedPayment);
      if (parsed?.status === "SUCCEEDED") {
        setPaymentData((prev) => ({
          ...prev,
          status: "SUCCEEDED",
          paymentIntentId: parsed.paymentIntentId,
        }));
      }
    } catch (err) {
      console.warn("Failed to parse stored Airwallex payment result", err);
    }
  }, []);
  
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

  const handleVipToggle = async (checked) => {
    if (!cart?.id) return;

    setIsVipLoading(true);
    try {
      if (checked) {
        await onAddVipToCart?.(cart.id);
      } else {
        await onRemoveVipFromCart?.(cart.id);
      }
    } catch (err) {
      console.error('VIP toggle failed:', err);
      alert('Failed to update VIP CLUB selection');
    } finally {
      setIsVipLoading(false);
    }
  };

  // Delivery completion check from working version
  const isDeliveryComplete = !!(
    deliveryData?.address &&
    deliveryData?.city &&
    deliveryData?.method
  );

  const hasReachedDelivery = activeStep === "delivery" || activeStep === "payment";


  const handleClientContinue = async (clientFormData) => {
    // :white_check_mark: Step 1: Normalize and save the FRESH form data
    const newClientData = {
      firstName: clientFormData.firstName?.trim() || "",
      lastName: clientFormData.lastName?.trim() || "",
      email: clientFormData.email?.trim()?.toLowerCase() || "",
      phone: clientFormData.phone?.trim() || "",
      company: clientFormData.company?.trim() || ""
    };

    console.log(":floppy_disk: Saving FRESH form data:", newClientData);
    setClientData(newClientData);
    
    // :white_check_mark: Step 2: Create/fetch customer in background (optional)
    if (onCustomerCreate && cart?.id) {
      try {
        console.log(':bust_in_silhouette: Checking customer in BigCommerce for email:', newClientData.email);
        const result = await onCustomerCreate(clientFormData, cart.id);
        
        if (result && result.customerId) {
          console.log(':white_check_mark: Customer found/created. ID:', result.customerId);
          
          // :key: CRITICAL FIX: Only merge SAFE fields from API
          // DO NOT overwrite firstName/lastName/email from API!
          setClientData(prev => ({
            ...prev,                    // Keep ALL fresh form data
            customerId: result.customerId,  // :white_check_mark: Add these from API
            id: result.customerId,
            // :warning: ONLY add these if they don't exist in form data:
            ...(prev.phone || !result.customerData?.phone ? {} : { phone: result.customerData.phone }),
            ...(prev.company || !result.customerData?.company ? {} : { company: result.customerData.company }),
            // :x: NEVER do: ...result.customerData (it overwrites name/email!)
          }));
          
          setCustomerId(result.customerId);
          setBigcommerceCustomer(result.customerData || null);
        }
      } catch (err) {
        console.error(':x: Customer API error (continuing anyway):', err);
        // Continue checkout even if customer API fails
      }
    }
    
    // :white_check_mark: Step 3: Move to next step
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
          console.log('Address saved:', addressResult.addressId);
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
  const handlePlaceOrder = async (paymentResultArg = null) => {
    if (!cart?.id) {
      alert("No cart found. Please refresh the page.");
      return;
    }

    // console.log('🎯 handlePlaceOrder called', {
    //   timestamp: new Date().toISOString(),
    //   cartId: cart?.id,
    //   paymentIntentId: paymentData?.paymentIntentId,
    //   isPlacingOrder,
    // });
    
    if (isPlacingOrder) {
      console.log("🚫 Blocked duplicate call");
      return;
    }

    setIsPlacingOrder(true);

   
    let latestCart = cart;

    try {
      if (onFetchLatestCart && cart?.id) {
        latestCart = await onFetchLatestCart(cart.id);
        console.log('🛒 Latest cart before order:', latestCart);
      }
    } catch (cartErr) {
      console.warn('⚠️ Failed to fetch latest cart before order:', cartErr.message);
    }

    let awCustomer = airwallexCustomer;

    const subscriptionProduct = [
      ...(latestCart?.lineItems?.physicalItems || []),
      ...(latestCart?.lineItems?.digitalItems || []),
    ].find((item) => Number(item.product_id) === VIP_PRODUCT_ID);

    if (subscriptionProduct && !bigcommerceCustomer?.id) {
      setIsPlacingOrder(false);
      alert("Customer details are missing. Please go back to the first step and try again.");
      return;
    }

    if (subscriptionProduct) {
      try {
        console.log('🔁 Subscription product found in final cart. Starting mapping flow...');

    

        if (!awCustomer) {
          awCustomer = await onCreateAirwallexCustomer?.({
            ...clientData,
            ...bigcommerceCustomer,
          });

          if (awCustomer) {
            setAirwallexCustomer(awCustomer);
          }
        } 
        if (awCustomer && bigcommerceCustomer) {
          const mappingResult = await onMapSubscriptionCustomer?.({
            cart: latestCart,
            bigcommerceCustomer,
            airwallexCustomer: awCustomer,
          });

          console.log(' Subscription customer mapped:', mappingResult);
        } else {
          console.warn('⚠️ Missing Airwallex customer or BigCommerce customer, skipping mapping');
        }
      } catch (mappingErr) {
        console.warn('⚠️ Subscription mapping failed before order creation:', mappingErr.message);
      }
    } else {
      console.log('ℹ️ No subscription product in final cart. Skipping Mongo mapping.');
    }

    const finalPaymentData = paymentResultArg || paymentData || {};

    console.log("💳 paymentData from state:", paymentData);
    console.log("💳 paymentResultArg:", paymentResultArg);
    console.log("💳 finalPaymentData used for order:", finalPaymentData);

    const intentId = finalPaymentData?.paymentIntentId;
    const isPaymentSuccessful = finalPaymentData?.status === "SUCCEEDED";

    const paymentMethod = isPaymentSuccessful
      ? {
          name: "Airwallex Credit Card",
          method: "airwallex",
          paid: true,
          transaction_id: intentId,
          amount: latestCart?.cartAmount || 0,
          currency: latestCart?.currency?.code || "EUR",
        }
    : null;

    console.log("💳 Derived paymentMethod:", paymentMethod);

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
        products: [
          ...(latestCart?.lineItems?.physicalItems || []),
          ...(latestCart?.lineItems?.digitalItems || []),
        ].map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity || 1,
          product_options: item.options?.map((opt) => ({
            id: opt.nameId,
            value: opt.valueId,
          })) || [],
        })),
        paymentMethod:paymentMethod,
        
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
        url: `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData, null, 2)
      });

      console.log("📤 Final order payload:", orderData);

      // Call the order creation endpoint
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
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

      console.log("PaymentMethod", paymentMethod);
      const responseText = await response.text();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        if (result.success) {
          console.log(' Order created:', result);

          if (subscriptionProduct && awCustomer && bigcommerceCustomer) {
            try {
              const subscriptionProvisionResult = await onProvisionSubscription?.({
                orderId: result.orderId,
                cart: latestCart,
                bigcommerceCustomer,
                airwallexCustomer: awCustomer,
              });

              console.log('Subscription provisioned:', subscriptionProvisionResult);
            } catch (subErr) {
              console.warn('⚠️ Subscription provisioning failed:', subErr.message);
            }
          }

          // navigate("/thank-you", {
          //   state: {
          //     orderId: result.orderId,
          //     amount: latestCart?.cartAmount,
          //     currency: latestCart?.currency?.code || "EUR",
          //     email: clientData?.email,
          //   }
          // });

          // Optionally redirect or clear cart
          // window.location.href = `https://kasweb-c4.mybigcommerce.com/order-confirmation?orderId=${result.orderId}`;
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
      <header className="bg-white">
        <div className="max-w-[1200px] mx-auto md:py-[39px] text-center p-[20px]">
          <img
            src="../images/logo_final_1764933550__59613.original (1).png"
            alt="logo"
            className="h-[50px] mx-auto object-contain nr-logo"
          />
        </div>
      </header>


      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-[1200px] mx-auto py-8 px-[28px] md:px-[35px] flex pt-0 flex-col md:flex-row">
        {/* ================= LEFT COLUMN ================= */}
        <section className="nr-lft-prt w-[100%] lg:w-[66.6666666667%] lg:pr-[78px] pr-0 md:w-[58.3333333333%]">
          {/* ================= PROMO BANNER (using old styles but new logic) ================= */}
          <div className="max-w-[1200px] mx-auto">
            <div className="nr-date-time-wr text-white bg-[#3b4450] rounded-[5px] py-[8px] px-[10px] text-center">
              <p className="nr-date-time-txt-fir text-[14px] md:text-[16px]">
                Félicitations, votre promo a été appliquée.
              </p>
              <p className="nr-date-time-txt-sec text-[13px] md:text-[16px] mt-[5px]">
                Il vous reste <span className="text-[#f4d54c] font-[600]">{minutes}:{seconds}</span> pour en bénéficier. 
                Valable ce <b>{formattedDate}</b>
              </p>
            </div>
          </div>
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
              onPlaceOrder={handlePlaceOrder}
              cart={cart}
              clientData={clientData}
              deliveryData={deliveryData}
            />

            {/* ORDER BUTTON & SECURITY SECTION */}
            {activeStep === "payment" && (
              <>

              {/* <button
                  type="button"
                  onClick={handlePlaceOrder}
                  // disabled={isPlacingOrder}



                  // disabled={isPlacingOrder || paymentData?.status !== "SUCCEEDED"}

                  disabled={isPlacingOrder || isVipLoading || paymentData?.status !== "SUCCEEDED"}

                  // className={`w-full cursor-pointer ${
                  //   isPlacingOrder 
                  //     ? 'bg-gray-400 cursor-not-allowed' 
                  //     : 'bg-[#2fb34a] hover:bg-[#28a745]'
                  // } transition text-white font-semibold py-3 rounded flex items-center justify-center gap-2`}
                  className={`w-full cursor-pointer ${
                    isPlacingOrder || paymentData?.status !== "SUCCEEDED"
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

                </button> */}

                {isPlacingOrder && (
                  <div className="w-full bg-[#2fb34a] text-white font-semibold py-3 rounded flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    PROCESSING ORDER...
                  </div>
                )}
               
                
                <div className="text-xs text-gray-600 text-center mt-3 flex items-center gap-[5px] justify-center">
                  <img src="../images/ssl.webp" alt="lock" className="h-[15px]"/>
                   Secure 256-bit SSL encryption
                </div>

                <div className="flex justify-center gap-6 mt-4">
                  <img
                    src="../images/payment-icon-new.webp"
                    alt="McAfee"
                    className="h-[50px]"
                  />
                </div>



                {/* Warrantly Subscription section */}


                <div className="nr-wrranty-wr py-[10px] px-[12px] border border-[#ccc]">
                  <div className="nr-checkbox-wr bg-[#3b4450] gap-[10px] p-[10px] rounded-[4px] flex items-center my-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="26px" height="auto" viewBox="0 0 1200.000000 1100.000000" preserveAspectRatio="xMidYMid meet">
                      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)" fill="#FFF" stroke="none">
                        <path d="M7318 10295 l-3 -1090 -2817 -3 -2818 -2 0 -2430 0 -2430 2820 0 2820 0 2 -1088 3 -1088 2175 2303 c1196 1266 2174 2305 2173 2308 -1 4 -107 117 -235 253 -129 136 -1081 1145 -2117 2242 -1036 1097 -1910 2022 -1942 2055 l-59 60 -2 -1090z"></path>
                      </g>
                    </svg>

                    <div className="nr-checkbox-wr-cntnt flex gap-[10px] items-center">
                      <div className="nr-checkbox-outer">
                      <input
                        type="checkbox"
                        id="vip-club"
                        name="vip-club"
                        className="nr-checkbox"
                        checked={vipSelected}
                        disabled={isVipLoading}
                        onChange={(e) => handleVipToggle(e.target.checked)}
                      />
                      </div>
                      <label htmlFor="vip-club" className="text-[16px] text-white">
                        VIP CLUB ACCESS - HIKE SUMMIT
                      </label>
                    </div>
                  </div>

                  <div className="nr-wrranty-text pt-[15px]">
                    <p className="text-[13px]">
                      By checking this box, I activate my 30-day free trial to the VIP CLUB, giving me access to exclusive benefits on Hike Summit.
                      After the trial, the subscription renews automatically at £12.99/month.
                      This membership is non-binding and can be cancelled at any time by contacting support.
                    </p>
                  </div>
                </div>
                {/* <div className="nr-wrranty-wr py-[10px] px-[12px] border border-[#ccc]">
                  <div className="nr-wrranty-img-outer w-100 flex justify-center">
                    <img className="h-[100px]" src="../images/one-yr-warranty.webp" alt="wrranty-img" />
                  </div>
                  <div className="nr-checkbox-wr bg-[#3b4450] gap-[10px] p-[10px] rounded-[4px] flex items-center my-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="26px" height="auto" viewBox="0 0 1200.000000 1100.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)" fill="#FFF" stroke="none"><path d="M7318 10295 l-3 -1090 -2817 -3 -2818 -2 0 -2430 0 -2430 2820 0 2820 0 2 -1088 3 -1088 2175 2303 c1196 1266 2174 2305 2173 2308 -1 4 -107 117 -235 253 -129 136 -1081 1145 -2117 2242 -1036 1097 -1910 2022 -1942 2055 l-59 60 -2 -1090z"></path></g></svg>
                    <div className="nr-checkbox-wr-cntnt flex gap-[10px] items-center">
                      <input type="checkbox" id="warranty" name="warranty" className="nr-checkbox" />
                      <label htmlFor="warranty" className="text-[16px] text-white">OUI ! JE SOUHAITE EN BÉNÉFICIER !</label>
                    </div>
                  </div>
                  <div className="nr-wrranty-text pt-[15px]">
                    <p className="text-[13px]">EXTENSION GARANTIE 1 AN ! Si cette case est cochée, le montant de 3.97€ sera chargé dans les 24h en tant que transaction additionnelle. Vous bénéficierez d'une extension de garantie de 1 an via notre partenaire AssurPremium. Vous avez 24h pour changer d'avis si vous ne souhaitez plus en bénéficier. Après chargement de la transaction, vous pouvez obtenir un remboursement intégral dans les 90 jours en nous contactant à support@flashventes.com</p>
                  </div>
                </div> */}
              </>
            )}
          </div>
        </section>

        {/* ================= RIGHT COLUMN ================= */}
        <aside className="nr-rght-prt w-100 lg:w-[33.3333333333%] md:w-[41.6666666667%] mt-[38px] md:pl-[15px] pl-0">
          {/* Pass cart prop to OrderSummary */}
          <OrderSummary 
            deliveryPrice={deliveryData?.price ?? 0} 
            cart={cart} 
          />
          {/* first-part */}
          <div className="nr-rght-bottom-info-cntnt pt-[30px] pb-[30px] border-b ">
            <div className="nr-info-hed-prt flex gap-[8px] items-center text-[18px] font-[600] pb-[8px]">
              <img src="../images/shield-2.webp" alt="shield" className="h-[40px] w-[40px] object-contain"/>
              <h3>Service Client</h3>
            </div>
            <p className="pb-[20px] text-[15px] text-[#747474]">Nous répondons à vos questions du lundi au vendredi de 9h à 18h.</p>
            <div className="nr-contact-info">
              <div className="nr-info-item flex gap-[8px] align-middle pb-[16px]">
                <img src="../images/phone-icon.webp" alt="phone" className="h-[24px] w-[24px] object-contain" />
                <p className="text-[15px] text-[#747474]">+44 330 054 5774</p>
              </div>
              <div className="nr-info-item flex gap-[8px] align-middle">
                <img src="../images/email-icon.webp" alt="email" className="h-[24px] w-[24px] object-contain" />
                <p className="text-[15px] text-[#747474]">help@nomade-horizon.com</p>
              </div>
            </div>
          </div>
          {/* second-part */}
          <div className="nr-rght-bottom-info-cntnt py-[30px] border-b">
            <div className="nr-info-hed-prt flex gap-[8px] items-center text-[18px] font-[600] pb-[8px]">
              <img src="../images/calendar-2.webp" alt="shield" className="h-[40px] w-[40px] object-contain"/>
              <h3>Satisfait ou remboursé 30 jours</h3>
            </div>
            <p className="text-[15px] text-[#747474]">Insatisfait ? Remboursement facile et sans condition. Votre satisfaction est notre priorité.</p>
          </div>
          {/* third-part */}
          <div className="nr-rght-bottom-info-cntnt py-[30px] border-b">
            <div className="nr-info-hed-prt flex gap-[8px] items-center text-[18px] font-[600] pb-[8px]">
              <img src="../images/delivery-truck-icon.webp" alt="shield" className="h-[40px] w-[40px] object-contain"/>
              <h3>Expédition en 48h</h3>
            </div>
            <p className="text-[15px] text-[#747474]">Bénéficiez d'une expédition ultra-rapide avec suivi en seulement 48 heures.</p>
          </div>
          <div className="nr-review-prt py-[30px]">
            <h2 className="text-[18px] font-[600]">Ce que disent nos clients</h2>
            {/* First Review */}
            <div className="nr-review-outer-wr">
              <div className="nr-review-wr bg-[#f4f4f4] p-[15px] rounded-[12px] mt-[17px] relative before:absolute before:content-[''] before:w-[30px] before:h-[30px] before:bg-[#f4f4f4] before:left-[35px] before:bottom-[-5px] before:rotate-[45deg]">
                <p className="text-[14px] text-center">"Flashventes est mon magasin en ligne favoris. Il y a beaucoup de produits innovants à très bon prix. J'achète régulièrement sur ce site et en suis très satisfait. Je le recommande totalement"</p>
              </div>
              <div className="flex justify-between w-100 mt-[13px] mb-[26px]">
                <p className="text-[14px] font-[600]">Nicolas D. - Paris</p>
                <img src="../images/star.webp" alt="star" className="object-contain"/>
              </div>
            </div>
            {/* Second Review */}
            <div className="nr-review-outer-wr border-b">
              <div className="nr-review-wr bg-[#f4f4f4] p-[15px] rounded-[12px] mt-[17px] relative before:absolute before:content-[''] before:w-[30px] before:h-[30px] before:bg-[#f4f4f4] before:left-[35px] before:bottom-[-5px] before:rotate-[45deg]">
                <p className="text-[14px] text-center">"Très bonne boutique, large choix, on y trouve tout à tout petit prix. Je recommande totalement Flashventes pour son sérieux."</p>
              </div>
              <div className="flex justify-between w-100 mt-[13px] mb-[26px]">
                <p className="text-[14px] font-[600]">Marie P. - Marseille</p>
                <img src="../images/star.webp" alt="star" className="object-contain"/>
              </div>
            </div>
          </div>
          <div className="nr-footer-links flex flex-col gap-[10px] items-center">
            <a href="" className="liks text-[12px] text-[#656565]">Conditions Générales</a>
            <a href="" className="liks text-[12px] text-[#656565]">Politiques et Tarifs D'expédition</a>
            <a href="" className="liks text-[12px] text-[#656565]">Politique de confidentialité</a>
            <a href="" className="liks text-[12px] text-[#656565]">Echange et Retour</a>
          </div>
        </aside>
      </main>

      {/* ================= FOOTER ================= */}
      {/* <footer className="text-xs text-gray-500 text-center py-6 space-y-2">
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
      </footer> */}
    </div>
  );
}