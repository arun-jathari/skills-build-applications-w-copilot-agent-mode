import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from '../hooks/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };
type ActivityResponse = { activities: Activity[] };
const loadActivities = () => getJson<ActivityResponse>('/api/activities');

export default function Activities() {
  const resource = useApiResource(loadActivities);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">
    {resource.status === 'loading' && <p role="status">Loading activities...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load activities: {resource.error.message}</p>}
    {resource.status === 'success' && resource.data.activities.length === 0 && <p>No activities yet.</p>}
    {resource.status === 'success' && resource.data.activities.length > 0 && <ul className="list-group list-group-flush">
      {resource.data.activities.map((activity, index) => <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
        <strong>{activity.type}</strong> | {activity.minutes} minutes | {activity.points} points
      </li>)}
    </ul>}
  </CapabilityCard>;
}
