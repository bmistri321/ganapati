/**
 * searchHelper.js
 * Smart Fuzzy Search with Typo Tolerance, Phonetic & Levenshtein Distance Matching
 */
import Fuse from 'fuse.js';

/**
 * Normalize string by trimming, lowercasing, and collapsing consecutive duplicate characters
 * e.g., "sattuu" -> "satu", "cooool" -> "col"
 */
export function normalizeCondensed(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(.)\1+/g, '$1').trim();
}

/**
 * Calculate Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if word 'target' is a fuzzy match for 'query'
 */
export function isFuzzyWordMatch(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q || !t) return false;
  if (t.includes(q) || q.includes(t)) return true;

  // Check condensed form (e.g. "satu" vs "sattu")
  const normQ = normalizeCondensed(q);
  const normT = normalizeCondensed(t);
  if (normT.includes(normQ) || normQ.includes(normT)) return true;

  // If query is short (<=3 chars), allow 1 edit
  // If query is medium/long (>=4 chars), allow 2 edits
  const maxDistance = q.length <= 3 ? 1 : Math.min(2, Math.floor(q.length * 0.45));
  const dist = levenshteinDistance(q, t);
  if (dist <= maxDistance) return true;

  // Also test against tokens/words within target
  const words = t.split(/[\s\-_,./]+/);
  for (const word of words) {
    if (word.includes(q) || q.includes(word)) return true;
    const wordNorm = normalizeCondensed(word);
    if (wordNorm.includes(normQ) || normQ.includes(wordNorm)) return true;
    if (levenshteinDistance(q, word) <= maxDistance) return true;
    if (levenshteinDistance(normQ, wordNorm) <= maxDistance) return true;
  }

  return false;
}

/**
 * Smart Search on Product List
 * Handles typo tolerance, multi-word queries, and category matching
 */
export function smartSearchProducts(products, query) {
  if (!query || !query.trim()) return products;

  const cleanQuery = query.trim().toLowerCase();
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  // 1. Configure Fuse.js for robust fuzzy search
  const fuse = new Fuse(products, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'category', weight: 0.25 },
      { name: 'description', weight: 0.15 }
    ],
    threshold: 0.45,       // 0.0 is perfect match, 1.0 matches anything
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true
  });

  const fuseResults = fuse.search(cleanQuery).map((res) => res.item);
  const fuseResultIds = new Set(fuseResults.map((p) => p.id));

  // 2. Fallback / Augmentation using condensed phonetic & Levenshtein matching
  // (Ensures specific examples like "satu" -> "Sattu", "shugar" -> "Sugar" 100% resolve)
  const manualMatches = products.filter((product) => {
    if (fuseResultIds.has(product.id)) return false; // Already matched

    return queryTokens.every((token) => {
      const titleMatch = isFuzzyWordMatch(token, product.title || '');
      const catMatch = isFuzzyWordMatch(token, product.category || '');
      const descMatch = isFuzzyWordMatch(token, product.description || '');
      return titleMatch || catMatch || descMatch;
    });
  });

  // Combine Fuse high-confidence results + manual fuzzy matches
  return [...fuseResults, ...manualMatches];
}
