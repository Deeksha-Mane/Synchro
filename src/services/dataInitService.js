import { collection, writeBatch, doc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

class DataInitService {
  // Check if vehicles collection has data
  async hasVehicleData() {
    try {
      const vehiclesRef = collection(db, 'cars');
      const q = query(vehiclesRef, limit(1));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking vehicle data:', error);
      return false;
    }
  }

  // Initialize vehicles from JSON data
  async initializeVehicles(vehicleData) {
    try {
      const hasData = await this.hasVehicleData();
      if (hasData) {
        console.log('Vehicle data already exists in Firestore');
        return { success: true, message: 'Data already exists' };
      }

      console.log('Initializing vehicle data in Firestore...');
      
      // Batch write vehicles to Firestore
      const batchSize = 500; // Firestore batch limit
      const batches = [];
      
      for (let i = 0; i < vehicleData.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchData = vehicleData.slice(i, i + batchSize);
        
        batchData.forEach((vehicle) => {
          const docRef = doc(collection(db, 'cars'));
          // Calculate priority based on color
          const colorPriorities = {
            'C1': 40, 'C2': 25, 'C3': 12, 'C4': 8, 'C5': 3,
            'C6': 2, 'C7': 2, 'C8': 2, 'C9': 2, 'C10': 2, 'C11': 2, 'C12': 1
          };
          
          batch.set(docRef, {
            car_id: vehicle.car_id,
            color: vehicle.color,
            oven: vehicle.oven || null,
            status: vehicle.status || 'waiting',
            buffer_line: vehicle.buffer_line || null,
            priority: colorPriorities[vehicle.color] || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
        
        batches.push(batch);
      }

      // Execute all batches
      await Promise.all(batches.map(batch => batch.commit()));
      
      console.log(`Successfully initialized ${vehicleData.length} vehicles in Firestore`);
      return { 
        success: true, 
        message: `Initialized ${vehicleData.length} vehicles successfully` 
      };
      
    } catch (error) {
      console.error('Error initializing vehicle data:', error);
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }

  // Reset all vehicle data to waiting status
  async resetVehicleData() {
    try {
      console.log('Resetting all vehicle data...');
      
      const vehiclesRef = collection(db, 'cars');
      const snapshot = await getDocs(vehiclesRef);
      
      const batchSize = 500;
      const batches = [];
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, {
            status: 'waiting',
            oven: null,
            buffer_line: null,
            updated_at: new Date().toISOString()
          });
        });
        
        batches.push(batch);
      }

      await Promise.all(batches.map(batch => batch.commit()));
      
      console.log(`Successfully reset ${docs.length} vehicles`);
      return { 
        success: true, 
        message: `Reset ${docs.length} vehicles successfully` 
      };
      
    } catch (error) {
      console.error('Error resetting vehicle data:', error);
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }

  // Get vehicle statistics
  async getVehicleStats() {
    try {
      const vehiclesRef = collection(db, 'cars');
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

      return { success: true, data: stats };
      
    } catch (error) {
      console.error('Error getting vehicle stats:', error);
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }
}

export const dataInitService = new DataInitService();
export default dataInitService;