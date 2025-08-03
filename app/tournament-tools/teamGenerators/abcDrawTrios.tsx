'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaRandom } from 'react-icons/fa';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean };
  index: number;
  swapPlayers: (
    fromIndex: number,
    toIndex: number,
    fromListType: 'aPlayers' | 'bPlayers' | 'cPlayers',
    toListType: 'aPlayers' | 'bPlayers' | 'cPlayers'
  ) => void;
  listType: 'aPlayers' | 'bPlayers' | 'cPlayers';
  sortStat: 'combo' | 'ppd' | 'mpr';
  isReadOnly?: boolean;
}

// PlayerCard Component: Renders a draggable player card with stats tooltip
const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, swapPlayers, listType, sortStat, isReadOnly = false }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index, listType },
    canDrag: () => !isReadOnly,
  });

  const [, drop] = useDrop({
    accept: ItemType,
    drop(item: { index: number; listType: 'aPlayers' | 'bPlayers' | 'cPlayers' }) {
      if (!isReadOnly && (item.index !== index || item.listType !== listType)) {
        swapPlayers(item.index, index, item.listType, listType);
      }
    },
  });

  if (!isReadOnly) {
    drag(drop(ref));
  }

  const tooltipText =
    sortStat === 'combo'
      ? `Combo: ${(player.ppd + player.mpr * 10).toFixed(2)}`
      : sortStat === 'ppd'
      ? `PPD: ${player.ppd.toFixed(2)}`
      : `MPR: ${player.mpr.toFixed(2)}`;

  return (
    <div
      ref={ref}
      className={`p-2 bg-[var(--drag-card-background)] rounded-md shadow-sm text-[var(--drag-card-text)] mb-2 ${
        isReadOnly ? 'cursor-default' : 'cursor-move'
      }`}
      title={tooltipText}
    >
      {player.name}
    </div>
  );
};

