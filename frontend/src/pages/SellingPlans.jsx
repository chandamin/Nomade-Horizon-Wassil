import { useEffect, useState } from 'react'

const API = `${import.meta.env.VITE_BACKEND_URL}/api/selling-plans`

export default function SellingPlans() {
  const [plans, setPlans] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(data => {
        setPlans(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Selling Plans
        </h1>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          + Create Plan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-500">Loading plans…</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Free Trial</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.length > 0 ? (
                plans.map(plan => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>£{plan.chargeAmount}</TableCell>
                    <TableCell>
                      {plan.freeTrialDays > 0
                        ? `${plan.freeTrialDays} days`
                        : 'None'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={plan.status} />
                    </TableCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-6 text-gray-500"
                  >
                    No selling plans created
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <CreatePlanForm
          onClose={() => setShowForm(false)}
          onCreated={plan =>
            setPlans(prev => [plan, ...prev])
          }
        />
      )}
    </div>
  )
}

/* ---------- Create Plan Form ---------- */

function CreatePlanForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    chargeAmount: '',
    chargeShipping: 'yes',
    chargeSalesTax: true,
    enableCustomerPortal: true,
    billingCycleStartDayUTC: '',
    billingCycleStartTimeUTC: '',
    freeTrialDays: 0,
    installments: '',
    customerCancellationBehaviour: 'cancel_at_period_end',
    setupCharge: 0,
  })

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const submit = async e => {
    e.preventDefault()

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        chargeAmount: Number(form.chargeAmount),
        freeTrialDays: Number(form.freeTrialDays),
        setupCharge: Number(form.setupCharge),
        installments:
          form.installments === ''
            ? null
            : Number(form.installments),
      }),
    })

    const created = await res.json()
    onCreated(created)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6">
          Create Selling Plan
        </h2>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Input label="Plan Name" name="name" onChange={handleChange} required />
          <Input label="Charge Amount" name="chargeAmount" type="number" onChange={handleChange} required />

          <Select
            label="Charge Shipping"
            name="chargeShipping"
            onChange={handleChange}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
              { label: 'Only on first invoice', value: 'first_invoice_only' },
            ]}
          />

          <Checkbox
            label="Charge Sales Tax"
            name="chargeSalesTax"
            checked={form.chargeSalesTax}
            onChange={handleChange}
          />

          <Checkbox
            label="Enable in Customer Portal"
            name="enableCustomerPortal"
            checked={form.enableCustomerPortal}
            onChange={handleChange}
          />

          <Input label="Billing Cycle Start Day (UTC)" name="billingCycleStartDayUTC" type="number" onChange={handleChange} />
          <Input label="Billing Cycle Start Time (UTC)" name="billingCycleStartTimeUTC" type="time" onChange={handleChange} />
          <Input label="Free Trial Days" name="freeTrialDays" type="number" onChange={handleChange} />
          <Input label="Installments" name="installments" type="number" onChange={handleChange} />

          <Select
            label="Customer Cancellation Behaviour"
            name="customerCancellationBehaviour"
            onChange={handleChange}
            options={[
              { label: 'Cancel immediately', value: 'cancel_immediately' },
              { label: 'Cancel at end of billing period', value: 'cancel_at_period_end' },
              { label: 'Do not allow cancellation', value: 'do_not_allow' },
            ]}
          />

          <Input label="Setup Charge" name="setupCharge" type="number" onChange={handleChange} />

          <div className="md:col-span-2 flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg">
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------- UI Helpers ---------- */

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400"
      />
    </div>
  )
}

