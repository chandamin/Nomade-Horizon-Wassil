// import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
// import { useState, useEffect} from 'react'
// import Sidebar from './components/Sidebar'

// import Dashboard from './pages/Dashboard'
// import Subscriptions from './pages/Subscriptions'
// import Customers from './pages/Customers'
// import SellingPlans from './pages/SellingPlans'
// import CreatePlan from './pages/CreatePlan';
// import Checkout from './pages/Checkout';

// import axios from 'axios';


// function App() {

//   const [environment, setEnvironment] = useState(localStorage.getItem('environment') || 'sandbox');

//   // Dynamically set the API base URL based on the environment
//   const apiUrl = environment === 'live'
//     ? 'https://api.airwallex.com/api/v1' // Live API endpoint
//     : 'https://api-demo.airwallex.com/api/v1'; // Sandbox API endpoint

//   // Example of how to fetch plans based on environment
//   // const fetchPlans = async () => {
//   //   try {
//   //     const response = await axios.get(`${apiUrl}/plans`);
//   //     console.log('Plans:', response.data);
//   //   } catch (error) {
//   //     console.error('Error fetching plans:', error);
//   //   }
//   // };

//   // UseEffect to trigger plan fetch when environment changes
//   useEffect(() => {
//     // fetchPlans();
//   }, [environment]);
//   const location = useLocation();
//   const isCheckout = location.pathname === '/checkout';

//   return (
//     <BrowserRouter>
//       <div className="flex min-h-screen">
//         {/* Sidebar */}
//         {/* Sidebar only if NOT checkout */}
//       {!isCheckout && <Sidebar />}
//         <Sidebar setEnvironment={setEnvironment}/>

//         {/* Main Content */}
//         {/* <main className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 p-8"> */}
//         <main
//           className={`flex-1 ${
//             isCheckout
//               ? 'p-0 bg-white'
//               : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 p-8'
//           }`}
//         >
//           <Routes>
//             <Route path="/" element={<Dashboard />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/subscriptions" element={<Subscriptions />} />
//             <Route path="/customers" element={<Customers />} />
//             <Route path="/selling-plans" element={<SellingPlans environment={environment} />} />
//             <Route path='/subscription-plan' element={<CreatePlan/>} />
//             <Route path='/checkout' element={<Checkout/>} />
//             {/* <Route path='/checkout' element={<Checkout/>}/> */}
//           </Routes>
//         </main>
//       </div>
//     </BrowserRouter>
//   )
// }

// export default App


import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import Customers from './pages/Customers';
import SellingPlans from './pages/SellingPlans';
import CreatePlan from './pages/CreatePlan';
import Checkout from './pages/Checkout';

function Layout() {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar only if NOT checkout */}
      {!isCheckout && <Sidebar />}

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
          <Route path="/customers" element={<Customers />} />
          <Route
            path="/selling-plans"
            element={<SellingPlans />}
          />
          <Route path="/subscription-plan" element={<CreatePlan />} />
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
