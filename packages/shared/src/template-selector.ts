export type TemplateSelectorBrief = {
  productType: string;
  technology: string;
  industryTags: string[];
  logoAspectRatio: number | null;
};

export type TemplateSelectorCandidate = {
  id: string;
  name: string;
  isActive: boolean;
  productType: string;
  technology: string;
  tags: string[];
  qualityScore: number;
  placementAspectRatio: number | null;
};

export type RankedTemplate = TemplateSelectorCandidate & {
  rank: number;
  score: number;
  explanation: string;
};

function sameText(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function normalizedTags(tags: string[]) {
  return new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

function aspectFitScore(logoAspectRatio: number | null, placementAspectRatio: number | null) {
  if (!logoAspectRatio || !placementAspectRatio) {
    return { score: 0, explanation: "logo or placement aspect ratio missing" };
  }

  const ratio = Math.max(logoAspectRatio, placementAspectRatio) / Math.min(logoAspectRatio, placementAspectRatio);

  if (ratio <= 1.4) {
    return { score: 25, explanation: "logo aspect fits placement" };
  }

  if (ratio <= 2.4) {
    return { score: 10, explanation: "logo aspect is usable but imperfect" };
  }

  return { score: -25, explanation: "logo aspect is poor for placement" };
}

export function selectMockupTemplates(
  brief: TemplateSelectorBrief,
  candidates: TemplateSelectorCandidate[],
  limit = 5,
): RankedTemplate[] {
  const briefTags = normalizedTags(brief.industryTags);

  return candidates
    .filter((candidate) => candidate.isActive)
    .map((candidate) => {
      const explanation: string[] = [];
      let score = 0;

      if (sameText(candidate.productType, brief.productType)) {
        score += 30;
        explanation.push("product type match");
      } else {
        explanation.push("product type mismatch");
      }

      if (sameText(candidate.technology, brief.technology)) {
        score += 25;
        explanation.push("technology match");
      } else {
        explanation.push("technology mismatch");
      }

      const matchingTags = candidate.tags.filter((tag) => briefTags.has(tag.trim().toLowerCase()));
      const tagScore = Math.min(20, matchingTags.length * 10);
      score += tagScore;
      explanation.push(matchingTags.length > 0 ? `industry tag match: ${matchingTags.join(", ")}` : "no industry tag match");

      const qualityScore = Math.round(Math.max(0, Math.min(100, candidate.qualityScore)) / 5);
      score += qualityScore;
      explanation.push(`template quality contributes ${qualityScore}`);

      const aspect = aspectFitScore(brief.logoAspectRatio, candidate.placementAspectRatio);
      score += aspect.score;
      explanation.push(aspect.explanation);

      return {
        ...candidate,
        rank: 0,
        score,
        explanation: explanation.join("; "),
      };
    })
    .sort((left, right) => right.score - left.score || right.qualityScore - left.qualityScore || left.name.localeCompare(right.name))
    .slice(0, limit)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
