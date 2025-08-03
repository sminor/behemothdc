// app/leagues/leagueSignupModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import DoublesForm from './signupForms/DoublesForm';
import SinglesForm from './signupForms/SinglesForm';

interface SignupSettings {
  id: string;
  name: string;
  signup_start: string;
  signup_close: string;
  league_info: string | null;
  form_type: string;
}

interface LeagueDetails {
  id: string;
  name: string;
  cost_per_player: number;
  sanction_fee: number;
  cap_details: string;
  day_of_week: string;
  start_time: string;
  signup_settings_id: string | null;
}

const LeagueSignupModal: React.FC = () => {
  const [signupSettings, setSignupSettings] = useState<SignupSettings[]>([]);
  const [leagueDetails, setLeagueDetails] = useState<LeagueDetails[]>([]);
  const [selectedSignup, setSelectedSignup] = useState<SignupSettings | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false); // New state

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingsResult, leaguesResult] = await Promise.all([
          supabase.from('league_signup_settings').select('*'),
          supabase
            .from('league_details')
            .select('id, name, cost_per_player, sanction_fee, cap_details, day_of_week, start_time, signup_settings_id')
            .order('name', { ascending: true }),
        ]);

        if (settingsResult.error) throw new Error(settingsResult.error.message);
        if (leaguesResult.error) throw new Error(leaguesResult.error.message);

        const now = new Date();
        const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

        const activeSignups = (settingsResult.data as SignupSettings[])
          .filter((s) => {
            const startPacific = new Date(`${s.signup_start}T00:00:00-07:00`);
            const closePacific = new Date(`${s.signup_close}T23:59:59.999-07:00`);
            return startPacific <= pacificTime && pacificTime <= closePacific;
          })
          .sort((a, b) => new Date(a.signup_start).getTime() - new Date(b.signup_start).getTime());
        setSignupSettings(activeSignups);
        setLeagueDetails(leaguesResult.data as LeagueDetails[]);

        if (activeSignups.length === 1) setSelectedSignup(activeSignups[0]);
      } catch {
        setFetchError('Unable to load sign-ups. Try again later or contact us.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitSuccess = () => {
    setIsFormSubmitted(true); // Set to true on form submission
  };

  return (
    <div className="p-4 flex flex-col items-center">
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <svg
            className="animate-spin h-5 w-5 text-[var(--text-highlight)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : fetchError ? (
        <p className="text-red-500 text-center">{fetchError}</p>
      ) : signupSettings.length === 0 ? (
        <p className="text-center">No leagues are currently accepting sign-ups.</p>
      ) : (
        <>
          {!isFormSubmitted && signupSettings.length > 1 && ( // Hide dropdown when submitted
            <div className="mb-6 w-full md:max-w-2xl">
              <label htmlFor="signup_select" className="block text-sm font-medium">
                Select a League to Sign Up For
              </label>
              <select
                id="signup_select"
                value={selectedSignup?.id || ''}
                onChange={(e) =>
                  setSelectedSignup(signupSettings.find((s) => s.id === e.target.value) || null)
                }
                className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
              >
                <option value="">Choose a league</option>
                {signupSettings.map((signup) => (
                  <option key={signup.id} value={signup.id}>
                    {signup.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSignup && (
            <div className="w-full">
              {selectedSignup.form_type === 'DoublesForm' ? (
                <DoublesForm
                  signup={selectedSignup}
                  leagueDetails={leagueDetails.filter(
                    (l) => l.signup_settings_id === selectedSignup.id
                  )}
                  onSubmitSuccess={handleSubmitSuccess} // Pass callback
                />
              ) : selectedSignup.form_type === 'SinglesForm' ? (
                <SinglesForm
                  signup={selectedSignup}
                  leagueDetails={leagueDetails.filter(
                    (l) => l.signup_settings_id === selectedSignup.id
                  )}
                  onSubmitSuccess={handleSubmitSuccess} // Pass callback (assuming SinglesForm is updated)
                />
              ) : (
                <p className="text-red-500">Invalid form type: {selectedSignup.form_type}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeagueSignupModal;