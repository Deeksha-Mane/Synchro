// Buffer model for managing buffer lines
export class Buffer {
  constructor(id, config) {
    this.id = id;
    this.capacity = config.capacity;
    this.oven = config.oven;
    this.primaryColors = config.primaryColors || [];
    this.secondaryColors = config.secondaryColors || [];
    this.vehicles = [];
    this.current = 0;
    this.status = 'active';
    this.lastColor = null;
    this.totalProcessed = 0;
    this.colorChangeovers = 0;
    this.lastUpdated = new Date().toISOString();
  }

  // Check if buffer can accept a vehicle
  canAccept(vehicle) {
    if (this.current >= this.capacity) return false;
    if (this.status !== 'active') return false;
    return true;
  }

  // Check if color is compatible with this buffer
  isColorCompatible(color) {
    // Primary colors have highest priority
    if (this.primaryColors.includes(color)) return 3;
    // Secondary colors have medium priority
    if (this.secondaryColors.includes(color)) return 2;
    // Emergency buffer (L9) accepts all colors
    if (this.id === 'L9') return 1;
    return 0;
  }

  // Add vehicle to buffer
  addVehicle(vehicle) {
    if (!this.canAccept(vehicle)) {
      throw new Error(`Buffer ${this.id} cannot accept vehicle ${vehicle.car_id}`);
    }

    // NOTE: Don't count changeovers here - they're counted during main conveyor processing
    // Just track the last color for reference
    this.vehicles.push(vehicle);
    this.current++;
    this.lastColor = vehicle.color;
    this.lastUpdated = new Date().toISOString();

    vehicle.updateStatus('in_buffer', this.id, this.oven);
  }

  // Remove vehicle from buffer (FIFO)
  removeVehicle() {
    if (this.vehicles.length === 0) return null;

    const vehicle = this.vehicles.shift();
    this.current--;
    this.totalProcessed++;
    this.lastUpdated = new Date().toISOString();

    return vehicle;
  }

  // Get buffer utilization percentage
  getUtilization() {
    return this.capacity > 0 ? (this.current / this.capacity) * 100 : 0;
  }

  // Get buffer status
  getStatus() {
    const utilization = this.getUtilization();
    if (utilization >= 100) return 'full';
    if (utilization >= 90) return 'critical';
    if (utilization >= 70) return 'warning';
    if (utilization > 0) return 'active';
    return 'empty';
  }

  // Check if buffer is full and ready for processing
  isReadyForProcessing() {
    return this.current >= this.capacity && this.vehicles.length > 0;
  }

  // Check if buffer is at capacity
  isFull() {
    return this.current >= this.capacity;
  }

  // Get changeover penalty for adding a specific color
  getChangeoverPenalty(color) {
    if (!this.lastColor || this.lastColor === color) return 0;
    
    // Calculate penalty based on color distance
    const getColorNumber = (c) => parseInt(c.substring(1));
    const distance = Math.abs(getColorNumber(this.lastColor) - getColorNumber(color));
    return distance * 2; // Penalty factor
  }

  // Convert to status object
  toStatusObject() {
    return {
      id: this.id,
      capacity: this.capacity,
      current: this.current,
      oven: this.oven,
      status: this.getStatus(),
      utilization: this.getUtilization(),
      isFull: this.isFull(),
      isReadyForProcessing: this.isReadyForProcessing(),
      vehicles: this.vehicles.map(v => ({
        car_id: v.car_id,
        color: v.color,
        priority: v.priority
      })),
      lastColor: this.lastColor,
      totalProcessed: this.totalProcessed,
      colorChangeovers: this.colorChangeovers,
      lastUpdated: this.lastUpdated
    };
  }
}