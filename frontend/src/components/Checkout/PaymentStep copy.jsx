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
            currency: cart?.currency?.code || "EUR",
            merchant_order_id: cart.id,
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

      element.on("success", (event) => {
        if (successHandledRef.current) return;
        successHandledRef.current = true;

        const paymentIntent = event?.detail?.intent || result;

        const successPayload = {
          status: "SUCCEEDED",
          paymentIntentId: paymentIntent?.id || result.id,
          clientSecret: result.client_secret,
          intent: paymentIntent,
        };

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
}, [active, isDisabled, cart?.id, cart?.cartAmount, deliveryData, cart?.currency?.code]);
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