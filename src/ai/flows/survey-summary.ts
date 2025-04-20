// SurveySummary story
'use server';
/**
 * @fileOverview Summarizes survey results and suggests potential actions based on the user's responses.
 *
 * - summarizeSurvey - A function that takes survey responses as input and returns an AI-powered summary.
 * - SurveySummaryInput - The input type for the summarizeSurvey function.
 * - SurveySummaryOutput - The return type for the summarizeSurvey function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SurveySummaryInputSchema = z.object({
  surveyName: z.string().describe('The name of the survey.'),
  answers: z.record(z.any()).describe('A record of question IDs to answers for the survey.'),
});
export type SurveySummaryInput = z.infer<typeof SurveySummaryInputSchema>;

const SurveySummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the survey results.'),
  potentialActions: z.string().describe('Potential actions based on the survey results.'),
});
export type SurveySummaryOutput = z.infer<typeof SurveySummaryOutputSchema>;

export async function summarizeSurvey(input: SurveySummaryInput): Promise<SurveySummaryOutput> {
  return summarizeSurveyFlow(input);
}

const surveySummaryPrompt = ai.definePrompt({
  name: 'surveySummaryPrompt',
  input: {
    schema: z.object({
      surveyName: z.string().describe('The name of the survey.'),
      answers: z.record(z.any()).describe('A record of question IDs to answers for the survey.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the survey results.'),
      potentialActions: z.string().describe('Potential actions based on the survey results.'),
    }),
  },
  prompt: `You are an AI assistant tasked with summarizing survey results and suggesting potential actions.

  Summarize the results of the "{{surveyName}}" survey, given the following answers:  {{answers}}
  Based on these responses, suggest potential actions that should be taken.
  The summary and actions should be clear and concise.
  `,
});

const summarizeSurveyFlow = ai.defineFlow<
  typeof SurveySummaryInputSchema,
  typeof SurveySummaryOutputSchema
>({
  name: 'summarizeSurveyFlow',
  inputSchema: SurveySummaryInputSchema,
  outputSchema: SurveySummaryOutputSchema,
},
async input => {
  const {output} = await surveySummaryPrompt(input);
  return output!;
});

