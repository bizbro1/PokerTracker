import type { PlayerStatus } from '../types';

const labels: Record<PlayerStatus, string> = {
  playing: 'Playing',
  busted: 'Busted',
  cashed_out: 'Cashed Out',
};

interface StatusBadgeProps {
  status: PlayerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}
