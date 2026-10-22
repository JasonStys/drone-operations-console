# Threat model and privacy boundaries

By Jason Stys. Assets: credential hashes, session tokens, workspace history,
mission revisions, exact-target intent and operator understanding of uncertainty.
Attackers considered: unauthenticated web clients, another logged-in viewer,
cross-origin pages, malformed JSON, stale editors and accidental duplicate requests.

Controls: Argon2id (64 MiB, three iterations), no default production password,
CLI-only provisioning, random 256-bit opaque sessions stored as SHA-256 digests,
eight-hour absolute expiry, logout revocation, current-role lookup per request,
HttpOnly/SameSite Strict cookies (Secure under HTTPS), session CSRF and exact Origin
for mutations. Login budget is twelve attempts/minute per service with two concurrent
hash slots. Request bodies stop at 16 KiB; finite typed fields and fixed action names
bound native inputs. SQL values are parameter-bound. UI text is escaped by React.

No remote scripts/fonts/maps/analytics, uploads, plugin loading, arbitrary code
execution or AI API is enabled. CSP restricts scripts/styles/connections to self,
frames/form destinations are blocked; nosniff, no-referrer and restrictive browser
permissions are applied. These reduce injection/exfiltration surface; they are not
a universal ad blocker or protection against a compromised browser extension.

One approved workspace shares its fleet and recent audit with its viewers. It is
not a tenant-isolation product. Accounts and SQL history stay outside Git; the local
database is not encrypted by this app. Use OS ACLs, a private account and encrypted
disk/backups. The computer owner, DB operator or a process running as that user can
access workspace data; do not promise secrecy from those administrators.

Native mode owns one pinned PX4 binary/process and a loopback SDK link. It is not
an RF/security boundary against an administrator that replaces binaries, proxies
loopback or interferes with native callbacks. It never supplies real-flight safety,
aviation authorization, military targeting or certification. Require a trusted host,
no physical aircraft and a dedicated simulation workspace. There is no serial URL
or remote-IP knob. MAVLink signing, if separately introduced, is authentication—not
encryption. No such capability is silently claimed here.

Audit rows and hashes are local review evidence, not immutable external attestations.
Unknown effects must be inspected before a new intent. Do not run multiple service
workers against this controller: its authority/serialization assumes one process.
The private Azure reference is read-only and requires a dedicated database/identity;
turning it into public SaaS is a new architecture/security task, not a config toggle.
