import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { useSessions } from '../hooks/useSessions';
import { getSessionSummary } from '../utils/calculations';
import { formatChips, formatCurrency, formatDate, formatDuration } from '../utils/format';

export function History() {
  const { sessions } = useSessions();
  const closedSessions = sessions
    .filter((s) => s.status === 'closed')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="page">
      <div className="page-header">
        <h1>Session History</h1>
        <p className="page-subtitle">{closedSessions.length} past poker nights</p>
      </div>

      {closedSessions.length === 0 ? (
        <Card>
          <p className="empty-text">No completed sessions yet.</p>
        </Card>
      ) : (
        <div className="history-grid">
          {closedSessions.map((session) => {
            const summary = getSessionSummary(session);
            const balanced = summary.isCashBalanced && summary.chipsUnaccounted === 0;
            return (
              <Link key={session.id} to={`/session/${session.id}`} className="history-card">
                <div className="history-card-header">
                  <span className="history-date">{formatDate(session.startTime)}</span>
                  {!balanced && (
                    <span className="badge badge-warning">Unbalanced</span>
                  )}
                </div>
                <div className="history-card-body">
                  <span>{session.players.length} players</span>
                  <span>
                    {formatCurrency(session.chipValue.cash, session.currency)} ={' '}
                    {formatChips(session.chipValue.chips)} chips
                  </span>
                  <span>
                    Collected: {formatCurrency(summary.totalCashCollected, session.currency)}
                  </span>
                  {summary.durationMs && (
                    <span>{formatDuration(summary.durationMs)}</span>
                  )}
                </div>
                {summary.biggestWinner && (
                  <div className="history-card-footer profit">
                    Winner: {summary.biggestWinner.name} (+
                    {formatCurrency(summary.biggestWinner.profit, session.currency)})
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
