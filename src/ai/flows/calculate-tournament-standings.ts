'use server';
/**
 * @fileOverview A Genkit flow to calculate tournament standings based on approved match results,
 * incorporating GenAI to resolve complex tie-breaker scenarios.
 *
 * - calculateTournamentStandings - A function that calculates and updates tournament standings.
 * - CalculateTournamentStandingsInput - The input type for the calculateTournamentStandings function.
 * - CalculateTournamentStandingsOutput - The return type for the calculateTournamentStandings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateTournamentStandingsInputSchema = z.object({
  tournamentId: z.string().describe('The ID of the tournament to calculate standings for.'),
  matchResults: z.array(
    z.object({
      homeTeamId: z.string().describe('The ID of the home team.'),
      awayTeamId: z.string().describe('The ID of the away team.'),
      homeScore: z.number().describe('The home team score.'),
      awayScore: z.number().describe('The away team score.'),
      approved: z.boolean().describe('Whether the match result is approved by the organizer.'),
    })
  ).describe('A list of match results for the tournament.'),
  tieBreakerRules: z.string().optional().describe('Optional tie-breaker rules to apply.'),
});
export type CalculateTournamentStandingsInput = z.infer<typeof CalculateTournamentStandingsInputSchema>;

const CalculateTournamentStandingsOutputSchema = z.array(
  z.object({
    teamId: z.string().describe('The ID of the team.'),
    wins: z.number().describe('Number of wins.'),
    losses: z.number().describe('Number of losses.'),
    draws: z.number().describe('Number of draws.'),
    goalsFor: z.number().describe('Total goals scored by the team.'),
    goalsAgainst: z.number().describe('Total goals conceded by the team.'),
    points: z.number().describe('Total points earned by the team.'),
    ranking: z.number().describe('The rank of the team in the tournament.'),
  })
).describe('An array of team standings for the tournament.');
export type CalculateTournamentStandingsOutput = z.infer<typeof CalculateTournamentStandingsOutputSchema>;

export async function calculateTournamentStandings(input: CalculateTournamentStandingsInput): Promise<CalculateTournamentStandingsOutput> {
  return calculateTournamentStandingsFlow(input);
}

const calculateTournamentStandingsPrompt = ai.definePrompt({
  name: 'calculateTournamentStandingsPrompt',
  input: {schema: CalculateTournamentStandingsInputSchema},
  output: {schema: CalculateTournamentStandingsOutputSchema},
  prompt: `You are an expert tournament statistician. Given the following tournament match results and tie-breaker rules, calculate the standings for each team.

Match Results:
{{#each matchResults}}
  - Home Team: {{this.homeTeamId}}, Away Team: {{this.awayTeamId}}, Home Score: {{this.homeScore}}, Away Score: {{this.awayScore}}, Approved: {{this.approved}}
{{/each}}

Tie-Breaker Rules (if any):
{{tieBreakerRules}}

Calculate the tournament standings, breaking ties using the provided rules or standard sports tie-breaking procedures (e.g., head-to-head record, goal difference, goals scored) if no specific rules are provided. Each team must have a ranking.

Ensure the output is a JSON array of team standings with teamId, wins, losses, draws, goalsFor, goalsAgainst, points and ranking for each team. Only include approved matches when calculating the standings.
`,
});

const calculateTournamentStandingsFlow = ai.defineFlow(
  {
    name: 'calculateTournamentStandingsFlow',
    inputSchema: CalculateTournamentStandingsInputSchema,
    outputSchema: CalculateTournamentStandingsOutputSchema,
  },
  async input => {
    const {output} = await calculateTournamentStandingsPrompt(input);
    return output!;
  }
);
