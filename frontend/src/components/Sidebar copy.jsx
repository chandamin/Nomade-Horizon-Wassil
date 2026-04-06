import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Repeat,
  Package,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldUser
} from 'lucide-react'
import Switch from 'react-switch'
import { removeToken } from '../utils/auth'
import AdminSettings from '../pages/AdminSettings'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Selling Plans', path: '/selling-plans', icon: Package },
  { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
  { name: 'Settings', path: '/settings', icon: ShieldUser },
]

function Sidebar({ environment = 'sandbox', setEnvironment }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const isLive = environment === 'live'

  const handleLogout = () => {
    removeToken()
    navigate('/login', { replace: true })
  }

  const handleEnvironmentToggle = (checked) => {
    const newEnv = checked ? 'live' : 'sandbox';
    localStorage.setItem('adminEnvironment', newEnv);
    setEnvironment?.(newEnv);
  }



  return (
    <aside
      className={`fixed z-[1] min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
      transition-all duration-300 ease-in-out 
      ${collapsed ? 'w-20' : 'sm:w-[20%] w-64'}`}
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
            <h1 className="text-white text-xl font-bold">Nomade Horizon</h1>
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


      {/* Environment Toggle */}
      <div className="px-6 py-4">
        {/* <div className="flex items-center gap-3">
          <span className="text-white text-sm">Environment</span>
          <Switch
            checked={isLive}
            onChange={handleEnvironmentToggle}
            offColor="#888"  // Customize colors for the off state
            onColor="#4CAF50" // Customize colors for the on state
            onHandleColor="#fff" // Handle color
            offHandleColor="#fff" // Handle color
            height={20} // Height of the switch
            width={40}  // Width of the switch
          />
          <span className="text-white text-sm">{isLive ? 'Live' : 'Sandbox'}</span>
        </div> */}
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

      {/* Logout */}
      <div className="absolute bottom-6 w-full px-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-lg transition
            text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut size={20} />
          {!collapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar


