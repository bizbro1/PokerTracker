import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { CurrentBlindsBar } from '../components/CurrentBlindsBar';
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
  const { sessions, ready, updatePlayerStack } = useSessions();
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

      <CurrentBlindsBar session={session} />

      <Card title="My Stats" className="player-self-card">
        <div className="player-self-header">
          <StatusBadge status={player.status} />
          {session.status === 'closed' && <span className="badge">Session ended</span>}
        </div>

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

          {isPlaying && (
            <div className="player-self-stat">
              <span className="player-self-label">Current stack</span>
              <span className="player-self-value">
                {player.currentStackChips !== null
                  ? `${formatChips(player.currentStackChips)} chips`
                  : '—'}
              </span>
            </div>
          )}

          {isPlaying && stackCash !== null && (
            <div className="player-self-stat">
              <span className="player-self-label">Stack value</span>
              <span className="player-self-value">
                {formatCurrency(stackCash, session.currency)}
              </span>
            </div>
          )}

          {isPlaying && liveProfit !== null && (
            <div className="player-self-stat">
              <span className="player-self-label">Live P/L</span>
              <span className={`player-self-value ${liveProfit >= 0 ? 'profit' : 'loss'}`}>
                {formatProfitLoss(liveProfit, session.currency)}
                {liveProfitChips !== null && (
                  <span className="chip-pl"> ({formatChipProfitLoss(liveProfitChips)})</span>
                )}
              </span>
            </div>
          )}

          {finalCashOut !== null && (
            <div className="player-self-stat">
              <span className="player-self-label">Cashed out</span>
              <span className="player-self-value">
                {formatCurrency(finalCashOut, session.currency)}
              </span>
            </div>
          )}

          {finalProfit !== null && (
            <div className="player-self-stat">
              <span className="player-self-label">Result</span>
              <span className={`player-self-value ${finalProfit >= 0 ? 'profit' : 'loss'}`}>
                {formatProfitLoss(finalProfit, session.currency)}
                {finalProfitChips !== null && (
                  <span className="chip-pl"> ({formatChipProfitLoss(finalProfitChips)})</span>
                )}
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

        {!isPlaying && session.status === 'active' && player.status !== 'playing' && (
          <p className="form-hint">
            Want back in? Ask the host to register a rebuy for you.
          </p>
        )}
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
