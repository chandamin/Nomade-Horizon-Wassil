// import { useEffect, useState } from 'react';

// export default function Subscriptions() {
//   const [subs, setSubs] = useState([]);
//   const [search, setSearch] = useState('');

//   useEffect(() => {
//     fetch(`${import.meta.env.VITE_BACKEND_URL}/api/subscriptions`)
//       .then(res => res.json())
//       .then(setSubs);
//   }, []);

//   const updateStatus = async (id, status) => {
//     const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/subscriptions/${id}`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ status }),
//     });
//     const updated = await res.json();
//     setSubs(prev => prev.map(s => (s._id === updated._id ? updated : s)));
//   };

//   const syncOrders = async (_id) => {
//     const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sync-orders/${_id}`, { method: 'POST' });
//     const updated = await res.json();
//     setSubs(prev => prev.map(s => (s._id === updated._id ? updated : s)));
//   };

//   // Filter subscriptions by customer email
//   const filteredSubs = subs.filter(sub => sub.customerEmail.toLowerCase().includes(search.toLowerCase()));

//   const STATUS_ACTIONS = {
//     active: ['paused', 'cancelled'],
//     paused: ['active', 'cancelled'],
//     cancelled: ['active'], // or [] if cancelled should be final
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#DBF3FA] via-[#B7E9F7] to-[#7AD7F0] p-6">
//       <h1 className="text-3xl font-semibold text-slate-900 mb-6">Subscriptions</h1>

//       {/* Search */}
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search by customer email..."
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
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Email</th>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Plan</th>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Status</th>
//               <th className="px-6 py-3 text-left text-sm font-semibold text-blue-900 uppercase">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {filteredSubs.length > 0 ? (
//               filteredSubs.map(sub => (
//                 <tr key={sub._id} className="hover:bg-blue-50 transition-colors">
//                   <td className="px-6 py-3">{sub.customerEmail}</td>
//                   <td className="px-6 py-3">{sub.plan}</td>
//                   <td className="px-6 py-3">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                         sub.status === 'active'
//                           ? 'bg-green-100 text-green-800'
//                           : sub.status === 'paused'
//                           ? 'bg-yellow-100 text-yellow-800'
//                           : 'bg-red-100 text-red-800'
//                       }`}
//                     >
//                       {sub.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-3 space-x-2 flex flex-wrap">

//                     {STATUS_ACTIONS[sub.status]?.includes('active') && (
//                     <button
//                       onClick={() => updateStatus(sub._id, 'active')}
//                       className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
//                     >
//                       Activate
//                     </button>
//                     )}

//                     {STATUS_ACTIONS[sub.status]?.includes('paused') && (
//                     <button
//                       onClick={() => updateStatus(sub._id, 'paused')}
//                       className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
//                     >
//                       Pause
//                     </button>
//                     )}

//                     {STATUS_ACTIONS[sub.status]?.includes('cancelled') && (
//                     <button
//                       onClick={() => updateStatus(sub._id, 'cancelled')}
//                       className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
//                     >
//                       Cancel
//                     </button>
//                     )}
//                     <button
//                       onClick={() => syncOrders(sub._id)}
//                       className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
//                     >
//                       Sync Orders
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="4" className="px-6 py-3 text-center text-gray-500">
//                   No subscriptions found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Mobile-friendly cards */}
//       <div className="md:hidden mt-6 space-y-4">
//         {filteredSubs.map(sub => (
//           <div key={sub._id} className="bg-white/80 backdrop-blur-md p-4 rounded-lg shadow hover:shadow-lg transition">
//             <p className="font-semibold text-blue-900">{sub.customerEmail}</p>
//             <p>Plan: {sub.plan}</p>
//             <p>
//               Status:{' '}
//               <span
//                 className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                   sub.status === 'active'
//                     ? 'bg-green-100 text-green-800'
//                     : sub.status === 'paused'
//                     ? 'bg-yellow-100 text-yellow-800'
//                     : 'bg-red-100 text-red-800'
//                 }`}
//               >
//                 {sub.status}
//               </span>
//             </p>
//             <div className="flex flex-wrap gap-2 mt-2">

