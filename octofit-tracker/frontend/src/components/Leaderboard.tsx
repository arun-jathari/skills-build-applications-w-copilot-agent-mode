import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const resource = useApiResource<LeaderboardResponse>('/api/leaderboard', getJson);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {resource.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load leaderboard: {resource.error.message}</p>}
    {resource.status === 'success' && resource.data.leaderboard.length === 0 && <p>No rankings yet.</p>}
    {resource.status === 'success' && resource.data.leaderboard.length > 0 && <ol className="list-group list-group-numbered">
      {resource.data.leaderboard.map((entry) => <li className="list-group-item d-flex justify-content-between" key={`${entry.rank}-${entry.teamName}`}>
        <span><strong>{entry.teamName}</strong> <span className="text-body-secondary">Rank {entry.rank}</span></span>
        <span>{entry.totalPoints} points</span>
      </li>)}
    </ol>}
  </CapabilityCard>;
}
