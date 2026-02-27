'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Video, Eye, EyeOff, Heart, X, RefreshCw } from 'lucide-react';
import { LOCATION_RESULTS } from './constants';
import { formatEventLocation, extractLocationKeyInfo } from './locationFormatter';
import { MapPreview } from './MapPreview';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  placeId?: string;
  formattedAddress?: string;        // Complete formatted address
  displayText?: string;              // Display text (formatted event address)
  subtitle?: string;                 // Subtitle (e.g., "New York, NY")
  venueName?: string;                // Venue name
  streetAddress?: string;            // Street address
  city?: string;                     // City
  state?: string;                    // State/Province (US/EU)
  country?: string;                  // Country
  postalCode?: string;               // Postal code
}

// Google Places API prediction type
interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface LocationMapProps {
  location: string;
  locationCoordinates?: LocationCoordinates;
  isVirtual: boolean;
  meetingLink?: string;
  isLocationPublic: boolean;
  savedLocations: string[];
  onLocationChange: (location: string) => void;
  onCoordinatesChange: (coordinates?: LocationCoordinates) => void;
  onVirtualChange: (isVirtual: boolean) => void;
  onMeetingLinkChange?: (meetingLink: string) => void;
  onLocationPublicChange: (isPublic: boolean) => void;
  onSaveLocation: (location: string) => void;
}

