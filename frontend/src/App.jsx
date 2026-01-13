// import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
// import Dashboard from './pages/Dashboard'
// import Subscriptions from './pages/Subscriptions'

// function App() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#DBF3FA] via-[#B7E9F7] to-[#7AD7F0]">
//       <BrowserRouter>
//         {/* Navbar matches the page gradient */}
//         <nav className="bg-gradient-to-br from-[#DBF3FA] via-[#B7E9F7] to-[#7AD7F0] shadow-md px-8 py-4 flex items-center justify-between backdrop-blur-sm">
//           {/* Logo */}
//           <div className="text-blue-800 text-xl font-bold">Ascend - Manage Subscriptions at your convenience </div>

//           {/* Links */}
//           <div className="flex space-x-6">
//             <NavLink
//               to="/subscriptions"
//               className={({ isActive }) =>
//                 `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//                   isActive
//                     ? 'bg-blue-200 text-blue-900'
//                     : 'text-blue-800 hover:bg-blue-100 hover:text-blue-900'
//                 }`
//               }
//             >
//               Subscriptions
//             </NavLink>

//             <NavLink
//               to="/dashboard"
//               className={({ isActive }) =>
//                 `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//                   isActive
//                     ? 'bg-blue-200 text-blue-900'
//                     : 'text-blue-800 hover:bg-blue-100 hover:text-blue-900'
//                 }`
//               }
//             >
//               Dashboard
//             </NavLink>
//           </div>
//         </nav>

//         {/* Routes */}
//         <Routes>
//           <Route path="/subscriptions" element={<Subscriptions />} />
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/" element={<Dashboard />} />
//         </Routes>
//       </BrowserRouter>
//     </div>
//   )
// }

// export default App


import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'

import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import Customers from './pages/Customers'
import SellingPlans from './pages/SellingPlans'
import CreatePlan from './pages/CreatePlan'

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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
