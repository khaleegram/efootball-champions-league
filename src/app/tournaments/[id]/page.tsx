import { adminDb } from '@/lib/firebase-admin';
import type { Tournament } from '@/lib/types';
import { TournamentClientPage } from './tournament-client-page';
import { notFound } from 'next/navigation';
import type { Timestamp } from 'firebase-admin/firestore';

async function getTournament(id: string): Promise<Tournament | null> {
  const docRef = adminDb.collection('tournaments').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data();
    if (!data) {
      return null;
    }
    // Manually convert Timestamps to serializable format for client components,
    // with a check to prevent crashes if the data is not a Timestamp.
    const startDate = data.startDate && typeof data.startDate.toDate === 'function' 
      ? (data.startDate as Timestamp).toDate().toISOString() 
      : data.startDate;
      
    const endDate = data.endDate && typeof data.endDate.toDate === 'function'
      ? (data.endDate as Timestamp).toDate().toISOString()
      : data.endDate;

    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      game: data.game,
      platform: data.platform,
      startDate: startDate,
      endDate: endDate,
      maxTeams: data.maxTeams,
      rules: data.rules,
      organizerId: data.organizerId,
    } as Tournament;
  } else {
    return null;
  }
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    notFound();
  }

  return <TournamentClientPage tournament={tournament} />;
}
