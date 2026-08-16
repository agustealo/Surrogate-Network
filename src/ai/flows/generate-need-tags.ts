
'use server';

/**
 * @fileOverview An AI agent that suggests relevant 'Need Tags' based on a user's description of their needs.
 *
 * - generateNeedTags - A function that handles the generation of need tags.
 * - GenerateNeedTagsInput - The input type for the generateNeedTags function.
 * - GenerateNeedTagsOutput - The return type for the generateNeedTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNeedTagsInputSchema = z.object({
  needDescription: z
    .string()
    .describe('A description of the user\u2019s needs in natural language.'),
});
export type GenerateNeedTagsInput = z.infer<typeof GenerateNeedTagsInputSchema>;

const GenerateNeedTagsOutputSchema = z.object({
  suggestedTags: z
    .array(z.string())
    .describe('An array of suggested need tags based on the description.'),
});
export type GenerateNeedTagsOutput = z.infer<typeof GenerateNeedTagsOutputSchema>;

export async function generateNeedTags(input: GenerateNeedTagsInput): Promise<GenerateNeedTagsOutput> {
  return generateNeedTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNeedTagsPrompt',
  input: {schema: GenerateNeedTagsInputSchema},
  output: {schema: GenerateNeedTagsOutputSchema},
  prompt: `You are a helpful assistant that suggests relevant need tags based on a user's description of their needs.

  Given the following need description, suggest 5 relevant tags that categorize the request. The tags should be short, and descriptive.

  Description: {{{needDescription}}}
  Tags: `,
});

const generateNeedTagsFlow = ai.defineFlow(
  {
    name: 'generateNeedTagsFlow',
    inputSchema: GenerateNeedTagsInputSchema,
    outputSchema: GenerateNeedTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
