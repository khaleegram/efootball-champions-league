"use server";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, db, googleAuthProvider } from './firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp, getDocs, query, where, updateDoc, writeBatch } from 'firebase/firestore';
import type { Tournament, UserProfile, Team, Match, Standing } from './types';
import { calculateTournamentStandings } from '@/ai/flows/calculate-tournament-standings';

// Auth Actions
export async function handleSignUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // Create a user profile document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    username: user.email?.split('@')[0] || `user_${Date.now()}`,
  });
  return JSON.stringify(user);
}

export async function handleSignIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return JSON.stringify(userCredential.user);
}

export async function handleGoogleSignIn() {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    
    // Create user profile if it doesn't exist
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split('@')[0],
    }, { merge: true });

    return JSON.stringify(user);
}

export async function handleSignOut() {
  await signOut(auth);
}

// User Profile Actions
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
}

// Tournament Actions
export async function createTournament(data: Omit<Tournament, 'id' | 'startDate' | 'endDate'> & { dates: { from: Date, to: Date }}) {
  const { dates, ...rest } = data;
  const docRef = await addDoc(collection(db, 'tournaments'), {
    ...rest,
    startDate: dates.from,
    endDate: dates.to,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Team Actions
export async function addTeam(tournamentId: string, teamData: Omit<Team, 'id' | 'tournamentId'>) {
    await addDoc(collection(db, `tournaments/${tournamentId}/teams`), teamData);
}

// Match Actions
export async function createMatch(data: { tournamentId: string, homeTeamId: string, awayTeamId: string, matchDate: Date }) {
    await addDoc(collection(db, `tournaments/${data.tournamentId}/matches`), {
        ...data,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
    });
}

export async function approveMatchResult(matchId: string, tournamentId: string) {
  // 1. Update match status
  const matchRef = doc(db, `tournaments/${tournamentId}/matches`, matchId);
  await updateDoc(matchRef, { status: 'approved' });

  // 2. Fetch all approved matches and teams for the tournament
  const matchesQuery = query(collection(db, `tournaments/${tournamentId}/matches`), where('status', '==', 'approved'));
  const teamsQuery = query(collection(db, `tournaments/${tournamentId}/teams`));

  const [matchesSnapshot, teamsSnapshot] = await Promise.all([getDocs(matchesQuery), getDocs(teamsQuery)]);

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
    // For now, we'll let the AI use standard tie-breaker rules.
    // This can be fetched from tournament settings in the future.
    tieBreakerRules: "Standard football rules: 1. Points, 2. Goal Difference, 3. Goals For. Head-to-head is not required unless specified.",
  };

  // 4. Call GenAI to calculate standings
  const standingsResult = await calculateTournamentStandings(aiInput);

  // 5. Update standings in Firestore
  const batch = writeBatch(db);
  const standingsCollection = collection(db, 'standings');

  // First, delete old standings for this tournament to prevent duplicates
  const oldStandingsQuery = query(standingsCollection, where('tournamentId', '==', tournamentId));
  const oldStandingsSnapshot = await getDocs(oldStandingsQuery);
  oldStandingsSnapshot.forEach(doc => batch.delete(doc.ref));

  // Then, add the new standings
  standingsResult.forEach(standing => {
    const teamName = teams.find(t => t.id === standing.teamId)?.name || 'Unknown Team';
    const newStandingRef = doc(standingsCollection);
    batch.set(newStandingRef, {
      ...standing,
      tournamentId,
      teamName, // Denormalize for easier display
    });
  });

  await batch.commit();
}
