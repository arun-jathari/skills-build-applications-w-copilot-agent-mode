import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type WorkoutSuggestion = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutsResponse = { suggestions: WorkoutSuggestion[] };
const userEmail = 'mona@example.com';

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const resource = useApiResource<WorkoutsResponse>(path, getJson);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {resource.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load workout suggestions: {resource.error.message}</p>}
    {resource.status === 'success' && resource.data.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
    {resource.status === 'success' && resource.data.suggestions.length > 0 && <ul className="list-group list-group-flush">
      {resource.data.suggestions.map((workout, index) => <li className="list-group-item" key={`${workout.title}-${index}`}>
        <h3 className="h5">{workout.title}</h3>
        {workout.focus && <p className="mb-1">Focus: {workout.focus}</p>}
        {(workout.minutes || workout.difficulty) && <p className="mb-1">{workout.minutes ? `${workout.minutes} minutes` : ''}{workout.minutes && workout.difficulty ? ' - ' : ''}{workout.difficulty ?? ''}</p>}
        {workout.reason && <p className="mb-0">{workout.reason}</p>}
      </li>)}
    </ul>}
  </CapabilityCard>;
}
