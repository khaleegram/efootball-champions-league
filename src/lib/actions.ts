'use server';

import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Tournament, UserProfile, Team, Match, Standing, TournamentFormat } from './types';
import { calculateTournamentStandings } from '@/ai/flows/calculate-tournament-standings';
import { generateTournamentFixtures } from '@/ai/flows/generate-tournament-fixtures';

// USER PROFILE ACTIONS
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.set(data, { merge: true });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update user profile on the server.");
  }
}

// TOURNAMENT ACTIONS
export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'status'> & { organizerId: string }) {
  try {
    const { ...rest } = data;
    const docRef = await adminDb.collection('tournaments').add({
      ...rest,
      status: 'open_for_registration',
      createdAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating tournament in server action: ", error);
    if (error.message && error.message.includes("Cloud Firestore API has not been used")) {
         throw new Error("Firestore is not enabled for this project. Please go to the Firebase Console to create a Firestore database.");
    }
    throw new Error("A server error occurred while creating the tournament.");
  }
}

// TEAM ACTIONS
export async function addTeam(tournamentId: string, teamData: Omit<Team, 'id' | 'tournamentId'>) {
    try {
      await adminDb.collection(`tournaments/${tournamentId}/teams`).add(teamData);
    } catch (error: any) {
      console.error("Error adding team:", error);
      throw new Error("Failed to add team on the server.");
    }
}

// MATCH ACTIONS
export async function generateFixtures(tournamentId: string) {
  const tournamentRef = adminDb.collection('tournaments').doc(tournamentId);
  const tournamentDoc = await tournamentRef.get();
  if (!tournamentDoc.exists) throw new Error("Tournament not found");

  const tournament = tournamentDoc.data() as Tournament;
  if (tournament.status !== 'open_for_registration') {
    throw new Error("Fixtures can only be generated for tournaments that are open for registration.");
  }
  
  await tournamentRef.update({ status: 'generating_fixtures' });

  try {
    const teamsQuery = await adminDb.collection(`tournaments/${tournamentId}/teams`).get();
    const teamIds = teamsQuery.docs.map(doc => doc.id);
  
    if (teamIds.length < 4) {
      throw new Error("At least 4 teams are required to generate fixtures.");
    }
  
    const fixtures = await generateTournamentFixtures({
      teamIds,
      format: tournament.format
    });
  
    const batch = adminDb.batch();
    const matchesCollection = adminDb.collection(`tournaments/${tournamentId}/matches`);
  
    fixtures.forEach(fixture => {
      const matchRef = matchesCollection.doc();
      batch.set(matchRef, {
        ...fixture,
        tournamentId,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        matchDate: tournament.startDate, // Default to tournament start date, can be edited later
      });
    });
  
    await batch.commit();
    await tournamentRef.update({ status: 'in_progress' });

  } catch(error: any) {
    // If anything fails, revert the status
    await tournamentRef.update({ status: 'open_for_registration' });
    console.error("Error generating fixtures:", error);
    throw new Error(error.message || "An error occurred while generating fixtures.");
  }
}

// STANDINGS ACTIONS
export async function approveMatchResult(matchId: string, tournamentId: string) {
  try {
    // 1. Update match status
    const matchRef = adminDb.collection(`tournaments/${tournamentId}/matches`).doc(matchId);
    await matchRef.update({ status: 'approved' });

    // 2. Fetch all approved matches and teams for the tournament
    const matchesQuery = adminDb
        .collection(`tournaments/${tournamentId}/matches`)
        .where('status', '==', 'approved');
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

    // 5. Update standings in Firestore using a batch write
    const batch = adminDb.batch();
    const standingsCollectionRef = adminDb.collection('standings');

    // First, delete old standings for this tournament to prevent duplicates
    const oldStandingsQuery = standingsCollectionRef.where('tournamentId', '==', tournamentId);
    const oldStandingsSnapshot = await oldStandingsQuery.get();
    oldStandingsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Then, add the new standings
    standingsResult.forEach(standing => {
      const teamName = teams.find(t => t.id === standing.teamId)?.name || 'Unknown Team';
      const newStandingRef = standingsCollectionRef.doc(); // Create a new doc reference
      batch.set(newStandingRef, {
        ...standing,
        tournamentId,
        teamName, // Denormalize for easier display
      });
    });

    await batch.commit();
  } catch (error: any) {
      console.error("Error approving match result:", error);
      throw new Error("Failed to approve match result on the server.");
  }
}
