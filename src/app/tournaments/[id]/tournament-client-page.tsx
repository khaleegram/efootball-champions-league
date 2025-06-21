"use client";

import { useAuth } from "@/hooks/use-auth";
import type { Tournament } from "@/lib/types";
import { format } from "date-fns";
import { Calendar, Gamepad2, Info, List, Trophy, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { TeamsTab } from "./teams-tab";
import { FixturesTab } from "./fixtures-tab";
import { StandingsTab } from "./standings-tab";

export function TournamentClientPage({ tournament }: { tournament: Tournament }) {
  const { user } = useAuth();
  const isOrganizer = user?.uid === tournament.organizerId;
  const startDate = new Date(tournament.startDate as unknown as string);
  const endDate = new Date(tournament.endDate as unknown as string);
  
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
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <span>{tournament.game} on <strong>{tournament.platform}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
            </div>
             <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Up to <strong>{tournament.maxTeams} teams</strong></span>
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
              <TeamsTab tournamentId={tournament.id} isOrganizer={isOrganizer} />
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
