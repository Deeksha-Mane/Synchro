# Custom Car Simulation Guide

## 🎯 Overview

The Custom Car Simulation feature allows you to add your own custom car sequences and run simulations with them. This is perfect for testing specific scenarios, color distributions, or production sequences.

## 🚀 How It Works

### Data Flow
```
User Input → Quick Add Cars → Firestore (batch storage) → Custom Simulation Page → Algorithm Processing
```

### Key Features
1. **Batch Storage**: All custom cars are stored in Firestore with `source: 'manual_input'`
2. **Isolated Data**: Custom cars are separate from the main dataset
3. **Full Simulation**: Uses the same scheduling algorithm as Color Sequencing
4. **Real-time Metrics**: Live updates of processing status
5. **Advanced Mode Support**: Works with both Basic and Advanced algorithms

## 📝 Step-by-Step Usage

### Step 1: Add Custom Cars

1. **Navigate to Custom Simulation**
   - Go to Dashboard → Custom Simulation (in sidebar)

2. **Click "Quick Add Cars"**
   - Opens the Quick Add modal

3. **Select Colors and Quantities**
   - Choose color from the color grid
   - Enter quantity (or use quick buttons: +5, +10, +20, +50)
   - Click "Add" to add to your list

4. **Preview Your Sequence**
   - Click "Preview Simulation" to see all cars before adding
   - Review the color distribution
   - Check the total count

5. **Submit to Database**
   - Click "Add X Cars to Database"
   - Cars are stored in Firestore with batch write
   - Confirmation notification appears

### Step 2: Run Simulation

1. **Choose Algorithm Mode**
   - Toggle between Basic and Advanced mode
   - Advanced mode includes fault tolerance features

2. **Set Simulation Speed**
   - Use the slider to adjust cycle speed (1-10 seconds)
   - Faster speeds for quick testing
   - Slower speeds for detailed observation

3. **Start Simulation**
   - Click "▶️ Start Simulation"
   - Algorithm begins processing your custom cars
   - Real-time metrics update every cycle

4. **Monitor Progress**
   - Watch color distribution changes
   - Track processed vs waiting cars
   - View efficiency and JPH metrics

5. **Stop When Done**
   - Click "⏹️ Stop Simulation" to pause
   - Click "🔄 Reset Simulation" to start over

## 🎨 Example Scenarios

### Scenario 1: Test High-Volume Color
```
Goal: Test system with 80% white cars (C1)

Steps:
1. Add 80 cars of C1 (White)
2. Add 10 cars of C2 (Silver)
3. Add 10 cars of C3 (Black)
4. Preview: 80% C1, 10% C2, 10% C3
5. Submit and run simulation
6. Observe: Buffer allocation, changeovers, efficiency
```

### Scenario 2: Test Color Changeover Impact
```
Goal: Measure changeover penalty with alternating colors

Steps:
1. Add 10 cars of C1
2. Add 10 cars of C2
3. Add 10 cars of C1
4. Add 10 cars of C2
5. Run simulation
6. Observe: High changeover count, lower efficiency
```

### Scenario 3: Test Rare Color Handling
```
Goal: See how system handles low-volume colors

Steps:
1. Add 5 cars each of C6-C12 (rare colors)
2. Add 10 cars of C1 (common color)
3. Run simulation
4. Observe: Emergency buffer (L9) usage, routing decisions
```

### Scenario 4: Test Advanced Features
```
Goal: Test fault tolerance with custom cars

Steps:
1. Add 50 mixed color cars
2. Enable Advanced Mode
3. Start simulation
4. Stop C1 color mid-simulation
5. Fault L1 buffer mid-simulation
6. Observe: Automatic rerouting, continued operation
```

## 📊 Data Structure

### Custom Car Document in Firestore
```javascript
{
  car_id: 1234567,              // Unique ID based on timestamp
  color: 'C1',                  // Color code (C1-C12)
  status: 'waiting',            // waiting, in_buffer, processing, completed
  buffer_line: null,            // L1-L9 when allocated
  oven: null,                   // O1 or O2 when allocated
  priority: 40,                 // Based on color volume
  created_at: '2024-...',       // Timestamp
  updated_at: '2024-...',       // Last update
  source: 'manual_input'        // Identifies as custom car
}
```

### Why `source: 'manual_input'`?
- **Isolation**: Separates custom cars from main dataset
- **Filtering**: Easy to query only custom cars
- **Tracking**: Know which cars are user-generated
- **Cleanup**: Can delete all custom cars easily

## 🔧 Technical Details

### Batch Write Operation
```javascript
// Efficient batch writing to Firestore
const batch = writeBatch(db);

cars.forEach(carGroup => {
  for (let i = 0; i < carGroup.quantity; i++) {
    const carRef = doc(collection(db, 'cars'));
    batch.set(carRef, {
      // ... car data
      source: 'manual_input'
    });
  }
});

await batch.commit(); // Single atomic operation
```

