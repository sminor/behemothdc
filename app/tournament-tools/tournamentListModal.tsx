'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { Tournament } from './types';

interface TournamentListModalProps {
  onClose: (tournament?: Tournament) => void;
}

const TournamentListModal: React.FC<TournamentListModalProps> = ({ onClose }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { data, error } = await supabase.from('tournaments').select('*');
        if (error) {
          console.error('Supabase fetch error:', error.message);
          throw new Error(`Failed to fetch tournaments: ${error.message}`);
        }
        console.log('Fetched tournaments:', data);
        if (!Array.isArray(data)) {
          console.warn('Data is not an array, defaulting to empty array');
          setTournaments([]);
        } else {
          const sortedTournaments = data.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setTournaments(sortedTournaments);
        }
      } catch (err: unknown) {
        const typedError = err as PostgrestError;
        console.error('Error in fetchTournaments:', typedError.message);
        setTournaments([]);
      }
    };
    fetchTournaments();
  }, []);

  const calculatePrizePool = (tournament: Tournament) => {
    const entryFee = tournament.entry_fee ?? 0;
    const barContribution = tournament.bar_contribution ?? 0;
    const usageFee = tournament.usage_fee ?? 0;
    const bonusMoney = tournament.bonus_money ?? 0;
    const playerCount = tournament.players.length;
    return (entryFee + barContribution - usageFee) * playerCount + bonusMoney;
  };

  const headers = ['Name', 'Date', 'Location', 'Type', 'Players', 'Teams', 'Prize Pool'];

  return (
    <div className="p-4">
      {tournaments.length === 0 ? (
        <p className="text-[var(--card-text)] text-center">No tournaments available.</p>
      ) : (
        <div className="bg-[var(--card-background)] p-4 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--card-highlight)]">
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="text-left font-medium text-[var(--card-text)] p-2 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onClose(t)}
                    className={`odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)] border-none cursor-pointer hover:bg-[var(--color2)]`}
                  >
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      {!t.tournament_completed && <span className="inline-block w-2 h-2 mr-2 bg-[var(--color5)] rounded-full"></span>}
                      {t.name}
                    </td>
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      {t.date}
                    </td>
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      {t.location}
                    </td>
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      {t.tournament_type || 'N/A'}
                    </td>
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      {t.players.length}
                    </td>
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      {t.teams.length}
                    </td>
                    <td className={`p-2 whitespace-nowrap text-[var(--card-text)] ${t.tournament_completed ? 'opacity-50' : 'opacity-100'}`}>
                      ${calculatePrizePool(t).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentListModal;