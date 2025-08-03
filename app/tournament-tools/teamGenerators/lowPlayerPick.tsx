'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

// Constants
const ItemType = 'PLAYER';

// Interfaces
interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean } | null;
  index: number;
  movePlayer: (
    fromIndex: number,
    toIndex: number,
    fromListType: 'aPlayers' | 'bPlayers' | 'availablePlayers',
    toListType: 'aPlayers' | 'bPlayers' | 'availablePlayers'
  ) => void;
  listType: 'aPlayers' | 'bPlayers' | 'availablePlayers';
  sortStat: 'combo' | 'ppd' | 'mpr';
  isRemovePlaceholder?: boolean;
  isReadOnly?: boolean;
}

// PlayerCard Component: Renders a draggable player card with stats tooltip
const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  index,
  movePlayer,
  listType,
  sortStat,
  isRemovePlaceholder = false,
  isReadOnly = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: ItemType,
    item: { index, listType },
    canDrag: () => !!player && !isRemovePlaceholder && !isReadOnly,
  });

  const [, drop] = useDrop({
    accept: ItemType,
    drop(item: { index: number; listType: 'aPlayers' | 'bPlayers' | 'availablePlayers' }) {
      if (!isReadOnly && (item.index !== index || item.listType !== listType)) {
        movePlayer(item.index, index, item.listType, listType);
      }
    },
  });

  if (!isReadOnly) {
    drag(drop(ref));
  }

  const tooltipText = player
    ? sortStat === 'combo'
      ? `Combo: ${(player.ppd + player.mpr * 10).toFixed(2)}`
      : sortStat === 'ppd'
      ? `PPD: ${player.ppd.toFixed(2)}`
      : `MPR: ${player.mpr.toFixed(2)}`
    : isRemovePlaceholder
    ? 'Drop here to remove a player'
    : 'No player selected';

  return (
    <div
      ref={ref}
      className={`p-2 bg-[var(--drag-card-background)] rounded-md shadow-sm text-[var(--drag-card-text)] mb-2 ${
        isReadOnly || !player ? 'cursor-default opacity-50' : 'cursor-move'
      }`}
      title={tooltipText}
    >
      {player ? player.name : isRemovePlaceholder ? <i>Drop Here to Remove</i> : <i>Empty</i>}
    </div>
  );
};