### Query Custom Cars
```javascript
// Fetch only custom cars
const q = query(
  collection(db, 'cars'),
  where('source', '==', 'manual_input'),
  orderBy('created_at', 'desc'),
  limit(200)
);
```

### Algorithm Processing
- Custom cars are processed exactly like regular cars
- Same buffer allocation logic
- Same conveyor selection logic
- Same metrics calculation
- Full compatibility with Advanced Mode features

## 📈 Metrics Explained

### Real-time Metrics
- **Processed**: Total cars completed
- **Changeovers**: Color changes on main conveyor
- **Efficiency**: Overall system efficiency (0-100%)
- **JPH**: Jobs Per Hour (throughput rate)

### Status Distribution
- **Waiting**: Cars not yet allocated to buffers
- **In Buffer**: Cars allocated but not yet processing
- **Processing**: Cars currently on conveyor
- **Completed**: Cars finished processing

### Color Distribution
- Shows count and percentage for each color
- Updates in real-time as cars are processed
- Helps visualize your custom sequence

## 🎯 Best Practices

### 1. Start Small
- Test with 20-50 cars first
- Understand the flow before scaling up
- Easier to observe and debug

### 2. Use Realistic Distributions
- Match real-world color volumes
- C1 (White) typically 40%
- C2 (Silver) typically 25%
- Rare colors (C6-C12) typically 1-2% each

### 3. Test Edge Cases
- All same color (100% C1)
- Alternating colors (C1, C2, C1, C2...)
- Only rare colors (C6-C12)
- Random distribution

### 4. Monitor Performance
- Watch efficiency metrics
- Track changeover counts
- Observe buffer utilization
- Note JPH rates

### 5. Use Advanced Mode for Complex Tests
- Test fault tolerance
- Test color stopping
- Test buffer faulting
- Test rerouting logic

## 🔄 Workflow Examples

### Quick Test Workflow
```
1. Add 30 cars (mixed colors)
2. Start simulation (5s cycles)
3. Watch for 1-2 minutes
4. Stop and review metrics
5. Reset for next test
```

### Detailed Analysis Workflow
```
1. Plan specific color distribution
2. Add cars matching your plan
3. Preview and verify
4. Start simulation (slower cycles)
5. Monitor each stage
6. Take notes on observations
7. Export/screenshot metrics
8. Reset and try variations
```

### Advanced Testing Workflow
```
1. Add 100+ cars (realistic mix)
2. Enable Advanced Mode
3. Start simulation
4. Mid-simulation: Stop a color
5. Mid-simulation: Fault a buffer
6. Observe system adaptation
7. Resume/clear when ready
8. Complete simulation
9. Analyze final metrics
```

## 🆘 Troubleshooting

### Issue: No Custom Cars Showing
**Solution**: 
- Click "🔃 Refresh Data"
- Check Firestore for cars with `source: 'manual_input'`
- Verify Quick Add completed successfully

### Issue: Simulation Won't Start
**Solution**:
- Ensure you have custom cars added
- Check that algorithm isn't already running
- Try refreshing the page

### Issue: Cars Not Processing
**Solution**:
- Verify simulation is running (status shows "RUNNING")
- Check that cars are in "waiting" status
- Ensure buffers aren't all full

### Issue: Metrics Not Updating
**Solution**:
- Check browser console for errors
- Verify Firestore connection
- Try stopping and restarting simulation

## 🎓 Learning Opportunities

### Understand Buffer Allocation
- Watch how different colors route to different buffers
- See L1-L4 (Oven 1) vs L5-L9 (Oven 2) usage
- Observe emergency buffer (L9) activation

### Understand Changeover Impact
- Test sequences with many changeovers
- Compare efficiency with/without changeovers
- See how color grouping improves performance

### Understand Throughput
- Measure JPH with different distributions
- Test impact of buffer fullness
- Observe optimal vs suboptimal sequences

### Understand Advanced Features
- Test fault tolerance in action
- See automatic rerouting work
- Understand 50% utilization rule

## 🚀 Advanced Tips

### Tip 1: Save Your Sequences
- Document successful test sequences
- Note the color distributions that work well
- Keep track of metrics for comparison

### Tip 2: Combine with Main Dataset
- Custom cars work alongside regular cars
- Test how your sequence integrates
- Observe priority handling

### Tip 3: Use for Training
- Demonstrate system capabilities
- Show fault tolerance features
- Explain scheduling logic

### Tip 4: Performance Testing
- Add large batches (200+ cars)
- Test system limits
- Measure maximum throughput

This Custom Simulation feature provides a powerful tool for testing, learning, and optimizing your manufacturing scheduling system!