// Working
import { useEffect, useState } from "react";

export default function ShippingStep({
  active,
  hasReachedDelivery,
  data,
  isComplete,
  onContinue,
  onEdit,
  isDisabled,
}) {
  console.log({
  active,
  isComplete,
  data,
});

  const [form, setForm] = useState({
    country: "France",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    method: "",
    price: 0,
  });

  // Pre-fill when editing
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const hasAddress =
    data?.city || data?.postalCode || data?.country;

  const addressLine = [
    data?.city,
    data?.postalCode && `${data.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");

  const countryLine = data?.country;

  /* ================= ACTIVE VIEW (HIGHEST PRIORITY) ================= */
  if (active) {
    return (
      <section className="border-b pb-4">
        <Header step={2} title="Delivery" />

        {/* ADDRESS FORM */}
        <div className="pl-8 mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Country</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value })
              }
            >
              <option>France</option>
            </select>
          </div>

          <input
            placeholder="First name"
            className="border rounded px-3 py-2"
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
          />

          <input
            placeholder="Name"
            className="border rounded px-3 py-2"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
          />

          <input
            placeholder="Address"
            className="col-span-2 border rounded px-3 py-2"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          <input
            placeholder="City"
            className="border rounded px-3 py-2"
            value={form.city}
            onChange={(e) =>
              setForm({ ...form, city: e.target.value })
            }
          />

          <input
            placeholder="Postal code"
            className="border rounded px-3 py-2"
            value={form.postalCode}
            onChange={(e) =>
              setForm({ ...form, postalCode: e.target.value })
            }
          />

          <input
            placeholder="Telephone"
            className="col-span-2 border rounded px-3 py-2"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </div>

        {/* DELIVERY METHODS */}
        <div className="pl-8 mt-6 text-sm">
          <div className="font-medium mb-3">Delivery method</div>

          <label className="flex items-center justify-between border rounded p-4 mb-2 cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.method === "free"}
                onChange={() =>
                  setForm({ ...form, method: "free", price: 0 })
                }
              />
              Free Delivery
            </div>
            <span className="font-medium">€0.00</span>
          </label>

          <label className="flex items-center justify-between border-2 border-green-400 rounded p-4 cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.method === "insured"}
                onChange={() =>
                  setForm({ ...form, method: "insured", price: 1.99 })
                }
              />
              Delivery + Insurance (Protection against loss, breakage, and theft)
            </div>
            <span className="font-medium">€1.99</span>
          </label>
        </div>

        <button
          type="button"
          className="ml-8 mt-4 bg-[#2fb34a] text-white text-sm font-semibold px-6 py-2 rounded"
          onClick={() => onContinue(form)}
          disabled={!form.address || !form.city || isDisabled}
        >
          CONTINUE
        </button>
      </section>
    );
  }

  /* ================= NOT REACHED — HEADER ONLY ================= */
  if (!hasReachedDelivery) {
    return (
      <section className="border-b pb-4">
        <Header step={2} title="Delivery" />
      </section>
    );
  }

  /* ================= COLLAPSED — INCOMPLETE ================= */
  // if (!isComplete) {
  //   return (
  //     <section className="border-b pb-4">
  //       <Header step={2} title="Delivery" />
  //     </section>
  //   );
  // }

  /* ================= COLLAPSED — COMPLETE SUMMARY ================= */
  return (
    <section className="border-b pb-4">
      <Header step={2} title="Delivery" onEdit={onEdit} />

      <div className="pl-8 text-sm text-gray-700 space-y-1">
        <div>
          {data.firstName} {data.lastName}
        </div>
        <div>{data.phone}</div>
        <div>{data.address}</div>

        {hasAddress && (
          <div>
            {addressLine}
            {countryLine && ` / ${countryLine}`}
          </div>
        )}

        {data.method && (
          <div className="mt-3">
            <div className="text-gray-900">
              {data.method === "free"
                ? "Free Delivery"
                : "Delivery + Insurance (Protection against loss, breakage, and theft)"}
            </div>
            <div className="font-semibold text-gray-900">
              {data.price ? `€${data.price.toFixed(2)}` : ""}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ================= HEADER ================= */

function Header({ step, title, onEdit }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="flex items-center justify-center w-6 h-6 rounded-full border text-xs">
          {step}
        </span>
        {title}
      </h2>

      {onEdit && (
        <button
          type="button"
          className="text-xs text-gray-700 border px-3 py-1 rounded hover:bg-gray-100 transition"
          onClick={onEdit}
        >
          Modifier
        </button>
      )}
    </div>
  );
}





