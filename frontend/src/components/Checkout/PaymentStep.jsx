//Working
import { useState } from "react";

export default function PaymentStep({ active }) {
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
  });

  /* ================= COLLAPSED VIEW ================= */
  if (!active) {
    return (
      <section className="border-b pb-4 opacity-60">
        <Header step={3} title="Payment" />
      </section>
    );
  }

  /* ================= ACTIVE VIEW ================= */
  return (
    <section className="border-b pb-4">
      <Header step={3} title="Payment" />

      {/* PAYMENT BOX */}
      <div className="pl-8 mt-4">
        <div className="border rounded p-4 bg-white">
          {/* METHOD */}
          <label className="flex items-center gap-2 text-sm font-medium mb-4">
            <input type="radio" defaultChecked />
            Map
          </label>

          {/* CARD FORM */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">
                Card number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="1234 1234 1234 1234"
                  value={card.number}
                  onChange={(e) =>
                    setCard({ ...card, number: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 pr-24"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                    alt="Visa"
                    className="h-4"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                    alt="Mastercard"
                    className="h-4"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                    alt="Amex"
                    className="h-4"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Expiration date
              </label>
              <input
                type="text"
                placeholder="MM / YY"
                value={card.expiry}
                onChange={(e) =>
                  setCard({ ...card, expiry: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Security code
              </label>
              <input
                type="text"
                placeholder="CVC"
                value={card.cvc}
                onChange={(e) =>
                  setCard({ ...card, cvc: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* SECURITY TEXT */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
            🔒 Paiement sécurisé – Vos informations sont 100% confidentielles.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= SHARED HEADER ================= */

function Header({ step, title }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="flex items-center justify-center w-6 h-6 rounded-full border text-xs">
          {step}
        </span>
        {title}
      </h2>
    </div>
  );
}

