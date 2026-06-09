import { SUIT_SYMBOLS, isRedSuit, rankShort, type PokerCard } from '../utils/pokerHands';

interface PlayingCardProps {
  card: PokerCard | null;
  small?: boolean;
  onClick?: () => void;
  highlight?: boolean;
}

export function PlayingCard({ card, small, onClick, highlight }: PlayingCardProps) {
  const classes = [
    'pcard',
    small ? 'pcard-sm' : '',
    card ? (isRedSuit(card.suit) ? 'pcard-red' : 'pcard-black') : 'pcard-empty',
    highlight ? 'pcard-highlight' : '',
    onClick ? 'pcard-clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = card ? (
    <>
      <span className="pcard-rank">{rankShort(card.rank)}</span>
      <span className="pcard-suit">{SUIT_SYMBOLS[card.suit]}</span>
    </>
  ) : (
    <span className="pcard-plus">+</span>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <span className={classes}>{content}</span>;
}
