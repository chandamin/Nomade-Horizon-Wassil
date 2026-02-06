//Working
import { useState, useEffect } from "react";
import ClientStep from "./ClientStep";
import ShippingStep from "./ShippingStep";
import PaymentStep from "./PaymentStep";
import OrderSummary from "./OrderSummary";

export default function CheckoutLayout({cart}) {


 

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
  
  const getStepClass = (step) => {
    if (activeStep === step) return "bg-green-500 text-white";  // Current step is active
    if (activeStep > step) return "bg-gray-300 text-gray-600";  // Completed step
    return "bg-gray-200 text-gray-400";  // Inactive step
  }


  const isDeliveryComplete =
  !!(
    deliveryData?.address &&
    deliveryData?.city &&
    deliveryData?.method
  );


  const hasReachedDelivery = activeStep === "delivery" || activeStep === "payment";
  console.log(hasReachedDelivery);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ================= HEADER ================= */}
      <header className="bg-white border-b">
        <div className="max-w-[1180px] mx-auto py-4 text-center">
          <img
            src="https://images.unsplash.com/photo-1607082349566-1870e33f43d1?w=200"
            alt="Flashventes"
            className="h-7 mx-auto object-contain"
          />
        </div>
      </header>

      {/* ================= PROMO BANNER ================= */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="bg-[#3b4652] text-white rounded px-6 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-green-400">✔</span>
            <span>Congratulations, your discount has been applied.</span>
          </div>

          <div className="mt-1 text-gray-200">
            You have{" "}
            <span className="text-yellow-400 font-semibold">
              {minutes}:{seconds}
            </span>{" "}
            left to take advantage of this offer. Valid on{" "}
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-[1180px] mx-auto grid grid-cols-12 gap-8 py-8">
        {/* ================= LEFT COLUMN ================= */}
        <section className="col-span-7">
          {/* <div className="bg-white border rounded p-6 space-y-6"> */}
          <div className="lg:col-span-2 space-y-8">

           
            {/* CLIENT STEP */}
            
            <ClientStep
              active={activeStep === "client"}
              data={clientData}
              onContinue={(data) => {
                setClientData(data);
                setActiveStep("delivery");
              }}
              onEdit={() => setActiveStep("client")}
              isDisabled={activeStep !== "client"}
              cart = {cart}
            />
            

            {/* DELIVERY STEP */}
         
            {/* <ShippingStep
              active={activeStep === "delivery"}
              data={deliveryData}
              onContinue={(data) => {
                setDeliveryData(data);
                setActiveStep("payment");
              }}
              onEdit={() => setActiveStep("delivery")}
              isDisabled={activeStep !== "delivery"}
            />  */}
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
              cart = {cart}
            />

            

            {/* PAYMENT STEP */}
            
            <PaymentStep 
              active={activeStep === "payment"} 
              data={paymentData}
              onContinue={(data) => setPaymentData(data)}
              isDisabled={activeStep !== "payment"}
              cart = {cart}
            />

            
            {activeStep === "payment" && (
              <>
                <button
                  type="button"
                  className="w-full bg-[#2fb34a] hover:bg-[#28a745] transition text-white font-semibold py-3 rounded"
                >
                  PLACE AN ORDER
                </button>

                {/* SECURITY TEXT */}
                <div className="text-xs text-gray-600 text-center mt-3">
                  🔒 Secure 256-bit SSL encryption
                </div>

                {/* TRUST BADGES */}
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
          <OrderSummary deliveryPrice={deliveryData?.price ?? 0} cart={cart}/>
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


