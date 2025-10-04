// Vehicle model for the scheduling system
export class Vehicle {
  constructor(data) {
    this.id = data.id;
    this.car_id = data.car_id;
    this.color = data.color;
    this.oven = data.oven || null;
    this.status = data.status || 'waiting';
    this.buffer_line = data.buffer_line || null;
    this.priority = this.calculatePriority(data.color);
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.processing_time = data.processing_time || null;
    this.changeover_penalty = 0;
  }

  // Calculate priority based on color volume
  calculatePriority(color) {
    const colorPriorities = {
      'C1': 40,  // White - Highest volume
      'C2': 25,  // Silver
      'C3': 12,  // Black
      'C4': 8,   // Red
      'C5': 3,   // Blue
      'C6': 2,   // Green
      'C7': 2,   // Yellow
      'C8': 2,   // Orange
      'C9': 2,   // Purple
      'C10': 2,  // Brown
      'C11': 2,  // Gray
      'C12': 1   // Pink - Lowest volume
    };
    return colorPriorities[color] || 1;
  }

  // Get color category for buffer allocation
  getColorCategory() {
    const highVolumeColors = ['C1', 'C2', 'C3'];
    const mediumVolumeColors = ['C4', 'C5'];
    const lowVolumeColors = ['C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

    if (highVolumeColors.includes(this.color)) return 'high';
    if (mediumVolumeColors.includes(this.color)) return 'medium';
    return 'low';
  }

  // Update vehicle status
  updateStatus(status, bufferLine = null, oven = null) {
    this.status = status;
    this.buffer_line = bufferLine;
    this.oven = oven;
    this.updated_at = new Date().toISOString();
    
    if (status === 'processing') {
      this.processing_time = new Date().toISOString();
    }
  }

  // Convert to Firestore document format
  toFirestoreDoc() {
    return {
      car_id: this.car_id,
      color: this.color,
      oven: this.oven,
      status: this.status,
      buffer_line: this.buffer_line,
      priority: this.priority,
      created_at: this.created_at,
      updated_at: this.updated_at,
      processing_time: this.processing_time
    };
  }
}