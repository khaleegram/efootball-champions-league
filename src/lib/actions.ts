'use server';

import { getAdminDb, Timestamp, FieldValue } from './firebase-admin';
import type { Tournament, UserProfile, Team, Match, Standing, TournamentFormat } from './types';
import { calculateTournamentStandings } from '@/ai/flows/calculate-tournament-standings';
import { generateTournamentFixtures } from '@/ai/flows/generate-tournament-fixtures';

// USER PROFILE ACTIONS
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
  try {
    const { startDate, endDate, ...rest } = data;
    
    // Convert to Date objects first
    const startDateObj = new Date(startDate as any);
    const endDateObj = new Date(endDate as any);
    
    const docRef = await adminDb.collection('tournaments').add({
      ...rest,
      startDate: Timestamp.fromDate(startDateObj),
      endDate: Timestamp.fromDate(endDateObj),
      status: 'open_for_registration',
      createdAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating tournament in server action: ", error);
    
    if (error.message && error.message.includes("Cloud Firestore API has not been used")) {
         throw new Error("Firestore is not enabled for this project. Please go to the Firebase Console to create a Firestore database.");
    }
    if (error.code === 16 || (error.message && error.message.includes("UNAUTHENTICATED"))) {
        throw new Error("Authentication failed. Please check that your FIREBASE_SERVICE_ACCOUNT_KEY in the .env file is correct, has not been revoked, and that the service account has the necessary permissions ('Cloud Datastore User' or 'Editor' role) in your Google Cloud project.");
    }
    throw new Error(`A server error occurred while creating the tournament. Reason: ${error.message}`);
  }
}

// TEAM ACTIONS
export async function addTeam(tournamentId: string, teamData: Omit<Team, 'id' | 'tournamentId'>) {
  const adminDb = getAdminDb();
  try {
    await adminDb.collection(`tournaments/${tournamentId}/teams`).add(teamData);
  } catch (error: any) {
    console.error("Error adding team:", error);
    throw new Error("Failed to add team on the server.");
  }
}

// MATCH ACTIONS
export async function generateFixtures(tournamentId: string) {
  const adminDb = getAdminDb();
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
    await tournamentRef.update({ status: 'open_for_registration' });
    console.error("Error generating fixtures:", error);
    throw new Error(error.message || "An error occurred while generating fixtures.");
  }
}

// STANDINGS ACTIONS
export async function approveMatchResult(matchId: string, tournamentId: string) {
  const adminDb = getAdminDb();
  try {
    const matchRef = adminDb.collection(`tournaments/${tournamentId}/matches`).doc(matchId);
    await matchRef.update({ status: 'approved' });

    const matchesQuery = adminDb
      .collection(`tournaments/${tournamentId}/matches`)
      .where('status', '==', 'approved');
    const teamsQuery = adminDb.collection(`tournaments/${tournamentId}/teams`);

    const [matchesSnapshot, teamsSnapshot] = await Promise.all([matchesQuery.get(), teamsQuery.get()]);

    const approvedMatches = matchesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Match[];

    const teams = teamsSnapshot.docs.map(doc => {
      const data = doc.data() as Team;
      return {
        ...data,
        id: doc.id,
      };
    });

    if (approvedMatches.length === 0) return;

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

    const standingsResult = await calculateTournamentStandings(aiInput);

    const batch = adminDb.batch();
    const standingsCollectionRef = adminDb.collection('standings');

    const oldStandingsQuery = standingsCollectionRef.where('tournamentId', '==', tournamentId);
    const oldStandingsSnapshot = await oldStandingsQuery.get();
    oldStandingsSnapshot.forEach(doc => batch.delete(doc.ref));

    standingsResult.forEach(standing => {
      const teamName = teams.find(t => t.id === standing.teamId)?.name || 'Unknown Team';
      const newStandingRef = standingsCollectionRef.doc();
      batch.set(newStandingRef, {
        ...standing,
        tournamentId,
        teamName,
      });
    });

    await batch.commit();
  } catch (error: any) {
    console.error("Error approving match result:", error);
    throw new Error("Failed to approve match result on the server.");
  }
}