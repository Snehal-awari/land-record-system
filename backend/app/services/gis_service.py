import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import settings

class CadastralGISProvider:
    """
    Abstract interface for Cadastral GIS integration.
    In this prototype, it reads sample cadastral GeoJSON.
    This can be substituted with Government WFS/WMS (e.g. Mahabhunaksha / BhuNaksha)
    without affecting the rest of the application.
    """
    def __init__(self, geojson_path: Optional[Path] = None):
        self.geojson_path = geojson_path or (settings.SAMPLE_DIR / "cadastral_parcels.geojson")
        self._data = None
        self._load_data()

    def _load_data(self):
        if self.geojson_path.exists():
            with open(self.geojson_path, "r", encoding="utf-8") as f:
                self._data = json.load(f)
        else:
            self._data = {"type": "FeatureCollection", "features": []}

    def get_cadastral_layer(self) -> Dict[str, Any]:
        """Returns the full GeoJSON FeatureCollection of cadastral parcels."""
        return self._data

    def find_plot(self, gat_or_survey: str, village: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Finds a cadastral parcel matching the specified Gat or Survey number.
        Normalizes inputs (e.g. '142', 'Gat 142', 'गट क्र. १४२').
        """
        cleaned_query = str(gat_or_survey).strip().lower().replace("gat", "").replace("गट", "").strip()
        
        for feature in self._data.get("features", []):
            props = feature.get("properties", {})
            f_gat = str(props.get("gat_number", "")).strip().lower()
            f_survey = str(props.get("survey_number", "")).strip().lower()
            
            if cleaned_query == f_gat or cleaned_query in f_survey or f_gat in cleaned_query:
                return feature
                
        return None

    def get_all_plots_summary(self) -> List[Dict[str, Any]]:
        """Returns summary list of all available cadastral parcels."""
        summaries = []
        for feature in self._data.get("features", []):
            props = feature.get("properties", {})
            summaries.append({
                "id": props.get("id"),
                "gat_number": props.get("gat_number"),
                "survey_number": props.get("survey_number"),
                "village": props.get("village"),
                "area_ha": props.get("area_ha"),
                "owner_name": props.get("owner_name"),
                "coordinates_centroid": self._calculate_centroid(feature.get("geometry", {}))
            })
        return summaries

    @staticmethod
    def _calculate_centroid(geometry: Dict[str, Any]) -> List[float]:
        """Calculates rough centroid for zooming."""
        try:
            coords = geometry.get("coordinates", [])[0]
            avg_lng = sum(pt[0] for pt in coords) / len(coords)
            avg_lat = sum(pt[1] for pt in coords) / len(coords)
            return [avg_lat, avg_lng]
        except Exception:
            return [18.8515, 73.9135]

gis_provider = CadastralGISProvider()
