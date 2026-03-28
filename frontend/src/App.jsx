import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
// import Customers from './pages/Customers';
import SellingPlans from './pages/SellingPlans';
import CreatePlan from './pages/CreatePlan';
import Checkout from './pages/Checkout';
import ThankYou from "./pages/ThankYou";

function Layout() {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const hideSidebar = location.pathname === '/thank-you';

  const [environment, setEnvironment] = useState(
    () => localStorage.getItem('adminEnvironment') || 'sandbox'
  );

  const handleEnvironmentChange = (env) => {
    setEnvironment(env);
    localStorage.setItem('adminEnvironment', env);
  };

  return (
    <div className="flex min-h-screen">
      {!isCheckout && !hideSidebar && <Sidebar />}

      <main
        className={`flex-1 ${
          isCheckout
            ? 'p-0 bg-white'
            : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 p-8'
        }`}
      >
        {!isCheckout && !hideSidebar && (
          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2 text-sm">
              <span className="text-gray-500 font-medium">Environment:</span>
              <button
                onClick={() => handleEnvironmentChange('sandbox')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  environment === 'sandbox'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Sandbox
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleEnvironmentChange('live')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  environment === 'live'
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Live
              </button>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard environment={environment} />} />
          <Route path="/dashboard" element={<Dashboard environment={environment} />} />
          <Route path="/subscriptions" element={<Subscriptions environment={environment} />} />
          {/* <Route path="/customers" element={<Customers />} /> */}
          <Route
            path="/selling-plans"
            element={<SellingPlans environment={environment} />}
          />
          <Route path="/subscription-plan" element={<CreatePlan />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
