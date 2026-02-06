//Working
import { useState, useEffect } from "react";

export default function ClientStep({active,data,onContinue,onEdit,}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Pre-fill when coming back to edit
  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  /* ================= COLLAPSED VIEW ================= */
  if (!active && data) {
    return (
      <section className="border-b pb-4">
        <Header step={1} title="Client" onEdit={onEdit} />

        <div className="pl-8 text-sm text-gray-700">
          {data.email}
        </div>
      </section>
    );
  }

  /* ================= ACTIVE VIEW ================= */
  return (
    <section className="border-b pb-4">
      <Header step={1} title="Client" />

      <div className="pl-8 mt-4 grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Prénom"
          value={form.firstName}
          onChange={(e) =>
            setForm({ ...form, firstName: e.target.value })
          }
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Nom"
          value={form.lastName}
          onChange={(e) =>
            setForm({ ...form, lastName: e.target.value })
          }
          className="border rounded px-3 py-2 text-sm"
        />

        <input
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="col-span-2 border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        className="ml-8 mt-4 bg-[#2fb34a] hover:bg-[#28a745] transition text-white text-sm font-semibold px-6 py-2 rounded"
        onClick={() => onContinue(form)}
        disabled={!form.email}
      >
        CONTINUER
      </button>
    </section>
  );
}

    /* ================= SHARED HEADER ================= */

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
