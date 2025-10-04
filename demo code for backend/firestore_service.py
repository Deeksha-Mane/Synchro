# services/firestore_service.py
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Optional
from config import settings
import logging

logger = logging.getLogger(__name__)

class FirestoreService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        try:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            self._initialized = True
            logger.info("✅ Firebase initialized successfully")
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {e}")
            raise
    
    def seed_vehicles(self, vehicles: List[Dict]) -> bool:
        """Batch write vehicles to Firestore"""
        try:
            batch = self.db.batch()
            collection_ref = self.db.collection('vehicles')
            
            for i, vehicle in enumerate(vehicles):
                doc_ref = collection_ref.document(str(vehicle['car_id']))
                batch.set(doc_ref, vehicle)
                
                # Commit every 500 documents
                if (i + 1) % 500 == 0:
                    batch.commit()
                    batch = self.db.batch()
                    logger.info(f"Seeded {i + 1} vehicles")
            
            # Commit remaining
            batch.commit()
            logger.info(f"✅ Successfully seeded {len(vehicles)} vehicles")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error seeding vehicles: {e}")
            return False
    
    def update_vehicle(self, car_id: int, updates: Dict) -> bool:
        """Update single vehicle"""
        try:
            doc_ref = self.db.collection('vehicles').document(str(car_id))
            doc_ref.update(updates)
            return True
        except Exception as e:
            logger.error(f"Error updating vehicle {car_id}: {e}")
            return False
    
    def batch_update_vehicles(self, updates: List[tuple]) -> bool:
        """Batch update vehicles: [(car_id, update_dict), ...]"""
        try:
            batch = self.db.batch()
            
            for car_id, update_dict in updates:
                doc_ref = self.db.collection('vehicles').document(str(car_id))
                batch.update(doc_ref, update_dict)
            
            batch.commit()
            return True
        except Exception as e:
            logger.error(f"Batch update error: {e}")
            return False
    
    def get_waiting_vehicles(self, limit: int = 1000) -> List[Dict]:
        """Fetch vehicles with status='waiting'"""
        try:
            docs = (self.db.collection('vehicles')
                   .where('status', '==', 'waiting')
                   .limit(limit)
                   .stream())
            
            vehicles = []
            for doc in docs:
                data = doc.to_dict()
                data['_id'] = doc.id
                vehicles.append(data)
            
            return vehicles
        except Exception as e:
            logger.error(f"Error fetching vehicles: {e}")
            return []
    
    def update_metrics(self, metrics: Dict) -> bool:
        """Update real-time metrics"""
        try:
            doc_ref = self.db.collection('metrics').document('current')
            doc_ref.set(metrics, merge=True)
            return True
        except Exception as e:
            logger.error(f"Error updating metrics: {e}")
            return False
    
    def update_buffer_state(self, buffer_id: str, state: Dict) -> bool:
        """Update buffer state in real-time"""
        try:
            doc_ref = self.db.collection('buffers').document(buffer_id)
            doc_ref.set(state, merge=True)
            return True
        except Exception as e:
            logger.error(f"Error updating buffer {buffer_id}: {e}")
            return False
    
    def clear_collection(self, collection_name: str) -> bool:
        """Clear a collection (for reset)"""
        try:
            docs = self.db.collection(collection_name).stream()
            batch = self.db.batch()
            count = 0
            
            for doc in docs:
                batch.delete(doc.reference)
                count += 1
                
                if count % 500 == 0:
                    batch.commit()
                    batch = self.db.batch()
            
            batch.commit()
            logger.info(f"Cleared {count} documents from {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error clearing collection: {e}")
            return False

# Singleton instance
firestore_service = FirestoreService()