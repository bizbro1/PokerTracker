import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ActivityLog } from '../components/ActivityLog';
import { BalanceWarning } from '../components/BalanceWarning';
import { BlindPlanDisplay } from '../components/BlindPlanDisplay';
import { BuyInModal } from '../components/BuyInModal';
import { Card } from '../components/Card';
import { JoinCodeCard } from '../components/JoinCodeCard';
import { PlayerTable } from '../components/PlayerTable';
import { SessionEventToast } from '../components/SessionEventToast';
import { SessionStatStrip } from '../components/SessionStatStrip';
import { useSessionEventAlerts } from '../hooks/useSessionEventAlerts';
import { useSessions } from '../hooks/useSessions';
import { useWakeLock } from '../hooks/useWakeLock';
import { getSessionSummary } from '../utils/calculations';
import { exportSessionCSV, exportSessionPDF } from '../utils/export';
import { formatCurrency } from '../utils/format';
import { isHostDevice, markHostDevice } from '../utils/hostDevice';
import { confirmHostPin } from '../utils/hostPin';

export function ActiveSession() {
  const navigate = useNavigate();
  const {
    activeSession,
    addPlayer,
    addBuyIn,
    updatePlayerStack,
    cashOutPlayer,
    markBusted,
    removePlayer,
    toggleBlindTimerPause,
    closeSession,
  } = useSessions();
  const [playerName, setPlayerName] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [hostUnlocked, setHostUnlocked] = useState(false);

  // Keep the host screen awake during the live session (blind timer etc.)
  useWakeLock(!!activeSession);
  const eventToast = useSessionEventAlerts(activeSession);

  if (!activeSession) {
    return (
      <div className="page">
        <Card>
          <p className="empty-text">No active session.</p>
          <Link to="/new" className="btn btn-primary">
            Start New Session
          </Link>
        </Card>
      </div>
    );
  }

  // Host controls live on the device that created the session. Other devices
  // can watch read-only, or unlock with the host PIN (when one is set).
  const isHost =
    !activeSession.hostPin || hostUnlocked || isHostDevice(activeSession.id);

  const handleUnlockHost = () => {
    if (!confirmHostPin(activeSession, 'unlock host controls')) return;
    markHostDevice(activeSession.id);
    setHostUnlocked(true);
  };

  const summary = getSessionSummary(activeSession);

  const handleAddPlayerSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setShowAddPlayerModal(true);
  };

  const handleClose = () => {
    if (!confirmHostPin(activeSession, 'end the session')) return;
    closeSession(activeSession.id);
    navigate(`/session/${activeSession.id}`);
  };

  return (
    <div className="page page-wide">
      <SessionEventToast event={eventToast} />
      <div className="page-header">
        <h1>Live Session</h1>
        {!isHost && (
          <div className="page-actions">
            <span className="spectator-badge">Spectator</span>
            <button className="btn btn-sm btn-secondary" onClick={handleUnlockHost}>
              I'm the host
            </button>
          </div>
        )}
      </div>

      <SessionStatStrip
        session={activeSession}
        onTogglePause={isHost ? () => toggleBlindTimerPause(activeSession.id) : undefined}
        showAccounting={isHost}
      />
      <BalanceWarning session={activeSession} />

      <div className="session-grid">
        <div className="session-main">
          {(summary.biggestWinner || summary.biggestLoser) && (
            <div className="results-highlight">
              {summary.biggestWinner && (
                <span className="profit">
                  Top: {summary.biggestWinner.name} (
                  {formatCurrency(summary.biggestWinner.profit, activeSession.currency)})
                </span>
              )}
              {summary.biggestLoser && (
                <span className="loss">
                  Bottom: {summary.biggestLoser.name} (
                  {formatCurrency(summary.biggestLoser.loss, activeSession.currency)})
                </span>
              )}
            </div>
          )}

          <Card title="Players">
            <PlayerTable
              session={activeSession}
              readOnly={!isHost}
              onAddBuyIn={(id, cash) => addBuyIn(activeSession.id, id, cash)}
              onUpdateStack={(id, chips) => updatePlayerStack(activeSession.id, id, chips)}
              onCashOut={(id, chips) => cashOutPlayer(activeSession.id, id, chips)}
              onBust={(id) => markBusted(activeSession.id, id)}
              onRemove={(id) => {
                if (confirmHostPin(activeSession, 'remove this player')) {
                  removePlayer(activeSession.id, id);
                }
              }}
            />

            {isHost && (
              <form className="add-player-form" onSubmit={handleAddPlayerSubmit}>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player name"
                  required
                />
                <button type="submit" className="btn btn-secondary">
                  + Add Player
                </button>
              </form>
            )}
          </Card>
        </div>

        <aside className="session-side">
          <Card title="Activity">
            <ActivityLog events={activeSession.events ?? []} limit={30} compact />
          </Card>

          <JoinCodeCard joinCode={activeSession.joinCode} />

          {activeSession.blindPlan && (
            <BlindPlanDisplay blindPlan={activeSession.blindPlan} collapsible />
          )}

          {activeSession.notes && (
            <Card title="Notes">
              <p className="session-notes">{activeSession.notes}</p>
            </Card>
          )}

          {isHost ? (
          <Card title="Session">
            <div className="session-side-actions">
              <a
                href="/tv"
                target="_blank"
                rel="noopener"
                className="btn btn-secondary btn-block"
              >
                📺 Open TV Display
              </a>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => exportSessionCSV(activeSession)}
              >
                Export CSV
              </button>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => exportSessionPDF(activeSession)}
              >
                Export PDF
              </button>
              {!showCloseConfirm ? (
                <button
                  className="btn btn-danger btn-block"
                  onClick={() => setShowCloseConfirm(true)}
                >
                  End Session
                </button>
              ) : (
                <div className="close-confirm">
                  <p>End this session? Make sure all players are cashed out.</p>
                  <div className="modal-actions">
                    <button className="btn btn-ghost" onClick={() => setShowCloseConfirm(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-danger" onClick={handleClose}>
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
          ) : (
            <Card title="Session">
              <p className="form-hint">
                You're watching as a spectator. Buy-ins, cash-outs, and busts are managed on
                the host's device. If this is your device, tap "I'm the host" above and enter
                the host PIN.
              </p>
            </Card>
          )}
        </aside>
      </div>

      {showAddPlayerModal && (
        <BuyInModal
          title={`Buy-in — ${playerName}`}
          currency={activeSession.currency}
          chipValue={activeSession.chipValue}
          defaultCash={activeSession.defaultBuyInCash}
          onConfirm={(cash) => {
            addPlayer(activeSession.id, playerName, cash);
            setPlayerName('');
            setShowAddPlayerModal(false);
          }}
          onClose={() => setShowAddPlayerModal(false)}
        />
      )}
    </div>
  );
}
