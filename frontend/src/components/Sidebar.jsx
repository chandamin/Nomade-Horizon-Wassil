import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Repeat,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Selling Plans', path: '/selling-plans', icon: Package },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
]

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
      transition-all duration-300 ease-in-out
      ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-gray-700 hover:bg-gray-600 text-white p-1 rounded-full shadow"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className="px-6 py-6">
        {!collapsed ? (
          <>
            <h1 className="text-white text-xl font-bold">Ascend</h1>
            <p className="text-gray-400 text-sm">
              Subscriptions At Convenience
            </p>
          </>
        ) : (
          <h1 className="text-white text-xl font-bold text-center">
            A
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-8 space-y-2 px-3">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition
              ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {!collapsed && (
              <span className="text-sm font-medium">
                {name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar


// import { NavLink } from 'react-router-dom'

// const navItemClasses = ({ isActive }) =>
//   `flex items-center px-4 py-3 rounded-lg transition-all duration-200
//    ${
//      isActive
//        ? 'bg-gray-700 text-white'
//        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
//    }`

// function Sidebar() {
//   return (
//     <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
//       {/* Logo */}
//       <div className="text-white text-xl font-bold mb-10">
//         Ascend
//         <p className="text-sm text-gray-400 font-normal">
//           Subscription Admin
//         </p>
//       </div>

//       {/* Navigation */}
//       <nav className="space-y-2">
//         <NavLink to="/dashboard" className={navItemClasses}>
//           Dashboard
//         </NavLink>

//         <NavLink to="/selling-plans" className={navItemClasses}>
//           Selling Plans
//         </NavLink>

//         <NavLink to="/customers" className={navItemClasses}>
//           Customers
//         </NavLink>

//         <NavLink to="/subscriptions" className={navItemClasses}>
//           Subscriptions
//         </NavLink>
//       </nav>
//     </aside>
//   )
// }

// export default Sidebar
