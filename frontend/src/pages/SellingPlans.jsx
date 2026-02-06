import { useEffect, useState } from 'react'

// const API = `${import.meta.env.VITE_BACKEND_URL}/api/selling-plans`
// const API = `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/plans`




export default function SellingPlans({ environment }) {
  const [plans, setPlans] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Set the API endpoint dynamically based on the environment
  
  const API = environment === 'live'
  ? `${import.meta.env.VITE_BACKEND_URL}/api/selling-plans/plans`
  : `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/plans`;
  
  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        const res = await fetch(API, {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        });
        console.log("API: ", API);

        const text = await res.text();
        console.log("RAW RESPONSE:", text);

        if (!res.ok) throw new Error(text);

        const data = JSON.parse(text);
        if (mounted) setPlans(data);
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPlans();
    return () => (mounted = false);
  }, []);



  return (
    // <div className="space-y-6">
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
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
                <TableHead>Interval</TableHead>
                <TableHead>Free Trial</TableHead>
                <TableHead>Status</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.length > 0 ? (
                plans.map(plan => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>£{plan.amount}</TableCell>
                    <TableCell>{plan.interval}</TableCell>
                    <TableCell>
                      {plan.trialDays > 0
                        ? `${plan.trialDays} days`
                        : 'None'}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={async () => {
                          const updated = await updatePlan(plan._id, {
                            active: plan.status !== 'enabled',
                          });

                          setPlans(prev =>
                            prev.map(p =>
                              p._id === updated._id ? updated : p
                            )
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          plan.status === 'enabled'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}

                        environment={environment}
                      >
                        {plan.status === 'enabled' ? 'Enabled' : 'Disabled'}
                      </button>
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
          environment={environment}
        />
      )}
    </div>
  )
}

/* ---------- Create Plan Form ---------- */


// const APS = `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/plans`

function CreatePlanForm({ onClose, onCreated, environment }) {

  const API = environment === 'live'
  ? `${import.meta.env.VITE_BACKEND_URL}/api/selling-plans/plans`
  : `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/plans`;

  // Set the API endpoint dynamically based on the environment

  const [form, setForm] = useState({
    name: '',
    description: '',
    amount: '',
    interval: 'MONTH',
    trialDays: 30,
  })

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const submit = async e => {
    e.preventDefault()

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        trialDays: Number(form.trialDays),
      }),
    })

    const created = await res.json()
    if (!res.ok) {
      alert(created.error)
      return
    }

    onCreated?.(created)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/80 via-gray-100/80 to-gray-200/80 backdrop-blur px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Create Subscription Plan
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <input
            name="name"
            placeholder="Plan name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-gray-400 outline-none"
          />

          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-gray-400 outline-none"
          />

          <input
            name="amount"
            type="number"
            placeholder="Amount (USD)"
            value={form.amount}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-gray-400 outline-none"
          />

          <select
            name="interval"
            value={form.interval}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:ring-2 focus:ring-gray-400 outline-none"
          >
            <option value="MONTH">Monthly</option>
            <option value="YEAR">Yearly</option>
          </select>

          <input
            name="trialDays"
            type="number"
            placeholder="Trial days"
            value={form.trialDays}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-gray-400 outline-none"
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



/* ---------- UI Helpers ---------- */

async function updatePlan(id, payload, environment) {

  const API = environment === 'live'
  ? `${import.meta.env.VITE_BACKEND_URL}/api/selling-plans/plans`
  : `${import.meta.env.VITE_BACKEND_URL}/api/subscription-plans/plans`;

  console.log("APILive Or not: ", API);
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// function StatusToggle({ enabled, onToggle }) {
//   return (
//     <button
//       onClick={onToggle}
//       className={`px-3 py-1 rounded-full text-xs font-semibold ${
//         enabled
//           ? 'bg-green-100 text-green-800'
//           : 'bg-gray-200 text-gray-700'
//       }`}
//     >
//       {enabled ? 'Enabled' : 'Disabled'}
//     </button>
//   );
// }


// function Input({ label, ...props }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-600 mb-1">
//         {label}
//       </label>
//       <input
//         {...props}
//         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400"
//       />
//     </div>
//   )
// }

// function Select({ label, name, options, onChange }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-600 mb-1">
//         {label}
//       </label>
//       <select
//         name={name}
//         onChange={onChange}
//         className="w-full px-3 py-2 border rounded-lg"
//       >
//         {options.map(o => (
//           <option key={o.value} value={o.value}>
//             {o.label}
//           </option>
//         ))}
//       </select>
//     </div>
//   )
// }

// function Checkbox({ label, ...props }) {
//   return (
//     <label className="flex items-center gap-2 text-sm text-gray-700">
//       <input type="checkbox" {...props} />
//       {label}
//     </label>
//   )
// }

// function StatusBadge({ status }) {
//   return (
//     <span
//       className={`px-2 py-1 rounded-full text-xs font-semibold ${
//         status === 'enabled'
//           ? 'bg-green-100 text-green-800'
//           : 'bg-gray-200 text-gray-700'
//       }`}
//     >
//       {status}
//     </span>
//   )
// }

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