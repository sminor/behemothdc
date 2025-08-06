'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Login from '@/components/Login';
import AdminEvents from './adminEvents';
import AdminAnnouncements from './adminAnnouncements';  

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('Announcements');

  useEffect(() => {
    const checkAuthAndPermissions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (session) {
        const { data, error } = await supabase
          .from('authorized_users')
          .select('permissions')
          .eq('id', session.user.id)
          .single();

        setPermissions(error || !data ? [] : data.permissions || []);
      }

      setIsLoading(false);
    };

    checkAuthAndPermissions();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setPermissions([]);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center min-h-screen">
        <NavBar currentPage="admin" hideButtons={true} />
        <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer isAuthenticated={false} onLogout={handleLogout} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsLoading(true)} />;
  }

  if (!permissions.includes('admin')) {
    return (
      <div className="flex flex-col items-center min-h-screen">
        <NavBar currentPage="admin" hideButtons={true} />
        <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
          <p className="text-red-500">You are not authorized to access the Admin Panel. Contact the admin.</p>
        </div>
        <Footer isAuthenticated={true} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      <NavBar currentPage="admin" hideButtons={true} />
      <div className="w-full max-w-screen-xl mx-auto px-4">
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </header>

        {/* Tabs (matching tournament-tools style) */}
        <div className="mt-4 mb-8">
          <hr className="border-[var(--text-highlight)]" />
          <div className="mb-4 mt-4 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-highlight)]"></h2>
          </div>
          <div className="flex rounded-t-lg">
            <button
              className={`px-4 py-2 rounded-t-md mr-1 ${
                activeTab === 'Announcements'
                  ? 'bg-[var(--tab-background-active)] text-[var(--tab-text-active)]'
                  : 'bg-[var(--tab-background-inactive)] text-[var(--card-text)]'
              }`}
              onClick={() => setActiveTab('Announcements')}
            >
              Announcements
            </button>            
            <button
              className={`px-4 py-2 rounded-t-md mr-1 ${
                activeTab === 'Events'
                  ? 'bg-[var(--tab-background-active)] text-[var(--tab-text-active)]'
                  : 'bg-[var(--tab-background-inactive)] text-[var(--card-text)]'
              }`}
              onClick={() => setActiveTab('Events')}
            >
              Events
            </button>
            <button
              className={`px-4 py-2 rounded-t-md ${
                activeTab === 'Locations'
                  ? 'bg-[var(--tab-background-active)] text-[var(--tab-text-active)]'
                  : 'bg-[var(--tab-background-inactive)] text-[var(--card-text)]'
              }`}
              onClick={() => setActiveTab('Locations')}
            >
              Locations
            </button>
          </div>

          {/* Tab content area */}
          <div className="p-4 bg-[var(--card-background)] rounded-b-lg rounded-tr-lg border-t-0">
            {activeTab === 'Announcements' && <AdminAnnouncements />}
            {activeTab === 'Events' && <AdminEvents />}
            {activeTab === 'Locations' && (
              <div>
                <p>Location management coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-grow" />
      <Footer isAuthenticated={true} onLogout={handleLogout} />
    </div>
  );
}
