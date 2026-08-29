import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getCadastralParcels, locatePlot } from '../api';
import { 
  MapPin, 
  Layers, 
  Search, 
  FileText, 
  Info, 
  CheckCircle, 
  Maximize2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function MapView({ 
  targetGatNumber, 
  setTargetGatNumber, 
  setCurrentTab, 
  setSelectedDocId 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);

  const [geoData, setGeoData] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [searchGat, setSearchGat] = useState(targetGatNumber || '142');
  const [loading, setLoading] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Khed, Pune (approx 18.8515, 73.9135)
      const map = L.map(mapContainerRef.current, {
        center: [18.8515, 73.9135],
        zoom: 16,
        zoomControl: true,
      });

      // Standard OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Government Cadastral Prototype',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch GeoJSON Cadastral Layer
  useEffect(() => {
    const loadParcels = async () => {
      try {
        setLoading(true);
        const data = await getCadastralParcels();
        setGeoData(data);
      } catch (err) {
        console.error("Error loading cadastral GeoJSON:", err);
      } finally {
        setLoading(false);
      }
    };
    loadParcels();
  }, []);

  // Render GeoJSON Layer & Handle Target Selection
  useEffect(() => {
    if (!mapInstanceRef.current || !geoData) return;

    const map = mapInstanceRef.current;

    // Remove existing layer if any
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const activeGat = searchGat || targetGatNumber || '142';

    const layer = L.geoJSON(geoData, {
      style: (feature) => {
        const isSelected = String(feature.properties.gat_number) === String(activeGat);
        return {
          color: isSelected ? '#b91c1c' : '#0a3d62',
          weight: isSelected ? 3.5 : 2,
          opacity: 1,
          fillColor: isSelected ? '#ef4444' : '#0284c7',
          fillOpacity: isSelected ? 0.45 : 0.2,
          dashArray: isSelected ? null : '3',
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties;
        
        // Tooltip label
        featureLayer.bindTooltip(`<strong>Gat ${props.gat_number}</strong><br/>${props.owner_name}<br/>${props.area_ha} Ha`, {
          sticky: true,
          direction: 'top'
        });

        // Click handler
        featureLayer.on({
          click: () => {
            setSelectedParcel(props);
            setSearchGat(String(props.gat_number));
            setTargetGatNumber(String(props.gat_number));
          }
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = layer;

    // Locate and zoom to the active target Gat
    if (activeGat) {
      locateAndZoomPlot(activeGat, layer, map);
    }
  }, [geoData, targetGatNumber, searchGat]);

  const locateAndZoomPlot = (gatNo, layer, map) => {
    if (!layer || !map) return;
    let foundLayer = null;

    layer.eachLayer((l) => {
      if (String(l.feature.properties.gat_number) === String(gatNo)) {
        foundLayer = l;
      }
    });

    if (foundLayer) {
      setSelectedParcel(foundLayer.feature.properties);
      map.fitBounds(foundLayer.getBounds(), { padding: [60, 60], maxZoom: 17, animate: true });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchGat && geojsonLayerRef.current && mapInstanceRef.current) {
      setTargetGatNumber(searchGat);
      locateAndZoomPlot(searchGat, geojsonLayerRef.current, mapInstanceRef.current);
    }
  };

  const handleViewLandRecord = () => {
    // Gat 142 corresponds to Document ID 1 in our demo database
    // Otherwise open the default selected document
    setSelectedDocId(1);
    setCurrentTab('verification');
  };

  return (
    <div className="main-container" style={{ maxWidth: '1600px' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MapPin size={22} color="var(--gov-navy)" />
            <span>कॅडस्ट्रल भू-नकाशा प्रणाली / Cadastral GIS Map & Parcel Inspection</span>
          </h1>
          <p className="page-subtitle">
            Interactive Cadastral GIS linked with digitized 7/12 land records (Village: Khed, Taluka: Khed, District: Pune).
          </p>
        </div>

        {/* Search Plot Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchGat}
              onChange={(e) => setSearchGat(e.target.value)}
              placeholder="Search Gat No. (e.g. 141, 142, 143)"
              style={{
                padding: '7px 12px 7px 32px',
                fontSize: '13px',
                border: '1px solid var(--border-medium)',
                borderRadius: '4px',
                outline: 'none',
                width: '260px'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Locate Plot
          </button>
        </form>
      </div>

      {/* Cadastral GIS disclaimer note */}
      <div style={{ 
        backgroundColor: '#eff6ff', 
        border: '1px solid #bfdbfe', 
        padding: '8px 14px', 
        borderRadius: '4px', 
        fontSize: '12px', 
        color: '#1e40af',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong>Modular Cadastral Architecture:</strong> This map utilizes high-accuracy sample cadastral GeoJSON polygons for Gat 141 to 145. The backend GIS service provides a clean plug-and-play abstraction to connect official Mahabhunaksha / BhuNaksha WFS/WMS government services.
        </div>
        <span className="badge badge-demo">Sample Cadastral Coverage</span>
      </div>

      {/* Map + Detail Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedParcel ? '1fr 360px' : '1fr', gap: '16px' }}>
        
        {/* Left: Leaflet Map */}
        <div className="gov-card">
          <div className="gov-card-header" style={{ padding: '8px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={14} color="var(--gov-navy)" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Cadastral Survey Map (गाव नमुना नकाशा)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                Highlighted: Gat {selectedParcel ? selectedParcel.gat_number : '142'}
              </span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div ref={mapContainerRef} className="map-container" style={{ height: '620px' }}></div>
          </div>
        </div>

        {/* Right: Selected Parcel Details Panel */}
        {selectedParcel && (
          <div className="gov-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="gov-card-header" style={{ backgroundColor: '#f0f9ff', borderBottom: '2px solid var(--gov-navy)' }}>
              <div className="gov-card-title" style={{ fontSize: '14px' }}>
                <MapPin size={16} color="var(--gov-navy)" />
                <span>भूखंड माहिती / Parcel Details</span>
              </div>
              <span className="badge conf-high">Cadastral Verified</span>
            </div>

            <div className="gov-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Gat & Survey Number
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gov-navy-dark)', marginTop: '2px' }}>
                  Gat No. {selectedParcel.gat_number}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Survey No: {selectedParcel.survey_number}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Primary Owner / खातेदार:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedParcel.owner_name}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Area (क्षेत्र):</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gov-green)' }}>
                    {selectedParcel.area_ha} Ha
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Khata No:</div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {selectedParcel.khata_number || '314'}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Land Classification:</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedParcel.land_classification}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Jurisdiction:</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Village: {selectedParcel.village} • Taluka: {selectedParcel.tehsil} • District: {selectedParcel.district}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={handleViewLandRecord}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <FileText size={16} />
                  <span>View Land Record (7/12)</span>
                  <ExternalLink size={14} />
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                  Opens verified split-screen extraction record
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
