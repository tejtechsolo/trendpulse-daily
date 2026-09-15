export type RiskLevel = 'low' | 'medium' | 'high';

const HIGH_RISK = [
  'election', 'elections', 'president', 'prime minister', 'minister', 'politics',
  'war', 'attack', 'terror', 'terrorism', 'death', 'dead', 'killed', 'murder',
  'crime', 'arrest', 'court', 'lawsuit', 'fraud', 'scam', 'allegation', 'accused',
  'disease', 'outbreak', 'covid', 'health', 'hospital', 'earthquake', 'flood',
  'cyclone', 'disaster', 'market crash', 'stock market', 'shares plunge', 'bankruptcy'
];

const MEDIUM_RISK = [
  'policy', 'regulation', 'regulator', 'government', 'law', 'bill', 'sanction',
  'tariff', 'acquisition', 'merger', 'layoff', 'strike', 'antitrust', 'legal'
];

export function classifyRisk(title: string, description = ''): RiskLevel {
  const text = `${title} ${description}`.toLowerCase();
  if (HIGH_RISK.some((term) => text.includes(term))) return 'high';
  if (MEDIUM_RISK.some((term) => text.includes(term))) return 'medium';
  return 'low';
}

export function scoreTopic(title: string, description = '', category = '') {
  const text = `${title} ${description}`.toLowerCase();
  let score = 50;
  if (['ai', 'technology', 'business', 'india', 'world'].includes(category)) score += 15;
  if (title.length >= 25 && title.length <= 120) score += 10;
  if (description.length > 80) score += 10;
  if (classifyRisk(title, description) === 'high') score -= 20;
  if (['breaking', 'rumor', 'unconfirmed'].some((term) => text.includes(term))) score -= 15;
  return Math.max(0, Math.min(100, score));
}
