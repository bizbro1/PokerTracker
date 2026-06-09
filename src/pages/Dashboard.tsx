import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { useSessions } from '../hooks/useSessions';
import { aggregatePlayerStats } from '../utils/calculations';
import { formatChips, formatCurrency, formatDate } from '../utils/format';

export function Dashboard() {
  const { sessions, activeSession } = useSessions();
  const closedSessions = sessions.filter((s) => s.status === 'closed');
  const recentSessions = [...closedSessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);
  const topPlayers = aggregatePlayerStats(sessions).slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Track your private poker nights</p>
      </div>

      {activeSession ? (
        <Card className="hero-card active-session-card">
          <div className="hero-content">
            <div>
              <span className="live-badge">Live Session</span>
              <h2>Game in progress</h2>
              <p>
                {activeSession.players.length} players ·{' '}
                {formatCurrency(activeSession.chipValue.cash, activeSession.currency)} ={' '}
                {formatChips(activeSession.chipValue.chips)} chips
              </p>
            </div>
            <Link to="/session" className="btn btn-primary btn-lg">
              Open Session
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="hero-card">
          <div className="hero-content">
            <div>
              <h2>Start a new poker night</h2>
              <p>Set up buy-ins, add players, and track the action.</p>
            </div>
            <Link to="/new" className="btn btn-primary btn-lg">
              + New Session
            </Link>
          </div>
        </Card>
      )}

      <div className="grid-2">
        <Card title="Quick Stats">
          <div className="stat-grid">
            <div className="stat-box">
              <span className="stat-number">{closedSessions.length}</span>
              <span className="stat-desc">Sessions played</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {new Set(closedSessions.flatMap((s) => s.players.map((p) => p.name))).size}
              </span>
              <span className="stat-desc">Unique players</span>
            </div>
          </div>
          {topPlayers.length > 0 && (
            <div className="leaderboard-preview">
              <h3>Top Players</h3>
              <ul>
                {topPlayers.map((p, i) => (
                  <li key={p.name}>
                    <span className="rank">#{i + 1}</span>
                    <span>{p.name}</span>
                    <span className={p.netProfit >= 0 ? 'profit' : 'loss'}>
                      {formatCurrency(p.netProfit, 'USD')}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to="/stats" className="link-more">
                View all stats →
              </Link>
            </div>
          )}
        </Card>

        <Card title="Recent Sessions">
          {recentSessions.length === 0 ? (
            <p className="empty-text">No past sessions yet.</p>
          ) : (
            <ul className="session-list">
              {recentSessions.map((session) => (
                <li key={session.id}>
                  <Link to={`/session/${session.id}`} className="session-list-item">
                    <span>{formatDate(session.startTime)}</span>
                    <span>{session.players.length} players</span>
                    <span>
                      {formatCurrency(session.chipValue.cash, session.currency)} ={' '}
                      {formatChips(session.chipValue.chips)} chips
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {closedSessions.length > 0 && (
            <Link to="/history" className="link-more">
              View full history →
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
