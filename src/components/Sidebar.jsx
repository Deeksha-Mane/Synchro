import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Palette,
  Package,
  Truck,
  BarChart3,
  Database,
  Brain,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Factory
} from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setCollapsed(false); // Auto-expand on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      name: 'Control Center',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Main dashboard overview'
    },
    {
      name: 'Color Sequencing',
      path: '/dashboard/sequencing',
      icon: Palette,
      description: 'Smart color sequencing system'
    },
    {
      name: 'Advanced Algorithm',
      path: '/dashboard/advanced',
      icon: Brain,
      description: 'Advanced scheduling with fault tolerance'
    },
    {
      name: 'Custom Simulation',
      path: '/dashboard/custom-simulation',
      icon: Factory,
      description: 'Run simulations with custom cars'
    },
    {
      name: 'Buffer Management',
      path: '/dashboard/buffers',
      icon: Package,
      description: 'Buffer status and management'
    },
    {
      name: 'Conveyor Lines',
      path: '/dashboard/conveyors',
      icon: Truck,
      description: 'Conveyor line monitoring'
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Production analytics'
    },
    {
      name: 'Vehicle Dataset',
      path: '/dashboard/dataset',
      icon: Database,
      description: 'Vehicle data management'
    },
    {
      name: 'ML Optimization',
      path: '/dashboard/optimization',
      icon: Factory,
      description: 'Machine learning optimization'
    },
    {
      name: 'System Alerts',
      path: '/dashboard/alerts',
      icon: AlertTriangle,
      description: 'System alerts and notifications'
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 shadow-lg flex-shrink-0
        ${isMobile
          ? (collapsed ? 'w-0 -translate-x-full' : 'w-72 translate-x-0')
          : (collapsed ? 'w-16' : 'w-72')
        }
      `}>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={16} className="text-gray-600" /> : <ChevronLeft size={16} className="text-gray-600" />}
        </button>

        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            {!collapsed ? (
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Smart Sequencing</h1>
                  <p className="text-xs text-gray-500">Manufacturing System</p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-md">
                <Factory className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        {!collapsed && currentUser && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src={userData?.profileImage || currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.fullName || currentUser?.displayName || 'User')}&background=f97316&color=fff&size=200`}
                alt="Profile"
                className="w-12 h-12 rounded-xl object-cover border-2 border-orange-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {userData?.fullName || currentUser.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser.email}
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  System Operator
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-4'}`}>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const itemActive = isActive(item.path);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} rounded-xl transition-all duration-200 group
                    ${itemActive
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                  title={collapsed ? item.name : item.description}
                >
                  <IconComponent
                    className={`${collapsed ? 'h-5 w-5' : 'h-5 w-5'} ${itemActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`}
                  />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  )}
                  {!collapsed && itemActive && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Actions Section */}
          {!collapsed && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
                Account
              </h3>
              <div className="space-y-2">
                <Link
                  to="/dashboard/profile"
                  className={`
                    flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} rounded-xl transition-all duration-200 group
                    ${isActive('/dashboard/profile')
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <User className={`h-5 w-5 ${isActive('/dashboard/profile') ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                  <span className="text-sm font-medium">Profile</span>
                </Link>

                <Link
                  to="/dashboard/settings"
                  className={`
                    flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} rounded-xl transition-all duration-200 group
                    ${isActive('/dashboard/settings')
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <Settings className={`h-5 w-5 ${isActive('/dashboard/settings') ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className={`flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group`}
          >
            <LogOut className={`${collapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>

          {!collapsed && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">Smart Sequencing v2.0</p>
              <p className="text-xs text-gray-400">Manufacturing System</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button - Fixed Position */}
      {isMobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed top-4 left-4 z-50 bg-white text-gray-700 p-3 rounded-xl shadow-lg border border-gray-200 lg:hidden hover:bg-gray-50 transition-colors"
        >
          <Factory className="h-5 w-5" />
        </button>
      )}
    </>
  );
}