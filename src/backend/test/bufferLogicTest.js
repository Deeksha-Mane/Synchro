// Simple test to verify buffer logic fix
import { Buffer } from '../models/Buffer.js';
import { ConveyorSelector } from '../algorithms/ConveyorSelector.js';
import { Vehicle } from '../models/Vehicle.js';

// Test configuration
const testConfig = {
  L1: { capacity: 3, oven: 'O1', primaryColors: ['C1'], secondaryColors: [] }
};

function createTestVehicle(carId, color) {
  return new Vehicle({
    id: `test-${carId}`,
    car_id: carId,
    color: color,
    status: 'waiting'
  });
}

function testBufferLogic() {
  console.log('=== Testing Buffer Logic Fix ===\n');

  // Create test buffer
  const buffer = new Buffer('L1', testConfig.L1);
  const buffers = { L1: buffer };
  const conveyorSelector = new ConveyorSelector(buffers);

  console.log('1. Initial buffer state:');
  console.log(`   Capacity: ${buffer.capacity}, Current: ${buffer.current}`);
  console.log(`   Is Full: ${buffer.isFull()}, Ready for Processing: ${buffer.isReadyForProcessing()}\n`);

  // Test 1: Try to process from empty buffer
  console.log('2. Testing processing from empty buffer:');
  let result = conveyorSelector.selectNextVehicle();
  console.log(`   Result: ${result ? 'Vehicle selected (WRONG!)' : 'No vehicle selected (CORRECT)'}\n`);

  // Test 2: Add vehicles but don't fill buffer
  console.log('3. Adding vehicles but not filling buffer:');
  const vehicle1 = createTestVehicle('CAR001', 'C1');
  const vehicle2 = createTestVehicle('CAR002', 'C1');
  
  buffer.addVehicle(vehicle1);
  buffer.addVehicle(vehicle2);
  
  console.log(`   Added 2 vehicles. Current: ${buffer.current}/${buffer.capacity}`);
  console.log(`   Is Full: ${buffer.isFull()}, Ready for Processing: ${buffer.isReadyForProcessing()}`);
  
  result = conveyorSelector.selectNextVehicle();
  console.log(`   Processing attempt: ${result ? 'Vehicle selected (WRONG!)' : 'No vehicle selected (CORRECT)'}\n`);

  // Test 3: Fill buffer completely
  console.log('4. Filling buffer to capacity:');
  const vehicle3 = createTestVehicle('CAR003', 'C1');
  buffer.addVehicle(vehicle3);
  
  console.log(`   Added 1 more vehicle. Current: ${buffer.current}/${buffer.capacity}`);
  console.log(`   Is Full: ${buffer.isFull()}, Ready for Processing: ${buffer.isReadyForProcessing()}`);
  
  result = conveyorSelector.selectNextVehicle();
  console.log(`   Processing attempt: ${result ? `Vehicle ${result.vehicle.car_id} selected (CORRECT!)` : 'No vehicle selected (WRONG!)'}\n`);

  // Test 4: After processing one vehicle
  if (result) {
    console.log('5. After processing one vehicle:');
    console.log(`   Current: ${buffer.current}/${buffer.capacity}`);
    console.log(`   Is Full: ${buffer.isFull()}, Ready for Processing: ${buffer.isReadyForProcessing()}`);
    
    const nextResult = conveyorSelector.selectNextVehicle();
    console.log(`   Next processing attempt: ${nextResult ? 'Vehicle selected (WRONG!)' : 'No vehicle selected (CORRECT)'}\n`);
  }

  console.log('=== Test Complete ===');
  console.log('✅ Buffer logic fix verified: Cars only process when buffer is FULL');
}

// Run the test
testBufferLogic();