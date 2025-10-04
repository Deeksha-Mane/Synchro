// Buffer allocation algorithm based on the strategy
export class BufferAllocator {
  constructor(buffers) {
    this.buffers = buffers;
  }

  // Find optimal buffer for a vehicle
  findOptimalBuffer(vehicle) {
    const availableBuffers = Object.values(this.buffers).filter(buffer => 
      buffer.canAccept(vehicle)
    );

    if (availableBuffers.length === 0) {
      return null; // Buffer overflow condition
    }

    // Score each buffer for this vehicle
    const scoredBuffers = availableBuffers.map(buffer => ({
      buffer,
      score: this.calculateBufferScore(buffer, vehicle)
    }));

    // Sort by score (higher is better)
    scoredBuffers.sort((a, b) => b.score - a.score);

    return scoredBuffers[0].buffer;
  }

  // Calculate buffer score for a vehicle
  calculateBufferScore(buffer, vehicle) {
    let score = 0;

    // Color compatibility score (highest priority)
    const colorCompatibility = buffer.isColorCompatible(vehicle.color);
    score += colorCompatibility * 100;

    // Avoid changeover penalty
    const changeoverPenalty = buffer.getChangeoverPenalty(vehicle.color);
    score -= changeoverPenalty * 10;

    // Prefer less utilized buffers for load balancing
    const utilization = buffer.getUtilization();
    score -= utilization * 0.5;

    // Vehicle priority bonus
    score += vehicle.priority * 2;

    // Oven preference based on color category
    const colorCategory = vehicle.getColorCategory();
    if (colorCategory === 'high' && buffer.oven === 'O1') {
      score += 50; // High volume colors prefer Oven 1
    } else if (colorCategory !== 'high' && buffer.oven === 'O2') {
      score += 30; // Medium/low volume colors prefer Oven 2
    }

    return score;
  }

  // Allocate multiple vehicles efficiently
  allocateVehicles(vehicles) {
    const allocations = [];
    const failures = [];

    // Sort vehicles by priority (high priority first)
    const sortedVehicles = [...vehicles].sort((a, b) => b.priority - a.priority);

    for (const vehicle of sortedVehicles) {
      const optimalBuffer = this.findOptimalBuffer(vehicle);
      
      if (optimalBuffer) {
        try {
          optimalBuffer.addVehicle(vehicle);
          allocations.push({
            vehicle,
            buffer: optimalBuffer,
            score: this.calculateBufferScore(optimalBuffer, vehicle)
          });
        } catch (error) {
          console.error(`Failed to allocate vehicle ${vehicle.car_id}:`, error);
          failures.push({ vehicle, error: error.message });
        }
      } else {
        failures.push({ 
          vehicle, 
          error: 'No available buffer (overflow condition)' 
        });
      }
    }

    return { allocations, failures };
  }

  // Get allocation statistics
  getAllocationStats() {
    const stats = {
      totalCapacity: 0,
      totalOccupied: 0,
      bufferStats: {},
      ovenStats: { O1: { capacity: 0, occupied: 0 }, O2: { capacity: 0, occupied: 0 } }
    };

    Object.values(this.buffers).forEach(buffer => {
      stats.totalCapacity += buffer.capacity;
      stats.totalOccupied += buffer.current;
      
      stats.bufferStats[buffer.id] = buffer.toStatusObject();
      
      stats.ovenStats[buffer.oven].capacity += buffer.capacity;
      stats.ovenStats[buffer.oven].occupied += buffer.current;
    });

    stats.utilization = stats.totalCapacity > 0 ? 
      (stats.totalOccupied / stats.totalCapacity) * 100 : 0;

    return stats;
  }
}