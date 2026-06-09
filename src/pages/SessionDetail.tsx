import { Link, useNavigate, useParams } from 'react-router-dom';
import { BalanceWarning } from '../components/BalanceWarning';
import { BlindPlanDisplay } from '../components/BlindPlanDisplay';
import { Card } from '../components/Card';
import { ChipSummaryBar } from '../components/ChipSummaryBar';
import { PlayerTable } from '../components/PlayerTable';
import { SessionSummaryBar } from '../components/SessionSummaryBar';
import { useSessions } from '../hooks/useSessions';
import { getSessionSummary } from '../utils/calculations';
import { exportSessionCSV, exportSessionPDF } from '../utils/export';
import { confirmHostPin } from '../utils/hostPin';
import { formatCurrency } from '../utils/format';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSession, deleteSession } = useSessions();
  const session = id ? getSession(id) : null;

  if (!session) {
    return (
      <div className="page">
        <Card>
          <p className="empty-text">Session not found.</p>
          <Link to="/history" className="btn btn-ghost">
            Back to History
          </Link>
        </Card>
      </div>
    );
  }

  const summary = getSessionSummary(session);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/history" className="back-link">
            ← History
          </Link>
          <h1>Session Details</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => exportSessionCSV(session)}>
            Export CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportSessionPDF(session)}>
            Export PDF
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (!confirmHostPin(session, 'delete this session')) return;
              if (confirm('Delete this session permanently?')) {
                deleteSession(session.id);
                navigate('/history');
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <SessionSummaryBar session={session} />
      <ChipSummaryBar session={session} />
      <BalanceWarning session={session} />

      <div className="results-highlight closed">
        {summary.biggestWinner && (
          <div className="result-card winner">
            <span className="result-label">Biggest Winner</span>
            <span className="result-name">{summary.biggestWinner.name}</span>
            <span className="result-amount profit">
              +{formatCurrency(summary.biggestWinner.profit, session.currency)}
            </span>
          </div>
        )}
        {summary.biggestLoser && (
          <div className="result-card loser">
            <span className="result-label">Biggest Loser</span>
            <span className="result-name">{summary.biggestLoser.name}</span>
            <span className="result-amount loss">
              {formatCurrency(summary.biggestLoser.loss, session.currency)}
            </span>
          </div>
        )}
      </div>

      {session.blindPlan && <BlindPlanDisplay blindPlan={session.blindPlan} />}

      <Card title="Players">
        <PlayerTable session={session} readOnly />
      </Card>

      {session.notes && (
        <Card title="Notes">
          <p className="session-notes">{session.notes}</p>
        </Card>
      )}
    </div>
  );
}
