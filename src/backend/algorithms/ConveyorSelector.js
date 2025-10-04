// Main conveyor selection algorithm
export class ConveyorSelector {
  constructor(buffers) {
    this.buffers = buffers;
    this.processingHistory = [];
    this.lastProcessedBuffer = null;
  }

  // Select next vehicle for main conveyor processing
  selectNextVehicle() {
    // CRITICAL FIX: Only process vehicles from FULL buffers
    const candidateBuffers = Object.values(this.buffers).filter(buffer => 
      buffer.isReadyForProcessing() // Buffer must be full and have vehicles
    );

    if (candidateBuffers.length === 0) {
      console.log('No full buffers ready for processing');
      return null; // No full buffers available for processing
    }

    console.log(`Found ${candidateBuffers.length} full buffers ready for processing:`, 
      candidateBuffers.map(b => `${b.id}(${b.current}/${b.capacity})`).join(', '));
    

    // Score each buffer's first vehicle
    const scoredCandidates = candidateBuffers.map(buffer => {
      const vehicle = buffer.vehicles[0]; // FIFO - first vehicle
      return {
        buffer,
        vehicle,
        score: this.calculateProcessingScore(buffer, vehicle)
      };
    });

    // Sort by score (higher is better)
    scoredCandidates.sort((a, b) => b.score - a.score);

    const selected = scoredCandidates[0];
    
    // Remove vehicle from buffer
    const vehicle = selected.buffer.removeVehicle();
    
    // Update processing history
    this.processingHistory.push({
      vehicle,
      buffer: selected.buffer.id,
      timestamp: new Date().toISOString(),
      score: selected.score
    });

    this.lastProcessedBuffer = selected.buffer.id;

    return {
      vehicle,
      buffer: selected.buffer,
      score: selected.score
    };
  }

  // Calculate processing priority score
  calculateProcessingScore(buffer, vehicle) {
    let score = 0;

    // Vehicle priority (color volume based)
    score += vehicle.priority * 10;

    // Buffer utilization pressure (prioritize fuller buffers)
    const utilization = buffer.getUtilization();
    if (utilization >= 90) {
      score += 100; // Critical - process immediately
    } else if (utilization >= 70) {
      score += 50;  // Warning - higher priority
    }

    // Color grouping bonus (same color as last processed)
    const lastProcessed = this.getLastProcessedVehicle();
    if (lastProcessed && lastProcessed.color === vehicle.color) {
      score += 30; // Minimize changeovers
    }

    // Round-robin fairness (avoid starving buffers)
    if (this.lastProcessedBuffer !== buffer.id) {
      score += 20;
    }

    // Time-based priority (older vehicles get priority)
    const vehicleAge = Date.now() - new Date(vehicle.created_at).getTime();
    score += Math.min(vehicleAge / (1000 * 60), 10); // Max 10 points for age

    return score;
  }

  // Get last processed vehicle
  getLastProcessedVehicle() {
    return this.processingHistory.length > 0 ? 
      this.processingHistory[this.processingHistory.length - 1].vehicle : null;
  }

  // Get processing statistics
  getProcessingStats() {
    const stats = {
      totalProcessed: this.processingHistory.length,
      colorChangeovers: 0,
      bufferUsage: {},
      recentSequence: [],
      bufferReadiness: {}
    };

    // Calculate color changeovers
    for (let i = 1; i < this.processingHistory.length; i++) {
      const current = this.processingHistory[i].vehicle;
      const previous = this.processingHistory[i - 1].vehicle;
      
      if (current.color !== previous.color) {
        stats.colorChangeovers++;
      }
    }

    // Buffer usage statistics
    this.processingHistory.forEach(entry => {
      if (!stats.bufferUsage[entry.buffer]) {
        stats.bufferUsage[entry.buffer] = 0;
      }
      stats.bufferUsage[entry.buffer]++;
    });

    // Buffer readiness status
    Object.values(this.buffers).forEach(buffer => {
      stats.bufferReadiness[buffer.id] = {
        current: buffer.current,
        capacity: buffer.capacity,
        isFull: buffer.isFull(),
        isReady: buffer.isReadyForProcessing(),
        utilization: buffer.getUtilization()
      };
    });

    // Recent sequence (last 10 vehicles)
    stats.recentSequence = this.processingHistory
      .slice(-10)
      .map(entry => ({
        car_id: entry.vehicle.car_id,
        color: entry.vehicle.color,
        buffer: entry.buffer,
        timestamp: entry.timestamp
      }));

    return stats;
  }

  // Calculate throughput (JPH - Jobs Per Hour)
  calculateThroughput(startTime) {
    if (!startTime || this.processingHistory.length === 0) return 0;

    const elapsedHours = (Date.now() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    return elapsedHours > 0 ? this.processingHistory.length / elapsedHours : 0;
  }

  // Calculate efficiency percentage
  calculateEfficiency(maxThroughput = 50) {
    const currentThroughput = this.calculateThroughput();
    const changeoverPenalty = this.getProcessingStats().colorChangeovers * 0.5;
    
    const baseEfficiency = (currentThroughput / maxThroughput) * 100;
    return Math.max(0, Math.min(100, baseEfficiency - changeoverPenalty));
  }
}