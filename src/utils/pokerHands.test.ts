import { describe, expect, it } from 'vitest';
import {
  compareScores,
  describeHand,
  evaluateBest,
  type PokerCard,
  type Suit,
} from './pokerHands';

function parse(s: string): PokerCard[] {
  return s.split(' ').map((tok) => {
    const suit = tok.slice(-1) as Suit;
    const r = tok.slice(0, -1);
    const rank =
      r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : r === 'T' ? 10 : parseInt(r, 10);
    return { rank, suit };
  });
}

function best(hole: string, board: string) {
  const result = evaluateBest([...parse(hole), ...parse(board)]);
  if (!result) throw new Error('expected a hand result');
  return result;
}

describe('hand evaluator', () => {
  it('full house beats trips', () => {
    const board = 'Kh 9d 9s 4c 2h';
    const fullHouse = best('Kd Ks', board);
    const trips = best('Ah 9c', board);
    expect(compareScores(fullHouse.score, trips.score)).toBeGreaterThan(0);
    expect(describeHand(fullHouse.score)).toBe('Full House, Kings full of Nines');
    expect(describeHand(trips.score)).toBe('Three of a Kind, Nines');
  });

  it('flush beats straight', () => {
    const board = '7h 8h 9h 2c 3d';
    const flush = best('Ah 2h', board);
    const straight = best('Td Js', board);
    expect(compareScores(flush.score, straight.score)).toBeGreaterThan(0);
    expect(describeHand(flush.score)).toBe('Flush, Ace high');
    expect(describeHand(straight.score)).toBe('Straight, Jack high');
  });

  it('detects the wheel (A-2-3-4-5 straight)', () => {
    const wheel = best('Ac 5h', '2d 3s 4h 9c Kd');
    expect(describeHand(wheel.score)).toBe('Straight, Five high');
  });

  it('kicker decides between equal pairs', () => {
    const board = 'Ah Kd 7s 4c 2h';
    const queenKicker = best('As Qd', board);
    const jackKicker = best('Ad Jc', board);
    expect(compareScores(queenKicker.score, jackKicker.score)).toBeGreaterThan(0);
  });

  it('splits the pot when the board plays', () => {
    const board = 'Ah Kh Qh Jh Th';
    const p1 = best('2c 3d', board);
    const p2 = best('9s 9d', board);
    expect(compareScores(p1.score, p2.score)).toBe(0);
    expect(describeHand(p1.score)).toBe('Royal Flush');
  });

  it('quads beat a full house', () => {
    const board = 'Qs Qd 5h 5c 2d';
    const fullHouse = best('Qc 8d', board);
    const quads = best('5d 5s', board);
    expect(describeHand(fullHouse.score)).toBe('Full House, Queens full of Fives');
    expect(describeHand(quads.score)).toBe('Four of a Kind, Fives');
    expect(compareScores(quads.score, fullHouse.score)).toBeGreaterThan(0);
  });

  it('straight flush beats quads', () => {
    const board = '6h 7h 8h 8d 8c';
    const straightFlush = best('9h Th', board);
    const quads = best('8s Ad', board);
    expect(describeHand(straightFlush.score)).toBe('Straight Flush, Ten high');
    expect(compareScores(straightFlush.score, quads.score)).toBeGreaterThan(0);
  });

  it('two pair uses the best two pairs from seven cards', () => {
    const result = best('Ac Ad', '9s 9h 4d 4c Qd');
    expect(describeHand(result.score)).toBe('Two Pair, Aces and Nines');
  });

  it('returns null with fewer than five cards', () => {
    expect(evaluateBest(parse('Ah Kd 2c 3s'))).toBeNull();
  });

  it('works with just the flop (5 cards total)', () => {
    const result = best('Ah Ad', '2c 7s Kd');
    expect(describeHand(result.score)).toBe('Pair of Aces');
  });
});
