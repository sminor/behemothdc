"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { FaDownload, FaSync, FaTrash } from "react-icons/fa";

type LeagueDetailsLite = {
  id: string;
  name: string;
  cap_details: string;
  day_of_week: string;
  start_time: string | null;
};

type Signup = {
  id: string;
  team_name: string;
  captain_name: string;
  captain_adl_number: string;
  captain_email: string;
  captain_phone_number: string;
  captain_paid_nda: boolean;
  teammate_name: string | null;
  teammate_adl_number: string | null;
  teammate_email: string | null;
  teammate_phone_number: string | null;
  teammate_paid_nda: boolean | null;

  league_details_id: string;
  league_details?: LeagueDetailsLite | null;

  home_location_1: string;
  home_location_2: string;
  play_preference: string;
  total_fees_due: number | string;
  created_at: string;
  confirmed_paid: boolean;
  payment_method: string;
  signup_settings_id: string | null;
};

export default function AdminLeagueSignups({
  isOpen,
  leagueId,
  leagueName,
  onClose,
}: {
  isOpen: boolean;
  leagueId: string;
  leagueName?: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Signup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [showOnlyUnconfirmed, setShowOnlyUnconfirmed] = useState(false);

  // Column widths (Team, Division, Captain, Teammate, Confirmed)
  const COLS = ["28%", "28%", "16%", "16%", "12%"];

  useEffect(() => {
    if (!isOpen || !leagueId) return;
    refresh();
    setExpandedIds({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leagueId]);

  function formatTime12h(t?: string | null) {
    if (!t) return "";
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return t ?? "";
    let h = Number(m[1]);
    const minutes = m[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("league_signups")
        .select(
          `
          *,
          league_details:league_details_id (
            id,
            name,
            cap_details,
            day_of_week,
            start_time
          )
        `
        )
        .eq("signup_settings_id", leagueId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data ?? []) as Signup[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load signups";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const divisionLabel = (ld?: LeagueDetailsLite | null) => {
      if (!ld) return "(unknown)";
      return `${ld.name} - ${ld.day_of_week} ${formatTime12h(ld.start_time)}`.trim();
    };
    return rows.filter((r) => {
      if (showOnlyUnconfirmed && r.confirmed_paid) return false;
      if (!q) return true;
      const div = divisionLabel(r.league_details);
      const blob = [
        r.team_name,
        div,
        r.captain_name,
        r.captain_email,
        r.captain_phone_number,
        r.teammate_name,
        r.teammate_email,
        r.teammate_phone_number,
        r.home_location_1,
        r.home_location_2,
        r.play_preference,
        r.payment_method,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, search, showOnlyUnconfirmed]);

  async function togglePaid(id: string, current: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, confirmed_paid: !current } : r)));
    const { error } = await supabase
      .from("league_signups")
      .update({ confirmed_paid: !current })
      .eq("id", id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, confirmed_paid: current } : r)));
      alert(`Failed to update paid status: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this signup?")) return;
    const old = rows;
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("league_signups").delete().eq("id", id);
    if (error) {
      setRows(old);
      alert(`Failed to delete: ${error.message}`);
    }
  }

  function toCSV() {
    const rowsOut = filtered;
    const header = [
      "id",
      "created_at",
      "team_name",
      "division",
      "captain_name",
      "captain_adl_number",
      "captain_email",
      "captain_phone_number",
      "captain_paid_nda",
      "teammate_name",
      "teammate_adl_number",
      "teammate_email",
      "teammate_phone_number",
      "teammate_paid_nda",
      "home_location_1",
      "home_location_2",
      "play_preference",
      "total_fees_due",
      "payment_method",
      "confirmed_paid",
    ];

    const esc = (v: unknown) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [
      header.join(","),
      ...rowsOut.map((r) => {
        const division =
          r.league_details
            ? `${r.league_details.name} - ${r.league_details.day_of_week} ${formatTime12h(
                r.league_details.start_time
              )}`
            : "(unknown)";
        return [
          r.id,
          r.created_at,
          r.team_name,
          division,
          r.captain_name,
          r.captain_adl_number,
          r.captain_email,
          r.captain_phone_number,
          r.captain_paid_nda,
          r.teammate_name ?? "",
          r.teammate_adl_number ?? "",
          r.teammate_email ?? "",
          r.teammate_phone_number ?? "",
          r.teammate_paid_nda ?? "",
          r.home_location_1,
          r.home_location_2,
          r.play_preference,
          r.total_fees_due,
          r.payment_method,
          r.confirmed_paid,
        ]
          .map(esc)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${leagueName ?? "league"}-signups-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const compactBtn = "w-auto px-3 py-1 text-sm";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Signups ${leagueName ? "– " + leagueName : ""}`}
      content={
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            {/* Left: search + checkbox */}
            <div className="w-full md:w-auto">
              <div className="mb-2 w-full max-w-[400px]">
                <input
                  type="text"
                  placeholder="Search signups..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-[var(--card-text)]">
                <input
                  id="showOnlyUnconfirmed"
                  type="checkbox"
                  checked={showOnlyUnconfirmed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setShowOnlyUnconfirmed(e.target.checked)
                  }
                  className="h-5 w-5 border-1 border-[var(--form-border)] rounded accent-[var(--form-checkbox-checked)] focus:outline-none"
                />
                <label htmlFor="showOnlyUnconfirmed" className="cursor-pointer">
                  Show only unconfirmed payment
                </label>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex gap-2">
              <Button onClick={refresh} className={compactBtn} icon={<FaSync />} iconPosition="left">
                Refresh
              </Button>
              <Button onClick={toCSV} className={compactBtn} icon={<FaDownload />} iconPosition="left">
                Export CSV
              </Button>
            </div>
          </div>

          {/* States */}
          {loading && <p className="text-sm opacity-80">Loading…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-sm opacity-80">No signups yet.</p>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm table-fixed text-left">
                <colgroup>
                  <col style={{ width: COLS[0] }} />
                  <col style={{ width: COLS[1] }} />
                  <col style={{ width: COLS[2] }} />
                  <col style={{ width: COLS[3] }} />
                  <col style={{ width: COLS[4] }} />
                </colgroup>

                <thead>
                  <tr className="text-left border-b border-[var(--form-border)]">
                    <th className="py-2 pr-4 pl-0">Team</th>
                    <th className="py-2 pr-4 pl-0">Division</th>
                    <th className="py-2 pr-4 pl-0">Captain</th>
                    <th className="py-2 pr-4 pl-0">Teammate</th>
                    <th className="py-2 pr-4 pl-0">Confirmed Paid</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => {
                    const isOpenRow = !!expandedIds[r.id];
                    const division =
                      r.league_details
                        ? `${r.league_details.name} - ${r.league_details.day_of_week} ${formatTime12h(
                            r.league_details.start_time
                          )}`
                        : "(unknown)";

                    return (
                      <React.Fragment key={r.id}>
                        {/* Summary row */}
                        <tr
                          className="border-b border-[var(--form-border)] cursor-pointer hover:bg-white/5"
                          onClick={() =>
                            setExpandedIds((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                          }
                        >
                          <td className="py-2 pr-4 pl-0 text-left">{r.team_name}</td>
                          <td className="py-2 pr-4 pl-0 text-left">{division}</td>
                          <td className="py-2 pr-4 pl-0 text-left">{r.captain_name}</td>
                          <td className="py-2 pr-4 pl-0 text-left">{r.teammate_name ?? ""}</td>
                          <td className="py-2 pr-4 pl-0" onClick={(e) => e.stopPropagation()}>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="border-1 border-[var(--form-border)] rounded accent-[var(--form-checkbox-checked)] focus:outline-none"
                                checked={!!r.confirmed_paid}
                                onChange={() => togglePaid(r.id, r.confirmed_paid)}
                              />
                              <span className="opacity-70 text-xs">Paid</span>
                            </label>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {isOpenRow && (
                          <tr className="border-b border-[var(--form-border)]">
                            <td colSpan={5} className="py-3 pr-4 pl-0">
                              <table
                                className="w-full table-fixed text-left"
                                style={{ borderCollapse: "separate", borderSpacing: 0 }}
                              >
                                <colgroup>
                                  <col style={{ width: COLS[0] }} />
                                  <col style={{ width: COLS[1] }} />
                                  <col style={{ width: COLS[2] }} />
                                  <col style={{ width: COLS[3] }} />
                                  <col style={{ width: COLS[4] }} />
                                </colgroup>

                                <tbody>
                                  {/* Captain row */}
                                  <tr>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Captain ADL Number" value={r.captain_adl_number} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Captain Email" value={r.captain_email} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Captain Phone" value={r.captain_phone_number} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail
                                        label="Captain NDA Sanctioned"
                                        value={r.captain_paid_nda ? "Yes" : "No"}
                                      />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left" />
                                  </tr>

                                  {/* Teammate row */}
                                  <tr>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Teammate ADL Number" value={r.teammate_adl_number ?? ""} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Teammate Email" value={r.teammate_email ?? ""} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Teammate Phone" value={r.teammate_phone_number ?? ""} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail
                                        label="Teammate NDA Sanctioned"
                                        value={
                                          r.teammate_paid_nda == null ? "" : r.teammate_paid_nda ? "Yes" : "No"
                                        }
                                      />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left" />
                                  </tr>

                                  {/* Divider (not a border) */}
                                  <tr>
                                    <td colSpan={5} className="py-1 pl-0 pr-0">
                                      <div className="my-3 h-px w-full bg-[var(--color2)]" />
                                    </td>
                                  </tr>

                                  {/* Other details row 1 */}
                                  <tr>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Home Location 1" value={r.home_location_1} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Home Location 2" value={r.home_location_2} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Play Preference" value={r.play_preference} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail
                                        label="Total Fees"
                                        value={
                                          typeof r.total_fees_due === "number"
                                            ? r.total_fees_due.toLocaleString(undefined, {
                                                style: "currency",
                                                currency: "USD",
                                              })
                                            : String(r.total_fees_due)
                                        }
                                      />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left" />
                                  </tr>

                                  {/* Other details row 2 + Delete */}
                                  <tr>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail label="Payment Method" value={r.payment_method} />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left">
                                      <Detail
                                        label="Created Date/Time"
                                        value={new Date(r.created_at).toLocaleString()}
                                      />
                                    </td>
                                    <td className="py-2 pr-4 pl-0 text-left" />
                                    <td className="py-2 pr-4 pl-0 text-left" />
                                    <td className="py-2 pr-4 pl-0 align-bottom">
                                      <div className="flex justify-end">
                                        <Button
                                          className="w-auto px-3 py-1 text-sm bg-[var(--color5)] text-white flex items-center gap-2"
                                          onClick={() => handleDelete(r.id)}
                                          icon={<FaTrash />}
                                          iconPosition="left"
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
    />
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left">
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="text-sm break-words">{value || ""}</div>
    </div>
  );
}
