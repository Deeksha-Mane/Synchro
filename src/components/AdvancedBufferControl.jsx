import React, { useState, useEffect } from 'react';
import { advancedSchedulingService } from '../services/advancedSchedulingService';

const AdvancedBufferControl = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedColor, setSelectedColor] = useState('C1');
  const [selectedBuffer, setSelectedBuffer] = useState('L1');
  const [stopReason, setStopReason] = useState('');
  const [faultReason, setFaultReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);

  const colors = [
    { id: 'C1', name: 'White', hex: '#FFFFFF', priority: 'High' },
    { id: 'C2', name: 'Silver', hex: '#C0C0C0', priority: 'High' },
    { id: 'C3', name: 'Black', hex: '#000000', priority: 'High' },
    { id: 'C4', name: 'Red', hex: '#FF0000', priority: 'Medium' },
    { id: 'C5', name: 'Blue', hex: '#0000FF', priority: 'Low' },
    { id: 'C6', name: 'Green', hex: '#008000', priority: 'Low' },
    { id: 'C7', name: 'Yellow', hex: '#FFFF00', priority: 'Low' },
    { id: 'C8', name: 'Orange', hex: '#FFA500', priority: 'Low' },
    { id: 'C9', name: 'Purple', hex: '#800080', priority: 'Low' },
    { id: 'C10', name: 'Brown', hex: '#A52A2A', priority: 'Low' },
    { id: 'C11', name: 'Gray', hex: '#808080', priority: 'Low' },
    { id: 'C12', name: 'Pink', hex: '#FFC0CB', priority: 'Low' }
  ];
  
  const buffers = [
    { id: 'L1', name: 'Line 1', oven: 'O1', capacity: 14 },
    { id: 'L2', name: 'Line 2', oven: 'O1', capacity: 14 },
    { id: 'L3', name: 'Line 3', oven: 'O1', capacity: 14 },
    { id: 'L4', name: 'Line 4', oven: 'O1', capacity: 14 },
    { id: 'L5', name: 'Line 5', oven: 'O2', capacity: 16 },
    { id: 'L6', name: 'Line 6', oven: 'O2', capacity: 16 },
    { id: 'L7', name: 'Line 7', oven: 'O2', capacity: 16 },
    { id: 'L8', name: 'Line 8', oven: 'O2', capacity: 16 },
    { id: 'L9', name: 'Line 9', oven: 'O2', capacity: 16 }
  ];

  useEffect(() => {
    const updateStatus = () => {
      const status = advancedSchedulingService.getAdvancedSystemStatus();
      setSystemStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleStopColor = () => {
    const reason = stopReason || 'Manual stop from UI';
    const result = advancedSchedulingService.stopColor(selectedColor, reason);
    if (result.success) {
      setStopReason('');
      addNotification(`Color ${selectedColor} stopped successfully: ${reason}`, 'warning');
    } else {
      addNotification(`Failed to stop color: ${result.message}`, 'error');
    }
  };

  const handleResumeColor = () => {
    const result = advancedSchedulingService.resumeColor(selectedColor);
    if (result.success) {
      addNotification(`Color ${selectedColor} resumed successfully`, 'success');
    } else {
      addNotification(`Failed to resume color: ${result.message}`, 'error');
    }
  };

  const handleFaultBuffer = () => {
    const reason = faultReason || 'Manual fault from UI';
    const result = advancedSchedulingService.faultBuffer(selectedBuffer, reason);
    if (result.success) {
      setFaultReason('');
      addNotification(`Buffer ${selectedBuffer} marked as faulted: ${reason}`, 'warning');
    } else {
      addNotification(`Failed to fault buffer: ${result.message}`, 'error');
    }
  };

  const handleClearFault = () => {
    const result = advancedSchedulingService.clearBufferFault(selectedBuffer);
    if (result.success) {
      addNotification(`Buffer ${selectedBuffer} fault cleared`, 'success');
    } else {
      addNotification(`Failed to clear fault: ${result.message}`, 'error');
    }
  };

  const startAdvancedScheduling = () => {
    advancedSchedulingService.startAdvancedScheduling();
  };

  const stopAdvancedScheduling = () => {
    advancedSchedulingService.stopAdvancedScheduling();
  };

  const resetAdvancedSystem = () => {
    if (window.confirm('Are you sure you want to reset the advanced system?')) {
      advancedSchedulingService.resetAdvanced();
    }
  };

  if (!systemStatus) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Header with System Status */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">🚀 Advanced Control Center</h2>
            <p className="text-indigo-100">Real-time system monitoring and intelligent control</p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${systemStatus.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="font-medium">{systemStatus.isRunning ? 'ACTIVE' : 'STOPPED'}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-blue-600">{systemStatus.metrics.totalProcessed}</p>
            </div>
            <div className="text-blue-500 text-2xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Changeovers</p>
              <p className="text-2xl font-bold text-orange-600">{systemStatus.metrics.colorChangeovers}</p>
            </div>
            <div className="text-orange-500 text-2xl">🔄</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-green-600">{systemStatus.metrics.efficiency?.toFixed(1) || '0.0'}%</p>
            </div>
            <div className="text-green-500 text-2xl">⚡</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">JPH</p>
              <p className="text-2xl font-bold text-purple-600">{systemStatus.metrics.jph?.toFixed(1) || '0.0'}</p>
            </div>
            <div className="text-purple-500 text-2xl">🏎️</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stopped Colors</p>
              <p className="text-2xl font-bold text-red-600">{systemStatus.stoppedColors.length}</p>
            </div>
            <div className="text-red-500 text-2xl">🛑</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faulted Buffers</p>
              <p className="text-2xl font-bold text-red-600">{systemStatus.faultedBuffers.length}</p>
            </div>
            <div className="text-red-500 text-2xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🎛️</span>
          System Controls
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={startAdvancedScheduling}
            disabled={systemStatus.isRunning}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>▶️</span>
            <span>Start Advanced Scheduling</span>
          </button>
          <button
            onClick={stopAdvancedScheduling}
            disabled={!systemStatus.isRunning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>⏹️</span>
            <span>Stop Scheduling</span>
          </button>
          <button
            onClick={resetAdvancedSystem}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Reset System</span>
          </button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'System Overview', icon: '📊' },
              { id: 'colors', name: 'Color Management', icon: '🎨' },
              { id: 'buffers', name: 'Buffer Control', icon: '⚡' },
              { id: 'analytics', name: 'Live Analytics', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Buffer Status Grid */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">🏭</span>
                  Live Buffer Status
                </h4>
                
                {/* Oven 1 Buffers */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-blue-600 mb-3">Oven 1 (High Volume)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {buffers.filter(b => b.oven === 'O1').map(buffer => {
                      const bufferStatus = systemStatus.bufferReadiness[buffer.id];
                      const isFaulted = systemStatus.faultedBuffers.includes(buffer.id);
                      const utilization = bufferStatus?.utilization || 0;
                      
                      let statusColor = 'bg-gray-100 border-gray-300';
                      let textColor = 'text-gray-600';
                      let statusIcon = '⚪';
                      
                      if (isFaulted) {
                        statusColor = 'bg-red-100 border-red-300';
                        textColor = 'text-red-700';
                        statusIcon = '❌';
                      } else if (utilization >= 100) {
                        statusColor = 'bg-green-100 border-green-300';
                        textColor = 'text-green-700';
                        statusIcon = '✅';
                      } else if (utilization >= 70) {
                        statusColor = 'bg-yellow-100 border-yellow-300';
                        textColor = 'text-yellow-700';
                        statusIcon = '⚠️';
                      } else if (utilization > 0) {
                        statusColor = 'bg-blue-100 border-blue-300';
                        textColor = 'text-blue-700';
                        statusIcon = '🔵';
                      }

                      return (
                        <div key={buffer.id} className={`p-4 rounded-lg border-2 ${statusColor} transition-all hover:shadow-md`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{buffer.id}</span>
                            <span className="text-xl">{statusIcon}</span>
                          </div>
                          <div className={`text-sm ${textColor}`}>
                            <div>{buffer.name}</div>
                            <div className="font-medium">
                              {isFaulted ? 'FAULTED' : `${bufferStatus?.current || 0}/${buffer.capacity}`}
                            </div>
                            <div className="text-xs">
                              {isFaulted ? 'Needs Attention' : `${utilization.toFixed(0)}% Full`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Oven 2 Buffers */}
                <div>
                  <h5 className="text-md font-medium text-orange-600 mb-3">Oven 2 (Medium/Low Volume)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {buffers.filter(b => b.oven === 'O2').map(buffer => {
                      const bufferStatus = systemStatus.bufferReadiness[buffer.id];
                      const isFaulted = systemStatus.faultedBuffers.includes(buffer.id);
                      const utilization = bufferStatus?.utilization || 0;
                      
                      let statusColor = 'bg-gray-100 border-gray-300';
                      let textColor = 'text-gray-600';
                      let statusIcon = '⚪';
                      
                      if (isFaulted) {
                        statusColor = 'bg-red-100 border-red-300';
                        textColor = 'text-red-700';
                        statusIcon = '❌';
                      } else if (utilization >= 100) {
                        statusColor = 'bg-green-100 border-green-300';
                        textColor = 'text-green-700';
                        statusIcon = '✅';
                      } else if (utilization >= 70) {
                        statusColor = 'bg-yellow-100 border-yellow-300';
                        textColor = 'text-yellow-700';
                        statusIcon = '⚠️';
                      } else if (utilization > 0) {
                        statusColor = 'bg-blue-100 border-blue-300';
                        textColor = 'text-blue-700';
                        statusIcon = '🔵';
                      }

                      return (
                        <div key={buffer.id} className={`p-4 rounded-lg border-2 ${statusColor} transition-all hover:shadow-md`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{buffer.id}</span>
                            <span className="text-xl">{statusIcon}</span>
                          </div>
                          <div className={`text-sm ${textColor}`}>
                            <div>{buffer.name}</div>
                            <div className="font-medium">
                              {isFaulted ? 'FAULTED' : `${bufferStatus?.current || 0}/${buffer.capacity}`}
                            </div>
                            <div className="text-xs">
                              {isFaulted ? 'Needs Attention' : `${utilization.toFixed(0)}% Full`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status Legend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium mb-3">Status Legend</h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">✅</span>
                    <span>Full (100%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <span>High (70-99%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🔵</span>
                    <span>Active (1-69%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚪</span>
                    <span>Empty (0%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">❌</span>
                    <span>Faulted</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold flex items-center">
                <span className="mr-2">🎨</span>
                Color Management Center
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Color Control Panel */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-4">Color Control</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Select Color:</label>
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {colors.map(color => (
                          <option key={color.id} value={color.id}>
                            {color.id} - {color.name} ({color.priority} Priority) {systemStatus.stoppedColors.includes(color.id) ? '(STOPPED)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Stop Reason:</label>
                      <input
                        type="text"
                        value={stopReason}
                        onChange={(e) => setStopReason(e.target.value)}
                        placeholder="Quality issue, material shortage, maintenance..."
                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleStopColor}
                        disabled={systemStatus.stoppedColors.includes(selectedColor)}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        🛑 Stop Color
                      </button>
                      <button
                        onClick={handleResumeColor}
                        disabled={!systemStatus.stoppedColors.includes(selectedColor)}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        ▶️ Resume Color
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Status Display */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800">Color Status Overview</h5>
                  
                  {/* Active Colors */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h6 className="font-medium text-green-800 mb-3">✅ Active Colors</h6>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.filter(color => !systemStatus.stoppedColors.includes(color.id)).map(color => (
                        <div key={color.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                          ></div>
                          <span className="text-sm font-medium">{color.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stopped Colors */}
                  {systemStatus.stoppedColors.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h6 className="font-medium text-red-800 mb-3">🛑 Stopped Colors</h6>
                      <div className="space-y-2">
                        {systemStatus.stoppedColors.map(colorId => {
                          const color = colors.find(c => c.id === colorId);
                          return (
                            <div key={colorId} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color?.hex || '#CCCCCC' }}
                                ></div>
                                <span className="text-sm font-medium">{colorId} - {color?.name}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedColor(colorId);
                                  handleResumeColor();
                                }}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Resume
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buffers' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold flex items-center">
                <span className="mr-2">⚡</span>
                Buffer Management Center
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buffer Control Panel */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                  <h5 className="font-semibold text-orange-800 mb-4">Buffer Control</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">Select Buffer:</label>
                      <select
                        value={selectedBuffer}
                        onChange={(e) => setSelectedBuffer(e.target.value)}
                        className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {buffers.map(buffer => (
                          <option key={buffer.id} value={buffer.id}>
                            {buffer.id} - {buffer.name} ({buffer.oven}) {systemStatus.faultedBuffers.includes(buffer.id) ? '(FAULTED)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">Fault Reason:</label>
                      <input
                        type="text"
                        value={faultReason}
                        onChange={(e) => setFaultReason(e.target.value)}
                        placeholder="Mechanical issue, sensor failure, maintenance..."
                        className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleFaultBuffer}
                        disabled={systemStatus.faultedBuffers.includes(selectedBuffer)}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        ⚠️ Fault Buffer
                      </button>
                      <button
                        onClick={handleClearFault}
                        disabled={!systemStatus.faultedBuffers.includes(selectedBuffer)}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        ✅ Clear Fault
                      </button>
                    </div>
                  </div>
                </div>

                {/* Buffer Status Display */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800">Buffer Health Status</h5>
                  
                  {/* Healthy Buffers */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h6 className="font-medium text-green-800 mb-3">✅ Operational Buffers</h6>
                    <div className="grid grid-cols-2 gap-2">
                      {buffers.filter(buffer => !systemStatus.faultedBuffers.includes(buffer.id)).map(buffer => (
                        <div key={buffer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm font-medium">{buffer.id}</span>
                          <span className="text-xs text-gray-600">{buffer.oven}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Faulted Buffers */}
                  {systemStatus.faultedBuffers.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h6 className="font-medium text-red-800 mb-3">⚠️ Faulted Buffers</h6>
                      <div className="space-y-2">
                        {systemStatus.faultedBuffers.map(bufferId => {
                          const buffer = buffers.find(b => b.id === bufferId);
                          return (
                            <div key={bufferId} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <span className="text-sm font-medium">{bufferId} - {buffer?.name}</span>
                                <div className="text-xs text-gray-600">{buffer?.oven} | Capacity: {buffer?.capacity}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedBuffer(bufferId);
                                  handleClearFault();
                                }}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Clear
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold flex items-center">
                <span className="mr-2">📈</span>
                Live System Analytics
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Performance Metrics */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                  <h5 className="font-semibold text-purple-800 mb-4">Performance Metrics</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">System Efficiency</span>
                      <span className="font-bold text-purple-900">{systemStatus.metrics.efficiency?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${systemStatus.metrics.efficiency || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Current JPH</span>
                      <span className="font-bold text-purple-900">{systemStatus.metrics.jph?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h5 className="font-semibold text-green-800 mb-4">System Health</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Active Buffers</span>
                      <span className="font-bold text-green-900">{buffers.length - systemStatus.faultedBuffers.length}/{buffers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Active Colors</span>
                      <span className="font-bold text-green-900">{colors.length - systemStatus.stoppedColors.length}/{colors.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Buffer Overflows</span>
                      <span className="font-bold text-green-900">{systemStatus.metrics.bufferOverflows || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Production Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-4">Production Stats</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Total Processed</span>
                      <span className="font-bold text-blue-900">{systemStatus.metrics.totalProcessed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Color Changes</span>
                      <span className="font-bold text-blue-900">{systemStatus.metrics.colorChangeovers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Avg. Change Rate</span>
                      <span className="font-bold text-blue-900">
                        {systemStatus.metrics.totalProcessed > 0 
                          ? ((systemStatus.metrics.colorChangeovers / systemStatus.metrics.totalProcessed) * 100).toFixed(1)
                          : '0.0'
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Activity Feed */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📡</span>
                  Real-time Activity Feed
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">System monitoring active - {new Date().toLocaleTimeString()}</span>
                  </div>
                  {systemStatus.stoppedColors.length > 0 && (
                    <div className="flex items-center space-x-3 p-2 bg-red-50 rounded">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-700">{systemStatus.stoppedColors.length} color(s) currently stopped</span>
                    </div>
                  )}
                  {systemStatus.faultedBuffers.length > 0 && (
                    <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-700">{systemStatus.faultedBuffers.length} buffer(s) require attention</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700">Processing efficiency: {systemStatus.metrics.efficiency?.toFixed(1) || '0.0'}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedBufferControl;