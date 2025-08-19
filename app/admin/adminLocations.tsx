"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import Button from "@/components/Button";
import { FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";

type Location = {
  id: string;
  name: string;
  address: string;
  details?: string;
  latitude?: number;
  longitude?: number;
  map_embed_url?: string;
  is_new?: boolean;
  created_at?: string;
  league: boolean;
  league_note?: string | null; // ← NEW
};

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [editedLocations, setEditedLocations] = useState<Record<string, Location>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*") // includes league_note
        .order("created_at", { ascending: false });

      if (error) console.error("Failed to load locations:", error.message);
      else setLocations(data || []);
      setLoading(false);
    };

    fetchLocations();
  }, []);

  const handleChange = (
    id: string,
    field: keyof Location,
    value: string | number | boolean | null
  ) => {
    setEditedLocations((prev) => ({
      ...prev,
      [id]: {
        ...(locations.find((loc) => loc.id === id) || prev[id]),
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (id: string) => {
    const location = editedLocations[id];
    if (!location.name || !location.address) {
      alert("Name and address are required.");
      return;
    }

    const payload = { ...location };

    if (id.startsWith("new-")) {
      const { id: _omit, ...newData } = payload;
      const { error } = await supabase.from("locations").insert([newData]);
      if (error) {
        console.error("Insert error:", error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("locations")
        .update(payload)
        .eq("id", id);
      if (error) {
        console.error("Update error:", error.message);
        return;
      }
    }

    const { data, error: refetchError } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (refetchError) console.error("Refetch error:", refetchError.message);
    else setLocations(data || []);

    setEditedLocations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleCancel = (id: string) => {
    setEditedLocations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error.message);
      return;
    }

    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    setEditedLocations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAddNew = () => {
    const newId = `new-${Date.now()}`;
    const newLoc: Location = {
      id: newId,
      name: "",
      address: "",
      details: "",
      latitude: undefined,
      longitude: undefined,
      map_embed_url: "",
      is_new: false,
      league: true,
      league_note: "", // ← NEW default
    };
    setEditedLocations((prev) => ({
      ...prev,
      [newId]: newLoc,
    }));
  };

  const filteredLocations = locations.filter((loc) =>
    Object.values(loc).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const newLocations = Object.values(editedLocations).filter((l) =>
    l.id.startsWith("new-")
  );
  const combinedLocations = [...newLocations, ...filteredLocations];

  return (
    <section className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Manage Locations</h2>
        <Button
          className="w-auto"
          onClick={handleAddNew}
          icon={<FaPlus />}
          iconPosition="left"
        >
          Add New Location
        </Button>
      </div>

      {/* Search bar */}
      <div className="mb-6 w-full max-w-[400px]">
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
        />
      </div>

      {loading ? (
        <p>Loading locations...</p>
      ) : combinedLocations.length === 0 ? (
        <p>No matching locations found.</p>
      ) : (
        <div className="space-y-6">
          {combinedLocations.map((loc) => {
            const edited = editedLocations[loc.id] || loc;
            const isNew = loc.id.startsWith("new-");
            const hasChanges = editedLocations[loc.id] !== undefined;

            return (
              <div
                key={loc.id}
                className={`${
                  isNew ? "bg-[var(--color12)]" : "bg-[var(--color11)]"
                } p-4 rounded-lg border-l-4 border-[var(--card-highlight)] shadow grid grid-cols-1 md:grid-cols-2 gap-4`}
              >
                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={edited.name}
                    onChange={(e) => handleChange(loc.id, "name", e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={edited.address}
                    onChange={(e) => handleChange(loc.id, "address", e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    Details
                  </label>
                  <input
                    type="text"
                    value={edited.details ?? ""}
                    onChange={(e) => handleChange(loc.id, "details", e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    Map Embed URL
                  </label>
                  <input
                    type="text"
                    value={edited.map_embed_url ?? ""}
                    onChange={(e) => handleChange(loc.id, "map_embed_url", e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={edited.latitude ?? ""}
                    onChange={(e) =>
                      handleChange(loc.id, "latitude", e.target.value === "" ? null : parseFloat(e.target.value))
                    }
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={edited.longitude ?? ""}
                    onChange={(e) =>
                      handleChange(loc.id, "longitude", e.target.value === "" ? null : parseFloat(e.target.value))
                    }
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                {/* NEW: League Note (shown to players in signup selects) */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-[var(--card-text)] mb-1">
                    League Note (shown in signup dropdown)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Monday & Wednesday nights only"
                    value={edited.league_note ?? ""}
                    onChange={(e) => handleChange(loc.id, "league_note", e.target.value)}
                    className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={edited.league}
                    onChange={(e) => handleChange(loc.id, "league", e.target.checked)}
                    className="h-5 w-5 border-[var(--form-border)] accent-[var(--form-checkbox-checked)] focus:outline-none"
                    id={`league-${loc.id}`}
                  />
                  <label htmlFor={`league-${loc.id}`} className="text-[var(--card-text)]">
                    League Location
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={edited.is_new ?? false}
                    onChange={(e) => handleChange(loc.id, "is_new", e.target.checked)}
                    className="h-5 w-5 border-[var(--form-border)] accent-[var(--form-checkbox-checked)] focus:outline-none"
                    id={`is_new-${loc.id}`}
                  />
                  <label htmlFor={`is_new-${loc.id}`} className="text-[var(--card-text)]">
                    Mark as New
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="col-span-full flex justify-end flex-wrap gap-2 mt-2">
                  {hasChanges && (
                    <>
                      <Button
                        className="w-auto px-4 py-2 text-sm"
                        onClick={() => handleSave(loc.id)}
                        icon={<FaSave />}
                        iconPosition="left"
                      >
                        Save
                      </Button>
                      <Button
                        className="w-auto px-4 py-2 text-sm"
                        onClick={() => handleCancel(loc.id)}
                        icon={<FaTimes />}
                        iconPosition="left"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {!isNew && (
                    <Button
                      className="w-auto px-4 py-2 text-sm bg-[var(--color5)] text-white"
                      onClick={() => handleDelete(loc.id)}
                      icon={<FaTrash />}
                      iconPosition="left"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
