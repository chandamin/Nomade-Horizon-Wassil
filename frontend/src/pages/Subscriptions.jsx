import { useEffect, useMemo, useState } from 'react'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/subscriptions`

export default function Subscriptions() {
  const [subs, setSubs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [cancelModal, setCancelModal] = useState({
    open: false,
    subscriptionId: null,
    subscription: null,
  })

  const [editModal, setEditModal] = useState({
    open: false,
    subscriptionId: null,
    subscription: null,
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
    setActionLoading((prev) => ({ ...prev, [id]: value }))
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
        setSubs((prev) => prev.map((sub) => (sub._id === id ? data.subscription : sub)))
      }

      setSuccess('Subscription synced successfully')
    } catch (err) {
      setError(err.message || 'Failed to sync subscription')
    } finally {
      setRowLoading(id, false)
    }
  }

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
          proration_behavior: prorationBehavior,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || data?.details || 'Failed to cancel subscription')
      }

      if (data?.subscription) {
        setSubs((prev) => prev.map((sub) => (sub._id === id ? data.subscription : sub)))
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

      if (data?.subscription) {
        setSubs((prev) => prev.map((sub) => (sub._id === id ? data.subscription : sub)))
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

  const handleEditSubmit = async (subscriptionId, formData) => {
    const payload = {}

    if (formData.cancel_at_period_end !== undefined) {
      payload.cancel_at_period_end = formData.cancel_at_period_end
    }

    if (formData.collection_method) {
      payload.collection_method = formData.collection_method
    }

    if (formData.payment_source_id) {
      payload.payment_source_id = formData.payment_source_id
    }

    if (formData.trial_ends_at) {
      payload.trial_ends_at =
        formData.trial_ends_at === 'NOW'
          ? new Date().toISOString()
          : new Date(formData.trial_ends_at).toISOString()
    }

    if (formData.days_until_due !== '') {
      payload.days_until_due = Number(formData.days_until_due)
    }

    if (formData.default_tax_percent !== '') {
      payload.default_tax_percent = Number(formData.default_tax_percent)
    }

    const success = await updateSubscription(subscriptionId, payload)

    if (success) {
      setEditModal({ open: false, subscriptionId: null, subscription: null })
    }
  }

  const filteredSubs = useMemo(() => {
    return subs.filter((sub) => {
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
    return <div className="p-4 sm:p-6 md:p-8 text-center text-sm sm:text-base text-gray-500">Loading subscriptions…</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-600">Manage customer subscriptions and sync with Airwallex</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search by customer email, plan, or Airwallex subscription id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 md:max-w-xl"
        />

        <button
          onClick={loadSubscriptions}
          className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-gray-900 md:w-auto"
        >
          Refresh List
        </button>
      </div>

      <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
        <div className="overflow-x-auto">
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
                filteredSubs.map((sub) => {
                  const busy = !!actionLoading[sub._id]

                  return (
                    <tr key={sub._id} className="hover:bg-gray-50">
                      <TableCell>{sub.customerEmail || '-'}</TableCell>
                      <TableCell>{sub.planName || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell>
                        <span className="break-all text-xs text-gray-600">{sub.externalSubscriptionId || '-'}</span>
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
                          <ActionBtn color="blue" disabled={busy} onClick={() => syncSubscription(sub._id)}>
                            {busy ? 'Working...' : 'Sync'}
                          </ActionBtn>

                          {sub.status !== 'cancelled' && (
                            <ActionBtn
                              color="indigo"
                              disabled={busy}
                              onClick={() =>
                                setEditModal({
                                  open: true,
                                  subscriptionId: sub._id,
                                  subscription: sub,
                                })
                              }
                            >
                              {busy ? 'Working...' : 'Edit'}
                            </ActionBtn>
                          )}

                          {sub.status !== 'cancelled' && (
                            <ActionBtn
                              color="red"
                              disabled={busy}
                              onClick={() =>
                                setCancelModal({
                                  open: true,
                                  subscriptionId: sub._id,
                                  subscription: sub,
                                })
                              }
                            >
                              {busy ? 'Working...' : 'Cancel'}
                            </ActionBtn>
                          )}
                        </div>
                      </TableCell>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {filteredSubs.length > 0 ? (
          filteredSubs.map((sub) => {
            const busy = !!actionLoading[sub._id]

            return (
              <div key={sub._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-3">
                  <InfoRow label="Email" value={sub.customerEmail || '-'} />
                  <InfoRow label="Plan" value={sub.planName || '-'} />
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
                    <StatusBadge status={sub.status} />
                  </div>
                  <InfoRow
                    label="External ID"
                    value={sub.externalSubscriptionId || '-'}
                    valueClassName="break-all text-xs text-gray-600"
                  />
                  <InfoRow
                    label="Next Billing"
                    value={
                      sub?.metadata?.nextBillingAt
                        ? new Date(sub.metadata.nextBillingAt).toLocaleString()
                        : sub?.nextBillingAt
                          ? new Date(sub.nextBillingAt).toLocaleString()
                          : '-'
                    }
                  />

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      <ActionBtn color="blue" disabled={busy} onClick={() => syncSubscription(sub._id)}>
                        {busy ? 'Working...' : 'Sync'}
                      </ActionBtn>

                      {sub.status !== 'cancelled' && (
                        <ActionBtn
                          color="indigo"
                          disabled={busy}
                          onClick={() =>
                            setEditModal({
                              open: true,
                              subscriptionId: sub._id,
                              subscription: sub,
                            })
                          }
                        >
                          {busy ? 'Working...' : 'Edit'}
                        </ActionBtn>
                      )}

                      {sub.status !== 'cancelled' && (
                        <ActionBtn
                          color="red"
                          disabled={busy}
                          onClick={() =>
                            setCancelModal({
                              open: true,
                              subscriptionId: sub._id,
                              subscription: sub,
                            })
                          }
                        >
                          {busy ? 'Working...' : 'Cancel'}
                        </ActionBtn>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 shadow-sm">
            No subscriptions found
          </div>
        )}
      </div>

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

function TableHead({ children }) {
  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
      {children}
    </th>
  )
}

function TableCell({ children }) {
  return <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{children}</td>
}

function InfoRow({ label, value, valueClassName = 'text-sm text-gray-900 break-words' }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
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
  }

  const config = statusConfig[status] || statusConfig.pending

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${config.className}`}>{config.label}</span>
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
      className={`rounded px-3 py-2 text-xs text-white transition sm:py-1 ${colors[color]} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {children}
    </button>
  )
}

function CancelModal({ subscription, onClose, onConfirm }) {
  const [proration, setProration] = useState('PRORATED')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Cancel Subscription</h3>

        {subscription && (
          <div className="mb-4 rounded bg-gray-50 p-3 text-sm">
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

        <p className="mb-4 text-sm text-gray-600">Choose how to handle refunds for the current billing period:</p>

        <div className="mb-6 space-y-3">
          {[
            {
              value: 'ALL',
              label: 'Full refund',
              desc: 'Refund entire current period charge',
              color: 'text-green-600',
            },
            {
              value: 'PRORATED',
              label: 'Prorated refund',
              desc: 'Refund unused portion only (recommended)',
              color: 'text-blue-600',
            },
            {
              value: 'NONE',
              label: 'No refund',
              desc: 'Keep current period charge',
              color: 'text-red-600',
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition hover:bg-gray-50 ${
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
                <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="w-full rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 sm:w-auto"
          >
            Keep Subscription
          </button>
          <button
            onClick={() => onConfirm(proration)}
            className="w-full rounded bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600 sm:w-auto"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  )
}

function EditSubscriptionModal({ subscription, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    cancel_at_period_end: subscription?.cancelAtPeriodEnd || false,
    collection_method: subscription?.collectionMethod || '',
    payment_source_id: '',
    trial_ends_at: '',
    days_until_due: '',
    default_tax_percent: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [paymentSources, setPaymentSources] = useState([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [sourcesError, setSourcesError] = useState('')

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === 'collection_method' && value === 'AUTO_CHARGE') {
      fetchPaymentSources()
    }
  }

  const fetchPaymentSources = async () => {
    setSourcesLoading(true)
    setSourcesError('')
    try {
      const res = await fetch(`${API_BASE}/${subscription._id}/payment-sources`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch payment sources')
      setPaymentSources(data.payment_sources || [])
      if (data.payment_sources?.length === 1) {
        setFormData((prev) => ({ ...prev, payment_source_id: data.payment_sources[0].id }))
      }
    } catch (err) {
      setSourcesError(err.message)
    } finally {
      setSourcesLoading(false)
    }
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Edit Subscription</h3>

        {subscription && (
          <div className="mb-4 space-y-1 rounded bg-gray-50 p-3 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Customer:</span> {subscription.customerEmail || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Plan:</span> {subscription.planName || 'N/A'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Status:</span> <StatusBadge status={subscription.status} />
            </p>
            <p className="break-all text-gray-600">
              <span className="font-medium">Airwallex ID:</span> {subscription.externalSubscriptionId || 'N/A'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={formData.cancel_at_period_end}
                onChange={(e) => handleChange('cancel_at_period_end', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-indigo-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Cancel at period end</span>
                <p className="text-xs text-gray-500">Schedule cancellation after current billing cycle</p>
              </div>
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Collection Method</label>
            <select
              value={formData.collection_method}
              onChange={(e) => handleChange('collection_method', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Keep current —</option>
              <option value="AUTO_CHARGE">Auto Charge</option>
              <option value="CHARGE_ON_CHECKOUT">Charge on Checkout</option>
              <option value="OUT_OF_BAND">Out of Band</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">How payment is collected for this subscription</p>
          </div>

          {formData.collection_method === 'AUTO_CHARGE' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payment Source <span className="text-red-500">*</span>
              </label>
              {sourcesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-indigo-500"></span>
                  Loading saved payment methods…
                </div>
              ) : sourcesError ? (
                <div className="py-1 text-sm text-red-600">{sourcesError}</div>
              ) : paymentSources.length === 0 ? (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-600">
                  No saved payment sources found for this customer.
                </div>
              ) : (
                <select
                  value={formData.payment_source_id}
                  onChange={(e) => handleChange('payment_source_id', e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Select a payment source —</option>
                  {paymentSources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.id} {src.external_id ? `· ${src.external_id}` : ''}{' '}
                      {src.created_at ? `· Added ${new Date(src.created_at).toLocaleDateString()}` : ''}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-xs text-gray-500">Saved card on file for this customer</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trial End Date</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="datetime-local"
                value={formData.trial_ends_at}
                onChange={(e) => handleChange('trial_ends_at', e.target.value)}
                className="w-full min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleChange('trial_ends_at', 'NOW')}
                className="w-full rounded border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 sm:w-auto"
              >
                End Now
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Set when trial ends, or click &quot;End Now&quot; to terminate immediately</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Days Until Due</label>
            <input
              type="number"
              min="0"
              value={formData.days_until_due}
              onChange={(e) => handleChange('days_until_due', e.target.value)}
              placeholder="e.g., 7"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Days from invoice finalization until payment is due</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Default Tax Percent</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.default_tax_percent}
              onChange={(e) => handleChange('default_tax_percent', e.target.value)}
              placeholder="e.g., 20.00"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Tax percentage (0-100) applied to invoices (exclusive)</p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-indigo-500 px-4 py-2 text-sm text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
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
