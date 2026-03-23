'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Video, Eye, EyeOff, Heart, X, RefreshCw, Search } from 'lucide-react';
import { LOCATION_RESULTS } from './constants';
import { extractLocationKeyInfo } from './locationFormatter';
import { OpenStreetMap } from './OpenStreetMap';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  placeId?: string;
  formattedAddress?: string;
  displayText?: string;
  subtitle?: string;
  venueName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  namedetails?: {
    name?: string;
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
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saveLocationNotice, setSaveLocationNotice] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&namedetails=1`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: NominatimResult[] = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Location search error:', error);
      setSearchError('Failed to search locations. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!locationSearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      searchLocation(locationSearch);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [locationSearch, searchLocation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayName = (result: NominatimResult): { main: string; subtitle: string } => {
    const address = result.address || {};
    const parts: string[] = [];
    
    let name = result.display_name.split(',')[0];
    
    if (result.namedetails?.name) {
      name = result.namedetails.name;
    } else if (address.house_number && address.road) {
      name = `${address.house_number} ${address.road}`;
    } else if (address.road) {
      name = address.road;
    }
    
    const city = address.city || address.town || address.village || address.county;
    const state = address.state;
    const country = address.country;

    if (city) parts.push(city);
    if (state && state !== city) parts.push(state);
    if (country) parts.push(country);

    return {
      main: name,
      subtitle: parts.join(', ')
    };
  };

  const handlePlaceSelect = (result: NominatimResult) => {
    const { main, subtitle } = formatDisplayName(result);
    const address = result.address || {};
    
    const coordinates: LocationCoordinates = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      placeId: result.place_id.toString(),
      formattedAddress: result.display_name,
      displayText: main,
      subtitle: subtitle,
      venueName: result.namedetails?.name || undefined,
      streetAddress: address.road ? 
        (address.house_number ? `${address.house_number} ${address.road}` : address.road) : 
        undefined,
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country,
      postalCode: address.postcode
    };

    onLocationChange(main);
    onCoordinatesChange(coordinates);
    setIsLocationOpen(false);
  };

  const handleSaveLocation = () => {
    const value = location?.trim();
    if (!value) return;
    const exists = savedLocations.includes(value);
    onSaveLocation(value);
    setSaveLocationNotice(exists ? 'Removed from favorites' : 'Added to favorites');
    setTimeout(() => setSaveLocationNotice(null), 1600);
  };

  return (
    <div 
      className={`relative bg-white/70 backdrop-blur-md border border-white rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${isLocationOpen ? 'ring-2 ring-[#FF6B3D]/20 z-30' : ''}`} 
      ref={locationRef}
    >
      <div className="flex items-center gap-4" onClick={() => !isVirtual && setIsLocationOpen(true)}>
        <div className={`p-3 rounded-2xl ${isVirtual ? 'bg-cyan-50 text-cyan-500' : 'bg-blue-50 text-blue-500'}`}>
          {isVirtual ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {isVirtual ? 'Virtual Link' : 'Location'}
            </label>
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
                placeholder="Search for event venue (e.g., convention center, hotel...)"
                value={location}
                onChange={(e) => {
                  const value = e.target.value;
                  const previousLength = location?.length || 0;
                  const currentLength = value.length;
                  
                  onLocationChange(value);
                  setLocationSearch(value);
                  setIsLocationOpen(true);
                  
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
                    setLocationSearch(location);
                    searchLocation(location);
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
      
      {isLocationOpen && !isVirtual && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-in fade-in zoom-in-95 z-50">
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#FF6B3D]" />
                <div className="text-xs font-bold text-slate-700">Search Location</div>
              </div>
              <div className="flex items-center gap-2">
                {isSearching && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>
            </div>
            
            {!locationSearch.trim() && searchResults.length === 0 && savedLocations.length === 0 && (
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

            {searchResults.length > 0 ? (
              <>
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                  Found {searchResults.length} location{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map(result => {
                  const { main, subtitle } = formatDisplayName(result);
                  
                  return (
                    <div 
                      key={result.place_id} 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePlaceSelect(result)} 
                      className="flex items-start space-x-3 p-3 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors group"
                    >
                      <div className="bg-orange-100 group-hover:bg-orange-200 p-2 rounded-full text-orange-600 transition-colors flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 group-hover:text-orange-700 truncate">
                          {main}
                        </div>
                        {subtitle && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {subtitle}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          <span>OpenStreetMap</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : locationSearch.trim() && !isSearching ? (
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
                      {searchError || 'No matching locations found'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Try: Enter a more specific venue name or full address
                    </div>
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
      
      {!isVirtual && locationCoordinates && location?.trim() && location.trim().length > 0 && (
        <OpenStreetMap
          location={location}
          locationCoordinates={locationCoordinates}
        />
      )}
    </div>
  );
}
