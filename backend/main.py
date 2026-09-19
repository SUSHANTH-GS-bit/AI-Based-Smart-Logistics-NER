import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Ensure SIH26002 project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Database connection, models, ML service, and GIS router imports
try:
    from backend.database import get_db, check_db_connection, init_db
    from backend import models
    from backend.ml_service import ml_service
    from backend.gis_router import router as gis_router
    from backend.sync_router import router as sync_router
except ModuleNotFoundError:
    from database import get_db, check_db_connection, init_db
    import models
    from ml_service import ml_service
    from gis_router import router as gis_router
    from sync_router import router as sync_router

# Helper to safely parse ISO timestamp strings or generate current UTC
def parse_timestamp(val: Optional[str]) -> datetime:
    if not val:
        return datetime.now(timezone.utc)
    try:
        clean_val = val.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_val)
    except Exception:
        return datetime.now(timezone.utc)

# Automatically create database tables if they do not exist
try:
    init_db()
except Exception as e:
    print(f"Database table initialization warning: {e}")

# Initialize the FastAPI application
app = FastAPI(
    title="SIH26002 - NER Smart Logistics Platform API",
    description="Backend API for AI-Based Smart Logistics and Accessibility Intelligence in North Eastern Region",
    version="0.1.0"
)

import os

# Configure CORS (Cross-Origin Resource Sharing)
# Configurable via environment variable for production readiness
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register APIRouters
app.include_router(gis_router)
app.include_router(sync_router)


# ----------------------------------------------------
# Pydantic Schemas for Request & Response Validation
# ----------------------------------------------------
class IncidentCreate(BaseModel):
    vehicle_id: str = Field(..., description="ID of the reporting vehicle or vendor", example="V001")
    latitude: float = Field(..., description="GPS Latitude coordinate", example=24.817)
    longitude: float = Field(..., description="GPS Longitude coordinate", example=93.936)
    incident_type: str = Field(..., description="Type of incident: LANDSLIDE, ROAD_BLOCK, ACCIDENT, etc.", example="LANDSLIDE")
    description: str = Field(..., description="Brief details about what happened", example="Road blocked")
    timestamp: Optional[str] = Field(None, description="ISO timestamp (optional; auto-generated if omitted)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "vehicle_id": "V001",
                "latitude": 24.817,
                "longitude": 93.936,
                "incident_type": "LANDSLIDE",
                "description": "Road blocked"
            }
        }
    }


class VehicleLocationUpdate(BaseModel):
    vehicle_id: str = Field(..., min_length=1, description="Unique ID of the vehicle carrying supplies", example="V001")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Current GPS Latitude coordinate (-90 to 90)", example=24.817)
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Current GPS Longitude coordinate (-180 to 180)", example=93.936)
    timestamp: Optional[str] = Field(None, description="ISO timestamp (optional; auto-generated if omitted)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "vehicle_id": "V001",
                "latitude": 24.817,
                "longitude": 93.936
            }
        }
    }


class RiskPredictionRequest(BaseModel):
    latitude: float = Field(..., description="GPS Latitude coordinate", example=24.817)
    longitude: float = Field(..., description="GPS Longitude coordinate", example=93.936)
    rainfall: float = Field(..., ge=0.0, description="Recent or forecast rainfall in mm", example=120.5)
    slope: float = Field(..., ge=0.0, le=90.0, description="Terrain slope angle in degrees (0-90)", example=35.2)
    landslide_history: int = Field(..., ge=0, description="Number of past recorded landslides in the area", example=3)

    model_config = {
        "json_schema_extra": {
            "example": {
                "latitude": 24.817,
                "longitude": 93.936,
                "rainfall": 120.5,
                "slope": 35.2,
                "landslide_history": 3
            }
        }
    }


class RiskPredictionResponse(BaseModel):
    risk_score: float = Field(..., example=0.0)
    risk_level: str = Field(..., example="LOW")
    model_status: str = Field(..., example="MODEL_NOT_CONNECTED")


# ----------------------------------------------------
# Health & Root Routes (Step 1)
# ----------------------------------------------------
@app.get("/")
def read_root():
    """
    Root endpoint to verify the API server is reachable.
    """
    return {
        "message": "Welcome to the SIH26002 NER Smart Logistics API",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }


@app.get("/api/health")
def health_check():
    """
    Health check endpoint to verify backend status.
    """
    return {
        "status": "healthy",
        "service": "sih26002-backend",
        "message": "Backend server is running smoothly"
    }


# ----------------------------------------------------
# Database Connectivity Check (Step 4)
# ----------------------------------------------------
@app.get("/api/db-test")
def test_database_connection():
    """
    Test PostgreSQL database connectivity.
    """
    result = check_db_connection()
    if result["status"] == "connected":
        return result
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=result
    )


# ----------------------------------------------------
# ML Risk Prediction Routes
# ----------------------------------------------------
@app.post("/api/risk/predict", response_model=RiskPredictionResponse, status_code=status.HTTP_200_OK)
def predict_risk(request: RiskPredictionRequest):
    """
    Predict road disruption and landslide risk based on geo-environmental parameters.
    Connects to the ML Service layer awaiting the ML teammate's trained model artifact.
    """
    return ml_service.predict_risk(
        latitude=request.latitude,
        longitude=request.longitude,
        rainfall=request.rainfall,
        slope=request.slope,
        landslide_history=request.landslide_history
    )


