# Drone Operations Console 0.3.2

Created by Jason Stys. This patch separates the frozen service and compiled UI into
`resources/runtime/0.3.2/service` and `resources/runtime/0.3.2/ui`. The native owner derives those
paths only from its validated application version. Electron-builder's supported `${version}` macro
and exact build-contract checks keep the installer destinations and loader in agreement.

The independently attempted 0.3.0-to-0.3.1 installation exposed an obsolete hashed JavaScript file
left in the former shared `resources/ui` directory. The strict complete-inventory check correctly
refused startup. This patch preserves that check: unknown files in the active version still fail,
missing active resources never fall back to old copies, and older directories are left untouched.
No user account, normal profile, old release, tag or backup is deleted or migrated.

The existing cooperative simulation, account/privacy boundary, patched Python 3.14.10 floor,
source/runtime/UI digests and completion-based Exit remain. Tests include actual locked builder
macro expansion, explicit old-layout failure/new-layout acceptance and a real packaged-app GUI
journey with preserved legacy/older-version leftovers. A copied portable package journey is not an
NSIS installation transaction; actual installer acceptance remains separately required.

See the [source-bound upgrade validation record](reports/native-resource-upgrade-2026-11-11.md).
This remains a Windows-only unsigned NSIS distribution, with no real-aircraft control or operational
flight-safety claim. Release publication occurs only after exact-current-main and native validation.
