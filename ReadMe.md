SubscriptionCustomer = customer mapping

CustomerSubscription = actual recurring subscription record


CheckoutLayout: Payment success check:

 {activeStep === "payment" && (
    <>
    {/* Auto-processing indicator - shown when payment succeeded */}
    {paymentData?.status === "SUCCEEDED" && (
        <div className="w-full bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <div className="flex items-center gap-3">
            {isPlacingOrder ? (
            <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Processing your order...</span>
            </>
            ) : (
            <>
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-green-800 font-medium">Payment confirmed! Order is being processed.</span>
            </>
            )}
        </div>
        </div>
    )}

    {/* Original button - now only shown BEFORE payment success */}
    {paymentData?.status !== "SUCCEEDED" && (
        <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder || isVipLoading || paymentData?.status !== "SUCCEEDED"}
        className={`w-full cursor-pointer ${
            isPlacingOrder || paymentData?.status !== "SUCCEEDED"
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#2fb34a] hover:bg-[#28a745]'
        } transition text-white font-semibold py-3 rounded flex items-center justify-center gap-2`}
        >
        {isPlacingOrder ? (
            <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            PROCESSING ORDER...
            </>
        ) : (
            'PLACE AN ORDER'
        )}
        </button>
    )}

    {/* Security badges - always show */}
    <div className="text-xs text-gray-600 text-center mt-3 flex items-center gap-[5px] justify-center">
        <img src="../images/ssl.webp" alt="lock" className="h-[15px]" />
        Secure 256-bit SSL encryption
    </div>
    <div className="flex justify-center gap-6 mt-4">
        <img src="../images/payment-icon-new.webp" alt="Payment security" className="h-[50px]" />
    </div>

    {/* VIP/Warranty section */}
    <div className="nr-wrranty-wr py-[10px] px-[12px] border border-[#ccc]">
        {/* ... your existing VIP checkbox code ... */}
    </div>
    </>
)}