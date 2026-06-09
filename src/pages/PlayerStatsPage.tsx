import { Card } from '../components/Card';
import { useSessions } from '../hooks/useSessions';
import { aggregatePlayerStats } from '../utils/calculations';
import { formatCurrency } from '../utils/format';

export function PlayerStatsPage() {
  const { sessions } = useSessions();
  const stats = aggregatePlayerStats(sessions);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Player Stats</h1>
        <p className="page-subtitle">All-time performance across sessions</p>
      </div>

      {stats.length === 0 ? (
        <Card>
          <p className="empty-text">No player data yet. Complete a session to see stats.</p>
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="player-table stats-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Sessions</th>
                  <th>Invested</th>
                  <th>Cashed Out</th>
                  <th>Net P/L</th>
                  <th>W/L</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((player) => (
                  <tr key={player.name}>
                    <td className="player-name">{player.name}</td>
                    <td>{player.sessionsPlayed}</td>
                    <td>{formatCurrency(player.totalInvested, 'USD')}</td>
                    <td>{formatCurrency(player.totalCashOut, 'USD')}</td>
                    <td className={player.netProfit >= 0 ? 'profit' : 'loss'}>
                      {formatCurrency(player.netProfit, 'USD')}
                    </td>
                    <td>
                      <span className="profit">{player.wins}W</span>
                      {' / '}
                      <span className="loss">{player.losses}L</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stats-cards">
            {stats.map((player) => (
              <div key={player.name} className="stats-card">
                <div className="stats-card-header">
                  <span className="player-name">{player.name}</span>
                  <span className={player.netProfit >= 0 ? 'profit' : 'loss'}>
                    {formatCurrency(player.netProfit, 'USD')}
                  </span>
                </div>
                <div className="stats-card-body">
                  <span>{player.sessionsPlayed} sessions</span>
                  <span>
                    {player.wins}W / {player.losses}L
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
