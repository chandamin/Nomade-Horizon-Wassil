import React, { useState } from "react";


const API = `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans`

const Checkout = () => {
  const [email, setEmail] = useState("");

  const handleSubscribeClick = async (priceId, requestId) => {
    // Basic validation
    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      const res = await fetch(`${API}/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, priceId, requestId }),
      });

      const data = await res.json();

      // Redirect to Airwallex hosted checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      <h1>Pick a subscription plan</h1>

      <form
        onSubmit={(e) => e.preventDefault()}
        id="subscribe-form"
      >
        <label htmlFor="email">Work email</label>
        <br />
        <input
          id="email"
          type="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="plans">
          <div className="plan">
            <h3>Basic</h3>
            <div className="price">$14 / month</div>
            <p>Core features • 30-day free trial</p>
            <button
              type="button"
              className="subscribe-btn"
              onClick={() =>
                handleSubscribeClick(
                  "pri_hkdmvffznheve7flwx3",
                  "d6b780dd-7f54-4ad1-a622-bd8ac86c821c"
                )
              }
            >
              Subscribe to Basic
            </button>
          </div>

          
        </div>
      </form>
    </div>
  );
};

export default Checkout;
