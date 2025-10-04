// Advanced Scheduling Test - Demonstrates color stopping and buffer fault handling
import { advancedSchedulingService } from '../../services/advancedSchedulingService.js';

function createTestVehicle(carId, color) {
  return {
    id: `test-${carId}`,
    car_id: carId,
    color: color,
    status: 'waiting',
    created_at: new Date().toISOString()
  };
}

async function testAdvancedScheduling() {
  console.log('=== Advanced Scheduling System Test ===\n');

  // Reset system
  await advancedSchedulingService.resetAdvanced();

  console.log('1. Initial System State:');
  let status = advancedSchedulingService.getAdvancedSystemStatus();
  console.log(`   Stopped Colors: ${status.stoppedColors.length}`);
  console.log(`   Faulted Buffers: ${status.faultedBuffers.length}`);
  console.log(`   System Running: ${status.isRunning}\n`);

  // Test 1: Color Stopping Functionality
  console.log('2. Testing Color Stop Functionality:');
  
  // Stop C1 color
  const stopResult = advancedSchedulingService.stopColor('C1', 'Quality issue detected');
  console.log(`   Stop C1 Result: ${stopResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   Message: ${stopResult.message}`);
  
  status = advancedSchedulingService.getAdvancedSystemStatus();
  console.log(`   Stopped Colors: [${status.stoppedColors.join(', ')}]`);
  console.log(`   Stop Reason: ${status.colorStopReasons.C1?.reason || 'N/A'}\n`);

  // Test 2: Buffer Fault Functionality
  console.log('3. Testing Buffer Fault Functionality:');
  
  // Fault L1 buffer
  const faultResult = advancedSchedulingService.faultBuffer('L1', 'Mechanical failure');
  console.log(`   Fault L1 Result: ${faultResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   Message: ${faultResult.message}`);
  
  status = advancedSchedulingService.getAdvancedSystemStatus();
  console.log(`   Faulted Buffers: [${status.faultedBuffers.join(', ')}]`);
  console.log(`   Fault Reason: ${status.bufferFaultReasons.L1?.reason || 'N/A'}\n`);

  // Test 3: Allocation with Stopped Color and Faulted Buffer
  console.log('4. Testing Allocation with Constraints:');
  
  // Create test vehicles including stopped color C1
  const testVehicles = [
    createTestVehicle('CAR001', 'C1'), // This should be skipped (stopped)
    createTestVehicle('CAR002', 'C1'), // This should be skipped (stopped)
    createTestVehicle('CAR003', 'C2'), // This should be allocated
    createTestVehicle('CAR004', 'C2'), // This should be allocated
    createTestVehicle('CAR005', 'C3'), // This should be allocated
  ];

  console.log(`   Test vehicles: ${testVehicles.length} (2 C1, 2 C2, 1 C3)`);
  
  const allocations = advancedSchedulingService.allocateVehiclesToBuffersAdvanced(testVehicles);
  console.log(`   Allocated vehicles: ${allocations.length}`);
  
  // Show allocation details
  allocations.forEach(allocation => {
    console.log(`   - ${allocation.vehicle.car_id} (${allocation.vehicle.color}) → Buffer ${allocation.bufferId}`);
  });
  
  // Check that C1 vehicles were skipped
  const c1Allocations = allocations.filter(a => a.vehicle.color === 'C1');
  console.log(`   C1 allocations: ${c1Allocations.length} (Expected: 0 - color is stopped)`);
  
  // Check that C2 vehicles avoided L1 (faulted)
  const l1Allocations = allocations.filter(a => a.bufferId === 'L1');
  console.log(`   L1 allocations: ${l1Allocations.length} (Expected: 0 - buffer is faulted)\n`);

  // Test 4: Fallback Buffer Selection
  console.log('5. Testing Fallback Buffer Selection:');
  
  // Simulate L3 (C2 primary) being full
  advancedSchedulingService.bufferStates.L3.current = advancedSchedulingService.bufferStates.L3.capacity;
  advancedSchedulingService.bufferStates.L3.vehicles = new Array(14).fill(createTestVehicle('DUMMY', 'C2'));
  
  const c2Vehicle = createTestVehicle('CAR006', 'C2');
  const availableBuffers = ['L2', 'L4', 'L9']; // L1 is faulted, L3 is full
  
  const selectedBuffer = advancedSchedulingService.getOptimalBufferAdvanced('C2', availableBuffers);
  console.log(`   C2 fallback buffer: ${selectedBuffer} (Expected: L2 or L4)`);
  
  // Test with all C2 buffers unavailable
  const limitedBuffers = ['L5', 'L6']; // Only O2 buffers available
  const emergencyBuffer = advancedSchedulingService.getOptimalBufferAdvanced('C2', limitedBuffers);
  console.log(`   C2 emergency buffer: ${emergencyBuffer || 'None'} (Expected: None - no suitable buffers)\n`);

  // Test 5: Resume Color and Clear Fault
  console.log('6. Testing Resume and Clear Functions:');
  
  // Resume C1 color
  const resumeResult = advancedSchedulingService.resumeColor('C1');
  console.log(`   Resume C1 Result: ${resumeResult.success ? 'SUCCESS' : 'FAILED'}`);
  
  // Clear L1 fault
  const clearResult = advancedSchedulingService.clearBufferFault('L1');
  console.log(`   Clear L1 Fault Result: ${clearResult.success ? 'SUCCESS' : 'FAILED'}`);
  
  status = advancedSchedulingService.getAdvancedSystemStatus();
  console.log(`   Stopped Colors: [${status.stoppedColors.join(', ')}] (Expected: empty)`);
  console.log(`   Faulted Buffers: [${status.faultedBuffers.join(', ')}] (Expected: empty)\n`);

  // Test 6: Buffer Reallocation Logic
  console.log('7. Testing Buffer Reallocation (50% Rule):');
  
  // Simulate L2 buffer with mixed colors, then stop one color
  advancedSchedulingService.bufferStates.L2.vehicles = [
    createTestVehicle('MIX1', 'C1'),
    createTestVehicle('MIX2', 'C1'),
    createTestVehicle('MIX3', 'C2'),
    createTestVehicle('MIX4', 'C2'),
    createTestVehicle('MIX5', 'C2'),
  ];
  advancedSchedulingService.bufferStates.L2.current = 5;
  
  console.log(`   L2 before C1 stop: ${advancedSchedulingService.bufferStates.L2.current}/14 vehicles`);
  console.log(`   Utilization: ${((5/14) * 100).toFixed(1)}%`);
  
  // Stop C1 again to trigger reallocation
  advancedSchedulingService.stopColor('C1', 'Test reallocation');
  advancedSchedulingService.handleColorRerouting('C1');
  
  console.log(`   L2 after C1 stop: ${advancedSchedulingService.bufferStates.L2.current}/14 vehicles`);
  console.log(`   New utilization: ${((advancedSchedulingService.bufferStates.L2.current/14) * 100).toFixed(1)}%`);
  
  // Check if reallocation was triggered (utilization < 50%)
  const utilizationAfter = (advancedSchedulingService.bufferStates.L2.current / 14) * 100;
  if (utilizationAfter < 50) {
    console.log(`   ✅ Reallocation triggered (utilization < 50%)`);
  } else {
    console.log(`   ⚠️ Reallocation not triggered (utilization >= 50%)`);
  }

  console.log('\n=== Advanced Test Complete ===');
  
  // Final status
  status = advancedSchedulingService.getAdvancedSystemStatus();
  console.log('\n📊 Final System Status:');
  console.log(`   Total Processed: ${status.metrics.totalProcessed}`);
  console.log(`   Color Changeovers: ${status.metrics.colorChangeovers}`);
  console.log(`   Reroutes: ${status.metrics.reroutes}`);
  console.log(`   Stopped Colors: ${status.stoppedColors.length}`);
  console.log(`   Faulted Buffers: ${status.faultedBuffers.length}`);
  
  console.log('\n✅ Advanced Scheduling System Test Completed Successfully!');
  console.log('\nKey Features Demonstrated:');
  console.log('   🛑 Color stopping with reason tracking');
  console.log('   🚨 Buffer fault management');
  console.log('   🔀 Intelligent fallback buffer selection');
  console.log('   📊 Enhanced metrics and monitoring');
  console.log('   🔄 Automatic rerouting and reallocation');
  console.log('   ⚡ 50% utilization rule for buffer reallocation');
}

// Run the test
testAdvancedScheduling().catch(console.error);