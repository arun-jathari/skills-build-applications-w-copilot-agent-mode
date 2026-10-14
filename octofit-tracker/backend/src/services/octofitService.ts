import type { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const objectIdPattern = /^[a-f\d]{24}$/i;

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity must be an object');

  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !objectIdPattern.test(userId)) throw httpError(400, 'A valid userId is required');
  if (typeof teamId !== 'string' || !objectIdPattern.test(teamId)) throw httpError(400, 'A valid teamId is required');
  if (typeof type !== 'string' || type.trim().length === 0) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw httpError(400, 'Minutes must be a positive number');

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) throw httpError(404, 'User or team was not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team must be an object');

  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || name.trim().length === 0) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || mascot.trim().length === 0) throw httpError(400, 'Team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !objectIdPattern.test(member))) {
    throw httpError(400, 'Members must be valid user IDs');
  }

  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User was not found');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const normalize = (value: string) => value.trim().toLowerCase();
  const activityMatch = (focus: string) => activities.find(({ type }) => {
    const activityType = normalize(type);
    return focus === activityType || focus.includes(activityType) || activityType.includes(focus);
  });

  return workouts
    .map((workout) => {
      const focus = normalize(workout.focus);
      const matchesGoal = focus === goal;
      const matchedActivity = activityMatch(focus);
      const reason = matchesGoal
        ? `Matches your ${user.fitnessGoal} fitness goal${matchedActivity ? ` and recent ${matchedActivity.type} activity` : ''}.`
        : matchedActivity
          ? `Recommended based on your recent ${matchedActivity.type} activity.`
          : `Supports your ${user.fitnessGoal} fitness goal.`;
      return { workout, score: Number(matchesGoal) * 2 + Number(Boolean(matchedActivity)), reason };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title))
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
