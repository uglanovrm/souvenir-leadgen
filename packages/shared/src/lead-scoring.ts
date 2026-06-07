import { z } from "zod";

export const leadScoringInputSchema = z.object({
  industry: z.string().optional().default(""),
  targetIndustries: z.array(z.string()).default([]),
  hasWebsite: z.boolean().default(false),
  hasLogo: z.boolean().default(false),
  hasContact: z.boolean().default(false),
  hasGeo: z.boolean().default(false),
  hasPortfolioFit: z.boolean().default(false),
  previouslyContacted: z.boolean().default(false),
  blocked: z.boolean().default(false),
});

export type LeadScoringInput = z.input<typeof leadScoringInputSchema>;

export type LeadScoreResult = {
  score: number;
  eligible: boolean;
  explanation: string;
  breakdown: Record<string, number>;
};

export function scoreLead(input: LeadScoringInput): LeadScoreResult {
  const value = leadScoringInputSchema.parse(input);
  const industry = value.industry.toLowerCase();
  const targetIndustries = value.targetIndustries.map((item) => item.toLowerCase());
  const industryFit = industry && targetIndustries.includes(industry) ? 25 : 0;
  const breakdown = {
    industry_fit: industryFit,
    website: value.hasWebsite ? 15 : 0,
    logo: value.hasLogo ? 10 : 0,
    contact: value.hasContact ? 15 : 0,
    geo: value.hasGeo ? 10 : 0,
    portfolio_fit: value.hasPortfolioFit ? 15 : 0,
    not_previously_contacted: value.previouslyContacted ? -20 : 10,
    blocked_penalty: value.blocked ? -100 : 0,
  };
  const rawScore = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const eligible = !value.blocked && score >= 50;
  const explanation = [
    industryFit ? "industry matches campaign" : "industry fit is weak or unknown",
    value.hasWebsite ? "website present" : "website missing",
    value.hasContact ? "contact present" : "contact missing",
    value.hasPortfolioFit ? "portfolio fit available" : "portfolio fit missing",
    value.previouslyContacted ? "previously contacted penalty" : "not previously contacted",
    value.blocked ? "blocked lead" : "not blocked",
  ].join("; ");

  return { score, eligible, explanation, breakdown };
}
