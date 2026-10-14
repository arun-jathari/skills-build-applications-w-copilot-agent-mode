# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-level React components focused on rendering and user interaction. Use the shared API client for relative `/api` requests and give each capability a loading state, a meaningful empty state, and an accessible error state.
- Logic tier decision: Keep HTTP parsing, validation, and response status codes in the Express routes, with persistence and domain calculations in the service layer. Return deliberate 4xx responses for invalid input or unknown users rather than exposing database cast errors. Keep the API unauthenticated for this exercise.
- Data tier decision: Make the contract fields required in Mongoose: user identity and fitness goal; team name and mascot; activity type, user, team, minutes, points, and occurrence date; workout focus, minutes, and difficulty. Default team members to an empty array. Preserve the seed script's idempotent, non-destructive behavior.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; verify both IDs are valid and refer to existing records before creating an activity. Compute points server-side at one point per minute and set `occurredAt` server-side. List created activities through the same response contract.
- Team management approach: Reject a missing or blank name with `400`; preserve the submitted name and mascot and the provided member references. Return created teams and list teams with their members.
- Leaderboard approach: Sum activity points per team, sort by total points descending, and assign 1-based ranks. Return `teamName`, `totalPoints`, and `rank` for each entry.
- Workout suggestions approach: Find the user by decoded email, use their goal and recent activity to rank matching workouts first, and include a reason tied to that goal or activity. Return a deliberate 4xx for an unknown email.

## Test plan

Record the commands you run and what each failure means.

- Implementation order: First complete and test Mongoose contracts while preserving the passing seed behavior; next implement service and route behavior against the API contracts; then implement the presentation states and data rendering; finally run all contract suites and both builds.
- Baseline environment: MongoDB was running on port `27017`; backend and frontend dependencies were installed with `npm ci --prefix octofit-tracker/backend` and `npm ci --prefix octofit-tracker/frontend`.
- Backend baseline: `npm test --prefix octofit-tracker/backend` produced 8 failures and 1 pass (9 tests total). The passing test confirms representative seed data remains non-destructive and idempotent; failures identify missing data validation and incomplete API behavior.
- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` checks required schema fields, team member defaults/references, and non-destructive idempotent seeding. Baseline: 4 failures and 1 pass; the four schema contracts fail, while seeding passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` checks activity validation/creation/listing, team creation/listing, point totals and ranks, and goal/activity-matched suggestions. Baseline: 4 failures; invalid writes return `501` instead of `400`, leaderboard is empty, and suggestion reasons are missing.
- Frontend command: `npm test --prefix octofit-tracker/frontend` checks API-backed rendering, workout request URL, and loading, empty, and accessible error states on all four routes. Baseline: 15 failures; capability components still show “Implementation pending” rather than implementing these states and behaviors.
- Backend build command: `npm run build --prefix octofit-tracker/backend` checks TypeScript compilation. Not run for the baseline; run after implementation, and treat compiler errors as a failed gate.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` checks TypeScript compilation and the Vite production build. Not run for the baseline; run after implementation, and treat type or bundling errors as a failed gate.
