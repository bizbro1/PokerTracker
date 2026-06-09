import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { useSessions } from '../hooks/useSessions';
import { cashToChips } from '../utils/calculations';
import { formatChips, formatCurrency } from '../utils/format';
import { normalizeJoinCode } from '../utils/joinCode';
import { savePlayerIdentity } from '../utils/playerIdentity';

export function JoinSession() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { ready, getSessionByJoinCode, joinAsPlayer } = useSessions();

  const [codeInput, setCodeInput] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);

  // No code in the URL yet: ask for it
  if (!code) {
    const handleCodeSubmit = (e: FormEvent) => {
      e.preventDefault();
      const normalized = normalizeJoinCode(codeInput);
      if (normalized) navigate(`/join/${normalized}`);
    };

    return (
      <div className="page page-narrow">
        <Card title="Join a Poker Night">
          <form onSubmit={handleCodeSubmit}>
            <label className="field">
              <span>Enter the join code from the host</span>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. K7PD"
                maxLength={8}
                autoFocus
                required
                className="join-code-input"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-block">
              Find Game
            </button>
          </form>
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

  const session = getSessionByJoinCode(code);

  if (!session) {
    return (
      <div className="page page-narrow">
        <Card title="Game Not Found">
          <p className="empty-text">
            No active game with code <strong>{normalizeJoinCode(code)}</strong>. Check the code
            with your host.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => navigate('/join')}
          >
            Try Another Code
          </button>
        </Card>
      </div>
    );
  }

  const buyInChips = cashToChips(session.defaultBuyInCash, session.chipValue);

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || joining) return;
    setJoining(true);

    const playerId = joinAsPlayer(session.id, trimmed);
    if (!playerId) {
      setJoining(false);
      return;
    }
    savePlayerIdentity({ sessionId: session.id, playerId, name: trimmed });
    navigate('/play');
  };

  return (
    <div className="page page-narrow">
      <Card title="Join Poker Night">
        <div className="join-session-info">
          <div className="join-session-row">
            <span>Buy-in</span>
            <strong>
              {formatCurrency(session.defaultBuyInCash, session.currency)} ={' '}
              {formatChips(buyInChips)} chips
            </strong>
          </div>
          <div className="join-session-row">
            <span>Players at the table</span>
            <strong>{session.players.length}</strong>
          </div>
        </div>
        <p className="form-hint">Pay your buy-in to the host in cash. They hand out the chips.</p>
        <form onSubmit={handleJoin}>
          <label className="field">
            <span>Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Magnus"
              maxLength={30}
              autoFocus
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={joining}>
            {joining ? 'Joining…' : 'Join Game'}
          </button>
        </form>
      </Card>
    </div>
  );
}