export function LocationMap({
  location,
  locationCoordinates,
  isVirtual,
  meetingLink = '',
  isLocationPublic,
  savedLocations,
  onLocationChange,
  onCoordinatesChange,
  onVirtualChange,
  onMeetingLinkChange,
  onLocationPublicChange,
  onSaveLocation,
}: LocationMapProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [placesReady, setPlacesReady] = useState(false);
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [saveLocationNotice, setSaveLocationNotice] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Google Maps script loader
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Detailed API key check
    console.log('🔍 Google Maps API Configuration Check:');
    console.log('  - API Key exists:', !!apiKey);
    console.log('  - API Key length:', apiKey ? apiKey.length : 0);
    console.log('  - API Key prefix:', apiKey ? (apiKey.startsWith('AIza') ? '✅ Correct format' : '⚠️ May not be a valid Google API Key') : 'N/A');
    
    if (!apiKey) {
      console.warn('⚠️ Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file');
      setMapError('Google Maps API key not configured');
      setPlacesReady(false);
      return;
    }
    
    // Validate API key format (Google API keys usually start with AIza)
    if (!apiKey.startsWith('AIza')) {
      console.warn('⚠️ API Key format may be incorrect. Google API keys usually start with "AIza"');
    }
    
    // Check if already loaded
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      // Check if Google object is available
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
        console.log('✅ Google Maps API already loaded');
        setPlacesReady(true);
        setMapError(null);
      } else {
        // Script exists but not loaded yet, wait for loading
        const checkInterval = setInterval(() => {
          if ((window as any).google?.maps?.places) {
            console.log('✅ Google Maps API loaded after wait');
            setPlacesReady(true);
            setMapError(null);
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!(window as any).google?.maps?.places) {
            console.error('❌ Google Maps API load timeout');
            setMapError('Google Maps API load timeout. Please refresh the page and try again.');
          }
        }, 10000);
      }
      return;
    }

    // Check if Google object already exists (may be loaded by other scripts)
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      console.log('✅ Google Maps API already available');
      setPlacesReady(true);
      setMapError(null);
      return;
    }

    console.log('🔄 Loading Google Maps API...');
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait a bit to ensure Google object is fully initialized
      setTimeout(() => {
        if ((window as any).google?.maps?.places) {
          console.log('✅ Google Maps API loaded successfully');
          setPlacesReady(true);
          setMapError(null);
        } else {
          console.error('❌ Google Maps API loaded but places library not available');
          setPlacesReady(false);
          setMapError('Google Maps API loaded but Places library is not available');
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('❌ Google Maps API failed to load:', error);
      setPlacesReady(false);
      setMapError('Google Maps API failed to load. Please check API key configuration and network connection');
    };
    
    document.head.appendChild(script);
  }, []);

  // Debounced location search function - optimized for event venue search
  const fetchPlacePredictions = (query: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, clear results
    if (!query.trim()) {
      setPlacePredictions([]);
      setIsPlacesLoading(false);
      return;
    }

    // If Google Maps is not ready, notify user
    if (!placesReady || typeof window === 'undefined') {
      console.warn('Google Maps API not ready');
      setPlacePredictions([]);
      setIsPlacesLoading(false);
      return;
    }

    // Debounce: delay 300ms before executing search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsPlacesLoading(true);
        const g = (window as any).google;
        
        if (!g?.maps?.places?.AutocompleteService) {
          console.error('Google Places AutocompleteService not available');
          setPlacePredictions([]);
          setIsPlacesLoading(false);
          return;
        }

        const service = new g.maps.places.AutocompleteService();
        
        // Fully open search options: no type restrictions, return all relevant results
        // Including: addresses, places, establishments, office buildings, stores, restaurants, landmarks, etc.
        const requestOptions: any = {
          input: query.trim(),
          // Don't specify types, let API return all relevant results, including any addresses and places
          // This provides the most comprehensive and flexible search results
        };
        
        service.getPlacePredictions(
          requestOptions,
          (predictions: PlacePrediction[] | null, status: any) => {
            setIsPlacesLoading(false);
            
            if (status === g.maps.places.PlacesServiceStatus.OK && predictions) {
              console.log('✅ Google Places predictions:', predictions.length);
              // Display all search results, no sorting restrictions, let users choose freely
              setPlacePredictions(predictions.slice(0, 10)); // Display up to 10 results
              setMapError(null);
            } else if (status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              console.log('ℹ️ No results found');
              setPlacePredictions([]);
              setMapError(null);
            } else if (status === g.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              console.error('❌ Google Places API quota exceeded');
              setMapError('Google Places API quota exceeded. Please try again later.');
              setPlacePredictions([]);
            } else if (status === g.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              console.error('❌ Google Places API request denied');
              setMapError('Google Places API request denied. Please check: 1) Places API is enabled 2) API key restrictions 3) Billing is enabled');
              setPlacePredictions([]);
            } else {
              console.warn('⚠️ Google Places API status:', status);
              setPlacePredictions([]);
            }
          }
        );
      } catch (err) {
        console.error('❌ Error fetching place predictions:', err);
        setIsPlacesLoading(false);
        setPlacePredictions([]);
        setMapError('Error searching locations. Please try again later.');
      }
    }, 300); // 300ms debounce delay
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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

  const handleSaveLocation = () => {
    const value = location?.trim();
    if (!value) return;
    const exists = savedLocations.includes(value);
    onSaveLocation(value);
    setSaveLocationNotice(exists ? 'Removed from favorites' : 'Added to favorites');
    setTimeout(() => setSaveLocationNotice(null), 1600);
  };

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    if (!placesReady || typeof window === 'undefined') {
      // Format description as: finest granularity + country
      const descParts = prediction.description.split(',').map((s: string) => s.trim());
      const descMainText = descParts[0];
      const descCountry = descParts[descParts.length - 1];
      const descLocationText = descCountry && descCountry !== descMainText 
        ? `${descMainText}, ${descCountry}` 
        : descMainText;
      onLocationChange(descLocationText);
      setIsLocationOpen(false);
      return;
    }
    const g = (window as any).google;
    const service = new g.maps.places.PlacesService(document.createElement('div'));
    
    // Get more detailed place information, including address components, types, etc.
    service.getDetails(
      { 
        placeId: prediction.place_id, 
        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components', 'types', 'vicinity'] 
      },
      (result: any, status: any) => {
        if (status === g.maps.places.PlacesServiceStatus.OK && result) {
          setMapError(null);
          
          // Print complete returned results for viewing all fields
          console.log('📍 Google Places API Complete Data:');
          console.log('==========================================');
          console.log('Complete result object:', result);
          console.log('------------------------------------------');
          console.log('Basic fields:');
          console.log('  - name:', result.name);
          console.log('  - place_id:', result.place_id);
          console.log('  - formatted_address:', result.formatted_address);
          console.log('  - vicinity:', result.vicinity);
          console.log('  - types:', result.types);
          console.log('------------------------------------------');
          console.log('Geometry information:');
          if (result.geometry) {
            console.log('  - location:', {
              lat: result.geometry.location?.lat(),
              lng: result.geometry.location?.lng()
            });
            if (result.geometry.viewport) {
              console.log('  - viewport:', {
                northeast: {
                  lat: result.geometry.viewport.getNorthEast()?.lat(),
                  lng: result.geometry.viewport.getNorthEast()?.lng()
                },
                southwest: {
                  lat: result.geometry.viewport.getSouthWest()?.lat(),
                  lng: result.geometry.viewport.getSouthWest()?.lng()
                }
              });
            }
          }
          console.log('------------------------------------------');
          console.log('Address components (address_components):');
          if (result.address_components && Array.isArray(result.address_components)) {
            result.address_components.forEach((component: any, index: number) => {
              console.log(`  [${index}]`, {
                long_name: component.long_name,
                short_name: component.short_name,
                types: component.types
              });
            });
          }
          console.log('------------------------------------------');
          console.log('Other available fields:');
          console.log('  - business_status:', result.business_status);
          console.log('  - formatted_phone_number:', result.formatted_phone_number);
          console.log('  - international_phone_number:', result.international_phone_number);
          console.log('  - website:', result.website);
          console.log('  - rating:', result.rating);
          console.log('  - user_ratings_total:', result.user_ratings_total);
          console.log('  - opening_hours:', result.opening_hours);
          console.log('  - photos:', result.photos ? `${result.photos.length} photos` : 'None');
          console.log('  - url:', result.url);
          console.log('  - icon:', result.icon);
          console.log('  - plus_code:', result.plus_code);
          console.log('==========================================');
          
          // Extract country from address components
          const country = result.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '';
          
          // Format location text as: finest granularity name + country
          // Use venue name if available, otherwise use formatted_address first part
          let locationText = '';
          if (result.name) {
            locationText = country ? `${result.name}, ${country}` : result.name;
          } else if (result.formatted_address) {
            const addressParts = result.formatted_address.split(',').map((s: string) => s.trim());
            const firstPart = addressParts[0]; // Finest granularity (venue/street address)
            locationText = country && addressParts[addressParts.length - 1] !== country 
              ? `${firstPart}, ${country}` 
              : firstPart;
          } else {
            locationText = prediction.description;
          }
          
          // Extract key information for coordinates
          const keyInfo = extractLocationKeyInfo({
            name: result.name,
            address_components: result.address_components
          });
          
          // Verify if valid geographic coordinates were obtained
          if (result.geometry && result.geometry.location) {
            const coordinates: LocationCoordinates = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              placeId: result.place_id,
              formattedAddress: removePostalCode(result.formatted_address || ''),
              displayText: locationText,
              subtitle: keyInfo.city ? (keyInfo.state ? `${keyInfo.city}, ${keyInfo.state}` : keyInfo.city) : '',
              venueName: keyInfo.venueName || result.name,
              streetAddress: keyInfo.streetAddress,
              city: keyInfo.city,
              state: keyInfo.state,
              country: keyInfo.country,
              postalCode: keyInfo.postalCode
            };
            onLocationChange(locationText);
            onCoordinatesChange(coordinates);
          } else {
            // If no coordinates, only update text
            onLocationChange(locationText);
            onCoordinatesChange(undefined);
          }
        } else {
          // If getting details fails, format description as: finest granularity + country
          const descParts = prediction.description.split(',').map((s: string) => s.trim());
          const descMainText = descParts[0];
          const descCountry = descParts[descParts.length - 1];
          const descLocationText = descCountry && descCountry !== descMainText 
            ? `${descMainText}, ${descCountry}` 
            : descMainText;
          onLocationChange(descLocationText);
          onCoordinatesChange(undefined);
        }
        setIsLocationOpen(false);
      }
    );
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className={`relative bg-white/70 backdrop-blur-md border border-white rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${isLocationOpen ? 'ring-2 ring-[#FF6B3D]/20 z-30' : ''}`} 
      ref={locationRef}
    >
      {/* Map Error Notice */}
      {mapError && !placesReady && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
          <div className="font-bold mb-2">⚠️ Google Maps API Notice</div>
          <div className="mb-2">{mapError}</div>
          
          {mapError.includes('请求被拒绝') && (
            <div className="mt-3 p-2 bg-yellow-100 rounded-lg space-y-1 text-[11px]">
              <div className="font-semibold mb-1">🔧 Troubleshooting Steps:</div>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Visit <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a> to enable <strong>Places API</strong></li>
                <li>Check API key restrictions:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>HTTP referrer restrictions: Add <code className="bg-white px-1 rounded">http://localhost:3000/*</code></li>
                    <li>API restrictions: Ensure <strong>Places API</strong> and <strong>Maps JavaScript API</strong> are included</li>
                  </ul>
                </li>
                <li>Confirm billing account is enabled (required for Places API)</li>
                <li>Wait a few minutes and refresh the page</li>
              </ol>
            </div>
          )}
          
          {!mapError.includes('请求被拒绝') && (
            <div className="mt-1 text-yellow-600">
              Please set <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t border-yellow-200">
            <button
              onClick={() => {
                console.log('🔍 Debug Info:');
                console.log('API Key exists:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
                console.log('Places Ready:', placesReady);
                console.log('Google Maps object:', typeof window !== 'undefined' ? !!(window as any).google : 'N/A');
                console.log('Places Service:', typeof window !== 'undefined' && (window as any).google?.maps?.places ? 'Available' : 'Not available');
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 underline"
            >
              📋 View Console Debug Info
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4" onClick={() => !isVirtual && setIsLocationOpen(true)}>
        <div className={`p-3 rounded-2xl ${isVirtual ? 'bg-cyan-50 text-cyan-500' : 'bg-blue-50 text-blue-500'}`}>
          {isVirtual ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{isVirtual ? 'Virtual Link' : 'Location'}</label>
                {!isVirtual && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationPublicChange(!isLocationPublic);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-slate-600"
                  title={isLocationPublic ? 'Visible to everyone' : 'Visible after registration'}
                >
                  {isLocationPublic ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Public
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Reg-only
                    </>
                  )}
                </button>
                {location && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveLocation();
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-slate-600"
                    title="Toggle favorite location"
                  >
                    {savedLocations.includes(location.trim()) ? (
                      <>
                        <Heart className="w-3.5 h-3.5 fill-[#FF6B3D] text-[#FF6B3D]" /> Saved
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5 text-slate-500" /> Save
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {isVirtual ? (
            <div className="flex items-center">
              <input 
                type="text" 
                className="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0 placeholder-slate-300" 
                placeholder="Paste meeting link..."
                value={meetingLink}
                onChange={(e) => onMeetingLinkChange?.(e.target.value)}
                autoFocus
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onVirtualChange(false);
                  onMeetingLinkChange?.('');
                }} 
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <div className="mt-1">
              <input 
                type="text" 
                className="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0 focus:outline-none focus:border-none placeholder-slate-400 leading-relaxed outline-none" 
                placeholder={placesReady ? "Search for event venue (e.g., convention center, hotel, cafe...)" : "Enter full address..."}
                value={location}
                onChange={(e) => {
                  const value = e.target.value;
                  const previousLength = location?.length || 0;
                  const currentLength = value.length;
                  
                  onLocationChange(value);
                  setLocationSearch(value);
                  setIsLocationOpen(true);
                  fetchPlacePredictions(value);
                  
                  // Clear coordinates immediately when:
                  // 1. Location is empty
                  // 2. User is deleting text (current length < previous length)
                  if (!value || !value.trim() || currentLength < previousLength) {
                    onCoordinatesChange(undefined);
                  }
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.border = 'none';
                  e.target.style.boxShadow = 'none';
                  setIsLocationOpen(true);
                  if (location.trim()) {
                    fetchPlacePredictions(location);
                  }
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    if (!locationRef.current?.contains(relatedTarget)) {
                      setIsLocationOpen(false);
                    }
                  }, 200);
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Location Dropdown */}
      {isLocationOpen && !isVirtual && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-in fade-in zoom-in-95 z-50">
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B3D]" />
                <div className="text-xs font-bold text-slate-700">
                  {placesReady ? 'Search Event Venue' : 'Local Suggestions'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!placesReady && (
                  <div className="text-[10px] text-yellow-600 font-semibold">⚠️ API Not Configured</div>
                )}
                {isPlacesLoading && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Tips and Examples */}
            {!locationSearch.trim() && placePredictions.length === 0 && savedLocations.length === 0 && (
              <div className="px-3 py-3 space-y-2">
                <div className="text-xs font-semibold text-slate-600 mb-2">💡 Search Tips</div>
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500">• Enter venue name: e.g., "Convention Center", "Grand Hotel"</div>
                  <div className="text-[11px] text-slate-500">• Enter full address: e.g., "123 Main Street, New York, NY"</div>
                  <div className="text-[11px] text-slate-500">• Enter landmark: e.g., "Times Square", "Eiffel Tower"</div>
                </div>
              </div>
            )}

            {saveLocationNotice && (
              <div className="mx-2 mb-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm">
                {saveLocationNotice}
              </div>
            )}

            {savedLocations.length > 0 && (
              <div className="space-y-1 pb-2 border-b border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 px-3">Saved</div>
                {savedLocations.map(loc => (
                  <div
                    key={loc}
                    onClick={() => { 
                      onLocationChange(loc); 
                      setIsLocationOpen(false); 
                    }}
                    className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="bg-orange-50 p-2 rounded-full text-orange-500"><MapPin className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800">{loc}</div>
                      <div className="text-[10px] text-slate-400">Saved location</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Google Places Search Results */}
            {placePredictions.length > 0 ? (
              <>
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  Found {placePredictions.length} location{placePredictions.length !== 1 ? 's' : ''}
                </div>
                {placePredictions.map(pred => {
                  // Parse address: extract finest granularity name + country only
                  const descriptionParts = pred.description.split(',').map((s: string) => s.trim());
                  const mainText = descriptionParts[0]; // Finest granularity name (venue/street address)
                  const country = descriptionParts[descriptionParts.length - 1]; // Last part is usually country
                  const displayText = country && country !== mainText ? `${mainText}, ${country}` : mainText;
                  
                  return (
                    <div 
                      key={pred.place_id} 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handlePlaceSelect(pred);
                        setIsLocationOpen(false);
                      }} 
                      className="flex items-start space-x-3 p-3 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-full text-orange-600 transition-colors flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 group-hover:text-orange-700 truncate">
                          {displayText}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          <span>Verified location</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : locationSearch.trim() && !isPlacesLoading ? (
              <>
                {LOCATION_RESULTS.filter(l => 
                  l.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
                  l.address.toLowerCase().includes(locationSearch.toLowerCase())
                ).length > 0 ? (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Local Suggestions
                    </div>
                    {LOCATION_RESULTS.filter(l => 
                      l.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
                      l.address.toLowerCase().includes(locationSearch.toLowerCase())
                    ).map(loc => (
                      <div 
                        key={loc.id} 
                        onClick={() => { 
                          onLocationChange(loc.name); 
                          setIsLocationOpen(false); 
                        }} 
                        className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="bg-slate-100 p-2 rounded-full text-slate-500"><MapPin className="w-4 h-4" /></div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{loc.name}</div>
                          <div className="text-xs text-slate-500">{loc.address}</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <div className="text-xs text-slate-400 mb-2">
                      {placesReady ? 'No matching locations found' : 'Google Maps API not configured'}
                    </div>
                    {placesReady && (
                      <div className="text-[10px] text-slate-500">
                        Try: Enter a more specific venue name or full address
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
            <div 
              onClick={() => {
                onVirtualChange(true);
                setIsLocationOpen(false);
              }} 
              className="flex items-center space-x-3 p-3 hover:bg-cyan-50 rounded-xl cursor-pointer border-t border-slate-100 mt-1 group"
            >
              <div className="bg-cyan-100 p-2 rounded-full text-cyan-600 group-hover:bg-cyan-200"><Video className="w-4 h-4" /></div>
              <div>
                <div className="text-sm font-bold text-slate-800 group-hover:text-cyan-700">Switch to Virtual Event</div>
                <div className="text-xs text-slate-500 group-hover:text-cyan-600">Add Zoom, Google Meet link</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Embedded Map Preview - Only show when location text is not empty */}
      {!isVirtual && locationCoordinates && location?.trim() && location.trim().length > 0 && (
        <MapPreview
          location={location}
          locationCoordinates={locationCoordinates}
        />
      )}
    </div>
  );
}

