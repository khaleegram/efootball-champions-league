"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, type Timestamp } from 'firebase/firestore';
import type { Tournament } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const safeToDate = (date: any): Date | null => {
  if (!date) return null;
  // Check if it's an object with a toDate method, like a Firestore Timestamp
  if (typeof date === 'object' && date !== null && typeof date.toDate === 'function') {
    return date.toDate();
  }
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export default function BrowseTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allTournaments = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Tournament;
      });
      setTournaments(allTournaments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tournaments: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">Browse Tournaments</h1>
        </div>
        
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No tournaments found.</h2>
            <p className="text-muted-foreground mt-2">Check back later for new competitions!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => {
                const startDate = safeToDate(tournament.startDate);
                const endDate = safeToDate(tournament.endDate);
                return (
                <Card key={tournament.id} className="flex flex-col">
                    <CardHeader>
                    <CardTitle className="font-headline">{tournament.name}</CardTitle>
                    <CardDescription>{tournament.game} on {tournament.platform}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{tournament.description}</p>
                    {startDate && endDate && (
                        <div className="text-sm text-muted-foreground mt-4">
                            {format(startDate, 'PPP')} - {format(endDate, 'PPP')}
                        </div>
                    )}
                    </CardContent>
                    <CardFooter>
                    <Link href={`/tournaments/${tournament.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    </CardFooter>
                </Card>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
