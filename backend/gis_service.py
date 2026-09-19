"""
GIS Service Layer for SIH26002 - NER Smart Logistics Platform.

This module provides the service interface for GIS-based route calculation,
alternate routes, and road accessibility across North Eastern states.
When the GIS teammate completes their routing module (e.g., OSRM, GraphHopper,
pgRouting, or custom graph algorithm), it can be connected directly here
without changing any API contracts.
"""
from typing import Dict, Any, List, Optional


class GISRoutingService:
    """
    Interface service for GIS route calculation and navigation.
    """

    def __init__(self):
        # Placeholder for GIS teammate's routing engine instance
        self.router: Optional[Any] = None
        self.is_connected: bool = False

    def connect_engine(self, engine_instance: Any) -> bool:
        """
        Hook for the GIS teammate to register their routing engine.
        """
        self.router = engine_instance
        self.is_connected = True
        return True

    def find_routes(
        self,
        source_latitude: float,
        source_longitude: float,
        destination_latitude: float,
        destination_longitude: float
    ) -> Dict[str, Any]:
        """
        Calculates primary and alternate routes between source and destination.
        Returns GIS_NOT_CONNECTED status awaiting the GIS teammate's module.
        """
        if not self.is_connected or self.router is None:
            # GIS routing service is decoupled and awaiting teammate's engine
            return {
                "status": "GIS_NOT_CONNECTED",
                "routes": []
            }

        # NOTE FOR GIS TEAMMATE:
        # When your routing engine is connected, return calculated routes here:
        # routes = self.router.calculate_path(
        #     origin=(source_latitude, source_longitude),
        #     destination=(destination_latitude, destination_longitude)
        # )
        # return {"status": "SUCCESS", "routes": routes}
        return {
            "status": "GIS_NOT_CONNECTED",
            "routes": []
        }


# Singleton instance accessible across the application
gis_service = GISRoutingService()
