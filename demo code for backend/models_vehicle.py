# models/vehicle.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class VehicleStatus(str, Enum):
    WAITING = "waiting"
    IN_OVEN = "in_oven"
    IN_BUFFER = "in_buffer"
    ON_CONVEYOR = "on_conveyor"
    PAINTED = "painted"

class Vehicle(BaseModel):
    car_id: int
    color: str
    oven: str  # O1 or O2
    buffer: Optional[str] = None
    status: VehicleStatus = VehicleStatus.WAITING
    batch_id: Optional[str] = None
    priority: int = Field(default=10)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    oven_entry_time: Optional[datetime] = None
    buffer_entry_time: Optional[datetime] = None
    painted_time: Optional[datetime] = None
    
    class Config:
        use_enum_values = True

class BufferState(BaseModel):
    buffer_id: str
    capacity: int
    current_occupancy: int = 0
    current_color: Optional[str] = None
    last_color: Optional[str] = None
    vehicles: list[int] = Field(default_factory=list)
    is_available: bool = True
    is_flex: bool = False
    primary_colors: list[str] = Field(default_factory=list)
    color_counts: dict[str, int] = Field(default_factory=dict)
    
    def available_space(self) -> int:
        return self.capacity - self.current_occupancy
    
    def is_full(self) -> bool:
        return self.current_occupancy >= self.capacity
    
    def occupancy_percentage(self) -> float:
        return (self.current_occupancy / self.capacity) * 100 if self.capacity > 0 else 0

class SystemMetrics(BaseModel):
    vehicles_processed: int = 0
    total_changeovers: int = 0
    o2_stoppage_events: int = 0
    overflow_events: int = 0
    buffer_overflow_events: int = 0
    throughput: int = 0
    jph: float = 0.0
    efficiency_percent: float = 100.0
    total_lost_time_seconds: int = 0
    
    # Real-time stats
    current_tick: int = 0
    simulation_running: bool = False
    last_painted_color: Optional[str] = None
    
    # Buffer states
    buffer_states: dict[str, BufferState] = Field(default_factory=dict)
    
    # Zone utilization
    oven1_occupancy: int = 0
    oven1_capacity: int = 56
    oven2_occupancy: int = 0
    oven2_capacity: int = 80