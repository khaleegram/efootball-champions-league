"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import type { Standing, Team } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export function StandingsTab({ tournamentId }: { tournamentId: string }) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const standingsQuery = query(collection(db, "standings"), where("tournamentId", "==", tournamentId), orderBy("ranking", "asc"));
    const teamsQuery = query(collection(db, `tournaments/${tournamentId}/teams`));

    const unsubStandings = onSnapshot(standingsQuery, (snapshot) => {
      const standingsData = snapshot.docs.map(doc => doc.data() as Standing);
      setStandings(standingsData);
      if(teams.length > 0 || snapshot.docs.length === 0) setLoading(false);
    });
    
    const unsubTeams = onSnapshot(teamsQuery, (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Team);
        setTeams(teamsData);
        if(standings.length > 0 || snapshot.docs.length === 0) setLoading(false);
    });

    return () => {
        unsubStandings();
        unsubTeams();
    };
  }, [tournamentId]);

  const getTeamInfo = (teamId: string) => {
    return teams.find(t => t.id === teamId) || { name: 'Unknown', logoUrl: ''};
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Trophy className="w-5 h-5"/> Tournament Standings</CardTitle>
        <CardDescription>Live rankings based on approved match results.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : standings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Standings will appear here once matches are played and results are approved.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">GF</TableHead>
                <TableHead className="text-center">GA</TableHead>
                <TableHead className="text-center">GD</TableHead>
                <TableHead className="text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map(standing => {
                const teamInfo = getTeamInfo(standing.teamId);
                return (
                  <TableRow key={standing.teamId}>
                    <TableCell className="font-bold text-lg">{standing.ranking}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={teamInfo.logoUrl} alt={teamInfo.name} />
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{teamInfo.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{standing.wins}</TableCell>
                    <TableCell className="text-center">{standing.draws}</TableCell>
                    <TableCell className="text-center">{standing.losses}</TableCell>
                    <TableCell className="text-center">{standing.goalsFor}</TableCell>
                    <TableCell className="text-center">{standing.goalsAgainst}</TableCell>
                    <TableCell className="text-center">{standing.goalsFor - standing.goalsAgainst}</TableCell>
                    <TableCell className="text-center font-bold">{standing.points}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
