import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch, 
  query, 
  where, 
  limit,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Vehicle } from '../models/Vehicle.js';

export class FirestoreService {
  constructor() {
    this.listeners = new Map();
  }

  // Fetch vehicles with real-time updates
  async fetchVehicles(status = 'waiting', limitCount = 50) {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(
        vehiclesRef,
        where('status', '==', status),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const vehicles = snapshot.docs.map(doc => 
        new Vehicle({ id: doc.id, ...doc.data() })
      );
      
      console.log(`Fetched ${vehicles.length} vehicles with status: ${status}`);
      return vehicles;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  // Set up real-time listener for vehicles
  setupVehicleListener(status, callback) {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(
        vehiclesRef,
        where('status', '==', status),
        limit(100)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const vehicles = snapshot.docs.map(doc => 
          new Vehicle({ id: doc.id, ...doc.data() })
        );
        callback(vehicles);
      });

      this.listeners.set(`vehicles_${status}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up vehicle listener:', error);
      return null;
    }
  }

  // Update single vehicle
  async updateVehicle(vehicleId, updates) {
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(vehicleRef, updateData);
      console.log(`Updated vehicle ${vehicleId}:`, updates);
    } catch (error) {
      console.error(`Error updating vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  // Batch update multiple vehicles
  async batchUpdateVehicles(updates) {
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      updates.forEach(({ vehicleId, data }) => {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        batch.update(vehicleRef, {
          ...data,
          updated_at: timestamp
        });
      });

      await batch.commit();
      console.log(`Batch updated ${updates.length} vehicles`);
    } catch (error) {
      console.error('Error batch updating vehicles:', error);
      throw error;
    }
  }

  // Get vehicle statistics
  async getVehicleStats() {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const snapshot = await getDocs(vehiclesRef);
      
      const stats = {
        total: 0,
        byStatus: {},
        byColor: {},
        byOven: {},
        byBuffer: {}
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.total++;
        
        // Count by status
        stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
        
        // Count by color
        stats.byColor[data.color] = (stats.byColor[data.color] || 0) + 1;
        
        // Count by oven
        if (data.oven) {
          stats.byOven[data.oven] = (stats.byOven[data.oven] || 0) + 1;
        }
        
        // Count by buffer
        if (data.buffer_line) {
          stats.byBuffer[data.buffer_line] = (stats.byBuffer[data.buffer_line] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting vehicle stats:', error);
      return null;
    }
  }

  // Reset all vehicles to waiting status
  async resetAllVehicles() {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const snapshot = await getDocs(vehiclesRef);
      
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'waiting',
          oven: null,
          buffer_line: null,
          processing_time: null,
          updated_at: timestamp
        });
      });

      await batch.commit();
      console.log(`Reset ${snapshot.docs.length} vehicles to waiting status`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error resetting vehicles:', error);
      throw error;
    }
  }

  // Initialize vehicles from JSON data
  async initializeVehiclesFromJSON(jsonData) {
    try {
      // Check if data already exists
      const existingVehicles = await this.fetchVehicles('waiting', 1);
      if (existingVehicles.length > 0) {
        console.log('Vehicles already exist in database');
        return { success: true, message: 'Data already exists', count: 0 };
      }

      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchData = jsonData.slice(i, i + batchSize);
        
        batchData.forEach(vehicleData => {
          const docRef = doc(collection(db, 'vehicles'));
          const vehicle = new Vehicle(vehicleData);
          batch.set(docRef, vehicle.toFirestoreDoc());
        });
        
        batches.push(batch);
      }

      // Execute all batches
      await Promise.all(batches.map(batch => batch.commit()));
      
      console.log(`Initialized ${jsonData.length} vehicles in Firestore`);
      return { 
        success: true, 
        message: `Successfully initialized ${jsonData.length} vehicles`,
        count: jsonData.length
      };
    } catch (error) {
      console.error('Error initializing vehicles:', error);
      return { 
        success: false, 
        message: `Error: ${error.message}`,
        count: 0
      };
    }
  }

  // Clean up listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }
}