import React, { createContext, useContext, useState, useEffect } from 'react';
import { advancedSchedulingService } from '../services/advancedSchedulingService';
import { schedulingService } from '../services/schedulingService';

const AdvancedAlgorithmContext = createContext();

export const useAdvancedAlgorithm = () => {
  const context = useContext(AdvancedAlgorithmContext);
  if (!context) {
    throw new Error('useAdvancedAlgorithm must be used within an AdvancedAlgorithmProvider');
  }
  return context;
};

export const AdvancedAlgorithmProvider = ({ children }) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    metrics: {
      totalProcessed: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0
    },
    isRunning: false,
    stoppedColors: [],
    faultedBuffers: [],
    bufferStates: {},
    bufferReadiness: {}
  });
  const [isRunning, setIsRunning] = useState(false);

  // Get the current active service based on mode
  const getActiveService = () => {
    return isAdvancedMode ? advancedSchedulingService : schedulingService;
  };

  // Update system status
  const updateSystemStatus = () => {
    try {
      const service = getActiveService();
      const status = isAdvancedMode 
        ? service.getAdvancedSystemStatus() 
        : service.getSystemStatus();
      
      // Preserve stopped colors and faulted buffers if they exist
      const updatedStatus = {
        ...status,
        stoppedColors: status.stoppedColors || [],
        faultedBuffers: status.faultedBuffers || [],
        colorStopReasons: status.colorStopReasons || {},
        bufferFaultReasons: status.bufferFaultReasons || {}
      };
      
      setSystemStatus(updatedStatus);
      setIsRunning(status.isRunning);
      
      // Debug logging
      if (isAdvancedMode && (updatedStatus.stoppedColors.length > 0 || updatedStatus.faultedBuffers.length > 0)) {
        console.log('🔍 Advanced Status Update:', {
          stoppedColors: updatedStatus.stoppedColors,
          faultedBuffers: updatedStatus.faultedBuffers
        });
      }
    } catch (error) {
      console.error('Error updating system status:', error);
    }
  };

  // Toggle between basic and advanced mode
  const toggleMode = async () => {
    const wasRunning = isRunning;
    
    // Stop current service if running
    if (wasRunning) {
      const currentService = getActiveService();
      if (isAdvancedMode) {
        currentService.stopAdvancedScheduling();
      } else {
        currentService.stopScheduling();
      }
    }

    // Switch mode
    setIsAdvancedMode(!isAdvancedMode);
    
    // If it was running, start the new service
    if (wasRunning) {
      setTimeout(async () => {
        const newService = !isAdvancedMode ? advancedSchedulingService : schedulingService;
        try {
          if (!isAdvancedMode) {
            await newService.startAdvancedScheduling();
          } else {
            await newService.startScheduling();
          }
        } catch (error) {
          console.error('Error starting new service:', error);
        }
      }, 1000);
    }
  };

  // Start scheduling with current mode
  const startScheduling = async (cycleInterval = 5000) => {
    try {
      const service = getActiveService();
      if (isAdvancedMode) {
        await service.startAdvancedScheduling(cycleInterval);
      } else {
        await service.startScheduling(cycleInterval);
      }
      setIsRunning(true);
    } catch (error) {
      console.error('Error starting scheduling:', error);
      throw error;
    }
  };

  // Stop scheduling
  const stopScheduling = () => {
    try {
      const service = getActiveService();
      if (isAdvancedMode) {
        service.stopAdvancedScheduling();
      } else {
        service.stopScheduling();
      }
      setIsRunning(false);
    } catch (error) {
      console.error('Error stopping scheduling:', error);
      throw error;
    }
  };

  // Reset system
  const resetSystem = async () => {
    try {
      const service = getActiveService();
      if (isAdvancedMode) {
        await service.resetAdvanced();
      } else {
        await service.reset();
      }
      setIsRunning(false);
    } catch (error) {
      console.error('Error resetting system:', error);
      throw error;
    }
  };

  // Advanced-specific functions
  const stopColor = (color, reason) => {
    if (!isAdvancedMode) {
      throw new Error('Color stopping is only available in Advanced Mode');
    }
    return advancedSchedulingService.stopColor(color, reason);
  };

  const resumeColor = (color) => {
    if (!isAdvancedMode) {
      throw new Error('Color resuming is only available in Advanced Mode');
    }
    return advancedSchedulingService.resumeColor(color);
  };

  const faultBuffer = (bufferId, reason) => {
    if (!isAdvancedMode) {
      throw new Error('Buffer faulting is only available in Advanced Mode');
    }
    return advancedSchedulingService.faultBuffer(bufferId, reason);
  };

  const clearBufferFault = (bufferId) => {
    if (!isAdvancedMode) {
      throw new Error('Buffer fault clearing is only available in Advanced Mode');
    }
    return advancedSchedulingService.clearBufferFault(bufferId);
  };

  // Update status periodically
  useEffect(() => {
    updateSystemStatus();
    const interval = setInterval(updateSystemStatus, 3000);
    return () => clearInterval(interval);
  }, [isAdvancedMode]);

  const value = {
    // State
    isAdvancedMode,
    systemStatus,
    isRunning,
    
    // Basic functions
    toggleMode,
    startScheduling,
    stopScheduling,
    resetSystem,
    updateSystemStatus,
    
    // Advanced functions
    stopColor,
    resumeColor,
    faultBuffer,
    clearBufferFault,
    
    // Utility
    getActiveService
  };

  return (
    <AdvancedAlgorithmContext.Provider value={value}>
      {children}
    </AdvancedAlgorithmContext.Provider>
  );
};