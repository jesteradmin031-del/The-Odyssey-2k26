import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, LocateFixed, Plus, Minus } from 'lucide-react';
import { places } from '../../shared/data.js';
const bounds = [
  [12.945, 77.565],
  [12.997, 77.632],
];
const latLng = (p) => [p[1], p[0]];
export default function MapView({
  origin,
  destination,
  routes,
  selected,
  category,
  onSelect,
  safety,
  progress,
  stepCoordinates,
  stop,
}) {
  const container = useRef(null),
    map = useRef(null),
    dynamic = useRef(null),
    tile = useRef(null);
  const [live, setLive] = useState(false),
    [tileError, setTileError] = useState(false);
  useEffect(() => {
    const m = L.map(container.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 11,
      maxZoom: 18,
    }).setView([12.976, 77.598], 15);
    map.current = m;
    L.imageOverlay('/demo-map.svg', bounds, {
      attribution: 'LocalRoute illustrative demo map · not surveyed geography',
    }).addTo(m);
    dynamic.current = L.layerGroup().addTo(m);
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      m.remove();
    };
  }, []);
  useEffect(() => {
    if (live) {
      setTileError(false);
      tile.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map.current);
      tile.current.on('tileerror', () => setTileError(true));
    } else if (tile.current) {
      map.current.removeLayer(tile.current);
      tile.current = null;
    }
  }, [live]);
  useEffect(() => {
    const layer = dynamic.current;
    layer.clearLayers();
    const visible = places.filter(
      (p) =>
        category === 'All' || p.category === category || (safety && p.category === 'Hospitals'),
    );
    visible.forEach((p) => {
      const el = document.createElement('button');
      el.className = `poi-label ${p.category === 'Parks' ? 'park-poi' : ''}`;
      el.textContent = `${p.emoji} ${p.name}`;
      el.title = `Plan a trip to ${p.name}`;
      el.onclick = () => onSelect(p);
      L.marker(latLng(p.coordinates), {
        icon: L.divIcon({
          html: el,
          className: 'poi-wrapper',
          iconSize: [160, 28],
          iconAnchor: [16, 14],
        }),
        keyboard: false,
      }).addTo(layer);
    });
    routes.forEach((r, i) => {
      L.polyline(r.coordinates.map(latLng), {
        color: i === selected ? '#ffffff' : '#adbac5',
        weight: i === selected ? 11 : 6,
        opacity: 0.9,
      }).addTo(layer);
      if (i === selected)
        L.polyline(r.coordinates.map(latLng), {
          color: '#16745a',
          weight: 6,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: r.source === 'demo' ? '12 8' : null,
        }).addTo(layer);
    });
    if (safety)
      places
        .filter((p) => p.category === 'Hospitals' || p.category === 'Transit')
        .forEach((p) =>
          L.circle(latLng(p.coordinates), {
            radius: 140,
            color: '#4d9c91',
            weight: 1,
            fillOpacity: 0.14,
          }).addTo(layer),
        );
    if (stop) {
      const stopLabel = document.createElement('span');
      stopLabel.textContent = stop.name;
      L.marker(latLng(stop.coordinates), {
        icon: L.divIcon({
          html: '<div class="route-pin stop-pin">S</div>',
          className: 'pin-wrapper',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        }),
      })
        .bindTooltip(stopLabel)
        .addTo(layer);
    }
    [origin, destination].forEach((p, i) => {
      if (p)
        L.marker(latLng(p.coordinates), {
          icon: L.divIcon({
            html: `<div class="route-pin ${i ? 'end-pin' : ''}">${i ? 'B' : 'A'}</div>`,
            className: 'pin-wrapper',
            iconSize: [32, 40],
            iconAnchor: [16, 40],
          }),
        }).addTo(layer);
    });
    if (progress !== null && routes[selected]) {
      const coords = routes[selected].coordinates;
      const point =
        stepCoordinates ||
        (routes[selected].source === 'demo'
          ? coords[Math.min(coords.length - 1, Math.floor(progress * (coords.length - 1)))]
          : null);
      if (point)
        L.circleMarker(latLng(point), {
          radius: 9,
          color: 'white',
          weight: 4,
          fillColor: '#224eec',
          fillOpacity: 1,
        }).addTo(layer);
    }
  }, [
    origin,
    destination,
    routes,
    selected,
    category,
    onSelect,
    safety,
    progress,
    stepCoordinates,
    stop,
  ]);
  useEffect(() => {
    if (origin && destination)
      map.current.fitBounds(
        [
          latLng(origin.coordinates),
          latLng(destination.coordinates),
          ...(stop ? [latLng(stop.coordinates)] : []),
        ],
        {
          padding: [90, 110],
          maxZoom: 15,
        },
      );
    else if (destination) map.current.panTo(latLng(destination.coordinates));
  }, [origin, destination, stop]);
  return (
    <div className="map-shell">
      <div ref={container} className="leaflet-map" aria-label="Interactive route map" />
      <div className="map-location">
        <span className="status-dot" /> {live ? 'OpenStreetMap' : 'Bengaluru, India'}{' '}
        <span className="muted">/</span>
        <span>{live ? 'Street map' : 'Demo neighborhood'}</span>
      </div>
      <div className="map-controls">
        <button aria-label="Zoom in" onClick={() => map.current.zoomIn()}>
          <Plus size={19} />
        </button>
        <button aria-label="Zoom out" onClick={() => map.current.zoomOut()}>
          <Minus size={19} />
        </button>
        <span />
        <button
          aria-label="Recenter map"
          onClick={() =>
            origin && destination
              ? map.current.fitBounds(
                  [latLng(origin.coordinates), latLng(destination.coordinates)],
                  { padding: [90, 110], maxZoom: 15 },
                )
              : map.current.setView([12.976, 77.598], 15)
          }
        >
          <LocateFixed size={19} />
        </button>
      </div>
      <button className="layer-toggle" onClick={() => setLive((v) => !v)}>
        <Layers size={17} />
        {live ? 'Use demo map' : 'Use street map'}
        <span>{live ? 'Online' : 'Offline ready'}</span>
      </button>
      {tileError && (
        <div className="tile-notice" role="status">
          Map tiles could not load. Switch back to the demo map.
        </div>
      )}
      <div className="map-disclaimer">
        {live ? 'Street tiles require internet.' : 'Illustrative map'}{' '}
        {routes[selected]?.source === 'demo' ? '· Dashed paths are simulated.' : ''}
      </div>
    </div>
  );
}
