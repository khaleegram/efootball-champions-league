"use client";

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from "@/hooks/use-auth";
import type { Tournament } from "@/lib/types";
import { format } from "date-fns";
import { Calendar, Gamepad2, Info, List, Trophy, Users, Loader2, Lock, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { TeamsTab } from "./teams-tab";
import { FixturesTab } from "./fixtures-tab";
import { StandingsTab } from "./standings-tab";

const toDate = (date: any): Date | null => {
  if (!date) return null;
  if (typeof date.toDate === 'function') return date.toDate();
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export default function TournamentPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, 'tournaments', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const tournamentData: Tournament = {
          id: docSnap.id,
          name: data.name || '',
          description: data.description || '',
          game: data.game || '',
          platform: data.platform || '',
          startDate: data.startDate,
          endDate: data.endDate,
          maxTeams: data.maxTeams || 0,
          rules: data.rules || '',
          organizerId: data.organizerId || '',
          format: data.format || 'league',
          status: data.status || 'open_for_registration',
          code: data.code || '',
          isPublic: data.isPublic === undefined ? true : data.isPublic,
          matchLength: data.matchLength || 6,
          extraTime: data.extraTime || false,
          penalties: data.penalties || false,
          squadRestrictions: data.squadRestrictions || '',
          injuries: data.injuries || false,
          homeAndAway: data.homeAndAway || false,
          substitutions: data.substitutions || 5,
        };
        setTournament(tournamentData);
      } else {
        setTournament(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Failed to fetch tournament:", error);
        setTournament(null);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return notFound();
  }

  const isOrganizer = user?.uid === tournament.organizerId;
  const startDate = toDate(tournament.startDate);
  const endDate = toDate(tournament.endDate);

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <div className="space-y-2">
            <h1 className="font-headline text-4xl font-bold">{tournament.name}</h1>
            <p className="text-lg text-muted-foreground">{tournament.description}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {tournament.isPublic ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              <span>{tournament.isPublic ? 'Public' : 'Private'} Tournament</span>
            </div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <span>{tournament.game} on <strong>{tournament.platform}</strong></span>
            </div>
            {startDate && endDate && (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
                </div>
            )}
             <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Up to <strong>{tournament.maxTeams} teams</strong></span>
            </div>
             <div className="flex items-center gap-2 capitalize">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>Format: <strong>{tournament.format.replace('-', ' ')}</strong></span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview"><Info className="w-4 h-4 mr-2"/>Overview</TabsTrigger>
              <TabsTrigger value="teams"><Users className="w-4 h-4 mr-2"/>Teams</TabsTrigger>
              <TabsTrigger value="fixtures"><List className="w-4 h-4 mr-2"/>Fixtures</TabsTrigger>
              <TabsTrigger value="standings"><Trophy className="w-4 h-4 mr-2"/>Standings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <OverviewTab tournament={tournament} />
            </TabsContent>
            <TabsContent value="teams" className="mt-4">
              <TeamsTab tournament={tournament} isOrganizer={isOrganizer} />
            </TabsContent>
            <TabsContent value="fixtures" className="mt-4">
                <FixturesTab tournamentId={tournament.id} isOrganizer={isOrganizer} />
            </TabsContent>
            <TabsContent value="standings" className="mt-4">
              <StandingsTab tournamentId={tournament.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
