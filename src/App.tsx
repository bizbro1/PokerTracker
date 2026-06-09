import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ActiveSession } from './pages/ActiveSession';
import { Dashboard } from './pages/Dashboard';
import { HandsPage } from './pages/HandsPage';
import { History } from './pages/History';
import { JoinSession } from './pages/JoinSession';
import { NewSession } from './pages/NewSession';
import { PlayerStatsPage } from './pages/PlayerStatsPage';
import { PlayerView } from './pages/PlayerView';
import { SessionDetail } from './pages/SessionDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewSession />} />
          <Route path="session" element={<ActiveSession />} />
          <Route path="session/:id" element={<SessionDetail />} />
          <Route path="history" element={<History />} />
          <Route path="stats" element={<PlayerStatsPage />} />
          <Route path="join" element={<JoinSession />} />
          <Route path="join/:code" element={<JoinSession />} />
          <Route path="play" element={<PlayerView />} />
          <Route path="hands" element={<HandsPage tab="rankings" />} />
          <Route path="hands/checker" element={<HandsPage tab="checker" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
