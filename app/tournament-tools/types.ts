export interface Player {
    name: string;
    ppd: number;
    mpr: number;
    paid: boolean;
  }
  
  export interface Location {
    id: string;
    name: string;
  }
  
  export interface Tournament {
    id: string;
    name: string;
    date: string;
    location: string;
    entry_fee?: number; // Optional
    bar_contribution?: number; // Optional
    usage_fee?: number; // Optional
    bonus_money?: number; // Optional
    payout_spots?: number; // Optional
    tournament_type: string | null;
    tournament_code?: string | null;
    players: { name: string; ppd: number; mpr: number; paid: boolean }[];
    teams: { name: string; players: string[] }[];
    created_at: string;
    tournament_completed?: boolean;
  }