# ----------------------------------------------------
# Incident Reporting Routes (Step 2 & Step 5 PostgreSQL)
# ----------------------------------------------------
@app.post("/api/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    """
    Report a new road or landslide incident with GPS coordinates into PostgreSQL.
    """
    parsed_ts = parse_timestamp(incident.timestamp)
    db_incident = models.Incident(
        vehicle_id=incident.vehicle_id,
        latitude=incident.latitude,
        longitude=incident.longitude,
        incident_type=incident.incident_type,
        description=incident.description,
        timestamp=parsed_ts
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)

    return {
        "message": "Incident reported successfully",
        "incident": {
            "id": db_incident.id,
            "vehicle_id": db_incident.vehicle_id,
            "latitude": db_incident.latitude,
            "longitude": db_incident.longitude,
            "incident_type": db_incident.incident_type,
            "description": db_incident.description,
            "timestamp": db_incident.timestamp.isoformat()
        }
    }


@app.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    """
    Retrieve all reported incidents from PostgreSQL for GIS dashboard & routing.
    """
    incidents = db.query(models.Incident).order_by(models.Incident.id.asc()).all()
    formatted = [
        {
            "id": inc.id,
            "vehicle_id": inc.vehicle_id,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "incident_type": inc.incident_type,
            "description": inc.description,
            "timestamp": inc.timestamp.isoformat()
        }
        for inc in incidents
    ]
    return {
        "total": len(formatted),
        "incidents": formatted
    }


# ----------------------------------------------------
# Vehicle GPS Tracking Routes (Step 3 & Step 5 PostgreSQL)
# ----------------------------------------------------
@app.post("/api/vehicles/location", status_code=status.HTTP_200_OK)
def update_vehicle_location(update: VehicleLocationUpdate, db: Session = Depends(get_db)):
    """
    Record latest GPS location of a vehicle into PostgreSQL.
    Auto-registers the vehicle in the vehicles table if it doesn't exist yet.
    """
    # 1. Ensure the vehicle exists in the vehicles table
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == update.vehicle_id).first()
    if not vehicle:
        vehicle = models.Vehicle(vehicle_id=update.vehicle_id)
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)

    # 2. Insert the new GPS location point into vehicle_locations
    parsed_ts = parse_timestamp(update.timestamp)
    db_location = models.VehicleLocation(
        vehicle_id=update.vehicle_id,
        latitude=update.latitude,
        longitude=update.longitude,
        timestamp=parsed_ts
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)

    return {
        "message": "Vehicle location updated successfully",
        "location": {
            "vehicle_id": db_location.vehicle_id,
            "latitude": db_location.latitude,
            "longitude": db_location.longitude,
            "timestamp": db_location.timestamp.isoformat()
        }
    }


@app.get("/api/vehicles")
def get_vehicles(db: Session = Depends(get_db)):
    """
    Retrieve all currently tracked vehicles and their latest GPS locations from PostgreSQL.
    """
    vehicles = db.query(models.Vehicle).all()
    tracked = []
    for v in vehicles:
        latest_loc = (
            db.query(models.VehicleLocation)
            .filter(models.VehicleLocation.vehicle_id == v.vehicle_id)
            .order_by(models.VehicleLocation.timestamp.desc())
            .first()
        )
        if latest_loc:
            tracked.append({
                "vehicle_id": v.vehicle_id,
                "latitude": latest_loc.latitude,
                "longitude": latest_loc.longitude,
                "timestamp": latest_loc.timestamp.isoformat()
            })
    return {
        "total": len(tracked),
        "vehicles": tracked
    }


@app.get("/api/vehicles/{vehicle_id}/location")
def get_vehicle_location(vehicle_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the latest GPS location of a specific vehicle from PostgreSQL.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found or has not reported any location yet"
        )
    latest_loc = (
        db.query(models.VehicleLocation)
        .filter(models.VehicleLocation.vehicle_id == vehicle_id)
        .order_by(models.VehicleLocation.timestamp.desc())
        .first()
    )
    if not latest_loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found or has not reported any location yet"
        )
    return {
        "vehicle_id": vehicle_id,
        "location": {
            "vehicle_id": vehicle_id,
            "latitude": latest_loc.latitude,
            "longitude": latest_loc.longitude,
            "timestamp": latest_loc.timestamp.isoformat()
        }
    }


@app.get("/api/vehicles/{vehicle_id}/locations")
def get_vehicle_location_history(vehicle_id: str, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve full historical GPS trail for a specific vehicle from PostgreSQL.
    Enables plotting the route breadcrumbs and movement history on the GIS dashboard.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found or has not reported any location yet"
        )
    history = (
        db.query(models.VehicleLocation)
        .filter(models.VehicleLocation.vehicle_id == vehicle_id)
        .order_by(models.VehicleLocation.timestamp.asc())
        .limit(limit)
        .all()
    )
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' has not reported any location yet"
        )
    formatted = [
        {
            "id": loc.id,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "timestamp": loc.timestamp.isoformat()
        }
        for loc in history
    ]
    return {
        "vehicle_id": vehicle_id,
        "total_records": len(formatted),
        "history": formatted
    }
