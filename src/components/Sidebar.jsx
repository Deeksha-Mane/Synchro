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
  Menu,
  X,
  Factory
} from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Check if mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true); // Always collapsed on mobile
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
      description: 'Main dashboard overview',
      category: 'main'
    },
    {
      name: 'Color Sequencing',
      path: '/dashboard/sequencing',
      icon: Palette,
      description: 'Smart color sequencing system',
      category: 'main'
    },
    {
      name: 'Advanced Algorithm',
      path: '/dashboard/advanced',
      icon: Brain,
      description: 'Advanced scheduling with fault tolerance',
      category: 'main'
    },
    {
      name: 'Custom Simulation',
      path: '/dashboard/custom-simulation',
      icon: Factory,
      description: 'Run simulations with custom cars',
      category: 'tools'
    },
    {
      name: 'Buffer Management',
      path: '/dashboard/buffers',
      icon: Package,
      description: 'Buffer status and management',
      category: 'monitoring'
    },
    {
      name: 'Conveyor Lines',
      path: '/dashboard/conveyors',
      icon: Truck,
      description: 'Conveyor line monitoring',
      category: 'monitoring'
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Production analytics',
      category: 'analytics'
    },
    {
      name: 'Vehicle Dataset',
      path: '/dashboard/dataset',
      icon: Database,
      description: 'Vehicle data management',
      category: 'analytics'
    },
    {
      name: 'ML Optimization',
      path: '/dashboard/optimization',
      icon: Brain,
      description: 'Machine learning optimization',
      category: 'tools'
    },
    {
      name: 'System Alerts',
      path: '/dashboard/alerts',
      icon: AlertTriangle,
      description: 'System alerts and notifications',
      category: 'monitoring'
    },
  ];

  const isActive = (path) => location.pathname === path;

  const groupedMenuItems = {
    main: menuItems.filter(item => item.category === 'main'),
    monitoring: menuItems.filter(item => item.category === 'monitoring'),
    analytics: menuItems.filter(item => item.category === 'analytics'),
    tools: menuItems.filter(item => item.category === 'tools')
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar Container - Fixed height and proper scrolling */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        top-0 left-0 h-screen bg-white border-r border-gray-200 
        transition-all duration-300 z-50 shadow-lg flex-shrink-0
        ${isMobile
          ? (collapsed ? 'w-0 -translate-x-full' : 'w-80 translate-x-0')
          : (collapsed ? 'w-20' : 'w-80')
        }
        flex flex-col
      `}>

        {/* Fixed Header - No scroll */}
        <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              {!collapsed ? (
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Factory className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Smart Sequencing</h1>
                    <p className="text-xs text-indigo-200">Manufacturing System</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white bg-opacity-20 p-2 rounded-lg mx-auto">
                  <Factory className="h-6 w-6 text-white" />
                </div>
              )}
              
              {/* Toggle Button */}
              {!isMobile && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="p-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                >
                  {collapsed ? <Menu size={16} /> : <X size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* User Profile - Fixed */}
          {!collapsed && currentUser && (
            <div className="px-4 pb-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={userData?.profileImage || currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.fullName || currentUser?.displayName || 'User')}&background=6366f1&color=fff&size=200`}
                    alt="Profile"
                    className="w-10 h-10 rounded-lg object-cover border-2 border-white border-opacity-30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {userData?.fullName || currentUser.displayName || 'User'}
                    </p>
                    <p className="text-xs text-indigo-200 truncate">
                      System Operator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <nav className={`${collapsed ? 'p-2' : 'p-4'} space-y-6`}>
            
            {/* Main Section */}
            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Main Controls
                </h3>
              )}
              <div className="space-y-1">
                {groupedMenuItems.main.map((item) => {
                  const itemActive = isActive(item.path);
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && setCollapsed(true)}
                      className={`
                        flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
                        rounded-lg transition-all duration-200 group relative
                        ${itemActive
                          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }
                      `}
                      title={collapsed ? item.name : item.description}
                    >
                      <IconComponent
                        className={`h-5 w-5 ${itemActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                      />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                      )}
                      {!collapsed && itemActive && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Monitoring Section */}
            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Monitoring
                </h3>
              )}
              <div className="space-y-1">
                {groupedMenuItems.monitoring.map((item) => {
                  const itemActive = isActive(item.path);
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && setCollapsed(true)}
                      className={`
                        flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
                        rounded-lg transition-all duration-200 group
                        ${itemActive
                          ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }
                      `}
                      title={collapsed ? item.name : item.description}
                    >
                      <IconComponent
                        className={`h-5 w-5 ${itemActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                      />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                      )}
                      {!collapsed && itemActive && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Analytics Section */}
            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Analytics
                </h3>
              )}
              <div className="space-y-1">
                {groupedMenuItems.analytics.map((item) => {
                  const itemActive = isActive(item.path);
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && setCollapsed(true)}
                      className={`
                        flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
                        rounded-lg transition-all duration-200 group
                        ${itemActive
                          ? 'bg-green-50 text-green-700 border-l-4 border-green-500 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }
                      `}
                      title={collapsed ? item.name : item.description}
                    >
                      <IconComponent
                        className={`h-5 w-5 ${itemActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                      />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                      )}
                      {!collapsed && itemActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Tools Section */}
            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tools
                </h3>
              )}
              <div className="space-y-1">
                {groupedMenuItems.tools.map((item) => {
                  const itemActive = isActive(item.path);
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && setCollapsed(true)}
                      className={`
                        flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
                        rounded-lg transition-all duration-200 group
                        ${itemActive
                          ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }
                      `}
                      title={collapsed ? item.name : item.description}
                    >
                      <IconComponent
                        className={`h-5 w-5 ${itemActive ? 'text-purple-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                      />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                      )}
                      {!collapsed && itemActive && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Account Section */}
            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Account
                </h3>
              )}
              <div className="space-y-1">
                <Link
                  to="/dashboard/profile"
                  onClick={() => isMobile && setCollapsed(true)}
                  className={`
                    flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
                    rounded-lg transition-all duration-200 group
                    ${isActive('/dashboard/profile')
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <User className={`h-5 w-5 ${isActive('/dashboard/profile') ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">Profile</span>
                      <p className="text-xs text-gray-500">User settings & info</p>
                    </div>
                  )}
                </Link>

                <Link
                  to="/dashboard/settings"
                  onClick={() => isMobile && setCollapsed(true)}
                  className={`
                    flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
                    rounded-lg transition-all duration-200 group
                    ${isActive('/dashboard/settings')
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <Settings className={`h-5 w-5 ${isActive('/dashboard/settings') ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">Settings</span>
                      <p className="text-xs text-gray-500">System preferences</p>
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Fixed Footer - No scroll */}
        <div className={`flex-shrink-0 ${collapsed ? 'p-2' : 'p-4'} border-t border-gray-200 bg-gray-50`}>
          <button
            onClick={handleLogout}
            className={`
              flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-3'} 
              w-full rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 
              transition-all duration-200 group
            `}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>

          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">Smart Sequencing v2.1</p>
              <p className="text-xs text-gray-400">Manufacturing System</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button - Fixed Position */}
      {isMobile && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-lg shadow-lg lg:hidden hover:bg-indigo-700 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  );
}