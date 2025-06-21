import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  username?: string;
  psnId?: string;
  xboxGamertag?: string;
  konamiId?: string;
  pcId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  game: string;
  platform: string;
  startDate: Timestamp;
  endDate: Timestamp;
  maxTeams: number;
  rules: string;
  organizerId: string;
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
  matchDate: Timestamp;
  status: 'scheduled' | 'pending_approval' | 'approved' | 'disputed';
  evidenceUrl?: string;
}

export interface Standing {
  teamId: string;
  teamName?: string;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  ranking: number;
}
