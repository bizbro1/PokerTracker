import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { SessionStatStrip } from '../components/SessionStatStrip';
import { StackUpdateModal } from '../components/StackUpdateModal';
import { StatusBadge } from '../components/StatusBadge';
import { useSessions } from '../hooks/useSessions';
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
import { clearPlayerIdentity, getPlayerIdentity } from '../utils/playerIdentity';

export function PlayerView() {
  const navigate = useNavigate();
  const { sessions, ready, updatePlayerStack, requestRebuy } = useSessions();
  const [identity, setIdentity] = useState(getPlayerIdentity);
  const [showStackModal, setShowStackModal] = useState(false);

  const handleLeave = () => {
    clearPlayerIdentity();
    setIdentity(null);
    navigate('/join');
  };

  if (!identity) {
    return (
      <div className="page page-narrow">
        <Card title="My Game">
          <p className="empty-text">You haven't joined a game yet.</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => navigate('/join')}
          >
            Join a Game
          </button>
        </Card>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="page page-narrow">
        <Card>
          <p className="empty-text">Connecting…</p>
        </Card>
      </div>
    );
  }

  const session = sessions.find((s) => s.id === identity.sessionId) ?? null;
  const player = session?.players.find((p) => p.id === identity.playerId) ?? null;

  if (!session || !player) {
    return (
      <div className="page page-narrow">
        <Card title="My Game">
          <p className="empty-text">
            {!session
              ? 'This game no longer exists.'
              : 'You are no longer in this game (the host may have removed you).'}
          </p>
          <button type="button" className="btn btn-secondary btn-block" onClick={handleLeave}>
            Join Another Game
          </button>
        </Card>
      </div>
    );
  }

  const invested = getPlayerCashInvested(player);
  const chipsReceived = getPlayerChipsReceived(player);
  const isPlaying = player.status === 'playing' && session.status === 'active';

  const finalCashOut = getPlayerCashOut(player, session.chipValue);
  const finalProfit = getPlayerProfitCash(player, session.chipValue);
  const finalProfitChips = getPlayerProfitChips(player);

  const liveProfit = getPlayerLiveProfitCash(player, session.chipValue);
  const liveProfitChips = getPlayerLiveProfitChips(player);
  const stackCash =
    player.currentStackChips !== null
      ? chipsToCash(player.currentStackChips, session.chipValue)
      : null;

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Hi, {player.name}</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleLeave}>
          Leave
        </button>
      </div>

      <SessionStatStrip session={session} />

      <Card title="My Stats" className="player-self-card">
        <div className="player-self-header">
          <StatusBadge status={player.status} />
          {session.status === 'closed' && <span className="badge">Session ended</span>}
        </div>

        {isPlaying && (
          <div className="player-self-hero">
            <span className="player-self-hero-label">My Stack</span>
            <span className="player-self-hero-value">
              {player.currentStackChips !== null
                ? formatChips(player.currentStackChips)
                : '—'}
            </span>
            {stackCash !== null && (
              <span className="player-self-hero-sub">
                = {formatCurrency(stackCash, session.currency)}
              </span>
            )}
            {liveProfit !== null && (
              <span className={`player-self-hero-pl ${liveProfit >= 0 ? 'profit' : 'loss'}`}>
                {formatProfitLoss(liveProfit, session.currency)}
                {liveProfitChips !== null && (
                  <span className="chip-pl"> ({formatChipProfitLoss(liveProfitChips)})</span>
                )}
              </span>
            )}
            {player.currentStackChips === null && (
              <span className="player-self-hero-sub">tap below to count your chips</span>
            )}
          </div>
        )}

        {!isPlaying && finalProfit !== null && (
          <div className="player-self-hero">
            <span className="player-self-hero-label">My Result</span>
            <span
              className={`player-self-hero-value ${finalProfit >= 0 ? 'profit' : 'loss'}`}
            >
              {formatProfitLoss(finalProfit, session.currency)}
            </span>
            {finalProfitChips !== null && (
              <span className="player-self-hero-sub">
                {formatChipProfitLoss(finalProfitChips)} chips
              </span>
            )}
          </div>
        )}

        <div className="player-self-grid">
          <div className="player-self-stat">
            <span className="player-self-label">Buy-ins</span>
            <span className="player-self-value">{player.buyIns.length}</span>
          </div>
          <div className="player-self-stat">
            <span className="player-self-label">Invested</span>
            <span className="player-self-value">{formatCurrency(invested, session.currency)}</span>
          </div>
          <div className="player-self-stat">
            <span className="player-self-label">Chips received</span>
            <span className="player-self-value">{formatChips(chipsReceived)}</span>
          </div>

          {finalCashOut !== null && (
            <div className="player-self-stat">
              <span className="player-self-label">Cashed out</span>
              <span className="player-self-value">
                {formatCurrency(finalCashOut, session.currency)}
              </span>
            </div>
          )}
        </div>

        {isPlaying && (
          <button
            type="button"
            className="btn btn-primary btn-block player-self-stack-btn"
            onClick={() => setShowStackModal(true)}
          >
            Update My Stack
          </button>
        )}

        {session.status === 'active' && (
          <button
            type="button"
            className={`btn btn-block player-self-rebuy-btn ${
              player.rebuyRequested ? 'btn-ghost' : 'btn-secondary'
            }`}
            onClick={() => requestRebuy(session.id, player.id, !player.rebuyRequested)}
          >
            {player.rebuyRequested ? 'Cancel Rebuy Request' : 'Request Rebuy'}
          </button>
        )}

        {player.rebuyRequested && (
          <p className="form-hint">
            Rebuy requested — the host will see it and hand you chips when you've paid.
          </p>
        )}
      </Card>

      <Card title="At the Table">
        <ul className="table-overview">
          {session.players.map((p) => (
            <li
              key={p.id}
              className={`table-overview-row ${p.id === player.id ? 'table-overview-me' : ''}`}
            >
              <span className="table-overview-name">
                {p.name}
                {p.id === player.id && <span className="table-overview-you"> (you)</span>}
              </span>
              <span className="table-overview-buyins">
                {p.buyIns.length} buy-in{p.buyIns.length === 1 ? '' : 's'}
              </span>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      </Card>

      {showStackModal && (
        <StackUpdateModal
          playerName={player.name}
          currency={session.currency}
          chipValue={session.chipValue}
          cashInvested={invested}
          chipsReceived={chipsReceived}
          currentStack={player.currentStackChips}
          onConfirm={(chips) => {
            updatePlayerStack(session.id, player.id, chips);
            setShowStackModal(false);
          }}
          onClose={() => setShowStackModal(false)}
        />
      )}
    </div>
  );
}
