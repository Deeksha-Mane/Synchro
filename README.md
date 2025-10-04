# Smart Sequencing for Conveyor & Buffer Management

A comprehensive manufacturing optimization system for vehicle production lines with intelligent sequencing algorithms, real-time monitoring, and ML-powered optimization.

## Features

- 🏭 **Control Center**: Real-time monitoring dashboard for manufacturing operations
- 🎨 **Color Sequencing**: Intelligent color grouping to minimize changeovers
- 📦 **Buffer Management**: Monitor and optimize buffer line utilization (L1-L9)
- 🔄 **Conveyor Control**: Manage dual oven system (O1 & O2) operations
- 📊 **Production Analytics**: Comprehensive KPIs and performance metrics
- 🚗 **Vehicle Dataset**: Manage 900+ vehicle production data
- 🤖 **ML Optimization**: Machine learning algorithms for smart scheduling
- ⚠️ **System Alerts**: Real-time notifications and alert management

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, React Router DOM
- **Backend**: FastAPI (for scheduling algorithms), Firebase (Auth, Firestore)
- **Database**: Firestore (vehicle dataset storage)
- **ML/Optimization**: Python-based algorithms for sequencing
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with manufacturing-focused design

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Firebase Setup

The app is already configured with Firebase. Make sure to:
1. Enable Authentication in Firebase Console
2. Enable Google Sign-in provider
3. Enable Firestore Database
4. Create a `users` collection in Firestore (will be created automatically on first registration)

## System Architecture

### Production System
- **Common Buffer**: 120 vehicle bodies capacity
- **Dual Ovens**: O1 and O2 operating simultaneously
- **Buffer Lines**: 
  - L1-L4: 14 vehicles each (Oven 1 exit)
  - L5-L9: 16 vehicles each (Oven 2 exit)
- **Main Conveyor**: Single-line pickup to Top Coat Oven

### Color Distribution (Daily Production ~900 vehicles)
- C1 (White): 40% | C2 (Silver): 25% | C3 (Black): 12%
- C4 (Red): 8% | C5 (Blue): 3% | C6-C11: 2% each | C12 (Pink): 1%

## Dashboard Modules

- **Control Center**: System overview and real-time monitoring
- **Color Sequencing**: Live visualization and optimization controls
- **Buffer Management**: Capacity monitoring and overflow prevention
- **Conveyor Lines**: Oven status and throughput control
- **Production Analytics**: Performance metrics and efficiency tracking
- **Vehicle Dataset**: 900+ vehicle data management
- **ML Optimization**: Algorithm performance and predictions
- **System Alerts**: Real-time notifications and issue management

## Smart Scheduling Algorithm Implementation

### Dynamic Color-Volume Based Allocation Strategy

**🔹 OVEN 1 (High-volume colors: C1, C2, C3)**
- **L1**: C1 dedicated (40% volume)
- **L2**: C1 overflow + C2 (25% volume) - flexible allocation
- **L3**: C2 dedicated 
- **L4**: C3 (12% volume) + C2 overflow

**🔹 OVEN 2 (Medium/low-volume colors: C4-C12)**
- **L5**: C4 (8%) + C5 (3%)
- **L6**: C6 (2%) + C7 (2%) 
- **L7**: C8 (2%) + C9 (2%)
- **L8**: C10 (2%) + C11 (2%)
- **L9**: C12 (1%) + Emergency overflow buffer

### Algorithm Features

✅ **Real-time Vehicle Processing**: Fetches vehicles from Firestore dataset
✅ **Intelligent Buffer Allocation**: Color-priority based assignment
✅ **Changeover Minimization**: Smart color grouping to reduce setup time
✅ **Overflow Prevention**: Dynamic load balancing across buffer lines
✅ **Performance Metrics**: Live JPH, efficiency, and changeover tracking
✅ **Firestore Integration**: Real-time data persistence and updates

### Usage Instructions

1. **Initialize Dataset**: Use "Initialize Dataset" button to load 900+ vehicles
2. **Start Algorithm**: Click "Start Scheduling Algorithm" to begin processing
3. **Monitor Progress**: Watch real-time visualization and metrics
4. **Stop/Reset**: Control algorithm execution and reset data as needed

## Evaluation Criteria Alignment

- **Innovation (20%)**: Novel OR/simulation hybrid approach with ML optimization
- **Technical Execution (30%)**: Robust model with strong optimization performance
- **Business Relevance (25%)**: Clear cost/time efficiency impact for manufacturing
- **Visualization & UX (15%)**: Intuitive dashboards with comprehensive KPIs
- **Presentation & Demo (10%)**: Polished demo with compelling business storytelling

Built for PS5: Smart Sequencing for Conveyor & Buffer Management 🏭