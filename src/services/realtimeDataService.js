import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';

class RealtimeDataService {
    constructor() {
        this.listeners = new Map();
        this.bufferData = {};
        this.recentSequence = [];
        this.callbacks = new Map();
    }

    // Set up real-time listener for vehicles in buffers
    setupBufferListener(callback) {
        try {
            const vehiclesRef = collection(db, 'cars');
            const q = query(
                vehiclesRef,
                where('status', 'in', ['in_buffer', 'processing'])
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log('🔄 Buffer data updated from Firestore');

                // Reset buffer data
                this.bufferData = {
                    L1: { vehicles: [], capacity: 14, oven: 'O1' },
                    L2: { vehicles: [], capacity: 14, oven: 'O1' },
                    L3: { vehicles: [], capacity: 14, oven: 'O1' },
                    L4: { vehicles: [], capacity: 14, oven: 'O1' },
                    L5: { vehicles: [], capacity: 16, oven: 'O2' },
                    L6: { vehicles: [], capacity: 16, oven: 'O2' },
                    L7: { vehicles: [], capacity: 16, oven: 'O2' },
                    L8: { vehicles: [], capacity: 16, oven: 'O2' },
                    L9: { vehicles: [], capacity: 16, oven: 'O2' }
                };

                // Populate buffer data with current vehicles
                snapshot.docs.forEach(doc => {
                    const vehicle = { id: doc.id, ...doc.data() };
                    if (vehicle.buffer_line && this.bufferData[vehicle.buffer_line]) {
                        this.bufferData[vehicle.buffer_line].vehicles.push(vehicle);
                    }
                });

                // 🎯 Sort vehicles in each buffer for proper FIFO visualization (left to right)
                Object.keys(this.bufferData).forEach(bufferId => {
                    this.bufferData[bufferId].vehicles.sort((a, b) => {
                        // Primary sort: buffer_position (REVERSED for correct FIFO)
                        if (a.buffer_position !== undefined && b.buffer_position !== undefined) {
                            return b.buffer_position - a.buffer_position; // Higher position = older = leftmost
                        }
                        // Fallback: sort by entry time (REVERSED: older vehicles on left)
                        const timeA = new Date(a.updated_at || a.created_at);
                        const timeB = new Date(b.updated_at || b.created_at);
                        return timeB - timeA; // Older vehicles appear on left
                    });

                    this.bufferData[bufferId].current = this.bufferData[bufferId].vehicles.length;

                    // 📋 Enhanced logging for CORRECT FIFO
                    if (this.bufferData[bufferId].vehicles.length > 0) {
                        const vehicleInfo = this.bufferData[bufferId].vehicles.map((v, idx) =>
                            `${v.car_id}(${v.color})`
                        );
                        console.log(`📋 Buffer ${bufferId} CORRECT FIFO [LEFT→RIGHT]: [${vehicleInfo.join(' → ')}]`);
                        console.log(`   └─ ENTRY (left) → → → EXIT (right)`);
                    }
                });

                console.log('📊 Updated buffer data:', this.bufferData);
                callback(this.bufferData);
            }, (error) => {
                console.error('Error in buffer listener:', error);
            });

            this.listeners.set('buffers', unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up buffer listener:', error);
            return null;
        }
    }

    // Set up real-time listener for recent processed vehicles (optimized)
    setupRecentSequenceListener(callback) {
        try {
            const vehiclesRef = collection(db, 'cars');
            const q = query(
                vehiclesRef,
                where('status', '==', 'completed'),
                orderBy('updated_at', 'desc'),
                limit(10) // Reduced from 15 to 10 to save reads
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log('🔄 Recent sequence updated from Firestore');

                const recentVehicles = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        // Add unique sequence number to avoid key conflicts
                        sequenceId: `${doc.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
                    }))
                    .slice(0, 12); // Show last 12 completed vehicles

                this.recentSequence = recentVehicles;
                console.log(`📋 Updated recent sequence: ${recentVehicles.length} completed vehicles`);
                console.log('📋 Recent cars:', recentVehicles.map(v => `${v.car_id}(${v.color})`).join(', '));
                callback(this.recentSequence);
            }, (error) => {
                console.error('Error in recent sequence listener:', error);
            });

            this.listeners.set('recentSequence', unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up recent sequence listener:', error);
            return null;
        }
    }

    // Get current buffer data
    getBufferData() {
        return this.bufferData;
    }

    // Get recent sequence
    getRecentSequence() {
        return this.recentSequence;
    }

    // Get vehicle statistics
    async getVehicleStats() {
        try {
            const vehiclesRef = collection(db, 'cars');
            const snapshot = await getDocs(vehiclesRef);

            const stats = {
                total: 0,
                waiting: 0,
                in_buffer: 0,
                processing: 0,
                completed: 0,
                byColor: {}
            };

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                stats.total++;
                stats[data.status] = (stats[data.status] || 0) + 1;
                stats.byColor[data.color] = (stats.byColor[data.color] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error getting vehicle stats:', error);
            return null;
        }
    }

    // Setup all listeners
    setupAllListeners(bufferCallback, sequenceCallback) {
        this.setupBufferListener(bufferCallback);
        this.setupRecentSequenceListener(sequenceCallback);
    }

    // Cleanup all listeners
    cleanup() {
        console.log('🧹 Cleaning up realtime listeners');
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
        this.callbacks.clear();
    }
}

// Export singleton instance
export const realtimeDataService = new RealtimeDataService();
export default realtimeDataService;