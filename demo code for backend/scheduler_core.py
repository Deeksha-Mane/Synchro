# services/scheduler.py
from collections import deque, defaultdict
from typing import Optional, Tuple, Dict, List
from models.vehicle import BufferState, SystemMetrics, VehicleStatus
from config import *
import logging

logger = logging.getLogger(__name__)

class PaintShopScheduler:
    def __init__(self):
        # Buffer states
        self.buffers: Dict[str, BufferState] = {}
        self._initialize_buffers()
        
        # Oven queues
        self.ovens = {
            "O1": deque(),
            "O2": deque()
        }
        
        # Vehicle cache
        self.vehicles_by_id: Dict[int, Dict] = {}
        
        # Metrics
        self.metrics = SystemMetrics()
        self._initialize_buffer_states()
        
        # Batch tracking
        self.batch_counter = defaultdict(int)
        
        logger.info("🎨 Paint Shop Scheduler initialized")
    
    def _initialize_buffers(self):
        """Initialize buffer states from config"""
        for buffer_id, capacity in BUFFER_CAPACITY.items():
            metadata = BUFFER_METADATA[buffer_id]
            self.buffers[buffer_id] = BufferState(
                buffer_id=buffer_id,
                capacity=capacity,
                primary_colors=metadata["primary_colors"],
                is_flex=metadata["is_flex"]
            )
    
    def _initialize_buffer_states(self):
        """Copy buffer states to metrics"""
        self.metrics.buffer_states = {
            bid: buffer for bid, buffer in self.buffers.items()
        }
    
    def assign_oven(self, color: str) -> str:
        """Determine oven based on color"""
        return "O1" if color in HIGH_VOLUME_COLORS else "O2"
    
    def calculate_changeover_penalty(self, buffer: BufferState, new_color: str) -> int:
        """Calculate changeover time penalty in seconds"""
        if not buffer.current_color or buffer.current_occupancy == 0:
            return 0
        
        if buffer.current_color == new_color:
            return 0
        
        penalty = CHANGEOVER_PENALTIES["base"]
        
        # High-volume color penalty
        if (buffer.current_color in HIGH_VOLUME_COLORS or 
            new_color in HIGH_VOLUME_COLORS):
            penalty += CHANGEOVER_PENALTIES["high_volume"]
        
        # Large batch penalty
        if buffer.current_occupancy > 5:
            penalty += CHANGEOVER_PENALTIES["large_batch"]
        
        return penalty
    
    def find_best_buffer(self, color: str, oven: str) -> Optional[Tuple[str, int]]:
        """
        Find optimal buffer for vehicle
        Returns: (buffer_id, changeover_penalty) or None
        """
        preferred_buffers = PREFERRED_BUFFERS.get(color, [])
        best_buffer = None
        min_penalty = float('inf')
        
        for buffer_id in preferred_buffers:
            buffer = self.buffers[buffer_id]
            
            # Skip unavailable or full buffers
            if not buffer.is_available or buffer.is_full():
                continue
            
            # Priority 1: Continue existing batch (same color, no changeover)
            if buffer.current_color == color and buffer.available_space() > 0:
                return (buffer_id, 0)
            
            # Priority 2: Empty buffer (no changeover)
            if buffer.current_occupancy == 0:
                return (buffer_id, 0)
            
            # Priority 3: Check cross-oven routing
            buffer_metadata = BUFFER_METADATA[buffer_id]
            if buffer_metadata["oven"] != oven:
                # O1 -> O2 buffers: only if O1 buffers are full
                if oven == "O1":
                    o1_has_space = any(
                        not self.buffers[b].is_full() 
                        for b in OVEN_PRIMARY_BUFFERS["O1"]
                    )
                    if o1_has_space:
                        continue  # Skip O2 buffer for now
            
            # Priority 4: Calculate penalty and pick best
            penalty = self.calculate_changeover_penalty(buffer, color)
            if penalty < min_penalty:
                min_penalty = penalty
                best_buffer = buffer_id
        
        return (best_buffer, min_penalty) if best_buffer else None
    
    def assign_vehicle_to_buffer(self, vehicle: Dict) -> Dict:
        """
        Main scheduling algorithm - assign vehicle to buffer
        """
        car_id = vehicle['car_id']
        color = vehicle['color']
        
        # Step 1: Determine oven
        oven = self.assign_oven(color)
        vehicle['oven'] = oven
        
        # Step 2: Find best buffer
        result = self.find_best_buffer(color, oven)
        
        if result is None:
            # CRITICAL: All buffers full
            self.metrics.buffer_overflow_events += 1
            logger.warning(f"🚨 BUFFER OVERFLOW: Vehicle {car_id} ({color}) - No buffer available")
            return {
                'success': False,
                'car_id': car_id,
                'color': color,
                'error': 'ALL BUFFERS FULL - PRODUCTION HALT'
            }
        
        buffer_id, changeover_penalty = result
        buffer = self.buffers[buffer_id]
        
        # Step 3: Track changeover
        if changeover_penalty > 0:
            self.metrics.total_changeovers += 1
            
            # Track O2 stoppage if O1 routes to O2 buffers
            if oven == "O1" and buffer_id in OVEN_PRIMARY_BUFFERS["O2"]:
                self.metrics.o2_stoppage_events += 1
                logger.warning(f"⚠️ O1 -> {buffer_id} (O2 zone): Stoppage event")
        
        # Step 4: Assign batch ID
        if buffer.current_color != color or buffer.current_occupancy == 0:
            self.batch_counter[color] += 1
        
        batch_id = f"B-{color}-{self.batch_counter[color]:03d}"
        
        # Step 5: Update buffer state
        buffer.vehicles.append(car_id)
        buffer.current_occupancy += 1
        buffer.color_counts[color] = buffer.color_counts.get(color, 0) + 1
        buffer.last_color = buffer.current_color
        buffer.current_color = color
        
        # Step 6: Update vehicle
        vehicle['buffer'] = buffer_id
        vehicle['status'] = VehicleStatus.IN_BUFFER.value
        vehicle['batch_id'] = batch_id
        self.vehicles_by_id[car_id] = vehicle
        
        self.metrics.vehicles_processed += 1
        
        return {
            'success': True,
            'car_id': car_id,
            'color': color,
            'oven': oven,
            'buffer': buffer_id,
            'batch_id': batch_id,
            'changeover_penalty': changeover_penalty,
            'buffer_occupancy': buffer.current_occupancy,
            'buffer_capacity': buffer.capacity,
            'occupancy_percent': buffer.occupancy_percentage()
        }
    
    def best_continuous_run(self, buffer_id: str) -> Tuple[Optional[str], int]:
        """
        Find longest continuous same-color run at front of buffer
        Returns: (color, run_length)
        """
        buffer = self.buffers[buffer_id]
        if not buffer.vehicles:
            return (None, 0)
        
        first_car = buffer.vehicles[0]
        first_color = self.vehicles_by_id[first_car]['color']
        run_length = 1
        
        for car_id in buffer.vehicles[1:]:
            if self.vehicles_by_id[car_id]['color'] == first_color:
                run_length += 1
            else:
                break
        
        return (first_color, run_length)
    
    def pick_from_conveyor(self) -> List[int]:
        """
        Main conveyor picks vehicles from buffer with longest same-color run
        Returns: List of picked car_ids
        """
        best_buffer_id = None
        best_run_length = 0
        best_color = None
        
        # Find buffer with longest continuous run
        for buffer_id in self.buffers.keys():
            color, run_length = self.best_continuous_run(buffer_id)
            
            if run_length > best_run_length:
                best_run_length = run_length
                best_buffer_id = buffer_id
                best_color = color
            elif run_length == best_run_length and run_length > 0:
                # Tie-breaker: prefer same color as last painted
                if color == self.metrics.last_painted_color:
                    best_buffer_id = buffer_id
                    best_color = color
        
        if not best_buffer_id or best_run_length == 0:
            return []
        
        # Pick vehicles
        pick_count = min(best_run_length, settings.MAX_CONVEYOR_PICK)
        buffer = self.buffers[best_buffer_id]
        picked_cars = []
        
        for _ in range(pick_count):
            if buffer.vehicles:
                car_id = buffer.vehicles.pop(0)
                picked_cars.append(car_id)
                
                # Update buffer state
                buffer.current_occupancy -= 1
                vehicle = self.vehicles_by_id[car_id]
                color = vehicle['color']
                buffer.color_counts[color] = max(0, buffer.color_counts.get(color, 0) - 1)
                
                # Update vehicle status
                vehicle['status'] = VehicleStatus.PAINTED.value
        
        # Update buffer color
        if buffer.current_occupancy == 0:
            buffer.current_color = None
        
        # Track changeover
        if self.metrics.last_painted_color and best_color != self.metrics.last_painted_color:
            self.metrics.total_changeovers += 1
        
        self.metrics.last_painted_color = best_color
        self.metrics.throughput += len(picked_cars)
        
        return picked_cars
    
    def get_metrics_dict(self) -> Dict:
        """Export metrics as dictionary"""
        # Calculate zone occupancy
        o1_occupancy = sum(
            self.buffers[b].current_occupancy 
            for b in OVEN_PRIMARY_BUFFERS["O1"]
        )
        o2_occupancy = sum(
            self.buffers[b].current_occupancy 
            for b in OVEN_PRIMARY_BUFFERS["O2"]
        )
        
        self.metrics.oven1_occupancy = o1_occupancy
        self.metrics.oven2_occupancy = o2_occupancy
        
        # Calculate efficiency
        changeover_time = self.metrics.total_changeovers * CHANGEOVER_PENALTIES["base"]
        stoppage_time = self.metrics.o2_stoppage_events * 120
        total_lost = changeover_time + stoppage_time
        
        # 8-hour shift = 28800 seconds
        self.metrics.efficiency_percent = max(0, 100 - (total_lost / 28800 * 100))
        self.metrics.total_lost_time_seconds = total_lost
        
        return self.metrics.dict()

# Singleton instance
scheduler = PaintShopScheduler()