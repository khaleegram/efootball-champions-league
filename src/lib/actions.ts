
"use server";

import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Tournament, UserProfile, Team, Match } from './types';
import { calculateTournamentStandings } from '@/ai/flows/calculate-tournament-standings';

// This file contains server-side actions that interact with Firestore.
// All functions now correctly use the Firebase Admin SDK.

// USER PROFILE ACTIONS
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = adminDb.collection('users').doc(uid);
  await userRef.set(data, { merge: true });
}

// TOURNAMENT ACTIONS
export async function createTournament(data: Omit<Tournament, 'id' | 'startDate' | 'endDate'> & { dates: { from: Date, to: Date }}) {
  const { dates, ...rest } = data;
  const docRef = await adminDb.collection('tournaments').add({
    ...rest,
    startDate: dates.from,
    endDate: dates.to,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

// TEAM ACTIONS
export async function addTeam(tournamentId: string, teamData: Omit<Team, 'id' | 'tournamentId'>) {
    await adminDb.collection(`tournaments/${tournamentId}/teams`).add(teamData);
}

// MATCH ACTIONS
export async function createMatch(data: { tournamentId: string, homeTeamId: string, awayTeamId: string, matchDate: Date }) {
    await adminDb.collection(`tournaments/${data.tournamentId}/matches`).add({
        ...data,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
    });
}

// STANDINGS ACTIONS
export async function approveMatchResult(matchId: string, tournamentId: string) {
  // 1. Update match status
  const matchRef = adminDb.collection(`tournaments/${tournamentId}/matches`).doc(matchId);
  await matchRef.update({ status: 'approved' });

  // 2. Fetch all approved matches and teams for the tournament
  const matchesQuery = adminDb.collection(`tournaments/${tournamentId}/matches`).where('status', '==', 'approved');
  const teamsQuery = adminDb.collection(`tournaments/${tournamentId}/teams`);

  const [matchesSnapshot, teamsSnapshot] = await Promise.all([matchesQuery.get(), teamsQuery.get()]);

  const approvedMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Match[];
  const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (approvedMatches.length === 0) return;

  // 3. Prepare input for GenAI flow
  const aiInput = {
    tournamentId,
    matchResults: approvedMatches.map(m => ({
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore!,
      awayScore: m.awayScore!,
      approved: true,
    })),
    tieBreakerRules: "Standard football rules: 1. Points, 2. Goal Difference, 3. Goals For. Head-to-head is not required unless specified.",
  };

  // 4. Call GenAI to calculate standings
  const standingsResult = await calculateTournamentStandings(aiInput);

  // 5. Update standings in Firestore
  const batch = adminDb.batch();
  const standingsCollection = adminDb.collection('standings');

  // First, delete old standings for this tournament to prevent duplicates
  const oldStandingsQuery = standingsCollection.where('tournamentId', '==', tournamentId);
  const oldStandingsSnapshot = await oldStandingsQuery.get();
  oldStandingsSnapshot.forEach(doc => batch.delete(doc.ref));

  // Then, add the new standings
  standingsResult.forEach(standing => {
    const teamName = teams.find(t => t.id === standing.teamId)?.name || 'Unknown Team';
    const newStandingRef = standingsCollection.doc();
    batch.set(newStandingRef, {
      ...standing,
      tournamentId,
      teamName, // Denormalize for easier display
    });
  });

  await batch.commit();
}
