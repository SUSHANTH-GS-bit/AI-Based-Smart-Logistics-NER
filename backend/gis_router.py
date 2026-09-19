from typing import List, Any, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

try:
    from backend.gis_service import gis_service
    from backend.integration_service import integration_service
except ModuleNotFoundError:
    from gis_service import gis_service
    from integration_service import integration_service

# Create APIRouter for GIS routing and evaluation endpoints
router = APIRouter(tags=["GIS & Routing"])


# ----------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------
class RouteRequest(BaseModel):
    source_latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Origin GPS Latitude coordinate (-90 to 90)",
        example=24.817
    )
    source_longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Origin GPS Longitude coordinate (-180 to 180)",
        example=93.936
    )
    destination_latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Destination GPS Latitude coordinate (-90 to 90)",
        example=26.144
    )
    destination_longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Destination GPS Longitude coordinate (-180 to 180)",
        example=91.736
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "source_latitude": 24.817,
                "source_longitude": 93.936,
                "destination_latitude": 26.144,
                "destination_longitude": 91.736
            }
        }
    }


class RouteResponse(BaseModel):
    status: str = Field(..., example="GIS_NOT_CONNECTED")
    routes: List[Any] = Field(default_factory=list, example=[])


class RouteEvaluateResponse(BaseModel):
    status: str = Field(..., example="SERVICES_NOT_CONNECTED")
    gis_status: Optional[str] = Field(None, example="NOT_CONNECTED")
    ml_status: Optional[str] = Field(None, example="NOT_CONNECTED")
    routes: List[Any] = Field(default_factory=list, example=[])


# ----------------------------------------------------
# Endpoints
# ----------------------------------------------------
@router.post("/api/routes", response_model=RouteResponse, status_code=status.HTTP_200_OK)
def calculate_routes(request: RouteRequest):
    """
    Calculate primary and alternate routes between GPS locations.
    Connects to the GIS Service layer awaiting teammate's routing module.
    """
    return gis_service.find_routes(
        source_latitude=request.source_latitude,
        source_longitude=request.source_longitude,
        destination_latitude=request.destination_latitude,
        destination_longitude=request.destination_longitude
    )


@router.post("/api/routes/evaluate", response_model=RouteEvaluateResponse, status_code=status.HTTP_200_OK)
def evaluate_route(request: RouteRequest):
    """
    Evaluate routes by fusing GIS navigation paths with ML landslide risk intelligence.
    Integration pipeline: Frontend -> FastAPI -> GIS Service -> ML Service -> Unified Evaluated Routes.
    """
    return integration_service.evaluate_route_risk(
        source_latitude=request.source_latitude,
        source_longitude=request.source_longitude,
        destination_latitude=request.destination_latitude,
        destination_longitude=request.destination_longitude
    )