// Main Component: Manages team generation and drag-and-drop for Low Player Pick format
const LowPlayerPickTeams: React.FC<{
  tournament: Tournament;
  onUpdate: (updatedTournament: Tournament) => void;
  isReadOnly?: boolean;
}> = ({ tournament, onUpdate, isReadOnly = false }) => {
  // State Management
  const [aPlayers, setAPlayers] = useState<(Tournament['players'][0] | null)[]>([]); // Placeholder slots for A players
  const [bPlayers, setBPlayers] = useState<(Tournament['players'][0] | null)[]>([]); // Lower stat players
  const [availablePlayers, setAvailablePlayers] = useState<(Tournament['players'][0] | null)[]>([]); // Higher stat players available for picking
  const [error, setError] = useState<string | null>(null); // Error message for database updates
  const [sortStat, setSortStat] = useState<'combo' | 'ppd' | 'mpr'>('combo'); // Current sorting statistic
  const initializedTournamentId = useRef<string | null>(null); // Tracks if tournament has been initialized

  // Utility Functions
  // Calculates a player's stat based on the selected type (combo, ppd, or mpr)
  const getPlayerStat = useCallback((player: Tournament['players'][0], stat: 'combo' | 'ppd' | 'mpr') => {
    switch (stat) {
      case 'combo': return player.ppd + player.mpr * 10;
      case 'ppd': return player.ppd;
      case 'mpr': return player.mpr;
      default: return player.ppd + player.mpr * 10; // Fallback to combo
    }
  }, []);

  // Builds team objects from player lists for database storage
  const buildTeamsFromLists = useCallback(
    (aPlayersList: (Tournament['players'][0] | null)[], bPlayersList: (Tournament['players'][0] | null)[]): { name: string; players: string[] }[] => {
      const regularTeams = bPlayersList.map((bPlayer, index) => {
        const aPlayer = aPlayersList[index];
        if (bPlayer) {
          const bFirstName = bPlayer.name.split(' ')[0];
          if (aPlayer) {
            const aFirstName = aPlayer.name.split(' ')[0];
            return { name: `${aFirstName} and ${bFirstName}`, players: [aPlayer.name, bPlayer.name] };
          }
          return { name: bFirstName, players: [bPlayer.name] };
        } else if (aPlayer) {
          const aFirstName = aPlayer.name.split(' ')[0];
          return { name: aFirstName, players: [aPlayer.name] };
        }
        return null;
      }).filter((team): team is { name: string; players: string[] } => team !== null);

      const available = availablePlayers.filter(p => p !== null).map(p => p!.name);
      return [...regularTeams, { name: 'Available', players: available }];
    },
    [availablePlayers]
  );

  // Updates the tournament teams in the database and notifies parent component
  const updateTeamsInDB = useCallback(
    async (aPlayersList: (Tournament['players'][0] | null)[], bPlayersList: (Tournament['players'][0] | null)[]) => {
      if (isReadOnly) return;
      try {
        const teams = buildTeamsFromLists(aPlayersList, bPlayersList);
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
    [tournament.id, buildTeamsFromLists, onUpdate, isReadOnly]
  );

  // Sorts players by the specified stat and assigns them to A (placeholders), B, and Available lists
  const dividePlayers = useCallback(
    async (stat: 'combo' | 'ppd' | 'mpr') => {
      if (isReadOnly) return;
      const sortedPlayers = [...tournament.players].sort((a, b) => getPlayerStat(b, stat) - getPlayerStat(a, stat));
      const middleIndex = Math.ceil(sortedPlayers.length / 2);
      const newAPlayers = new Array(middleIndex).fill(null); // A players are placeholders
      const newBPlayers = sortedPlayers.slice(middleIndex).reverse(); // Lower stat players
      const newAvailablePlayers = [null, ...sortedPlayers.slice(0, middleIndex)]; // Higher stat players + placeholder

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setAvailablePlayers(newAvailablePlayers);
      setSortStat(stat);
      await updateTeamsInDB(newAPlayers, newBPlayers);
    },
    [tournament.players, getPlayerStat, updateTeamsInDB, isReadOnly]
  );

  // Handles drag-and-drop movement of players between lists
  const movePlayer = useCallback(
    async (
      fromIndex: number,
      toIndex: number,
      fromListType: 'aPlayers' | 'bPlayers' | 'availablePlayers',
      toListType: 'aPlayers' | 'bPlayers' | 'availablePlayers'
    ) => {
      if (isReadOnly) return;

      const updatedAPlayers = [...aPlayers];
      const updatedBPlayers = [...bPlayers];
      const updatedAvailablePlayers = [...availablePlayers];

      const sourceList =
        fromListType === 'aPlayers' ? updatedAPlayers : fromListType === 'bPlayers' ? updatedBPlayers : updatedAvailablePlayers;
      const targetList =
        toListType === 'aPlayers' ? updatedAPlayers : toListType === 'bPlayers' ? updatedBPlayers : updatedAvailablePlayers;

      const [movedPlayer] = sourceList.splice(fromIndex, 1);
      if (!movedPlayer) return;

      if (fromListType === toListType) {
        // Move within the same list
        sourceList.splice(toIndex, 0, movedPlayer);
      } else if ((fromListType === 'aPlayers' && toListType === 'bPlayers') || (fromListType === 'bPlayers' && toListType === 'aPlayers')) {
        // Swap between A and B lists
        const displacedPlayer = targetList[toIndex];
        targetList[toIndex] = movedPlayer;
        sourceList.splice(fromIndex, 0, displacedPlayer || null);
      } else {
        if (toListType === 'availablePlayers') {
          // Move to Available list
          const displacedPlayer = targetList[toIndex];
          if (displacedPlayer) {
            targetList[toIndex] = movedPlayer;
            sourceList.splice(fromIndex, 0, displacedPlayer);
          } else {
            sourceList.splice(fromIndex, 0, null);
            targetList.splice(toIndex, 1, movedPlayer);
            if (!updatedAvailablePlayers.some(p => p === null)) {
              updatedAvailablePlayers.unshift(null); // Ensure a placeholder exists
            }
          }
        } else if (fromListType === 'availablePlayers') {
          // Move from Available list
          const displacedPlayer = targetList[toIndex];
          targetList[toIndex] = movedPlayer;
          if (displacedPlayer) {
            updatedAvailablePlayers.push(displacedPlayer);
            if (!updatedAvailablePlayers.some(p => p === null)) {
              updatedAvailablePlayers.unshift(null);
            }
          }
        }
      }

      setAPlayers(updatedAPlayers);
      setBPlayers(updatedBPlayers);
      setAvailablePlayers(updatedAvailablePlayers);
      await updateTeamsInDB(updatedAPlayers, updatedBPlayers);
    },
    [aPlayers, bPlayers, availablePlayers, updateTeamsInDB, isReadOnly]
  );

  // Initialization Effect: Sets up teams on load or after "Regenerate Teams" when teams are empty
  useEffect(() => {
    if (tournament.teams.length === 0 && tournament.players.length > 0 && !isReadOnly) {
      // Initial load or regeneration: sort by combo
      (async () => {
        await dividePlayers('combo');
        initializedTournamentId.current = tournament.id;
      })();
    } else if (initializedTournamentId.current !== tournament.id && tournament.players.length > 0) {
      // Load existing teams from database if not yet initialized
      const newAPlayers: (Tournament['players'][0] | null)[] = [];
      const newBPlayers: (Tournament['players'][0] | null)[] = [];
      const usedPlayers: string[] = [];

      tournament.teams.forEach(team => {
        if (team.name === 'Available') return;
        if (team.players.length === 2) {
          const aPlayer = tournament.players.find(p => p.name === team.players[0]);
          const bPlayer = tournament.players.find(p => p.name === team.players[1]);
          newAPlayers.push(aPlayer || { name: team.players[0], ppd: 0, mpr: 0, paid: false });
          newBPlayers.push(bPlayer || { name: team.players[1], ppd: 0, mpr: 0, paid: false });
          usedPlayers.push(...team.players);
        } else if (team.players.length === 1) {
          const bPlayer = tournament.players.find(p => p.name === team.players[0]);
          newAPlayers.push(null);
          newBPlayers.push(bPlayer || { name: team.players[0], ppd: 0, mpr: 0, paid: false });
          usedPlayers.push(team.players[0]);
        }
      });

      while (newAPlayers.length < newBPlayers.length) newAPlayers.push(null);
      while (newBPlayers.length < newAPlayers.length) newBPlayers.push(null);

      const newAvailablePlayers: (Tournament['players'][0] | null)[] = [
        null,
        ...tournament.players.filter(p => !usedPlayers.includes(p.name)),
      ];

      setAPlayers(newAPlayers);
      setBPlayers(newBPlayers);
      setAvailablePlayers(newAvailablePlayers);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, dividePlayers, isReadOnly]);

  // Render UI
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--text-highlight)]">Low Player Pick</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Sort Buttons */}
        <div className="text-[var(--card-text)]">
          Sort players by:
          <div className="flex gap-2 mt-1">
            <Button onClick={() => dividePlayers('combo')} disabled={isReadOnly} className="w-20 text-sm">
              Combo
            </Button>
            <Button onClick={() => dividePlayers('ppd')} disabled={isReadOnly} className="w-20 text-sm">
              PPD
            </Button>
            <Button onClick={() => dividePlayers('mpr')} disabled={isReadOnly} className="w-20 text-sm">
              MPR
            </Button>
          </div>
        </div>

        {/* Player Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-md text-[var(--card-title)] mb-2">A Players</h4>
            <div className="min-h-[100px]">
              {aPlayers.map((player, index) => (
                <PlayerCard
                  key={player ? player.name : `placeholder-a-${index}`}
                  player={player}
                  index={index}
                  movePlayer={movePlayer}
                  listType="aPlayers"
                  sortStat={sortStat}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-md text-[var(--card-title)] mb-2">B Players</h4>
            <div className="min-h-[100px]">
              {bPlayers.map((player, index) => (
                <PlayerCard
                  key={player ? player.name : `placeholder-b-${index}`}
                  player={player}
                  index={index}
                  movePlayer={movePlayer}
                  listType="bPlayers"
                  sortStat={sortStat}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md text-[var(--card-title)] mb-2">Available Players</h4>
          <div className="min-h-[100px]">
            {availablePlayers.map((player, index) => (
              <PlayerCard
                key={player ? player.name : `remove-placeholder-${index}`}
                player={player}
                index={index}
                movePlayer={movePlayer}
                listType="availablePlayers"
                sortStat={sortStat}
                isRemovePlaceholder={!player}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default LowPlayerPickTeams;