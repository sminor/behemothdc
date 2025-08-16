"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { FaDownload, FaSync, FaTrash } from "react-icons/fa";

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
  league_name: string; // used as "Division" in UI
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

  useEffect(() => {
    if (!isOpen || !leagueId) return;
    refresh();
    setExpandedIds({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leagueId]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("league_signups")
        .select("*")
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
    return rows.filter((r) => {
      if (showOnlyUnconfirmed && r.confirmed_paid) return false;
      if (!q) return true;
      const blob = [
        r.team_name,
        r.league_name,
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

  // Toggle confirmed_paid with optimistic UI (and don't toggle row)
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
      "league_name",
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
      ...rowsOut.map((r) =>
        [
          r.id,
          r.created_at,
          r.team_name,
          r.league_name,
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
          .join(",")
      ),
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
            {/* Left: search + checkbox (match AdminEvents styles) */}
            <div className="w-full md:w-auto">
              {/* Search bar */}
              <div className="mb-2 w-full max-w-[400px]">
                <input
                  type="text"
                  placeholder="Search signups..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="w-full p-2 rounded-md border border-[var(--form-border)] bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                />
              </div>

              {/* Checkbox under search */}
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
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[var(--form-border)]">
                    <th className="py-2 pr-4">Team</th>
                    <th className="py-2 pr-4">Division</th>
                    <th className="py-2 pr-4">Captain</th>
                    <th className="py-2 pr-4">Teammate</th>
                    <th className="py-2 pr-4">Confirmed Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const isOpenRow = !!expandedIds[r.id];
                    return (
                      <React.Fragment key={r.id}>
                        {/* Summary row (click to expand) */}
                        <tr
                          className="border-b border-[var(--form-border)] cursor-pointer hover:bg-white/5"
                          onClick={() =>
                            setExpandedIds((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                          }
                        >
                          <td className="py-2 pr-4">{r.team_name}</td>
                          <td className="py-2 pr-4">{r.league_name}</td>
                          <td className="py-2 pr-4">{r.captain_name}</td>
                          <td className="py-2 pr-4">{r.teammate_name ?? ""}</td>
                          <td
                            className="py-2 pr-4"
                            onClick={(e) => {
                              e.stopPropagation(); // don't toggle expand on checkbox click
                            }}
                          >
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
                            <td colSpan={5} className="py-3 pr-4">
                              {/* Captain row (4 columns) */}
                              <div className="mb-4">
                                <div className="grid md:grid-cols-4 gap-4">
                                  <Detail label="Captain ADL Number" value={r.captain_adl_number} />
                                  <Detail label="Captain Email" value={r.captain_email} />
                                  <Detail label="Captain Phone" value={r.captain_phone_number} />
                                  <Detail
                                    label="Captain NDA Sanctioned"
                                    value={r.captain_paid_nda ? "Yes" : "No"}
                                  />
                                </div>
                              </div>

                              {/* Teammate row (4 columns) */}
                              <div className="mb-4">
                                <div className="grid md:grid-cols-4 gap-4">
                                  <Detail label="Teammate ADL Number" value={r.teammate_adl_number ?? ""} />
                                  <Detail label="Teammate Email" value={r.teammate_email ?? ""} />
                                  <Detail label="Teammate Phone" value={r.teammate_phone_number ?? ""} />
                                  <Detail
                                    label="Teammate NDA Sanctioned"
                                    value={
                                      r.teammate_paid_nda == null
                                        ? ""
                                        : r.teammate_paid_nda
                                        ? "Yes"
                                        : "No"
                                    }
                                  />
                                </div>
                              </div>
                              <div className="my-4 h-[1px] w-full bg-[var(--color2)] rounded" />

                              {/* Other details */}
                              <div className="mb-2">
                                <div className="grid md:grid-cols-4 gap-4">
                                  <Detail label="Home Location 1" value={r.home_location_1} />
                                  <Detail label="Home Location 2" value={r.home_location_2} />
                                  <Detail label="Play Preference" value={r.play_preference} />
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
                                  <Detail label="Payment Method" value={r.payment_method} />
                                  <Detail label="Signup ID" value={r.id} />
                                  <Detail
                                    label="Created Date/Time"
                                    value={new Date(r.created_at).toLocaleString()}
                                  />
                                </div>
                              </div>

                              <div
                                className="flex justify-end mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
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
    <div>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="text-sm break-words">{value || ""}</div>
    </div>
  );
}