function Select({ label, name, options, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        name={name}
        onChange={onChange}
        className="w-full px-3 py-2 border rounded-lg"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Checkbox({ label, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" {...props} />
      {label}
    </label>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        status === 'enabled'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      {status}
    </span>
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


// import { useState } from 'react'

// export default function SellingPlans() {
//   const [showForm, setShowForm] = useState(false)

//   const samplePlans = [
//     {
//       id: 1,
//       name: 'Monthly Subscription',
//       amount: 29.99,
//       billingCycle: 'Monthly',
//       status: 'Enabled',
//     },
//     {
//       id: 2,
//       name: 'Quarterly Premium',
//       amount: 79.99,
//       billingCycle: 'Quarterly',
//       status: 'Disabled',
//     },
//   ]

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-gray-800">
//           Selling Plans
//         </h1>

//         <button
//           onClick={() => setShowForm(true)}
//           className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
//         >
//           + Create Plan
//         </button>
//       </div>

//       {/* Plans List */}
//       <div className="bg-white rounded-xl shadow overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-100">
//             <tr>
//               <TableHead>Plan Name</TableHead>
//               <TableHead>Charge Amount</TableHead>
//               <TableHead>Billing Cycle</TableHead>
//               <TableHead>Status</TableHead>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {samplePlans.map(plan => (
//               <tr key={plan.id} className="hover:bg-gray-50">
//                 <TableCell>{plan.name}</TableCell>
//                 <TableCell>£{plan.amount}</TableCell>
//                 <TableCell>{plan.billingCycle}</TableCell>
//                 <TableCell>
//                   <span
//                     className={`px-2 py-1 text-xs rounded-full font-semibold ${
//                       plan.status === 'Enabled'
//                         ? 'bg-green-100 text-green-800'
//                         : 'bg-gray-200 text-gray-700'
//                     }`}
//                   >
//                     {plan.status}
//                   </span>
//                 </TableCell>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Create Plan Modal */}
//       {showForm && (
//         <CreatePlanForm onClose={() => setShowForm(false)} />
//       )}
//     </div>
//   )
// }

// /* ---------- Create Plan Form ---------- */

// function CreatePlanForm({ onClose }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
//       <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">
//           Create Selling Plan
//         </h2>

//         <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Input label="Plan Name" />
//           <Input label="Charge Amount" type="number" />

//           <Select
//             label="Charge Shipping"
//             options={[
//               'Yes',
//               'No',
//               'Only on first invoice',
//             ]}
//           />

//           <Select
//             label="Charge Sales Tax"
//             options={['Yes', 'No']}
//           />

//           <Select
//             label="Enable in Customer Portal"
//             options={['Yes', 'No']}
//           />

//           <Input
//             label="Billing Cycle Start Day (UTC)"
//             type="number"
//           />

//           <Input
//             label="Billing Cycle Start Time (UTC)"
//             type="time"
//           />

//           <Select
//             label="Free Trial"
//             options={['No', '7 Days', '14 Days', '30 Days']}
//           />

//           <Input
//             label="Installments"
//             type="number"
//           />

//           <Select
//             label="Customer Cancellation Behaviour"
//             options={[
//               'Cancel immediately',
//               'Cancel at end of current billing period',
//               'Do not allow customers to cancel',
//             ]}
//           />

//           <Input
//             label="Setup Charge"
//             type="number"
//           />

//           {/* Buttons */}
//           <div className="md:col-span-2 flex justify-end gap-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
//             >
//               Create Plan
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }

// /* ---------- Reusable Inputs ---------- */

// function Input({ label, type = 'text' }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-600 mb-1">
//         {label}
//       </label>
//       <input
//         type={type}
//         className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
//       />
//     </div>
//   )
// }

// function Select({ label, options }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-600 mb-1">
//         {label}
//       </label>
//       <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400">
//         {options.map(opt => (
//           <option key={opt}>{opt}</option>
//         ))}
//       </select>
//     </div>
//   )
// }

// /* ---------- Table Helpers ---------- */

// function TableHead({ children }) {
//   return (
//     <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
//       {children}
//     </th>
//   )
// }

// function TableCell({ children }) {
//   return (
//     <td className="px-6 py-4 text-sm text-gray-700">
//       {children}
//     </td>
//   )
// }
