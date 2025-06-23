"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import type { Tournament } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, KeyRound } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Only fetch public tournaments
    const q = query(collection(db, 'tournaments'), where("isPublic", "==", true), orderBy('startDate', 'desc'));
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

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold font-headline">Browse Public Tournaments</h1>
          <Link href="/tournaments/join">
            <Button variant="outline">
              <KeyRound className="mr-2" /> Join with Code
            </Button>
          </Link>
        </div>
        
        <div className="relative">
            <Input 
                type="text"
                placeholder="Search public tournaments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
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
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No tournaments found.</h2>
            <p className="text-muted-foreground mt-2">{searchTerm ? "Try a different search term." : "Check back later for new competitions!"}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => {
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
