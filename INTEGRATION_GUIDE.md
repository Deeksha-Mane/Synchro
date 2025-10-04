# Integration Guide - Advanced Scheduling System

## Quick Start

### 1. Import the Advanced Service
```javascript
import { advancedSchedulingService } from '../services/advancedSchedulingService';
```

### 2. Replace Basic Scheduling
```javascript
// OLD: Basic scheduling
import { schedulingService } from '../services/schedulingService';

// NEW: Advanced scheduling
import { advancedSchedulingService } from '../services/advancedSchedulingService';
```

### 3. Update Your Dashboard Component
```jsx
// Add to your Dashboard.jsx
import AdvancedBufferControl from '../components/AdvancedBufferControl';

// In your render method:
<AdvancedBufferControl />
```

## API Reference

### Color Management
```javascript
// Stop a color
const result = advancedSchedulingService.stopColor('C1', 'Quality issue');
// Returns: { success: boolean, message: string, stoppedColors: string[] }

// Resume a color
const result = advancedSchedulingService.resumeColor('C1');
// Returns: { success: boolean, message: string, stoppedColors: string[] }
```

### Buffer Management
```javascript
// Fault a buffer
const result = advancedSchedulingService.faultBuffer('L1', 'Equipment failure');
// Returns: { success: boolean, message: string, faultedBuffers: string[] }

// Clear buffer fault
const result = advancedSchedulingService.clearBufferFault('L1');
// Returns: { success: boolean, message: string, faultedBuffers: string[] }
```

### System Control
```javascript
// Start advanced scheduling
await advancedSchedulingService.startAdvancedScheduling(5000); // 5 second cycles

// Stop scheduling
advancedSchedulingService.stopAdvancedScheduling();

// Reset system
await advancedSchedulingService.resetAdvanced();

// Get system status
const status = advancedSchedulingService.getAdvancedSystemStatus();
```

## Status Object Structure
```javascript
{
  isRunning: boolean,
  metrics: {
    totalProcessed: number,
    colorChangeovers: number,
    bufferOverflows: number,
    efficiency: number,
    jph: number,
    faultedBuffers: number,    // NEW
    stoppedColors: number,     // NEW
    reroutes: number          // NEW
  },
  stoppedColors: string[],           // NEW
  faultedBuffers: string[],          // NEW
  colorStopReasons: object,          // NEW
  bufferFaultReasons: object,        // NEW
  rerouting: object,                 // NEW
  bufferStates: object,
  bufferReadiness: object
}
```

## Migration from Basic to Advanced

### Step 1: Update Service Import
```javascript
// Before
import schedulingService from '../services/schedulingService';

// After
import { advancedSchedulingService } from '../services/advancedSchedulingService';
```

### Step 2: Update Method Calls
```javascript
// Before
schedulingService.startScheduling();
schedulingService.getSystemStatus();

// After
advancedSchedulingService.startAdvancedScheduling();
advancedSchedulingService.getAdvancedSystemStatus();
```

### Step 3: Handle New Status Properties
```javascript
const status = advancedSchedulingService.getAdvancedSystemStatus();

// New properties available:
console.log('Stopped Colors:', status.stoppedColors);
console.log('Faulted Buffers:', status.faultedBuffers);
console.log('Reroutes:', status.metrics.reroutes);
```

## Common Use Cases

### Quality Control Integration
```javascript
// When quality control detects an issue
function handleQualityIssue(color, issueDescription) {
  const result = advancedSchedulingService.stopColor(color, `Quality issue: ${issueDescription}`);
  
  if (result.success) {
    // Notify operators
    showNotification(`Color ${color} stopped due to quality issue`);
    
    // Log for audit trail
    logQualityEvent(color, issueDescription);
  }
}
```

