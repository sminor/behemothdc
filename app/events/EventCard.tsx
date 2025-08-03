'use client';
import React from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaBullseye, FaClock, FaDollarSign, FaExchangeAlt } from 'react-icons/fa';

// Type Definitions
interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  games: string;
  draw_type: string;
  signup_start: string;
  signup_end: string;
  entry_fee: number;
  special_event?: string;
}

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Convert event date to Pacific Time
  const eventDate = new Date(event.date + 'T00:00:00');

  const eventDateString = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  // Ensure we only compare the DATE (not time) to avoid early past event marking
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

  const isPastEvent = eventDate < today;
  const isTodayEvent = eventDate.toDateString() === today.toDateString();

  // Convert 24-hour time to 12-hour format
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formattedStartTime = formatTime(event.signup_start);
  const formattedEndTime = formatTime(event.signup_end);

  return (
    <div
      className={`flex flex-col border-l-4 shadow-md p-4 relative group rounded-lg ${
        isPastEvent
          ? 'bg-[var(--card-past-background)] border-[var(--card-past-highlight)]'
          : 'bg-[var(--card-background)] border-[var(--card-highlight)]'
      }`}
    >
      {/* Special Event Sticker */}
      {event.special_event && (
        <span
          className={`absolute -top-3 -left-3 text-xs font-bold px-2 py-1 rounded shadow-md rotate-[-10deg] ${
            isPastEvent ? 'bg-[var(--card-past-badge)] text-white' : 'bg-[var(--card-special)] text-white'
          }`}
        >
          {event.special_event}
        </span>
      )}

      {/* Today Sticker */}
      {isTodayEvent && (
        <span className="absolute -top-3 -right-3 bg-[var(--card-today)] text-white text-xs font-bold px-2 py-1 rounded shadow-md rotate-[10deg]">
          Today!
        </span>
      )}

      {/* Event Title */}
      <h3
        className={`text-lg font-medium ${
          isPastEvent ? 'text-[var(--card-past-title)]' : 'text-[var(--card-title)]'
        }`}
      >
        {event.title}
      </h3>

      {/* Event Details */}
      <div className="flex items-center mt-1">
        <FaCalendarAlt className={`mr-2 ${isPastEvent ? 'text-[var(--card-past-highlight)]' : 'text-[var(--card-highlight)]'}`} />
        <span className={isPastEvent ? 'text-[var(--card-past-text)]' : 'text-[var(--card-text)]'}>
          {eventDateString}
        </span>
      </div>

      <div className="flex items-center mt-1">
        <FaMapMarkerAlt className={`mr-2 ${isPastEvent ? 'text-[var(--card-past-highlight)]' : 'text-[var(--card-highlight)]'}`} />
        {isPastEvent ? (
          <span className="text-[var(--card-past-text)]">{event.location}</span>
        ) : (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-link)] hover:underline"
          >
            {event.location}
          </a>
        )}
      </div>

      <div className="flex items-center mt-1">
        <FaBullseye className={`mr-2 ${isPastEvent ? 'text-[var(--card-past-highlight)]' : 'text-[var(--card-highlight)]'}`} />
        <span className={isPastEvent ? 'text-[var(--card-past-text)]' : 'text-[var(--card-text)]'}>Games: {event.games}</span>
      </div>

      <div className="flex items-center mt-1">
        <FaExchangeAlt className={`mr-2 ${isPastEvent ? 'text-[var(--card-past-highlight)]' : 'text-[var(--card-highlight)]'}`} />
        <span className={isPastEvent ? 'text-[var(--card-past-text)]' : 'text-[var(--card-text)]'}>Draw Type: {event.draw_type}</span>
      </div>

      <div className="flex items-center mt-1">
        <FaClock className={`mr-2 ${isPastEvent ? 'text-[var(--card-past-highlight)]' : 'text-[var(--card-highlight)]'}`} />
        <span className={isPastEvent ? 'text-[var(--card-past-text)]' : 'text-[var(--card-text)]'}>
          Signups: {formattedStartTime} - {formattedEndTime}
        </span>
      </div>

      <div className="flex items-center mt-1">
        <FaDollarSign className={`mr-2 ${isPastEvent ? 'text-[var(--card-past-highlight)]' : 'text-[var(--card-highlight)]'}`} />
        <span className={isPastEvent ? 'text-[var(--card-past-text)]' : 'text-[var(--card-text)]'}>Entry Fee: ${event.entry_fee}</span>
      </div>
    </div>
  );
};

export default EventCard;
