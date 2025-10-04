import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from '../components/Sidebar';
import DashboardHome from '../components/DashboardHome';
import ProfilePage from '../components/ProfilePage';
import { useScheduling } from '../hooks/useScheduling';
import dataInitService from '../services/dataInitService';
import NotificationToast from '../components/NotificationToast';
import QuickAddCars from '../components/QuickAddCars';
import AdvancedBufferControl from '../components/AdvancedBufferControl';
import { AdvancedAlgorithmProvider, useAdvancedAlgorithm } from '../context/AdvancedAlgorithmContext';
import CustomSimulationPage from './CustomSimulation';

export default function Dashboard() {
  return (
    <AdvancedAlgorithmProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />

        {/* Main Content Area with proper scrolling */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="sequencing" element={<ColorSequencingPage />} />
              <Route path="advanced" element={<AdvancedAlgorithmPage />} />
              <Route path="custom-simulation" element={<CustomSimulationPage />} />
              <Route path="buffers" element={<BufferManagementPage />} />
              <Route path="conveyors" element={<ConveyorLinesPage />} />
              <Route path="analytics" element={<ProductionAnalyticsPage />} />
              <Route path="dataset" element={<VehicleDatasetPage />} />
              <Route path="optimization" element={<MLOptimizationPage />} />
              <Route path="alerts" element={<SystemAlertsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </AdvancedAlgorithmProvider>
  );
}

// Manufacturing system components
function ColorSequencingPage() {
  // Use advanced algorithm context instead of basic useScheduling
  const {
    systemStatus,
    isRunning,
    isAdvancedMode,
    startScheduling,
    stopScheduling,
    resetSystem,
    toggleMode,
    stopColor,
    resumeColor,
    faultBuffer,
    clearBufferFault
  } = useAdvancedAlgorithm();

  const [notifications, setNotifications] = useState([]);
  const [realtimeBufferData, setRealtimeBufferData] = useState({});
  const [recentSequence, setRecentSequence] = useState([]);
  const [vehicleStats, setVehicleStats] = useState(null);
  const [algorithmSpeed, setAlgorithmSpeed] = useState(3000); // Default 3 seconds
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Setup real-time data listeners
  useEffect(() => {
    const setupRealtimeData = async () => {
      try {
        // Import the realtime service
        const { default: realtimeDataService } = await import('../services/realtimeDataService');

        // Setup listeners for real-time updates
        realtimeDataService.setupAllListeners(
          (bufferData) => {
            console.log('📊 Received buffer update:', bufferData);
            const totalVehicles = Object.values(bufferData).reduce((sum, b) => sum + b.vehicles.length, 0);
            setRealtimeBufferData(bufferData);

            // Show buffer status for each line
            Object.entries(bufferData).forEach(([lineId, buffer]) => {
              if (buffer.vehicles.length > 0) {
                console.log(`📊 Buffer ${lineId}: ${buffer.vehicles.length}/${buffer.capacity} vehicles - Colors: ${buffer.vehicles.map(v => v.color).join(', ')}`);
              }
            });

            if (totalVehicles > 0) {
              addNotification(`Buffers updated: ${totalVehicles} vehicles distributed across lines`, 'info');
            }
          },
          (sequenceData) => {
            console.log('📋 Received sequence update:', sequenceData);
            setRecentSequence(sequenceData);
            if (sequenceData.length > 0) {
              const latestCar = sequenceData[0];
              addNotification(`Car ${latestCar.car_id} (${latestCar.color}) completed processing`, 'success');
            }
          }
        );

        // Get initial vehicle stats
        const stats = await realtimeDataService.getVehicleStats();
        setVehicleStats(stats);
        addNotification('Real-time data connection established', 'success');

        // Update stats periodically (reduced frequency to avoid quota issues)
        const statsInterval = setInterval(async () => {
          try {
            const updatedStats = await realtimeDataService.getVehicleStats();
            setVehicleStats(updatedStats);
          } catch (error) {
            console.error('Error updating stats:', error);
            // If quota exceeded, reduce frequency
            if (error.code === 'resource-exhausted') {
              console.warn('Firestore quota exceeded, reducing update frequency');
              clearInterval(statsInterval);
              // Restart with longer interval
              setTimeout(() => {
                const newInterval = setInterval(async () => {
                  try {
                    const updatedStats = await realtimeDataService.getVehicleStats();
                    setVehicleStats(updatedStats);
                  } catch (err) {
                    console.error('Reduced frequency stats update error:', err);
                  }
                }, 15000); // 15 seconds instead of 5
                return () => clearInterval(newInterval);
              }, 10000);
            }
          }
        }, 10000); // Increased from 5 to 10 seconds

        // Cleanup on unmount
        return () => {
          realtimeDataService.cleanup();
          clearInterval(statsInterval);
        };
      } catch (error) {
        console.error('Error setting up realtime data:', error);
        addNotification('Failed to setup real-time data connection', 'error');
      }
    };

    setupRealtimeData();
  }, []);

  // Add notification helper
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  // Enhanced start scheduling with notifications
  const handleStartScheduling = async () => {
    try {
      setLoading(true);
      setError(null);
      addNotification(`Starting ${isAdvancedMode ? 'Advanced' : 'Basic'} scheduling algorithm...`, 'info');
      await startScheduling(algorithmSpeed);
      addNotification(`${isAdvancedMode ? 'Advanced' : 'Basic'} scheduling algorithm started successfully!`, 'success');
    } catch (error) {
      setError(error.message);
      addNotification(`Failed to start algorithm: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed) => {
    setAlgorithmSpeed(newSpeed);
    if (isRunning) {
      // Restart with new speed
      stopScheduling();
      setTimeout(() => {
        startScheduling(newSpeed);
      }, 1000);
      addNotification(`Algorithm speed changed to ${newSpeed / 1000}s cycles`, 'info');
    }
  };

  // Enhanced stop scheduling with notifications
  const handleStopScheduling = () => {
    try {
      stopScheduling();
      addNotification(`${isAdvancedMode ? 'Advanced' : 'Basic'} scheduling algorithm stopped`, 'warning');
    } catch (error) {
      addNotification(`Failed to stop algorithm: ${error.message}`, 'error');
    }
  };

  // Handle reset system
  const handleResetSystem = async () => {
    try {
      setLoading(true);
      await resetSystem();
      addNotification('System reset successfully', 'success');
    } catch (error) {
      addNotification(`Failed to reset system: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { id: 'C1', name: 'White', percentage: 40, hex: '#FFFFFF' },
    { id: 'C2', name: 'Silver', percentage: 25, hex: '#C0C0C0' },
    { id: 'C3', name: 'Black', percentage: 12, hex: '#000000' },
    { id: 'C4', name: 'Red', percentage: 8, hex: '#FF0000' },
    { id: 'C5', name: 'Blue', percentage: 3, hex: '#0000FF' },
    { id: 'C6', name: 'Green', percentage: 2, hex: '#008000' },
    { id: 'C7', name: 'Yellow', percentage: 2, hex: '#FFFF00' },
    { id: 'C8', name: 'Orange', percentage: 2, hex: '#FFA500' },
    { id: 'C9', name: 'Purple', percentage: 2, hex: '#800080' },
    { id: 'C10', name: 'Brown', percentage: 2, hex: '#A52A2A' },
    { id: 'C11', name: 'Gray', percentage: 2, hex: '#808080' },
    { id: 'C12', name: 'Pink', percentage: 1, hex: '#FFC0CB' },
  ];

  const getColorHex = (colorId) => {
    const color = colors.find(c => c.id === colorId);
    return color ? color.hex : '#CCCCCC';
  };

  const renderBufferLine = (lineId) => {
    // Get real-time buffer data from Firestore
    const bufferState = realtimeBufferData[lineId] || { vehicles: [], capacity: 14 };
    const vehicles = bufferState.vehicles || [];
    const capacity = bufferState.capacity || (lineId.startsWith('L1') || lineId.startsWith('L2') || lineId.startsWith('L3') || lineId.startsWith('L4') ? 14 : 16);
    const current = vehicles.length;

    console.log(`🔍 Rendering buffer ${lineId}:`, {
      vehicleCount: vehicles.length,
      capacity,
      current,
      vehicleIds: vehicles.map(v => v.car_id).slice(0, 3) // Show first 3 car IDs
    });

    return (
      <div key={lineId} className="flex items-center mb-2">
        <span className="text-xs w-8 text-white">{lineId}</span>
        <div className="flex-1 bg-gray-700 rounded h-6 flex items-center px-2">
          {/* Render actual vehicles in buffer */}
          {vehicles.slice(0, capacity).map((vehicle, idx) => (
            <div
              key={`${vehicle.id}-${lineId}-${idx}`}
              className={`w-4 h-4 rounded-full mr-1 border border-gray-500 ${isRunning && idx < 2 ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: getColorHex(vehicle.color) }}
              title={`${vehicle.color} - Car ${vehicle.car_id}`}
            />
          ))}
          {/* Render empty slots */}
          {Array.from({ length: Math.max(0, capacity - vehicles.length) }, (_, idx) => (
            <div
              key={`empty-${lineId}-${idx}`}
              className="w-4 h-4 rounded-full mr-1 border border-gray-600 bg-gray-800"
            />
          ))}
        </div>
        <span className="text-xs ml-2 text-white">{current}/{capacity}</span>
        <div className={`ml-2 w-2 h-2 rounded-full ${current >= capacity ? 'bg-red-500' :
          current >= capacity * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Smart Color Sequencing System</h1>
          <p className="text-gray-600 mt-1">
            {isAdvancedMode ? 'Advanced mode with fault tolerance and color management' : 'Basic color sequencing optimization'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <button
              onClick={() => {
                toggleMode();
                addNotification(`Switched to ${!isAdvancedMode ? 'Advanced' : 'Basic'} mode`, 'success');
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isAdvancedMode ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAdvancedMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAdvancedMode ? 'text-indigo-600' : 'text-gray-500'}`}>
              {isAdvancedMode ? 'Advanced' : 'Basic'}
            </span>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
            {isRunning ? `RUNNING (${isAdvancedMode ? 'ADVANCED' : 'BASIC'})` : 'STOPPED'}
          </div>
          <div className="text-sm text-gray-500">
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-lg lg:text-xl font-semibold">Live Conveyor Visualization</h2>
              <div className="text-sm text-gray-600">
                Real-time Updates
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 min-h-96">
              <div className="text-white">
                <div className="space-y-6">
                  {/* Recent Sequence */}
                  <div className="border-b border-gray-700 pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-yellow-400">🏁 Recently Painted Cars (Exit Queue)</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{recentSequence.length} completed</span>
                        {isRunning && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 overflow-x-auto pb-2">
                      {recentSequence.slice(0, 15).map((vehicle, idx) => (
                        <div
                          key={`completed-${vehicle.id}-${idx}-${Date.now()}`}
                          className={`flex-shrink-0 ${isRunning && idx < 3 ? 'animate-bounce' : ''}`}
                          title={`${vehicle.color || 'Unknown'} - Car ${vehicle.car_id || 'N/A'} - Completed: ${vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleTimeString() : 'Unknown'}`}
                        >
                          <div className="text-center">
                            <svg width="22" height="14" viewBox="0 0 24 16" className="drop-shadow-md hover:scale-110 transition-transform">
                              <rect x="2" y="6" width="20" height="6" rx="2" fill={getColorHex(vehicle.color)} stroke="#374151" strokeWidth="1" />
                              <circle cx="6" cy="14" r="1.5" fill="#374151" />
                              <circle cx="18" cy="14" r="1.5" fill="#374151" />
                              {/* Add shine effect for recently completed */}
                              {idx < 3 && (
                                <rect x="4" y="7" width="2" height="2" rx="1" fill="rgba(255,255,255,0.8)" />
                              )}
                            </svg>
                            <div className="text-xs text-gray-400 mt-1 truncate w-6">
                              {vehicle.car_id ? String(vehicle.car_id).slice(-3) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                      {recentSequence.length === 0 && (
                        <div className="text-gray-500 text-sm italic flex items-center space-x-2">
                          <span>🔄</span>
                          <span>Waiting for completed cars...</span>
                        </div>
                      )}
                    </div>
                    {recentSequence.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ← Latest | Oldest → | Total Processed: {systemStatus?.metrics?.totalProcessed || 0}
                      </div>
                    )}
                  </div>

                  {/* Oven 1 Lines */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-blue-400">Oven 1 (O1) - High Volume Colors</h3>
                    <div className="space-y-2">
                      {['L1', 'L2', 'L3', 'L4'].map(lineId =>
                        renderBufferLine(lineId)
                      )}
                    </div>
                  </div>

                  {/* Oven 2 Lines */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-orange-400">Oven 2 (O2) - Medium/Low Volume Colors</h3>
                    <div className="space-y-2">
                      {['L5', 'L6', 'L7', 'L8', 'L9'].map(lineId =>
                        renderBufferLine(lineId)
                      )}
                    </div>
                  </div>

                  {/* Main Conveyor Status */}
                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-medium mb-2 text-green-400">Main Conveyor to Top Coat Oven</h3>
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{systemStatus?.metrics?.jph?.toFixed(1) || '0.0'}</div>
                        <div className="text-xs text-gray-400">JPH</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{systemStatus?.metrics?.totalProcessed || 0}</div>
                        <div className="text-xs text-gray-400">Processed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{systemStatus?.metrics?.efficiency?.toFixed(1) || '0.0'}%</div>
                        <div className="text-xs text-gray-400">Efficiency</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Algorithm Controls</h2>

            {/* Quick Add Cars Button */}
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all mb-3 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <span>✨</span>
              <span>Quick Add Custom Cars</span>
              <span>🚗</span>
            </button>

            <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
              <strong>Reset Button:</strong> Stops the algorithm, resets all vehicles to "waiting" status,
              clears all buffers, and resets performance metrics. Use this to start fresh.
            </div>
            <div className="space-y-3">
              {!isRunning ? (
                <button
                  onClick={handleStartScheduling}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    '▶️ Start Scheduling Algorithm'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStopScheduling}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏹️ Stop Algorithm
                </button>
              )}

              <button
                onClick={async () => {
                  try {
                    addNotification('Resetting system...', 'info');
                    await resetSystem();
                    addNotification('System reset successfully!', 'success');
                  } catch (error) {
                    addNotification(`Reset failed: ${error.message}`, 'error');
                  }
                }}
                disabled={loading || isRunning}
                className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset all vehicles to waiting status, clear buffers, and reset metrics. Must stop algorithm first."
              >
                🔄 Reset System
              </button>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Algorithm Speed: {algorithmSpeed / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={algorithmSpeed}
                  onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fast (1s)</span>
                  <span>Slow (10s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Algorithm Controls */}
          {isAdvancedMode && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-indigo-800">Advanced Controls</h2>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  ADVANCED MODE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Management */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Color Management</h3>
                  <ColorControlPanel
                    stopColor={stopColor}
                    resumeColor={resumeColor}
                    stoppedColors={systemStatus?.stoppedColors || []}
                    addNotification={addNotification}
                  />
                </div>

                {/* Buffer Management */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Buffer Management</h3>
                  <BufferControlPanel
                    faultBuffer={faultBuffer}
                    clearBufferFault={clearBufferFault}
                    faultedBuffers={systemStatus?.faultedBuffers || []}
                    addNotification={addNotification}
                  />
                </div>
              </div>

              {/* Advanced Status */}
              {systemStatus && (
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{systemStatus.stoppedColors?.length || 0}</div>
                      <div className="text-sm text-gray-600">Stopped Colors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{systemStatus.faultedBuffers?.length || 0}</div>
                      <div className="text-sm text-gray-600">Faulted Buffers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{systemStatus.metrics?.reroutes || 0}</div>
                      <div className="text-sm text-gray-600">Reroutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {systemStatus.bufferReadiness ?
                          Object.values(systemStatus.bufferReadiness).filter(b => b.isFull).length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Full Buffers</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Real-time Metrics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicles Processed</span>
                <span className="font-semibold text-blue-600">{systemStatus?.metrics?.totalProcessed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Color Changeovers</span>
                <span className="font-semibold text-orange-600">{systemStatus?.metrics?.colorChangeovers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buffer Overflows</span>
                <span className="font-semibold text-red-600">{systemStatus?.metrics?.bufferOverflows || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">System Efficiency</span>
                <span className="font-semibold text-green-600">{systemStatus?.metrics?.efficiency?.toFixed(1) || '0.0'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current JPH</span>
                <span className="font-semibold text-purple-600">{systemStatus?.metrics?.jph?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Live Vehicle Stats</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Waiting:</span>
                <span className="font-semibold text-yellow-600">{vehicleStats?.waiting || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">In Buffer:</span>
                <span className="font-semibold text-blue-600">{vehicleStats?.in_buffer || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing:</span>
                <span className="font-semibold text-green-600">{vehicleStats?.processing || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed:</span>
                <span className="font-semibold text-gray-600">{vehicleStats?.completed || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recently Completed Cars</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentSequence.length > 0 ? (
                recentSequence.slice(0, 10).map((vehicle, idx) => (
                  <div key={`completed-card-${vehicle.id || idx}-${Date.now()}-${idx}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: getColorHex(vehicle.color || 'C1') }}
                        title={`${vehicle.color || 'Unknown'} car`}
                      />
                      <div>
                        <div className="font-semibold text-sm">{vehicle.car_id || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{vehicle.color || 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleTimeString() : 'Unknown'}
                      </div>
                      <div className="text-xs text-green-600 font-medium">✓ Completed</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🚗</div>
                  <div className="text-sm">No completed cars yet</div>
                  <div className="text-xs">Start the algorithm to see results</div>
                </div>
              )}
            </div>
            {recentSequence.length > 10 && (
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-500">
                  +{recentSequence.length - 10} more completed cars
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Color Distribution</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {colors.map(color => (
                <div key={color.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-medium">{color.id}</span>
                    <span className="text-gray-600">{color.name}</span>
                  </div>
                  <span className="font-semibold">{color.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
        />
      ))}

      {/* Quick Add Cars Modal */}
      {showQuickAdd && (
        <QuickAddCars
          onClose={() => setShowQuickAdd(false)}
          onSuccess={(count) => {
            addNotification(`Successfully added ${count} custom cars! Ready to run algorithm.`, 'success');
            setShowQuickAdd(false);
            // Refresh vehicle stats
            setTimeout(async () => {
              const { default: realtimeDataService } = await import('../services/realtimeDataService');
              const stats = await realtimeDataService.getVehicleStats();
              setVehicleStats(stats);
            }, 1000);
          }}
        />
      )}
    </div>
  );
}

function BufferManagementPage() {
  const [realtimeBufferData, setRealtimeBufferData] = useState({});
  const [vehicleStats, setVehicleStats] = useState(null);

  // Setup real-time buffer data
  useEffect(() => {
    const setupBufferData = async () => {
      try {
        const { default: realtimeDataService } = await import('../services/realtimeDataService');

        realtimeDataService.setupAllListeners(
          (bufferData) => {
            setRealtimeBufferData(bufferData);
          },
          () => { } // No need for sequence data here
        );

        const stats = await realtimeDataService.getVehicleStats();
        setVehicleStats(stats);

        const interval = setInterval(async () => {
          const updatedStats = await realtimeDataService.getVehicleStats();
          setVehicleStats(updatedStats);
        }, 5000);

        return () => {
          clearInterval(interval);
          realtimeDataService.cleanup();
        };
      } catch (error) {
        console.error('Error setting up buffer data:', error);
      }
    };

    setupBufferData();
  }, []);

  // Convert real-time data to buffer format
  const buffers = Object.entries(realtimeBufferData).map(([id, data]) => {
    const current = data.vehicles.length;
    const capacity = data.capacity;
    const percentage = (current / capacity) * 100;

    let status = 'active';
    if (current === 0) status = 'empty';
    else if (percentage >= 100) status = 'full';
    else if (percentage >= 80) status = 'warning';
    else if (percentage <= 20) status = 'low';

    return {
      id,
      capacity,
      current,
      status,
      oven: data.oven,
      vehicles: data.vehicles,
      percentage
    };
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'full': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'empty': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getColorHex = (colorId) => {
    const colorMap = {
      'C1': '#FFFFFF', 'C2': '#C0C0C0', 'C3': '#000000', 'C4': '#FF0000',
      'C5': '#0000FF', 'C6': '#008000', 'C7': '#FFFF00', 'C8': '#FFA500',
      'C9': '#800080', 'C10': '#A52A2A', 'C11': '#808080', 'C12': '#FFC0CB'
    };
    return colorMap[colorId] || '#CCCCCC';
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Buffer Management System</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time Data</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold mb-4">Real-time Buffer Status</h2>
            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              {/* Oven 1 Buffers */}
              <div>
                <h3 className="text-base lg:text-lg font-medium mb-4 text-blue-600">Oven 1 (O1) Buffers</h3>
                <div className="space-y-3">
                  {buffers.filter(b => b.oven === 'O1').map(buffer => (
                    <div key={buffer.id} className="border rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{buffer.id}</span>
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(buffer.status)}`}>
                          {buffer.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Capacity: {buffer.capacity}</span>
                        <span>Current: {buffer.current}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(buffer.status)}`}
                          style={{ width: `${buffer.percentage}%` }}
                        />
                      </div>
                      {/* Show vehicle colors in buffer */}
                      {buffer.vehicles && buffer.vehicles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {buffer.vehicles.slice(0, 8).map((vehicle, idx) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full border border-gray-400"
                              style={{ backgroundColor: getColorHex(vehicle.color) }}
                              title={`${vehicle.car_id} (${vehicle.color})`}
                            />
                          ))}
                          {buffer.vehicles.length > 8 && (
                            <span className="text-xs text-gray-500">+{buffer.vehicles.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Oven 2 Buffers */}
              <div>
                <h3 className="text-base lg:text-lg font-medium mb-4 text-orange-600">Oven 2 (O2) Buffers</h3>
                <div className="space-y-3">
                  {buffers.filter(b => b.oven === 'O2').map(buffer => (
                    <div key={buffer.id} className="border rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{buffer.id}</span>
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(buffer.status)}`}>
                          {buffer.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Capacity: {buffer.capacity}</span>
                        <span>Current: {buffer.current}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getStatusColor(buffer.status)}`}
                          style={{ width: `${buffer.percentage}%` }}
                        />
                      </div>
                      {/* Show vehicle colors in buffer */}
                      {buffer.vehicles && buffer.vehicles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {buffer.vehicles.slice(0, 8).map((vehicle, idx) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full border border-gray-400"
                              style={{ backgroundColor: getColorHex(vehicle.color) }}
                              title={`${vehicle.car_id} (${vehicle.color})`}
                            />
                          ))}
                          {buffer.vehicles.length > 8 && (
                            <span className="text-xs text-gray-500">+{buffer.vehicles.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-semibold mb-4">Live System Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Capacity</span>
                <span className="font-semibold">{buffers.reduce((sum, b) => sum + b.capacity, 0)} vehicles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Load</span>
                <span className="font-semibold">{buffers.reduce((sum, b) => sum + b.current, 0)} vehicles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Utilization</span>
                <span className="font-semibold text-green-600">
                  {buffers.length > 0 ?
                    ((buffers.reduce((sum, b) => sum + b.current, 0) / buffers.reduce((sum, b) => sum + b.capacity, 0)) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Space</span>
                <span className="font-semibold">
                  {buffers.reduce((sum, b) => sum + (b.capacity - b.current), 0)} vehicles
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Buffers</span>
                <span className="font-semibold text-blue-600">
                  {buffers.filter(b => b.status === 'active').length}/{buffers.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
                Emergency Stop
              </button>
              <button className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">
                Clear Buffer L9
              </button>
              <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                Rebalance Loads
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Submissions</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📤</div>
          <h3 className="text-xl font-semibold mb-2">Submit Your Project</h3>
          <p className="text-gray-600 mb-4">Upload your project files and documentation</p>
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
            Upload Submission
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Leaderboard</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { rank: 1, team: 'Code Warriors', project: 'AI Assistant', score: 95 },
              { rank: 2, team: 'Tech Titans', project: 'Smart City', score: 92 },
              { rank: 3, team: 'Innovation Hub', project: 'EcoTracker', score: 88 },
              { rank: 4, team: 'Digital Pioneers', project: 'HealthBot', score: 85 },
              { rank: 5, team: 'Future Builders', project: 'EduPlatform', score: 82 },
            ].map((entry) => (
              <tr key={entry.rank}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{entry.rank}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.team}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.project}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourcesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Resources</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">📚 Documentation</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-blue-500 hover:underline">Hackathon Guidelines</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">API Documentation</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Submission Format</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Judging Criteria</a></li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">🛠️ Tools & APIs</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-blue-500 hover:underline">Firebase Setup Guide</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">React Resources</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Design Assets</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Third-party APIs</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}



function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Notifications</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                Email notifications for updates
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                SMS notifications for deadlines
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Privacy</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                Show profile to other participants
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" />
                Allow team invitations
              </label>
            </div>
          </div>

          <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function ConveyorLinesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Conveyor Lines Control</h1>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Oven 1 (O1) Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Status</span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Speed</span>
              <span className="font-semibold">85 JPH</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Temperature</span>
              <span className="font-semibold">180°C</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Connected Lines</span>
              <span className="font-semibold">L1, L2, L3, L4, L5-L9</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Oven 2 (O2) Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Status</span>
              <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">REDUCED SPEED</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Speed</span>
              <span className="font-semibold">65 JPH</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Temperature</span>
              <span className="font-semibold">175°C</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Connected Lines</span>
              <span className="font-semibold">L5, L6, L7, L8, L9</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Main Conveyor to Top Coat Oven</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">L3</div>
            <div className="text-sm text-gray-600">Currently Feeding</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">42</div>
            <div className="text-sm text-gray-600">Vehicles/Hour</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">98.5%</div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionAnalyticsPage() {
  const { systemStatus } = useScheduling();
  const [realtimeData, setRealtimeData] = useState({
    hourlyProduction: [],
    colorDistribution: {},
    bufferUtilization: {},
    efficiency: 0
  });
  const [vehicleStats, setVehicleStats] = useState(null);

  // Setup real-time data for analytics
  useEffect(() => {
    const setupAnalyticsData = async () => {
      try {
        const { default: realtimeDataService } = await import('../services/realtimeDataService');

        // Get initial stats
        const stats = await realtimeDataService.getVehicleStats();
        setVehicleStats(stats);

        // Setup real-time listeners
        realtimeDataService.setupAllListeners(
          (bufferData) => {
            // Calculate buffer utilization
            const utilization = {};
            Object.entries(bufferData).forEach(([lineId, buffer]) => {
              utilization[lineId] = {
                current: buffer.vehicles.length,
                capacity: buffer.capacity,
                percentage: (buffer.vehicles.length / buffer.capacity) * 100
              };
            });

            setRealtimeData(prev => ({
              ...prev,
              bufferUtilization: utilization
            }));
          },
          (sequenceData) => {
            // Update hourly production data
            const now = new Date();
            const hour = now.getHours();

            setRealtimeData(prev => {
              const newHourlyData = [...prev.hourlyProduction];
              const existingHour = newHourlyData.find(h => h.hour === hour);

              if (existingHour) {
                existingHour.count = sequenceData.length;
              } else {
                newHourlyData.push({ hour, count: sequenceData.length });
              }

              return {
                ...prev,
                hourlyProduction: newHourlyData.slice(-24) // Keep last 24 hours
              };
            });
          }
        );

        // Update stats periodically
        const interval = setInterval(async () => {
          const updatedStats = await realtimeDataService.getVehicleStats();
          setVehicleStats(updatedStats);

          // Update color distribution
          if (updatedStats?.byColor) {
            setRealtimeData(prev => ({
              ...prev,
              colorDistribution: updatedStats.byColor,
              efficiency: systemStatus?.metrics?.efficiency || 0
            }));
          }
        }, 3000);

        return () => {
          clearInterval(interval);
          realtimeDataService.cleanup();
        };
      } catch (error) {
        console.error('Error setting up analytics data:', error);
      }
    };

    setupAnalyticsData();
  }, [systemStatus?.metrics?.efficiency]);

  // Generate mock hourly data for demonstration
  const generateHourlyData = () => {
    const hours = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push({
        time: hour.getHours() + ':00',
        production: Math.floor(Math.random() * 50) + 20,
        efficiency: Math.floor(Math.random() * 30) + 70
      });
    }
    return hours;
  };

  const hourlyData = generateHourlyData();

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Production Analytics</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
            {systemStatus?.metrics?.totalProcessed || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Vehicles Processed</div>
          <div className="text-xs text-green-600 mt-1">Real-time</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-2">
            {systemStatus?.metrics?.efficiency?.toFixed(1) || '0.0'}%
          </div>
          <div className="text-xs lg:text-sm text-gray-600">System Efficiency</div>
          <div className="text-xs text-green-600 mt-1">Live</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-orange-600 mb-2">
            {systemStatus?.metrics?.colorChangeovers || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Color Changeovers</div>
          <div className="text-xs text-orange-600 mt-1">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 text-center">
          <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">
            {systemStatus?.metrics?.bufferOverflows || 0}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Buffer Overflows</div>
          <div className="text-xs text-red-600 mt-1">Alerts</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
        {/* Hourly Production Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4">Hourly Production Rate</h2>
          <div className="h-64 relative">
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {hourlyData.slice(-12).map((data, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <div
                    className="bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                    style={{
                      height: `${(data.production / 70) * 200}px`,
                      width: '20px'
                    }}
                    title={`${data.time}: ${data.production} vehicles`}
                  ></div>
                  <div className="text-xs text-gray-600 transform -rotate-45 origin-center">
                    {data.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>JPH: {systemStatus?.metrics?.jph?.toFixed(1) || '0.0'}</span>
            <span>Avg: {(hourlyData.reduce((sum, d) => sum + d.production, 0) / hourlyData.length).toFixed(1)}</span>
          </div>
        </div>

        {/* Color Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4">Live Color Distribution</h2>
          <div className="h-64 flex flex-col justify-center">
            {vehicleStats?.byColor ? (
              <div className="space-y-3">
                {Object.entries(vehicleStats.byColor).slice(0, 8).map(([color, count]) => {
                  const percentage = (count / vehicleStats.total) * 100;
                  const colorMap = {
                    'C1': '#FFFFFF', 'C2': '#C0C0C0', 'C3': '#000000', 'C4': '#FF0000',
                    'C5': '#0000FF', 'C6': '#008000', 'C7': '#FFFF00', 'C8': '#FFA500'
                  };
                  return (
                    <div key={color} className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: colorMap[color] || '#CCCCCC' }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{color}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colorMap[color] || '#CCCCCC'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <span>Loading real-time data...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buffer Utilization */}
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold mb-4">Real-time Buffer Utilization</h2>
        <div className="grid grid-cols-3 lg:grid-cols-9 gap-4">
          {Object.entries(realtimeData.bufferUtilization).map(([lineId, data]) => (
            <div key={lineId} className="text-center">
              <div className="text-sm font-semibold mb-2">{lineId}</div>
              <div className="relative w-full h-20 bg-gray-200 rounded">
                <div
                  className={`absolute bottom-0 w-full rounded transition-all duration-500 ${data.percentage > 90 ? 'bg-red-500' :
                    data.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  style={{ height: `${data.percentage}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                  {data.current}/{data.capacity}
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {data.percentage.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VehicleDatasetPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentVehicles();
  }, []);

  const loadStats = async () => {
    const result = await dataInitService.getVehicleStats();
    if (result.success) {
      setStats(result.data);
    }
  };

  const loadRecentVehicles = async () => {
    try {
      const vehiclesRef = collection(db, 'cars');
      const q = query(vehiclesRef, orderBy('updated_at', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const vehicleData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleInitializeData = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Import the JSON data from public folder
      const response = await fetch('/scripts/cars_dataset.json');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle dataset');
      }
      const vehicleData = await response.json();

      console.log(`Loaded ${vehicleData.length} vehicles from dataset`);

      const result = await dataInitService.initializeVehicles(vehicleData);
      setMessage(result.message);

      if (result.success) {
        await loadStats();
        await loadRecentVehicles();
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all vehicle data? This will stop any running algorithms.')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await dataInitService.resetVehicleData();
      setMessage(result.message);

      if (result.success) {
        await loadStats();
        await loadRecentVehicles();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-gray-100 text-gray-800';
      case 'in_buffer': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorHex = (colorId) => {
    const colorMap = {
      'C1': '#FFFFFF', 'C2': '#C0C0C0', 'C3': '#000000', 'C4': '#FF0000',
      'C5': '#0000FF', 'C6': '#008000', 'C7': '#FFFF00', 'C8': '#FFA500',
      'C9': '#800080', 'C10': '#A52A2A', 'C11': '#808080', 'C12': '#FFC0CB'
    };
    return colorMap[colorId] || '#CCCCCC';
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Vehicle Dataset Management</h1>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dataset Overview</h2>
          <div className="flex space-x-3">
            <button
              onClick={handleInitializeData}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Initialize Dataset'}
            </button>
            <button
              onClick={handleResetData}
              disabled={loading}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset All Data
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Object.keys(stats.byColor).length}</div>
              <div className="text-sm text-gray-600">Color Variants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.byStatus.completed || 0}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.byStatus.waiting || 0}</div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Status Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Color Distribution</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(stats.byColor).map(([color, count]) => (
                  <div key={color} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      <span>{color}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Buffer Distribution</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(stats.byBuffer).map(([buffer, count]) => (
                  <div key={buffer} className="flex justify-between">
                    <span>{buffer}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">Recent Vehicle Updates</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Vehicle ID</th>
                <th className="px-4 py-2 text-left">Color</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Buffer Line</th>
                <th className="px-4 py-2 text-left">Oven</th>
                <th className="px-4 py-2 text-left">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-4 py-2 font-medium">{vehicle.car_id}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorHex(vehicle.color) }}
                      />
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {vehicle.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2">{vehicle.buffer_line || '-'}</td>
                  <td className="px-4 py-2">{vehicle.oven || '-'}</td>
                  <td className="px-4 py-2">
                    {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MLOptimizationPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ML Optimization Engine</h1>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Algorithm Performance</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Color Grouping Efficiency</span>
                  <span className="font-semibold">94.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Buffer Overflow Prevention</span>
                  <span className="font-semibold">98.7%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '98.7%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Throughput Optimization</span>
                  <span className="font-semibold">91.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '91.5%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Model Controls</h2>
            <div className="space-y-3">
              <button className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600">
                Start Training
              </button>
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600">
                Deploy Model
              </button>
              <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600">
                Retrain Algorithm
              </button>
              <button className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600">
                Export Results
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Real-time Predictions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">15 min</div>
            <div className="text-sm text-gray-600">Next Buffer Overflow Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">8</div>
            <div className="text-sm text-gray-600">Optimal Changeover Sequence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">+12%</div>
            <div className="text-sm text-gray-600">Predicted Efficiency Gain</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemAlertsPage() {
  const alerts = [
    { id: 1, type: 'critical', message: 'Buffer L2 approaching capacity limit', time: '2 min ago', status: 'active' },
    { id: 2, type: 'warning', message: 'Oven O2 speed reduced due to cross-line routing', time: '5 min ago', status: 'active' },
    { id: 3, type: 'info', message: 'Color changeover completed on L7', time: '12 min ago', status: 'resolved' },
    { id: 4, type: 'critical', message: 'Buffer L9 maintenance required', time: '1 hour ago', status: 'acknowledged' },
    { id: 5, type: 'warning', message: 'High color changeover frequency detected', time: '2 hours ago', status: 'resolved' },
  ];

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-500';
      case 'acknowledged': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">System Alerts & Notifications</h1>

      <div className="grid lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">2</div>
          <div className="text-sm text-gray-600">Critical Alerts</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">1</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
          <div className="text-sm text-gray-600">Info Messages</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">2</div>
          <div className="text-sm text-gray-600">Resolved Today</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Alerts</h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Mark All as Read
          </button>
        </div>

        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                  <p className="text-gray-800">{alert.message}</p>
                </div>
                <div className="flex space-x-2">
                  {alert.status === 'active' && (
                    <>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Acknowledge</button>
                      <button className="text-green-600 hover:text-green-800 text-sm">Resolve</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Advanced Algorithm Page with Enhanced Controls
function AdvancedAlgorithmPage() {
  // Use the shared context instead of local state
  const {
    isAdvancedMode,
    systemStatus,
    toggleMode
  } = useAdvancedAlgorithm();

  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleToggleMode = () => {
    toggleMode();
    addNotification(
      `Switched to ${!isAdvancedMode ? 'Advanced' : 'Basic'} Algorithm Mode`,
      'success'
    );
  };

  return (
    <div className="p-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Advanced Scheduling Algorithm</h1>
            <p className="text-gray-600 mt-2">
              Enhanced scheduling with fault tolerance, color management, and intelligent rerouting
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Algorithm Mode:</span>
            <button
              onClick={handleToggleMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isAdvancedMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAdvancedMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAdvancedMode ? 'text-indigo-600' : 'text-gray-500'}`}>
              {isAdvancedMode ? 'Advanced' : 'Basic'}
            </span>
          </div>
        </div>

        {/* Mode Description */}
        <div className={`p-4 rounded-lg border-l-4 ${isAdvancedMode
          ? 'bg-indigo-50 border-indigo-400'
          : 'bg-gray-50 border-gray-400'
          }`}>
          <h3 className="font-semibold text-gray-800 mb-2">
            {isAdvancedMode ? 'Advanced Mode Features:' : 'Basic Mode Features:'}
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {isAdvancedMode ? (
              <>
                <li>• Color stop/resume functionality with reason tracking</li>
                <li>• Buffer fault management and automatic rerouting</li>
                <li>• Intelligent fallback buffer selection</li>
                <li>• 50% utilization rule for optimal buffer usage</li>
                <li>• Enhanced metrics and fault tolerance</li>
              </>
            ) : (
              <>
                <li>• Standard color sequencing optimization</li>
                <li>• Basic buffer allocation and management</li>
                <li>• Standard changeover minimization</li>
                <li>• Core performance metrics</li>
                <li>• Simple fault handling</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{systemStatus?.metrics?.totalProcessed || 0}</div>
            <div className="text-sm text-gray-600">Processed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{systemStatus?.metrics?.colorChangeovers || 0}</div>
            <div className="text-sm text-gray-600">Changeovers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{systemStatus?.metrics?.efficiency?.toFixed(1) || '0.0'}%</div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{systemStatus?.metrics?.jph?.toFixed(1) || '0.0'}</div>
            <div className="text-sm text-gray-600">JPH</div>
          </div>
          {isAdvancedMode && systemStatus.stoppedColors && (
            <>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{systemStatus.stoppedColors.length}</div>
                <div className="text-sm text-gray-600">Stopped Colors</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{systemStatus.faultedBuffers.length}</div>
                <div className="text-sm text-gray-600">Faulted Buffers</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Algorithm Controls */}
      {isAdvancedMode ? (
        <AdvancedBufferControl />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Algorithm Controls</h2>
          <p className="text-gray-600 mb-4">
            Switch to Advanced Mode to access enhanced features like color stopping, buffer fault management,
            and intelligent rerouting capabilities.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleToggleMode}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Enable Advanced Mode
            </button>
            <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              View Basic Settings
            </button>
          </div>
        </div>
      )}

      {/* Advanced Features Showcase */}
      {isAdvancedMode && (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8 border border-indigo-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-indigo-900 mb-2">🚀 Advanced Features Active</h2>
              <p className="text-indigo-700">Enhanced capabilities for optimal production control</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">LIVE</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🎨</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Smart Color Control</h3>
                  <p className="text-sm text-gray-600">Dynamic stop/resume with tracking</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Buffer Intelligence</h3>
                  <p className="text-sm text-gray-600">Auto-rerouting & fault handling</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Enhanced Analytics</h3>
                  <p className="text-sm text-gray-600">Real-time metrics & insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Color Control Panel Component
function ColorControlPanel({ stopColor, resumeColor, stoppedColors, addNotification }) {
  const [selectedColor, setSelectedColor] = useState('C1');
  const [stopReason, setStopReason] = useState('');

  const colors = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

  const handleStopColor = () => {
    try {
      const reason = stopReason || 'Manual stop from Color Sequencing page';
      const result = stopColor(selectedColor, reason);
      if (result.success) {
        setStopReason('');
        addNotification(`Color ${selectedColor} stopped: ${reason}`, 'warning');
      } else {
        addNotification(`Failed to stop color: ${result.message}`, 'error');
      }
    } catch (error) {
      addNotification(`Error stopping color: ${error.message}`, 'error');
    }
  };

  const handleResumeColor = () => {
    try {
      const result = resumeColor(selectedColor);
      if (result.success) {
        addNotification(`Color ${selectedColor} resumed`, 'success');
      } else {
        addNotification(`Failed to resume color: ${result.message}`, 'error');
      }
    } catch (error) {
      addNotification(`Error resuming color: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Select Color:</label>
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        >
          {colors.map(color => (
            <option key={color} value={color}>
              {color} {stoppedColors.includes(color) ? '(STOPPED)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stop Reason:</label>
        <input
          type="text"
          value={stopReason}
          onChange={(e) => setStopReason(e.target.value)}
          placeholder="Quality issue, material shortage, etc."
          className="w-full p-2 border rounded text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleStopColor}
          disabled={stoppedColors.includes(selectedColor)}
          className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
        >
          Stop Color
        </button>
        <button
          onClick={handleResumeColor}
          disabled={!stoppedColors.includes(selectedColor)}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
        >
          Resume Color
        </button>
      </div>

      {stoppedColors.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 rounded">
          <div className="text-sm font-medium text-red-800 mb-1">Stopped Colors:</div>
          <div className="flex flex-wrap gap-1">
            {stoppedColors.map(color => (
              <span key={color} className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">
                {color}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Buffer Control Panel Component
function BufferControlPanel({ faultBuffer, clearBufferFault, faultedBuffers, addNotification }) {
  const [selectedBuffer, setSelectedBuffer] = useState('L1');
  const [faultReason, setFaultReason] = useState('');

  const buffers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

  const handleFaultBuffer = () => {
    try {
      const reason = faultReason || 'Manual fault from Color Sequencing page';
      const result = faultBuffer(selectedBuffer, reason);
      if (result.success) {
        setFaultReason('');
        addNotification(`Buffer ${selectedBuffer} faulted: ${reason}`, 'warning');
      } else {
        addNotification(`Failed to fault buffer: ${result.message}`, 'error');
      }
    } catch (error) {
      addNotification(`Error faulting buffer: ${error.message}`, 'error');
    }
  };

  const handleClearFault = () => {
    try {
      const result = clearBufferFault(selectedBuffer);
      if (result.success) {
        addNotification(`Buffer ${selectedBuffer} fault cleared`, 'success');
      } else {
        addNotification(`Failed to clear fault: ${result.message}`, 'error');
      }
    } catch (error) {
      addNotification(`Error clearing fault: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Select Buffer:</label>
        <select
          value={selectedBuffer}
          onChange={(e) => setSelectedBuffer(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        >
          {buffers.map(buffer => (
            <option key={buffer} value={buffer}>
              {buffer} {faultedBuffers.includes(buffer) ? '(FAULTED)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Fault Reason:</label>
        <input
          type="text"
          value={faultReason}
          onChange={(e) => setFaultReason(e.target.value)}
          placeholder="Equipment failure, maintenance, etc."
          className="w-full p-2 border rounded text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleFaultBuffer}
          disabled={faultedBuffers.includes(selectedBuffer)}
          className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
        >
          Fault Buffer
        </button>
        <button
          onClick={handleClearFault}
          disabled={!faultedBuffers.includes(selectedBuffer)}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
        >
          Clear Fault
        </button>
      </div>

      {faultedBuffers.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 rounded">
          <div className="text-sm font-medium text-red-800 mb-1">Faulted Buffers:</div>
          <div className="flex flex-wrap gap-1">
            {faultedBuffers.map(buffer => (
              <span key={buffer} className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">
                {buffer}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}