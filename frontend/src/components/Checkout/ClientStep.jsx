import { useState, useEffect } from "react";

export default function ClientStep({
  active,
  data,
  onContinue,
  onEdit,
  isDisabled,
  cart,
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Pre-fill when coming back to edit
  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  // Basic email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Check email in real-time as user types
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setForm({ ...form, email: newEmail });
    
    // Clear error if email is being corrected
    if (emailError && validateEmail(newEmail)) {
      setEmailError("");
    }
  };

  // Validate before continuing
  const handleContinue = async () => {
    // Validate required fields
    if (!form.email) {
      setEmailError("Email is required");
      return;
    }
    
    if (!validateEmail(form.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    // Set loading state
    setLoading(true);
    setIsValidating(true);
    
    try {
      // Small delay to show loading state (optional)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if email exists in BigCommerce
      const emailCheck = await checkEmailExists(form.email);
      
      if (!emailCheck.valid) {
        setEmailError(emailCheck.message);
        setLoading(false);
        setIsValidating(false);
        return;
      }
      
      // All validations passed, continue to next step
      onContinue(form);
      
    } catch (error) {
      console.error('Validation error:', error);
      setEmailError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  // Check if email exists in BigCommerce
  const checkEmailExists = async (email) => {
    try {
      const response = await fetch(
        `https://unpenciled-unhumored-thora.ngrok-free.dev/api/customers/search?email=${encodeURIComponent(email)}`
      );
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.exists) {
          return {
            valid: false,
            message: "An account already exists with this email. Please use a different email or log in."
          };
        }
        
        return { valid: true };
      }
      
      // If API fails, still allow checkout but warn user
      console.warn('Email check API failed, continuing anyway');
      return { valid: true };
      
    } catch (error) {
      console.error('Email check error:', error);
      // Don't block checkout if API is down
      return { valid: true };
    }
  };

  /* ================= COLLAPSED VIEW ================= */
  if (!active && data && data.email) {
    return (
      <section className="border-b pb-4">
        <Header step={1} title="Client" onEdit={onEdit} />
        <div className="pl-8 text-sm text-gray-700">
          {data.email}
          {data.firstName && data.lastName && (
            <div className="mt-1">
              {data.firstName} {data.lastName}
            </div>
          )}
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
            disabled={loading || isDisabled}
          />
          <label htmlFor="prénom" className="nr-input-label text-[14px] text-[#666] top-[unset]">
            Prénom
          </label>
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
            disabled={loading || isDisabled}
          />
          <label htmlFor="nom" className="nr-input-label text-[14px] text-[#666] top-[unset]">
            Nom
          </label>
        </div>
        
        <div className="nr-input-field flex flex-col-reverse col-span-2">
          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleEmailChange}
            onBlur={() => {
              if (form.email && !validateEmail(form.email)) {
                setEmailError("Please enter a valid email address");
              }
            }}
            id="email-address"
            className={`outline-none text-[#333] border rounded px-3 py-2 text-sm pb-0 h-[48px] ${
              emailError ? 'border-red-500' : ''
            } ${isValidating ? 'border-blue-300' : ''}`}
            disabled={loading || isDisabled}
          />
          <label htmlFor="email-address" className="nr-input-label text-[14px] text-[#666] top-[unset]">
            Email Address
          </label>
          
          {emailError && (
            <div className="text-xs text-red-600 mt-1">{emailError}</div>
          )}
          
          {isValidating && !emailError && (
            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
              <span>Checking email availability...</span>
            </div>
          )}
          
          {!emailError && form.email && validateEmail(form.email) && !isValidating && (
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span>✓</span>
              <span>Email looks good</span>
            </div>
          )}
        </div>
      </div>

      <button 
        type="button"
        className="nr-fir-st-btn cursor-pointer inline-block mt-4 bg-[#2fb34a] hover:bg-[#28a745] transition text-white text-sm font-semibold px-6 py-[15px] rounded w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleContinue}
        disabled={!form.email || !!emailError || loading || isDisabled}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            Processing...
          </span>
        ) : (
          'CONTINUER'
        )}
      </button>
      
      <div className="mt-3 text-xs text-gray-600">
        <p>By continuing, you'll create an account with this email.</p>
        <p>A password will be automatically generated and sent to you.</p>
      </div>
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