# How to Access the Advanced Algorithm

## 🎯 Quick Access Guide

### Step 1: Navigate to Advanced Algorithm
1. Open your dashboard
2. Look for **"Advanced Algorithm"** in the sidebar navigation (with Brain icon)
3. Click on it to access the advanced scheduling page

### Step 2: Enable Advanced Mode
1. On the Advanced Algorithm page, you'll see a toggle switch in the top-right
2. Click the toggle to switch from **"Basic"** to **"Advanced"** mode
3. You'll see a notification confirming the mode switch

### Step 3: Access Advanced Features
Once in Advanced Mode, you'll have access to:

#### 🛑 **Color Management**
- **Stop Colors**: Temporarily halt specific colors (e.g., C1) with reason tracking
- **Resume Colors**: Restart stopped colors when issues are resolved
- **Reason Tracking**: Full audit trail of all stop/resume actions

#### 🚨 **Buffer Fault Management**
- **Fault Buffers**: Mark buffers as offline (e.g., L1 mechanical failure)
- **Clear Faults**: Restore buffers when repairs are complete
- **Automatic Rerouting**: System automatically moves vehicles to alternative buffers

#### 📊 **Enhanced Monitoring**
- **Real-time Status**: Live updates of stopped colors and faulted buffers
- **Advanced Metrics**: Additional KPIs including fault impact on efficiency
- **Buffer Status Grid**: Visual representation of all buffer states

## 🎛️ Using the Controls

### Color Stop Example
```
1. Select color (e.g., C1) from dropdown
2. Enter reason: "Quality control issue detected"
3. Click "Stop Color"
4. System automatically reroutes C1 vehicles
5. L1 buffer becomes available for other colors if <50% full
```

### Buffer Fault Example
```
1. Select buffer (e.g., L1) from dropdown
2. Enter reason: "Conveyor motor failure"
3. Click "Fault Buffer"
4. System moves all L1 vehicles to L2 (fallback)
5. L1 excluded from future allocations until cleared
```

## 🔄 Algorithm Comparison

| Feature | Basic Mode | Advanced Mode |
|---------|------------|---------------|
| Color Sequencing | ✅ Standard | ✅ Enhanced |
| Buffer Management | ✅ Basic | ✅ Advanced |
| Color Stop/Resume | ❌ | ✅ With Reasons |
| Buffer Fault Handling | ❌ | ✅ Automatic Rerouting |
| Intelligent Fallbacks | ❌ | ✅ Multi-tier |
| 50% Utilization Rule | ❌ | ✅ Automatic |
| Enhanced Metrics | ❌ | ✅ Fault Tracking |

## 🎯 Key Benefits

### For Operators
- **Immediate Response**: Stop problematic colors instantly
- **Fault Tolerance**: System continues running despite equipment failures
- **Clear Status**: Visual indicators of all system states

### For Managers
- **Audit Trail**: Complete history of all stops and faults with reasons
- **Performance Impact**: See how faults affect overall efficiency
- **Predictive Insights**: Data for maintenance planning

### For Maintenance
- **Scheduled Downtime**: Mark buffers as faulted during maintenance
- **Automatic Recovery**: Clear faults when repairs are complete
- **Minimal Disruption**: System reroutes automatically

## 🚀 Getting Started

1. **Navigate**: Dashboard → Advanced Algorithm (sidebar)
2. **Enable**: Toggle switch to "Advanced" mode
3. **Explore**: Try stopping a color or faulting a buffer
4. **Monitor**: Watch the real-time status updates
5. **Resume**: Clear faults and resume colors when ready

## 📞 Need Help?

- Check the **Feature Comparison** table on the Advanced Algorithm page
- Review the **Mode Description** for current capabilities
- Use the **Buffer Status Grid** to monitor system health
- Refer to the comprehensive documentation files for detailed explanations

The Advanced Algorithm provides enterprise-grade fault tolerance while maintaining the simplicity of the basic system. Perfect for real-world manufacturing environments with equipment failures and quality control requirements.