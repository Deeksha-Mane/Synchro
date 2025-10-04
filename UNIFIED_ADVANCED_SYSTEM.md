# Unified Advanced Scheduling System

## 🎯 Overview

The advanced scheduling system is now fully integrated across both the **Color Sequencing** and **Advanced Algorithm** pages. Changes made in either location will be reflected in both places, providing a seamless experience.

## 🔄 How It Works

### Shared State Management
- **Context Provider**: `AdvancedAlgorithmContext` manages the global state
- **Unified Service**: Automatically switches between basic and advanced services
- **Real-time Sync**: Changes in one page immediately affect the other

### Mode Toggle
Both pages now have a **Mode Toggle** that switches between:
- **Basic Mode**: Standard color sequencing
- **Advanced Mode**: Enhanced features with fault tolerance

## 📍 Where to Find Features

### Color Sequencing Page (`/dashboard/sequencing`)
**Header Features:**
- Mode toggle switch (Basic ↔ Advanced)
- Real-time status indicator showing current mode
- Dynamic description based on active mode

**Advanced Controls (when enabled):**
- Color Management panel (stop/resume colors)
- Buffer Management panel (fault/clear buffers)
- Advanced metrics (stopped colors, faulted buffers, reroutes)
- Real-time status updates

### Advanced Algorithm Page (`/dashboard/advanced`)
**Full Control Interface:**
- Mode toggle with detailed feature comparison
- Complete AdvancedBufferControl component
- System status overview
- Feature comparison table

## 🎛️ Using the System

### 1. Enable Advanced Mode
**From Color Sequencing:**
```
1. Go to Color Sequencing page
2. Toggle the switch in the header from "Basic" to "Advanced"
3. Advanced controls appear below the main controls
```

**From Advanced Algorithm:**
```
1. Go to Advanced Algorithm page
2. Toggle the switch in the top-right from "Basic" to "Advanced"
3. Full advanced interface becomes available
```

### 2. Stop a Color
**Example: Stop C1 due to quality issue**
```
1. In the Color Management panel, select "C1"
2. Enter reason: "Quality control failure detected"
3. Click "Stop Color"
4. System automatically reroutes C1 vehicles
5. Status updates in real-time on both pages
```

### 3. Fault a Buffer
**Example: L1 equipment failure**
```
1. In the Buffer Management panel, select "L1"
2. Enter reason: "Conveyor motor failure"
3. Click "Fault Buffer"
4. System moves L1 vehicles to alternative buffers
5. L1 excluded from future allocations
```

## 📊 Real-time Updates

### Status Synchronization
- **Mode Changes**: Instantly reflected on both pages
- **Color Stops**: Immediately visible in all interfaces
- **Buffer Faults**: Real-time status updates
- **Metrics**: Live updates every 3 seconds

### Visual Indicators
- **Running Status**: Shows "RUNNING (ADVANCED)" or "RUNNING (BASIC)"
- **Stopped Colors**: Red badges showing stopped colors
- **Faulted Buffers**: Red badges showing faulted buffers
- **Advanced Metrics**: Additional KPIs when in advanced mode

## 🔧 Technical Implementation

### Context Structure
```javascript
{
  // State
  isAdvancedMode: boolean,
  systemStatus: object,
  isRunning: boolean,
  
  // Functions
  toggleMode: () => void,
  startScheduling: (interval) => Promise,
  stopScheduling: () => void,
  resetSystem: () => Promise,
  
  // Advanced Functions
  stopColor: (color, reason) => object,
  resumeColor: (color) => object,
  faultBuffer: (bufferId, reason) => object,
  clearBufferFault: (bufferId) => object
}
```

### Service Switching
```javascript
// Automatically switches between services based on mode
const service = isAdvancedMode 
  ? advancedSchedulingService 
  : schedulingService;

// Handles service transition when mode changes
const toggleMode = async () => {
  // Stop current service
  // Switch mode
  // Start new service if was running
};
```

## 🎯 Key Benefits

### For Users
1. **Consistent Experience**: Same features available from both pages
2. **Real-time Sync**: Changes immediately visible everywhere
3. **Progressive Enhancement**: Start basic, upgrade to advanced
4. **Seamless Switching**: No data loss when changing modes

### For Operations
1. **Unified Control**: Manage from preferred interface
2. **Real-time Monitoring**: Live status updates
3. **Audit Trail**: Complete history of all actions
4. **Fault Tolerance**: System continues despite failures

### For Development
1. **Single Source of Truth**: Centralized state management
2. **Reusable Components**: Shared control panels
3. **Easy Maintenance**: Changes in one place affect all
4. **Extensible**: Easy to add new features

## 🚀 Usage Examples

### Scenario 1: Quality Issue During Production
```
1. Production running in Basic mode on Color Sequencing page
2. Quality control detects C1 paint issue
3. Operator toggles to Advanced mode (system keeps running)
4. Operator stops C1 with reason "Quality control failure"
5. System automatically reroutes C1 vehicles
6. Production continues with other colors
7. Status visible on both Color Sequencing and Advanced Algorithm pages
```

### Scenario 2: Scheduled Maintenance
```
1. Maintenance scheduled for L1 buffer
2. Operator goes to Advanced Algorithm page
3. Enables Advanced mode
4. Faults L1 buffer with reason "Scheduled maintenance"
5. System moves all L1 vehicles to L2
6. Maintenance proceeds without stopping production
7. After maintenance, operator clears L1 fault
8. L1 becomes available for new allocations
```

## 📈 Monitoring

### Real-time Metrics
- **Basic Metrics**: Processed, Changeovers, Efficiency, JPH
- **Advanced Metrics**: Stopped Colors, Faulted Buffers, Reroutes, Full Buffers
- **Status Updates**: Every 3 seconds across all interfaces
- **Notifications**: Toast messages for all actions

### Visual Feedback
- **Color Coding**: Green (running), Red (stopped/faulted), Gray (inactive)
- **Animations**: Pulse effects for active processing
- **Badges**: Clear indicators for stopped/faulted items
- **Progress**: Real-time buffer utilization

The unified system provides enterprise-grade scheduling capabilities while maintaining simplicity and ease of use. Whether you prefer the focused Color Sequencing interface or the comprehensive Advanced Algorithm page, all features are available and synchronized in real-time.