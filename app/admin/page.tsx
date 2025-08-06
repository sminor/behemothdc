'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Login from '@/components/Login';
import AdminEvents from './adminEvents';
import AdminAnnouncements from './adminAnnouncements';
import AdminLocations from './adminLocations';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('Announcements');

  const checkAuthAndPermissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authenticated = !!session;
      setIsAuthenticated(authenticated);

      if (authenticated && session) {
        const { data, error } = await supabase
          .from('authorized_users')
          .select('permissions')
          .eq('id', session.user.id)
          .single();

        setPermissions(error || !data ? [] : data.permissions || []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error checking auth and permissions:', err);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndPermissions();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setIsLoading(true);

      if (authenticated && session) {
        supabase
          .from('authorized_users')
          .select('permissions')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            setPermissions(error || !data ? [] : data.permissions || []);
            setIsLoading(false);
          });
      } else {
        setPermissions([]);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    checkAuthAndPermissions(); // Re-check after login
  };

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
    return <Login onLogin={handleLogin} />;
  }

  if (!permissions.includes('admin')) {
    return (
      <div className="flex flex-col items-center min-h-screen">
        <NavBar currentPage="admin" hideButtons={true} />
        <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
          <p className="text-red-500">You are not authorized to access the Admin Panel. Contact the admin.</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} onLogout={handleLogout} />
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

          <div className="p-4 bg-[var(--card-background)] rounded-b-lg rounded-tr-lg border-t-0">
            {activeTab === 'Announcements' && <AdminAnnouncements />}
            {activeTab === 'Events' && <AdminEvents />}
            {activeTab === 'Locations' && <AdminLocations />}
          </div>
        </div>
      </div>
      <div className="flex-grow" />
      <Footer isAuthenticated={true} onLogout={handleLogout} />
    </div>
  );
}
