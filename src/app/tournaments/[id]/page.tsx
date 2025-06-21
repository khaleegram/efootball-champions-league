import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Tournament } from '@/lib/types';
import { TournamentClientPage } from './tournament-client-page';
import { notFound } from 'next/navigation';

async function getTournament(id: string): Promise<Tournament | null> {
  const docRef = doc(db, 'tournaments', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    // Manually convert Timestamps to serializable format for client components
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate.toDate().toISOString(),
      endDate: data.endDate.toDate().toISOString(),
    } as unknown as Tournament;
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
