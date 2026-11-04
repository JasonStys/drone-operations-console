# Animated route rehearsal

By Jason Stys. Version 0.2.0 adds an independent 2D exercise to the authenticated
console. The exercise cannot modify a fleet plan, send aircraft commands, connect
to PX4, identify objects, pursue or evade a target.

## Operation

Sign in and scroll to **Flight path rehearsal**. Choose a scenario and use Play,
Pause, Step 1 second and Reset. Exercises start paused, including for reduced-motion
users. Hiding the page pauses the clock. Delayed frames advance at most 0.1 seconds.
Thin lines show complete routes; bright dashed paths show the next ten seconds,
capped by completion or a separation hold. Markers and tables share the same clock.
All coordinates, radii, distances and speeds use meters and meters per second.

Add an obstacle with its east/north coordinates and radius. At most eight disks
are accepted, with centers within ±120 m and radii of 1–35 m. The outline adds a
3 m clearance margin. Disks extend through all modeled heights; there is no altitude
bypass. Editing resets and pauses the exercise. Remove disks with numbered buttons.
These settings are temporary and reset on reload. Download rehearsal JSON to save
the synthetic inputs, model assumptions and sampled results. Accounts, fleet plans
and command audit data are not included in that download.

## Scenarios and independent expectations

| Scenario | Expected result |
| --- | --- |
| Perimeter inspection | 680 m in 136 s at 5 m/s. At t=10 s: east −100 m, north −20 m; ten-second projection ends at north 30 m. |
| Obstacle detour | From (−100, 0) to (100, 0), around a radius-24 m disk plus 3 m clearance. Route exceeds 200 m; every segment clears the inflated disk. |
| Cooperative rendezvous | Friendly couriers independently reach agreed endpoints (0, 0) and (0, 20), holding 20 m apart. Neither pursues or evades the other. |
| Crossing traffic hold | Both stop before their perpendicular routes breach 8 m separation. Future paths stop too. This is a global conservative hold. |
| Blocked corridor | Five overlapping disks form a complete barrier. No route is invented; all aircraft hold and Play is disabled. |

## Model and bounds

A* uses a 5 m grid, Euclidean heuristic and binary min-heap. Exact continuous
endpoint links preserve non-grid coordinates. Every edge clears every disk plus
3 m. A clear direct segment avoids graph search. Failure means no route on this
grid, not proof that every physically possible route is blocked.

Limits: 2,403 graph vertices, eight disks, three friendly routes, eight waypoints
per route, speed 1–8 m/s, and a 180 s exercise cap. A time limit is labeled separately
from actual endpoint arrival. Planning costs O((V+E) log V × O) with O(V) auxiliary
memory per leg, where O is obstacle count. Interpolation scales with route points.
Separation checks use 0.05 s intervals with a 0.8 m conservative inflation, covering
maximum relative movement of two 8 m/s aircraft, including bends. Swept segment
checks may hold early. No avoidance claim applies to conflicting initial positions.

This does not model aerodynamics, altitude, battery, wind, weather, real terrain,
unknown intent, uncertainty, navigation or legal airspace. Projection visualizes
the assumed plan. It is not targeting, interception or certified collision avoidance.

## Windows desktop application

Download the Windows x64 installer and SHA256SUMS.txt from GitHub Releases. Verify
the checksum, install per user and launch **Drone Operations Console** on the desktop.
No Python, Node, IDE, hosting account or AI API is needed to run it. First launch
offers a local operator account: choose a unique lowercase 3–40 character name and
a password of 14–128 characters. Public web signup remains disabled.

Accounts/SQLite live under `%APPDATA%\DroneOperationsConsole`, outside Git and the
installation. Passwords use Argon2id hashes. This is not an encrypted vault that
hides data from the current OS user or local administrators. Uninstall preserves
data. Close the app before backing up that folder. There is no email password reset;
trusted administrators can use the existing local provisioning tools.

The native window uses a sandbox, context isolation and disabled Node integration.
Only its owned loopback service is allowed; external navigation/requests, popups
and device permissions are blocked. A random launch capability, injected outside
the renderer, guards first-account setup and all private app routes. Normal Origin,
session, CSRF and role checks still apply. Closing/crashing the launcher closes its
pipe and requests graceful backend/SQL shutdown. Desktop starts only replay.

The installer is unsigned: no certificate is configured. Windows may show a publisher
or reputation warning. Verify the release/source; no OS protection is disabled.

## Verification

Unit tests use independently written coordinates, timing, endpoint and swept-clearance
assertions. A mutation smoke check removes the obstacle margin, freezes movement and
bypasses separation holds; actual tests must reject all three faults and restore source.
Real browser tests cover animation, pause/step, obstacles, endpoints, JSON downloads,
mobile width and unchanged aircraft commands. Each engine gets an isolated database
and service without weakening the production login budget. Native acceptance starts
the actual packaged executable, creates an account, checks movement and effective
sandbox settings, restarts with the same profile, and signs in again. Existing native
PX4, PostgreSQL, container, CodeQL and multi-OS checks remain independent gates.

## Primary references

- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame): timestamp-driven rendering and hidden-page behavior.
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security): sandbox, isolation, navigation and permissions.
- [Electron 44.10.2](https://releases.electronjs.org/release/v44.10.2): pinned November 3, 2026 runtime release.
- [Playwright Electron API](https://playwright.dev/docs/api/class-electron): actual executable acceptance.
- [PyInstaller usage](https://pyinstaller.org/en/stable/usage.html): frozen service packaging.

Framework sources support those implementation choices. Model validity is bounded by
this repository's assumptions and observed tests, not conferred by these references.
