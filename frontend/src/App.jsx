

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'

import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Customers from './pages/Customers'
import SellingPlans from './pages/SellingPlans'
import CreatePlan from './pages/CreatePlan';
import Checkout from './pages/Checkout';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/selling-plans" element={<SellingPlans />} />
            <Route path='/subscription-plan' element={<CreatePlan/>} />
            <Route path='/checkout' element={<Checkout/>} />
            {/* <Route path='/checkout' element={<Checkout/>}/> */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
