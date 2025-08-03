'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Button from '@/components/Button';
import { PostgrestError } from '@supabase/supabase-js';
import { Tournament } from './types';
import { tournamentTypes } from './teamGenerators'; // Import the registry

export const TournamentCreateModal: React.FC<{
  onClose: (newTournament?: Tournament) => void;
}> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    location: '', // No default
    tournament_type: '',
    tournament_code: '',
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('name')
          .order('name', { ascending: true });
        if (error) throw error;
        setLocations(data.map((loc: { name: string }) => loc.name));
      } catch (error: unknown) {
        const typedError = error as PostgrestError;
        console.error('Error fetching locations:', typedError.message);
      }
    };
    fetchLocations();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([
          {
            name: formData.name,
            date: formData.date,
            location: formData.location,
            tournament_type: formData.tournament_type || null,
            tournament_code: formData.tournament_code || null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      console.log('Tournament created:', data);
      onClose(data);
    } catch (error: unknown) {
      const typedError = error as PostgrestError;
      console.error('Error creating tournament:', typedError.message);
      setSubmissionError('There was an error creating the tournament. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <form className="w-full md:max-w-2xl" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Tournament Name
          </label>
          <div className="h-[59px] flex items-center">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <div className="h-[59px] flex items-center">
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <div className="h-[59px] flex items-center">
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
            >
              <option value="" disabled>
                Select a location
              </option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tournament_type" className="block text-sm font-medium">
            Tournament Type
          </label>
          <div className="h-[59px] flex items-center">
            <select
              id="tournament_type"
              name="tournament_type"
              value={formData.tournament_type}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
            >
              <option value="" disabled>
                Select a type
              </option>
              {tournamentTypes.map((type) => (
                <option key={type.fileName} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tournament_code" className="block text-sm font-medium">
            Tournament Code <span className='italic'>(Optional)</span>
          </label>
          <div className="h-[59px] flex items-center">
            <input
              type="text"
              id="tournament_code"
              name="tournament_code"
              value={formData.tournament_code}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>

        {submissionError && (
          <div className="text-red-500 text-center mb-4">{submissionError}</div>
        )}
      </form>
    </div>
  );
};

export default TournamentCreateModal;