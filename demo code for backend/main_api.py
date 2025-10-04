# main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
from config import settings
from services.scheduler import scheduler
from services.simulation_engine import simulation
from services.firestore_service import firestore_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Smart Paint Shop Sequencing System",
    description="Real-time vehicle sequencing optimizer with Firebase integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class SeedRequest(BaseModel):
    num_vehicles: Optional[int] = 900

class BufferMaintenanceRequest(BaseModel):
    buffer_id: str
    is_available: bool

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "service": "Smart Paint Shop Sequencing",
        "version": "1.0.0",
        "simulation_running": simulation.running
    }

@app.post("/api/seed")
async def seed_data(request: SeedRequest):
    """Seed initial vehicle data to Firestore"""
    try:
        success = await simulation.seed_data(request.num_vehicles)
        if success:
            return {
                "success": True,
                "message": f"Successfully seeded {request.num_vehicles} vehicles",
                "num_vehicles": request.num_vehicles
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to seed data")
    except Exception as e:
        logger.error(f"Seed error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulation/start")
async def start_simulation(background_tasks: BackgroundTasks):
    """Start the simulation"""
    try:
        if simulation.running:
            return {"status": "already_running", "tick": simulation.tick}
        
        background_tasks.add_task(simulation.start)
        return {
            "success": True,
            "message": "Simulation started",
            "status": "running"
        }
    except Exception as e:
        logger.error(f"Start simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop the simulation"""
    try:
        result = await simulation.stop()
        return {
            "success": True,
            "message": "Simulation stopped",
            **result
        }
    except Exception as e:
        logger.error(f"Stop simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulation/reset")
async def reset_simulation():
    """Reset the simulation"""
    try:
        result = await simulation.reset()
        return {
            "success": True,
            "message": "Simulation reset complete",
            **result
        }
    except Exception as e:
        logger.error(f"Reset simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics")
async def get_metrics():
    """Get current system metrics"""
    try:
        metrics = scheduler.get_metrics_dict()
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        logger.error(f"Metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/buffers")
async def get_buffer_states():
    """Get all buffer states"""
    try:
        buffer_states = {
            buffer_id: buffer.dict()
            for buffer_id, buffer in scheduler.buffers.items()
        }
        return {
            "success": True,
            "data": buffer_states
        }
    except Exception as e:
        logger.error(f"Buffer states error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/buffers/{buffer_id}")
async def get_buffer_state(buffer_id: str):
    """Get specific buffer state"""
    try:
        if buffer_id not in scheduler.buffers:
            raise HTTPException(status_code=404, detail="Buffer not found")
        
        buffer = scheduler.buffers[buffer_id]
        return {
            "success": True,
            "data": buffer.dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Buffer state error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/buffers/maintenance")
async def set_buffer_maintenance(request: BufferMaintenanceRequest):
    """Set buffer maintenance mode"""
    try:
        if request.buffer_id not in scheduler.buffers:
            raise HTTPException(status_code=404, detail="Buffer not found")
        
        buffer = scheduler.buffers[request.buffer_id]
        buffer.is_available = request.is_available
        
        # Update Firestore
        firestore_service.update_buffer_state(request.buffer_id, buffer.dict())
        
        status = "available" if request.is_available else "maintenance"
        return {
            "success": True,
            "message": f"Buffer {request.buffer_id} set to {status}",
            "buffer_id": request.buffer_id,
            "is_available": request.is_available
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Buffer maintenance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/simulation/status")
async def get_simulation_status():
    """Get simulation status"""
    return {
        "running": simulation.running,
        "tick": simulation.tick,
        "vehicles_processed": scheduler.metrics.vehicles_processed,
        "throughput": scheduler.metrics.throughput,
        "changeovers": scheduler.metrics.total_changeovers,
        "efficiency": scheduler.metrics.efficiency_percent
    }

@app.get("/api/report")
async def get_detailed_report():
    """Get comprehensive system report"""
    try:
        metrics = scheduler.get_metrics_dict()
        
        # Color distribution analysis
        color_distribution = {}
        for car_id, vehicle in scheduler.vehicles_by_id.items():
            color = vehicle['color']
            buffer = vehicle.get('buffer')
            if color not in color_distribution:
                color_distribution[color] = {}
            if buffer:
                color_distribution[color][buffer] = color_distribution[color].get(buffer, 0) + 1
        
        # Changeover analysis by buffer
        changeover_by_buffer = {}
        for buffer_id, buffer in scheduler.buffers.items():
            if buffer.last_color and buffer.current_color:
                if buffer.last_color != buffer.current_color:
                    changeover_by_buffer[buffer_id] = changeover_by_buffer.get(buffer_id, 0) + 1
        
        return {
            "success": True,
            "data": {
                "summary": metrics,
                "color_distribution": color_distribution,
                "changeover_by_buffer": changeover_by_buffer,
                "strategy": {
                    "name": "Dynamic Color-Volume Based Allocation",
                    "oven1_colors": ["C1", "C2", "C3"],
                    "oven2_colors": ["C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12"],
                    "separation_maintained": scheduler.metrics.o2_stoppage_events == 0
                }
            }
        }
    except Exception as e:
        logger.error(f"Report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Smart Paint Shop Sequencing API")
    logger.info(f"Firebase Project: {settings.FIREBASE_PROJECT_ID}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    if simulation.running:
        await simulation.stop()
    logger.info("API shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG_MODE
    )