// import { useState } from "react";
// import ClientStep from "./ClientStep";
// import ShippingStep from "./ShippingStep";
// import PaymentStep from "./PaymentStep";
// import OrderSummary from "./OrderSummary";

// export default function CheckoutLayout() {
//   /**
//    * activeStep controls which section is expanded.
//    * Order: client → delivery → payment
//    */
//   const [activeStep, setActiveStep] = useState("client");
//   /**
//    * Static state holders for now
//    * (will be hydrated later via BigCommerce SDK)
//    */
//   const [clientData, setClientData] = useState(null);
//   const [deliveryData, setDeliveryData] = useState(null);
//   return (
//     <div className="min-h-screen bg-[#fff]">
//       {/* ================= HEADER ================= */}
//       <header className="bg-white border-b">
//         <div className="max-w-[1200px] mx-auto py-4 text-center px-[20px]">
//           <img
//             src="https://images.unsplash.com/photo-1607082349566-1870e33f43d1?w=200"
//             alt="Flashventes"
//             className="h-7 mx-auto object-contain"
//           />
//         </div>
//       </header>

//       {/* ================= MAIN CONTENT ================= */}
//       <main className="max-w-[1200px] mx-auto gap-8 py-8 px-[20px] grid grid-cols-1 sm:grid-cols-12 md:grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-12">
//         {/* ================= LEFT COLUMN ================= */}
//         <section className="col-span-7">
//           <div className="nr-date-time-wr text-white bg-[#3b4450] rounded-[5px] py-[8px] px-[10px] text-center">
//             <p className="nr-date-time-txt-fir text-[14px] md:text-[16px]">Félicitations, votre promo a été appliquée.</p>
//             <p className="nr-date-time-txt-sec text-[13px] md:text-[16px]">Il vous reste <span className="text-[#f4d54c] font-[600]">05:16</span> pour en bénéficier. Valable ce <b>28/01/2026</b></p>
//           </div>
//           <div className="bg-white rounded pt-[24px] space-y-6">
//             <ClientStep
//               active={activeStep === "client"}
//               data={clientData}
//               onContinue={(data) => {
//                 setClientData(data);
//                 setActiveStep("delivery");
//               }}
//               onEdit={() => setActiveStep("client")}
//             />

//             <ShippingStep
//               active={activeStep === "delivery"}
//               data={deliveryData}
//               onContinue={(data) => {
//                 setDeliveryData(data);
//                 setActiveStep("payment");
//               }}
//               onEdit={() => setActiveStep("delivery")}
//             />
//             <PaymentStep active={activeStep === "payment"} />
//             {activeStep === "payment" && (
//               <>
//                 <button
//                   type="button"
//                   className="w-full cursor-pointer bg-[#2fb34a] hover:bg-[#28a745] transition text-white font-semibold py-3 rounded"
//                 >
//                   PLACE AN ORDER
//                 </button>

//                 <div className="text-xs text-gray-600 text-center mt-3">
//                   🔒 Secure 256-bit SSL encryption
//                 </div>

//                 <div className="flex justify-center gap-6 mt-4">
//                   <img
//                     src="https://upload.wikimedia.org/wikipedia/commons/3/3a/McAfee_logo.png"
//                     alt="McAfee"
//                     className="h-6"
//                   />
//                   <img
//                     src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Norton_logo.svg"
//                     alt="Norton"
//                     className="h-6"
//                   />
//                   <img
//                     src="https://upload.wikimedia.org/wikipedia/commons/5/5b/TRUSTe_logo.png"
//                     alt="TRUSTe"
//                     className="h-6"
//                   />
//                 </div>
//               </>
//             )}
//           </div>
//         </section>

//         {/* ================= RIGHT COLUMN ================= */}
//         <aside className="col-span-5">
//           <OrderSummary deliveryPrice={deliveryData?.price ?? 0} />
//         </aside>
//       </main>

//       {/* ================= FOOTER ================= */}
//       <footer className="text-xs text-gray-500 text-center py-6 space-y-2">
//         <div className="space-x-3">
//           <a href="#" className="hover:underline">
//             General Terms and Conditions
//           </a>
//           <a href="#" className="hover:underline">
//             Shipping Policies and Rates
//           </a>
//           <a href="#" className="hover:underline">
//             Privacy Policy
//           </a>
//         </div>
//         <div>
//           <a href="#" className="hover:underline">
//             Exchanges and Returns
//           </a>
//         </div>
//       </footer>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import ClientStep from "./ClientStep";
import ShippingStep from "./ShippingStep";
import PaymentStep from "./PaymentStep";
import OrderSummary from "./OrderSummary";

