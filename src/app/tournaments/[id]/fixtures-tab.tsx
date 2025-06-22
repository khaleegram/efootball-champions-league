"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, query, type Timestamp, orderBy } from "firebase/firestore";
import type { Match, Team } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { approveMatchResult } from "@/lib/actions";
import { Loader2, CheckCircle, Clock, Shield, Upload } from "lucide-react";
import { format } from "date-fns";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Badge } from "@/components/ui/badge";
import { doc, updateDoc } from "firebase/firestore";

export function FixturesTab({ tournamentId, isOrganizer }: { tournamentId: string, isOrganizer: boolean }) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const matchQuery = query(collection(db, `tournaments/${tournamentId}/matches`), orderBy("round", "asc"));
        const teamQuery = query(collection(db, `tournaments/${tournamentId}/teams`));

        let teamsLoaded = false;
        let matchesLoaded = false;

        const checkDone = () => {
            if (active && teamsLoaded && matchesLoaded) {
                setLoading(false);
            }
        };

        const unsubMatches = onSnapshot(matchQuery, snapshot => {
            if (!active) return;
            const matchesData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return { 
                    id: doc.id, 
                    ...data,
                    matchDate: (data.matchDate as Timestamp)?.toDate ? (data.matchDate as Timestamp).toDate() : new Date(),
                } as Match;
            });
            setMatches(matchesData);
            matchesLoaded = true;
            checkDone();
        });

        const unsubTeams = onSnapshot(teamQuery, snapshot => {
            if (!active) return;
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
            setTeams(teamsData);
            teamsLoaded = true;
            checkDone();
        });

        return () => {
            active = false;
            unsubMatches();
            unsubTeams();
        };
    }, [tournamentId]);

    const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || 'Unknown Team';
    
    const groupedMatches = matches.reduce((acc, match) => {
        const round = match.round || 'Uncategorized';
        if (!acc[round]) {
            acc[round] = [];
        }
        acc[round].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Fixtures & Results</CardTitle>
                <CardDescription>Upcoming and completed matches.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : matches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No matches have been scheduled yet. The organizer needs to generate fixtures.</p>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
                            <div key={round}>
                                <h3 className="text-lg font-semibold mb-2 font-headline">{round}</h3>
                                <div className="space-y-4">
                                {roundMatches.map(match => (
                                    <MatchCard key={match.id} match={match} getTeamName={getTeamName} isOrganizer={isOrganizer} tournamentId={tournamentId} />
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function MatchCard({ match, getTeamName, isOrganizer, tournamentId }: { match: Match, getTeamName: (id: string) => string, isOrganizer: boolean, tournamentId: string }) {
    const { toast } = useToast();
    const [isApproving, setIsApproving] = useState(false);
    const homeTeamName = getTeamName(match.homeTeamId);
    const awayTeamName = getTeamName(match.awayTeamId);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await approveMatchResult(match.id, tournamentId);
            toast({ title: "Success", description: "Match result approved and standings are being updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to approve result." });
        } finally {
            setIsApproving(false);
        }
    };
    
    const statusBadge = {
        scheduled: <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>,
        pending_approval: <Badge variant="outline" className="text-amber-600 border-amber-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>,
        approved: <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>,
        disputed: <Badge variant="destructive"><Shield className="h-3 w-3 mr-1"/>Disputed</Badge>,
    }[match.status];

    return (
        <div className="border rounded-lg p-4 space-y-4 bg-card/50">
            <div className="flex justify-between items-start">
                <div>
                     {statusBadge}
                </div>
                <div className="flex gap-2">
                    {match.status === 'pending_approval' && isOrganizer && (
                         <Button size="sm" onClick={handleApprove} disabled={isApproving}>
                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4"/>}
                        </Button>
                    )}
                    <SubmitResultDialog match={match} homeTeamName={homeTeamName} awayTeamName={awayTeamName} isOrganizer={isOrganizer} />
                </div>
            </div>
            <div className="flex justify-between items-center text-center">
                <div className="flex-1 font-semibold">{homeTeamName}</div>
                <div className="text-2xl font-bold px-4">
                    {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                </div>
                <div className="flex-1 font-semibold">{awayTeamName}</div>
            </div>
        </div>
    )
}

function SubmitResultDialog({ match, homeTeamName, awayTeamName, isOrganizer }: { match: Match, homeTeamName: string, awayTeamName: string, isOrganizer: boolean }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [homeScore, setHomeScore] = useState<number | "">(match.homeScore ?? "");
  const [awayScore, setAwayScore] = useState<number | "">(match.awayScore ?? "");
  const [evidence, setEvidence] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeScore === "" || awayScore === "") {
        toast({variant: "destructive", title: "Error", description: "Please enter scores for both teams."});
        return;
    }
    if (!evidence) {
        toast({variant: "destructive", title: "Error", description: "Please upload screenshot evidence."});
        return;
    }
    setIsSubmitting(true);
    try {
        const storageRef = ref(storage, `tournaments/${match.tournamentId}/evidence/${match.id}_${evidence.name}`);
        const snapshot = await uploadBytes(storageRef, evidence);
        const evidenceUrl = await getDownloadURL(snapshot.ref);

        const matchRef = doc(db, `tournaments/${match.tournamentId}/matches`, match.id);
        await updateDoc(matchRef, {
            homeScore: Number(homeScore),
            awayScore: Number(awayScore),
            evidenceUrl,
            status: isOrganizer ? 'approved' : 'pending_approval'
        });

        if(isOrganizer) {
          await approveMatchResult(match.id, match.tournamentId);
        }

        toast({ title: "Success", description: `Result submitted. ${isOrganizer ? 'Match approved and standings updated.' : 'Awaiting organizer approval.'}` });
        setOpen(false);

    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to submit result." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
     <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Upload className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Match Result</DialogTitle>
          <DialogDescription>{homeTeamName} vs {awayTeamName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="homeScore">{homeTeamName} Score</Label>
                    <Input id="homeScore" type="number" value={homeScore} onChange={e => setHomeScore(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="awayScore">{awayTeamName} Score</Label>
                    <Input id="awayScore" type="number" value={awayScore} onChange={e => setAwayScore(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="evidence">Screenshot/Video Evidence</Label>
                <Input id="evidence" type="file" onChange={e => setEvidence(e.target.files?.[0] || null)} required accept="image/*,video/*" />
             </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isOrganizer ? "Submit & Approve" : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