// Main Component: Manages team generation and drag-and-drop for ABC Draw Trios format
const AbcDrawTriosTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void; isReadOnly?: boolean }> = ({
  tournament,
  onUpdate,
  isReadOnly = false,
}) => {
  // State Management
  const [aPlayers, setAPlayers] = useState<Tournament['players']>([]); // Top third (highest stats)
  const [bPlayers, setBPlayers] = useState<Tournament['players']>([]); // Middle third
  const [cPlayers, setCPlayers] = useState<Tournament['players']>([]); // Bottom third
  const [error, setError] = useState<string | null>(null); // Error message for database updates
  const [activeShuffle, setActiveShuffle] = useState<'aPlayers' | 'bPlayers' | 'cPlayers' | null>(null); // Tracks shuffle animation state
  const [sortStat, setSortStat] = useState<'combo' | 'ppd' | 'mpr'>('combo'); // Current sorting statistic
  const initializedTournamentId = useRef<string | null>(null); // Tracks if tournament has been initialized

  // Utility Functions
  // Calculates a player's stat based on the selected type (combo, ppd, or mpr)
  const getPlayerStat = useCallback((player: Tournament['players'][0], stat: 'combo' | 'ppd' | 'mpr') => {
    switch (stat) {
      case 'combo':
        return player.ppd + player.mpr * 10;
      case 'ppd':
        return player.ppd;
      case 'mpr':
        return player.mpr;
      default:
        return player.ppd + player.mpr * 10; // Fallback to combo
    }
  }, []);

  // Builds team objects from player lists for database storage
  const generateTeams = useCallback((aPlayersList: Tournament['players'], bPlayersList: Tournament['players'], cPlayersList: Tournament['players']) => {
    return aPlayersList.map((aPlayer, index) => {
      const bPlayer = bPlayersList[index];
      const cPlayer = cPlayersList[index];
      const aFirstName = aPlayer.name.split(' ')[0];
      if (bPlayer && cPlayer) {
        const bFirstName = bPlayer.name.split(' ')[0];
        const cFirstName = cPlayer.name.split(' ')[0];
        return { name: `${aFirstName} and ${bFirstName} and ${cFirstName}`, players: [aPlayer.name, bPlayer.name, cPlayer.name] };
      } else if (bPlayer) {
        const bFirstName = bPlayer.name.split(' ')[0];
        return { name: `${aFirstName} and ${bFirstName}`, players: [aPlayer.name, bPlayer.name] };
      }
      return { name: aFirstName, players: [aPlayer.name] };
    });
  }, []);

  // Updates the tournament teams in the database and notifies parent component
  const updateTeamsInDB = useCallback(
    async (aPlayersList: Tournament['players'], bPlayersList: Tournament['players'], cPlayersList: Tournament['players']) => {
      if (isReadOnly) return;
      try {
        const teams = generateTeams(aPlayersList, bPlayersList, cPlayersList);
        const { data, error } = await supabase
          .from('tournaments')
          .update({ teams })
          .eq('id', tournament.id)
          .select()
          .single();
        if (error) throw error;
        onUpdate(data);
      } catch (err) {
        console.error('Error updating teams:', (err as Error).message);
        setError('Failed to update teams in database.');
      }
    },
    [tournament.id, onUpdate, isReadOnly, generateTeams]
  );

  // Sorts players by the specified stat and assigns them to A (top third), B (middle third), and C (bottom third) lists
  const dividePlayers = useCallback(
    async (stat: 'combo' | 'ppd' | 'mpr') => {
      if (isReadOnly) return;
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        const statA = getPlayerStat(a, stat);
        const statB = getPlayerStat(b, stat);
        return statB - statA; // High to low (descending order)
      });

      const third = Math.ceil(sortedPlayers.length / 3);
      const newAPlayers = sortedPlayers.slice(0, third); // Top third (highest stats)
      const newBPlayers = sortedPlayers.slice(third, third * 2); // Middle third
      const newCPlayers = sortedPlayers.slice(third * 2); // Bottom third

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setCPlayers(newCPlayers);
      setSortStat(stat);
      await updateTeamsInDB(newAPlayers, newBPlayers, newCPlayers);
    },
    [tournament.players, getPlayerStat, updateTeamsInDB, isReadOnly]
  );

  // Initialization Effect: Sets up teams on load or when teams are empty
  useEffect(() => {
    if (tournament.teams.length === 0 && tournament.players.length > 0 && !isReadOnly) {
      // Initial load or regeneration: sort by combo
      (async () => {
        await dividePlayers('combo');
        initializedTournamentId.current = tournament.id;
      })();
    } else if (initializedTournamentId.current !== tournament.id && tournament.players.length > 0) {
      // Load existing teams from database if not yet initialized
      const newAPlayers: Tournament['players'] = [];
      const newBPlayers: Tournament['players'] = [];
      const newCPlayers: Tournament['players'] = [];

      tournament.teams.forEach(team => {
        if (team.players.length >= 1) {
          const aPlayer = tournament.players.find(p => p.name === team.players[0]);
          newAPlayers.push(aPlayer || { name: team.players[0], ppd: 0, mpr: 0, paid: false });
        }
        if (team.players.length >= 2) {
          const bPlayer = tournament.players.find(p => p.name === team.players[1]);
          newBPlayers.push(bPlayer || { name: team.players[1], ppd: 0, mpr: 0, paid: false });
        }
        if (team.players.length >= 3) {
          const cPlayer = tournament.players.find(p => p.name === team.players[2]);
          newCPlayers.push(cPlayer || { name: team.players[2], ppd: 0, mpr: 0, paid: false });
        }
      });

      const maxLength = Math.max(newAPlayers.length, newBPlayers.length, newCPlayers.length);
      while (newAPlayers.length < maxLength) newAPlayers.push({ name: '', ppd: 0, mpr: 0, paid: false });
      while (newBPlayers.length < maxLength) newBPlayers.push({ name: '', ppd: 0, mpr: 0, paid: false });
      while (newCPlayers.length < maxLength) newCPlayers.push({ name: '', ppd: 0, mpr: 0, paid: false });

      setAPlayers(newAPlayers.filter(p => p.name));
      setBPlayers(newBPlayers.filter(p => p.name));
      setCPlayers(newCPlayers.filter(p => p.name));
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, dividePlayers, isReadOnly]);

  // Handles drag-and-drop swapping of players between lists
  const swapPlayers = useCallback(
    async (
      fromIndex: number,
      toIndex: number,
      fromListType: 'aPlayers' | 'bPlayers' | 'cPlayers',
      toListType: 'aPlayers' | 'bPlayers' | 'cPlayers'
    ) => {
      if (isReadOnly) return;

      const updatedAPlayers = [...aPlayers];
      const updatedBPlayers = [...bPlayers];
      const updatedCPlayers = [...cPlayers];

      const sourceList = fromListType === 'aPlayers' ? updatedAPlayers : fromListType === 'bPlayers' ? updatedBPlayers : updatedCPlayers;
      const targetList = toListType === 'aPlayers' ? updatedAPlayers : toListType === 'bPlayers' ? updatedBPlayers : updatedCPlayers;

      if (fromIndex < sourceList.length && toIndex < targetList.length) {
        [sourceList[fromIndex], targetList[toIndex]] = [targetList[toIndex], sourceList[fromIndex]];
      }

      setAPlayers(updatedAPlayers);
      setBPlayers(updatedBPlayers);
      setCPlayers(updatedCPlayers);
      await updateTeamsInDB(updatedAPlayers, updatedBPlayers, updatedCPlayers);
    },
    [aPlayers, bPlayers, cPlayers, updateTeamsInDB, isReadOnly]
  );

  // Shuffles a specific group of players with animation
  const shufflePlayers = useCallback(
    async (
      groupSetter: React.Dispatch<React.SetStateAction<Tournament['players']>>,
      players: Tournament['players'],
      groupType: 'aPlayers' | 'bPlayers' | 'cPlayers'
    ) => {
      if (isReadOnly) return;
      setActiveShuffle(groupType);
      const shuffleTimes = 20;
      const intervalTime = 50;
      let shuffleCount = 0;
      const shuffled = [...players];

      await new Promise<void>((resolve) => {
        const shuffleInterval = setInterval(() => {
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          groupSetter([...shuffled]);
          shuffleCount++;

          if (shuffleCount >= shuffleTimes) {
            clearInterval(shuffleInterval);
            setActiveShuffle(null);
            resolve();
          }
        }, intervalTime);
      });

      const updatedAPlayers = groupType === 'aPlayers' ? shuffled : aPlayers;
      const updatedBPlayers = groupType === 'bPlayers' ? shuffled : bPlayers;
      const updatedCPlayers = groupType === 'cPlayers' ? shuffled : cPlayers;
      setAPlayers(updatedAPlayers);
      setBPlayers(updatedBPlayers);
      setCPlayers(updatedCPlayers);
      await updateTeamsInDB(updatedAPlayers, updatedBPlayers, updatedCPlayers);
    },
    [aPlayers, bPlayers, cPlayers, updateTeamsInDB, isReadOnly]
  );

  // Render UI
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--text-highlight)]">ABC Draw Trios</h2>
        {error && !isReadOnly && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          <div className="text-[var(--card-text)]">
            Sort players by:
            <div className="flex gap-2 mt-1">
              <Button
                onClick={() => dividePlayers('combo')}
                disabled={isReadOnly}
                className={`w-20 text-sm ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Combo
              </Button>
              <Button
                onClick={() => dividePlayers('ppd')}
                disabled={isReadOnly}
                className={`w-20 text-sm ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                PPD
              </Button>
              <Button
                onClick={() => dividePlayers('mpr')}
                disabled={isReadOnly}
                className={`w-20 text-sm ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                MPR
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">A Players</h4>
              <div className="min-h-[100px]">
                {aPlayers.length > 0 ? (
                  aPlayers.map((player, index) => (
                    <PlayerCard
                      key={player.name}
                      player={player}
                      index={index}
                      swapPlayers={swapPlayers}
                      listType="aPlayers"
                      sortStat={sortStat}
                      isReadOnly={isReadOnly}
                    />
                  ))
                ) : (
                  <p className="text-[var(--card-text)] text-center">No A Players</p>
                )}
              </div>
              <div className="flex justify-center mt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isReadOnly) shufflePlayers(setAPlayers, aPlayers, 'aPlayers');
                  }}
                  className={`text-[var(--text-highlight)] ${isReadOnly ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-70'}`}
                >
                  <FaRandom className={activeShuffle === 'aPlayers' && !isReadOnly ? 'animate-spin' : ''} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">B Players</h4>
              <div className="min-h-[100px]">
                {bPlayers.length > 0 ? (
                  bPlayers.map((player, index) => (
                    <PlayerCard
                      key={player.name}
                      player={player}
                      index={index}
                      swapPlayers={swapPlayers}
                      listType="bPlayers"
                      sortStat={sortStat}
                      isReadOnly={isReadOnly}
                    />
                  ))
                ) : (
                  <p className="text-[var(--card-text)] text-center">No B Players</p>
                )}
              </div>
              <div className="flex justify-center mt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isReadOnly) shufflePlayers(setBPlayers, bPlayers, 'bPlayers');
                  }}
                  className={`text-[var(--text-highlight)] ${isReadOnly ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-70'}`}
                >
                  <FaRandom className={activeShuffle === 'bPlayers' && !isReadOnly ? 'animate-spin' : ''} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">C Players</h4>
              <div className="min-h-[100px]">
                {cPlayers.length > 0 ? (
                  cPlayers.map((player, index) => (
                    <PlayerCard
                      key={player.name}
                      player={player}
                      index={index}
                      swapPlayers={swapPlayers}
                      listType="cPlayers"
                      sortStat={sortStat}
                      isReadOnly={isReadOnly}
                    />
                  ))
                ) : (
                  <p className="text-[var(--card-text)] text-center">No C Players</p>
                )}
              </div>
              <div className="flex justify-center mt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isReadOnly) shufflePlayers(setCPlayers, cPlayers, 'cPlayers');
                  }}
                  className={`text-[var(--text-highlight)] ${isReadOnly ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-70'}`}
                >
                  <FaRandom className={activeShuffle === 'cPlayers' && !isReadOnly ? 'animate-spin' : ''} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default AbcDrawTriosTeams;