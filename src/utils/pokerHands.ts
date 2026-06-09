export type Suit = 's' | 'h' | 'd' | 'c';

export interface PokerCard {
  rank: number; // 2-14, where 11=J, 12=Q, 13=K, 14=A
  suit: Suit;
}

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const RANKS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

const RANK_SHORT: Record<number, string> = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' };

export function rankShort(rank: number): string {
  return RANK_SHORT[rank] ?? String(rank);
}

export function cardKey(card: PokerCard): string {
  return `${card.rank}${card.suit}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'h' || suit === 'd';
}

const RANK_LABEL: Record<number, string> = {
  14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten', 9: 'Nine',
  8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two',
};

const RANK_PLURAL: Record<number, string> = {
  14: 'Aces', 13: 'Kings', 12: 'Queens', 11: 'Jacks', 10: 'Tens', 9: 'Nines',
  8: 'Eights', 7: 'Sevens', 6: 'Sixes', 5: 'Fives', 4: 'Fours', 3: 'Threes', 2: 'Twos',
};

/**
 * Scores a 5-card hand as an array compared lexicographically:
 * [category, tiebreaker1, tiebreaker2, ...]
 * Categories: 8 straight flush, 7 quads, 6 full house, 5 flush,
 * 4 straight, 3 trips, 2 two pair, 1 pair, 0 high card.
 */
function evaluate5(cards: PokerCard[]): number[] {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const isFlush = cards.every((c) => c.suit === cards[0].suit);

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // Group ranks by count desc, then rank desc: e.g. full house -> [[trips], [pair]]
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let straightHigh = 0;
  if (counts.size === 5) {
    if (ranks[0] - ranks[4] === 4) straightHigh = ranks[0];
    else if (ranks[0] === 14 && ranks[1] === 5 && ranks[4] === 2) straightHigh = 5; // wheel A-5
  }

  if (isFlush && straightHigh) return [8, straightHigh];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
  if (isFlush) return [5, ...ranks];
  if (straightHigh) return [4, straightHigh];
  if (groups[0][1] === 3) return [3, groups[0][0], groups[1][0], groups[2][0]];
  if (groups[0][1] === 2 && groups[1][1] === 2)
    return [2, groups[0][0], groups[1][0], groups[2][0]];
  if (groups[0][1] === 2)
    return [1, groups[0][0], groups[1][0], groups[2][0], groups[3][0]];
  return [0, ...ranks];
}

export function compareScores(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface HandResult {
  score: number[];
  bestFive: PokerCard[];
}

/** Finds the best 5-card hand from 5-7 cards (hole cards + board). */
export function evaluateBest(cards: PokerCard[]): HandResult | null {
  if (cards.length < 5) return null;

  let best: HandResult | null = null;
  const combo: PokerCard[] = [];

  const pick = (start: number) => {
    if (combo.length === 5) {
      const score = evaluate5(combo);
      if (!best || compareScores(score, best.score) > 0) {
        best = { score, bestFive: [...combo] };
      }
      return;
    }
    for (let i = start; i <= cards.length - (5 - combo.length); i++) {
      combo.push(cards[i]);
      pick(i + 1);
      combo.pop();
    }
  };
  pick(0);

  return best;
}

export function describeHand(score: number[]): string {
  const [cat, ...r] = score;
  switch (cat) {
    case 8:
      return r[0] === 14 ? 'Royal Flush' : `Straight Flush, ${RANK_LABEL[r[0]]} high`;
    case 7:
      return `Four of a Kind, ${RANK_PLURAL[r[0]]}`;
    case 6:
      return `Full House, ${RANK_PLURAL[r[0]]} full of ${RANK_PLURAL[r[1]]}`;
    case 5:
      return `Flush, ${RANK_LABEL[r[0]]} high`;
    case 4:
      return `Straight, ${RANK_LABEL[r[0]]} high`;
    case 3:
      return `Three of a Kind, ${RANK_PLURAL[r[0]]}`;
    case 2:
      return `Two Pair, ${RANK_PLURAL[r[0]]} and ${RANK_PLURAL[r[1]]}`;
    case 1:
      return `Pair of ${RANK_PLURAL[r[0]]}`;
    default:
      return `High Card, ${RANK_LABEL[r[0]]}`;
  }
}

function c(rank: number, suit: Suit): PokerCard {
  return { rank, suit };
}

export interface HandRankInfo {
  rank: number;
  name: string;
  description: string;
  example: PokerCard[];
}

export const HAND_RANKINGS: HandRankInfo[] = [
  {
    rank: 1,
    name: 'Royal Flush',
    description: 'A, K, Q, J, 10 — all the same suit. The best possible hand.',
    example: [c(14, 's'), c(13, 's'), c(12, 's'), c(11, 's'), c(10, 's')],
  },
  {
    rank: 2,
    name: 'Straight Flush',
    description: 'Five cards in a row, all the same suit.',
    example: [c(9, 'h'), c(8, 'h'), c(7, 'h'), c(6, 'h'), c(5, 'h')],
  },
  {
    rank: 3,
    name: 'Four of a Kind',
    description: 'Four cards of the same rank.',
    example: [c(12, 'c'), c(12, 'd'), c(12, 'h'), c(12, 's'), c(7, 'd')],
  },
  {
    rank: 4,
    name: 'Full House',
    description: 'Three of a kind plus a pair.',
    example: [c(11, 's'), c(11, 'd'), c(11, 'c'), c(8, 'h'), c(8, 's')],
  },
  {
    rank: 5,
    name: 'Flush',
    description: 'Five cards of the same suit, in any order.',
    example: [c(14, 'd'), c(11, 'd'), c(8, 'd'), c(6, 'd'), c(2, 'd')],
  },
  {
    rank: 6,
    name: 'Straight',
    description: 'Five cards in a row, mixed suits. Ace can be high (10-A) or low (A-5).',
    example: [c(10, 'c'), c(9, 'd'), c(8, 'h'), c(7, 's'), c(6, 'c')],
  },
  {
    rank: 7,
    name: 'Three of a Kind',
    description: 'Three cards of the same rank.',
    example: [c(5, 's'), c(5, 'h'), c(5, 'd'), c(13, 'c'), c(2, 'd')],
  },
  {
    rank: 8,
    name: 'Two Pair',
    description: 'Two different pairs.',
    example: [c(14, 'c'), c(14, 'd'), c(9, 's'), c(9, 'h'), c(12, 'd')],
  },
  {
    rank: 9,
    name: 'Pair',
    description: 'Two cards of the same rank.',
    example: [c(10, 's'), c(10, 'h'), c(14, 'd'), c(7, 'c'), c(4, 's')],
  },
  {
    rank: 10,
    name: 'High Card',
    description: 'None of the above — your highest card plays.',
    example: [c(14, 's'), c(11, 'd'), c(8, 'c'), c(6, 'h'), c(3, 's')],
  },
];
