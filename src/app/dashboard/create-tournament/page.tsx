"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { createTournament } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TournamentFormat } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const tournamentSchema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  game: z.string().min(1, { message: "Please specify the game." }),
  platform: z.string().min(1, { message: "Please select a platform." }),
  format: z.custom<TournamentFormat>(val => ['league', 'cup', 'champions-league'].includes(val as string), {
      message: "Please select a valid tournament format."
  }),
  dates: z.object({
    from: z.date(),
    to: z.date(),
  }),
  maxTeams: z.coerce.number().int().min(4, { message: "Maximum teams must be at least 4." }),
  rules: z.string().optional(),
  
  isPublic: z.boolean().default(true),
  matchLength: z.coerce.number().int().min(1, "Match length must be at least 1 minute."),
  substitutions: z.coerce.number().int().min(0, "Number of substitutions cannot be negative."),
  extraTime: z.boolean().default(false),
  penalties: z.boolean().default(false),
  injuries: z.boolean().default(false),
  homeAndAway: z.boolean().default(false),
  squadRestrictions: z.string().optional(),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: '',
      description: '',
      game: 'eFootball 2024',
      platform: 'PS5',
      format: 'league',
      dates: {
        from: new Date(),
        to: addDays(new Date(), 7),
      },
      maxTeams: 16,
      rules: '',
      isPublic: true,
      matchLength: 6,
      substitutions: 5,
      extraTime: false,
      penalties: false,
      injuries: false,
      homeAndAway: false,
      squadRestrictions: 'No specific squad restrictions.',
    },
  });

  async function onSubmit(values: TournamentFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a tournament." });
      return;
    }
    setIsLoading(true);
    try {
      const { dates, ...restOfValues } = values;
      const tournamentData = {
        ...restOfValues,
        startDate: dates.from,
        endDate: dates.to,
        organizerId: user.uid,
      };

      const tournamentId = await createTournament(tournamentData);
      toast({ title: "Success!", description: "Your tournament has been created." });
      router.push(`/tournaments/${tournamentId}`);
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Error creating tournament", description: error.message || "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Create a New Tournament</CardTitle>
        <CardDescription>Fill out the details below to set up your next eFootball competition.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sunday Night League" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Tournament</FormLabel>
                    <FormDescription>
                      Public tournaments are visible on the browse page. Private ones require a code to join.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of your tournament." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-8">
               <FormField
                  control={form.control}
                  name="game"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game</FormLabel>
                      <FormControl>
                         <Input {...field} />
                      </FormControl>
                      <FormDescription>e.g., eFootball 2025</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tournament Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a format" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="league">League</SelectItem>
                        <SelectItem value="cup">Cup (Single Elimination)</SelectItem>
                        <SelectItem value="champions-league">Champions League</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormDescription>Choose the structure of your competition.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tournament Dates</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={field.value.from}
                          selected={{ from: field.value.from, to: field.value.to }}
                          onSelect={(range) => field.onChange(range || { from: new Date(), to: new Date() })}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="maxTeams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Teams</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div>
              <h3 className="text-lg font-medium">Custom Rules</h3>
              <p className="text-sm text-muted-foreground">Define the specific rules for matches in your tournament.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="matchLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Length (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="substitutions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Substitutions per Match</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select number of subs" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="7">7</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <FormField
                    control={form.control}
                    name="extraTime"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <FormLabel>Extra Time</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="penalties"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <FormLabel>Penalties</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="injuries"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <FormLabel>Injuries</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="homeAndAway"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <FormLabel>Home/Away</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="squadRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Squad Restrictions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Max 3 legendary players, only silver ball players allowed." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Rules / Code of Conduct</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detail any other general rules for your tournament." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="shadow-lg shadow-primary/20">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tournament
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
