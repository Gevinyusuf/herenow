'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { LocationCoordinates } from './LocationMap';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const customIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapUpdaterProps {
  center: [number, number];
  zoom: number;
}

function MapUpdater({ center, zoom }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

interface OpenStreetMapProps {
  location: string;
  locationCoordinates?: LocationCoordinates;
  height?: string;
  showDetails?: boolean;
}

export function OpenStreetMap({
  location,
  locationCoordinates,
  height = '300px',
  showDetails = true
}: OpenStreetMapProps) {
  const position: [number, number] = useMemo(() => {
    if (locationCoordinates) {
      return [locationCoordinates.lat, locationCoordinates.lng];
    }
    return [40.7128, -74.0060];
  }, [locationCoordinates]);

  const zoom = locationCoordinates?.placeId ? 15 : 10;

  if (!locationCoordinates || !location || !location.trim()) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div 
        style={{ height, minHeight: height }} 
        className="w-full"
      >
        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={position} zoom={zoom} />
          <Marker position={position} icon={customIcon}>
            <Popup>
              <div className="p-1">
                <strong>{location || 'Event Location'}</strong>
                <br />
                <small>Event location</small>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {showDetails && locationCoordinates && (
        <div className="bg-white px-4 py-2.5 text-xs text-slate-600 border-t border-slate-100">
          <div className="font-semibold text-slate-800 mb-1">
            {locationCoordinates.displayText || location}
          </div>
          
          {locationCoordinates.subtitle && (
            <div className="text-[10px] text-slate-500 mb-1">
              {locationCoordinates.subtitle}
            </div>
          )}
          
          <div className="text-slate-500 space-y-0.5">
            <div className="text-[10px]">
              Coordinates: {locationCoordinates.lat.toFixed(6)}, {locationCoordinates.lng.toFixed(6)}
            </div>
            
            {locationCoordinates.venueName && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                Venue: {locationCoordinates.venueName}
              </div>
            )}
            {locationCoordinates.streetAddress && (
              <div className="text-[10px] text-slate-400">
                Address: {locationCoordinates.streetAddress}
                {locationCoordinates.city && `, ${locationCoordinates.city}`}
                {locationCoordinates.state && `, ${locationCoordinates.state}`}
              </div>
            )}
            {locationCoordinates.postalCode && (
              <div className="text-[10px] text-slate-400">
                Postal Code: {locationCoordinates.postalCode}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
