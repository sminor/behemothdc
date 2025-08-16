"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import Button from "@/components/Button";
import { FaPlus, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import AdminDivisions from "./adminDivisions";
import AdminLeagueSignups from "./adminLeagueSignups";

export type LeagueSignupSetting = {
  id: string;
  name: string;
  signup_start: string;
  signup_close: string;
  league_info?: string;
  form_type: string;
};

export type Division = {
  id: string;
  name: string;
  cap_details: string;
  day_of_week: string;
  start_time: string;
  cost_per_player: number;
  sanction_fee: number;
  signup_settings_id: string;
};

export type Flight = {
  id: string;
  league_id: string; // division id
  flight_name: string;
  schedule_url?: string;
  standings_url?: string;
  players_url?: string;
  league_type: string;
};

export default function AdminLeagues() {
  const [settings, setSettings] = useState<LeagueSignupSetting[]>([]);
  const [divisions, setDivisions] = useState<Record<string, Division[]>>({});
  const [flights, setFlights] = useState<Record<string, Flight[]>>({});
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);

  const [editedSettingsMap, setEditedSettingsMap] = useState<Record<string, LeagueSignupSetting>>(
    {}
  );
  const [editedDivisionsMap, setEditedDivisionsMap] = useState<Record<string, Division>>({});
  const [editedFlightsMap, setEditedFlightsMap] = useState<Record<string, Flight>>({});

  const [selectedDivision, setSelectedDivision] = useState<Record<string, string>>({});
  const [selectedFlight, setSelectedFlight] = useState<Record<string, string>>({});

  // Signups modal
  const [openSignupsLeagueId, setOpenSignupsLeagueId] = useState<string | null>(null);
  const [openSignupsLeagueName, setOpenSignupsLeagueName] = useState<string | undefined>(undefined);

  const leagueInfoRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_INFO_LINES = 30;

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-size league info but cap "automatic" growth to ~30 lines
  useEffect(() => {
    autoSizeLeagueInfo();
  }, [editedSettingsMap, editingLeagueId]);

  const autoSizeLeagueInfo = () => {
    const el = leagueInfoRef.current;
    if (!el) return;
    const computed = getComputedStyle(el);
    const lh = parseFloat(computed.lineHeight || "20");
    const maxPx = Math.round(lh * MAX_INFO_LINES);

    // If user manually resized bigger than our cap, don't override.
    const current = parseFloat(el.style.height || "0");
    if (current > maxPx) {
      el.style.overflowY = "auto";
      return;
    }

    el.style.height = "auto";
    const desired = Math.min(el.scrollHeight, maxPx);
    el.style.height = `${desired}px`;
    el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
  };

  const fetchData = async () => {
    const [
      { data: settingsData },
      { data: divisionsData },
      { data: flightsData },
    ] = await Promise.all([
      supabase
        .from("league_signup_settings")
        .select("*")
        .order("signup_start", { ascending: false }),
      supabase.from("league_details").select("*"),
      supabase.from("league_flights").select("*"),
    ]);

    setSettings(settingsData || []);

    const divMap: Record<string, Division[]> = {};
    (divisionsData || []).forEach((div: Division) => {
      if (!divMap[div.signup_settings_id]) divMap[div.signup_settings_id] = [];
      divMap[div.signup_settings_id].push({
        ...div,
        start_time: div.start_time ? div.start_time.slice(0, 5) : "",
      });
    });
    Object.keys(divMap).forEach((key) => {
      divMap[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    setDivisions(divMap);

    const flightMap: Record<string, Flight[]> = {};
    (flightsData || []).forEach((flight: Flight) => {
      if (!flightMap[flight.league_id]) flightMap[flight.league_id] = [];
      flightMap[flight.league_id].push(flight);
    });
    Object.keys(flightMap).forEach((key) => {
      flightMap[key].sort((a, b) => a.flight_name.localeCompare(b.flight_name));
    });
    setFlights(flightMap);
  };

  const isActive = (start: string, end: string) => {
    const now = new Date();
    return new Date(start) <= now && now <= new Date(end);
  };

  // League handlers
  const handleSettingEdit = (id: string) => {
    setEditingLeagueId(id);
    const setting = settings.find((s) => s.id === id);
    if (setting) {
      setEditedSettingsMap((prev) => ({ ...prev, [id]: { ...setting } }));
    }
    // ensure textarea resizes on next paint
    setTimeout(autoSizeLeagueInfo, 0);
  };

  const handleSettingChange = (
    id: string,
    field: keyof LeagueSignupSetting,
    value: string
  ) =>
    setEditedSettingsMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));

  const handleAddNewSetting = () => {
    const newId = `new-${Date.now()}`;
    const newLeague: LeagueSignupSetting = {
      id: newId,
      name: "",
      signup_start: "",
      signup_close: "",
      league_info: "",
      form_type: "",
    };
    setSettings((prev) => [newLeague, ...prev]);
    setEditingLeagueId(newId);
    setEditedSettingsMap((prev) => ({ ...prev, [newId]: newLeague }));
    setTimeout(autoSizeLeagueInfo, 0);
  };

  const handleCancelSetting = (id: string) => {
    if (id.startsWith("new-"))
      setSettings((prev) => prev.filter((s) => s.id !== id));
    setEditingLeagueId(null);
    setSelectedDivision((prev) => ({ ...prev, [id]: "" }));
    setSelectedFlight((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSaveSetting = async (id: string) => {
    const data = editedSettingsMap[id];
    if (!data?.name || !data.signup_start || !data.signup_close || !data.form_type) {
      alert("Please fill out all required fields.");
      return;
    }
    if (id.startsWith("new-")) {
      const { id: _rm, ...ins } = data;
      await supabase.from("league_signup_settings").insert([ins]);
    } else {
      await supabase.from("league_signup_settings").update(data).eq("id", id);
    }
    await fetchData();
    handleCancelSetting(id);
  };

  const handleDeleteSetting = async (id: string) => {
    if (!confirm("Delete this League?")) return;
    await supabase.from("league_signup_settings").delete().eq("id", id);
    await fetchData();
    setEditingLeagueId(null);
  };

  // Division handlers
  const handleDivisionChange = (
    id: string,
    field: keyof Division,
    value: string | number
  ) =>
    setEditedDivisionsMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));

  const handleAddNewDivision = (signup_settings_id: string) => {
    const newId = `new-${Date.now()}`;
    const newDivision: Division = {
      id: newId,
      name: "",
      cap_details: "",
      day_of_week: "",
      start_time: "",
      cost_per_player: 0,
      sanction_fee: 10,
      signup_settings_id,
    };
    setDivisions((prev) => ({
      ...prev,
      [signup_settings_id]: [...(prev[signup_settings_id] || []), newDivision],
    }));
    setSelectedDivision((prev) => ({ ...prev, [signup_settings_id]: newId }));
    setEditedDivisionsMap((prev) => ({ ...prev, [newId]: newDivision }));
  };

  const handleCancelDivision = (id: string, leagueId: string) => {
    if (id.startsWith("new-")) {
      setDivisions((prev) => {
        const updated = { ...prev };
        updated[leagueId] = (updated[leagueId] || []).filter((d) => d.id !== id);
        return updated;
      });
    }
    setSelectedDivision((prev) => ({ ...prev, [leagueId]: "" }));
  };

  const handleSaveDivision = async (id: string) => {
    const data = editedDivisionsMap[id];
    if (!data?.name || !data.cap_details || !data.day_of_week || !data.start_time) {
      alert("Please fill out all required fields.");
      return;
    }
    if (id.startsWith("new-")) {
      const { id: _rm, ...ins } = data;
      await supabase.from("league_details").insert([ins]);
    } else {
      await supabase.from("league_details").update(data).eq("id", id);
    }
    await fetchData();
    setSelectedDivision((prev) => ({ ...prev, [data.signup_settings_id]: "" }));
  };

  const handleDeleteDivision = async (id: string, leagueId: string) => {
    if (!confirm("Delete this Division?")) return;
    await supabase.from("league_details").delete().eq("id", id);
    await fetchData();
    setSelectedDivision((prev) => ({ ...prev, [leagueId]: "" }));
  };

  // Flight handlers
  const handleFlightChange = (id: string, field: keyof Flight, value: string) =>
    setEditedFlightsMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));

  const handleAddNewFlight = (divisionId: string) => {
    const newId = `new-${Date.now()}`;
    const newFlight: Flight = {
      id: newId,
      league_id: divisionId,
      flight_name: "",
      schedule_url: "",
      standings_url: "",
      players_url: "",
      league_type: "Remote",
    };
    setFlights((prev) => ({
      ...prev,
      [divisionId]: [...(prev[divisionId] || []), newFlight],
    }));
    setSelectedFlight((prev) => ({ ...prev, [divisionId]: newId }));
    setEditedFlightsMap((prev) => ({ ...prev, [newId]: newFlight }));
  };

  const handleCancelFlight = (id: string, divisionId: string) => {
    if (id.startsWith("new-")) {
      setFlights((prev) => {
        const updated = { ...prev };
        updated[divisionId] = (updated[divisionId] || []).filter((f) => f.id !== id);
        return updated;
      });
    }
    setSelectedFlight((prev) => ({ ...prev, [divisionId]: "" }));
  };

  const handleSaveFlight = async (id: string) => {
    const data = editedFlightsMap[id];
    if (!data?.flight_name || !data.league_type) {
      alert("Please fill out all required fields.");
      return;
    }
    if (id.startsWith("new-")) {
      const { id: _rm, ...ins } = data;
      await supabase.from("league_flights").insert([ins]);
    } else {
      await supabase.from("league_flights").update(data).eq("id", id);
    }
    await fetchData();
    setSelectedFlight((prev) => ({ ...prev, [data.league_id]: "" }));
  };

  const handleDeleteFlight = async (id: string, divisionId: string) => {
    if (!confirm("Delete this Flight?")) return;
    await supabase.from("league_flights").delete().eq("id", id);
    await fetchData();
    setSelectedFlight((prev) => ({ ...prev, [divisionId]: "" }));
  };

  return (
    <section className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Manage Leagues</h2>
        <Button className="w-auto" onClick={handleAddNewSetting} icon={<FaPlus />} iconPosition="left">
          Add New League
        </Button>
      </div>

      <div className="space-y-6">
        {settings.map((s) => {
          const id = s.id;
          const setting = editedSettingsMap[id] || s;
          const isEditing = editingLeagueId === id;

          return (
            <div
              key={id}
              className="bg-[var(--color11)] p-4 rounded-lg shadow-md border-l-4 border-[var(--card-highlight)]"
            >
              {!isEditing ? (
                // Collapsed view: info on LEFT (click to edit), "View Signups" button on RIGHT
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => handleSettingEdit(id)}
                    className="cursor-pointer space-y-1 flex-1"
                  >
                    <h3 className="text-lg font-semibold">{setting.name}</h3>
                    <p className="text-sm text-[var(--card-text)]">
                      {setting.signup_start} → {setting.signup_close}
                    </p>
                    {isActive(setting.signup_start!, setting.signup_close!) && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Signups Active
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Button
                      className="w-auto px-3 py-1 text-sm"
                      onClick={() => {
                        setOpenSignupsLeagueId(id);
                        setOpenSignupsLeagueName(setting.name);
                      }}
                    >
                      View Signups
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-semibold mb-2">League</h4>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--card-text)] mb-1">League Name</label>
                      <input
                        type="text"
                        value={setting.name}
                        onChange={(e) => handleSettingChange(id, "name", e.target.value)}
                        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--card-text)] mb-1">Form Type</label>
                      <select
                        value={setting.form_type}
                        onChange={(e) => handleSettingChange(id, "form_type", e.target.value)}
                        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      >
                        <option value="">Select a form</option>
                        <option value="SinglesForm">Singles Form</option>
                        <option value="DoublesForm">Doubles Form</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--card-text)] mb-1">Signup Start</label>
                      <input
                        type="date"
                        value={setting.signup_start}
                        onChange={(e) => handleSettingChange(id, "signup_start", e.target.value)}
                        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--card-text)] mb-1">Signup Close</label>
                      <input
                        type="date"
                        value={setting.signup_close}
                        onChange={(e) => handleSettingChange(id, "signup_close", e.target.value)}
                        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-[var(--card-text)] mb-1">League Info</label>
                      <textarea
                        ref={leagueInfoRef}
                        value={setting.league_info || ""}
                        onChange={(e) => {
                          handleSettingChange(id, "league_info", e.target.value);
                          autoSizeLeagueInfo();
                        }}
                        style={{ overflowY: "hidden", resize: "vertical" as const }}
                        className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions row: View Signups on LEFT, others on RIGHT */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mt-2">
                    <div className="order-1">
                      <Button
                        className="w-auto px-3 py-1 text-sm"
                        onClick={() => {
                          setOpenSignupsLeagueId(id);
                          setOpenSignupsLeagueName(setting.name);
                        }}
                      >
                        View Signups
                      </Button>
                    </div>
                    <div className="flex gap-2 order-2 ml-auto">
                      <Button
                        className="w-auto px-4 py-2 text-sm"
                        onClick={() => handleSaveSetting(id)}
                        icon={<FaSave />}
                        iconPosition="left"
                      >
                        Save
                      </Button>
                      <Button
                        className="w-auto px-4 py-2 text-sm"
                        onClick={() => handleCancelSetting(id)}
                        icon={<FaTimes />}
                        iconPosition="left"
                      >
                        Cancel
                      </Button>
                      {!id.startsWith("new-") && (
                        <Button
                          className="w-auto px-4 py-2 text-sm bg-[var(--color5)] text-white"
                          onClick={() => handleDeleteSetting(id)}
                          icon={<FaTrash />}
                          iconPosition="left"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Divisions */}
                  <AdminDivisions
                    leagueId={id}
                    divisionsForLeague={divisions[id] || []}
                    selectedDivisionId={selectedDivision[id] || ""}
                    editedDivisionsMap={editedDivisionsMap}
                    setSelectedDivision={(val) =>
                      setSelectedDivision((prev) => ({ ...prev, [id]: val }))
                    }
                    handleDivisionChange={handleDivisionChange}
                    handleAddNewDivision={handleAddNewDivision}
                    handleCancelDivision={handleCancelDivision}
                    handleSaveDivision={handleSaveDivision}
                    handleDeleteDivision={handleDeleteDivision}
                    // flight props
                    flightsMap={flights}
                    selectedFlightMap={selectedFlight}
                    editedFlightsMap={editedFlightsMap}
                    setSelectedFlight={setSelectedFlight}
                    handleFlightChange={handleFlightChange}
                    handleAddNewFlight={handleAddNewFlight}
                    handleCancelFlight={handleCancelFlight}
                    handleSaveFlight={handleSaveFlight}
                    handleDeleteFlight={handleDeleteFlight}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Signups Modal */}
      <AdminLeagueSignups
        isOpen={!!openSignupsLeagueId}
        leagueId={openSignupsLeagueId ?? ""}
        leagueName={openSignupsLeagueName}
        onClose={() => setOpenSignupsLeagueId(null)}
      />
    </section>
  );
}
