# Drone Operations Console 0.2.0

Designed and engineered by Jason Stys.

- Animated 2D routes with ten-second projections, editable obstacle disks and 3 m clearance.
- Five deterministic scenarios: inspection, detour, cooperative rendezvous, crossing-traffic
  hold and blocked corridor. Play, pause, step, reset and synthetic JSON evidence.
- Windows x64 installer with its own desktop icon, bundled replay service and first-run
  local operator-account form. No IDE, Python, Node, cloud or AI provider is needed.
- Independent geometry/timing assertions, deliberate-fault checks, real browser journeys
  and genuine packaged-app/restart acceptance in Actions.

Download the installer and SHA256SUMS.txt. Install per user and launch **Drone Operations
Console**. Create your own local account/password; there is no default production password.
Data stays outside Git/installations under `%APPDATA%\DroneOperationsConsole`.

The new exercise is separate from the reviewed fleet mission and sends no aircraft
commands. No targeting, pursuit/evasion, interception, real flight, altitude, wind or
airworthiness capability is provided. PX4 remains a separate Linux simulation feature.

The installer is unsigned; verify its SHA-256 against the attached checksum. No OS
protection is disabled. See `docs/REHEARSAL.md` and `docs/VALIDATION.md` for details.
