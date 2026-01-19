import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // useEffect(() => {
  //   fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`)
  //     .then((res) => {
  //       if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`)
  //       return res.text()
  //     })
  //     .then((text) => {
  //       try {
  //         const jsonData = JSON.parse(text)
  //         setData(jsonData)
  //       } catch (e) {
  //         console.error('Error parsing JSON:', e)
  //         setError(`Invalid JSON response. Raw response: ${text}`)
  //       }
  //     })
  //     .catch((err) => {
  //       console.error('Error fetching data:', err)
  //       setError(`Failed to fetch data. ${err.message}`)
  //     })
  // }, [])
  useEffect(() => {
  fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, {
  // fetch("/api/dashboard", {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`)
      }
      return res.json()
    })
    .then((jsonData) => {
      setData(jsonData)
    })
    .catch((err) => {
      console.error('Error fetching data:', err)
      setError(`Failed to fetch data. ${err.message}`)
    })
}, [])


  /* Loading */
  if (!data && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 animate-pulse">
          Loading dashboard…
        </p>
      </div>
    )
  }

  /* Error */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    )
  }

  const filteredActivity = data.recentActivity.filter((row) =>
    row.customer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Overview of subscriptions and recent activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Subscribers"
          value={data.stats.totalSubscribers}
        />
        <StatCard
          label="Active"
          value={data.stats.activeSubscriptions}
        />
        <StatCard
          label="Paused"
          value={data.stats.pausedSubscriptions}
        />
        <StatCard
          label="Cancelled"
          value={data.stats.cancelledSubscriptions}
        />
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <TableHead>Customer</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Date</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.plan}</TableCell>
                  <TableCell>{row.date}</TableCell>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-500"
                >
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Reusable Components ---------- */

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">
        {value}
      </p>
    </div>
  )
}

function TableHead({ children }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
      {children}
    </th>
  )
}

function TableCell({ children }) {
  return (
    <td className="px-6 py-4 text-sm text-gray-700">
      {children}
    </td>
  )
}



// import { useEffect, useState } from 'react';

// export default function Dashboard() {
//   const [data, setData] = useState(null);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');

//   useEffect(() => {
//     fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`)
//       .then((res) => {
//         if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
//         return res.text();
//       })
//       .then((text) => {
//         try {
//           const jsonData = JSON.parse(text);
//           setData(jsonData);
//         } catch (e) {
//           console.error('Error parsing JSON:', e);
//           setError(`The response is not valid JSON. Raw response: ${text}`);
//         }
//       })
//       .catch((err) => {
//         console.error('Error fetching data:', err);
//         setError(`Failed to fetch data. Please try again later. ${err.message}`);
//       });
//   }, []);

//   // Loading state
//   if (!data && !error)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DBF3FA] via-[#B7E9F7] to-[#7AD7F0]">
//         <p className="text-slate-700 animate-pulse">Loading dashboard…</p>
//       </div>
//     );

//   // Error state
//   if (error)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DBF3FA] via-[#B7E9F7] to-[#7AD7F0]">
//         <p className="text-red-600">{error}</p>
//       </div>
//     );

//   // Filter recent activity
//   const filteredActivity = data.recentActivity.filter((row) =>
//     row.customer.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#DBF3FA] via-[#B7E9F7] to-[#7AD7F0] p-8">
//       <h1 className="text-3xl font-semibold text-slate-900 mb-6">
//         Subscription Dashboard
//       </h1>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <div className="bg-white/80 backdrop-blur-md p-4 rounded-lg shadow hover:shadow-lg transition">
//           <p className="text-gray-600 font-medium">Total Subscribers</p>
//           <p className="text-xl font-bold">{data.stats.totalSubscribers}</p>
//         </div>
//         <div className="bg-white/80 backdrop-blur-md p-4 rounded-lg shadow hover:shadow-lg transition">
//           <p className="text-gray-600 font-medium">Active</p>
//           <p className="text-xl font-bold">{data.stats.activeSubscriptions}</p>
//         </div>
//         <div className="bg-white/80 backdrop-blur-md p-4 rounded-lg shadow hover:shadow-lg transition">
//           <p className="text-gray-600 font-medium">Paused</p>
//           <p className="text-xl font-bold">{data.stats.pausedSubscriptions}</p>
//         </div>
//         <div className="bg-white/80 backdrop-blur-md p-4 rounded-lg shadow hover:shadow-lg transition">
//           <p className="text-gray-600 font-medium">Cancelled</p>
//           <p className="text-xl font-bold">{data.stats.cancelledSubscriptions}</p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search by customer..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
//         />
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto rounded-lg shadow-lg">
//         <table className="min-w-full bg-white/80 backdrop-blur-md divide-y divide-gray-200">
//           <thead className="bg-blue-100">
//             <tr>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Customer</th>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Action</th>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Plan</th>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Date</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredActivity.length > 0 ? (
//               filteredActivity.map((row, i) => (
//                 <tr
//                   key={i}
//                   className="hover:bg-blue-50 transition-colors"
//                 >
//                   <td className="px-6 py-3">{row.customer}</td>
//                   <td className="px-6 py-3">{row.action}</td>
//                   <td className="px-6 py-3">{row.plan}</td>
//                   <td className="px-6 py-3">{row.date}</td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="4" className="px-6 py-3 text-center text-gray-500">
//                   No matching records found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

