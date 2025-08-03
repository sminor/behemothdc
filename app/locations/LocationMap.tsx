'use client';
import React, { useRef, useEffect, useState } from 'react';
import { GoogleMap, LoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Constants
const MAP_CONTAINER_STYLE = { width: '100%', height: '500px' };
const DEFAULT_CENTER = { lat: 45.5122, lng: -122.6587 }; // Portland, OR
const DEFAULT_ZOOM = 10;
const LIBRARIES: ('places')[] = ['places'];

// Type Definitions
interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationsMapProps {
  locations: Location[];
  selectedLocation?: Location | null;
}

const LocationsMap: React.FC<LocationsMapProps> = ({ locations, selectedLocation }) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [infoWindowData, setInfoWindowData] = useState<Location | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [infoWindowVisible, setInfoWindowVisible] = useState<boolean>(false);

  // Ensure API key is always a string
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!googleMapsApiKey) {
    console.error('Missing Google Maps API Key. Make sure it is defined in .env.local');
  }

  // Fetch a photo for the location using the Google Places API
  const fetchLocationPhoto = (location: Location) => {
    if (!mapRef.current || !window.google?.maps.places) return;

    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const request = { query: location.name, fields: ['photos'] };

    service.findPlaceFromQuery(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.length) {
        setPhotoUrl(results[0].photos[0].getUrl({ maxWidth: 300, maxHeight: 200 }));
      } else {
        setPhotoUrl(null);
      }
    });
  };

  // Update map view when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedLocation) {
      const lat = parseFloat(String(selectedLocation.latitude));
      const lng = parseFloat(String(selectedLocation.longitude));

      if (!isNaN(lat) && !isNaN(lng)) {
        setInfoWindowVisible(false);
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(14);

        setTimeout(() => {
          mapRef.current?.panBy(0, mapRef.current.getDiv().offsetHeight * -0.2);
          setInfoWindowPosition({ lat, lng });
          setInfoWindowData(selectedLocation);
          fetchLocationPhoto(selectedLocation);
          setInfoWindowVisible(true);
        }, 300);
      }
    } else {
      // Fit all markers into view
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(({ latitude, longitude }) => {
        const lat = parseFloat(String(latitude));
        const lng = parseFloat(String(longitude));
        if (!isNaN(lat) && !isNaN(lng)) bounds.extend({ lat, lng });
      });
      mapRef.current.fitBounds(bounds);
      setInfoWindowPosition(null);
      setInfoWindowVisible(false);
    }
  }, [selectedLocation, locations]);

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={LIBRARIES}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        zoom={DEFAULT_ZOOM}
        center={DEFAULT_CENTER}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {/* Render Markers */}
        {locations.map(({ id, name, latitude, longitude }) => {
          const lat = parseFloat(String(latitude));
          const lng = parseFloat(String(longitude));
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <MarkerF
              key={id}
              position={{ lat, lng }}
              title={name}
              onClick={() => {
                setInfoWindowPosition({ lat, lng });
                setInfoWindowData({ id, name, address: '', latitude, longitude });
                fetchLocationPhoto({ id, name, address: '', latitude, longitude });
                setInfoWindowVisible(true);
              }}
            />
          );
        })}

        {/* Info Window */}
        {infoWindowPosition && infoWindowData && infoWindowVisible && (
          <InfoWindowF position={infoWindowPosition} onCloseClick={() => setInfoWindowVisible(false)}>
            <div className="bg-white text-black p-2 rounded-md">
              <h3 className="text-lg font-medium mb-1">{infoWindowData.name}</h3>
              <p className="mb-1">{infoWindowData.address}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(infoWindowData.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 link-style mb-2 text-[var(--text-link)] focus:outline-none focus:underline focus:text-[var(--text-link)]"
              >
                <span>Get Directions</span>
              </a>
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={infoWindowData.name}
                  width="300"
                  height="200"
                  className="rounded-md shadow-md w-full max-w-[300px] h-auto object-contain mb-2"
                />
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default LocationsMap;
