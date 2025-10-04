# Troubleshooting Advanced Features

## 🐛 Common Issues and Solutions

### Issue 1: Reset Button Not Working

#### Problem
The reset button on the Color Sequencing page doesn't respond or throws errors.

#### Root Cause
The reset button was calling `resetSystem()` from the context, which correctly resets the system.

#### Solution Implemented
✅ The reset button now properly calls the context's `resetSystem()` function which:
- Stops the current scheduling algorithm (basic or advanced)
- Resets all vehicles to waiting status in Firestore
- Clears all buffers
- Resets metrics to zero
- Clears stopped colors and faulted buffers (in advanced mode)

#### How to Use
1. **Stop the algorithm first** (button is disabled while running)
2. Click "🔄 Reset System"
3. Wait for confirmation notification
4. System is now reset and ready to start fresh

---

### Issue 2: Stopped Colors/Faulted Buffers Not Persisting

#### Problem
When you stop a color (e.g., C1) or fault a buffer (e.g., L3), it works initially but then the stopped/faulted state disappears after a few seconds.

#### Root Causes Identified

1. **State Update Overwriting**
   - The context updates system status every 3 seconds
   - If the service returns incomplete data, it could overwrite the stopped colors/faulted buffers

2. **Service State Management**
   - The advanced service uses JavaScript `Set` objects for stopped colors and faulted buffers
   - These Sets must be properly converted to arrays when returning status

3. **Context Preservation**
   - The context must preserve these arrays when updating other parts of the status

#### Solutions Implemented

##### 1. Enhanced Status Preservation in Context
```javascript
// Context now explicitly preserves advanced features
const updatedStatus = {
  ...status,
  stoppedColors: status.stoppedColors || [],
  faultedBuffers: status.faultedBuffers || [],
  colorStopReasons: status.colorStopReasons || {},
  bufferFaultReasons: status.bufferFaultReasons || {}
};
```

##### 2. Added Debug Logging
```javascript
// Service logs when colors are stopped/resumed
console.log(`🛑 Color ${color} STOPPED - Reason: ${reason}`);
console.log(`🔍 Current stopped colors:`, Array.from(this.stoppedColors));

// Context logs when advanced features are active
if (updatedStatus.stoppedColors.length > 0 || updatedStatus.faultedBuffers.length > 0) {
  console.log('🔍 Advanced Status Update:', {
    stoppedColors: updatedStatus.stoppedColors,
    faultedBuffers: updatedStatus.faultedBuffers
  });
}
```

##### 3. Service Status Return Enhancement
```javascript
// Service now logs what it's returning
const status = {
  // ... other properties
  stoppedColors: Array.from(this.stoppedColors),
  faultedBuffers: Array.from(this.faultedBuffers),
  // ...
};

// Debug logging
if (status.stoppedColors.length > 0 || status.faultedBuffers.length > 0) {
  console.log('📊 Advanced Status:', {
    stoppedColors: status.stoppedColors,
    faultedBuffers: status.faultedBuffers,
    timestamp: new Date().toISOString()
  });
}
```

---

## 🔍 Debugging Steps

### Check if Colors/Buffers are Actually Stopped

1. **Open Browser Console** (F12)
2. **Stop a color** (e.g., C1)
3. **Look for these logs**:
   ```
   🛑 Color C1 STOPPED - Reason: [your reason]
   🔍 Current stopped colors: ['C1']
   ```

4. **Watch for status updates** (every 3 seconds):
   ```
   📊 Advanced Status: {
     stoppedColors: ['C1'],
     faultedBuffers: [],
     timestamp: '2024-...'
   }
   ```

5. **Check context updates**:
   ```
   🔍 Advanced Status Update: {
     stoppedColors: ['C1'],
     faultedBuffers: []
   }
   ```

### If Stopped Colors Disappear

**Check the logs for:**

1. **Service is returning empty arrays**:
   ```
   📊 Advanced Status: {
     stoppedColors: [],  // ❌ PROBLEM: Should be ['C1']
     faultedBuffers: []
   }
   ```
   **Solution**: The service's Set is being cleared. Check if `resetAdvanced()` is being called unintentionally.

