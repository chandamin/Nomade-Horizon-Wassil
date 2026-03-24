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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar only if NOT checkout */}
      {!isCheckout && !hideSidebar && <Sidebar />}

      <main
        className={`flex-1 ${
          isCheckout
            ? 'p-0 bg-white'
            : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 p-8'
        }`}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          {/* <Route path="/customers" element={<Customers />} /> */}
          <Route
            path="/selling-plans"
            element={<SellingPlans />}
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
