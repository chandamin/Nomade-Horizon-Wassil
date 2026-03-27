import { useEffect, useMemo, useState } from 'react'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/subscriptions`

export default function Subscriptions() {
  const [subs, setSubs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  //  Cancel modal state
  const [cancelModal, setCancelModal] = useState({ 
    open: false, 
    subscriptionId: null,
    subscription: null 
  })
  
  //  NEW: Edit modal state
  const [editModal, setEditModal] = useState({ 
    open: false, 
    subscriptionId: null,
    subscription: null 
  })

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

  //  UPDATED: Cancel subscription with proration_behavior
  const cancelSubscription = async (id, prorationBehavior = 'PRORATED') => {
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
        body: JSON.stringify({ 
          proration_behavior: prorationBehavior
        }),
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

  //  NEW: Update subscription function
  const updateSubscription = async (id, updatePayload) => {
    try {
      setRowLoading(id, true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE}/${id}/update`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || data?.details || 'Failed to update subscription')
      }

      // Update local state with updated subscription
      if (data?.subscription) {
        setSubs(prev =>
          prev.map(sub => (sub._id === id ? data.subscription : sub))
        )
      }

      setSuccess('Subscription updated successfully')
      return true
    } catch (err) {
      setError(err.message || 'Failed to update subscription')
      return false
    } finally {
      setRowLoading(id, false)
    }
  }

  //  NEW: Handle edit form submission
  const handleEditSubmit = async (subscriptionId, formData) => {
    // Build payload with only changed fields
    const payload = {}
    
    if (formData.cancel_at_period_end !== undefined) {
      payload.cancel_at_period_end = formData.cancel_at_period_end
    }
    
    if (formData.collection_method) {
      payload.collection_method = formData.collection_method
    }
    
    if (formData.trial_ends_at) {
      // Support 'NOW' to end trial immediately
      payload.trial_ends_at = formData.trial_ends_at === 'NOW' 
        ? 'NOW' 
        : new Date(formData.trial_ends_at).toISOString()
    }
    
    if (formData.days_until_due !== undefined) {
      payload.days_until_due = Number(formData.days_until_due)
    }
    
    if (formData.default_tax_percent !== undefined) {
      payload.default_tax_percent = Number(formData.default_tax_percent)
    }

    const success = await updateSubscription(subscriptionId, payload)
    
    if (success) {
      setEditModal({ open: false, subscriptionId: null, subscription: null })
    }
  }

  const filteredSubs = useMemo(() => {
    return subs.filter(sub => {
      const email = sub.customerEmail || ''
      const plan = sub.planName || ''
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
    return <div className="p-8 text-center text-gray-500">Loading subscriptions…</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage customer subscriptions and sync with Airwallex
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
          {success}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
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
                    <TableCell>{sub.planName || '-'}</TableCell>
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
                        : sub?.nextBillingAt 
                        ? new Date(sub.nextBillingAt).toLocaleString()
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

                        {/*  NEW: Edit button */}
                        {sub.status !== 'cancelled' && (
                          <ActionBtn
                            color="indigo"
                            disabled={busy}
                            onClick={() => setEditModal({ 
                              open: true, 
                              subscriptionId: sub._id,
                              subscription: sub 
                            })}
                          >
                            {busy ? 'Working...' : 'Edit'}
                          </ActionBtn>
                        )}

                        {sub.status !== 'cancelled' && (
                          <ActionBtn
                            color="red"
                            disabled={busy}
                            onClick={() => setCancelModal({ 
                              open: true, 
                              subscriptionId: sub._id,
                              subscription: sub 
                            })}
                          >
                            {busy ? 'Working...' : 'Cancel'}
                          </ActionBtn>
                        )}

                        {/* <ActionBtn
                          color="indigo"
                          disabled={busy}
                          onClick={() => syncOrders(sub._id)}
                        >
                          {busy ? 'Working...' : 'Sync Orders'}
                        </ActionBtn> */}
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

      {/*  Cancel Modal */}
      {cancelModal.open && (
        <CancelModal
          subscription={cancelModal.subscription}
          onClose={() => setCancelModal({ open: false, subscriptionId: null, subscription: null })}
          onConfirm={async (proration) => {
            await cancelSubscription(cancelModal.subscriptionId, proration)
            setCancelModal({ open: false, subscriptionId: null, subscription: null })
          }}
        />
      )}

      {/*  NEW: Edit Modal */}
      {editModal.open && (
        <EditSubscriptionModal
          subscription={editModal.subscription}
          onClose={() => setEditModal({ open: false, subscriptionId: null, subscription: null })}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  )
}

/* ---------- UI Components ---------- */

function TableHead({ children }) {
  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  )
}

function TableCell({ children }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {children}
    </td>
  )
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
    pending_payment: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
    trialing: { label: 'In Trial', className: 'bg-blue-100 text-blue-800' },
    active: { label: 'Active', className: 'bg-green-100 text-green-800' },
    past_due: { label: 'Past Due', className: 'bg-orange-100 text-orange-800' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-800' },
    expired: { label: 'Expired', className: 'bg-gray-200 text-gray-600' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
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

// Cancel Modal Component with Proration Options
function CancelModal({ subscription, onClose, onConfirm }) {
  const [proration, setProration] = useState('PRORATED')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Cancel Subscription
        </h3>
        
        {subscription && (
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Customer:</span> {subscription.customerEmail || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Plan:</span> {subscription.planName || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Status:</span> <StatusBadge status={subscription.status} />
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Choose how to handle refunds for the current billing period:
        </p>
        
        <div className="space-y-3 mb-6">
          {[
            { 
              value: 'ALL', 
              label: 'Full refund', 
              desc: 'Refund entire current period charge',
              color: 'text-green-600'
            },
            { 
              value: 'PRORATED', 
              label: 'Prorated refund', 
              desc: 'Refund unused portion only (recommended)',
              color: 'text-blue-600'
            },
            { 
              value: 'NONE', 
              label: 'No refund', 
              desc: 'Keep current period charge',
              color: 'text-red-600'
            },
          ].map(option => (
            <label 
              key={option.value} 
              className={`flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 transition ${
                proration === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="proration"
                value={option.value}
                checked={proration === option.value}
                onChange={(e) => setProration(e.target.value)}
                className="mt-1"
              />
              <div>
                <span className={`font-medium text-sm ${option.color}`}>{option.label}</span>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300"
          >
            Keep Subscription
          </button>
          <button 
            onClick={() => onConfirm(proration)}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  )
}

// NEW: Edit Subscription Modal Component
function EditSubscriptionModal({ subscription, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    cancel_at_period_end: subscription?.cancelAtPeriodEnd || false,
    collection_method: subscription?.collectionMethod || '',
    trial_ends_at: '',
    days_until_due: '',
    default_tax_percent: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      await onSubmit(subscription._id, formData)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Edit Subscription
        </h3>
        
        {subscription && (
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm space-y-1">
            <p className="text-gray-600">
              <span className="font-medium">Customer:</span> {subscription.customerEmail || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Plan:</span> {subscription.planName || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Status:</span> <StatusBadge status={subscription.status} />
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Airwallex ID:</span> {subscription.externalSubscriptionId || 'N/A'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cancel at period end toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.cancel_at_period_end}
                onChange={(e) => handleChange('cancel_at_period_end', e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <div>
                <span className="font-medium text-sm text-gray-900">Cancel at period end</span>
                <p className="text-xs text-gray-500">Schedule cancellation after current billing cycle</p>
              </div>
            </label>
          </div>

          {/* Collection method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Method
            </label>
            <select
              value={formData.collection_method}
              onChange={(e) => handleChange('collection_method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Keep current —</option>
              <option value="AUTO_CHARGE">Auto Charge</option>
              <option value="CHARGE_ON_CHECKOUT">Charge on Checkout</option>
              <option value="OUT_OF_BAND">Out of Band</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">How payment is collected for this subscription</p>
          </div>

          {/* Trial end date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trial End Date
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={formData.trial_ends_at}
                onChange={(e) => handleChange('trial_ends_at', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleChange('trial_ends_at', 'NOW')}
                className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
              >
                End Now
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Set when trial ends, or click "End Now" to terminate immediately</p>
          </div>

          {/* Days until due */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Until Due
            </label>
            <input
              type="number"
              min="0"
              value={formData.days_until_due}
              onChange={(e) => handleChange('days_until_due', e.target.value)}
              placeholder="e.g., 7"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Days from invoice finalization until payment is due</p>
          </div>

          {/* Default tax percent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Tax Percent
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.default_tax_percent}
              onChange={(e) => handleChange('default_tax_percent', e.target.value)}
              placeholder="e.g., 20.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tax percentage (0-100) applied to invoices (exclusive)</p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button"
              onClick={onClose} 
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}