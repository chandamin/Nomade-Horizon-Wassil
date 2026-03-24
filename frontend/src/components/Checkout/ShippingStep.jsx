import { useEffect, useState } from "react";

export default function ShippingStep({
  active,
  hasReachedDelivery,
  data,
  isComplete,
  onContinue,
  onEdit,
  isDisabled,
  cart,
  customerData,
  isLoading
}) {
  const [form, setForm] = useState({
    country: "France",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    method: "insured",
    price: 1.99,
  });

  // Pre-fill when editing OR when customer data is available
  useEffect(() => {
    if (data) {
      setForm(data);
    } else if (customerData) {
      setForm(prev => ({
        ...prev,
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        phone: customerData.phone || "",
      }));
    }
  }, [data, customerData]);

  // Debug logs
  useEffect(() => {
    console.log('📦 ShippingStep debug:', {
      active,
      hasReachedDelivery,
      isComplete,
      hasData: !!data,
      data: data,
      form: form
    });
  }, [active, hasReachedDelivery, isComplete, data, form]);

  // Check if we have data to show summary (similar to ClientStep logic)
  const hasDataToShow = data && (data.address || data.city || data.method);

  // Validation helper
  const isFormValid = () => {
    return form.address && form.city && form.firstName && form.lastName;
  };

  // Handle continue with validation
  const handleContinue = () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields: address, city, first name, and last name");
      return;
    }
    onContinue(form);
  };

  /* ================= ACTIVE VIEW (when step is active) ================= */
  if (active) {
    return (
      <section className="nr-second-step border-b pb-4">
        <Header step={2} title="Delivery" />

        {/* ADDRESS FORM */}
        <div className="nr-sec-st-cntnt-wr">
          <div className="mt-4 grid grid-cols-2 gap-[8px] text-sm">
            <div className="col-span-2">
              <div className="nr-input-field flex flex-col-reverse w-full nr-select-field">
                <select
                  className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  disabled={isLoading}
                >
                  <option value="France">France</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Switzerland">Switzerland</option>
                </select>
                <label className="block nr-input-label text-[14px] text-[#666] top-[unset]">
                  Country
                </label>
              </div>
            </div>
            
            <div className="nr-input-field flex flex-col-reverse col-span-2 sm:col-span-1">
              <input
                placeholder="First name"
                id="firstname"
                className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                disabled={isLoading}
                required
              />
              <label htmlFor="firstname" className="nr-input-label text-[14px] text-[#666] top-[unset]">
                First name *
              </label>
            </div>
            
            <div className="nr-input-field flex flex-col-reverse col-span-2 sm:col-span-1">
              <input
                placeholder="Name"
                id="name"
                className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                disabled={isLoading}
                required
              />
              <label htmlFor="name" className="nr-input-label text-[14px] text-[#666] top-[unset]">
                Name *
              </label>
            </div>
            
            <div className="nr-input-field flex flex-col-reverse col-span-2">
              <input
                placeholder="Address"
                id="address"
                className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                disabled={isLoading}
                required
              />
              <label htmlFor="address" className="nr-input-label text-[14px] text-[#666] top-[unset]">
                Address *
              </label>
            </div>
            
            <div className="nr-input-field flex flex-col-reverse col-span-2 sm:col-span-1">
              <input
                placeholder="City"
                id="city"
                className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
                disabled={isLoading}
                required
              />
              <label htmlFor="city" className="nr-input-label text-[14px] text-[#666] top-[unset]">
                City *
              </label>
            </div>
            
            <div className="nr-input-field flex flex-col-reverse col-span-2 sm:col-span-1">
              <input
                placeholder="Postal code"
                id="postal-code"
                className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                value={form.postalCode}
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
                disabled={isLoading}
                required
              />
              <label htmlFor="postal-code" className="nr-input-label text-[14px] text-[#666] top-[unset]">
                Postal code *
              </label>
            </div>
            
            <div className="nr-input-field flex flex-col-reverse col-span-2">
              <input
                placeholder="Telephone (if the postman needs to contact you)"
                id="phone"
                className="outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px]"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                disabled={isLoading}
              />
              <label htmlFor="phone" className="nr-input-label text-[14px] text-[#666] top-[unset]">
                Telephone (if the postman needs to contact you)
              </label>
              {/* {customerData?.email && !form.phone && (
                <div className="text-xs text-gray-500 mt-1">
                  Consider adding a phone number for delivery updates
                </div>
              )} */}
            </div>
          </div>

          {/* DELIVERY METHODS */}
          <div className="mt-6 text-sm">
            <div className="mb-3 text-[15px] font-[700]">Delivery method</div>

            <label className="flex items-center justify-between border rounded p-4 mb-2 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  // name="delivery"
                  checked={form.method === "free"}
                  onChange={() =>
                    setForm({ ...form, method: "free", price: 0 })
                  }
                  className="h-[25px] w-[25px]"
                  disabled={isLoading}
                />
                <p className="nr-payment-option-hed text-[15px] font-[700]">Free Delivery</p>
              </div>
              <span className="font-medium">€0.00</span>
            </label>

            <label className="flex items-start justify-between border-2 border-green-400 border-dashed bg-green-100 rounded p-4 cursor-pointer hover:bg-green-50">
              <div className="items-start gap-2">
                <div className="nr-payment-option-outer-wr flex gap-[10px] items-center">
                  <div className="gap-2 w-full flex items-start">
                    <input
                      type="radio"
                      // name="delivery"
                      checked={form.method === "insured"}
                      onChange={() =>
                        setForm({ ...form, method: "insured", price: 1.99 })
                      }
                      className="h-[25px] w-[25px]"
                      disabled={isLoading}
                    />
                    <div className="flex gap-[10px] justify-between w-full items-center">
                      <p className="nr-payment-option-hed text-[15px] font-[700]">
                        Delivery + Insurance (Protection against loss, breakage, and theft)
                      </p>
                      <span className="font-[700] text-[15px]">€1.99</span>
                    </div>
                  </div>
                </div>
                <p className="nr-payment-option-des text-[13px] py-3">
                  Cochez cette case si vous souhaitez ajouter une garantie de transport. 
                  En cas de perte, vol ou dommages survenus lors du transport par la poste, 
                  nous renverrons votre commande gratuitement en 24h.
                </p>
              </div>
            </label>
          </div>

          <button
            type="button"
            className="mt-4 bg-[#2fb34a] hover:bg-[#28a745] transition text-white text-sm font-semibold px-6 py-[15px] rounded cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleContinue}
            disabled={!isFormValid() || isDisabled || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Saving address...
              </span>
            ) : (
              'CONTINUER'
            )}
          </button>
          
          {customerData?.customerId && (
            <div className="mt-3 text-xs text-gray-600">
              <p>Address will be saved to your customer profile.</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ================= COLLAPSED VIEW WITH SUMMARY (when step is completed) ================= */
  // Similar to ClientStep: if not active AND has data, show summary
  if (!active && hasDataToShow) {
    // Format address for display
    const addressParts = [];
    if (data.address) addressParts.push(data.address);
    if (data.city) addressParts.push(data.city);
    if (data.postalCode) addressParts.push(data.postalCode);
    if (data.country && data.country !== "France") addressParts.push(data.country);
    
    const addressLine = addressParts.join(", ");
    
    return (
      <section className="nr-second-step border-b pb-4">
        <Header step={2} title="Delivery" onEdit={onEdit} firstName={data.firstName} lastName={data.lastName} phone={data.phone} addressLine={addressLine} method={data.method} price={data.price} addressId={data.addressId}/>

        {/* <div className="nr-sec-st-cntnt-wr pl-8 text-sm text-gray-700 space-y-2">
          {(data.firstName || data.lastName) && (
            <div className="font-medium">
              {data.firstName} {data.lastName}
            </div>
          )}
          
          {data.phone && (
            <div className="text-gray-600">
              {data.phone}
            </div>
          )}
          
          {addressLine && (
            <div className="text-gray-600">
              {addressLine}
            </div>
          )}
          
          {data.method && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-gray-900 font-medium">
                {data.method === "free"
                  ? "Free Delivery"
                  : "Delivery + Insurance"}
              </div>
              <div className="font-semibold text-gray-900 mt-1">
                {data.price ? `€${data.price.toFixed(2)}` : "€0.00"}
              </div>
              {data.method === "insured" && (
                <div className="text-xs text-gray-500 mt-1">
                  Protection against loss, breakage, and theft
                </div>
              )}
            </div>
          )}
          
          {data.addressId && (
            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <span>✓</span>
              <span>Address saved to your account</span>
            </div>
          )}
        </div>   */}
      </section>
    );
  }

  /* ================= DEFAULT COLLAPSED VIEW (when step is not reached or no data) ================= */
  return (
    <section className="nr-second-step border-b pb-4">
      <Header step={2} title="Delivery" />
    </section>
  );
}

/* ================= SHARED HEADER ================= */

function Header({ step, title, onEdit, firstName, lastName, phone, addressLine, method, price, addressId }) {
  return (
    <div className="flex items-start justify-between">
      <h2 className="nr-step-hed-wr flex items-center gap-2 font-[700] text-[25px] text-[#333]">
        <span className="flex items-center justify-center rounded-full border-[2px] text-[20px] font-[400] border-[#333] h-[35px] w-[35px]">
          {step}
        </span>
        {title}
      </h2>
      <ul className="nr-step-summry w-[100%] pl-[20px]">
        <li className="nr-name text-[13px] text-[#333]">
          {firstName} {lastName}
        </li>
        <li className="nr-phone text-[13px] text-[#333]">
          {phone}
        </li>
        <li className="nr-address text-[13px] text-[#333]">
          {addressLine}
        </li>
        <li className="nr-delivery-cntnt text-[13px] text-[#333]">
          {method && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-gray-900 font-medium">
                {method === "free"
                  ? "Free Delivery"
                  : "Delivery + Insurance"}
              </div>
              <div className="font-semibold text-gray-900 mt-1">
                {price ? `€${price.toFixed(2)}` : "€0.00"}
              </div>
              {method === "insured" && (
                <div className="text-xs text-gray-500 mt-1">
                  Protection against loss, breakage, and theft
                </div>
              )}
            </div>
          )}
            
            {/* Address Save Status */}
            {addressId && (
              <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <span>✓</span>
                <span>Address saved to your account</span>
              </div>
            )}
        </li>
      </ul>
      {onEdit && (
        <button
          type="button"
          className="ml-[20px] text-[13px] text-gray-700 px-[15px] py-[7px] rounded transition"
          onClick={onEdit}
        >
          Modifier
        </button>
      )}
    </div>
  );
}


