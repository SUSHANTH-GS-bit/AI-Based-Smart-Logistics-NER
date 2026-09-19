"""
Route & Risk Integration Service for SIH26002 - NER Smart Logistics Platform.

This service acts as the central integration bridge between:
1. GIS Service -> Road network navigation, distances, coordinates, and alternatives.
2. ML Risk Service -> Landslide and disruption risk intelligence.

Pipeline Architecture:
Frontend Request -> FastAPI -> GIS Routing -> ML Risk Intelligence -> Unified Evaluated Routes
"""
from typing import Dict, Any, List

try:
    from backend.gis_service import gis_service
    from backend.ml_service import ml_service
except ModuleNotFoundError:
    from gis_service import gis_service
    from ml_service import ml_service


class RouteRiskIntegrationService:
    """
    Coordinates and fuses GIS route paths with ML risk assessments.
    """

    def __init__(self):
        self.gis = gis_service
        self.ml = ml_service

    def evaluate_route_risk(
        self,
        source_latitude: float,
        source_longitude: float,
        destination_latitude: float,
        destination_longitude: float
    ) -> Dict[str, Any]:
        """
        Fuses GIS route data with ML risk predictions.
        If either service is not connected yet, returns SERVICES_NOT_CONNECTED.
        """
        # 1. Check if both external teammate services are connected
        if not self.gis.is_connected or not self.ml.is_model_loaded:
            return {
                "status": "SERVICES_NOT_CONNECTED",
                "gis_status": "CONNECTED" if self.gis.is_connected else "NOT_CONNECTED",
                "ml_status": "CONNECTED" if self.ml.is_model_loaded else "NOT_CONNECTED",
                "routes": []
            }

        # -------------------------------------------------------------
        # 2. Integration Pipeline (When both services are plugged in)
        # -------------------------------------------------------------
        # Step A: Query GIS routing for available paths
        gis_result = self.gis.find_routes(
            source_latitude=source_latitude,
            source_longitude=source_longitude,
            destination_latitude=destination_latitude,
            destination_longitude=destination_longitude
        )
        raw_routes = gis_result.get("routes", [])

        # Step B: Evaluate ML risk for each route candidate
        evaluated_routes = []
        for route in raw_routes:
            # Expected route fields from GIS teammate:
            # - route_id: str
            # - distance_km: float
            # - estimated_time_hours: float
            # - coordinates: list of [lat, lng]
            #
            # Example ML evaluation:
            # risk_result = self.ml.predict_risk(...)
            # evaluated_routes.append({
            #     "route_id": route.get("route_id"),
            #     "distance_km": route.get("distance_km"),
            #     "estimated_time_hours": route.get("estimated_time_hours"),
            #     "coordinates": route.get("coordinates", []),
            #     "risk_score": risk_result.get("risk_score"),
            #     "risk_level": risk_result.get("risk_level")
            # })
            pass

        return {
            "status": "SUCCESS",
            "gis_status": "CONNECTED",
            "ml_status": "CONNECTED",
            "routes": evaluated_routes
        }


# Global singleton instance
integration_service = RouteRiskIntegrationService()
