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
  swapPlayers: (fromIndex: number, toIndex: number, fromListType: 'aPlayers' | 'bPlayers', toListType: 'aPlayers' | 'bPlayers') => void;
  listType: 'aPlayers' | 'bPlayers';
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
    drop(item: { index: number; listType: 'aPlayers' | 'bPlayers' }) {
      if (!isReadOnly && (item.index !== index || item.listType !== listType)) {
        swapPlayers(item.index, index, item.listType, listType);
      }
    },
  });

  if (!isReadOnly) {
    drag(drop(ref));
  }

  return (
    <div
      ref={ref}
      className={`p-2 bg-[var(--drag-card-background)] rounded-md shadow-sm text-[var(--drag-card-text)] mb-2 ${
        isReadOnly ? 'cursor-default' : 'cursor-move'
      }`}
      title={
        sortStat === 'combo'
          ? `Combo: ${(player.ppd + player.mpr * 10).toFixed(2)}`
          : sortStat === 'ppd'
          ? `PPD: ${player.ppd.toFixed(2)}`
          : `MPR: ${player.mpr.toFixed(2)}`
      }
    >
      {player.name}
    </div>
  );
};

// Main Component: Manages team generation and drag-and-drop for A/B Draw format
const ABDrawTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void; isReadOnly?: boolean }> = ({
  tournament,
  onUpdate,
  isReadOnly = false,
}) => {
  // State Management
  const [aPlayers, setAPlayers] = useState<Tournament['players']>([]); // Higher stat players
  const [bPlayers, setBPlayers] = useState<Tournament['players']>([]); // Lower stat players
  const [error, setError] = useState<string | null>(null); // Error message for database updates
  const [activeShuffle, setActiveShuffle] = useState<'aPlayers' | 'bPlayers' | null>(null); // Tracks shuffle animation state
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
  const generateTeams = useCallback((aPlayersList: Tournament['players'], bPlayersList: Tournament['players']) => {
    return aPlayersList.map((aPlayer, index) => {
      const bPlayer = bPlayersList[index];
      const aFirstName = aPlayer.name.split(' ')[0];
      if (bPlayer) {
        const bFirstName = bPlayer.name.split(' ')[0];
        return { name: `${aFirstName} and ${bFirstName}`, players: [aPlayer.name, bPlayer.name] };
      }
      return { name: aFirstName, players: [aPlayer.name] };
    });
  }, []);

  // Updates the tournament teams in the database and notifies parent component
  const updateTeamsInDB = useCallback(
    async (aPlayersList: Tournament['players'], bPlayersList: Tournament['players']) => {
      if (isReadOnly) return;
      try {
        const teams = generateTeams(aPlayersList, bPlayersList);
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
    [tournament.id, generateTeams, onUpdate, isReadOnly]
  );

  // Sorts players by the specified stat and assigns them to A (top half) and B (bottom half) lists
  const dividePlayers = useCallback(
    async (stat: 'combo' | 'ppd' | 'mpr') => {
      if (isReadOnly) return;
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        const statA = getPlayerStat(a, stat);
        const statB = getPlayerStat(b, stat);
        return statB - statA; // Descending order (highest to lowest)
      });

      const middleIndex = Math.ceil(sortedPlayers.length / 2);
      const newAPlayers = sortedPlayers.slice(0, middleIndex); // Top half
      const newBPlayers = sortedPlayers.slice(middleIndex); // Bottom half

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setSortStat(stat);
      await updateTeamsInDB(newAPlayers, newBPlayers);
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
      const newAPlayers = tournament.teams.map(team => team.players[0]).map(name => {
        const player = tournament.players.find(p => p.name === name);
        return player || { name, ppd: 0, mpr: 0, paid: false };
      });
      const newBPlayers = tournament.teams
        .filter(team => team.players.length > 1)
        .map(team => team.players[1])
        .map(name => {
          const player = tournament.players.find(p => p.name === name);
          return player || { name, ppd: 0, mpr: 0, paid: false };
        });
      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, dividePlayers, isReadOnly]);

  // Handles drag-and-drop swapping of players between lists
  const swapPlayers = useCallback(
    async (
      fromIndex: number,
      toIndex: number,
      fromListType: 'aPlayers' | 'bPlayers',
      toListType: 'aPlayers' | 'bPlayers'
    ) => {
      if (isReadOnly) return;

      const updatedAPlayers = [...aPlayers];
      const updatedBPlayers = [...bPlayers];

      if (fromListType === toListType) {
        const players = fromListType === 'aPlayers' ? updatedAPlayers : updatedBPlayers;
        [players[fromIndex], players[toIndex]] = [players[toIndex], players[fromIndex]];
      } else {
        const fromPlayers = fromListType === 'aPlayers' ? updatedAPlayers : updatedBPlayers;
        const toPlayers = toListType === 'aPlayers' ? updatedAPlayers : updatedBPlayers;
        [fromPlayers[fromIndex], toPlayers[toIndex]] = [toPlayers[toIndex], fromPlayers[fromIndex]];
      }

      setAPlayers(updatedAPlayers);
      setBPlayers(updatedBPlayers);
      await updateTeamsInDB(updatedAPlayers, updatedBPlayers);
    },
    [aPlayers, bPlayers, updateTeamsInDB, isReadOnly]
  );

  // Shuffles a specific group of players with animation
  const shufflePlayers = useCallback(
    async (
      groupSetter: React.Dispatch<React.SetStateAction<Tournament['players']>>,
      players: Tournament['players'],
      groupType: 'aPlayers' | 'bPlayers'
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
      setAPlayers(updatedAPlayers);
      setBPlayers(updatedBPlayers);
      await updateTeamsInDB(updatedAPlayers, updatedBPlayers);
    },
    [aPlayers, bPlayers, updateTeamsInDB, isReadOnly]
  );

  // Render UI
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--text-highlight)]">A/B Draw</h2>
        {error && !isReadOnly && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          <div className="text-[var(--card-text)]">
            Re-sort players by:
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ABDrawTeams;