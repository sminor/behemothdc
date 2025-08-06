'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Button from '@/components/Button';
import { FaTrash, FaSave, FaTimes, FaPlus } from 'react-icons/fa';

type Event = {
  id: string;
  title: string;
  date: string;
  games: string;
  draw_type: string;
  location: string;
  entry_fee?: number;
  special_event?: string;
  signup_start?: string;
  signup_end?: string;
};

type Location = {
  id: string;
  name: string;
};

const defaultValues = {
  games: '501/Cricket/Choice',
  draw_type: 'A/B Draw Handicapped',
  entry_fee: 10.0,
  signup_start: '18:30',
  signup_end: '19:00',
};

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [editedEvents, setEditedEvents] = useState<Record<string, Event>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: eventData, error: eventError }, { data: locationData, error: locationError }] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('locations').select('id, name'),
      ]);

      if (eventError) console.error('Error fetching events:', eventError.message);
      if (locationError) console.error('Error fetching locations:', locationError.message);

      setEvents(eventData || []);
      setLocations(locationData || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleChange = (id: string, field: keyof Event, value: string | number | null) => {
    setEditedEvents((prev) => ({
      ...prev,
      [id]: {
        ...events.find((e) => e.id === id) || prev[id],
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (eventId: string) => {
    const eventToSave = editedEvents[eventId];
    if (!eventToSave) return;

    const requiredFields: (keyof Event)[] = ['title', 'date', 'games', 'draw_type', 'location', 'entry_fee', 'signup_start', 'signup_end'];
    const isValid = requiredFields.every((field) => eventToSave[field] !== undefined && eventToSave[field] !== '');
    if (!isValid) {
      alert('Please fill out all required fields.');
      return;
    }

    if (eventId.startsWith('new-')) {
      const { id: _unusedId, ...eventCopy } = eventToSave;
      const { error } = await supabase.from('events').insert([eventCopy]);
      if (error) {
        console.error('Failed to insert event:', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('events').update(eventToSave).eq('id', eventId);
      if (error) {
        console.error('Failed to update event:', error.message);
        return;
      }
    }

    const { data: refreshedData, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('Failed to refresh events:', fetchError.message);
      return;
    }

    setEvents(refreshedData || []);
    setEditedEvents((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  };

  const handleCancel = (eventId: string) => {
    setEditedEvents((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete event:', error.message);
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== id));
    setEditedEvents((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleCreateNewEvent = () => {
    const newId = `new-${Date.now()}`;
    const newEvent: Event = {
      id: newId,
      title: '',
      date: new Date().toISOString().split('T')[0],
      games: defaultValues.games,
      draw_type: defaultValues.draw_type,
      location: '',
      entry_fee: defaultValues.entry_fee,
      signup_start: defaultValues.signup_start,
      signup_end: defaultValues.signup_end,
    };

    setEditedEvents((prev) => ({
      ...prev,
      [newId]: newEvent,
    }));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newEvents = Object.values(editedEvents).filter((e) => e.id.startsWith('new-'));
  const filteredEvents = events.filter((event) => {
    const matchesSearch = Object.values(event).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const isPast = new Date(event.date) < today;
    return matchesSearch && (showPastEvents || !isPast);
  });

  const combinedEvents = [...newEvents, ...filteredEvents];

  return (
    <section className="p-4">
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Manage Events</h2>
        <Button className="w-auto" onClick={handleCreateNewEvent} icon={<FaPlus />} iconPosition="left">
        Add New Event
        </Button>
    </div>

    {/* Search bar */}
    <div className="mb-2 w-full max-w-[400px]">
        <input
        type="text"
        placeholder="Search events..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
        />
    </div>

    {/* Past Events checkbox below search */}
    <div className="mb-6 flex items-center gap-2 text-[var(--card-text)]">
        <input
        type="checkbox"
        checked={showPastEvents}
        onChange={() => setShowPastEvents(!showPastEvents)}
        className="h-5 w-5 border-1 border-[var(--form-border)] rounded accent-[var(--form-checkbox-checked)] focus:outline-none"
        id="showPastEvents"
        />
        <label htmlFor="showPastEvents" className="cursor-pointer">
        Show Past Events
        </label>
    </div>

      {loading ? (
        <p>Loading events...</p>
      ) : combinedEvents.length === 0 ? (
        <p>No matching events found.</p>
      ) : (
        <div className="space-y-6">
          {combinedEvents.map((event) => {
            const edited = editedEvents[event.id] || event;
            const isNew = event.id.startsWith('new-');
            const hasChanges = editedEvents[event.id] !== undefined;

            return (
              <div
                key={event.id}
                className={`${
                  isNew ? 'bg-[var(--color12)]' : 'bg-[var(--color11)]'
                } p-4 rounded-lg border-l-4 border-[var(--card-highlight)] shadow grid grid-cols-1 md:grid-cols-2 gap-4`}
              >
                {/* Title */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Title</label>
                  <input
                    type="text"
                    value={edited.title}
                    onChange={(e) => handleChange(event.id, 'title', e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Date</label>
                  <input
                    type="date"
                    value={edited.date}
                    onChange={(e) => handleChange(event.id, 'date', e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                {/* Games */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Games</label>
                  <input
                    type="text"
                    value={edited.games}
                    onChange={(e) => handleChange(event.id, 'games', e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                {/* Draw Type */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Draw Type</label>
                  <input
                    type="text"
                    value={edited.draw_type}
                    onChange={(e) => handleChange(event.id, 'draw_type', e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Location</label>
                  <select
                    value={edited.location}
                    onChange={(e) => handleChange(event.id, 'location', e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  >
                    <option value="" disabled hidden>Select a location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                    <option value="None">None</option>
                  </select>
                </div>

                {/* Entry Fee */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Entry Fee</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-[var(--select-text)]">$</span>
                    <input
                      type="number"
                      value={edited.entry_fee ?? ''}
                      onChange={(e) => handleChange(event.id, 'entry_fee', parseFloat(e.target.value))}
                      className="w-full pl-6 p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Special Event */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Special Event</label>
                  <input
                    type="text"
                    value={edited.special_event ?? ''}
                    onChange={(e) => handleChange(event.id, 'special_event', e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                {/* Signup Times */}
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">Signup Times</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={edited.signup_start ?? ''}
                      onChange={(e) => handleChange(event.id, 'signup_start', e.target.value)}
                      className="w-1/2 p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    <input
                      type="time"
                      value={edited.signup_end ?? ''}
                      onChange={(e) => handleChange(event.id, 'signup_end', e.target.value)}
                      className="w-1/2 p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="col-span-full flex justify-end flex-wrap gap-2 mt-2">
                  {hasChanges && (
                    <>
                      <Button
                        className="w-auto px-4 py-2 text-sm"
                        onClick={() => handleSave(event.id)}
                        icon={<FaSave />}
                        iconPosition="left"
                      >
                        Save
                      </Button>
                      <Button
                        className="w-auto px-4 py-2 text-sm"
                        onClick={() => handleCancel(event.id)}
                        icon={<FaTimes />}
                        iconPosition="left"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {!isNew && (
                    <Button
                      className="w-auto px-4 py-2 text-sm bg-[var(--color5)] text-white"
                      onClick={() => handleDelete(event.id)}
                      icon={<FaTrash />}
                      iconPosition="left"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
