import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useScheduling } from '../hooks/useScheduling';
import AlgorithmStatus from './AlgorithmStatus';

export default function DashboardHome() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const { systemStatus, startScheduling, stopScheduling } = useScheduling();

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

  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome to Control Center, {userData?.fullName || currentUser?.displayName || 'Operator'}! 🏭
            </h1>
            <p className="text-gray-600">
              Monitor and optimize the smart sequencing system for maximum efficiency.
            </p>
          </div>
          <div className="w-80">
            <AlgorithmStatus />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Vehicles Processed</p>
              <p className="text-2xl font-bold">{systemStatus.metrics.totalProcessed}</p>
            </div>
            <div className="text-3xl">🚗</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">System Efficiency</p>
              <p className="text-2xl font-bold">{systemStatus.metrics.efficiency.toFixed(1)}%</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Current JPH</p>
              <p className="text-2xl font-bold">{systemStatus.metrics.jph.toFixed(1)}</p>
            </div>
            <div className="text-3xl">🏭</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Buffer Overflows</p>
              <p className="text-2xl font-bold">{systemStatus.metrics.bufferOverflows}</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: 'Buffer L2 reached 95% capacity', time: '2 minutes ago', icon: '📦' },
                { action: 'Color changeover completed on L7', time: '15 minutes ago', icon: '🎨' },
                { action: 'ML optimization improved efficiency by 3%', time: '1 hour ago', icon: '🤖' },
                { action: 'System maintenance completed', time: '3 hours ago', icon: '🔧' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Announcements */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {!systemStatus.isRunning ? (
                <button 
                  onClick={startScheduling}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition duration-200"
                >
                  ▶️ Start Auto Sequencing
                </button>
              ) : (
                <button 
                  onClick={stopScheduling}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition duration-200"
                >
                  ⏹️ Stop Sequencing
                </button>
              )}
              <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-200">
                Optimize Buffers
              </button>
              <button className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition duration-200">
                Run ML Analysis
              </button>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Announcements</h2>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm font-medium text-red-800">
                  Buffer L2 approaching capacity limit
                </p>
                <p className="text-xs text-red-600 mt-1">2 minutes ago</p>
              </div>
              
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm font-medium text-yellow-800">
                  Oven O2 speed reduced due to cross-routing
                </p>
                <p className="text-xs text-yellow-600 mt-1">5 minutes ago</p>
              </div>
              
              <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm font-medium text-green-800">
                  ML optimization completed successfully
                </p>
                <p className="text-xs text-green-600 mt-1">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Projects */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Buffer Lines Status</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Buffer Line L1', utilization: 85, status: 'Active', capacity: '12/14' },
              { name: 'Buffer Line L2', utilization: 100, status: 'Full', capacity: '14/14' },
              { name: 'Buffer Line L7', utilization: 68, status: 'Active', capacity: '11/16' },
            ].map((buffer, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">{buffer.name}</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{buffer.utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${buffer.utilization === 100 ? 'bg-red-500' : buffer.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${buffer.utilization}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                    buffer.status === 'Full' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {buffer.status}
                  </span>
                  <span className="text-xs text-gray-600">{buffer.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}