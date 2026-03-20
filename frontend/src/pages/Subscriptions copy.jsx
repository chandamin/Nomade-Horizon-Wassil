import { useEffect, useState } from 'react'

export default function Subscriptions() {
  const [subs, setSubs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/subscriptions`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    })
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


