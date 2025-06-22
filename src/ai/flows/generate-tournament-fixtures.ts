'use server';
/**
 * @fileOverview A Genkit flow to generate tournament fixtures based on a list of teams and a specified format.
 *
 * - generateTournamentFixtures - A function that creates a schedule of matches.
 * - GenerateFixturesInput - The input type for the generateTournamentFixtures function.
 * - GenerateFixturesOutput - The return type for the generateTournamentFixtures function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { TournamentFormat } from '@/lib/types';

const GenerateFixturesInputSchema = z.object({
  teamIds: z.array(z.string()).describe('An array of team IDs participating in the tournament.'),
  format: z.custom<TournamentFormat>().describe("The tournament format: 'league', 'cup', or 'champions-league'."),
});
export type GenerateFixturesInput = z.infer<typeof GenerateFixturesInputSchema>;

const GenerateFixturesOutputSchema = z.array(
    z.object({
        homeTeamId: z.string().describe('The ID of the home team.'),
        awayTeamId: z.string().describe('The ID of the away team.'),
        round: z.string().describe('The round or stage of the tournament this match belongs to (e.g., "Round 1", "Quarter-Final", "Group A").'),
    })
).describe('An array of generated match fixtures.');
export type GenerateFixturesOutput = z.infer<typeof GenerateFixturesOutputSchema>;

export async function generateTournamentFixtures(input: GenerateFixturesInput): Promise<GenerateFixturesOutput> {
  return generateFixturesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFixturesPrompt',
  input: { schema: GenerateFixturesInputSchema },
  output: { schema: GenerateFixturesOutputSchema },
  prompt: `You are a tournament scheduler. Your task is to generate a complete set of match fixtures for a tournament based on the provided list of team IDs and the specified format.

Tournament Details:
- Team IDs: {{#each teamIds}} {{this}} {{/each}}
- Format: {{format}}

Instructions:
1.  **Shuffle Teams**: Before creating fixtures, randomly shuffle the list of team IDs to ensure fairness.
2.  **League Format**: If the format is 'league', generate a single round-robin schedule where every team plays every other team exactly once. Label each set of matches as "Round 1", "Round 2", etc.
3.  **Cup Format**: If the format is 'cup', generate a single-elimination knockout bracket.
    - If the number of teams is not a power of two (4, 8, 16, 32), create a preliminary "Play-In Round" for some teams to qualify for the main bracket (e.g., for 12 teams, 8 teams get a bye and 4 teams play in the Play-In Round to determine the last 2 spots in the Quarter-Finals).
    - Label the rounds appropriately: "Play-In Round", "Round of 16", "Quarter-Final", "Semi-Final", "Final".
4.  **Champions League Format**: If the format is 'champions-league', generate a group stage.
    - Divide the teams into balanced groups (e.g., for 16 teams, create 4 groups of 4).
    - For each group, generate a double round-robin schedule where every team plays every other team in their group twice (once at home, once away).
    - Label the round with the group name (e.g., "Group A", "Group B").
5.  **Output**: Ensure the output is a valid JSON array of match objects, each containing 'homeTeamId', 'awayTeamId', and 'round'. Do not create matches where a team plays against itself. Ensure all teams are included in the fixtures.
`,
});

const generateFixturesFlow = ai.defineFlow(
  {
    name: 'generateFixturesFlow',
    inputSchema: GenerateFixturesInputSchema,
    outputSchema: GenerateFixturesOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
