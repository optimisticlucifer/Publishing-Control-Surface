import { nanoid } from 'nanoid';
import type { ContentRecord, Status, Impact, Engine } from '@/types/record';

// Sample prompts for realistic data
const PROMPTS = [
  'Best enterprise CRM software for mid-market companies',
  'Top cloud infrastructure providers comparison',
  'Project management tools for remote teams review',
  'AI coding assistants comparison and recommendations',
  'Enterprise security best practices guide',
  'Best accounting software for small businesses',
  'Top HR management platforms comparison',
  'Cloud storage solutions for enterprise',
  'Best video conferencing tools for business',
  'Email marketing platforms comparison',
  'Customer support software recommendations',
  'Best ERP systems for manufacturing',
  'Top business intelligence tools review',
  'Cybersecurity solutions for startups',
  'Best payroll software comparison',
  'Top e-commerce platforms for B2B',
  'Data analytics tools for enterprises',
  'Best CMS platforms comparison',
  'Top collaboration tools for teams',
  'Marketing automation software guide',
  'Best inventory management systems',
  'Top sales enablement platforms',
  'Cloud backup solutions comparison',
  'Best document management systems',
  'Top workflow automation tools',
  'Enterprise search solutions review',
  'Best API management platforms',
  'Top identity management solutions',
  'Database management systems comparison',
  'Best monitoring and observability tools',
  'Top container orchestration platforms',
  'DevOps tools and practices guide',
  'Best low-code development platforms',
  'Top integration platforms comparison',
  'Enterprise messaging solutions review',
  'Best knowledge management systems',
  'Top learning management platforms',
  'Customer data platforms comparison',
  'Best digital asset management tools',
  'Top procurement software solutions',
];

const ENGINES: Engine[] = ['ChatGPT', 'Gemini', 'Perplexity'];
const STATUSES: Status[] = ['Queued', 'InReview', 'Approved', 'Published', 'Blocked'];
const IMPACTS: Impact[] = ['High', 'Medium', 'Low'];

const SAFETY_FLAGS = [
  'Pricing mismatch',
  'Competitor mentioned',
  'Outdated information',
  'Missing disclaimer',
  'Factual accuracy concern',
  'Brand voice deviation',
  'Legal review needed',
  'Source verification required',
  'Market data outdated',
  'Feature comparison incomplete',
];

// Seeded random number generator for reproducibility
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Weighted random selection
function weightedRandom<T extends string>(
  items: T[],
  weights: Record<T, number>,
  random: () => number
): T {
  const weightValues = Object.values(weights) as number[];
  const totalWeight = weightValues.reduce((a, b) => a + b, 0);
  let r = random() * totalWeight;

  for (const item of items) {
    r -= weights[item];
    if (r <= 0) return item;
  }

  return items[0];
}

// Shuffle array with seeded random
function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate random date within last 30 days
function generateRandomDate(random: () => number): Date {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return new Date(thirtyDaysAgo + random() * (now - thirtyDaysAgo));
}

// Main generator function
export function generateMockData(count: number = 3000, seed: number = 42): ContentRecord[] {
  const random = createSeededRandom(seed);
  const records: ContentRecord[] = [];

  // Distribution weights for realistic data
  const statusWeights: Record<Status, number> = {
    Queued: 0.35,
    InReview: 0.25,
    Approved: 0.2,
    Published: 0.15,
    Blocked: 0.05,
  };

  const impactWeights: Record<Impact, number> = {
    High: 0.2,
    Medium: 0.5,
    Low: 0.3,
  };

  for (let i = 0; i < count; i++) {
    const status = weightedRandom(STATUSES, statusWeights, random);
    const impact = weightedRandom(IMPACTS, impactWeights, random);

    // Generate 0-3 safety flags with higher probability for Queued/InReview
    const maxFlags = status === 'Queued' || status === 'InReview' ? 3 : 2;
    const flagCount = Math.floor(random() * (maxFlags + 1));
    const safetyFlags = shuffle(SAFETY_FLAGS, random).slice(0, flagCount);

    // Pick a random prompt with slight variation
    const basePrompt = PROMPTS[Math.floor(random() * PROMPTS.length)];
    const year = 2024 + Math.floor(random() * 2);
    const prompt = random() > 0.7 ? `${basePrompt} ${year}` : basePrompt;

    records.push({
      id: nanoid(),
      prompt,
      engine: ENGINES[Math.floor(random() * ENGINES.length)],
      status,
      impact,
      safetyFlags,
      updatedAt: generateRandomDate(random).toISOString(),
      blockReason: status === 'Blocked' ? 'Policy violation or content quality issue' : undefined,
    });
  }

  // Sort by updatedAt descending (most recent first)
  return records.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// Generate and cache data for use throughout the app
let cachedRecords: ContentRecord[] | null = null;

export function getMockRecords(): ContentRecord[] {
  if (!cachedRecords) {
    cachedRecords = generateMockData(3000);
  }
  return cachedRecords;
}

// Reset cache (useful for testing)
export function resetMockRecords(): void {
  cachedRecords = null;
}
