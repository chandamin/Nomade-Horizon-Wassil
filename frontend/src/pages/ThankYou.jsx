import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function ThankYou() {
  const { state } = useLocation();
  const order = state || {};

  const storeUrl = "https://kasweb-c4.mybigcommerce.com/";

  useEffect(() => {
    // If orderId missing → redirect immediately
    if (!order?.orderId) {
      window.location.href = storeUrl;
      return;
    }

    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      window.location.href = storeUrl;
    }, 10000);

    return () => clearTimeout(timer);
  }, [order]);

  if (!order?.orderId) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full text-center">

        <div className="text-green-600 text-4xl mb-4">✅</div>

        <h1 className="text-2xl font-bold mb-2">
          Payment Successful
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for your order!
        </p>

        <div className="border rounded p-4 bg-gray-50 mb-6 text-left">

          <p className="text-sm mb-2">
            <strong>Order ID:</strong> {order.orderId}
          </p>

          <p className="text-sm mb-2">
            <strong>Price:</strong> {order.amount} {order.currency}
          </p>

          <p className="text-sm">
            <strong>Email:</strong> {order.email}
          </p>

        </div>

        <button
          onClick={() => (window.location.href = storeUrl)}
          className="bg-black text-white px-6 py-2 rounded"
        >
          Shop Now
        </button>

        <p className="text-xs text-gray-500 mt-4">
          You will be redirected to the store in 10 seconds.
        </p>

      </div>
    </div>
  );
}