import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  username?: string;
  psnId?: string;
  xboxGamertag?: string;
  konamiId?: string;
  pcId?: string;
}

export type TournamentFormat = 'league' | 'cup' | 'champions-league';
export type TournamentStatus = 'open_for_registration' | 'generating_fixtures' | 'in_progress' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  game: string;
  platform: string;
  startDate: Date | Timestamp; 
  endDate: Date | Timestamp;
  maxTeams: number;
  rules?: string;
  organizerId: string;
  createdAt?: Timestamp;
  format: TournamentFormat;
  status: TournamentStatus;
  // New fields
  code: string;
  isPublic: boolean;
  matchLength: number;
  extraTime: boolean;
  penalties: boolean;
  squadRestrictions: string;
  injuries: boolean;
  homeAndAway: boolean;
  substitutions: number;
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  logoUrl?: string;
  captainId: string;
}


export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: Date | Timestamp;
  status: 'scheduled' | 'pending_approval' | 'approved' | 'disputed';
  evidenceUrl?: string;
  round?: string;
}

export interface Standing {
  teamId: string;
  teamName?: string;
  tournamentId: string;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  ranking: number;
}
