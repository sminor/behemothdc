'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import LocationCard from './LocationCard';
import LocationMap from './LocationMap';
import Button from '@/components/Button';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Announcement from '@/components/Announcement';

// Type Definitions
interface Location {
  id: string;
  name: string;
  address: string;
  details: string;
  latitude: number;
  longitude: number;
  is_new?: boolean;
}

const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.from('locations').select('*');
        if (error) throw error;
        setLocations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Scrolls to the map when a location is selected
  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setIsZoomed(true);

    if (mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Haversine formula to calculate the distance between two lat/lng points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Find the closest location to the user
  const findClosestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let closest = null;
        let minDistance = Infinity;

        locations.forEach((location) => {
          const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
          if (distance < minDistance) {
            minDistance = distance;
            closest = location;
          }
        });

        if (closest) {
          handleLocationClick(closest);
        }
      },
      () => {
        alert('Unable to retrieve your location.');
      }
    );
  };

  // Show all locations on the map
  const showAllLocations = () => {
    setSelectedLocation(null);
    setIsZoomed(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Navbar */}
      <NavBar currentPage='locations' />

      {/* Global Page Wrapper */}
      <div className="w-full max-w-screen-xl mx-auto px-4">
        
        {/* Header */}
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold text-[var(--card-title)]">Our Locations</h1>
          <p>With 10 locations around the Portland metro area, JayMar Darts offers convenient spots for you to join the excitement of dart games, leagues, and tournaments. Click on a location to explore more!</p>
        </header>

        {/* Announcement Section */}
        <section className="w-full p-4">
          <Announcement page="locations" autoplayDelay={6000} hideIfNone />
        </section>

        {/* Google Map */}
        <section className="p-4" ref={mapRef}>
          <LocationMap locations={locations} selectedLocation={selectedLocation} />
        </section>

        {/* Buttons Below Map */}
        <section className="p-4 flex justify-center">
          <div className="flex flex-row justify-center gap-4">
            <Button 
              onClick={findClosestLocation} 
              iconPosition="left" 
              className="w-auto px-4 min-w-[160px] whitespace-nowrap"
            >
              Find Closest Location
            </Button>

            {isZoomed && (
              <Button 
                onClick={showAllLocations} 
                iconPosition="left" 
                className="w-auto px-4 min-w-[160px] whitespace-nowrap"
              >
                Show All Locations
              </Button>
            )}
          </div>
        </section>

        {/* Loading / Error Message */}
        {isLoading && <p className="p-4 text-center text-gray-500">Loading locations...</p>}
        {error && <p className="p-4 text-center text-red-500">Error: {error}</p>}

        {/* Location Cards */}
        {!isLoading && !error && (
          <section className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} onClick={() => handleLocationClick(location)} />
              ))}
            </div>
          </section>
        )}

      </div> {/* End of Global Wrapper */}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LocationsPage;
