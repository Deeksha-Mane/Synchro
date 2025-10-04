# services/simulation_engine.py
import asyncio
import random
from typing import List, Dict
from services.scheduler import scheduler
from services.firestore_service import firestore_service
from config import settings, COLOR_DISTRIBUTION
from models.vehicle import VehicleStatus
import logging

logger = logging.getLogger(__name__)

class SimulationEngine:
    def __init__(self):
        self.running = False
        self.tick = 0
        self.task = None
    
    def generate_vehicles(self, num_vehicles: int = None) -> List[Dict]:
        """Generate vehicle queue based on color distribution"""
        if num_vehicles is None:
            num_vehicles = settings.NUM_VEHICLES
        
        vehicles = []
        color_counts = {}
        
        # Calculate counts per color
        for color, pct in COLOR_DISTRIBUTION.items():
            count = int(num_vehicles * pct)
            color_counts[color] = count
        
        # Adjust to exact total
        diff = num_vehicles - sum(color_counts.values())
        color_counts['C1'] += diff
        
        # Generate vehicles
        car_id = 1
        for color, count in color_counts.items():
            for _ in range(count):
                vehicles.append({
                    'car_id': car_id,
                    'color': color,
                    'oven': scheduler.assign_oven(color),
                    'buffer': None,
                    'status': VehicleStatus.WAITING.value,
                    'batch_id': None,
                    'priority': int(color[1:])
                })
                car_id += 1
        
        # Shuffle for realistic arrival
        random.shuffle(vehicles)
        logger.info(f"Generated {len(vehicles)} vehicles")
        return vehicles
    
    async def seed_data(self, num_vehicles: int = None):
        """Seed vehicles to Firestore"""
        vehicles = self.generate_vehicles(num_vehicles)
        success = firestore_service.seed_vehicles(vehicles)
        
        if success:
            logger.info("Data seeding complete")
        return success
    
    async def load_waiting_vehicles(self, limit: int = 500) -> int:
        """Load waiting vehicles into oven queues"""
        vehicles = firestore_service.get_waiting_vehicles(limit)
        count = 0
        
        for vehicle in vehicles:
            car_id = vehicle['car_id']
            oven = vehicle['oven']
            scheduler.ovens[oven].append(car_id)
            scheduler.vehicles_by_id[car_id] = vehicle
            count += 1
        
        logger.info(f"Loaded {count} vehicles into oven queues")
        return count
    
    async def oven_step(self, oven_name: str):
        """Process one oven: move vehicles from oven to buffers"""
        for _ in range(settings.OVEN_PRODUCTION_RATE):
            if not scheduler.ovens[oven_name]:
                return
            
            car_id = scheduler.ovens[oven_name].popleft()
            vehicle = scheduler.vehicles_by_id.get(car_id)
            
            if not vehicle:
                continue
            
            # Assign to buffer
            result = scheduler.assign_vehicle_to_buffer(vehicle)
            
            if not result['success']:
                # Buffer overflow - requeue and pause
                scheduler.ovens[oven_name].appendleft(car_id)
                logger.warning(f"Buffer overflow for {car_id}, requeuing")
                return
            
            # Update Firestore
            firestore_service.update_vehicle(car_id, {
                'buffer': result['buffer'],
                'status': VehicleStatus.IN_BUFFER.value,
                'batch_id': result['batch_id']
            })
    
    async def conveyor_step(self):
        """Main conveyor picks and processes vehicles"""
        picked_cars = scheduler.pick_from_conveyor()
        
        if picked_cars:
            # Batch update Firestore
            updates = [
                (car_id, {'status': VehicleStatus.PAINTED.value, 'buffer': None})
                for car_id in picked_cars
            ]
            firestore_service.batch_update_vehicles(updates)
            
            logger.debug(f"Conveyor picked {len(picked_cars)} vehicles")
    
    async def update_realtime_state(self):
        """Push current state to Firestore for frontend"""
        # Update metrics
        metrics = scheduler.get_metrics_dict()
        metrics['current_tick'] = self.tick
        metrics['simulation_running'] = self.running
        firestore_service.update_metrics(metrics)
        
        # Update buffer states
        for buffer_id, buffer in scheduler.buffers.items():
            firestore_service.update_buffer_state(buffer_id, buffer.dict())
    
    async def simulation_loop(self):
        """Main simulation loop"""
        logger.info("Starting simulation loop")
        self.running = True
        
        # Initial load
        await self.load_waiting_vehicles(500)
        
        while self.running:
            self.tick += 1
            
            # Process ovens
            await self.oven_step("O1")
            await self.oven_step("O2")
            
            # Process conveyor
            await self.conveyor_step()
            
            # Reload if ovens empty
            if not scheduler.ovens["O1"] and not scheduler.ovens["O2"]:
                loaded = await self.load_waiting_vehicles(200)
                if loaded == 0:
                    # Check if buffers are also empty
                    total_occupancy = sum(
                        b.current_occupancy for b in scheduler.buffers.values()
                    )
                    if total_occupancy == 0:
                        logger.info("Simulation complete - all vehicles processed")
                        self.running = False
                        break
            
            # Update real-time state every 10 ticks
            if self.tick % 10 == 0:
                await self.update_realtime_state()
                logger.info(
                    f"Tick {self.tick}: Throughput={scheduler.metrics.throughput}, "
                    f"Changeovers={scheduler.metrics.total_changeovers}"
                )
            
            # Tick rate
            await asyncio.sleep(settings.TICK_RATE_SECONDS)
        
        # Final state update
        await self.update_realtime_state()
        logger.info("Simulation stopped")
    
    async def start(self):
        """Start simulation"""
        if self.running:
            return {"status": "already_running"}
        
        self.task = asyncio.create_task(self.simulation_loop())
        return {"status": "started", "tick": self.tick}
    
    async def stop(self):
        """Stop simulation"""
        self.running = False
        if self.task:
            await self.task
        return {"status": "stopped", "tick": self.tick}
    
    async def reset(self):
        """Reset simulation"""
        if self.running:
            await self.stop()
        
        # Clear Firestore
        firestore_service.clear_collection('vehicles')
        firestore_service.clear_collection('buffers')
        
        # Reset scheduler
        scheduler.__init__()
        self.tick = 0
        
        logger.info("Simulation reset complete")
        return {"status": "reset"}

# Singleton instance
simulation = SimulationEngine()