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

  const successHandledRef = useRef(false);
  
  const lastAmountKeyRef = useRef(null);
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

  // Hide Airwallex mandate/consent text ("By confirming, you authorise...")
  // useEffect(() => {
  //   if (!active) return;
  //   const container = containerRef.current;
  //   if (!container) return;

  //   const hideMandateText = () => {
  //     // Target text nodes in the parent DOM (outside iframe)
  //     const walker = document.createTreeWalker(
  //       container,
  //       NodeFilter.SHOW_TEXT,
  //       null,
  //       false
  //     );
  //     let node;
  //     while ((node = walker.nextNode())) {
  //       const text = node.textContent?.trim() || "";
  //       if (
  //         text.includes("By confirming") ||
  //         text.includes("authorise") ||
  //         text.includes("authorize") ||
  //         text.includes("future payments in accordance")
  //       ) {
  //         // Hide the closest block-level parent of the text
  //         const parent = node.parentElement;
  //         if (parent && parent.id !== "airwallex-payment-element") {
  //           parent.style.display = "none";
  //         }
  //       }
  //     }
  //   };

  //   // Run once immediately and then observe for DOM changes
  //   const timer = setTimeout(hideMandateText, 1000);
  //   const timer2 = setTimeout(hideMandateText, 2500);
  //   const timer3 = setTimeout(hideMandateText, 5000);

  //   const observer = new MutationObserver(() => {
  //     hideMandateText();
  //   });
  //   observer.observe(container, {
  //     childList: true,
  //     subtree: true,
  //     characterData: true,
  //   });

  //   return () => {
  //     clearTimeout(timer);
  //     clearTimeout(timer2);
  //     clearTimeout(timer3);
  //     observer.disconnect();
  //   };
  // }, [active]);


  useEffect(() => {
    if (!active || isDisabled) return;
    if (!cart?.id || !cart?.cartAmount) return;
    // if (initializedRef.current) return;

    // initializedRef.current = true;

    //  Calculate the unique key for this payment session
    const expectedAmount = Number(cart.cartAmount) + Number(deliveryData?.price || 0);
    const currency = cart?.currency?.code || 'EUR';
    const amountKey = `${expectedAmount}-${currency}`;

    // Skip only if we already have an element for THIS exact amount+currency
    if (lastAmountKeyRef.current === amountKey && elementRef.current) {
      return;
    }
    lastAmountKeyRef.current = amountKey;
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
          autoCapture: false,
          // showConfirmButton: false,
          // Plain container ID (not CSS selector) — renders 3DS auth challenge inline
          authFormContainer: "airwallex-auth-container",
          // Tell the dropIn to create and verify a merchant-triggered consent automatically
          ...(paymentCustomerId && {
            payment_consent: {
              next_triggered_by: "merchant",
              merchant_trigger_reason: "unscheduled",
            },
          }),
          // Hide the mandate / consent disclosure text inside the iframe.
          // DOM inspection shows it is an unclassed <p> directly inside <form>,
          // immediately after the .Button element.
          appearance: {
            rules: {
              // Adjacent sibling: the <p> that comes right after the Proceed button
              // '.Button + p': { display: 'none', visibility: 'hidden', height: '0', overflow: 'hidden', margin: '0', padding: '0' },
              // // Direct child <p> of the form (catches it regardless of position)
              // 'form > p': { display: 'none', visibility: 'hidden', height: '0', overflow: 'hidden', margin: '0', padding: '0' },
              // // Broad fallback — hide all bare <p> tags in the drop-in
              // 'p': { display: 'none', visibility: 'hidden', height: '0', overflow: 'hidden', margin: '0', padding: '0' },
              // 'p.css-hu5z15': {
    //   display: 'none',
    //   visibility: 'hidden',
    //   height: '0',
    //   overflow: 'hidden',
    //   margin: '0',
    //   padding: '0'
    // },
    // // 2. Target the last paragraph inside the form (works if saved card has same structure)
    // 'form p:last-child': {
    //   display: 'none'
    // },
    // // 3. Target any paragraph that is not the first (if only two paragraphs, hide the second)
    // 'form p:not(:first-child)': {
    //   display: 'none'
    // },
    // // 4. Very broad but safe: hide all paragraphs except those inside labels
    // 'p:not(label p)': {
    //   display: 'none'
    // },

    '.Button + p[class*="css-"]': {
      display: 'none !important',
      visibility: 'hidden !important',
      height: '0 !important',
      overflow: 'hidden !important',
      margin: '0 !important',
      padding: '0 !important'
    }

    // '.Button + p.css-hu5z15': {
    //     display: 'none',
    //     visibility: 'hidden',
    //     height: '0',
    //     overflow: 'hidden',
    //     margin: '0',
    //     padding: '0'
    //   }
            },
          },
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
                console.log(" [STEP 4] PaymentSource created:", paymentSourceId);
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
      lastAmountKeyRef.current = null;
    };
  }, [active, isDisabled, cart?.id, cart?.cartAmount, deliveryData?.price, cart?.currency?.code, airwallexCustomerId]);
  
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
            {/* Wrapper with overflow:hidden to clip the mandate text row */}
            <div style={{ position: 'relative' }}>
              <div
                ref={containerRef}
                id="airwallex-payment-element"
                className="min-h-[180px]"
              />
              {/* White overlay to cover the mandate text rendered inside the Airwallex iframe.
                  The text sits directly below the Proceed button, approximately in the last 50px
                  of the iframe. We overlay it with a white rectangle. */}
              <div
                id="airwallex-mandate-cover"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  backgroundColor: '#f5f5f5',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              />
            </div>
            {/* 3DS authentication challenge renders here instead of redirecting */}
            <style>{`
              #airwallex-auth-container,
              #airwallex-auth-container * {
                overflow: visible !important;
                max-height: none !important;
              }
              #airwallex-auth-container {
                width: 100%;
              }
              #airwallex-auth-container iframe {
                width: 100% !important;
                height: 600px !important;
                min-height: 600px !important;
                border: none !important;
              }
              #airwallex-auth-container > div,
              #airwallex-auth-container > div > div {
                width: 100% !important;
                height: auto !important;
              }
            `}</style>
            <div id="airwallex-auth-container" />
          </div>

          <div className="flex items-center gap-2 mt-[24px] text-[14px] md:text-[16px] text-gray-600 pl-0 md:pl-[58.5px] pr-[29.5px]">
            🔒 Paiement sécurisé - Vos informations sont 100% confidentielles.
          </div>

          {/* {intent?.id && (
            <div className="text-xs text-gray-500 mt-3 md:pl-[58.5px]">
              Payment reference: {intent.id}
            </div>
          )} */}
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