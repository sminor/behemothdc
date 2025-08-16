"use client";
import Button from "@/components/Button";
import { FaPlus, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import AdminFlights from "./adminFlights";

// Types duplicated intentionally to avoid adding a shared types file
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
  league_id: string;
  flight_name: string;
  schedule_url?: string;
  standings_url?: string;
  players_url?: string;
  league_type: string;
};

// Helper to format "HH:MM" -> "H:MM AM/PM"
function formatTime12h(time: string | undefined | null): string {
  if (!time) return "";
  const [hStr, mStr = "00"] = time.split(":");
  const h24 = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h24) || Number.isNaN(m)) return time;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}

export default function AdminDivisions({
  leagueId,
  divisionsForLeague,
  selectedDivisionId,
  editedDivisionsMap,
  setSelectedDivision,
  handleDivisionChange,
  handleAddNewDivision,
  handleCancelDivision,
  handleSaveDivision,
  handleDeleteDivision,
  // flight props
  flightsMap,
  selectedFlightMap,
  editedFlightsMap,
  setSelectedFlight,
  handleFlightChange,
  handleAddNewFlight,
  handleCancelFlight,
  handleSaveFlight,
  handleDeleteFlight,
}: {
  leagueId: string;
  divisionsForLeague: Division[];
  selectedDivisionId: string;
  editedDivisionsMap: Record<string, Division>;
  setSelectedDivision: (val: string) => void;
  handleDivisionChange: (
    id: string,
    field: keyof Division,
    value: string | number
  ) => void;
  handleAddNewDivision: (leagueId: string) => void;
  handleCancelDivision: (id: string, leagueId: string) => void;
  handleSaveDivision: (id: string) => void;
  handleDeleteDivision: (id: string, leagueId: string) => void;

  flightsMap: Record<string, Flight[]>;
  selectedFlightMap: Record<string, string>;
  editedFlightsMap: Record<string, Flight>;
  setSelectedFlight: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleFlightChange: (id: string, field: keyof Flight, value: string) => void;
  handleAddNewFlight: (divisionId: string) => void;
  handleCancelFlight: (id: string, divisionId: string) => void;
  handleSaveFlight: (id: string) => void;
  handleDeleteFlight: (id: string, divisionId: string) => void;
}) {
  const selected = divisionsForLeague.find((d) => d.id === selectedDivisionId);
  const division = selected
    ? editedDivisionsMap[selected.id] || selected
    : undefined;

  return (
    <div className="mt-6">
      <div className="h-px bg-[var(--card-highlight)] my-4"></div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold">Divisions</h4>
        <Button
          className="w-auto px-3 py-1 text-sm"
          onClick={() => handleAddNewDivision(leagueId)}
          icon={<FaPlus />}
          iconPosition="left"
        >
          Add Division
        </Button>
      </div>

      <select
        value={selectedDivisionId || ""}
        onChange={(e) => setSelectedDivision(e.target.value)}
        className="w-full md:w-[calc(50%-0.5rem)] p-2 mb-4 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
      >
        <option value="">Select a division</option>
        {divisionsForLeague.map((d) => {
          const day = d.day_of_week?.trim();
          const time12 = formatTime12h(d.start_time?.trim());
          const extra = [day, time12].filter(Boolean).join(" ");
          return (
            <option key={d.id} value={d.id}>
              {d.name || "(No Name)"}{extra ? ` - ${extra}` : ""}
            </option>
          );
        })}
      </select>

      {division && (
        <div className="bg-[var(--color11)] rounded-md">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Division Name
              </label>
              <input
                type="text"
                value={division.name}
                onChange={(e) =>
                  handleDivisionChange(division.id, "name", e.target.value)
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Cap Details
              </label>
              <input
                type="text"
                value={division.cap_details}
                onChange={(e) =>
                  handleDivisionChange(
                    division.id,
                    "cap_details",
                    e.target.value
                  )
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Day of Week
              </label>
              <select
                value={division.day_of_week}
                onChange={(e) =>
                  handleDivisionChange(
                    division.id,
                    "day_of_week",
                    e.target.value
                  )
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              >
                <option value="">Select a day</option>
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={division.start_time}
                onChange={(e) =>
                  handleDivisionChange(
                    division.id,
                    "start_time",
                    e.target.value
                  )
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Cost Per Player
              </label>
              <input
                type="number"
                value={division.cost_per_player}
                onChange={(e) =>
                  handleDivisionChange(
                    division.id,
                    "cost_per_player",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--card-text)] mb-1">
                Sanction Fee
              </label>
              <input
                type="number"
                value={division.sanction_fee}
                onChange={(e) =>
                  handleDivisionChange(
                    division.id,
                    "sanction_fee",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 flex-wrap mt-2">
            <Button
              className="w-auto px-4 py-2 text-sm"
              onClick={() => handleSaveDivision(division.id)}
              icon={<FaSave />}
              iconPosition="left"
            >
              Save
            </Button>
            <Button
              className="w-auto px-4 py-2 text-sm"
              onClick={() => handleCancelDivision(division.id, leagueId)}
              icon={<FaTimes />}
              iconPosition="left"
            >
              Cancel
            </Button>
            {!division.id.startsWith("new-") && (
              <Button
                className="w-auto px-4 py-2 text-sm bg-[var(--color5)] text-white"
                onClick={() => handleDeleteDivision(division.id, leagueId)}
                icon={<FaTrash />}
                iconPosition="left"
              >
                Delete
              </Button>
            )}
          </div>

          {/* Flights (moved to its own file) */}
          <AdminFlights
            divisionId={division.id}
            flightsForDivision={flightsMap[division.id] || []}
            selectedFlightId={selectedFlightMap[division.id] || ""}
            editedFlightsMap={editedFlightsMap}
            setSelectedFlight={setSelectedFlight}
            handleFlightChange={handleFlightChange}
            handleAddNewFlight={handleAddNewFlight}
            handleCancelFlight={handleCancelFlight}
            handleSaveFlight={handleSaveFlight}
            handleDeleteFlight={handleDeleteFlight}
          />
        </div>
      )}
    </div>
  );
}
