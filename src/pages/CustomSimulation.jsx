import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAdvancedAlgorithm } from '../context/AdvancedAlgorithmContext';
import NotificationToast from '../components/NotificationToast';
import QuickAddCars from '../components/QuickAddCars';

export default function CustomSimulation() {
  const {
    systemStatus,
    isRunning,
    isAdvancedMode,
    startScheduling,
    stopScheduling,
    resetSystem,
    toggleMode
  } = useAdvancedAlgorithm();

  const [customCars, setCustomCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    byColor: {},
    byStatus: {}
  });
  const [algorithmSpeed, setAlgorithmSpeed] = useState(5000);

  // Fetch custom cars from Firestore
  const fetchCustomCars = async () => {
    setLoading(true);
    try {
      const carsRef = collection(db, 'cars');
      const q = query(
        carsRef,
        where('source', '==', 'manual_input'),
        orderBy('created_at', 'desc'),
        firestoreLimit(200)
      );
      
      const snapshot = await getDocs(q);
      const cars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCustomCars(cars);
      calculateStats(cars);
      addNotification(`Loaded ${cars.length} custom cars`, 'success');
    } catch (error) {
      console.error('Error fetching custom cars:', error);
      addNotification('Failed to load custom cars', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (cars) => {
    const byColor = {};
    const byStatus = {};
    
    cars.forEach(car => {
      // By color
      if (!byColor[car.color]) {
        byColor[car.color] = 0;
      }
      byColor[car.color]++;

      // By status
      if (!byStatus[car.status]) {
        byStatus[car.status] = 0;
      }
      byStatus[car.status]++;
    });

    setStats({
      total: cars.length,
      byColor,
      byStatus
    });
  };

  // Load custom cars on mount
  useEffect(() => {
    fetchCustomCars();
  }, []);

  // Add notification helper
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Handle start scheduling
  const handleStartScheduling = async () => {
    try {
      setLoading(true);
      addNotification(`Starting ${isAdvancedMode ? 'Advanced' : 'Basic'} simulation...`, 'info');
      await startScheduling(algorithmSpeed);
      addNotification('Simulation started successfully!', 'success');
    } catch (error) {
      addNotification(`Failed to start simulation: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle stop scheduling
  const handleStopScheduling = () => {
    try {
      stopScheduling();
      addNotification('Simulation stopped', 'warning');
    } catch (error) {
      addNotification(`Failed to stop simulation: ${error.message}`, 'error');
    }
  };

  // Handle reset system
  const handleResetSystem = async () => {
    if (!window.confirm('Are you sure you want to reset the simulation? This will reset all custom cars to waiting status.')) {
      return;
    }

    try {
      setLoading(true);
      await resetSystem();
      await fetchCustomCars(); // Reload cars
      addNotification('Simulation reset successfully', 'success');
    } catch (error) {
      addNotification(`Failed to reset simulation: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle quick add success
  const handleQuickAddSuccess = (count) => {
    addNotification(`Successfully added ${count} custom cars!`, 'success');
    fetchCustomCars(); // Reload cars
  };

  // Get color hex
  const getColorHex = (colorId) => {
    const colors = {
      'C1': '#FFFFFF', 'C2': '#C0C0C0', 'C3': '#000000', 'C4': '#FF0000',
      'C5': '#0000FF', 'C6': '#008000', 'C7': '#FFFF00', 'C8': '#FFA500',
      'C9': '#800080', 'C10': '#A52A2A', 'C11': '#808080', 'C12': '#FFC0CB'
    };
    return colors[colorId] || '#CCCCCC';
  };

  // Get color name
  const getColorName = (colorId) => {
    const names = {
      'C1': 'White', 'C2': 'Silver', 'C3': 'Black', 'C4': 'Red',
      'C5': 'Blue', 'C6': 'Green', 'C7': 'Yellow', 'C8': 'Orange',
      'C9': 'Purple', 'C10': 'Brown', 'C11': 'Gray', 'C12': 'Pink'
    };
    return names[colorId] || 'Unknown';
  };

  return (
    <div className="p-4 lg:p-8">
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

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddCars
          onClose={() => setShowQuickAdd(false)}
          onSuccess={handleQuickAddSuccess}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Custom Car Simulation</h1>
          <p className="text-gray-600 mt-1">
            Run simulations with your manually added custom cars
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
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isAdvancedMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  isAdvancedMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAdvancedMode ? 'text-indigo-600' : 'text-gray-500'}`}>
              {isAdvancedMode ? 'Advanced' : 'Basic'}
            </span>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isRunning ? `RUNNING (${isAdvancedMode ? 'ADVANCED' : 'BASIC'})` : 'STOPPED'}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Custom Cars</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.byStatus?.waiting || 0}</div>
          <div className="text-sm text-gray-600">Waiting</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.byStatus?.in_buffer || 0}</div>
          <div className="text-sm text-gray-600">In Buffer</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.byStatus?.completed || 0}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Add Button */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md p-6 text-white">
            <h2 className="text-xl font-semibold mb-3">Add Custom Cars</h2>
            <p className="text-blue-100 text-sm mb-4">
              Quickly add custom car sequences for testing
            </p>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="w-full bg-white text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              ➕ Quick Add Cars
            </button>
          </div>

          {/* Simulation Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Simulation Controls</h2>
            
            <div className="space-y-3">
              {!isRunning ? (
                <button
                  onClick={handleStartScheduling}
                  disabled={loading || stats.total === 0}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  ▶️ Start Simulation
                </button>
              ) : (
                <button
                  onClick={handleStopScheduling}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  ⏹️ Stop Simulation
                </button>
              )}

              <button
                onClick={handleResetSystem}
                disabled={loading || isRunning}
                className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                🔄 Reset Simulation
              </button>

              <button
                onClick={fetchCustomCars}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                🔃 Refresh Data
              </button>
            </div>

            {/* Speed Control */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Simulation Speed: {algorithmSpeed / 1000}s
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={algorithmSpeed}
                onChange={(e) => setAlgorithmSpeed(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Fast (1s)</span>
                <span>Slow (10s)</span>
              </div>
            </div>
          </div>

          {/* Real-time Metrics */}
          {systemStatus && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Real-time Metrics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed</span>
                  <span className="font-semibold text-blue-600">{systemStatus?.metrics?.totalProcessed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Changeovers</span>
                  <span className="font-semibold text-orange-600">{systemStatus?.metrics?.colorChangeovers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency</span>
                  <span className="font-semibold text-green-600">{systemStatus?.metrics?.efficiency?.toFixed(1) || '0.0'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">JPH</span>
                  <span className="font-semibold text-purple-600">{systemStatus?.metrics?.jph?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Data Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Color Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Color Distribution</h2>
            {Object.keys(stats.byColor).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byColor)
                  .sort(([, a], [, b]) => b - a)
                  .map(([color, count]) => (
                    <div key={color} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        <span className="font-semibold">{color}</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{count}</div>
                      <div className="text-sm text-gray-500">
                        {((count / stats.total) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">{getColorName(color)}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No custom cars added yet. Click "Quick Add Cars" to get started!
              </div>
            )}
          </div>

          {/* Custom Cars List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Custom Cars ({customCars.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const waiting = customCars.filter(c => c.status === 'waiting');
                    addNotification(`${waiting.length} cars waiting`, 'info');
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium"
                >
                  Waiting: {customCars.filter(c => c.status === 'waiting').length}
                </button>
                <button
                  onClick={() => {
                    const completed = customCars.filter(c => c.status === 'completed');
                    addNotification(`${completed.length} cars completed`, 'info');
                  }}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium"
                >
                  Completed: {customCars.filter(c => c.status === 'completed').length}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading custom cars...</p>
              </div>
            ) : customCars.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {customCars.slice(0, 100).map((car) => (
                    <div
                      key={car.id}
                      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                        car.status === 'completed' ? 'bg-green-50' :
                        car.status === 'in_buffer' ? 'bg-blue-50' :
                        car.status === 'processing' ? 'bg-yellow-50' :
                        'bg-gray-50'
                      }`}
                      title={`${car.car_id} - ${getColorName(car.color)} - ${car.status}`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 mb-2"
                        style={{ backgroundColor: getColorHex(car.color) }}
                      />
                      <div className="text-xs font-semibold text-gray-700">{car.car_id}</div>
                      <div className="text-xs text-gray-500">{car.color}</div>
                    </div>
                  ))}
                </div>
                {customCars.length > 100 && (
                  <div className="text-center mt-4 text-sm text-gray-500">
                    Showing 100 of {customCars.length} cars
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No custom cars found.</p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Your First Custom Cars
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}