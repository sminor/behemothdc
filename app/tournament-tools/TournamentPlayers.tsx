'use client';
import React, { useState, useEffect, useRef } from 'react';
import * as cheerio from 'cheerio';
import { supabase } from '@/utils/supabaseClient';
import Button from '@/components/Button';
import { FaUserPlus } from 'react-icons/fa';
import { Tournament, Player } from './types'; // Import shared types

const TournamentPlayers: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({ tournament, onUpdate }) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1); // For keyboard navigation
  const [newPlayer, setNewPlayer] = useState({ name: '', ppd: '', mpr: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLUListElement>(null); // Ref for scrolling
  const searchContainerRef = useRef<HTMLDivElement>(null); // Ref for search container
  const isReadOnly = tournament.tournament_completed ?? false; // Determine read-only state

  // Fetch and scrape players once on mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/.netlify/functions/get-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://leagueleader.net/sharedreport.php?operatorid=1635&code=6d8955b4-e80f-4951-8241-932a4be7121d' }),
        });
        const { data: html } = await response.json();
        const $ = cheerio.load(html);
        const players = $('table.report tbody tr').map((_, row) => {
          const cols = $(row).find('td');
          return {
            name: cols.eq(0).text().trim(),
            ppd: parseFloat(cols.eq(5).text().trim()),
            mpr: parseFloat(cols.eq(6).text().trim()),
            paid: false,
          };
        }).get().filter((p) => p.name && !isNaN(p.ppd) && !isNaN(p.mpr));
        setAllPlayers(players);
      } catch (error) {
        console.error('Error scraping players:', error);
        setAllPlayers([]); // Fallback to empty array
      }
    };
    fetchPlayers();
  }, []);

  // Advanced search functionality
  const filterPlayers = (players: Player[], term: string, currentPlayers: Player[]): Player[] => {
    if (!term.trim()) return [];
    const searchTerms = term.toLowerCase().trim().split(/\s+/);
    return players.filter((player) => {
      const fullName = player.name.toLowerCase();
      const [firstName, ...lastNameParts] = fullName.split(/\s+/);
      const lastName = lastNameParts.join(' ');

      if (searchTerms.length === 1) {
        // Single term: match any part of the full name
        return fullName.includes(searchTerms[0]);
      } else {
        // Two terms: match first term against first name, second against last name
        const [firstTerm, secondTerm] = searchTerms;
        return firstName.includes(firstTerm) && lastName.includes(secondTerm);
      }
    }).filter((player) => !currentPlayers.some((tPlayer) => tPlayer.name === player.name));
  };

  const filteredPlayers = filterPlayers(allPlayers, searchTerm, tournament.players);

  // Auto-select first search result when results first appear
  useEffect(() => {
    if (!isReadOnly && filteredPlayers.length > 0 && selectedIndex === -1) {
      setSelectedIndex(0); // Select first result only if no selection exists
      if (searchResultsRef.current) {
        searchResultsRef.current.children[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [filteredPlayers, selectedIndex, isReadOnly]);

  // Clear search term when clicking outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isReadOnly && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchTerm('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isReadOnly]);

  // Keyboard navigation for search results with scrolling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isReadOnly) return; // Disable keyboard navigation in read-only mode

    // Handle Escape key unconditionally
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchTerm('');
      setSelectedIndex(-1);
      return; // Exit early after handling Escape
    }

    // Only proceed with navigation/addition if there are filtered players
    if (filteredPlayers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const newIndex = prev < filteredPlayers.length - 1 ? prev + 1 : prev; // Stop at last
        if (searchResultsRef.current && newIndex >= 0) {
          searchResultsRef.current.children[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : prev; // Stop at first
        if (searchResultsRef.current && newIndex >= 0) {
          searchResultsRef.current.children[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return newIndex;
      });
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const playerToAdd = filteredPlayers[selectedIndex];
      addPlayer(playerToAdd);
      // Simulate the updated player list to check remaining matches
      const updatedPlayers = [{ ...playerToAdd, paid: false }, ...tournament.players];
      const remainingPlayers = filterPlayers(allPlayers, searchTerm, updatedPlayers);
      if (remainingPlayers.length === 0) {
        // Clear search if no matches remain
        setSearchTerm('');
        setSelectedIndex(-1);
      } else {
        // Move selection to the next available player
        setSelectedIndex((prev) => {
          const newIndex = prev < remainingPlayers.length ? prev : remainingPlayers.length - 1;
          if (searchResultsRef.current && newIndex >= 0) {
            searchResultsRef.current.children[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return newIndex;
        });
      }
    }
  };

  // Handle search input change and reset selectedIndex to 0 when search term becomes empty
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return; // Prevent changes in read-only mode
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!newSearchTerm.trim() && filteredPlayers.length > 0) {
      setSelectedIndex(0); // Reset to first result when search term is emptied
      if (searchResultsRef.current) {
        searchResultsRef.current.children[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleNewPlayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return; // Prevent changes in read-only mode
    const { name, value } = e.target;
    setNewPlayer((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const addNewPlayer = () => {
    if (isReadOnly) return; // Prevent adding in read-only mode
    const ppdNum = parseFloat(newPlayer.ppd);
    const mprNum = parseFloat(newPlayer.mpr);
    if (!newPlayer.name.trim() || !newPlayer.ppd || !newPlayer.mpr || isNaN(ppdNum) || isNaN(mprNum) || ppdNum <= 0 || mprNum <= 0) {
      setFormError('Name, PPD, and MPR are required, and PPD/MPR must be positive numbers.');
      return;
    }
    const updatedPlayers = [{ name: newPlayer.name.trim(), ppd: ppdNum, mpr: mprNum, paid: false }, ...tournament.players];
    updatePlayersInDatabase(updatedPlayers);
    setNewPlayer({ name: '', ppd: '', mpr: '' });
  };

  const addPlayer = (player: Player) => {
    if (isReadOnly) return; // Prevent adding in read-only mode
    const updatedPlayers = [{ ...player, paid: false }, ...tournament.players];
    updatePlayersInDatabase(updatedPlayers);

    // Simulate the updated player list to check remaining matches
    const remainingPlayers = filterPlayers(allPlayers, searchTerm, updatedPlayers);
    if (remainingPlayers.length === 0) {
      setSearchTerm('');
      setSelectedIndex(-1);
    }
  };

  const removePlayer = (player: Player) => {
    if (isReadOnly || player.paid) return; // Prevent removal in read-only mode or if paid
    const updatedPlayers = tournament.players.filter((p) => p.name !== player.name);
    updatePlayersInDatabase(updatedPlayers);
  };

  const togglePaidStatus = (player: Player) => {
    if (isReadOnly) return; // Prevent toggling in read-only mode
    const updatedPlayers = tournament.players.map((p) =>
      p.name === player.name ? { ...p, paid: !p.paid } : p
    );
    updatePaidStatusInDatabase(updatedPlayers);
  };

  // Updates players and clears teams in the database (for add/remove)
  const updatePlayersInDatabase = async (players: Player[]) => {
    const { data, error } = await supabase
      .from('tournaments')
      .update({ players, teams: [] }) // Clear teams when players change
      .eq('id', tournament.id)
      .select()
      .single();
    if (error) {
      console.error('Error updating players and teams:', error.message);
    } else {
      onUpdate(data);
    }
  };

  // Updates players only in the database (for paid status changes)
  const updatePaidStatusInDatabase = async (players: Player[]) => {
    const { data, error } = await supabase
      .from('tournaments')
      .update({ players }) // Only update players, leave teams intact
      .eq('id', tournament.id)
      .select()
      .single();
    if (error) {
      console.error('Error updating paid status:', error.message);
    } else {
      onUpdate(data);
    }
  };

  // Function to pad the list to 3 or 4 items based on count
  const padList = (players: Player[], count: number = filteredPlayers.length === 1 ? 3 : 4) => {
    const padded = [...players];
    while (padded.length < count) {
      padded.push({ name: '', ppd: 0, mpr: 0, paid: false }); // Empty placeholder
    }
    return padded;
  };

  return (
    <div className="mt-4">
      <h3 className="text-md text-[var(--card-title)] mb-2">Search Players</h3>
      <div ref={searchContainerRef} className="relative w-full max-w-[400px]">
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          disabled={isReadOnly}
          className={`p-2 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {!isReadOnly && searchTerm && filteredPlayers.length > 0 && (
          <ul ref={searchResultsRef} className="absolute z-10 mt-0.5 w-full max-h-40 overflow-y-auto scrollbar-custom border-0 rounded-md bg-[var(--form-background)] shadow-lg">
            {padList(filteredPlayers, filteredPlayers.length === 1 ? 3 : 4).map((player, index) => (
              <li
                key={player.name || `placeholder-${index}`} // Unique key for placeholders
                onClick={() => player.name && addPlayer(player)} // Only clickable if real player
                onMouseEnter={() => player.name && setSelectedIndex(index)} // Update selectedIndex on hover
                className={`p-2 cursor-pointer truncate ${index === selectedIndex && player.name ? 'text-[var(--text-highlight)]' : 'text-[var(--card-text)] hover:text-[var(--text-highlight)]'}`}
              >
                {player.name || ''} {/* Empty for placeholders */}
              </li>
            ))}
          </ul>
        )}
      </div>
      <h3 className="text-md text-[var(--card-title)] mt-4 mb-2">Add Player</h3>
      <div className="flex gap-2 items-center w-full max-w-[400px]">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={newPlayer.name}
          onChange={handleNewPlayerChange}
          disabled={isReadOnly}
          className={`p-2 w-1/2 border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <input
          type="text"
          inputMode="decimal"
          name="ppd"
          placeholder="PPD"
          value={newPlayer.ppd}
          onChange={handleNewPlayerChange}
          pattern="\d+(\.\d{1,2})?"
          disabled={isReadOnly}
          className={`p-2 w-1/6 border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <input
          type="text"
          inputMode="decimal"
          name="mpr"
          placeholder="MPR"
          value={newPlayer.mpr}
          onChange={handleNewPlayerChange}
          pattern="\d+(\.\d{1,2})?"
          disabled={isReadOnly}
          className={`p-2 w-1/6 border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <Button
          onClick={addNewPlayer}
          icon={<FaUserPlus size={20} aria-hidden="true" />}
          className={`p-2 h-10.5 w-1/6 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          ariaLabel="Add new player"
          disabled={isReadOnly}
        >
        </Button>
      </div>
      {formError && !isReadOnly && <p className="text-red-500 text-sm mt-4 text-center">{formError}</p>}
      <div className="mt-4">
        <h3 className="text-md text-[var(--card-title)]">Tournament Players</h3>
        <table className="w-full mt-2 border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--card-highlight)]">
              <th className="text-left text-[var(--card-text)] p-2">Name</th>
              <th className="text-left text-[var(--card-text)] p-2">PPD</th>
              <th className="text-left text-[var(--card-text)] p-2">MPR</th>
              <th className="text-left text-[var(--card-text)] p-2">Paid</th>
            </tr>
          </thead>
          <tbody>
            {tournament.players.map((player, index) => (
              <tr key={index} className="odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)]">
                <td
                  className={`p-2 text-[var(--card-text)] ${!isReadOnly && !player.paid ? 'cursor-pointer hover:text-[var(--text-highlight)]' : 'cursor-default'}`}
                  onClick={() => removePlayer(player)}
                >
                  {player.name}
                </td>
                <td className="p-2 text-[var(--card-text)]">{player.ppd.toFixed(2)}</td>
                <td className="p-2 text-[var(--card-text)]">{player.mpr.toFixed(2)}</td>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={player.paid}
                    onChange={() => togglePaidStatus(player)}
                    disabled={isReadOnly}
                    className={`h-5 w-5 border-1 border-[var(--form-border)] rounded accent-[var(--form-checkbox-checked)] focus:outline-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TournamentPlayers;