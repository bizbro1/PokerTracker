import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BalanceWarning } from '../components/BalanceWarning';
import { BlindPlanDisplay } from '../components/BlindPlanDisplay';
import { BuyInModal } from '../components/BuyInModal';
import { Card } from '../components/Card';
import { ChipSummaryBar } from '../components/ChipSummaryBar';
import { CurrentBlindsBar } from '../components/CurrentBlindsBar';
import { JoinCodeCard } from '../components/JoinCodeCard';
import { PlayerTable } from '../components/PlayerTable';
import { useSessions } from '../hooks/useSessions';
import { getSessionSummary } from '../utils/calculations';
import { exportSessionCSV, exportSessionPDF } from '../utils/export';
import { formatCurrency } from '../utils/format';

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

  const summary = getSessionSummary(activeSession);

  const handleAddPlayerSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setShowAddPlayerModal(true);
  };

  const handleClose = () => {
    closeSession(activeSession.id);
    navigate(`/session/${activeSession.id}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Live Session</h1>
        <div className="page-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportSessionCSV(activeSession)}
          >
            Export CSV
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportSessionPDF(activeSession)}
          >
            Export PDF
          </button>
        </div>
      </div>

      <CurrentBlindsBar
        session={activeSession}
        onTogglePause={() => toggleBlindTimerPause(activeSession.id)}
      />
      <ChipSummaryBar session={activeSession} />
      <BalanceWarning session={activeSession} />

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

      {activeSession.blindPlan && (
        <BlindPlanDisplay blindPlan={activeSession.blindPlan} collapsible />
      )}

      <Card title="Players">
        <PlayerTable
          session={activeSession}
          onAddBuyIn={(id, cash) => addBuyIn(activeSession.id, id, cash)}
          onUpdateStack={(id, chips) => updatePlayerStack(activeSession.id, id, chips)}
          onCashOut={(id, chips) => cashOutPlayer(activeSession.id, id, chips)}
          onBust={(id) => markBusted(activeSession.id, id)}
          onRemove={(id) => removePlayer(activeSession.id, id)}
        />

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
      </Card>

      <JoinCodeCard joinCode={activeSession.joinCode} />

      {activeSession.notes && (
        <Card title="Notes">
          <p className="session-notes">{activeSession.notes}</p>
        </Card>
      )}

      <Card>
        <div className="close-session">
          {!showCloseConfirm ? (
            <button className="btn btn-danger" onClick={() => setShowCloseConfirm(true)}>
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
                  Confirm End Session
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

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
