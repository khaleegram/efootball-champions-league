"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import type { Team } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addTeam } from "@/lib/actions";
import { Loader2, PlusCircle, User, Users } from "lucide-react";

export function TeamsTab({ tournamentId, isOrganizer }: { tournamentId: string; isOrganizer: boolean }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, `tournaments/${tournamentId}/teams`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];
      setTeams(teamsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tournamentId]);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline flex items-center gap-2"><Users className="w-5 h-5"/>Registered Teams</CardTitle>
          <CardDescription>The teams competing in this tournament.</CardDescription>
        </div>
        {isOrganizer && <AddTeamDialog tournamentId={tournamentId} />}
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : teams.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No teams have registered yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Team Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(team => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={team.logoUrl} alt={team.name} />
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AddTeamDialog({ tournamentId }: { tournamentId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !user) return;
    setIsSubmitting(true);

    try {
      let logoUrl = "";
      if (teamLogo) {
        const storageRef = ref(storage, `tournaments/${tournamentId}/logos/${Date.now()}_${teamLogo.name}`);
        const snapshot = await uploadBytes(storageRef, teamLogo);
        logoUrl = await getDownloadURL(snapshot.ref);
      }
      
      await addTeam(tournamentId, {
        name: teamName,
        logoUrl,
        captainId: user.uid,
      });

      toast({ title: "Success", description: "Team added successfully." });
      setOpen(false);
      setTeamName("");
      setTeamLogo(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add team." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Team</DialogTitle>
          <DialogDescription>Enter the team's details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Team Name</Label>
              <Input id="name" value={teamName} onChange={e => setTeamName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logo" className="text-right">Logo</Label>
              <Input id="logo" type="file" onChange={e => setTeamLogo(e.target.files?.[0] || null)} className="col-span-3" accept="image/*" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
