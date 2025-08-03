// app/stats/page.tsx
'use client';
import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Announcement from '@/components/Announcement';
import Button from '@/components/Button';

// Define types for ADL and NADO data (synced with fetch-stats.ts)
type ADLPlayer = {
  name: string;
  playerId: string;
  games01: number;
  cricketGames: number;
  avg01: number;
  cricketAvg: number;
  rating01: number;
  cricketRating: number;
  rollingRating: number;
};

type NADOPlayer = {
  firstName: string;
  lastName: string;
  gamesPlayed: number;
  marksPerRound: number;
  pointsPerDart: number;
  rating: number;
  nadoPoints: number;
};

// Union type for raw data
type Player = ADLPlayer | NADOPlayer;

// Type for transformed display data
type DisplayPlayer = {
  firstName: string;
  lastName: string;
  playerId?: string; // Optional for NADO
  gamesPlayed: number;
  ppd: number; // Points Per Dart
  mpr: number; // Marks Per Round
  rating01?: number; // Optional for NADO
  cricketRating?: number; // Optional for NADO
  rollingRating?: number; // Optional for NADO
  rating?: number; // Renamed from initialRating for ADL
  nadoPoints?: number; // Optional for ADL
};

const Stats = () => {
  const [searchValue, setSearchValue] = useState('');
  const [searchSource, setSearchSource] = useState('adl');
  const [results, setResults] = useState<DisplayPlayer[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Transform raw player data into display-friendly format
  const transformPlayerData = (player: Player, source: 'adl' | 'nado'): DisplayPlayer => {
    if (source === 'adl') {
      const adlPlayer = player as ADLPlayer;
      // Remove (M) or (F) and extract rating (e.g., "(8)")
      const nameParts = adlPlayer.name.replace(/\s*\((M|F)\)\s*/g, '').split(' ');
      const ratingMatch = adlPlayer.name.match(/\((\d+)\)$/);
      const rating = ratingMatch ? Number(ratingMatch[1]) : undefined;
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ').replace(/\s*\(\d+\)$/, ''); // Remove rating from lastName

      return {
        firstName,
        lastName,
        playerId: adlPlayer.playerId,
        gamesPlayed: adlPlayer.games01 + adlPlayer.cricketGames,
        ppd: adlPlayer.avg01,
        mpr: adlPlayer.cricketAvg,
        rating01: adlPlayer.rating01,
        cricketRating: adlPlayer.cricketRating,
        rollingRating: adlPlayer.rollingRating,
        rating, // Renamed from initialRating
      };
    } else {
      const nadoPlayer = player as NADOPlayer;
      return {
        firstName: nadoPlayer.firstName,
        lastName: nadoPlayer.lastName,
        gamesPlayed: nadoPlayer.gamesPlayed,
        ppd: nadoPlayer.pointsPerDart,
        mpr: nadoPlayer.marksPerRound,
        nadoPoints: nadoPlayer.nadoPoints,
        rollingRating: nadoPlayer.rating, // Use NADO's rating as rollingRating
      };
    }
  };

  // Fetch real data from Netlify function
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    try {
      const response = await fetch('/.netlify/functions/fetch-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchValue, searchSource }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const transformedResults = (data.players || []).map((player: Player) =>
        transformPlayerData(player, searchSource as 'adl' | 'nado')
      );
      setResults(transformedResults);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle radio button change: clear results but keep searchValue
  const handleSourceChange = (source: 'adl' | 'nado') => {
    setSearchSource(source);
    setResults([]); // Clear results
    setHasSearched(false); // Reset search state so no message shows
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn as keyof DisplayPlayer] ?? '';
    const valB = b[sortColumn as keyof DisplayPlayer] ?? '';
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // Define human-readable headers based on source
  const headerLabels: Record<string, Record<string, string>> = {
    adl: {
      firstName: 'First Name',
      lastName: 'Last Name',
      playerId: 'Player ID',
      gamesPlayed: 'Games Played',
      ppd: 'PPD',
      mpr: 'MPR',
      rating01: '01 Rating',
      cricketRating: 'Cricket Rating',
      rollingRating: 'Rolling Rating',
      rating: 'Rating', // Renamed from Initial Rating
    },
    nado: {
      firstName: 'First Name',
      lastName: 'Last Name',
      gamesPlayed: 'Games Played',
      ppd: 'PPD',
      mpr: 'MPR',
      rollingRating: 'Rating',
      nadoPoints: 'NADO Points',
    },
  };

  const headers = results.length > 0 ? Object.keys(results[0]) : [];
  const displayHeaders = headers.map((header) => headerLabels[searchSource][header] || header);

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Navigation Bar */}
      <NavBar currentPage="Stats" />

      {/* Global Page Wrapper */}
      <div className="w-full max-w-screen-xl mx-auto px-4">
        {/* Header */}
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold text-[var(--card-title)]">Player Stats</h1>
          <p>Search for player statistics from ADL or NADO.</p>
        </header>

        {/* Announcement Section */}
        <section className="w-full p-4">
          <Announcement page="stats" autoplayDelay={6000} hideIfNone />
        </section>

        {/* Search Section */}
        <section className="p-4">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="searchValue" className="block text-sm font-medium">
                Enter player name
              </label>
              <input
                type="text"
                id="searchValue"
                placeholder="Enter player name..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="mt-1 p-2 w-full max-w-[300px] border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              {['adl', 'nado'].map((source) => (
                <label key={source} className="flex items-center">
                  <input
                    type="radio"
                    name="searchSource"
                    value={source}
                    checked={searchSource === source}
                    onChange={() => handleSourceChange(source as 'adl' | 'nado')}
                    className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  />
                  <span className="uppercase">{source}</span>
                </label>
              ))}
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="max-w-[300px]"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </section>

        {/* Results Section */}
        <section className="p-4">
          {loading ? (
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
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : hasSearched && results.length === 0 ? (
            <p className="text-center">No results found. Try a different name or source.</p>
          ) : results.length > 0 ? (
            <div className="bg-[var(--card-background)] p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-[var(--card-title)]">
                {searchSource.toUpperCase()} Stats
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[var(--card-highlight)]">
                      {displayHeaders.map((header, index) => (
                        <th
                          key={headers[index]}
                          className="text-left font-medium text-[var(--card-text)] p-2 cursor-pointer whitespace-nowrap"
                          onClick={() => handleSort(headers[index])}
                        >
                          {header}{' '}
                          {sortColumn === headers[index] ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)] border-none"
                      >
                        {headers.map((header) => (
                          <td
                            key={header}
                            className="text-[var(--card-text)] p-2 whitespace-nowrap"
                          >
                            {row[header as keyof DisplayPlayer]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Stats;