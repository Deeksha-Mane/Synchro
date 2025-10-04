import { collection, getDocs, doc, updateDoc, writeBatch, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

// 🎯 Advanced Buffer Configuration with Fault Tolerance
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

// Color fallback mapping for when primary buffers are unavailable
const COLOR_FALLBACK_MAP = {
  'C1': ['L1', 'L2', 'L9'], // Primary: L1, Overflow: L2, Emergency: L9
  'C2': ['L3', 'L2', 'L4', 'L9'], // Primary: L3, Flex: L2, Overflow: L4, Emergency: L9
  'C3': ['L4', 'L9'], // Primary: L4, Emergency: L9
  'C4': ['L5', 'L9'], // Primary: L5, Emergency: L9
  'C5': ['L5', 'L9'], // Primary: L5, Emergency: L9
  'C6': ['L6', 'L9'], // Primary: L6, Emergency: L9
  'C7': ['L6', 'L9'], // Primary: L6, Emergency: L9
  'C8': ['L7', 'L9'], // Primary: L7, Emergency: L9
  'C9': ['L7', 'L9'], // Primary: L7, Emergency: L9
  'C10': ['L8', 'L9'], // Primary: L8, Emergency: L9
  'C11': ['L8', 'L9'], // Primary: L8, Emergency: L9
  'C12': ['L9'] // Primary: L9
};

class AdvancedSchedulingService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.metrics = {
      totalProcessed: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null,
      faultedBuffers: 0,
      stoppedColors: 0,
      reroutes: 0
    };
    
    // Buffer states with enhanced status tracking
    this.bufferStates = {};
    
    // Color and buffer management
    this.stoppedColors = new Set(); // Colors that are temporarily stopped
    this.faultedBuffers = new Set(); // Buffers that are faulted/offline
    this.bufferMaintenanceMode = new Map(); // Buffers in maintenance with scheduled downtime
    
    // Processing tracking
    this.lastProcessedColors = {};
    this.lastMainConveyorColor = null;
    
    // Advanced features
    this.colorStopReasons = new Map(); // Track why colors are stopped
    this.bufferFaultReasons = new Map(); // Track why buffers are faulted
    this.rerouting = new Map(); // Track color rerouting decisions
    
    this.initializeBufferStates();
  }

  initializeBufferStates() {
    Object.keys(BUFFER_CONFIG).forEach(bufferId => {
      this.bufferStates[bufferId] = {
        current: 0,
        capacity: BUFFER_CONFIG[bufferId].capacity,
        vehicles: [],
        status: 'active', // active, faulted, maintenance, stopped
        lastColor: null,
        faultReason: null,
        maintenanceUntil: null,
        utilizationHistory: []
      };
      this.lastProcessedColors[bufferId] = null;
    });
  }

  // 🚨 ADVANCED FEATURE: Stop a specific color from processing
  stopColor(color, reason = 'Manual stop') {
    if (!COLOR_PRIORITY[color]) {
      console.error(`❌ Invalid color: ${color}`);
      return { success: false, message: 'Invalid color' };
    }

    this.stoppedColors.add(color);
    this.colorStopReasons.set(color, {
      reason,
      timestamp: new Date().toISOString(),
      stoppedBy: 'system' // Could be 'user', 'system', 'maintenance'
    });

    this.metrics.stoppedColors = this.stoppedColors.size;

    console.log(`🛑 Color ${color} STOPPED - Reason: ${reason}`);
    console.log(`🔍 Current stopped colors:`, Array.from(this.stoppedColors));
    
    // Trigger immediate rerouting for this color
    this.handleColorRerouting(color);

    return { 
      success: true, 
      message: `Color ${color} stopped successfully`,
      stoppedColors: Array.from(this.stoppedColors)
    };
  }

  // 🚨 ADVANCED FEATURE: Resume a stopped color
  resumeColor(color) {
    if (!this.stoppedColors.has(color)) {
      console.warn(`⚠️ Color ${color} is not currently stopped`);
      return { success: false, message: 'Color is not stopped' };
    }

    this.stoppedColors.delete(color);
    this.colorStopReasons.delete(color);
    this.metrics.stoppedColors = this.stoppedColors.size;

    console.log(`✅ Color ${color} RESUMED`);
    console.log(`🔍 Remaining stopped colors:`, Array.from(this.stoppedColors));

    return { 
      success: true, 
      message: `Color ${color} resumed successfully`,
      stoppedColors: Array.from(this.stoppedColors)
    };
  }

  // 🚨 ADVANCED FEATURE: Mark a buffer as faulted
  faultBuffer(bufferId, reason = 'Equipment fault') {
    if (!this.bufferStates[bufferId]) {
      console.error(`❌ Invalid buffer: ${bufferId}`);
      return { success: false, message: 'Invalid buffer' };
    }

    this.faultedBuffers.add(bufferId);
    this.bufferStates[bufferId].status = 'faulted';
    this.bufferStates[bufferId].faultReason = reason;
    this.bufferFaultReasons.set(bufferId, {
      reason,
      timestamp: new Date().toISOString(),
      faultedBy: 'system'
    });

    this.metrics.faultedBuffers = this.faultedBuffers.size;

    console.log(`🚨 Buffer ${bufferId} FAULTED - Reason: ${reason}`);
    console.log(`🔍 Current faulted buffers:`, Array.from(this.faultedBuffers));
    
    // Handle vehicles currently in the faulted buffer
    this.handleFaultedBufferVehicles(bufferId);

    return { 
      success: true, 
      message: `Buffer ${bufferId} marked as faulted`,
      faultedBuffers: Array.from(this.faultedBuffers)
    };
  }

  // 🚨 ADVANCED FEATURE: Clear buffer fault
  clearBufferFault(bufferId) {
    if (!this.faultedBuffers.has(bufferId)) {
      console.warn(`⚠️ Buffer ${bufferId} is not currently faulted`);
      return { success: false, message: 'Buffer is not faulted' };
    }

    this.faultedBuffers.delete(bufferId);
    this.bufferStates[bufferId].status = 'active';
    this.bufferStates[bufferId].faultReason = null;
    this.bufferFaultReasons.delete(bufferId);
    this.metrics.faultedBuffers = this.faultedBuffers.size;

    console.log(`✅ Buffer ${bufferId} fault CLEARED`);
    console.log(`🔍 Remaining faulted buffers:`, Array.from(this.faultedBuffers));

    return { 
      success: true, 
      message: `Buffer ${bufferId} fault cleared`,
      faultedBuffers: Array.from(this.faultedBuffers)
    };
  }

  // Handle vehicles in faulted buffer - move them to alternative buffers
  async handleFaultedBufferVehicles(faultedBufferId) {
    const faultedBuffer = this.bufferStates[faultedBufferId];
    if (faultedBuffer.vehicles.length === 0) return;

    console.log(`🔄 Rerouting ${faultedBuffer.vehicles.length} vehicles from faulted buffer ${faultedBufferId}`);

    const vehiclesToReroute = [...faultedBuffer.vehicles];
    faultedBuffer.vehicles = [];
    faultedBuffer.current = 0;

    // Group vehicles by color for efficient rerouting
    const colorGroups = {};
    vehiclesToReroute.forEach(vehicle => {
      if (!colorGroups[vehicle.color]) {
        colorGroups[vehicle.color] = [];
      }
      colorGroups[vehicle.color].push(vehicle);
    });

    // Reroute each color group
    for (const [color, vehicles] of Object.entries(colorGroups)) {
      const alternativeBuffer = this.findAlternativeBuffer(color, faultedBufferId);
      
      if (alternativeBuffer) {
        console.log(`🔀 Rerouting ${vehicles.length} ${color} vehicles from ${faultedBufferId} to ${alternativeBuffer}`);
        
        // Move vehicles to alternative buffer
        vehicles.forEach(vehicle => {
          if (this.bufferStates[alternativeBuffer].current < this.bufferStates[alternativeBuffer].capacity) {
            this.bufferStates[alternativeBuffer].vehicles.unshift(vehicle);
            this.bufferStates[alternativeBuffer].current++;
            
            // Update vehicle status in Firestore
            this.updateVehicleStatus(vehicle.id, 'in_buffer', alternativeBuffer, BUFFER_CONFIG[alternativeBuffer].oven);
          } else {
            // If alternative buffer is full, mark as waiting for rerouting
            this.updateVehicleStatus(vehicle.id, 'waiting_reroute', null, null);
            console.warn(`⚠️ Alternative buffer ${alternativeBuffer} full, vehicle ${vehicle.car_id} waiting for reroute`);
          }
        });

        this.metrics.reroutes += vehicles.length;
      } else {
        // No alternative buffer available, mark vehicles as waiting
        vehicles.forEach(vehicle => {
          this.updateVehicleStatus(vehicle.id, 'waiting', null, null);
        });
        console.warn(`⚠️ No alternative buffer for ${color} vehicles from faulted ${faultedBufferId}`);
      }
    }
  }

  // Handle color rerouting when a color is stopped
  handleColorRerouting(stoppedColor) {
    console.log(`🔀 Handling rerouting for stopped color ${stoppedColor}`);
    
    // Find buffers containing the stopped color
    const affectedBuffers = Object.entries(this.bufferStates)
      .filter(([bufferId, bufferState]) => 
        bufferState.vehicles.some(vehicle => vehicle.color === stoppedColor)
      );

    affectedBuffers.forEach(([bufferId, bufferState]) => {
      const stoppedColorVehicles = bufferState.vehicles.filter(v => v.color === stoppedColor);
      const otherVehicles = bufferState.vehicles.filter(v => v.color !== stoppedColor);
      
      console.log(`📍 Buffer ${bufferId}: ${stoppedColorVehicles.length} stopped ${stoppedColor} vehicles, ${otherVehicles.length} other vehicles`);
      
      // Remove stopped color vehicles from buffer
      bufferState.vehicles = otherVehicles;
      bufferState.current = otherVehicles.length;
      
      // Mark stopped vehicles as waiting
      stoppedColorVehicles.forEach(vehicle => {
        this.updateVehicleStatus(vehicle.id, 'waiting', null, null);
      });

      // If buffer becomes less than 50% full, allow next priority color
      const utilizationAfterRemoval = (bufferState.current / bufferState.capacity) * 100;
      if (utilizationAfterRemoval < 50) {
        this.handleBufferReallocation(bufferId, utilizationAfterRemoval);
      }
    });
  }

  // Handle buffer reallocation when utilization drops below 50%
  handleBufferReallocation(bufferId, currentUtilization) {
    const bufferConfig = BUFFER_CONFIG[bufferId];
    const availableCapacity = bufferConfig.capacity - this.bufferStates[bufferId].current;
    
    console.log(`🔄 Buffer ${bufferId} at ${currentUtilization.toFixed(1)}% utilization, ${availableCapacity} spaces available`);
    
    // Find next highest priority color that can use this buffer
    const eligibleColors = [...bufferConfig.primaryColors, ...bufferConfig.secondaryColors]
      .filter(color => !this.stoppedColors.has(color))
      .sort((a, b) => COLOR_PRIORITY[b] - COLOR_PRIORITY[a]);

    if (eligibleColors.length > 0) {
      const nextPriorityColor = eligibleColors[0];
      console.log(`✅ Buffer ${bufferId} available for next priority color: ${nextPriorityColor}`);
      
      // This will be handled in the next allocation cycle
      this.rerouting.set(bufferId, {
        availableFor: nextPriorityColor,
        availableCapacity,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Find alternative buffer for a color (excluding faulted buffer)
  findAlternativeBuffer(color, excludeBufferId) {
    const fallbackBuffers = COLOR_FALLBACK_MAP[color] || [];
    
    // Filter out faulted buffers and the excluded buffer
    const availableBuffers = fallbackBuffers.filter(bufferId => 
      bufferId !== excludeBufferId &&
      !this.faultedBuffers.has(bufferId) &&
      this.bufferStates[bufferId].status === 'active' &&
      this.bufferStates[bufferId].current < this.bufferStates[bufferId].capacity
    );

    if (availableBuffers.length === 0) return null;

    // Prefer buffers with same color or empty buffers
    const sameColorBuffer = availableBuffers.find(bufferId =>
      this.bufferStates[bufferId].vehicles.length > 0 &&
      this.bufferStates[bufferId].vehicles[0].color === color
    );

    if (sameColorBuffer) return sameColorBuffer;

    const emptyBuffer = availableBuffers.find(bufferId =>
      this.bufferStates[bufferId].vehicles.length === 0
    );

    if (emptyBuffer) return emptyBuffer;

    // Return buffer with lowest utilization
    return availableBuffers.reduce((best, current) => {
      const bestUtil = this.bufferStates[best].current / this.bufferStates[best].capacity;
      const currentUtil = this.bufferStates[current].current / this.bufferStates[current].capacity;
      return currentUtil < bestUtil ? current : best;
    });
  }

  // Enhanced buffer selection with fault tolerance
  getOptimalBufferAdvanced(color, availableBuffers) {
    // Filter out stopped colors and faulted buffers
    if (this.stoppedColors.has(color)) {
      console.log(`🛑 Color ${color} is stopped, skipping allocation`);
      return null;
    }

    // Filter available buffers to exclude faulted ones
    const healthyBuffers = availableBuffers.filter(bufferId => 
      !this.faultedBuffers.has(bufferId) && 
      this.bufferStates[bufferId].status === 'active'
    );

    if (healthyBuffers.length === 0) {
      console.log(`❌ No healthy buffers available for color ${color}`);
      return null;
    }

    console.log(`🎯 Finding optimal buffer for color ${color}, healthy buffers: ${healthyBuffers.join(', ')}`);

    // Use fallback mapping for intelligent selection
    const fallbackBuffers = COLOR_FALLBACK_MAP[color] || [];
    
    // Find the best available buffer from the fallback list
    for (const preferredBuffer of fallbackBuffers) {
      if (healthyBuffers.includes(preferredBuffer)) {
        console.log(`✅ ${color} → ${preferredBuffer} (preferred from fallback map)`);
        return preferredBuffer;
      }
    }

    // If no preferred buffer available, use any healthy buffer
    if (healthyBuffers.length > 0) {
      const fallbackBuffer = healthyBuffers[0];
      console.log(`🚨 Emergency: ${color} → ${fallbackBuffer} (emergency fallback)`);
      return fallbackBuffer;
    }

    console.log(`❌ No suitable buffer found for color ${color}`);
    return null;
  }

  // Enhanced allocation with fault tolerance and color stopping
  allocateVehiclesToBuffersAdvanced(vehicles) {
    const allocations = [];
    const groupedVehicles = this.groupVehiclesByColor(vehicles);

    console.log(`🎨 Processing ${Object.keys(groupedVehicles).length} different colors`);

    for (const [color, vehicleList] of Object.entries(groupedVehicles)) {
      // Skip stopped colors
      if (this.stoppedColors.has(color)) {
        console.log(`🛑 Skipping ${vehicleList.length} vehicles of stopped color ${color}`);
        continue;
      }

      console.log(`🎯 Processing ${vehicleList.length} vehicles of color ${color}`);

      // Find healthy buffers with capacity
      const availableBuffers = Object.keys(this.bufferStates).filter(
        bufferId => 
          !this.faultedBuffers.has(bufferId) &&
          this.bufferStates[bufferId].status === 'active' &&
          this.bufferStates[bufferId].current < this.bufferStates[bufferId].capacity
      );

      if (availableBuffers.length === 0) {
        this.metrics.bufferOverflows++;
        console.warn('❌ Buffer overflow - all healthy buffers at capacity');
        break;
      }

      // Smart buffer selection with fault tolerance
      let selectedBuffer = null;

      // 1. Check for rerouting opportunities
      const rerouteBuffer = Array.from(this.rerouting.entries())
        .find(([bufferId, info]) => 
          info.availableFor === color && 
          availableBuffers.includes(bufferId)
        );

      if (rerouteBuffer) {
        selectedBuffer = rerouteBuffer[0];
        this.rerouting.delete(selectedBuffer);
        console.log(`🔀 Using rerouted buffer ${selectedBuffer} for ${color}`);
      } else {
        // 2. Use advanced buffer selection
        selectedBuffer = this.getOptimalBufferAdvanced(color, availableBuffers);
      }

      if (!selectedBuffer) {
        console.log(`❌ No suitable buffer found for color ${color}`);
        continue;
      }

      // Batch allocate vehicles
      let allocatedCount = 0;
      for (const vehicle of vehicleList) {
        if (this.bufferStates[selectedBuffer].current >= this.bufferStates[selectedBuffer].capacity) {
          console.log(`⚠️ Buffer ${selectedBuffer} full, allocated ${allocatedCount}/${vehicleList.length} ${color} vehicles`);
          break;
        }

        const bufferPosition = this.bufferStates[selectedBuffer].current;

        allocations.push({
          vehicle,
          bufferId: selectedBuffer,
          oven: BUFFER_CONFIG[selectedBuffer].oven,
          position: bufferPosition
        });

        this.bufferStates[selectedBuffer].vehicles.unshift(vehicle);
        this.bufferStates[selectedBuffer].current++;
        allocatedCount++;

        console.log(`🚗 Added ${vehicle.car_id} (${vehicle.color}) to buffer ${selectedBuffer} [${this.bufferStates[selectedBuffer].current}/${this.bufferStates[selectedBuffer].capacity}]`);
      }

      console.log(`✅ Allocated ${allocatedCount} ${color} vehicles to buffer ${selectedBuffer}`);
    }

    return allocations;
  }

  // Enhanced main conveyor processing with fault tolerance
  async processMainConveyorAdvanced() {
    let selectedBuffer = null;
    let selectedVehicle = null;
    let bestScore = -1;

    // Only consider healthy, full buffers
    const candidateBuffers = Object.entries(this.bufferStates).filter(([bufferId, bufferState]) => 
      !this.faultedBuffers.has(bufferId) &&
      bufferState.status === 'active' &&
      bufferState.vehicles.length > 0 && 
      bufferState.current >= bufferState.capacity &&
      !this.stoppedColors.has(bufferState.vehicles[bufferState.vehicles.length - 1].color)
    );

    console.log(`🔍 Checking ${candidateBuffers.length} healthy, full buffers for processing...`);

    for (const [bufferId, bufferState] of candidateBuffers) {
      const vehicle = bufferState.vehicles[bufferState.vehicles.length - 1];
      
      // Skip if color is stopped
      if (this.stoppedColors.has(vehicle.color)) {
        console.log(`🛑 Skipping vehicle ${vehicle.car_id} - color ${vehicle.color} is stopped`);
        continue;
      }

      const colorPriority = COLOR_PRIORITY[vehicle.color] || 0;
      let score = colorPriority;

      // Same color bonus
      if (this.lastMainConveyorColor === vehicle.color) {
        score += 50;
      }

      // Fuller buffer bonus
      const fillRatio = bufferState.vehicles.length / bufferState.capacity;
      score += fillRatio * 10;

      if (score > bestScore) {
        bestScore = score;
        selectedBuffer = bufferId;
        selectedVehicle = vehicle;
      }

      console.log(`✅ Healthy full buffer ${bufferId}: ${bufferState.current}/${bufferState.capacity} - Vehicle ${vehicle.car_id} (${vehicle.color}) - Score: ${score.toFixed(1)}`);
    }

    if (selectedBuffer && selectedVehicle) {
      // Process the vehicle
      this.bufferStates[selectedBuffer].vehicles.pop();
      this.bufferStates[selectedBuffer].current--;

      console.log(`🚗 Removed ${selectedVehicle.car_id} (${selectedVehicle.color}) from buffer ${selectedBuffer}`);

      // Track changeovers
      if (this.lastMainConveyorColor && this.lastMainConveyorColor !== selectedVehicle.color) {
        this.metrics.colorChangeovers++;
        console.log(`🔄 Main conveyor changeover #${this.metrics.colorChangeovers}: ${this.lastMainConveyorColor} → ${selectedVehicle.color}`);
      }
      this.lastMainConveyorColor = selectedVehicle.color;

      await this.updateVehicleStatus(selectedVehicle.id, 'processing', selectedBuffer);
      this.metrics.totalProcessed++;

      // Complete processing
      setTimeout(async () => {
        await this.updateVehicleStatus(selectedVehicle.id, 'completed', selectedBuffer);
      }, 2000 + Math.random() * 2000);

      console.log(`🏭 Processing ${selectedVehicle.car_id} (${selectedVehicle.color}) from buffer ${selectedBuffer}`);

      return { vehicle: selectedVehicle, bufferId: selectedBuffer };
    }

    console.log('⏳ No healthy full buffers available for processing');
    return null;
  }

  // Group vehicles by color (same as before)
  groupVehiclesByColor(vehicles) {
    const groups = {};
    vehicles.forEach(vehicle => {
      if (!groups[vehicle.color]) {
        groups[vehicle.color] = [];
      }
      groups[vehicle.color].push(vehicle);
    });

    return Object.entries(groups)
      .sort(([colorA], [colorB]) => COLOR_PRIORITY[colorB] - COLOR_PRIORITY[colorA])
      .reduce((acc, [color, vehicleList]) => {
        acc[color] = vehicleList;
        return acc;
      }, {});
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

  // Batch update vehicles
  async batchUpdateVehicles(allocations) {
    try {
      const batch = writeBatch(db);

      allocations.forEach(({ vehicle, bufferId, oven, position }) => {
        const vehicleRef = doc(db, 'cars', vehicle.id);
        batch.update(vehicleRef, {
          status: 'in_buffer',
          buffer_line: bufferId,
          oven: oven,
          buffer_position: position || 0,
          updated_at: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log(`✅ Batch updated ${allocations.length} vehicles`);
    } catch (error) {
      console.error('❌ Error batch updating vehicles:', error);
    }
  }

  // Enhanced system status with fault information
  getAdvancedSystemStatus() {
    const bufferReadiness = {};
    Object.entries(this.bufferStates).forEach(([bufferId, bufferState]) => {
      bufferReadiness[bufferId] = {
        current: bufferState.current,
        capacity: bufferState.capacity,
        isFull: bufferState.current >= bufferState.capacity,
        isReadyForProcessing: bufferState.vehicles.length > 0 && bufferState.current >= bufferState.capacity,
        utilization: bufferState.capacity > 0 ? (bufferState.current / bufferState.capacity) * 100 : 0,
        vehicleCount: bufferState.vehicles.length,
        lastColor: bufferState.lastColor,
        status: bufferState.status,
        faultReason: bufferState.faultReason,
        isFaulted: this.faultedBuffers.has(bufferId)
      };
    });

    const status = {
      isRunning: this.isRunning,
      metrics: { ...this.metrics },
      bufferStates: { ...this.bufferStates },
      bufferReadiness,
      stoppedColors: Array.from(this.stoppedColors),
      faultedBuffers: Array.from(this.faultedBuffers),
      colorStopReasons: Object.fromEntries(this.colorStopReasons),
      bufferFaultReasons: Object.fromEntries(this.bufferFaultReasons),
      rerouting: Object.fromEntries(this.rerouting),
      lastProcessedColors: { ...this.lastProcessedColors }
    };

    // Debug logging for advanced features
    if (status.stoppedColors.length > 0 || status.faultedBuffers.length > 0) {
      console.log('📊 Advanced Status:', {
        stoppedColors: status.stoppedColors,
        faultedBuffers: status.faultedBuffers,
        timestamp: new Date().toISOString()
      });
    }

    return status;
  }

  // Main execution cycle with advanced features
  async executeAdvancedSchedulingCycle() {
    try {
      console.log('🔄 Executing advanced scheduling cycle...');

      // Fetch waiting vehicles
      const waitingVehicles = await this.fetchVehicles('waiting', 10);

      if (waitingVehicles.length === 0) {
        console.log('⚠️ No waiting vehicles found');
        return;
      }

      console.log(`📋 Found ${waitingVehicles.length} waiting vehicles`);

      // Allocate with advanced logic
      const allocations = this.allocateVehiclesToBuffersAdvanced(waitingVehicles);

      if (allocations.length > 0) {
        await this.batchUpdateVehicles(allocations);
        console.log(`✅ Allocated ${allocations.length} vehicles to buffers`);
      }

      // Process with advanced logic
      const processed = await this.processMainConveyorAdvanced();
      if (processed) {
        console.log(`🏭 Processing vehicle ${processed.vehicle.car_id} (${processed.vehicle.color})`);
      }

      // Update metrics
      this.calculateAdvancedMetrics();

    } catch (error) {
      console.error('❌ Error in advanced scheduling cycle:', error);
    }
  }

  // Calculate advanced metrics
  calculateAdvancedMetrics() {
    const currentTime = new Date();
    const elapsedMinutes = this.metrics.startTime ?
      (currentTime - this.metrics.startTime) / (1000 * 60) : 0;

    if (elapsedMinutes > 0) {
      const carsPerMinute = this.metrics.totalProcessed / elapsedMinutes;
      this.metrics.jph = Math.min(carsPerMinute * 60, 45);
    } else {
      this.metrics.jph = 0;
    }

    const theoreticalMaxJPH = 30;
    let baseEfficiency = 0;

    if (this.metrics.jph > 0) {
      baseEfficiency = (this.metrics.jph / theoreticalMaxJPH) * 100;
    }

    // Enhanced penalties
    const changeoverPenalty = this.metrics.colorChangeovers * 2;
    const overflowPenalty = this.metrics.bufferOverflows * 5;
    const faultPenalty = this.metrics.faultedBuffers * 10; // New penalty for faulted buffers
    const stopPenalty = this.metrics.stoppedColors * 5; // New penalty for stopped colors

    this.metrics.efficiency = Math.max(0, Math.min(100, 
      baseEfficiency - changeoverPenalty - overflowPenalty - faultPenalty - stopPenalty
    ));

    console.log(`📊 Advanced Metrics: JPH=${this.metrics.jph.toFixed(1)}, Efficiency=${this.metrics.efficiency.toFixed(1)}%, Faulted=${this.metrics.faultedBuffers}, Stopped=${this.metrics.stoppedColors}`);
  }

  // Start advanced scheduling
  async startAdvancedScheduling(cycleInterval = 5000) {
    if (this.isRunning) {
      console.log('Advanced scheduling algorithm is already running');
      return;
    }

    this.isRunning = true;
    this.metrics.startTime = new Date();
    this.metrics.colorChangeovers = 0;
    this.lastMainConveyorColor = null;
    
    console.log(`🚀 Starting ADVANCED scheduling algorithm with ${cycleInterval / 1000}s cycle...`);

    try {
      this.intervalId = setInterval(async () => {
        try {
          await this.executeAdvancedSchedulingCycle();
        } catch (error) {
          console.error('Error in advanced scheduling cycle:', error);
        }
      }, Math.max(cycleInterval, 4000));
    } catch (error) {
      console.error('Error starting advanced scheduling:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Stop scheduling
  stopAdvancedScheduling() {
    if (!this.isRunning) {
      console.log('Advanced scheduling algorithm is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Advanced scheduling algorithm stopped');
  }

  // Reset with advanced features
  async resetAdvanced() {
    this.stopAdvancedScheduling();

    console.log('🔄 Resetting advanced system...');

    // Clear all advanced states
    this.stoppedColors.clear();
    this.faultedBuffers.clear();
    this.colorStopReasons.clear();
    this.bufferFaultReasons.clear();
    this.rerouting.clear();

    // Reset metrics
    this.metrics = {
      totalProcessed: 0,
      colorChangeovers: 0,
      bufferOverflows: 0,
      efficiency: 0,
      jph: 0,
      startTime: null,
      faultedBuffers: 0,
      stoppedColors: 0,
      reroutes: 0
    };

    this.initializeBufferStates();
    this.lastProcessedColors = {};
    this.lastMainConveyorColor = null;

    console.log('✅ Advanced system reset complete');
  }
}

// Export singleton instance
export const advancedSchedulingService = new AdvancedSchedulingService();
export default advancedSchedulingService;