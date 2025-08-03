'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import * as cheerio from 'cheerio';

type DynamicTableRow = Record<string, string | number>;

interface League {
    id: string;
    name: string;
    day_of_week: string;
    start_time: string;
}

interface LeagueFlight {
    id: string;
    flight_name: string;
    standings_url: string;
    league_type: string;
    league_id: string;
}

interface LeagueFlightOption {
    leagueName: string;
    flightName: string;
    standings_url: string;
    league_type: string;
    day_of_week: string;
    start_time: string;
}


const LeagueStandingsModal: React.FC = () => {
    // State Variables
    const [leagues, setLeagues] = useState<League[]>([]);
    const [leagueFlights, setLeagueFlights] = useState<LeagueFlight[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<LeagueFlightOption | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [leagueOptions, setLeagueOptions] = useState<LeagueFlightOption[]>([]);
    const [standingsLoading, setStandingsLoading] = useState<boolean>(false);
    const [standingsError, setStandingsError] = useState<string | null>(null);

    // New State Variables to Store Extracted Data
    const [teamStandings, setTeamStandings] = useState<DynamicTableRow[]>([]);
    const [lastMatchResults, setLastMatchResults] = useState<DynamicTableRow[]>([]);
    const [x01Data, setX01Data] = useState<DynamicTableRow[]>([]);
    const [cricketData, setCricketData] = useState<DynamicTableRow[]>([]);

    // Fetch Leagues and Flights
    useEffect(() => {
        const fetchLeaguesAndFlights = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: leaguesData, error: leaguesError } = await supabase
                    .from('league_details')
                    .select('id, name, day_of_week, start_time')
                    .order('name', { ascending: true });

                if (leaguesError) throw leaguesError;
                setLeagues(leaguesData as League[]);

                const { data: flightsData, error: flightsError } = await supabase
                    .from('league_flights')
                    .select('id, flight_name, standings_url, league_id, league_type')
                    .order('flight_name', { ascending: true });

                if (flightsError) throw flightsError;
                setLeagueFlights(flightsData as LeagueFlight[]);
            } catch (err) {
                setError((err as Error).message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaguesAndFlights();
    }, []);

    // Map Flights to Options
    useEffect(() => {
        if (leagues.length > 0 && leagueFlights.length > 0) {
            const newOptions = leagueFlights.map((flight) => {
                const league = leagues.find((league) => league.id === flight.league_id);
                return {
                    leagueName: league ? league.name : 'Unknown League',
                    flightName: flight.flight_name,
                    standings_url: flight.standings_url,
                    league_type: flight.league_type,
                    day_of_week: league ? league.day_of_week : 'Unknown day',
                    start_time: league ? league.start_time : 'Unknown Time',
                };
            });
            setLeagueOptions(newOptions);
        }
    }, [leagues, leagueFlights]);

    // Generic Function to Extract Any ASCII Table
    const extractTableData = (preText: string, sectionTitle: string): DynamicTableRow[] => {
        const lines = preText.split('\n'); // Split text into lines
    
        // Find the start of the requested section
        const startIndex = lines.findIndex(line => line.includes(sectionTitle));
    
        if (startIndex === -1) {
            console.error(`Section "${sectionTitle}" not found!`);
            return [];
        }
    
        // Extract only the relevant part of the table
        const tableLines = lines.slice(startIndex).filter(line => line.includes('|')); // Get lines with '|'
    
        if (tableLines.length < 3) { // Ensure there's enough data
            console.error(`Not enough data found for "${sectionTitle}"`);
            return [];
        }
    
        const headers = tableLines[0] // First row contains column headers
            .split('|')
            .map(e => e.trim())
            .filter(Boolean); // Remove empty headers
    
        const tableData: DynamicTableRow[] = []; // Store parsed rows
    
        tableLines.slice(1).forEach(line => { // Start processing after the separator row
            if (line.includes('----')) return; // Ignore separator lines
    
            const parts = line.split('|').map(e => e.trim()).filter(Boolean); // Clean row data
    
            if (parts.length === headers.length) { // Ensure row matches header count
                const row: DynamicTableRow = {}; // Dynamically create object
    
                headers.forEach((header, index) => {
                    const value = parts[index];
    
                    // Convert numeric values, keeping text fields intact
                    row[header] = isNaN(Number(value)) ? value : Number(value);
                });
    
                tableData.push(row);
            }
        });
    
        return tableData;
    };
    

    // Extract Data from HTML and Store in State
    const extractStandingsData = useCallback((fullHtml: string) => {
        const $ = cheerio.load(fullHtml);
        const preText = $('pre').text().trim();
    
        // Parse the data tables dynamically
        const parsedTeamStandings = extractTableData(preText, "Team Standings, sorted by Percent Wins");
        const parsedLastMatchResults = extractTableData(preText, "Last Match Results");
        const parsedX01Data = extractTableData(preText, "All X01 games,");
        const parsedCricketData = extractTableData(preText, "All Cricket games,");

        // Use functional updates to avoid stale state issues
        setTeamStandings(() => parsedTeamStandings);
        setLastMatchResults(() => parsedLastMatchResults);
        setX01Data(() => parsedX01Data);
        setCricketData(() => parsedCricketData);
    
    }, []); // No dependencies, ensures function reference stays the same

    // Fetch Standings
    const fetchStandings = useCallback(async () => {
        if (!selectedFlight?.standings_url) return;
    
        setStandingsLoading(true);
        setStandingsError(null);
        try {
            const response = await fetch('/.netlify/functions/get-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: selectedFlight.standings_url }),
            });
    
            if (!response.ok) throw new Error(`Failed to fetch standings: ${response.statusText}`);
    
            const result = await response.json();
            const fullHtml = result.data;
            extractStandingsData(fullHtml); // Now stable inside useCallback
        } catch (err) {
            setStandingsError((err as Error).message || 'An unexpected error occurred while fetching the standings.');
        } finally {
            setStandingsLoading(false);
        }
    }, [selectedFlight?.standings_url, extractStandingsData]); // ✅ Only necessary dependencies
    

    // Fetch Standings when selectedFlight Changes
    useEffect(() => {
        fetchStandings();
    }, [fetchStandings]);


    // Handle Flight Change
    const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        const selected = leagueOptions.find(
            (option) => `${option.leagueName} - ${option.flightName}` === selectedValue
        );
        setSelectedFlight(selected || null);
    };

    const StandingsTable: React.FC<{ title: string; data: DynamicTableRow[] }> = ({ title, data }) => {
        const [sortColumn, setSortColumn] = useState<string | null>(null);
        const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
        
        if (!data || data.length === 0) return null; // Avoid rendering empty tables
    
        const headers = Object.keys(data[0]); // Extract column names dynamically
    
        // **Sort Data**
        const sortedData = [...data].sort((a, b) => {
            if (!sortColumn) return 0; // If no column is selected, don't sort
            const valA = a[sortColumn] ?? '';
            const valB = b[sortColumn] ?? '';
    
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            } else {
                return sortOrder === 'asc'
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            }
        });
    
        // **Handle Column Click**
        const handleSort = (column: string) => {
            if (sortColumn === column) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); // Toggle order
            } else {
                setSortColumn(column);
                setSortOrder('desc'); // Default to ascending on new column
            }
        };
    
        return (
            <div className="bg-[var(--card-background)] p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-[var(--card-highlight)]">
                                {headers.map((header) => (
                                    <th
                                        key={header}
                                        className="text-left font-medium text-[var(--card-text)] p-2 cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort(header)}
                                    >
                                        {header} {sortColumn === header ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="odd:bg-[var(--table-odd-row)] even:bg-[var(--table-even-row)] border-none">
                                    {headers.map((header, colIndex) => (
                                        <td key={colIndex} className="text-[var(--card-text)] p-2 whitespace-nowrap">
                                            {row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    
    

    return (
        <div className="p-4">    
            {loading && <p>Loading leagues and flights...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
    
            {!loading && !error && (
                <>
                    <div>
                        <label htmlFor="leagueSelect" className="block text-sm font-medium">Select a Flight:</label>
                        <select
                            id="leagueSelect"
                            className="mt-1 p-2 border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                            onChange={handleFlightChange}
                            value={selectedFlight ? `${selectedFlight.leagueName} - ${selectedFlight.flightName}` : ""}
                        >
                            <option value=""> -- Select a Flight --</option>
                            {leagueOptions.map((option, index) => (
                                <option key={index} value={`${option.leagueName} - ${option.flightName}`}>
                                    {`${option.leagueName} - ${option.flightName} (${option.day_of_week} ${option.start_time})`}
                                </option>
                            ))}
                        </select>
                    </div>
    
                    {standingsLoading && <p>Loading standings...</p>}
                    {standingsError && <p className="text-red-500">Error: {standingsError}</p>}
    
                    {selectedFlight && !standingsLoading && !standingsError && (
                        <div className="mt-6">
                            <div>
                                <hr className="my-4" />
                            </div>
    
                            {/* Render Standings Tables */}
                            <div className="space-y-6">
                                {teamStandings.length > 0 && (
                                    <StandingsTable title="Team Standings" data={teamStandings} />
                                )}
                                {lastMatchResults.length > 0 && (
                                    <StandingsTable title="Last Match Results" data={lastMatchResults} />
                                )}
                                {x01Data.length > 0 && (
                                    <StandingsTable title="X01 Stats" data={x01Data} />
                                )}
                                {cricketData.length > 0 && (
                                    <StandingsTable title="Cricket Stats" data={cricketData} />
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
    
};

export default LeagueStandingsModal;
