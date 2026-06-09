import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { CardPickerModal } from '../components/CardPickerModal';
import { PlayingCard } from '../components/PlayingCard';
import { generateId } from '../utils/calculations';
import {
  HAND_RANKINGS,
  cardKey,
  compareScores,
  describeHand,
  evaluateBest,
  type HandResult,
  type PokerCard,
} from '../utils/pokerHands';

const BOARD_LABELS = ['Flop', 'Flop', 'Flop', 'Turn', 'River'];
const MAX_SEATS = 9;

interface Seat {
  id: string;
  name: string;
  cards: (PokerCard | null)[];
}

type PickerTarget =
  | { type: 'board'; index: number }
  | { type: 'seat'; seatId: string; index: number };

function makeSeat(n: number): Seat {
  return { id: generateId(), name: `Player ${n}`, cards: [null, null] };
}

interface HandsPageProps {
  tab: 'rankings' | 'checker';
}

export function HandsPage({ tab }: HandsPageProps) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Poker Hands</h1>
      </div>

      <div className="stack-mode-tabs hands-tabs">
        <Link to="/hands" className={`stack-mode-tab ${tab === 'rankings' ? 'active' : ''}`}>
          Hand Rankings
        </Link>
        <Link
          to="/hands/checker"
          className={`stack-mode-tab ${tab === 'checker' ? 'active' : ''}`}
        >
          Who Wins?
        </Link>
      </div>

      {tab === 'rankings' ? <RankingsSection /> : <CheckerSection />}
    </div>
  );
}