//               {STATUS_ACTIONS[sub.status]?.includes('active') && (
//               <button
//                 onClick={() => updateStatus(sub._id, 'active')}
//                 className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
//               >
//                 Activate
//               </button>
//               )}

//               {STATUS_ACTIONS[sub.status]?.includes('paused') && (
//               <button
//                 onClick={() => updateStatus(sub._id, 'paused')}
//                 className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
//               >
//                 Pause
//               </button>
//               )}

//               {STATUS_ACTIONS[sub.status]?.includes('cancelled')}
//               <button
//                 onClick={() => updateStatus(sub._id, 'cancelled')}
//                 className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => syncOrders(sub._id)}
//                 className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
//               >
//                 Sync Orders
//               </button>
//             </div>
//             {sub.orders?.length > 0 && (
//               <ul className="mt-2 text-sm text-gray-700">
//                 {sub.orders.map(o => (
//                   <li key={o.orderId}>
//                     Order #{o.orderNumber} — £{o.total}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from 'react'

export default function Subscriptions() {
  const [subs, setSubs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/subscriptions`)
      .then(res => res.json())
      .then(data => {
        setSubs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/subscriptions/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    )
    const updated = await res.json()
    setSubs(prev => prev.map(s => (s._id === updated._id ? updated : s)))
  }

  const syncOrders = async (_id) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/sync-orders/${_id}`,
      { method: 'POST' }
    )
    const updated = await res.json()
    setSubs(prev => prev.map(s => (s._id === updated._id ? updated : s)))
  }

  const filteredSubs = subs.filter(sub =>
    sub.customerEmail.toLowerCase().includes(search.toLowerCase())
  )

  const STATUS_ACTIONS = {
    active: ['paused', 'cancelled'],
    paused: ['active', 'cancelled'],
    cancelled: ['active'],
  }

  if (loading) {
    return <p className="text-gray-500 animate-pulse">Loading subscriptions…</p>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Subscriptions
        </h1>
        <p className="text-gray-500 mt-1">
          Manage customer subscriptions and sync orders
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by customer email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubs.length > 0 ? (
              filteredSubs.map(sub => (
                <tr key={sub._id} className="hover:bg-gray-50">
                  <TableCell>{sub.customerEmail}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell>
                    <StatusBadge status={sub.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_ACTIONS[sub.status]?.includes('active') && (
                        <ActionBtn
                          color="green"
                          onClick={() => updateStatus(sub._id, 'active')}
                        >
                          Activate
                        </ActionBtn>
                      )}

                      {STATUS_ACTIONS[sub.status]?.includes('paused') && (
                        <ActionBtn
                          color="yellow"
                          onClick={() => updateStatus(sub._id, 'paused')}
                        >
                          Pause
                        </ActionBtn>
                      )}

                      {STATUS_ACTIONS[sub.status]?.includes('cancelled') && (
                        <ActionBtn
                          color="red"
                          onClick={() => updateStatus(sub._id, 'cancelled')}
                        >
                          Cancel
                        </ActionBtn>
                      )}

                      <ActionBtn
                        color="blue"
                        onClick={() => syncOrders(sub._id)}
                      >
                        Sync Orders
                      </ActionBtn>
                    </div>
                  </TableCell>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-6 text-gray-500"
                >
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- UI Components ---------- */

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

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function ActionBtn({ color, children, ...props }) {
  const colors = {
    green: 'bg-green-500 hover:bg-green-600',
    yellow: 'bg-yellow-400 hover:bg-yellow-500',
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  }

  return (
    <button
      {...props}
      className={`px-3 py-1 text-white text-xs rounded transition ${colors[color]}`}
    >
      {children}
    </button>
  )
}


