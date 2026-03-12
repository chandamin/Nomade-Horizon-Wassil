import { useState } from "react";
import { init } from "@airwallex/components-sdk";

const API_BASE = "https://unpenciled-unhumored-thora.ngrok-free.dev/api/subscription-plans";

export default function PaymentStep({
  active,
  data,
  onContinue,
  isDisabled,
  cart,
  clientData,
  deliveryData,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRedirectToHpp = async () => {
    try {
      setLoading(true);
      setError("");

      const amount = Number(cart?.cartAmount || 0);
      const currency = cart?.currency?.code || "EUR";
      const merchantOrderId = cart?.id || `cart_${Date.now()}`;

      const res = await fetch(`${API_BASE}/payment-intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          amount,
          currency,
          merchant_order_id: merchantOrderId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create payment intent");
      }

      // keep current checkout context so the return flow can resume safely
      sessionStorage.setItem(
        "airwallex_checkout_context",
        JSON.stringify({
          cart,
          clientData,
          deliveryData,
          paymentIntentId: result.id,
          merchantOrderId,
        })
      );

      onContinue?.({
        ...data,
        status: "PENDING_REDIRECT",
        paymentIntentId: result.id,
        clientSecret: result.client_secret,
        currency: result.currency,
      });

      const { payments } = await init({
        env: "demo",
        enabledElements: ["payments"],
      });

      payments.redirectToCheckout({
        intent_id: result.id,
        client_secret: result.client_secret,
        currency: result.currency,
        country_code: "FR",
        methods: ["card"],
        allowedCardNetworks: ["visa", "mastercard", "amex"],
        // successUrl: `${window.location.origin}/checkout?airwallex_return=success&intent_id=${result.id}`,
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || "Unable to continue to secure payment");

      onContinue?.({
        ...data,
        status: "FAILED",
      });
    }
  };

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
            Carte bancaire
          </label>

          <div className="md:pl-[58.5px] pl-[0] pr-[0] md:pr-[29.5px]">
            <button
              type="button"
              onClick={handleRedirectToHpp}
              disabled={loading || isDisabled}
              className="w-full md:w-auto cursor-pointer bg-[#2fb34a] hover:bg-[#28a745] transition text-white text-[13px] px-[30px] py-[13px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "REDIRECTING..." : "CONTINUE TO SECURE PAYMENT"}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 md:pl-[58.5px] md:pr-[29.5px]">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mt-[24px] text-[14px] md:text-[16px] text-gray-600 pl-0 md:pl-[58.5px] pr-[29.5px]">
            🔒 Paiement sécurisé – Vos informations sont 100% confidentielles.
          </div>
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