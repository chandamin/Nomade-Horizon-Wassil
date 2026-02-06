import { useState, useEffect } from "react";

export default function ClientStep({
  active,
  data,
  onContinue,
  onEdit,
}) {
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
      <Header step={1} title="Client"/>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="nr-input-field flex flex-col-reverse col-span-2 md:col-span-1">
          <input
            type="text"
            placeholder="Prénom"
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
            id="prénom"
            className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
          />
          <label for="prénom" className="nr-input-label text-[14px] text-[#666] top-[unset]">Prénom</label>
        </div>
        <div className="nr-input-field flex flex-col-reverse col-span-2 md:col-span-1">
          <input
            type="text"
            placeholder="Nom"
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
            id="nom"
            className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
          />
          <label for="nom" className="nr-input-label text-[14px] text-[#666] top-[unset]">Nom</label>
        </div>
        <div className="nr-input-field flex flex-col-reverse col-span-2">
          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            id="email-address"
            className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
          />
          <label for="email-address" className="nr-input-label text-[14px] text-[#666] top-[unset]">Email Address</label>
        </div>
      </div>

      <button 
        type="submit"
        className="nr-fir-st-btn cursor-pointer inline-block mt-4 bg-[#2fb34a] hover:bg-[#28a745] transition text-white text-sm font-semibold px-6 py-[15px] rounded w-full sm:w-auto"
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
      <h2 className="nr-step-hed-wr flex items-center gap-2 font-[700] text-[25px] text-[#333]">
        <span className="flex items-center justify-center rounded-full border text-[20px] font-[400] border-[#333] h-[35px] w-[35px]">
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