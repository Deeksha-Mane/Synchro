import { Buffer } from '../models/Buffer.js';
import { BufferAllocator } from '../algorithms/BufferAllocator.js';
import { ConveyorSelector } from '../algorithms/ConveyorSelector.js';
import { FirestoreService } from '../services/FirestoreService.js';

// Buffer configuration based on the strategy
const BUFFER_CONFIGS = {
  L1: { capacity: 14, oven: 'O1', primaryColors: ['C1'], secondaryColors: [] },
  L2: { capacity: 14, oven: 'O1', primaryColors: ['C1', 'C2'], secondaryColors: [] },
  L3: { capacity: 14, oven: 'O1', primaryColors: ['C2'], secondaryColors: [] },
  L4: { capacity: 14, oven: 'O1', primaryColors: ['C3'], secondaryColors: ['C2'] },
  L5: { capacity: 16, oven: 'O2', primaryColors: ['C4', 'C5'], secondaryColors: [] },
  L6: { capacity: 16, oven: 'O2', primaryColors: ['C6', 'C7'], secondaryColors: [] },
  L7: { capacity: 16, oven: 'O2', primaryColors: ['C8', 'C9'], secondaryColors: [] },
  L8: { capacity: 16, oven: 'O2', primaryColors: ['C10', 'C11'], secondaryColors: [] },
  L9: { capacity: 16, oven: 'O2', primaryColors: ['C12'], secondaryColors: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11'] }
};

export class SchedulingEngine {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.startTime = null;

    // Initialize components
    this.firestoreService = new FirestoreService();
    this.buffers = this.initializeBuffers();
    this.bufferAllocator = new BufferAllocator(this.buffers);
    this.conveyorSelector = new ConveyorSelector(this.buffers);

    // Metrics
    this.metrics = {
      totalProcessed: 0,
      totalAllocated: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null,
      lastUpdate: null
    };

    // Event listeners
    this.eventListeners = new Map();
  }

  // Initialize buffer objects
  initializeBuffers() {
    const buffers = {};
    Object.entries(BUFFER_CONFIGS).forEach(([id, config]) => {
      buffers[id] = new Buffer(id, config);
    });
    return buffers;
  }

  // Start the scheduling algorithm
  async start() {
    if (this.isRunning) {
      console.log('Scheduling engine is already running');
      return { success: false, message: 'Already running' };
    }

    try {
      console.log('Starting scheduling engine...');

      this.isRunning = true;
      this.startTime = new Date();
      this.metrics.startTime = this.startTime.toISOString();

      // Reset buffers
      this.buffers = this.initializeBuffers();
      this.bufferAllocator = new BufferAllocator(this.buffers);
      this.conveyorSelector = new ConveyorSelector(this.buffers);

      // Start the main scheduling loop
      this.intervalId = setInterval(() => {
        this.executeSchedulingCycle();
      }, 3000); // Execute every 3 seconds

      this.emitEvent('started', { timestamp: this.startTime });

      return { success: true, message: 'Scheduling engine started' };
    } catch (error) {
      console.error('Error starting scheduling engine:', error);
      this.isRunning = false;
      return { success: false, message: error.message };
    }
  }

  // Stop the scheduling algorithm
  stop() {
    if (!this.isRunning) {
      console.log('Scheduling engine is not running');
      return { success: false, message: 'Not running' };
    }

    console.log('Stopping scheduling engine...');

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emitEvent('stopped', {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics()
    });

    return { success: true, message: 'Scheduling engine stopped' };
  }

  // Main scheduling cycle
  async executeSchedulingCycle() {
    try {
      console.log('Executing scheduling cycle...');

      // Step 1: Fetch waiting vehicles
      const waitingVehicles = await this.firestoreService.fetchVehicles('waiting', 20);

      if (waitingVehicles.length === 0) {
        console.log('No waiting vehicles found');
        return;
      }

      // Step 2: Allocate vehicles to buffers
      const allocationResult = this.bufferAllocator.allocateVehicles(waitingVehicles);

      if (allocationResult.allocations.length > 0) {
        // Update vehicles in Firestore
        const updates = allocationResult.allocations.map(allocation => ({
          vehicleId: allocation.vehicle.id,
          data: {
            status: 'in_buffer',
            buffer_line: allocation.buffer.id,
            oven: allocation.buffer.oven
          }
        }));

        await this.firestoreService.batchUpdateVehicles(updates);
        this.metrics.totalAllocated += allocationResult.allocations.length;

        console.log(`Allocated ${allocationResult.allocations.length} vehicles to buffers`);
      }

      // Track buffer overflows
      if (allocationResult.failures.length > 0) {
        this.metrics.bufferOverflows += allocationResult.failures.length;
        console.warn(`${allocationResult.failures.length} vehicles could not be allocated (overflow)`);
      }

      // Step 3: Process main conveyor (only from full buffers)
      const processed = this.conveyorSelector.selectNextVehicle();
      if (processed) {
        // Update vehicle status to processing
        await this.firestoreService.updateVehicle(processed.vehicle.id, {
          status: 'processing',
          processing_started: new Date().toISOString()
        });

        this.metrics.totalProcessed++;
        console.log(`Processing vehicle ${processed.vehicle.car_id} from FULL buffer ${processed.buffer.id} (${processed.buffer.current}/${processed.buffer.capacity})`);

        // Simulate processing time and mark as completed
        setTimeout(async () => {
          try {
            await this.firestoreService.updateVehicle(processed.vehicle.id, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });
            console.log(`Completed vehicle ${processed.vehicle.car_id} from buffer ${processed.buffer.id}`);
          } catch (error) {
            console.error('Error completing vehicle:', error);
          }
        }, 2000);
      } else {
        console.log('No vehicles ready for processing - waiting for buffers to fill up');
      }

      // Step 4: Update metrics
      this.updateMetrics();

      // Step 5: Emit status update
      this.emitEvent('cycle_completed', {
        allocated: allocationResult.allocations.length,
        processed: processed ? 1 : 0,
        overflows: allocationResult.failures.length,
        metrics: this.getMetrics()
      });

    } catch (error) {
      console.error('Error in scheduling cycle:', error);
      this.emitEvent('error', { error: error.message });
    }
  }

  // Update performance metrics
  updateMetrics() {
    const now = new Date();
    const elapsedHours = this.startTime ? (now - this.startTime) / (1000 * 60 * 60) : 0;

    // Calculate JPH (Jobs Per Hour)
    this.metrics.jph = elapsedHours > 0 ? this.metrics.totalProcessed / elapsedHours : 0;

    // Get conveyor statistics
    const conveyorStats = this.conveyorSelector.getProcessingStats();
    this.metrics.colorChangeovers = conveyorStats.colorChangeovers;

    // Calculate efficiency
    const maxThroughput = 50; // Theoretical maximum JPH
    const changeoverPenalty = this.metrics.colorChangeovers * 0.5;
    this.metrics.efficiency = Math.max(0,
      ((this.metrics.jph / maxThroughput) * 100) - changeoverPenalty
    );

    this.metrics.lastUpdate = now.toISOString();
  }

  // Get current system status
  getSystemStatus() {
    const bufferStates = {};
    Object.entries(this.buffers).forEach(([id, buffer]) => {
      bufferStates[id] = buffer.toStatusObject();
    });

    return {
      isRunning: this.isRunning,
      metrics: this.getMetrics(),
      bufferStates,
      allocationStats: this.bufferAllocator.getAllocationStats(),
      conveyorStats: this.conveyorSelector.getProcessingStats(),
      lastUpdate: new Date().toISOString()
    };
  }

  // Get metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Reset system
  async reset() {
    console.log('Resetting scheduling engine...');

    // Stop if running
    if (this.isRunning) {
      this.stop();
    }

    // Reset all vehicles in Firestore
    try {
      await this.firestoreService.resetAllVehicles();
    } catch (error) {
      console.error('Error resetting vehicles:', error);
    }

    // Reset internal state
    this.buffers = this.initializeBuffers();
    this.bufferAllocator = new BufferAllocator(this.buffers);
    this.conveyorSelector = new ConveyorSelector(this.buffers);

    this.metrics = {
      totalProcessed: 0,
      totalAllocated: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null,
      lastUpdate: null
    };

    this.emitEvent('reset', { timestamp: new Date().toISOString() });

    return { success: true, message: 'System reset successfully' };
  }

  // Initialize vehicle data
  async initializeData(jsonData) {
    try {
      const result = await this.firestoreService.initializeVehiclesFromJSON(jsonData);
      this.emitEvent('data_initialized', result);
      return result;
    } catch (error) {
      console.error('Error initializing data:', error);
      return { success: false, message: error.message };
    }
  }

  // Event system
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  cleanup() {
    this.stop();
    this.firestoreService.cleanup();
    this.eventListeners.clear();
  }
}