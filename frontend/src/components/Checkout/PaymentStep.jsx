import { useEffect, useRef, useState } from "react";
import { init, createElement } from "@airwallex/components-sdk";

export default function PaymentStep({
  active,
  data,
  onContinue,
  isDisabled,
  cart,
  clientData,
  deliveryData,
  onPlaceOrder,
  airwallexCustomerId,
}) {
  const containerRef = useRef(null);
  const elementRef = useRef(null);
  const initializedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [intent, setIntent] = useState(null);

  // if (!active) {
  //   return (
  //     <section className="pb-4">
  //       <Header step={3} title="Payment" />
  //     </section>
  //   );
  // }
  const successHandledRef = useRef(false);

  // Reset initialization when payment step becomes inactive
useEffect(() => {
  if (!active) {
    console.log("🔄 Payment step became inactive, resetting initialization...");
    initializedRef.current = false;
    successHandledRef.current = false;

    // Unmount the element if it exists
    if (elementRef.current?.unmount) {
      elementRef.current.unmount();
    }
    elementRef.current = null;
  }
}, [active]);

useEffect(() => {
  if (!active || isDisabled) return;
  if (!cart?.id || !cart?.cartAmount) return;
  if (initializedRef.current) return;

  initializedRef.current = true;
  let isMounted = true;

  const setupPayment = async () => {
    try {
      setLoading(true);
      setError("");

      const currency = cart?.currency?.code || "EUR";

      // 1. Create a payment customer (cus_) required for payment consent
      let paymentCustomerId = null;
      if (airwallexCustomerId && clientData?.email) {
        try {
          const cusRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-customers`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
              body: JSON.stringify({ email: clientData.email }),
            }
          );
          if (cusRes.ok) {
            const cusData = await cusRes.json();
            paymentCustomerId = cusData.id;
            console.log("💳 Payment customer (cus_):", paymentCustomerId);
          } else {
            console.warn("⚠️ Failed to create payment customer:", await cusRes.text());
          }
        } catch (cusErr) {
          console.warn("⚠️ Payment customer creation error:", cusErr.message);
        }
      }

      console.log("💳 [PAYMENT_INTENT_CREATE] Request payload:", {
        amount: Number(cart.cartAmount) + Number(deliveryData?.price || 0),
        currency,
        merchant_order_id: cart.id,
        payment_customer_id: paymentCustomerId,
      });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-intents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            amount: Number(cart.cartAmount) + Number(deliveryData?.price || 0),
            currency,
            merchant_order_id: cart.id,
            ...(paymentCustomerId && { payment_customer_id: paymentCustomerId }),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to create payment intent");
      }

      if (!isMounted) return;
      setIntent(result);

      await init({
        env: "demo",
        enabledElements: ["payments"],
      });

      const element = await createElement("dropIn", {
        intent_id: result.id,
        client_secret: result.client_secret,
        currency: result.currency,
        methods: ["card"],
        // Tell the dropIn to create and verify a merchant-triggered consent automatically
        ...(paymentCustomerId && {
          payment_consent: {
            next_triggered_by: "merchant",
            merchant_trigger_reason: "unscheduled",
          },
        }),
      });

      if (!element) {
        throw new Error("Failed to create Airwallex payment element");
      }

      elementRef.current = element;
      element.mount(containerRef.current);

      element.on("ready", () => {
        if (!isMounted) return;
        setLoading(false);
      });

     

      element.on("success", async (event) => {
        if (successHandledRef.current) return;
        successHandledRef.current = true;

        const paymentIntent = event?.detail?.intent || result;
        const intentId = paymentIntent?.id || result.id;

        console.log("💳 [STEP 1] Payment success event received");
        console.log("   intentId:", intentId);
        console.log("   airwallexCustomerId:", airwallexCustomerId);
        console.log("   event.detail keys:", event?.detail ? Object.keys(event.detail) : []);
        console.log("   event.detail.payment_method:", event?.detail?.payment_method);

        // Extract the payment method ID (must start with mtd_) from the success event
        let paymentMethodId =
          event?.detail?.payment_method?.id ||
          event?.detail?.intent?.payment_method?.id ||
          event?.detail?.intent?.latest_payment_attempt?.payment_method?.id;

        // Filter out non-mtd_ IDs (e.g. att_ attempt IDs are not valid)
        if (paymentMethodId && !paymentMethodId.startsWith('mtd_')) {
          paymentMethodId = null;
        }

        console.log("💳 [STEP 2] paymentMethodId from event:", paymentMethodId);

        // If not in event, fetch the payment intent to get the mtd_ payment method ID
        if (!paymentMethodId && intentId) {
          try {
            console.log("💳 [STEP 2b] Fetching payment intent to get payment_method id...");
            const fetchRes = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-intents/${intentId}`,
              {
                method: "GET",
                headers: {
                  "Accept": "application/json",
                  "ngrok-skip-browser-warning": "true",
                },
              }
            );

            if (fetchRes.ok) {
              const fetchedIntent = await fetchRes.json();
              console.log("📥 Fetched PaymentIntent:", JSON.stringify(fetchedIntent, null, 2));

              // Try all known paths that may return an mtd_ payment method ID
              const candidates = [
                fetchedIntent?.payment_method_id,
                fetchedIntent?.payment_method?.id,
                fetchedIntent?.latest_payment_attempt?.payment_method_id,
                fetchedIntent?.latest_payment_attempt?.payment_method?.id,
              ];

              paymentMethodId = candidates.find(id => id?.startsWith('mtd_')) || null;

              console.log("💳 [STEP 2c] Extracted mtd_ ID for PaymentSource:", paymentMethodId);
            } else {
              console.warn("⚠️ Failed to fetch payment intent:", fetchRes.status);
            }
          } catch (fetchErr) {
            console.warn("⚠️ Could not fetch payment intent:", fetchErr.message);
          }
        }

        // Create Payment Source to get psrc_ ID (required for AUTO_CHARGE subscriptions)
        let paymentSourceId = null;

        if (airwallexCustomerId) {
          try {
            console.log(":arrows_counterclockwise: [STEP 3] Creating Payment Source for AUTO_CHARGE...");
            console.log("   billing_customer_id:", airwallexCustomerId);
            console.log("   external_id:", paymentMethodId || intentId);

            const requestBody = {
              billing_customer_id: airwallexCustomerId,
              payment_method_id: paymentMethodId || intentId,
              ...(paymentCustomerId && { payment_customer_id: paymentCustomerId }),
            };

            console.log("   Request body:", JSON.stringify(requestBody));

            const sourceRes = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-sources/create`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify(requestBody),
              }
            );

            const responseText = await sourceRes.text();
            console.log("   Response status:", sourceRes.status);
            console.log("   Response body:", responseText);

            if (sourceRes.ok) {
              const sourceData = JSON.parse(responseText);
              paymentSourceId = sourceData.paymentSource?.id;
              console.log("✅ [STEP 4] PaymentSource created:", paymentSourceId);
            } else {
              console.warn("⚠️ Failed to create PaymentSource:", sourceRes.status, responseText);
            }
          } catch (sourceErr) {
            console.error("❌ [STEP 3 ERROR] PaymentSource creation error:", sourceErr);
          }
        } else {
          console.warn("⚠️ [STEP 3 SKIP] Cannot create PaymentSource - missing airwallexCustomerId");
        }

        const successPayload = {
          status: "SUCCEEDED",
          paymentIntentId: paymentIntent?.id || result.id,
          clientSecret: result.client_secret,
          intent: paymentIntent,
          ...(paymentSourceId && { paymentSourceId }),
        };
        console.log("💳 [STEP 5] Payment success - final payment_source_id:", paymentSourceId);
        console.log("💳 [STEP 5] Success payload:", JSON.stringify(successPayload, null, 2));

        onContinue?.(successPayload);
        onPlaceOrder?.(successPayload);
      });

      element.on("error", (event) => {
        const message =
        event?.detail?.error?.message ||
        event?.detail?.message ||
        "Payment failed";

        setError(message);

        onContinue?.({
        status: "FAILED",
        paymentIntentId: result.id,
        clientSecret: result.client_secret,
        });
      });
      // element.on("success", async (event) => {
      //   if (successHandledRef.current) return;
      //   successHandledRef.current = true;

      //   const paymentIntent = event?.detail?.intent || result;
      //   const intentId = paymentIntent?.id || result.id;

      //   // Extract the payment_method.id (has prefix like att_xxx)
      //   let paymentMethodId =
      //     // Path 1: From event detail (if available)
      //     event?.detail?.payment_method?.id ||
      //     event?.detail?.intent?.payment_method?.id ||
      //     // Path 2: From latest_payment_attempt (CORRECT PATH per API docs)
      //     paymentIntent?.latest_payment_attempt?.payment_method?.id ||
      //     // Path 3: Direct payment_method (unlikely but check)
      //     paymentIntent?.payment_method?.id;

      //   // If not in event, fetch the payment intent to get payment_method
      //   if (!paymentMethodId && intentId) {
      //     try {
      //       const fetchRes = await fetch(
      //         `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-intents/${intentId}`,
      //         {
      //           method: "GET",
      //           headers: {
      //             "Accept": "application/json",
      //             "ngrok-skip-browser-warning": "true",
      //           },
      //         }
      //       );

      //       if (fetchRes.ok) {
      //         const fetchedIntent = await fetchRes.json();
      //         console.log("📥 Fetched PaymentIntent structure:", {
      //           has_latest_payment_attempt: !!fetchedIntent?.latest_payment_attempt,
      //           payment_attempt_id: fetchedIntent?.latest_payment_attempt?.id,
      //           has_payment_method: !!fetchedIntent?.latest_payment_attempt?.payment_method,
      //           payment_method_type: fetchedIntent?.latest_payment_attempt?.payment_method?.type,
      //           full_attempt: fetchedIntent?.latest_payment_attempt,
      //         });
      //         paymentMethodId =
      //           fetchedIntent?.latest_payment_attempt?.payment_method?.id ||
      //           fetchedIntent?.payment_method?.id;
      //         console.log("💳 Fetched payment_method_id:", paymentMethodId);
      //       }
      //     } catch (fetchErr) {
      //       console.warn("⚠️ Could not fetch payment intent:", fetchErr.message);
      //     }
      //   }

      //   // Create Payment Source to get psrc_ ID (required for AUTO_CHARGE subscriptions)
      //   let paymentSourceId = null;

      //   if (paymentMethodId && airwallexCustomerId) {
      //     try {
      //       console.log("🔄 Creating Payment Source for AUTO_CHARGE...");
      //       console.log("   billing_customer_id:", airwallexCustomerId);
      //       console.log("   payment_method_id:", paymentMethodId);

      //       const sourceRes = await fetch(
      //         `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-sources/create`,
      //         {
      //           method: "POST",
      //           headers: {
      //             "Content-Type": "application/json",
      //             "ngrok-skip-browser-warning": "true"
      //           },
      //           body: JSON.stringify({
      //             billing_customer_id: airwallexCustomerId,
      //             payment_method_id: paymentMethodId,
      //             linked_payment_account_id: import.meta.env.VITE_AIRWALLEX_LINKED_PAYMENT_ACCOUNT_ID,
      //           }),
      //         }
      //       );

      //       if (sourceRes.ok) {
      //         const sourceData = await sourceRes.json();
      //         paymentSourceId = sourceData.paymentSource?.id;
      //         console.log("✅ PaymentSource created:", paymentSourceId);
      //       } else {
      //         const errorText = await sourceRes.text();
      //         console.warn("⚠️ Failed to create PaymentSource:", sourceRes.status, errorText);
      //       }
      //     } catch (sourceErr) {
      //       console.warn("⚠️ PaymentSource creation error:", sourceErr.message);
      //     }
      //   } else {
      //     console.warn("⚠️ Cannot create PaymentSource - missing paymentMethodId or airwallexCustomerId", {
      //       hasPaymentMethodId: !!paymentMethodId,
      //       hasAirwallexCustomerId: !!airwallexCustomerId
      //     });
      //   }

      //   const successPayload = {
      //     status: "SUCCEEDED",
      //     paymentIntentId: paymentIntent?.id || result.id,
      //     clientSecret: result.client_secret,
      //     intent: paymentIntent,
      //     ...(paymentSourceId && { paymentSourceId }),
      //   };
      //   console.log("💳 Payment success - final payment_source_id:", paymentSourceId);

      //   onContinue?.(successPayload);
      //   onPlaceOrder?.(successPayload);
      // });

      element.on("error", (event) => {
        const message =
          event?.detail?.error?.message ||
          event?.detail?.message ||
          "Payment failed";

        setError(message);

        onContinue?.({
          status: "FAILED",
          paymentIntentId: result.id,
          clientSecret: result.client_secret,
        });
      });
    } catch (err) {
      console.error("❌ Airwallex payment setup error:", err);
      setLoading(false);
      setError(err.message || "Failed to load payment form");
      initializedRef.current = false;
    }
  };

  setupPayment();

  return () => {
    isMounted = false;
    if (elementRef.current?.unmount) {
      elementRef.current.unmount();
    }
    elementRef.current = null;
  };
}, [active, isDisabled, cart?.id, cart?.cartAmount, deliveryData, cart?.currency?.code, airwallexCustomerId]);
  // const successHandledRef = useRef(false);
  // useEffect(() => {
  //   if (!active || isDisabled) return;
  //   if (initializedRef.current) return;
  //   if (!cart?.cartAmount) return;

  //   initializedRef.current = true;
  //   let isMounted = true;
   

  //   const setupPayment = async () => {
  //     try {
  //       setLoading(true);
  //       setError("");

  //       const merchantOrderId =
  //         cart?.id || `cart_${Date.now()}`;

  //       const response = await fetch(
  //         `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/payment-intents`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //             "Accept": "application/json",
  //             "ngrok-skip-browser-warning": "true",
  //           },
  //           body: JSON.stringify({
  //             amount: Number(cart.cartAmount),
  //             currency: cart?.currency?.code || "EUR",
  //             merchant_order_id: merchantOrderId,
  //           }),
  //         }
  //       );

  //       const result = await response.json();

  //       if (!response.ok) {
  //         throw new Error(result?.error || "Failed to create payment intent");
  //       }

  //       if (!isMounted) return;
  //       setIntent(result);

  //       await init({
  //         env: "demo",
  //         enabledElements: ["payments"],
  //       });

  //       const element = await createElement("dropIn", {
  //         intent_id: result.id,
  //         client_secret: result.client_secret,
  //         currency: result.currency,
  //         methods: ["card"],
  //       });

  //       if (!element) {
  //         throw new Error("Failed to create Airwallex payment element");
  //       }

  //       elementRef.current = element;
  //       element.mount(containerRef.current);

  //       element.on("ready", () => {
  //         if (!isMounted) return;
  //         setLoading(false);
  //       });

  //       // const successHandledRef = useRef(false);

  //       element.on("success", (event) => {
  //         const paymentIntent = event?.detail?.intent || result;

  //         onContinue?.({
  //           ...data,
  //           status: "SUCCEEDED",
  //           paymentIntentId: paymentIntent?.id || result.id,
  //           clientSecret: result.client_secret,
  //           intent: paymentIntent,
  //         });
  //         onPlaceOrder?.();
  //       });

  //       element.on("error", (event) => {
  //         const message =
  //           event?.detail?.error?.message ||
  //           event?.detail?.message ||
  //           "Payment failed";

  //         setError(message);

  //         onContinue?.({
  //           ...data,
  //           status: "FAILED",
  //           paymentIntentId: result.id,
  //           clientSecret: result.client_secret,
  //         });
  //       });

  //       initializedRef.current = true;
  //     } catch (err) {
  //       console.error("❌ Airwallex payment setup error:", err);
  //       setLoading(false);
  //       setError(err.message || "Failed to load payment form");
  //     }
  //   };

  //   setupPayment();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [active, isDisabled, cart, data, onContinue, clientData, deliveryData]);

  if (!active) {
    return (
      <section className="pb-4">
        <Header step={3} title="Payment" />
      </section>
    );
  }

  return (
    <section>
      <Header step={3} title="Payment" />

      <div className="mt-4">
        <div className="border rounded p-4 bg-[#f5f5f5] pb-[35px]">
          <label className="flex items-center gap-2 text-sm font-medium mb-4">
            <input type="radio" checked readOnly />
            Card payment
          </label>

          {/* {loading && (
            <div className="text-sm text-gray-600 md:pl-[58.5px]">
              Loading secure payment form...
            </div>
          )} */}

          {error && (
            <div className="text-sm text-red-600 mb-4 md:pl-[58.5px]">
              {error}
            </div>
          )}

          <div className="md:pl-[58.5px] md:pr-[29.5px]">
            <div
              ref={containerRef}
              id="airwallex-payment-element"
              className="min-h-[180px]"
            />
          </div>

          <div className="flex items-center gap-2 mt-[24px] text-[14px] md:text-[16px] text-gray-600 pl-0 md:pl-[58.5px] pr-[29.5px]">
            🔒 Paiement sécurisé - Vos informations sont 100% confidentielles.
          </div>

          {intent?.id && (
            <div className="text-xs text-gray-500 mt-3 md:pl-[58.5px]">
              Payment reference: {intent.id}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Header({ step, title }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="nr-step-hed-wr flex items-center gap-2 font-[700] text-[25px] text-[#333]">
        <span className="flex items-center justify-center rounded-full border-[2px] text-[20px] font-[400] border-[#333] h-[35px] w-[35px]">
          {step}
        </span>
        {title}
      </h2>
    </div>
  );
}