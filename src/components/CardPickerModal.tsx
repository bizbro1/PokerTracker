import {
  RANKS,
  SUITS,
  SUIT_SYMBOLS,
  cardKey,
  isRedSuit,
  rankShort,
  type PokerCard,
} from '../utils/pokerHands';

interface CardPickerModalProps {
  title: string;
  usedKeys: Set<string>;
  currentCard: PokerCard | null;
  onPick: (card: PokerCard) => void;
  onClear: () => void;
  onClose: () => void;
}

export function CardPickerModal({
  title,
  usedKeys,
  currentCard,
  onPick,
  onClear,
  onClose,
}: CardPickerModalProps) {
  const currentKey = currentCard ? cardKey(currentCard) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide card-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="card-picker-grid-wrap">
          <div className="card-picker-grid">
            {SUITS.map((suit) =>
              RANKS.map((rank) => {
                const key = `${rank}${suit}`;
                const isCurrent = key === currentKey;
                const isUsed = usedKeys.has(key) && !isCurrent;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isUsed}
                    className={`picker-card ${isRedSuit(suit) ? 'picker-card-red' : ''} ${
                      isCurrent ? 'picker-card-current' : ''
                    }`}
                    onClick={() => onPick({ rank, suit })}
                  >
                    {rankShort(rank)}
                    {SUIT_SYMBOLS[suit]}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="modal-actions">
          {currentCard && (
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Remove Card
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
