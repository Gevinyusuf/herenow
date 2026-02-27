'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { LocationCoordinates } from './LocationMap';

interface MapPreviewProps {
  location: string;
  locationCoordinates?: LocationCoordinates;
}

export function MapPreview({
  location,
  locationCoordinates,
}: MapPreviewProps) {
  const [placesReady, setPlacesReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Google Maps script loader
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setPlacesReady(false);
      return;
    }
    
    // Check if already loaded
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
        setPlacesReady(true);
      } else {
        const checkInterval = setInterval(() => {
          if ((window as any).google?.maps?.places) {
            setPlacesReady(true);
            clearInterval(checkInterval);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 10000);
      }
      return;
    }

    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setPlacesReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).google?.maps?.places) {
          setPlacesReady(true);
        }
      }, 100);
    };
    
    document.head.appendChild(script);
  }, []);

  // Remove postal code from address
  const removePostalCode = (address: string): string => {
    if (!address) return address;
    return address
      .replace(/\b\d{5,6}(-\d{4})?\b/g, '')
      .replace(/邮编\s*\d{5,6}/gi, '')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Extract location name from address components
  const extractLocationName = (addressComponents: any[]): string => {
    if (!addressComponents || addressComponents.length === 0) return '';
    
    const components: string[] = [];
    
    for (const component of addressComponents) {
      const types = component.types || [];
      
      if (types.includes('route')) {
        components.push(component.long_name);
      } else if (types.includes('neighborhood') || types.includes('sublocality')) {
        components.push(component.long_name);
      } else if (types.includes('locality')) {
        components.push(component.long_name);
      } else if (types.includes('administrative_area_level_1')) {
        components.push(component.long_name);
      } else if (types.includes('country') && components.length === 0) {
        components.push(component.long_name);
      }
    }
    
    return components.slice(0, 3).join(', ') || '';
  };

  // Initialize map
  const initializeMap = () => {
    console.log('🗺️ Initialize map:', {
      placesReady,
      hasMapRef: !!mapRef.current,
      hasLocationCoordinates: !!locationCoordinates,
      hasGoogleMaps: typeof window !== 'undefined' && !!(window as any).google?.maps
    });
    
    if (!placesReady || typeof window === 'undefined' || !mapRef.current) {
      console.warn('⚠️ 地图初始化条件不满足');
      return;
    }
    
    const g = (window as any).google;
    if (!g?.maps) {
      console.warn('⚠️ Google Maps API 未加载');
      return;
    }

    if (!locationCoordinates) {
      console.warn('⚠️ 没有位置坐标');
      return;
    }

    const coordinates = locationCoordinates;
    console.log('📍 使用坐标:', coordinates);
    
    let map: any;
    try {
      map = new g.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: coordinates.placeId ? 15 : 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      googleMapRef.current = map;
      console.log('✅ 地图初始化成功');
    } catch (error) {
      console.error('❌ 地图初始化失败:', error);
      return;
    }

    // Ensure map is created
    if (!map) {
      console.error('❌ Map instance creation failed');
      return;
    }

    // Create info window
    const infoWindow = new g.maps.InfoWindow({
      content: `<div class="p-2"><strong>${location || 'Event Location'}</strong><br/><small>Event location</small></div>`
    });

    // Add marker (not draggable)
    const marker = new g.maps.Marker({
      position: { lat: coordinates.lat, lng: coordinates.lng },
      map: map,
      animation: g.maps.Animation.DROP,
      title: location || 'Event Location',
      draggable: false,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new g.maps.Size(32, 32)
      }
    });
    markerRef.current = marker;

    // Click marker to show info window
    marker.addListener('click', () => {
      const currentMap = googleMapRef.current || map;
      if (currentMap) {
        infoWindow.open(currentMap, marker);
      }
    });
  };

  // Update map marker
  const updateMapMarker = (coordinates: LocationCoordinates) => {
    console.log('📍 Update map marker:', coordinates);
    
    if (!googleMapRef.current) {
      console.warn('⚠️ Map instance does not exist, reinitializing');
      // If map doesn't exist, reinitialize
      if (placesReady && locationCoordinates) {
        initializeMap();
      }
      return;
    }
    
    const g = (window as any).google;
    if (!g?.maps) {
      console.warn('⚠️ Google Maps API 未加载');
      return;
    }
    
    const position = { lat: coordinates.lat, lng: coordinates.lng };
    console.log('📍 新位置:', position);
    
    // Update map center
    googleMapRef.current.setCenter(position);
    googleMapRef.current.setZoom(coordinates.placeId ? 15 : 10);
    
    // If marker exists, update position; otherwise create new marker
    if (markerRef.current) {
      console.log('🔄 Update existing marker position');
      markerRef.current.setPosition(position);
      markerRef.current.setDraggable(false);
    } else {
      console.log('🆕 Create new marker');
      // Create new marker (not draggable)
      const marker = new g.maps.Marker({
        position: position,
        map: googleMapRef.current,
        animation: g.maps.Animation.DROP,
        title: location || 'Event Location',
        draggable: false,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new g.maps.Size(32, 32)
        }
      });
      
      markerRef.current = marker;
      
      // Create info window
      const infoWindow = new g.maps.InfoWindow({
        content: `<div class="p-2"><strong>${location || 'Event Location'}</strong><br/><small>Event location</small></div>`
      });
      
      // Click marker to show info window
      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });
    }
  };

  // Update map when location coordinates change
  useEffect(() => {
    if (locationCoordinates) {
      console.log('📍 Location coordinates changed, update map:', {
        hasMapInstance: !!googleMapRef.current,
        hasMarker: !!markerRef.current,
        coordinates: locationCoordinates
      });
      
      if (googleMapRef.current) {
        // Map exists, update marker
        updateMapMarker(locationCoordinates);
      } else if (placesReady) {
        // Map doesn't exist but API is ready, initialize map
        console.log('🆕 Map does not exist, initialize new map');
        initializeMap();
      }
    }
  }, [locationCoordinates, placesReady]);

  // Initialize map when coordinates exist and API is ready
  useEffect(() => {
    console.log('🔄 Map initialization check:', {
      placesReady,
      hasLocationCoordinates: !!locationCoordinates,
      hasMapInstance: !!googleMapRef.current,
      hasMarker: !!markerRef.current
    });

    if (placesReady && locationCoordinates) {
      // If map already exists, update it; otherwise initialize new map
      if (googleMapRef.current) {
        console.log('🔄 Map exists, update position and marker');
        updateMapMarker(locationCoordinates);
      } else {
        console.log('🆕 Initialize new map');
        // Wait for DOM rendering to complete
        const timer = setTimeout(() => {
          if (mapRef.current && mapRef.current.offsetHeight > 0) {
            initializeMap();
          } else {
            console.warn('⚠️ Map container not yet rendered, delay initialization');
            // If container hasn't rendered yet, wait a bit more
            const retryTimer = setTimeout(() => {
              if (mapRef.current) {
                initializeMap();
              }
            }, 200);
            return () => clearTimeout(retryTimer);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [placesReady, locationCoordinates]);

  // If no coordinates or location is empty, don't display map
  if (!locationCoordinates || !location || !location.trim()) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="relative w-full" style={{ height: '300px', minHeight: '300px' }}>
        <div 
          ref={mapRef}
          className="w-full h-full bg-slate-100"
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
        {!placesReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">Loading map...</div>
              <div className="text-xs text-slate-400">Initializing Google Maps</div>
            </div>
          </div>
        )}
      </div>
      {locationCoordinates && (
        <div className="bg-white px-4 py-2.5 text-xs text-slate-600 border-t border-slate-100">
          {/* Main display text */}
          <div className="font-semibold text-slate-800 mb-1">
            {locationCoordinates.displayText || location}
          </div>
          
          {/* Subtitle (if available) */}
          {locationCoordinates.subtitle && (
            <div className="text-[10px] text-slate-500 mb-1">
              {locationCoordinates.subtitle}
            </div>
          )}
          
          <div className="text-slate-500 space-y-0.5">
            {/* Coordinate information */}
            <div className="text-[10px]">Coordinates: {locationCoordinates.lat.toFixed(6)}, {locationCoordinates.lng.toFixed(6)}</div>
            
            {/* Detailed address information (US/EU format) */}
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

