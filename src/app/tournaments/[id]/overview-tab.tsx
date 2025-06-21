"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tournament } from "@/lib/types";
import { FileText } from "lucide-react";

export function OverviewTab({ tournament }: { tournament: Tournament }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><FileText className="w-5 h-5"/> Tournament Rules</CardTitle>
            </CardHeader>
            <CardContent>
                {tournament.rules ? (
                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                        <pre className="whitespace-pre-wrap text-sm">{tournament.rules}</pre>
                    </ScrollArea>
                ) : (
                    <p className="text-muted-foreground">The organizer has not specified any rules for this tournament.</p>
                )}
            </CardContent>
        </Card>
    )
}