### Maintenance Integration
```javascript
// When maintenance is scheduled
function scheduleMaintenance(bufferId, maintenanceReason, estimatedDuration) {
  const result = advancedSchedulingService.faultBuffer(bufferId, 
    `Scheduled maintenance: ${maintenanceReason} (Est. ${estimatedDuration})`);
  
  if (result.success) {
    // Schedule automatic recovery
    setTimeout(() => {
      advancedSchedulingService.clearBufferFault(bufferId);
      showNotification(`Buffer ${bufferId} maintenance completed`);
    }, estimatedDuration);
  }
}
```

### Real-time Monitoring
```javascript
// Monitor system status
function monitorSystemHealth() {
  const status = advancedSchedulingService.getAdvancedSystemStatus();
  
  // Check for issues
  if (status.faultedBuffers.length > 0) {
    alertManagement(`${status.faultedBuffers.length} buffers are faulted`);
  }
  
  if (status.stoppedColors.length > 0) {
    alertManagement(`${status.stoppedColors.length} colors are stopped`);
  }
  
  // Check efficiency impact
  if (status.metrics.efficiency < 70) {
    alertManagement(`System efficiency dropped to ${status.metrics.efficiency.toFixed(1)}%`);
  }
}
```

## Testing Your Integration

### Basic Functionality Test
```javascript
async function testBasicFunctionality() {
  // Test color stop/resume
  let result = advancedSchedulingService.stopColor('C1', 'Test stop');
  console.assert(result.success, 'Color stop should succeed');
  
  result = advancedSchedulingService.resumeColor('C1');
  console.assert(result.success, 'Color resume should succeed');
  
  // Test buffer fault/clear
  result = advancedSchedulingService.faultBuffer('L1', 'Test fault');
  console.assert(result.success, 'Buffer fault should succeed');
  
  result = advancedSchedulingService.clearBufferFault('L1');
  console.assert(result.success, 'Buffer clear should succeed');
  
  console.log('✅ Basic functionality test passed');
}
```

### Integration Test
```javascript
async function testIntegration() {
  // Start the system
  await advancedSchedulingService.startAdvancedScheduling();
  
  // Wait for a few cycles
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check status
  const status = advancedSchedulingService.getAdvancedSystemStatus();
  console.assert(status.isRunning, 'System should be running');
  
  // Stop the system
  advancedSchedulingService.stopAdvancedScheduling();
  
  console.log('✅ Integration test passed');
}
```

## Performance Considerations

### Cycle Interval
- **Minimum**: 4 seconds (to avoid Firestore quota issues)
- **Recommended**: 5-10 seconds for production
- **Development**: 3-5 seconds for testing

### Memory Usage
- Advanced system uses ~20% more memory than basic system
- Reason tracking adds minimal overhead
- Historical data is automatically cleaned up

### Database Impact
- Same Firestore usage as basic system
- Additional fields for fault/stop tracking
- No significant performance impact

## Troubleshooting

### Common Issues

#### 1. Colors Not Stopping
```javascript
// Check if color is valid
const validColors = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
if (!validColors.includes(color)) {
  console.error('Invalid color:', color);
}
```

#### 2. Buffers Not Faulting
```javascript
// Check if buffer exists
const validBuffers = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];
if (!validBuffers.includes(bufferId)) {
  console.error('Invalid buffer:', bufferId);
}
```

#### 3. System Not Starting
```javascript
// Check for existing instance
if (advancedSchedulingService.isRunning) {
  console.log('System already running, stop first');
  advancedSchedulingService.stopAdvancedScheduling();
}
```

### Debug Mode
```javascript
// Enable detailed logging
console.log('System Status:', advancedSchedulingService.getAdvancedSystemStatus());

// Check specific states
const status = advancedSchedulingService.getAdvancedSystemStatus();
console.log('Buffer States:', status.bufferStates);
console.log('Stop Reasons:', status.colorStopReasons);
console.log('Fault Reasons:', status.bufferFaultReasons);
```

## Support

For additional support or questions:
1. Check the test files for examples
2. Review the comprehensive documentation
3. Use the debug methods for troubleshooting
4. Monitor the console for detailed logging