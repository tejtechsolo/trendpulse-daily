export type QualityResult = {
  score: number;
  checks: Record<string, { passed: boolean; message: string }>;
};

const PLACEHOLDERS = ['lorem ipsum', 'insert text', 'your text here', 'todo:', '[insert', 'as an ai'];

export function evaluateArticleQuality(input: {
  title: string;
  content: string;
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags?: string[] | null;
  riskLevel?: string | null;
  sourceUrl?: string | null;
  sourceVerified?: boolean;
}): QualityResult {
  const checks: QualityResult['checks'] = {};
  const words = input.content.trim().split(/\s+/).filter(Boolean).length;
  const titleLength = input.title.trim().length;
  const seoDescriptionLength = input.seoDescription?.trim().length ?? 0;
  const lower = `${input.title}\n${input.content}`.toLowerCase();

  checks.title = { passed: titleLength >= 20 && titleLength <= 120, message: 'Title should be 20–120 characters.' };
  checks.content = { passed: words >= 300, message: 'Article should contain at least 300 words.' };
  checks.excerpt = { passed: Boolean(input.excerpt?.trim()), message: 'Excerpt is present.' };
  checks.seoTitle = { passed: Boolean(input.seoTitle?.trim()), message: 'SEO title is present.' };
  checks.seoDescription = { passed: seoDescriptionLength >= 50 && seoDescriptionLength <= 170, message: 'SEO description should be 50–170 characters.' };
  checks.tags = { passed: Boolean(input.tags?.length && input.tags.length >= 2), message: 'At least two tags are recommended.' };
  checks.source = { passed: Boolean(input.sourceUrl?.trim()) || Boolean(input.sourceVerified), message: 'A source URL or explicit source verification is required.' };
  checks.placeholders = { passed: !PLACEHOLDERS.some((term) => lower.includes(term)), message: 'No obvious placeholder or AI-instruction text detected.' };
  checks.highRiskReview = { passed: input.riskLevel !== 'high' || input.sourceVerified === true, message: 'High-risk content requires explicit source verification.' };

  const passed = Object.values(checks).filter((check) => check.passed).length;
  const score = Math.round((passed / Object.keys(checks).length) * 100);
  return { score, checks };
}

export function canPublishQuality(result: QualityResult, riskLevel: string, sourceVerified: boolean) {
  return result.score >= 80 && riskLevel !== 'high' ? true : result.score >= 80 && sourceVerified;
}
