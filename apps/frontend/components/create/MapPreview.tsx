'use client';

import { LocationCoordinates } from './LocationMap';
import { OpenStreetMap } from './OpenStreetMap';

interface MapPreviewProps {
  location: string;
  locationCoordinates?: LocationCoordinates;
}

export function MapPreview({
  location,
  locationCoordinates,
}: MapPreviewProps) {
  if (!locationCoordinates || !location || !location.trim()) {
    return null;
  }

  return (
    <OpenStreetMap
      location={location}
      locationCoordinates={locationCoordinates}
      height="300px"
      showDetails={true}
    />
  );
}
