import { useEffect, useMemo, useState } from 'react'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/subscriptions`

export default function Subscriptions() {
  const [subs, setSubs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(API_BASE, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch subscriptions')
      }

      setSubs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const setRowLoading = (id, value) => {
    setActionLoading(prev => ({ ...prev, [id]: value }))
  }

  const syncSubscription = async (id) => {
    try {
      setRowLoading(id, true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE}/${id}/sync`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || data?.details || 'Failed to sync subscription')
      }

      if (data?.subscription) {
        setSubs(prev =>
          prev.map(sub => (sub._id === id ? data.subscription : sub))
        )
      }

      setSuccess('Subscription synced successfully')
    } catch (err) {
      setError(err.message || 'Failed to sync subscription')
    } finally {
      setRowLoading(id, false)
    }
  }

  const cancelSubscription = async (id) => {
    try {
      setRowLoading(id, true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE}/${id}/cancel`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || data?.details || 'Failed to cancel subscription')
      }

      if (data?.subscription) {
        setSubs(prev =>
          prev.map(sub => (sub._id === id ? data.subscription : sub))
        )
      } else {
        await loadSubscriptions()
      }

      setSuccess('Subscription cancelled successfully')
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription')
    } finally {
      setRowLoading(id, false)
    }
  }

  const syncOrders = async (id) => {
    try {
      setRowLoading(id, true)
      setError('')
      setSuccess('')

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/sync-orders/${id}`,
        {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to sync orders')
      }

      setSubs(prev =>
        prev.map(sub => (sub._id === data._id ? data : sub))
      )

      setSuccess('Orders synced successfully')
    } catch (err) {
      setError(err.message || 'Failed to sync orders')
    } finally {
      setRowLoading(id, false)
    }
  }

  const filteredSubs = useMemo(() => {
    return subs.filter(sub => {
      const email = sub.customerEmail || ''
      const plan = sub.plan || ''
      const externalId = sub.externalSubscriptionId || ''

      const q = search.toLowerCase()

      return (
        email.toLowerCase().includes(q) ||
        plan.toLowerCase().includes(q) ||
        externalId.toLowerCase().includes(q)
      )
    })
  }, [subs, search])

  if (loading) {
    return <p className="text-gray-500 animate-pulse">Loading subscriptions…</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Subscriptions</h1>
        <p className="text-gray-500 mt-1">
          Manage customer subscriptions and sync with Airwallex
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by customer email, plan, or Airwallex subscription id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <button
          onClick={loadSubscriptions}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 transition"
        >
          Refresh List
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>External ID</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredSubs.length > 0 ? (
              filteredSubs.map(sub => {
                const busy = !!actionLoading[sub._id]

                return (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <TableCell>{sub.customerEmail || '-'}</TableCell>
                    <TableCell>{sub.plan || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 break-all">
                        {sub.externalSubscriptionId || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {sub?.metadata?.nextBillingAt
                        ? new Date(sub.metadata.nextBillingAt).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn
                          color="blue"
                          disabled={busy}
                          onClick={() => syncSubscription(sub._id)}
                        >
                          {busy ? 'Working...' : 'Sync'}
                        </ActionBtn>

                        {sub.status !== 'cancelled' && (
                          <ActionBtn
                            color="red"
                            disabled={busy}
                            onClick={() => cancelSubscription(sub._id)}
                          >
                            {busy ? 'Working...' : 'Cancel'}
                          </ActionBtn>
                        )}

                        <ActionBtn
                          color="indigo"
                          disabled={busy}
                          onClick={() => syncOrders(sub._id)}
                        >
                          {busy ? 'Working...' : 'Sync Orders'}
                        </ActionBtn>
                      </div>
                    </TableCell>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
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
    <td className="px-6 py-4 text-sm text-gray-700 align-top">
      {children}
    </td>
  )
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    pending_payment: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status || 'unknown'}
    </span>
  )
}

function ActionBtn({ color, children, disabled, ...props }) {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    red: 'bg-red-500 hover:bg-red-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
  }

  return (
    <button
      {...props}
      disabled={disabled}
      className={`px-3 py-1 text-white text-xs rounded transition ${
        colors[color]
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}