2. **Context is not preserving**:
   ```
   🔍 Advanced Status Update: {
     stoppedColors: undefined,  // ❌ PROBLEM: Should be ['C1']
     faultedBuffers: undefined
   }
   ```
   **Solution**: The context preservation logic needs to be checked.

3. **Mode switching**:
   - If you switch from Advanced to Basic mode, stopped colors are cleared (expected)
   - If you switch back to Advanced, you need to stop colors again

---

## 🎯 Expected Behavior

### Stopping a Color (C1)

1. **Immediate Effect**:
   - C1 vehicles stop being allocated to buffers
   - Existing C1 vehicles in buffers are rerouted
   - Status shows C1 in stopped colors list

2. **Persistent State**:
   - C1 remains stopped across status updates
   - C1 remains stopped even if algorithm is stopped/started
   - C1 only resumes when explicitly resumed or system is reset

3. **Visual Indicators**:
   - Color Sequencing page shows "Stopped Colors: C1"
   - Advanced Algorithm page shows C1 in stopped list
   - Control panels show C1 as "(STOPPED)"

### Faulting a Buffer (L3)

1. **Immediate Effect**:
   - L3 marked as faulted
   - All vehicles in L3 rerouted to alternative buffers
   - L3 excluded from future allocations

2. **Persistent State**:
   - L3 remains faulted across status updates
   - L3 remains faulted even if algorithm is stopped/started
   - L3 only clears when explicitly cleared or system is reset

3. **Visual Indicators**:
   - Buffer status grid shows L3 as red/faulted
   - Control panels show L3 as "(FAULTED)"
   - Metrics show count of faulted buffers

---

## 🚀 Testing Procedure

### Test 1: Color Stop Persistence

1. Enable Advanced Mode
2. Start the algorithm
3. Stop color C1 with reason "Test"
4. **Wait 10 seconds** (2-3 status updates)
5. **Check**: C1 should still show as stopped
6. **Check console**: Should see repeated logs showing C1 in stopped colors
7. Resume C1
8. **Check**: C1 should no longer show as stopped

### Test 2: Buffer Fault Persistence

1. Enable Advanced Mode
2. Start the algorithm
3. Fault buffer L3 with reason "Test"
4. **Wait 10 seconds** (2-3 status updates)
5. **Check**: L3 should still show as faulted
6. **Check console**: Should see repeated logs showing L3 in faulted buffers
7. Clear L3 fault
8. **Check**: L3 should no longer show as faulted

### Test 3: Combined Test

1. Enable Advanced Mode
2. Start the algorithm
3. Stop C1 and fault L3
4. **Wait 10 seconds**
5. **Check**: Both should persist
6. Stop the algorithm
7. **Check**: Both should still be stopped/faulted
8. Start the algorithm again
9. **Check**: Both should still be stopped/faulted
10. Reset system
11. **Check**: Both should be cleared

---

## 📝 Console Commands for Debugging

### Check Service State Directly
```javascript
// In browser console
import { advancedSchedulingService } from './src/services/advancedSchedulingService.js';

// Check stopped colors
console.log('Stopped Colors:', Array.from(advancedSchedulingService.stoppedColors));

// Check faulted buffers
console.log('Faulted Buffers:', Array.from(advancedSchedulingService.faultedBuffers));

// Get full status
console.log('Full Status:', advancedSchedulingService.getAdvancedSystemStatus());
```

---

## ✅ Verification Checklist

- [ ] Reset button works and shows notification
- [ ] Stopped colors persist across status updates
- [ ] Faulted buffers persist across status updates
- [ ] Stopped colors persist when algorithm is stopped/started
- [ ] Faulted buffers persist when algorithm is stopped/started
- [ ] Console shows debug logs for stopped colors
- [ ] Console shows debug logs for faulted buffers
- [ ] Visual indicators update correctly
- [ ] Resume/Clear functions work correctly
- [ ] Reset clears all stopped colors and faulted buffers

---

## 🆘 If Issues Persist

1. **Clear browser cache** and reload
2. **Check browser console** for errors
3. **Verify you're in Advanced Mode** (toggle should show "Advanced")
4. **Check that algorithm is running** (status should show "RUNNING (ADVANCED)")
5. **Try stopping/starting the algorithm** to refresh state
6. **Try resetting the system** to start fresh

The enhanced logging will help identify exactly where the issue is occurring in the state management flow.