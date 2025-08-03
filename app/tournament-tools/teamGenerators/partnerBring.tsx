'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from '../types';

const ItemType = 'PLAYER';

interface PlayerCardProps {
  player: { name: string; ppd: number; mpr: number; paid: boolean };
  index: number;
  swapPlayers: (fromIndex: number, toIndex: number, fromListType: 'player1List' | 'player2List', toListType: 'player1List' | 'player2List') => void;
  listType: 'player1List' | 'player2List';
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
    drop(item: { index: number; listType: 'player1List' | 'player2List' }) {
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

// Main Component: Manages team generation and drag-and-drop for Partner Bring format
const PartnerBringTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void; isReadOnly?: boolean }> = ({
  tournament,
  onUpdate,
  isReadOnly = false,
}) => {
  // State Management
  const [player1List, setPlayer1List] = useState<Tournament['players']>([]); // First player of each pair
  const [player2List, setPlayer2List] = useState<Tournament['players']>([]); // Second player of each pair
  const [error, setError] = useState<string | null>(null); // Error message for database updates
  const initializedTournamentId = useRef<string | null>(null); // Tracks if tournament has been initialized

  // Builds team objects from player lists for database storage
  const generateTeams = (player1List: Tournament['players'], player2List: Tournament['players']): { name: string; players: string[] }[] => {
    return player1List.map((player1, index) => {
      const player2 = player2List[index];
      const p1FirstName = player1.name.split(' ')[0];
      if (player2) {
        const p2FirstName = player2.name.split(' ')[0];
        return { name: `${p1FirstName} and ${p2FirstName}`, players: [player1.name, player2.name] };
      }
      return { name: p1FirstName, players: [player1.name] };
    });
  };

  // Updates the tournament teams in the database and notifies parent component
  const updateTeamsInDB = useCallback(
    async (player1List: Tournament['players'], player2List: Tournament['players']) => {
      if (isReadOnly) return;
      try {
        const teams = generateTeams(player1List, player2List);
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
    [tournament.id, onUpdate, isReadOnly]
  );

  // Initialization Effect: Sets up teams on load or when teams are empty
  useEffect(() => {
    if (tournament.teams.length === 0 && tournament.players.length > 0 && !isReadOnly) {
      // Initial load or regeneration: split players
      (async () => {
        // Splits players into two lists (Player 1 and Player 2) alternately
        const newPlayer1List = [];
        const newPlayer2List = [];
        for (let i = 0; i < tournament.players.length; i++) {
          if (i % 2 === 0) {
            newPlayer1List.push(tournament.players[i]);
          } else {
            newPlayer2List.push(tournament.players[i]);
          }
        }
        setPlayer1List(newPlayer1List);
        setPlayer2List(newPlayer2List);
        await updateTeamsInDB(newPlayer1List, newPlayer2List);
        initializedTournamentId.current = tournament.id;
      })();
    } else if (initializedTournamentId.current !== tournament.id && tournament.players.length > 0) {
      // Load existing teams from database if not yet initialized
      const newPlayer1List = tournament.teams.map(team => team.players[0]).map(name => {
        const player = tournament.players.find(p => p.name === name);
        return player || { name, ppd: 0, mpr: 0, paid: false };
      });
      const newPlayer2List = tournament.teams
        .filter(team => team.players.length > 1)
        .map(team => team.players[1])
        .map(name => {
          const player = tournament.players.find(p => p.name === name);
          return player || { name, ppd: 0, mpr: 0, paid: false };
        });
      setPlayer1List(newPlayer1List);
      setPlayer2List(newPlayer2List);
      initializedTournamentId.current = tournament.id;
    }
  }, [tournament.id, tournament.players, tournament.teams, isReadOnly, updateTeamsInDB]);

  // Handles drag-and-drop swapping of players between lists
  const swapPlayers = async (
    fromIndex: number,
    toIndex: number,
    fromListType: 'player1List' | 'player2List',
    toListType: 'player1List' | 'player2List'
  ) => {
    if (isReadOnly) return;

    const updatedPlayer1List = [...player1List];
    const updatedPlayer2List = [...player2List];

    if (fromListType === toListType) {
      const players = fromListType === 'player1List' ? updatedPlayer1List : updatedPlayer2List;
      [players[fromIndex], players[toIndex]] = [players[toIndex], players[fromIndex]];
    } else {
      const fromPlayers = fromListType === 'player1List' ? updatedPlayer1List : updatedPlayer2List;
      const toPlayers = toListType === 'player1List' ? updatedPlayer1List : updatedPlayer2List;
      [fromPlayers[fromIndex], toPlayers[toIndex]] = [toPlayers[toIndex], fromPlayers[fromIndex]];
    }

    setPlayer1List(updatedPlayer1List);
    setPlayer2List(updatedPlayer2List);
    await updateTeamsInDB(updatedPlayer1List, updatedPlayer2List);
  };

  // Render UI
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[var(--text-highlight)]">Partner Bring</h2>
        {error && !isReadOnly && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 1</h4>
              <div className="min-h-[100px]">
                {player1List.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="player1List"
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md text-[var(--card-title)] mb-2">Player 2</h4>
              <div className="min-h-[100px]">
                {player2List.map((player, index) => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    index={index}
                    swapPlayers={swapPlayers}
                    listType="player2List"
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default PartnerBringTeams;