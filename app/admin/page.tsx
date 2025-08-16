"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Login from "@/components/Login";
import AdminEvents from "./adminEvents";
import AdminAnnouncements from "./adminAnnouncements";
import AdminLocations from "./adminLocations";
import AdminLeagues from "./adminLeagues";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"Announcements" | "Events" | "Locations" | "Leagues">(
    "Announcements"
  );

  // Helper to load permissions safely (fixes PromiseLike<void>.catch TS error)
  const loadPermissions = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("authorized_users")
        .select("permissions")
        .eq("id", userId)
        .single();

      setPermissions(error || !data ? [] : data.permissions || []);
    } catch {
      setPermissions([]);
    }
  }, []);

  // Initial auth + permissions check
  const checkAuthAndPermissions = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authenticated = !!session;
      setIsAuthenticated(authenticated);

      if (authenticated && session?.user?.id) {
        await loadPermissions(session.user.id);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error("Error checking auth and permissions:", err);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadPermissions]);

  useEffect(() => {
    checkAuthAndPermissions();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case "SIGNED_IN": {
          setIsAuthenticated(!!session);
          if (session?.user?.id) {
            void loadPermissions(session.user.id);
          } else {
            setPermissions([]);
          }
          break;
        }
        case "SIGNED_OUT": {
          setIsAuthenticated(false);
          setPermissions([]);
          break;
        }
        // Ignore TOKEN_REFRESHED / USER_UPDATED to avoid needless unmounts
        default:
          break;
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkAuthAndPermissions, loadPermissions]);

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

  if (!permissions.includes("admin")) {
    return (
      <div className="flex flex-col items-center min-h-screen">
        <NavBar currentPage="admin" hideButtons={true} />
        <div className="w-full max-w-screen-xl mx-auto px-4 flex-grow flex items-center justify-center">
          <p className="text-red-500">
            You are not authorized to access the Admin Panel. Contact the admin.
          </p>
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
                activeTab === "Announcements"
                  ? "bg-[var(--tab-background-active)] text-[var(--tab-text-active)]"
                  : "bg-[var(--tab-background-inactive)] text-[var(--card-text)]"
              }`}
              onClick={() => setActiveTab("Announcements")}
            >
              Announcements
            </button>
            <button
              className={`px-4 py-2 rounded-t-md mr-1 ${
                activeTab === "Events"
                  ? "bg-[var(--tab-background-active)] text-[var(--tab-text-active)]"
                  : "bg-[var(--tab-background-inactive)] text-[var(--card-text)]"
              }`}
              onClick={() => setActiveTab("Events")}
            >
              Events
            </button>
            <button
              className={`px-4 py-2 rounded-t-md mr-1 ${
                activeTab === "Locations"
                  ? "bg-[var(--tab-background-active)] text-[var(--tab-text-active)]"
                  : "bg-[var(--tab-background-inactive)] text-[var(--card-text)]"
              }`}
              onClick={() => setActiveTab("Locations")}
            >
              Locations
            </button>
            <button
              className={`px-4 py-2 rounded-t-md mr-1 ${
                activeTab === "Leagues"
                  ? "bg-[var(--tab-background-active)] text-[var(--tab-text-active)]"
                  : "bg-[var(--tab-background-inactive)] text-[var(--card-text)]"
              }`}
              onClick={() => setActiveTab("Leagues")}
            >
              Leagues
            </button>
          </div>

          {/* Keep children mounted; just hide inactive ones so expanded sections persist across tab focus/blur */}
          <div className="p-4 bg-[var(--card-background)] rounded-b-lg rounded-tr-lg border-t-0">
            <div className={activeTab === "Announcements" ? "block" : "hidden"}>
              <AdminAnnouncements />
            </div>
            <div className={activeTab === "Events" ? "block" : "hidden"}>
              <AdminEvents />
            </div>
            <div className={activeTab === "Locations" ? "block" : "hidden"}>
              <AdminLocations />
            </div>
            <div className={activeTab === "Leagues" ? "block" : "hidden"}>
              <AdminLeagues />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-grow" />
      <Footer isAuthenticated={true} onLogout={handleLogout} />
    </div>
  );
}
