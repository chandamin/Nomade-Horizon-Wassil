// src/components/ConsentBanner.jsx
import { useState, useEffect } from "react";

export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only show if no consent decision has been stored yet
    const stored = localStorage.getItem("nh_analytics_consent");
    if (stored === null) {
      setIsVisible(true);
    }
    setIsLoaded(true);
  }, []);

  const handleConsent = (granted) => {
    localStorage.setItem("nh_analytics_consent", granted ? "granted" : "denied");
    setIsVisible(false);
    // Optional: reload page to apply consent state globally
    // window.location.reload(); 
  };

  if (!isLoaded || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-gray-200 p-4 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-700">
          We use cookies to personalize content and analyze site traffic. 
          Do you allow analytics tracking for your order?
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => handleConsent(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            onClick={() => handleConsent(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2fb34a] rounded hover:bg-[#28a745]"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}