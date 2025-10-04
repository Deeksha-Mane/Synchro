import { collection, getDocs, doc, updateDoc, writeBatch, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

// 🎯 Dynamic Color-Volume Based Allocation with Clean Separation
const BUFFER_CONFIG = {
  // 🔹 OVEN 1 (Focus: High-volume colors: C1, C2, C3)
  L1: { capacity: 14, oven: 'O1', primaryColors: ['C1'], secondaryColors: [], description: 'C1 only (40%) – dedicated' },
  L2: { capacity: 14, oven: 'O1', primaryColors: ['C1', 'C2'], secondaryColors: [], description: 'C1 overflow + C2 (25%) – flex' },
  L3: { capacity: 14, oven: 'O1', primaryColors: ['C2'], secondaryColors: [], description: 'C2 dedicated' },
  L4: { capacity: 14, oven: 'O1', primaryColors: ['C3'], secondaryColors: ['C2'], description: 'C3 (12%) + overflow from C2' },

  // 🔹 OVEN 2 (Focus: Medium/low-volume colors: C4-C12)
  L5: { capacity: 16, oven: 'O2', primaryColors: ['C4', 'C5'], secondaryColors: [], description: 'C4 (8%) + C5 (3%)' },
  L6: { capacity: 16, oven: 'O2', primaryColors: ['C6', 'C7'], secondaryColors: [], description: 'C6 (2%) + C7 (2%)' },
  L7: { capacity: 16, oven: 'O2', primaryColors: ['C8', 'C9'], secondaryColors: [], description: 'C8 (2%) + C9 (2%)' },
  L8: { capacity: 16, oven: 'O2', primaryColors: ['C10', 'C11'], secondaryColors: [], description: 'C10 (2%) + C11 (2%)' },
  L9: { capacity: 16, oven: 'O2', primaryColors: ['C12'], secondaryColors: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11'], description: 'C12 (1%) + Emergency overflow' }
};

// Color priority based on volume (higher number = higher priority)
const COLOR_PRIORITY = {
  'C1': 40, 'C2': 25, 'C3': 12, 'C4': 8, 'C5': 3,
  'C6': 2, 'C7': 2, 'C8': 2, 'C9': 2, 'C10': 2, 'C11': 2, 'C12': 1
};

class SchedulingService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.metrics = {
      totalProcessed: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null
    };
    this.bufferStates = {};
    this.lastProcessedColors = {}; // Track last color processed in each buffer
    this.lastMainConveyorColor = null; // Track main conveyor color for changeover optimization
    this.initializeBufferStates();
  }

  initializeBufferStates() {
    Object.keys(BUFFER_CONFIG).forEach(bufferId => {
      this.bufferStates[bufferId] = {
        current: 0,
        capacity: BUFFER_CONFIG[bufferId].capacity,
        vehicles: [],
        status: 'active',
        lastColor: null
      };
      this.lastProcessedColors[bufferId] = null;
    });
  }

  // Fetch vehicles from Firestore
  async fetchVehicles(status = 'waiting', limitCount = 100) {
    try {
      const vehiclesRef = collection(db, 'cars');
      const q = query(
        vehiclesRef,
        where('status', '==', status),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  // 🎯 Get optimal buffer using Dynamic Color-Volume Based Allocation Strategy
  getOptimalBuffer(color, availableBuffers) {
    console.log(`🎯 Finding optimal buffer for color ${color}, available: ${availableBuffers.join(', ')}`);

    // 🔹 OVEN 1 Strategy: High-volume colors (C1, C2, C3)
    if (['C1', 'C2', 'C3'].includes(color)) {
      // C1 (40%): L1 dedicated, L2 overflow
      if (color === 'C1') {
        if (availableBuffers.includes('L1')) {
          console.log(`✅ C1 → L1 (dedicated buffer)`);
          return 'L1';
        }
        if (availableBuffers.includes('L2')) {
          console.log(`✅ C1 → L2 (overflow buffer)`);
          return 'L2';
        }
      }

      // C2 (25%): L3 dedicated, L2 flex, L4 overflow
      if (color === 'C2') {
        if (availableBuffers.includes('L3')) {
          console.log(`✅ C2 → L3 (dedicated buffer)`);
          return 'L3';
        }
        if (availableBuffers.includes('L2')) {
          console.log(`✅ C2 → L2 (flex buffer)`);
          return 'L2';
        }
        if (availableBuffers.includes('L4')) {
          console.log(`✅ C2 → L4 (overflow buffer)`);
          return 'L4';
        }
      }

      // C3 (12%): L4 dedicated
      if (color === 'C3') {
        if (availableBuffers.includes('L4')) {
          console.log(`✅ C3 → L4 (dedicated buffer)`);
          return 'L4';
        }
      }
    }

    // 🔹 OVEN 2 Strategy: Medium/low-volume colors (C4-C12)
    else {
      // C4 (8%) + C5 (3%): L5
      if (['C4', 'C5'].includes(color) && availableBuffers.includes('L5')) {
        console.log(`✅ ${color} → L5 (paired buffer)`);
        return 'L5';
      }

      // C6 (2%) + C7 (2%): L6
      if (['C6', 'C7'].includes(color) && availableBuffers.includes('L6')) {
        console.log(`✅ ${color} → L6 (paired buffer)`);
        return 'L6';
      }

      // C8 (2%) + C9 (2%): L7
      if (['C8', 'C9'].includes(color) && availableBuffers.includes('L7')) {
        console.log(`✅ ${color} → L7 (paired buffer)`);
        return 'L7';
      }

      // C10 (2%) + C11 (2%): L8
      if (['C10', 'C11'].includes(color) && availableBuffers.includes('L8')) {
        console.log(`✅ ${color} → L8 (paired buffer)`);
        return 'L8';
      }

      // C12 (1%): L9 + Emergency overflow
      if (availableBuffers.includes('L9')) {
        console.log(`✅ ${color} → L9 (rare color + emergency buffer)`);
        return 'L9';
      }
    }

    // 🚨 Emergency fallback: use any available buffer
    if (availableBuffers.length > 0) {
      const fallbackBuffer = availableBuffers[0];
      console.log(`🚨 Emergency: ${color} → ${fallbackBuffer} (fallback)`);
      return fallbackBuffer;
    }

    console.log(`❌ No suitable buffer found for color ${color}`);
    return null;
  }

  // Calculate color changeover penalty
  calculateChangeoverPenalty(bufferId, newColor) {
    const lastColor = this.lastProcessedColors[bufferId];
    if (!lastColor || lastColor === newColor) {
      return 0; // No changeover needed
    }

    // Higher penalty for different colors
    const colorDistance = Math.abs(
      parseInt(lastColor.substring(1)) - parseInt(newColor.substring(1))
    );
    return colorDistance * 2; // Penalty factor
  }

  // Group vehicles by color for batch processing
  groupVehiclesByColor(vehicles) {
    const groups = {};
    vehicles.forEach(vehicle => {
      if (!groups[vehicle.color]) {
        groups[vehicle.color] = [];
      }
      groups[vehicle.color].push(vehicle);
    });

    // Sort groups by color priority (high volume colors first)
    return Object.entries(groups)
      .sort(([colorA], [colorB]) => COLOR_PRIORITY[colorB] - COLOR_PRIORITY[colorA])
      .reduce((acc, [color, vehicleList]) => {
        acc[color] = vehicleList;
        return acc;
      }, {});
  }

  // Allocate vehicles to buffers using smart batching strategy
  allocateVehiclesToBuffers(vehicles) {
    const allocations = [];
    const groupedVehicles = this.groupVehiclesByColor(vehicles);

    console.log(`🎨 Processing ${Object.keys(groupedVehicles).length} different colors`);

    for (const [color, vehicleList] of Object.entries(groupedVehicles)) {
      console.log(`🎯 Processing ${vehicleList.length} vehicles of color ${color}`);

      // Find the best buffer for this entire color batch
      const availableBuffers = Object.keys(this.bufferStates).filter(
        bufferId => this.bufferStates[bufferId].current < this.bufferStates[bufferId].capacity
      );

      if (availableBuffers.length === 0) {
        this.metrics.bufferOverflows++;
        console.warn('❌ Buffer overflow - all buffers at capacity');
        break;
      }

      // Smart buffer selection: prioritize buffers with same color or empty buffers
      let selectedBuffer = null;

      // 1. First priority: buffer already has this color (no changeover)
      const sameColorBuffer = availableBuffers.find(bufferId =>
        this.bufferStates[bufferId].vehicles.length > 0 &&
        this.bufferStates[bufferId].vehicles[0].color === color
      );

      if (sameColorBuffer) {
        selectedBuffer = sameColorBuffer;
        console.log(`✅ Using same-color buffer ${selectedBuffer} for ${color} (no changeover)`);
      } else {
        // 2. Second priority: empty buffer (no changeover)
        const emptyBuffer = availableBuffers.find(bufferId =>
          this.bufferStates[bufferId].vehicles.length === 0
        );

        if (emptyBuffer) {
          selectedBuffer = this.getOptimalBuffer(color, [emptyBuffer]) || emptyBuffer;
          console.log(`✅ Using empty buffer ${selectedBuffer} for ${color} (no changeover)`);
        } else {
          // 3. Last resort: use optimal buffer (will cause changeover)
          selectedBuffer = this.getOptimalBuffer(color, availableBuffers);
          if (selectedBuffer) {
            console.log(`⚠️ Using buffer ${selectedBuffer} for ${color} (changeover may be required)`);
            // NOTE: Don't count changeover here - it will be counted during main conveyor processing
          }
        }
      }

      if (!selectedBuffer) {
        console.log(`❌ No suitable buffer found for color ${color}`);
        continue;
      }

      // Batch allocate all vehicles of this color to the selected buffer
      let allocatedCount = 0;
      for (const vehicle of vehicleList) {
        // Check if buffer still has space
        if (this.bufferStates[selectedBuffer].current >= this.bufferStates[selectedBuffer].capacity) {
          console.log(`⚠️ Buffer ${selectedBuffer} full, allocated ${allocatedCount}/${vehicleList.length} ${color} vehicles`);
          break;
        }

        // Calculate proper position for FIFO (sequential numbering)
        const bufferPosition = this.bufferStates[selectedBuffer].current;

        // Allocate vehicle to buffer
        allocations.push({
          vehicle,
          bufferId: selectedBuffer,
          oven: BUFFER_CONFIG[selectedBuffer].oven,
          position: bufferPosition // Sequential position for proper FIFO ordering
        });

        // 🎯 CORRECT FIFO: New cars enter at FRONT (left side), exit from BACK (right side)
        // Visual: [ENTRY/left] → → → [EXIT/right]
        this.bufferStates[selectedBuffer].vehicles.unshift(vehicle); // Add to FRONT (left side)
        this.bufferStates[selectedBuffer].current++;
        allocatedCount++;

        console.log(`🚗 Added ${vehicle.car_id} (${vehicle.color}) to LEFT side of buffer ${selectedBuffer} [Position: 0] - ${BUFFER_CONFIG[selectedBuffer].description}`);
      }

      console.log(`✅ Allocated ${allocatedCount} ${color} vehicles to buffer ${selectedBuffer}`);
    }

    return allocations;
  }

  // Process vehicles through the main conveyor with smart sequencing
  async processMainConveyor() {
    // CRITICAL FIX: Only process vehicles from FULL buffers
    let selectedBuffer = null;
    let selectedVehicle = null;
    let bestScore = -1;

    // Track last processed color on main conveyor
    if (!this.lastMainConveyorColor) {
      this.lastMainConveyorColor = null;
    }

    // Count full buffers for logging
    const fullBuffers = Object.entries(this.bufferStates).filter(([bufferId, bufferState]) => 
      bufferState.vehicles.length > 0 && bufferState.current >= bufferState.capacity
    );

    console.log(`🔍 Checking ${fullBuffers.length} full buffers for processing...`);

    for (const [bufferId, bufferState] of Object.entries(this.bufferStates)) {
      // CRITICAL FIX: Buffer must be FULL to process vehicles
      if (bufferState.vehicles.length > 0 && bufferState.current >= bufferState.capacity) {
        const vehicle = bufferState.vehicles[bufferState.vehicles.length - 1]; // FIFO - last vehicle (rightmost)
        const colorPriority = COLOR_PRIORITY[vehicle.color] || 0;

        // Calculate score: prioritize same color to reduce changeovers
        let score = colorPriority;

        if (this.lastMainConveyorColor === vehicle.color) {
          score += 50; // Bonus for same color (avoid changeover)
          console.log(`🎯 Same color bonus for ${vehicle.color} in buffer ${bufferId}`);
        }

        // Bonus for fuller buffers (clear them faster)
        const fillRatio = bufferState.vehicles.length / bufferState.capacity;
        score += fillRatio * 10;

        if (score > bestScore) {
          bestScore = score;
          selectedBuffer = bufferId;
          selectedVehicle = vehicle;
        }

        console.log(`✅ Full buffer ${bufferId}: ${bufferState.current}/${bufferState.capacity} - Vehicle ${vehicle.car_id} (${vehicle.color}) - Score: ${score.toFixed(1)}`);
      } else if (bufferState.vehicles.length > 0) {
        console.log(`⏳ Buffer ${bufferId} not full: ${bufferState.current}/${bufferState.capacity} - waiting for more vehicles`);
      }
    }

    if (selectedBuffer && selectedVehicle) {
      // Remove vehicle from buffer (FIFO - from RIGHT side)
      this.bufferStates[selectedBuffer].vehicles.pop(); // Remove from BACK (right side)
      this.bufferStates[selectedBuffer].current--;

      console.log(`🚗 Removed ${selectedVehicle.car_id} (${selectedVehicle.color}) from RIGHT side of buffer ${selectedBuffer}`);

      // Track main conveyor changeovers - THIS IS THE ONLY PLACE WE COUNT CHANGEOVERS
      if (this.lastMainConveyorColor && this.lastMainConveyorColor !== selectedVehicle.color) {
        this.metrics.colorChangeovers++;
        console.log(`🔄 Main conveyor changeover #${this.metrics.colorChangeovers}: ${this.lastMainConveyorColor} → ${selectedVehicle.color}`);
      } else if (this.lastMainConveyorColor === selectedVehicle.color) {
        console.log(`✅ Same color on main conveyor: ${selectedVehicle.color} (no changeover)`);
      }
      this.lastMainConveyorColor = selectedVehicle.color;

      // Update vehicle status in Firestore
      await this.updateVehicleStatus(selectedVehicle.id, 'processing', selectedBuffer);

      this.metrics.totalProcessed++;

      // Simulate realistic processing time (2-4 seconds)
      const processingTime = 2000 + Math.random() * 2000;
      setTimeout(async () => {
        await this.updateVehicleStatus(selectedVehicle.id, 'completed', selectedBuffer);
      }, processingTime);

      console.log(`🏭 Processing ${selectedVehicle.car_id} (${selectedVehicle.color}) from FULL buffer ${selectedBuffer} (${this.bufferStates[selectedBuffer].current}/${this.bufferStates[selectedBuffer].capacity}) [Score: ${bestScore.toFixed(1)}]`);

      return { vehicle: selectedVehicle, bufferId: selectedBuffer };
    }

    console.log('⏳ No full buffers available for processing - waiting for buffers to fill up');
    return null;
  }

  // Update vehicle status in Firestore
  async updateVehicleStatus(vehicleId, status, bufferLine = null, oven = null) {
    try {
      const vehicleRef = doc(db, 'cars', vehicleId);
      const updateData = {
        status,
        buffer_line: bufferLine,
        oven,
        updated_at: new Date().toISOString()
      };

      await updateDoc(vehicleRef, updateData);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    }
  }

  // Batch update vehicles in Firestore with position tracking
  async batchUpdateVehicles(allocations) {
    try {
      const batch = writeBatch(db);

      allocations.forEach(({ vehicle, bufferId, oven, position }) => {
        const vehicleRef = doc(db, 'cars', vehicle.id);
        batch.update(vehicleRef, {
          status: 'in_buffer',
          buffer_line: bufferId,
          oven: oven,
          buffer_position: position || 0, // Track position in buffer for FIFO
          updated_at: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log(`✅ Batch updated ${allocations.length} vehicles with positions`);
    } catch (error) {
      console.error('❌ Error batch updating vehicles:', error);
    }
  }

  // Calculate performance metrics with realistic values
  calculateMetrics() {
    const currentTime = new Date();
    const elapsedMinutes = this.metrics.startTime ?
      (currentTime - this.metrics.startTime) / (1000 * 60) : 0;

    // Calculate JPH (Jobs Per Hour) - realistic calculation
    // Realistic processing: 1 car every 3-5 seconds = 12-20 cars per minute = 720-1200 JPH theoretical max
    // But with buffer delays, changeovers, etc., realistic max is 15-45 JPH
    if (elapsedMinutes > 0) {
      const carsPerMinute = this.metrics.totalProcessed / elapsedMinutes;
      this.metrics.jph = carsPerMinute * 60;
    } else {
      this.metrics.jph = 0;
    }

    // Cap JPH at realistic maximum (45 JPH = 0.75 cars per minute)
    this.metrics.jph = Math.min(this.metrics.jph, 45);

    // Calculate efficiency based on realistic performance
    const theoreticalMaxJPH = 30; // Realistic theoretical max considering all delays
    let baseEfficiency = 0;

    if (this.metrics.jph > 0) {
      baseEfficiency = (this.metrics.jph / theoreticalMaxJPH) * 100;
    }

    // Apply penalties for inefficiencies
    const changeoverPenalty = this.metrics.colorChangeovers * 2; // Each changeover costs 2% efficiency
    const overflowPenalty = this.metrics.bufferOverflows * 5; // Each overflow costs 5% efficiency

    // Calculate final efficiency with realistic bounds
    this.metrics.efficiency = Math.max(0, Math.min(100, baseEfficiency - changeoverPenalty - overflowPenalty));

    // If very few vehicles processed, show lower efficiency
    if (this.metrics.totalProcessed < 5) {
      this.metrics.efficiency = Math.min(this.metrics.efficiency, 25);
    }

    console.log(`📊 Metrics: JPH=${this.metrics.jph.toFixed(1)}, Efficiency=${this.metrics.efficiency.toFixed(1)}%, Changeovers=${this.metrics.colorChangeovers}, Elapsed=${elapsedMinutes.toFixed(1)}min`);
  }

  // Main scheduling algorithm execution
  async executeSchedulingCycle() {
    try {
      console.log('🔄 Executing scheduling cycle...');

      // Fetch waiting vehicles (reduced limit to save quota)
      const waitingVehicles = await this.fetchVehicles('waiting', 10); // Reduced from 20 to 10

      if (waitingVehicles.length === 0) {
        console.log('⚠️ No waiting vehicles found');
        return; // Skip the additional check to save quota
      }

      console.log(`📋 Found ${waitingVehicles.length} waiting vehicles`);

      // Allocate vehicles to buffers
      const allocations = this.allocateVehiclesToBuffers(waitingVehicles);

      if (allocations.length > 0) {
        // Update vehicles in Firestore
        await this.batchUpdateVehicles(allocations);
        console.log(`✅ Allocated ${allocations.length} vehicles to buffers`);

        // Log allocation details (limit to avoid console spam)
        allocations.slice(0, 3).forEach(allocation => {
          const carId = allocation.vehicle.car_id || 'N/A';
          const color = allocation.vehicle.color || 'Unknown';
          console.log(`  🚗 Car ${carId} (${color}) → Buffer ${allocation.bufferId}`);
        });
        if (allocations.length > 3) {
          console.log(`  ... and ${allocations.length - 3} more vehicles`);
        }
      }

      // Process main conveyor
      const processed = await this.processMainConveyor();
      if (processed) {
        const carId = processed.vehicle.car_id || 'N/A';
        const color = processed.vehicle.color || 'Unknown';
        console.log(`🏭 Processing vehicle ${carId} (${color}) from buffer ${processed.bufferId}`);
      }

      // Update metrics
      this.calculateMetrics();

      // Log current status
      console.log(`📊 Metrics: Processed=${this.metrics.totalProcessed}, JPH=${this.metrics.jph.toFixed(1)}, Efficiency=${this.metrics.efficiency.toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Error in scheduling cycle:', error);
    }
  }

  // Sync buffer states with Firestore data maintaining FIFO order
  async syncBufferStates() {
    try {
      // Fetch all vehicles currently in buffers
      const inBufferVehicles = await this.fetchVehicles('in_buffer', 200);

      // Reset buffer states
      this.initializeBufferStates();

      // Group vehicles by buffer and sort by position/time
      const bufferGroups = {};
      inBufferVehicles.forEach(vehicle => {
        if (vehicle.buffer_line) {
          if (!bufferGroups[vehicle.buffer_line]) {
            bufferGroups[vehicle.buffer_line] = [];
          }
          bufferGroups[vehicle.buffer_line].push(vehicle);
        }
      });

      // Populate buffer states with CORRECT FIFO ordering
      // ENTRY (left/index 0) → → → EXIT (right/index N)
      Object.entries(bufferGroups).forEach(([bufferId, vehicles]) => {
        if (this.bufferStates[bufferId]) {
          // Sort REVERSED: older vehicles on left (index 0), newer on right (index N)
          vehicles.sort((a, b) => {
            if (a.buffer_position !== undefined && b.buffer_position !== undefined) {
              return b.buffer_position - a.buffer_position; // REVERSED
            }
            return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at); // REVERSED
          });

          this.bufferStates[bufferId].vehicles = vehicles;
          this.bufferStates[bufferId].current = vehicles.length;

          if (vehicles.length > 0) {
            // Last color is the rightmost vehicle (exit point)
            this.bufferStates[bufferId].lastColor = vehicles[vehicles.length - 1].color;
            this.lastProcessedColors[bufferId] = vehicles[vehicles.length - 1].color;

            const colors = vehicles.map(v => `${v.car_id}(${v.color})`);
            console.log(`🔄 Synced buffer ${bufferId} [LEFT→RIGHT]: [${colors.join(' → ')}]`);
            console.log(`   └─ ENTRY (left) → → → EXIT (right)`);
          }
        }
      });

      console.log('🔄 Buffer states synchronized with Firestore - FIFO order maintained');
    } catch (error) {
      console.error('Error syncing buffer states:', error);
    }
  }

  // Start the scheduling algorithm
  async startScheduling(cycleInterval = 5000) { // Increased default from 3s to 5s
    if (this.isRunning) {
      console.log('Scheduling algorithm is already running');
      return;
    }

    this.isRunning = true;
    this.metrics.startTime = new Date();
    this.metrics.colorChangeovers = 0; // Ensure changeovers start at 0
    this.lastMainConveyorColor = null; // Reset main conveyor color tracking
    console.log(`🚀 Starting scheduling algorithm with ${cycleInterval / 1000}s cycle...`);

    try {
      // Sync buffer states with current Firestore data
      await this.syncBufferStates();

      // Execute scheduling cycle at specified interval with error handling
      this.intervalId = setInterval(async () => {
        try {
          await this.executeSchedulingCycle();
        } catch (error) {
          console.error('Error in scheduling cycle:', error);
          if (error.code === 'resource-exhausted') {
            console.warn('🚨 Firestore quota exceeded, stopping algorithm');
            this.stopScheduling();
          }
        }
      }, Math.max(cycleInterval, 4000)); // Minimum 4 seconds to avoid quota issues
    } catch (error) {
      console.error('Error starting scheduling:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Stop the scheduling algorithm
  stopScheduling() {
    if (!this.isRunning) {
      console.log('Scheduling algorithm is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Scheduling algorithm stopped');
  }

  // Get current system status
  getSystemStatus() {
    // Add buffer readiness information
    const bufferReadiness = {};
    Object.entries(this.bufferStates).forEach(([bufferId, bufferState]) => {
      bufferReadiness[bufferId] = {
        current: bufferState.current,
        capacity: bufferState.capacity,
        isFull: bufferState.current >= bufferState.capacity,
        isReadyForProcessing: bufferState.vehicles.length > 0 && bufferState.current >= bufferState.capacity,
        utilization: bufferState.capacity > 0 ? (bufferState.current / bufferState.capacity) * 100 : 0,
        vehicleCount: bufferState.vehicles.length,
        lastColor: bufferState.lastColor
      };
    });

    return {
      isRunning: this.isRunning,
      metrics: { ...this.metrics },
      bufferStates: { ...this.bufferStates },
      bufferReadiness,
      lastProcessedColors: { ...this.lastProcessedColors }
    };
  }

  // Reset all metrics and states
  async reset() {
    this.stopScheduling();

    console.log('🔄 Resetting system and Firestore data...');

    try {
      // Reset all vehicles to waiting status
      const vehiclesRef = collection(db, 'cars');
      const snapshot = await getDocs(vehiclesRef);

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'waiting',
          buffer_line: null,
          oven: null,
          updated_at: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log(`✅ Reset ${snapshot.docs.length} vehicles to waiting status`);

    } catch (error) {
      console.error('❌ Error resetting Firestore data:', error);
      throw error;
    }

    // Reset local metrics and states
    this.metrics = {
      totalProcessed: 0,
      colorChangeovers: 0, // Reset changeover counter
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null
    };
    this.initializeBufferStates();
    this.lastProcessedColors = {};
    this.lastMainConveyorColor = null; // Reset main conveyor color tracking

    console.log('✅ System reset complete');
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();
export default schedulingService;