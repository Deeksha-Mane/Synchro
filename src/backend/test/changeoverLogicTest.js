// Test to verify changeover counting logic
import { schedulingService } from '../../services/schedulingService.js';

function testChangeoverLogic() {
  console.log('=== Testing Changeover Logic Fix ===\n');

  // Reset the service
  schedulingService.metrics = {
    totalProcessed: 0,
    colorChangeovers: 0,
    bufferOverflows: 0,
    efficiency: 0,
    jph: 0,
    startTime: new Date()
  };
  schedulingService.lastMainConveyorColor = null;

  console.log('1. Initial state:');
  console.log(`   Color Changeovers: ${schedulingService.metrics.colorChangeovers}`);
  console.log(`   Last Main Conveyor Color: ${schedulingService.lastMainConveyorColor}\n`);

  // Simulate processing same color vehicles
  console.log('2. Processing same color vehicles (C1 → C1 → C1):');
  
  // First vehicle (C1)
  const prevColor = schedulingService.lastMainConveyorColor;
  const currentColor = 'C1';
  
  if (prevColor && prevColor !== currentColor) {
    schedulingService.metrics.colorChangeovers++;
    console.log(`   Changeover detected: ${prevColor} → ${currentColor}`);
  } else {
    console.log(`   No changeover: ${prevColor || 'none'} → ${currentColor}`);
  }
  schedulingService.lastMainConveyorColor = currentColor;
  schedulingService.metrics.totalProcessed++;
  
  // Second vehicle (C1)
  const prevColor2 = schedulingService.lastMainConveyorColor;
  const currentColor2 = 'C1';
  
  if (prevColor2 && prevColor2 !== currentColor2) {
    schedulingService.metrics.colorChangeovers++;
    console.log(`   Changeover detected: ${prevColor2} → ${currentColor2}`);
  } else {
    console.log(`   No changeover: ${prevColor2} → ${currentColor2}`);
  }
  schedulingService.lastMainConveyorColor = currentColor2;
  schedulingService.metrics.totalProcessed++;
  
  // Third vehicle (C1)
  const prevColor3 = schedulingService.lastMainConveyorColor;
  const currentColor3 = 'C1';
  
  if (prevColor3 && prevColor3 !== currentColor3) {
    schedulingService.metrics.colorChangeovers++;
    console.log(`   Changeover detected: ${prevColor3} → ${currentColor3}`);
  } else {
    console.log(`   No changeover: ${prevColor3} → ${currentColor3}`);
  }
  schedulingService.lastMainConveyorColor = currentColor3;
  schedulingService.metrics.totalProcessed++;
  
  console.log(`   Result: ${schedulingService.metrics.colorChangeovers} changeovers (Expected: 0)\n`);

  // Simulate processing different color vehicles
  console.log('3. Processing different color vehicles (C1 → C2 → C1):');
  
  // Fourth vehicle (C2) - should cause changeover
  const prevColor4 = schedulingService.lastMainConveyorColor;
  const currentColor4 = 'C2';
  
  if (prevColor4 && prevColor4 !== currentColor4) {
    schedulingService.metrics.colorChangeovers++;
    console.log(`   Changeover detected: ${prevColor4} → ${currentColor4}`);
  } else {
    console.log(`   No changeover: ${prevColor4} → ${currentColor4}`);
  }
  schedulingService.lastMainConveyorColor = currentColor4;
  schedulingService.metrics.totalProcessed++;
  
  // Fifth vehicle (C1) - should cause another changeover
  const prevColor5 = schedulingService.lastMainConveyorColor;
  const currentColor5 = 'C1';
  
  if (prevColor5 && prevColor5 !== currentColor5) {
    schedulingService.metrics.colorChangeovers++;
    console.log(`   Changeover detected: ${prevColor5} → ${currentColor5}`);
  } else {
    console.log(`   No changeover: ${prevColor5} → ${currentColor5}`);
  }
  schedulingService.lastMainConveyorColor = currentColor5;
  schedulingService.metrics.totalProcessed++;
  
  console.log(`   Result: ${schedulingService.metrics.colorChangeovers} changeovers (Expected: 2)\n`);

  console.log('4. Final state:');
  console.log(`   Total Processed: ${schedulingService.metrics.totalProcessed}`);
  console.log(`   Color Changeovers: ${schedulingService.metrics.colorChangeovers}`);
  console.log(`   Last Main Conveyor Color: ${schedulingService.lastMainConveyorColor}\n`);

  console.log('=== Test Complete ===');
  
  if (schedulingService.metrics.colorChangeovers === 2) {
    console.log('✅ Changeover logic is working correctly!');
  } else {
    console.log('❌ Changeover logic has issues - expected 2, got', schedulingService.metrics.colorChangeovers);
  }
}

// Run the test
testChangeoverLogic();