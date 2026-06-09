import { compareScores, describeHand, evaluateBest, type PokerCard, type Suit } from '../src/utils/pokerHands';

function parse(s: string): PokerCard[] {
  return s.split(' ').map((tok) => {
    const suit = tok.slice(-1) as Suit;
    const r = tok.slice(0, -1);
    const rank =
      r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : r === 'T' ? 10 : parseInt(r, 10);
    return { rank, suit };
  });
}

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`);
}

const board = parse('Kh 9d 9s 4c 2h');
const p1 = evaluateBest([...parse('Kd Ks'), ...board])!; // KKK99 full house
const p2 = evaluateBest([...parse('Ah 9c'), ...board])!; // 999KA trips... wait 9c9d9s + K + A = trips nines
check('full house beats trips', compareScores(p1.score, p2.score) > 0,
  `${describeHand(p1.score)} vs ${describeHand(p2.score)}`);
check('p1 is full house', describeHand(p1.score) === 'Full House, Kings full of Nines', describeHand(p1.score));

const board2 = parse('7h 8h 9h 2c 3d');
const f1 = evaluateBest([...parse('Ah 2h'), ...board2])!; // ace-high flush
const s1 = evaluateBest([...parse('Td Js'), ...board2])!; // straight 7-J
check('flush beats straight', compareScores(f1.score, s1.score) > 0,
  `${describeHand(f1.score)} vs ${describeHand(s1.score)}`);

const board3 = parse('2d 3s 4h 9c Kd');
const wheel = evaluateBest([...parse('Ac 5h'), ...board3])!;
check('wheel straight (A-5)', describeHand(wheel.score) === 'Straight, Five high', describeHand(wheel.score));

const board4 = parse('Ah Kd 7s 4c 2h');
const k1 = evaluateBest([...parse('As Qd'), ...board4])!; // pair aces, Q kicker
const k2 = evaluateBest([...parse('Ad Jc'), ...board4])!; // pair aces, J kicker
check('kicker decides', compareScores(k1.score, k2.score) > 0,
  `${describeHand(k1.score)} Q-kicker vs J-kicker`);

const board5 = parse('Ah Kh Qh Jh Th'); // royal flush on board
const t1 = evaluateBest([...parse('2c 3d'), ...board5])!;
const t2 = evaluateBest([...parse('9s 9d'), ...board5])!;
check('board plays -> split', compareScores(t1.score, t2.score) === 0, describeHand(t1.score));
check('royal flush named', describeHand(t1.score) === 'Royal Flush', describeHand(t1.score));

const board6 = parse('Qs Qd 5h 5c 2d');
const q1 = evaluateBest([...parse('Qc 8d'), ...board6])!;
check('trips + pair on board = full house', describeHand(q1.score) === 'Full House, Queens full of Fives', describeHand(q1.score));

const q2 = evaluateBest([...parse('5d 5s'), ...board6])!; // quad fives
check('quads beat full house', compareScores(q2.score, q1.score) > 0, describeHand(q2.score));

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
