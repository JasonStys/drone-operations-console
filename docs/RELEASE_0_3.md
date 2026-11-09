# Drone Operations Console 0.3.0

Jason Stys: reusable cooperative scene drafts, explicit waypoint/aircraft controls,
bounded UTF-8 JSON save/open and deterministic paused replay scrubbing. Invalid
imports, overlapping starts and starts within obstacle clearance preserve the
active scene instead of producing an unsafe initial animation. Display markers
now fit inside the model's centerline clearance rather than obscuring it.

Scene interchange is local simulation data only: no fleet plan or command API is
called. This does not add pursuit, evasion, targeting, real flight dynamics or
certified collision avoidance. Existing authenticated mission and genuine PX4
SITL test lanes remain separate and required. Reports/indexes and realistic
browser/native workflows cover the added controls and their failure paths.

Windows x64 per-user installer; existing local accounts remain outside the
installer. Close the old application and back up its local data before upgrading.
Packages are unsigned. Keep OS protections enabled and verify the published
SHA256SUMS before use.
