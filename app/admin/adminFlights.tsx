"use client";
import Button from "@/components/Button";
import { FaPlus, FaTrash, FaSave, FaTimes } from "react-icons/fa";

// Types duplicated intentionally to avoid adding a shared types file
export type Flight = {
  id: string;
  league_id: string;
  flight_name: string;
  schedule_url?: string;
  standings_url?: string;
  players_url?: string;
  league_type: string;
};

export default function AdminFlights({
  divisionId,
  flightsForDivision,
  selectedFlightId,
  editedFlightsMap,
  setSelectedFlight,
  handleFlightChange,
  handleAddNewFlight,
  handleCancelFlight,
  handleSaveFlight,
  handleDeleteFlight,
}: {
  divisionId: string;
  flightsForDivision: Flight[];
  selectedFlightId: string;
  editedFlightsMap: Record<string, Flight>;
  setSelectedFlight: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleFlightChange: (id: string, field: keyof Flight, value: string) => void;
  handleAddNewFlight: (divisionId: string) => void;
  handleCancelFlight: (id: string, divisionId: string) => void;
  handleSaveFlight: (id: string) => void;
  handleDeleteFlight: (id: string, divisionId: string) => void;
}) {
  const selected = flightsForDivision.find((f) => f.id === selectedFlightId);
  const flight = selected ? editedFlightsMap[selected.id] || selected : undefined;

  return (
    <div className="mt-6">
      <div className="h-px bg-[var(--card-highlight)] my-4"></div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold">Flights</h4>
        <Button
          className="w-auto px-3 py-1 text-sm"
          onClick={() => handleAddNewFlight(divisionId)}
          icon={<FaPlus />}
          iconPosition="left"
        >
          Add Flight
        </Button>
      </div>

      <select
        value={selectedFlightId || ""}
        onChange={(e) =>
          setSelectedFlight((prev) => ({ ...prev, [divisionId]: e.target.value }))
        }
        className="w-full md:w-[calc(50%-0.5rem)] p-2 mb-4 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
      >
        <option value="">Select a flight</option>
        {flightsForDivision.map((f) => (
          <option key={f.id} value={f.id}>
            {f.flight_name || "(No Name)"}
          </option>
        ))}
      </select>

      {flight && (
        <div className="bg-[var(--color11)] rounded-md">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Flight Name
              </label>
              <input
                type="text"
                value={flight.flight_name}
                onChange={(e) =>
                  handleFlightChange(flight.id, "flight_name", e.target.value)
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                League Type
              </label>
              <input
                type="text"
                value={flight.league_type}
                onChange={(e) =>
                  handleFlightChange(flight.id, "league_type", e.target.value)
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Schedule URL
              </label>
              <input
                type="text"
                value={flight.schedule_url || ""}
                onChange={(e) =>
                  handleFlightChange(flight.id, "schedule_url", e.target.value)
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Standings URL
              </label>
              <input
                type="text"
                value={flight.standings_url || ""}
                onChange={(e) =>
                  handleFlightChange(flight.id, "standings_url", e.target.value)
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Players URL
              </label>
              <input
                type="text"
                value={flight.players_url || ""}
                onChange={(e) =>
                  handleFlightChange(flight.id, "players_url", e.target.value)
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 flex-wrap mt-2">
            <Button
              className="w-auto px-4 py-2 text-sm"
              onClick={() => handleSaveFlight(flight.id)}
              icon={<FaSave />}
              iconPosition="left"
            >
              Save
            </Button>
            <Button
              className="w-auto px-4 py-2 text-sm"
              onClick={() => handleCancelFlight(flight.id, divisionId)}
              icon={<FaTimes />}
              iconPosition="left"
            >
              Cancel
            </Button>
            {!flight.id.startsWith("new-") && (
              <Button
                className="w-auto px-4 py-2 text-sm bg-[var(--color5)] text-white"
                onClick={() => handleDeleteFlight(flight.id, divisionId)}
                icon={<FaTrash />}
                iconPosition="left"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
