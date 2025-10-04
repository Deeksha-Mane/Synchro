import { useState, useEffect, useCallback } from 'react';
import schedulingService from '../services/schedulingService';

export const useScheduling = () => {
  const [systemStatus, setSystemStatus] = useState({
    isRunning: false,
    metrics: {
      totalProcessed: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null
    },
    bufferStates: {},
    lastProcessedColors: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update system status
  const updateStatus = useCallback(() => {
    const status = schedulingService.getSystemStatus();
    setSystemStatus(status);
  }, []);

  // Start scheduling
  const startScheduling = useCallback(async (cycleInterval = 3000) => {
    try {
      setLoading(true);
      setError(null);
      await schedulingService.startScheduling(cycleInterval);
      updateStatus();
    } catch (err) {
      setError(err.message);
      console.error('Error starting scheduling:', err);
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Stop scheduling
  const stopScheduling = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      schedulingService.stopScheduling();
      updateStatus();
    } catch (err) {
      setError(err.message);
      console.error('Error stopping scheduling:', err);
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Reset system
  const resetSystem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await schedulingService.reset();
      updateStatus();
    } catch (err) {
      setError(err.message);
      console.error('Error resetting system:', err);
      throw err; // Re-throw to allow UI to handle the error
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  // Update status periodically when running
  useEffect(() => {
    let intervalId;
    
    if (systemStatus.isRunning) {
      intervalId = setInterval(updateStatus, 1000); // Update every second
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [systemStatus.isRunning, updateStatus]);

  // Initial status update
  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  return {
    systemStatus,
    loading,
    error,
    startScheduling,
    stopScheduling,
    resetSystem,
    updateStatus
  };
};