function RankingsSection() {
  return (
    <>
      <Card>
        <p className="form-hint hands-intro">
          From best to worst. If two players have the same hand type, the higher cards win —
          if everything is equal, the pot is split.
        </p>
        <ol className="hand-rank-list">
          {HAND_RANKINGS.map((hand) => (
            <li key={hand.rank} className="hand-rank-item">
              <div className="hand-rank-head">
                <span className="hand-rank-num">{hand.rank}</span>
                <span className="hand-rank-name">{hand.name}</span>
              </div>
              <div className="hand-rank-cards">
                {hand.example.map((card) => (
                  <PlayingCard key={cardKey(card)} card={card} small />
                ))}
              </div>
              <p className="hand-rank-desc">{hand.description}</p>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Quick Tips">
        <ul className="hands-tips">
          <li>You make your best 5-card hand from your 2 cards + the 5 on the table.</li>
          <li>Kickers matter: with the same pair, the highest other card decides.</li>
          <li>A flush beats a straight. A full house beats a flush.</li>
          <li>Suits are never used to break ties — equal hands split the pot.</li>
        </ul>
      </Card>
    </>
  );
}

function CheckerSection() {
  const [board, setBoard] = useState<(PokerCard | null)[]>([null, null, null, null, null]);
  const [seats, setSeats] = useState<Seat[]>([makeSeat(1), makeSeat(2)]);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const usedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const card of board) if (card) keys.add(cardKey(card));
    for (const seat of seats) for (const card of seat.cards) if (card) keys.add(cardKey(card));
    return keys;
  }, [board, seats]);

  const boardCards = useMemo(
    () => board.filter((c): c is PokerCard => c !== null),
    [board]
  );

  const results = useMemo(() => {
    const map = new Map<string, HandResult>();
    if (boardCards.length < 3) return map;
    for (const seat of seats) {
      const hole = seat.cards.filter((c): c is PokerCard => c !== null);
      if (hole.length !== 2) continue;
      const result = evaluateBest([...hole, ...boardCards]);
      if (result) map.set(seat.id, result);
    }
    return map;
  }, [seats, boardCards]);

  const winners = useMemo(() => {
    let bestScore: number[] | null = null;
    for (const result of results.values()) {
      if (!bestScore || compareScores(result.score, bestScore) > 0) bestScore = result.score;
    }
    if (!bestScore) return new Set<string>();
    const ids = new Set<string>();
    for (const [seatId, result] of results) {
      if (compareScores(result.score, bestScore) === 0) ids.add(seatId);
    }
    return ids;
  }, [results]);

  const getCardAt = (target: PickerTarget): PokerCard | null => {
    if (target.type === 'board') return board[target.index];
    const seat = seats.find((s) => s.id === target.seatId);
    return seat?.cards[target.index] ?? null;
  };

  const setCardAt = (target: PickerTarget, card: PokerCard | null) => {
    if (target.type === 'board') {
      setBoard((prev) => prev.map((c, i) => (i === target.index ? card : c)));
    } else {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === target.seatId
            ? { ...s, cards: s.cards.map((c, i) => (i === target.index ? card : c)) }
            : s
        )
      );
    }
  };

  // After picking, jump to the next empty slot in the same group so cards flow quickly
  const advancePicker = (target: PickerTarget) => {
    if (target.type === 'board') {
      const next = board.findIndex((c, i) => c === null && i !== target.index);
      setPicker(next >= 0 ? { type: 'board', index: next } : null);
    } else {
      const seat = seats.find((s) => s.id === target.seatId);
      const next = seat?.cards.findIndex((c, i) => c === null && i !== target.index) ?? -1;
      setPicker(next >= 0 ? { type: 'seat', seatId: target.seatId, index: next } : null);
    }
  };

  const pickerTitle =
    picker?.type === 'board'
      ? `Board — ${BOARD_LABELS[picker.index]}`
      : picker
        ? `${seats.find((s) => s.id === picker.seatId)?.name ?? 'Player'} — card ${picker.index + 1}`
        : '';

  const addSeat = () => {
    if (seats.length >= MAX_SEATS) return;
    setSeats((prev) => [...prev, makeSeat(prev.length + 1)]);
  };

  const removeSeat = (seatId: string) => {
    setSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const renameSeat = (seatId: string, name: string) => {
    setSeats((prev) => prev.map((s) => (s.id === seatId ? { ...s, name } : s)));
  };

  const resetAll = () => {
    setBoard([null, null, null, null, null]);
    setSeats([makeSeat(1), makeSeat(2)]);
    setPicker(null);
  };

  return (
    <>
      <Card title="Board">
        <p className="form-hint">
          Tap a slot to pick a card. You need at least the flop (3 cards) to compare hands.
        </p>
        <div className="checker-board">
          {board.map((card, i) => (
            <div key={i} className="checker-board-slot">
              <PlayingCard card={card} onClick={() => setPicker({ type: 'board', index: i })} />
              <span className="checker-slot-label">{BOARD_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Players">
        <div className="checker-seats">
          {seats.map((seat) => {
            const result = results.get(seat.id);
            const isWinner = winners.has(seat.id);
            const holeComplete = seat.cards.every((c) => c !== null);
            return (
              <div key={seat.id} className={`checker-seat ${isWinner ? 'checker-winner' : ''}`}>
                <div className="checker-seat-top">
                  <input
                    type="text"
                    className="checker-seat-name"
                    value={seat.name}
                    onChange={(e) => renameSeat(seat.id, e.target.value)}
                    maxLength={20}
                  />
                  <div className="checker-seat-cards">
                    {seat.cards.map((card, i) => (
                      <PlayingCard
                        key={i}
                        card={card}
                        onClick={() => setPicker({ type: 'seat', seatId: seat.id, index: i })}
                      />
                    ))}
                  </div>
                  {seats.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm checker-seat-remove"
                      onClick={() => removeSeat(seat.id)}
                      aria-label={`Remove ${seat.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="checker-seat-result">
                  {result ? (
                    <>
                      {isWinner && (
                        <span className="checker-winner-tag">
                          {winners.size > 1 ? 'Split Pot' : 'Winner'}
                        </span>
                      )}
                      <span className="checker-hand-name">{describeHand(result.score)}</span>
                      <span className="checker-best-five">
                        {result.bestFive.map((card) => (
                          <PlayingCard key={cardKey(card)} card={card} small />
                        ))}
                      </span>
                    </>
                  ) : (
                    <span className="checker-waiting">
                      {!holeComplete
                        ? 'Pick 2 cards'
                        : boardCards.length < 3
                          ? 'Waiting for the flop'
                          : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="checker-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addSeat}
            disabled={seats.length >= MAX_SEATS}
          >
            + Add Player
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetAll}>
            Reset All
          </button>
        </div>
      </Card>

      {picker && (
        <CardPickerModal
          title={pickerTitle}
          usedKeys={usedKeys}
          currentCard={getCardAt(picker)}
          onPick={(card) => {
            setCardAt(picker, card);
            advancePicker(picker);
          }}
          onClear={() => {
            setCardAt(picker, null);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}
