# Operator and developer runbook

By Jason Stys. Default operation is local replay. Build the UI, provision a user
with the README hidden-password command and open the loopback address. The launcher
does not request admin rights, repair Docker or bind a public interface.

## Accounts, data and recovery

`python -m console --create-user name --role viewer|operator|admin` provisions a
trusted same-workspace account. Admin currently has the same command permissions
as operator; it is not a web-based tenant management interface. Do not share roles
or passwords. No account/email tracking service is present. Database/session secrets
must not be placed in source, URLs, screenshots or public issues.

`OPS_DATABASE_URL` optionally selects a dedicated PostgreSQL database using a
`postgresql+psycopg://` connection. Supply it through your local secret manager or
trusted process environment, never an argv argument or tracked `.env`. The default
SQLite file is `.runtime/workspace.db`. Do not share one DB between replay and PX4.
Back up while the app is stopped, store backups privately and test restore into a
different path. There is no destructive "reset all" command. Session expiry/logout
revokes access; password/role administration requires trusted local maintenance.

If the service fails after dispatch, pending intent becomes unknown on next startup.
Do not resend it blindly. Inspect current simulated state; only then submit a new
intent/key if appropriate. Re-upload the plan after a new service boot. If an editor
receives a revision conflict, preserve unsaved text separately and reselect/reload.
Approval lasts ten minutes for its operator and revision. Recovery still requires
fresh telemetry; it is never guaranteed by a green button.

Stop the launcher with Ctrl-C. Stop only task-owned preview/simulator processes,
not arbitrary system services. The native adapter terminates only its own child.
Record command/audit evidence before planned maintenance. Disk history is retained
for review; archive/delete it only through an explicitly approved operator procedure.

## Actual managed PX4 on Linux

Do not modify the host's Docker installation. CI can prove integration when local
simulation tools are unavailable. On an already authorized Linux development host:

1. Create a fresh checkout of PX4 in ignored `.runtime/px4`, at exact commit
   `d6f12ad1c4f70ad3230afd7d86e971421e02fef4` (v1.17.0); initialize its pinned submodules.
2. Install the locked `requirements-sitl.lock` and the Linux build dependencies
   listed in `.github/workflows/validate.yml`. Build `make -C .runtime/px4 px4_sitl_default -j2`.
3. Create a separate empty workspace DB and provision its operator. Set
   `OPS_ADAPTER=px4` in the trusted process environment, then run `python -m console`.
4. The adapter owns the fixed binary, selects SIH quadrotor autostart 10040 and
   uses native MAVSDK on loopback. It refuses a non-Linux/mixed workspace, wrong
   source commit or ambiguous discovered system. No external radio/endpoint is accepted.
5. Wait for genuine position, home health and battery observations before approving.
   Use the same browser workflow; compare acknowledgement to actual altitude/mode.

This version supports one native aircraft. The three-aircraft UI demonstration is
replay, not evidence of multi-vehicle native command support. `native_acceptance.py`
is a separate automated, disposable run; it refuses to overwrite an earlier test DB.
The source pin follows v1.17's actual build target, not newer unpinned main docs.

## Container and private cloud reference

The image uses reviewed upstream Node/Python manifest digests, exact npm/Python locks,
non-root UID 10001 and no submitted source execution. CI proves startup with read-only
root, dropped capabilities and private tmpfs. Mount a dedicated writable `.runtime`
volume owned by UID 10001 for persistence; do not make it world-readable.

The `deploy/main.bicep` template targets an **existing private** Container Apps
environment and workload identity. It references a Key Vault PostgreSQL secret URI,
uses HTTPS origin, private ingress and `OPS_READ_ONLY=1`. Provision accounts through
authorized private administration, not the test server. Use an image digest from a
registry you control. No secret values or access credentials belong in a parameter file.
Read-only cloud means observation/replay: mission mutations are denied even for admin.

Compilation checks syntax, not Azure authorization, actual deployment, private DNS,
Key Vault RBAC or cloud cost. No Azure resources are provisioned/tested in this task.
Paid/public deployments require explicit owner approval. AKS is a possible later
profile, not an implemented/live cluster claimed by this release. Before any mutable
cloud/multiple-replica design, replace in-process authority locks with a reviewed
durable edge broker/lease design and independently test failure/reconciliation.

## Release and rollback gates

Before release: reviewed public-safe diff, current storage observation, locked
dependencies, all unit/browser/native SQL/PX4/container/source gates and CodeQL green.
After publishing: inspect exact commit/run links and fresh clone instructions.
Rollback triggers: broken auth, wrong-target authority, false-success evidence,
unbounded/misleading inputs or leaked secrets. Stop the service, preserve private
evidence, restore a reviewed prior source and independently verified stopped backup.
Never replay historical commands or force-reset away a failed validation record.
