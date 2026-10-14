import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: Team[] };
const loadTeams = () => getJson<TeamsResponse>('/api/teams');

export default function Teams() {
  const resource = useApiResource(loadTeams);

  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {resource.status === 'loading' && <p role="status">Loading teams...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load teams: {resource.error.message}</p>}
    {resource.status === 'success' && resource.data.teams.length === 0 && <p>No teams yet.</p>}
    {resource.status === 'success' && resource.data.teams.length > 0 && <ul className="list-group list-group-flush">
      {resource.data.teams.map((team, index) => <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
        <h3 className="h5">{team.name}</h3>
        <p className="mb-1">Mascot: {team.mascot}</p>
        <p className="mb-0">Members: {team.members.length ? team.members.join(', ') : 'None'}</p>
      </li>)}
    </ul>}
  </CapabilityCard>;
}