export default function CheckoutLayout({ cart }) {
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

  // Timer logic from working version
  const DISCOUNT_DURATION = 10 * 60; // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(DISCOUNT_DURATION);
  
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

  // Delivery completion check from working version
  const isDeliveryComplete = !!(
    deliveryData?.address &&
    deliveryData?.city &&
    deliveryData?.method
  );

  const hasReachedDelivery = activeStep === "delivery" || activeStep === "payment";

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* ================= HEADER ================= */}
      <header className="bg-white border-b">
        <div className="max-w-[1200px] mx-auto py-4 text-center px-[20px]">
          <img
            src="https://images.unsplash.com/photo-1607082349566-1870e33f43d1?w=200"
            alt="Flashventes"
            className="h-7 mx-auto object-contain"
          />
        </div>
      </header>

      {/* ================= PROMO BANNER (using old styles but new logic) ================= */}
      <div className="max-w-[1200px] mx-auto px-[20px] mb-6">
        <div className="nr-date-time-wr text-white bg-[#3b4450] rounded-[5px] py-[8px] px-[10px] text-center">
          <p className="nr-date-time-txt-fir text-[14px] md:text-[16px]">
            Félicitations, votre promo a été appliquée.
          </p>
          <p className="nr-date-time-txt-sec text-[13px] md:text-[16px]">
            Il vous reste <span className="text-[#f4d54c] font-[600]">{minutes}:{seconds}</span> pour en bénéficier. 
            Valable ce <b>{formattedDate}</b>
          </p>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-[1200px] mx-auto gap-8 py-8 px-[20px] grid grid-cols-1 sm:grid-cols-12 md:grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-12">
        {/* ================= LEFT COLUMN ================= */}
        <section className="col-span-7">
          <div className="bg-white rounded pt-[24px] space-y-6">
            {/* CLIENT STEP with cart prop */}
            <ClientStep
              active={activeStep === "client"}
              data={clientData}
              onContinue={(data) => {
                setClientData(data);
                setActiveStep("delivery");
              }}
              onEdit={() => setActiveStep("client")}
              isDisabled={activeStep !== "client"}
              cart={cart}
            />

            {/* DELIVERY STEP with cart prop and hasReached logic */}
            <ShippingStep
              active={activeStep === "delivery"}
              hasReached={hasReachedDelivery}
              data={deliveryData}
              isComplete={isDeliveryComplete}
              onContinue={(data) => {
                setDeliveryData(data);
                setActiveStep("payment");
              }}
              onEdit={() => setActiveStep("delivery")}
              isDisabled={activeStep !== "delivery"}
              cart={cart}
            />

            {/* PAYMENT STEP with cart prop */}
            <PaymentStep 
              active={activeStep === "payment"} 
              data={paymentData}
              onContinue={(data) => setPaymentData(data)}
              isDisabled={activeStep !== "payment"}
              cart={cart}
            />

            {/* ORDER BUTTON & SECURITY SECTION */}
            {activeStep === "payment" && (
              <>
                <button
                  type="button"
                  className="w-full cursor-pointer bg-[#2fb34a] hover:bg-[#28a745] transition text-white font-semibold py-3 rounded"
                >
                  PLACE AN ORDER
                </button>

                <div className="text-xs text-gray-600 text-center mt-3">
                  🔒 Secure 256-bit SSL encryption
                </div>

                <div className="flex justify-center gap-6 mt-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3a/McAfee_logo.png"
                    alt="McAfee"
                    className="h-6"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/Norton_logo.svg"
                    alt="Norton"
                    className="h-6"
                  />
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/5b/TRUSTe_logo.png"
                    alt="TRUSTe"
                    className="h-6"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* ================= RIGHT COLUMN ================= */}
        <aside className="col-span-5">
          {/* Pass cart prop to OrderSummary */}
          <OrderSummary deliveryPrice={deliveryData?.price ?? 0} cart={cart} />
        </aside>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="text-xs text-gray-500 text-center py-6 space-y-2">
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
      </footer>
    </div>
  );
}
