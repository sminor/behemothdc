'use client';
import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface Location {
  id: string;
  name: string;
  address: string;
  details: string;
  latitude: number;
  longitude: number;
  is_new?: boolean;
}

interface LocationCardProps {
  location: Location;
  onClick: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, onClick }) => {
  return (
    <div
      className="flex flex-col bg-[var(--card-background)] border-l-4 border-[var(--card-highlight)] shadow-md p-4 cursor-pointer transition-transform transform hover:-translate-y-1 relative group rounded-lg"
      onClick={onClick}
    >
      {/* New Location Badge */}
      {location.is_new && (
        <span className="absolute -top-3 -left-3 bg-[var(--card-new)] text-white text-xs font-bold px-2 py-1 rounded shadow-md rotate-[-10deg] transition-transform group-hover:rotate-[-5deg] group-hover:scale-110">
          New!
        </span>
      )}

      {/* Location Title and Icon */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-[var(--card-title)]">
          {location.name}
        </h3>
        <FaMapMarkerAlt size={24} className="text-[var(--card-highlight)]" />
      </div>

      {/* Location Details */}
      <p className="text-[var(--card-text)] mb-1">{location.details}</p>
      <p className="text-[var(--card-text)] mb-1">{location.address}</p>

      {/* Get Directions Button */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--text-link)] underline hover:opacity-75"
      >
        Get Directions
      </a>
    </div>
  );
};

export default LocationCard;
