import React, { useState, useEffect } from 'react';
import { advancedSchedulingService } from '../services/advancedSchedulingService';

const AdvancedBufferControl = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [selectedColor, setSelectedColor] = useState('C1');
  const [selectedBuffer, setSelectedBuffer] = useState('L1');
  const [stopReason, setStopReason] = useState('');
  const [faultReason, setFaultReason] = useState('');

  const colors = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
  const buffers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

  useEffect(() => {
    const updateStatus = () => {
      const status = advancedSchedulingService.getAdvancedSystemStatus();
      setSystemStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStopColor = () => {
    const reason = stopReason || 'Manual stop from UI';
    const result = advancedSchedulingService.stopColor(selectedColor, reason);
    if (result.success) {
      setStopReason('');
      alert(`Color ${selectedColor} stopped successfully`);
    } else {
      alert(`Failed to stop color: ${result.message}`);
    }
  };

  const handleResumeColor = () => {
    const result = advancedSchedulingService.resumeColor(selectedColor);
    if (result.success) {
      alert(`Color ${selectedColor} resumed successfully`);
    } else {
      alert(`Failed to resume color: ${result.message}`);
    }
  };

  const handleFaultBuffer = () => {
    const reason = faultReason || 'Manual fault from UI';
    const result = advancedSchedulingService.faultBuffer(selectedBuffer, reason);
    if (result.success) {
      setFaultReason('');
      alert(`Buffer ${selectedBuffer} marked as faulted`);
    } else {
      alert(`Failed to fault buffer: ${result.message}`);
    }
  };

  const handleClearFault = () => {
    const result = advancedSchedulingService.clearBufferFault(selectedBuffer);
    if (result.success) {
      alert(`Buffer ${selectedBuffer} fault cleared`);
    } else {
      alert(`Failed to clear fault: ${result.message}`);
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
    return <div className="p-4">Loading advanced controls...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Advanced Buffer Control System</h2>
      
      {/* System Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{systemStatus.metrics.totalProcessed}</div>
            <div className="text-sm text-gray-600">Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{systemStatus.metrics.colorChangeovers}</div>
            <div className="text-sm text-gray-600">Changeovers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{systemStatus.stoppedColors.length}</div>
            <div className="text-sm text-gray-600">Stopped Colors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{systemStatus.faultedBuffers.length}</div>
            <div className="text-sm text-gray-600">Faulted Buffers</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={startAdvancedScheduling}
          disabled={systemStatus.isRunning}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Start Advanced Scheduling
        </button>
        <button
          onClick={stopAdvancedScheduling}
          disabled={!systemStatus.isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Stop Scheduling
        </button>
        <button
          onClick={resetAdvancedSystem}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset System
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Control */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Color Control</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Color:</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {colors.map(color => (
                <option key={color} value={color}>
                  {color} {systemStatus.stoppedColors.includes(color) ? '(STOPPED)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Stop Reason:</label>
            <input
              type="text"
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              placeholder="Enter reason for stopping color"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStopColor}
              disabled={systemStatus.stoppedColors.includes(selectedColor)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Stop Color
            </button>
            <button
              onClick={handleResumeColor}
              disabled={!systemStatus.stoppedColors.includes(selectedColor)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Resume Color
            </button>
          </div>

          {/* Stopped Colors List */}
          {systemStatus.stoppedColors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded">
              <h4 className="font-medium text-red-800 mb-2">Stopped Colors:</h4>
              <div className="flex flex-wrap gap-2">
                {systemStatus.stoppedColors.map(color => (
                  <span key={color} className="px-2 py-1 bg-red-200 text-red-800 rounded text-sm">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buffer Control */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Buffer Control</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Buffer:</label>
            <select
              value={selectedBuffer}
              onChange={(e) => setSelectedBuffer(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {buffers.map(buffer => (
                <option key={buffer} value={buffer}>
                  {buffer} {systemStatus.faultedBuffers.includes(buffer) ? '(FAULTED)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Fault Reason:</label>
            <input
              type="text"
              value={faultReason}
              onChange={(e) => setFaultReason(e.target.value)}
              placeholder="Enter reason for buffer fault"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFaultBuffer}
              disabled={systemStatus.faultedBuffers.includes(selectedBuffer)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Fault Buffer
            </button>
            <button
              onClick={handleClearFault}
              disabled={!systemStatus.faultedBuffers.includes(selectedBuffer)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Clear Fault
            </button>
          </div>

          {/* Faulted Buffers List */}
          {systemStatus.faultedBuffers.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded">
              <h4 className="font-medium text-red-800 mb-2">Faulted Buffers:</h4>
              <div className="flex flex-wrap gap-2">
                {systemStatus.faultedBuffers.map(buffer => (
                  <span key={buffer} className="px-2 py-1 bg-red-200 text-red-800 rounded text-sm">
                    {buffer}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buffer Status Grid */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Buffer Status Overview</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {buffers.map(bufferId => {
            const buffer = systemStatus.bufferReadiness[bufferId];
            const isFaulted = systemStatus.faultedBuffers.includes(bufferId);
            const utilization = buffer?.utilization || 0;
            
            let statusColor = 'bg-gray-200';
            if (isFaulted) {
              statusColor = 'bg-red-500';
            } else if (utilization >= 100) {
              statusColor = 'bg-green-500';
            } else if (utilization >= 70) {
              statusColor = 'bg-yellow-500';
            } else if (utilization > 0) {
              statusColor = 'bg-blue-500';
            }

            return (
              <div key={bufferId} className={`p-2 rounded text-white text-center ${statusColor}`}>
                <div className="font-bold">{bufferId}</div>
                <div className="text-xs">
                  {isFaulted ? 'FAULT' : `${buffer?.current || 0}/${buffer?.capacity || 0}`}
                </div>
                <div className="text-xs">
                  {isFaulted ? '❌' : `${utilization.toFixed(0)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Full (100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>High (70-99%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Active (1-69%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Empty (0%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Faulted</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedBufferControl;