import { useState } from 'react';
import type { PokerSession } from '../types';
import {
  chipsToCash,
  getPlayerCashInvested,
  getPlayerCashOut,
  getPlayerChipsReceived,
  getPlayerLiveProfitCash,
  getPlayerLiveProfitChips,
  getPlayerProfitCash,
  getPlayerProfitChips,
} from '../utils/calculations';
import {
  formatChipProfitLoss,
  formatChips,
  formatCurrency,
  formatProfitLoss,
} from '../utils/format';
import { StatusBadge } from './StatusBadge';
import { BuyInModal } from './BuyInModal';
import { CashOutModal } from './CashOutModal';
import { StackUpdateModal } from './StackUpdateModal';

interface PlayerTableProps {
  session: PokerSession;
  readOnly?: boolean;
  onAddBuyIn?: (playerId: string, cashAmount: number) => void;
  onUpdateStack?: (playerId: string, stackChips: number) => void;
  onCashOut?: (playerId: string, remainingChips: number) => void;
  onBust?: (playerId: string) => void;
  onRemove?: (playerId: string) => void;
}

export function PlayerTable({
  session,
  readOnly = false,
  onAddBuyIn,
  onUpdateStack,
  onCashOut,
  onBust,
  onRemove,
}: PlayerTableProps) {
  const [cashOutPlayerId, setCashOutPlayerId] = useState<string | null>(null);
  const [rebuyPlayerId, setRebuyPlayerId] = useState<string | null>(null);
  const [stackPlayerId, setStackPlayerId] = useState<string | null>(null);
  const cashOutPlayer = session.players.find((p) => p.id === cashOutPlayerId);
  const rebuyPlayer = session.players.find((p) => p.id === rebuyPlayerId);
  const stackPlayer = session.players.find((p) => p.id === stackPlayerId);

  if (session.players.length === 0) {
    return <p className="empty-text">No players yet. Add your first player below.</p>;
  }

  const renderProfit = (player: typeof session.players[0]) => {
    const profitCash = getPlayerProfitCash(player, session.chipValue);
    const profitChips = getPlayerProfitChips(player);
    const liveProfitCash = getPlayerLiveProfitCash(player, session.chipValue);
    const liveProfitChips = getPlayerLiveProfitChips(player);

    if (profitCash !== null) {
      const profitClass = profitCash > 0 ? 'profit' : profitCash < 0 ? 'loss' : '';
      return (
        <span className={profitClass}>
          {formatProfitLoss(profitCash, session.currency)}
          {profitChips !== null && (
            <span className="chip-pl-sub"> ({formatChipProfitLoss(profitChips)})</span>
          )}
        </span>
      );
    }

    if (liveProfitCash !== null) {
      const profitClass = liveProfitCash > 0 ? 'profit' : liveProfitCash < 0 ? 'loss' : '';
      return (
        <span className={profitClass}>
          {formatProfitLoss(liveProfitCash, session.currency)}
          {liveProfitChips !== null && (
            <span className="chip-pl-sub"> ({formatChipProfitLoss(liveProfitChips)})</span>
          )}
          <span className="live-tag"> live</span>
        </span>
      );
    }

    return '—';
  };

  const renderStack = (player: typeof session.players[0], isMobile = false) => {
    if (player.status !== 'playing') {
      return player.cashOutChips !== null ? formatChips(player.cashOutChips) : '—';
    }

    if (player.currentStackChips !== null) {
      const stackCash = chipsToCash(player.currentStackChips, session.chipValue);
      return (
        <span className="stack-cell">
          <span>{formatChips(player.currentStackChips)}</span>
          <span className="stack-cash-sub">{formatCurrency(stackCash, session.currency)}</span>
        </span>
      );
    }

    if (!readOnly && onUpdateStack) {
      return (
        <button
          type="button"
          className={`btn btn-sm btn-ghost stack-set-btn ${isMobile ? '' : 'stack-set-btn-inline'}`}
          onClick={() => setStackPlayerId(player.id)}
        >
          Set stack
        </button>
      );
    }

    return '—';
  };

  const renderPlayerRow = (player: typeof session.players[0], isMobile = false) => {
    const invested = getPlayerCashInvested(player);
    const chipsReceived = getPlayerChipsReceived(player);
    const cashOut = getPlayerCashOut(player, session.chipValue);
    const isPlaying = player.status === 'playing';

    if (isMobile) {
      return (
        <div key={player.id} className={`player-card ${isPlaying ? '' : 'settled'}`}>
          <div className="player-card-header">
            <span className="player-name">
              {player.name}
              {player.rebuyRequested && <span className="rebuy-flag">Rebuy?</span>}
            </span>
            <StatusBadge status={player.status} />
          </div>
          <div className="player-card-stats">
            <div>
              <span className="stat-label">Buy-ins</span>
              <span>{player.buyIns.length}</span>
            </div>
            <div>
              <span className="stat-label">Invested</span>
              <span>{formatCurrency(invested, session.currency)}</span>
            </div>
            <div>
              <span className="stat-label">Chips in</span>
              <span>{formatChips(chipsReceived)}</span>
            </div>
            <div>
              <span className="stat-label">Current stack</span>
              {renderStack(player, true)}
            </div>
            <div>
              <span className="stat-label">Cash-out</span>
              <span>
                {cashOut !== null ? formatCurrency(cashOut, session.currency) : '—'}
              </span>
            </div>
            <div>
              <span className="stat-label">P/L</span>
              {renderProfit(player)}
            </div>
          </div>
          {!readOnly && isPlaying && (
            <div className="player-card-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setStackPlayerId(player.id)}
              >
                Stack
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setRebuyPlayerId(player.id)}
              >
                + Rebuy
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setCashOutPlayerId(player.id)}
              >
                Cash Out
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => onBust?.(player.id)}>
                Busted
              </button>
            </div>
          )}
          {!readOnly && !isPlaying && player.rebuyRequested && (
            <div className="player-card-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setRebuyPlayerId(player.id)}
              >
                + Rebuy
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <tr key={player.id} className={isPlaying ? '' : 'row-settled'}>
        <td className="player-name">
          {player.name}
          {player.rebuyRequested && <span className="rebuy-flag">Rebuy?</span>}
        </td>
        <td>{player.buyIns.length}</td>
        <td>{formatCurrency(invested, session.currency)}</td>
        <td>{formatChips(chipsReceived)}</td>
        <td>{renderStack(player)}</td>
        <td>{cashOut !== null ? formatCurrency(cashOut, session.currency) : '—'}</td>
        <td>{renderProfit(player)}</td>
        <td>
          <StatusBadge status={player.status} />
        </td>
        {!readOnly && (
          <td>
            <div className="action-buttons">
              {isPlaying && (
                <>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setStackPlayerId(player.id)}
                  >
                    Stack
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setRebuyPlayerId(player.id)}
                  >
                    + Rebuy
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setCashOutPlayerId(player.id)}
                  >
                    Cash Out
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => onBust?.(player.id)}>
                    Busted
                  </button>
                </>
              )}
              {player.status !== 'playing' && (
                <>
                  {player.rebuyRequested && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setRebuyPlayerId(player.id)}
                    >
                      + Rebuy
                    </button>
                  )}
                  <button className="btn btn-sm btn-ghost" onClick={() => onRemove?.(player.id)}>
                    Remove
                  </button>
                </>
              )}
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <>
      <div className="table-wrap">
        <table className="player-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Buy-ins</th>
              <th>Invested</th>
              <th>Chips in</th>
              <th>Current stack</th>
              <th>Cash-out</th>
              <th>P/L</th>
              <th>Status</th>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>{session.players.map((p) => renderPlayerRow(p))}</tbody>
        </table>
      </div>

      <div className="player-cards">
        {session.players.map((p) => renderPlayerRow(p, true))}
      </div>

      {rebuyPlayer && onAddBuyIn && (
        <BuyInModal
          title={`Rebuy — ${rebuyPlayer.name}`}
          currency={session.currency}
          chipValue={session.chipValue}
          defaultCash={session.defaultBuyInCash}
          onConfirm={(cash) => {
            onAddBuyIn(rebuyPlayer.id, cash);
            setRebuyPlayerId(null);
          }}
          onClose={() => setRebuyPlayerId(null)}
        />
      )}

      {stackPlayer && onUpdateStack && (
        <StackUpdateModal
          playerName={stackPlayer.name}
          currency={session.currency}
          chipValue={session.chipValue}
          cashInvested={getPlayerCashInvested(stackPlayer)}
          chipsReceived={getPlayerChipsReceived(stackPlayer)}
          currentStack={stackPlayer.currentStackChips}
          onConfirm={(chips) => {
            onUpdateStack(stackPlayer.id, chips);
            setStackPlayerId(null);
          }}
          onClose={() => setStackPlayerId(null)}
        />
      )}

      {cashOutPlayer && onCashOut && (
        <CashOutModal
          playerName={cashOutPlayer.name}
          currency={session.currency}
          chipValue={session.chipValue}
          cashInvested={getPlayerCashInvested(cashOutPlayer)}
          chipsReceived={getPlayerChipsReceived(cashOutPlayer)}
          onConfirm={(chips) => {
            onCashOut(cashOutPlayer.id, chips);
            setCashOutPlayerId(null);
          }}
          onClose={() => setCashOutPlayerId(null)}
        />
      )}
    </>
  );
}
