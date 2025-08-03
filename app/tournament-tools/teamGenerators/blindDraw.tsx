'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaRandom } from 'react-icons/fa';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean };
  index: number;
  swapPlayers: (fromIndex: number, toIndex: number, fromListType: 'aPlayers' | 'bPlayers', toListType: 'aPlayers' | 'bPlayers') => void;
  listType: 'aPlayers' | 'bPlayers';
  isReadOnly?: boolean;
}

// PlayerCard Component: Renders a draggable player card
const PlayerCard: React.FC<PlayerCardProps> = ({ player, index, swapPlayers, listType, isReadOnly = false }) => {
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
    >
      {player.name}
    </div>
  );
};

// Main Component: Manages team generation and drag-and-drop for Blind Draw format
const BlindDrawTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void; isReadOnly?: boolean }> = ({
  tournament,
  onUpdate,
  isReadOnly = false,
}) => {
  // State Management
  const [aPlayers, setAPlayers] = useState<Tournament['players']>([]); // First half of shuffled players
  const [bPlayers, setBPlayers] = useState<Tournament['players']>([]); // Second half of shuffled players
  const [isShuffling, setIsShuffling] = useState(false); // Tracks shuffle animation state
  const [error, setError] = useState<string | null>(null); // Error message for database updates
  const initializedTournamentId = useRef<string | null>(null); // Tracks if tournament has been initialized

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

  // Splits players randomly into two lists (A and B)
  const splitPlayers = useCallback(async () => {
    if (isReadOnly) return;
    const shuffledPlayers = [...tournament.players].sort(() => Math.random() - 0.5);
    const middleIndex = Math.ceil(shuffledPlayers.length / 2);
    const newAPlayers = shuffledPlayers.slice(0, middleIndex);
    const newBPlayers = shuffledPlayers.slice(middleIndex);
    setAPlayers(newAPlayers);
    setBPlayers(newBPlayers);
    await updateTeamsInDB(newAPlayers, newBPlayers);
  }, [tournament.players, updateTeamsInDB, isReadOnly]);

  // Initialization Effect: Sets up teams on load or when teams are empty
  useEffect(() => {
    if (tournament.teams.length === 0 && tournament.players.length > 0 && !isReadOnly) {
      // Initial load or regeneration: split players randomly
      (async () => {
        await splitPlayers();
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
  }, [tournament.id, tournament.players, tournament.teams, splitPlayers, isReadOnly]);

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

  // Shuffles all players with animation
  const shuffleAllPlayers = useCallback(
    async () => {
      if (isReadOnly) return;
      setIsShuffling(true);
      const allPlayers = [...aPlayers, ...bPlayers];
      const shuffleTimes = 20;
      const intervalTime = 50;
      let shuffleCount = 0;

      await new Promise<void>((resolve) => {
        const shuffleInterval = setInterval(() => {
          for (let i = allPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
          }
          const middleIndex = Math.ceil(allPlayers.length / 2);
          const newAPlayers = allPlayers.slice(0, middleIndex);
          const newBPlayers = allPlayers.slice(middleIndex);
          setAPlayers(newAPlayers);
          setBPlayers(newBPlayers);
          shuffleCount++;

          if (shuffleCount >= shuffleTimes) {
            clearInterval(shuffleInterval);
            setIsShuffling(false);
            resolve();
          }
        }, intervalTime);
      });

      await updateTeamsInDB(aPlayers, bPlayers);
    },
    [aPlayers, bPlayers, updateTeamsInDB, isReadOnly]
  );

  // Render UI
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--text-highlight)]">Blind Draw</h2>
        {error && !isReadOnly && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 1</h4>
              <div className="min-h-[100px]">
                {aPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="aPlayers"
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 2</h4>
              <div className="min-h-[100px]">
                {bPlayers.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="bPlayers"
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (!isReadOnly) shuffleAllPlayers();
              }}
              className={`text-[var(--text-highlight)] ${
                isReadOnly ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-70'
              }`}
            >
              <FaRandom className={isShuffling && !isReadOnly ? 'animate-spin' : ''} />
            </a>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default BlindDrawTeams;