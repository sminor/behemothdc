// app/tournament-tools/teamGenerators/index.ts
export interface TournamentType {
    name: string; // Display name for select boxes
    fileName: string; // File name in teamGenerators/ without .tsx
  }
  
  export const tournamentTypes: TournamentType[] = [
    { name: 'A/B Draw', fileName: 'abDraw' },
    { name: 'Blind Draw', fileName: 'blindDraw' },
    { name: 'Partner Bring', fileName: 'partnerBring' },
    { name: 'Parity Draw', fileName: 'parityDraw' },
    { name: 'Low Player Pick', fileName: 'lowPlayerPick' },
    { name: 'High Player Pick', fileName: 'highPlayerPick' },
    { name: 'A/B/C Draw Trios', fileName: 'abcDrawTrios' },
    
    
    // Add new types here, e.g., { name: 'New Type', fileName: 'newType' }
  ];