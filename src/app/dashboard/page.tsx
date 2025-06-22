
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { Tournament } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ArrowRight, Loader2, ShieldCheck, Gamepad2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MyTournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const q = query(collection(db, 'tournaments'), where('organizerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTournaments: Tournament[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tournamentData = { 
            id: doc.id, 
            ...data,
            startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
            endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
        } as Tournament;
        userTournaments.push(tournamentData);
      });
      setTournaments(userTournaments);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tournaments:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">My Tournaments</h1>
        <Link href="/dashboard/create-tournament">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Tournament
          </Button>
        </Link>
      </div>
      
      {tournaments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-muted rounded-lg">
          <h2 className="text-xl font-semibold">Your arena is empty!</h2>
          <p className="text-muted-foreground mt-2">Get started by creating your first tournament.</p>
          <Link href="/dashboard/create-tournament" className="mt-4 inline-block">
            <Button variant="outline">Create a new Tournament</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="flex flex-col bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-headline">{tournament.name}</CardTitle>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4"/>
                  {tournament.game} on {tournament.platform}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{tournament.description}</p>
                <div className="text-sm text-muted-foreground mt-4">
                  {format(tournament.startDate as Date, 'PPP')} - {format(tournament.endDate as Date, 'PPP')}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/tournaments/${tournament.id}`} className="w-full">
                  <Button variant="secondary" className="w-full">
                    Manage Tournament
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
