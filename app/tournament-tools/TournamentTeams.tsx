'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { FaTools, FaSyncAlt } from 'react-icons/fa';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabaseClient';
import { Tournament } from './types';
import { tournamentTypes } from './teamGenerators';

type TeamGeneratorProps = {
  tournament: Tournament;
  onUpdate: (updatedTournament: Tournament) => void;
  isReadOnly?: boolean;
};

const teamGeneratorComponents: Record<string, React.ComponentType<TeamGeneratorProps>> = Object.fromEntries(
  tournamentTypes.map(({ name, fileName }) => [
    name,
    dynamic(() => import(`./teamGenerators/${fileName}`), { ssr: false }) as React.ComponentType<TeamGeneratorProps>
  ])
);

const TournamentTeams: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({
  tournament,
  onUpdate,
}) => {
  const isReadOnly = tournament.tournament_completed ?? false;

  const regenerateTeams = async () => {
    if (isReadOnly) return;
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ teams: [] })
        .eq('id', tournament.id);

      if (error) {
        console.error('Error clearing teams for regeneration:', error.message);
        alert('Failed to regenerate teams. Please try again.');
        return;
      }

      const updatedTournament = { ...tournament, teams: [] };
      onUpdate(updatedTournament);
    } catch (err) {
      console.error('Unexpected error regenerating teams:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const renderTeamGenerator = () => {
    if (!tournament.tournament_type || !teamGeneratorComponents[tournament.tournament_type]) {
      return (
        <p className="text-[var(--card-text)] text-center">
          Unsupported tournament type: {tournament.tournament_type || 'None'}
        </p>
      );
    }
    const Component = teamGeneratorComponents[tournament.tournament_type];
    return <Component tournament={tournament} onUpdate={onUpdate} isReadOnly={isReadOnly} />;
  };

  return (
    <section className="p-4">
      <div className="mb-4">{renderTeamGenerator()}</div>
      <div className="flex justify-between mt-8">
        <TournamentHelper tournament={tournament} isReadOnly={isReadOnly} />
        <Button
          onClick={regenerateTeams}
          icon={<FaSyncAlt />}
          iconPosition="left"
          className={`w-auto bg-[var(--color5)] ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isReadOnly}
        >
          Regenerate Teams
        </Button>
      </div>
    </section>
  );
};

export const TournamentHelper: React.FC<{ tournament: Tournament; isReadOnly?: boolean }> = ({
  tournament,
  isReadOnly = false,
}) => {
  const leagueleaderWindowRef = React.useRef<Window | null>(null);

  const leagueleaderWindowWidth = 800;
  const toolbarWindowWidth = 400;
  const windowHeight = 600;

  const calculatePositions = () => {
    const screenWidth = window.screen.availWidth;
    const totalWidth = leagueleaderWindowWidth + toolbarWindowWidth;
    const leftPosition = (screenWidth - totalWidth) / 2;

    return {
      leagueleaderLeft: leftPosition,
      toolbarLeft: leftPosition + leagueleaderWindowWidth,
    };
  };

  const openOrFocusLeagueleaderWindow = (left: number) => {
    if (leagueleaderWindowRef.current && !leagueleaderWindowRef.current.closed) {
      leagueleaderWindowRef.current.focus();
      return;
    }

    leagueleaderWindowRef.current = window.open(
      'https://leagueleader.net',
      'leagueleaderWindow',
      `width=${leagueleaderWindowWidth},height=${windowHeight},resizable=yes,scrollbars=yes,left=${left},top=100`
    );
  };

  const openOrFocusToolbarWindow = (left: number) => {
    if (isReadOnly) return;

    const teams = tournament.teams.length > 0 ? tournament.teams : [];
    const tournamentData = { ...tournament, teams };

    const popup = window.open(
      '/tournament-helper.html',
      'tournamentHelper',
      `width=${toolbarWindowWidth},height=${windowHeight},left=${left},top=100,resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
      setTimeout(() => {
        popup.postMessage({ type: 'updateTournament', data: tournamentData }, '*');
      }, 200);
    } else {
      alert('Popup blocked. Please allow popups for this site.');
    }
  };

  const handleWindows = () => {
    if (isReadOnly) return;

    const { leagueleaderLeft, toolbarLeft } = calculatePositions();
    openOrFocusLeagueleaderWindow(leagueleaderLeft);
    openOrFocusToolbarWindow(toolbarLeft);
  };

  return (
    <Button
      onClick={handleWindows}
      icon={<FaTools />}
      iconPosition="left"
      className={`w-auto ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isReadOnly}
    >
      Tournament Helper
    </Button>
  );
};

export default TournamentTeams;