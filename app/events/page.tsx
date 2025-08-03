'use client';
import React, { useState, useEffect} from 'react';
import { supabase } from '@/utils/supabaseClient';
import NavBar from '@/components/NavBar';
import EventCard from './EventCard';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import Announcement from '@/components/Announcement';
import Modal from '@/components/Modal';
import EventsFAQContent from './eventsFAQModal';
import NewPlayerContent from './eventsNewPlayerModal';
import ConductCodeContent from './eventsConductCodeModal';
import { FaQuestionCircle, FaUserPlus, FaBook } from 'react-icons/fa'; // Import icons

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

const EventsPage = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<string>('thisMonth');
    const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [uniqueLocations, setUniqueLocations] = useState<string[]>(['all']);
    const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
    const [isNewPlayerModalOpen, setIsNewPlayerModalOpen] = useState(false);
    const [isCodeOfConductModalOpen, setIsCodeOfConductModalOpen] = useState(false);

    // Fetch Events from Supabase
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                //Start of previous month
                const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    //Filter out old events
                    .gte('date', startOfPreviousMonth.toISOString().split('T')[0]) // greater than or equal to start of previous month
                    .order('date', { ascending: true });

                if (error) throw error;
                setEvents(data || []);

                // Extract unique locations
                const locations = new Set(data.map(event => event.location));
                setUniqueLocations(['all', ...Array.from(locations)]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Event Filtering Logic
    const filteredEvents = events.filter(event => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDate = new Date(event.date + 'T00:00:00');
        const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const isPastEvent = eventDate < today && eventDate >= startOfPreviousMonth; //Only show events in the past month.

        if (!showPastEvents && isPastEvent) return false;
        if (locationFilter !== 'all' && event.location !== locationFilter) return false;
        if (dateRange === 'all') return true;
        if (dateRange === 'thisMonth') return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
        if (dateRange === 'thisWeek') return eventDate >= today && eventDate <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
        if (dateRange === 'today') return eventDate.toDateString() === today.toDateString();
        return true;
    });

    return (
        <div className="flex flex-col items-center min-h-screen">
            {/* Navigation Bar */}
            <NavBar currentPage="Events" />

            {/* Global Page Wrapper */}
            <div className="w-full max-w-screen-xl mx-auto px-4">

                {/* Header */}
                <header className="p-4 text-center">
                    <h1 className="text-2xl font-bold text-[var(--card-title)]">Upcoming Events</h1>
                    <p>{"Whether you're a seasoned player or just starting out, our tournaments are the perfect opportunity to compete and have fun!"}</p>
                </header>

                {/* Announcement - Hidden if no announcement */}
                <section className="w-full p-4">
                    <Announcement page="events" autoplayDelay={6000} hideIfNone />
                </section>

                {/* Buttons Section */}
                <section className="p-4 flex justify-center">
                    <div className="w-full max-w-sm md:max-w-md lg:max-w-lg grid grid-cols-3 gap-4">
                        <div className='flex-1'>
                            <Button className="w-full" icon={<FaUserPlus size={32} aria-hidden="true" />} onClick={() => setIsNewPlayerModalOpen(true)}>New Players</Button>
                        </div>
                        <div className='flex-1'>
                            <Button className="w-full" icon={<FaBook size={32} aria-hidden="true" />} onClick={() => setIsCodeOfConductModalOpen(true)}>Conduct Code</Button>
                        </div>
                        <div className='flex-1'>
                            <Button className="w-full" icon={<FaQuestionCircle size={32} aria-hidden="true" />} onClick={() => setIsFAQModalOpen(true)}>FAQ</Button>
                        </div>
                    </div>
                </section>

                {/* Modal Component with New Player Content */}
                <Modal
                  isOpen={isNewPlayerModalOpen}
                  onClose={() => setIsNewPlayerModalOpen(false)}
                  title="New Player Information"
                  content={<NewPlayerContent />}
                />

                {/* Modal Component with Code of Conduct Content */}
                <Modal
                  isOpen={isCodeOfConductModalOpen}
                  onClose={() => setIsCodeOfConductModalOpen(false)}
                  title="Code of Conduct"
                  content={<ConductCodeContent />}
                />                 

                {/* Modal Component with FAQ Content */}
                <Modal
                    isOpen={isFAQModalOpen}
                    onClose={() => setIsFAQModalOpen(false)}
                    title="Event FAQs"
                    content={<EventsFAQContent />}
                />

                {/* Filters Section */}
                <section className="p-4">
                    <div className="w-full max-w-screen-xl mx-auto flex justify-between items-end">

                        {/* Left: Date Range & Location Filters */}
                        <div className="flex flex-col w-auto">
                            <div className="w-full max-w-[200px]">
                                <label className="block text-sm font-medium">Filter Events:</label>
                                <select
                                    onChange={(e) => setDateRange(e.target.value)}
                                    value={dateRange}
                                    className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none max-w-[200px]"
                                >
                                    <option value="thisMonth">This Month</option>
                                    <option value="thisWeek">This Week</option>
                                    <option value="today">Today</option>
                                    <option value="all">All Events</option>
                                </select>
                            </div>

                            <div className="w-full max-w-[200px] mt-2">
                                <select
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    value={locationFilter}
                                    className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none max-w-[200px]"
                                >
                                    {uniqueLocations.map(location => (
                                        <option key={location} value={location}>
                                            {location === 'all' ? 'All Locations' : location}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right: Past Events Checkbox */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showPastEvents"
                                checked={showPastEvents}
                                onChange={() => setShowPastEvents(!showPastEvents)}
                                className="appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-sm checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                            />
                            <label htmlFor="showPastEvents" className="ml-2 text-[var(--select-text)] cursor-pointer">
                                Past Events
                            </label>
                        </div>

                    </div>
                </section>


                {/* Event Cards Section */}
                <section className="p-4">
                    {error && <p className="p-4 text-center text-red-500">Error: {error}</p>}
                    {!isLoading && !error && filteredEvents.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <p className="text-left text-[var(--card-text)]">No events found for the selected criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </section>

            </div> {/* End of Global Wrapper */}

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default EventsPage;
