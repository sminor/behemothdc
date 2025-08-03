'use client';
import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Announcement from '@/components/Announcement';
import Button from '@/components/Button';
import Modal from '@/components/Modal'; // Ensure this import is correct
import LeagueSignupModal from './leagueSignupModal'; // Updated path
import LeagueSchedulesModal from './leagueSchedulesModal';
import LeagueStandingsModal from './leagueStandingsModal';
import LeagueInfoContent from './leagueInfoModal';
import { FaPencilAlt, FaInfoCircle, FaCalendarAlt, FaTrophy } from 'react-icons/fa'; // Updated import

const Leagues = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSchedulesModalOpen, setIsSchedulesModalOpen] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Navigation Bar */}
      <NavBar currentPage="Leagues" />

      {/* Global Page Wrapper */}
      <div className="w-full max-w-screen-xl mx-auto px-4">
        {/* Header */}
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold text-[var(--card-title)]">Leagues</h1>
          <p>
            {"Interested in joining a league? We offer competitive and recreational leagues for players of all skill levels."}
          </p>
        </header>

        {/* Announcement - Hidden if no announcement */}
        <section className="w-full p-4">
          <Announcement page="leagues" autoplayDelay={6000} hideIfNone />
        </section>

        {/* Buttons Section */}
        <section className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex-1">
              <Button
                icon={<FaPencilAlt size={32} aria-hidden="true" />}
                aria-label="View League Sign-up"
                onClick={() => setIsSignupModalOpen(true)}
              >
                Sign-up
              </Button>
            </div>
            <div className="flex-1">
              <Button
                icon={<FaInfoCircle size={32} aria-hidden="true" />}
                aria-label="View League Fees"
                onClick={() => setIsInfoModalOpen(true)}
              >
                Info
              </Button>
            </div>
            <div className="flex-1">
              <Button
                icon={<FaCalendarAlt size={32} aria-hidden="true" />}
                aria-label="View League Schedules"
                onClick={() => setIsSchedulesModalOpen(true)}
              >
                Schedules
              </Button>
            </div>
            <div className="flex-1">
              <Button
                icon={<FaTrophy size={32} aria-hidden="true" />}
                aria-label="View League Standings"
                onClick={() => setIsStandingsModalOpen(true)}
              >
                Standings
              </Button>
            </div>
          </div>
        </section>

        {/* Sign-up Modal */}
        <Modal
          isOpen={isSignupModalOpen}
          onClose={() => setIsSignupModalOpen(false)}
          title="League Sign-up"
          content={<LeagueSignupModal />}
        />

        {/* Info Modal */}
        <Modal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          title="League Information"
          content={<LeagueInfoContent />}
        />

        {/* Schedules Modal */}
        <Modal
          isOpen={isSchedulesModalOpen}
          onClose={() => setIsSchedulesModalOpen(false)}
          title="League Schedules"
          content={<LeagueSchedulesModal />}
        />

        {/* Standings Modal */}
        <Modal
          isOpen={isStandingsModalOpen}
          onClose={() => setIsStandingsModalOpen(false)}
          title="League Standings"
          content={<LeagueStandingsModal />}
        />
      </div> {/* End of Global Wrapper */}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Leagues;