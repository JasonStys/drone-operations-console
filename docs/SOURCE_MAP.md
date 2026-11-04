# Source declaration map

By Jason Stys. Each source header links here to avoid stale hand-maintained line numbers.
Parameters are listed on their function's declaration line; assigned names are indexed separately.
Descriptions are in file/function/class headers. TS uses TypeScript AST; CSS/HTML have file responsibilities, not executable functions.

| File | Line | Declaration / variable |
| --- | ---: | --- |
| `console/__main__.py` | 18 | `main()` |
| `console/__main__.py` | 20 | `parser` |
| `console/__main__.py` | 25 | `args` |
| `console/__main__.py` | 28 | `store` |
| `console/api.py` | 30 | `Login(class)` |
| `console/api.py` | 33 | `model_config` |
| `console/api.py` | 34 | `username` |
| `console/api.py` | 35 | `password` |
| `console/api.py` | 38 | `PlanUpdate(class)` |
| `console/api.py` | 41 | `model_config` |
| `console/api.py` | 42 | `revision` |
| `console/api.py` | 43 | `plan` |
| `console/api.py` | 46 | `Approval(class)` |
| `console/api.py` | 49 | `model_config` |
| `console/api.py` | 50 | `revision` |
| `console/api.py` | 51 | `checks` |
| `console/api.py` | 54 | `create_app(store, adapter, origin, background)` |
| `console/api.py` | 56 | `origin` |
| `console/api.py` | 57 | `parsed` |
| `console/api.py` | 69 | `owned` |
| `console/api.py` | 72 | `store` |
| `console/api.py` | 78 | `adapter` |
| `console/api.py` | 79 | `adapter` |
| `console/api.py` | 83 | `lifespan(app)` |
| `console/api.py` | 86 | `sample_loop()` |
| `console/api.py` | 90 | `aircraft` |
| `console/api.py` | 90 | `sample` |
| `console/api.py` | 94 | `task` |
| `console/api.py` | 96 | `row` |
| `console/api.py` | 97 | `task` |
| `console/api.py` | 113 | `app` |
| `console/api.py` | 126 | `launch_token` |
| `console/api.py` | 127 | `bootstrap` |
| `console/api.py` | 131 | `boundaries(request, call_next)` |
| `console/api.py` | 140 | `result` |
| `console/api.py` | 142 | `result` |
| `console/api.py` | 147 | `result` |
| `console/api.py` | 149 | `total` |
| `console/api.py` | 150 | `parts` |
| `console/api.py` | 151 | `part` |
| `console/api.py` | 152 | `total` |
| `console/api.py` | 157 | `result` |
| `console/api.py` | 160 | `result` |
| `console/api.py` | 174 | `health()` |
| `console/api.py` | 183 | `setup_status()` |
| `console/api.py` | 185 | `db` |
| `console/api.py` | 186 | `empty` |
| `console/api.py` | 190 | `setup(body)` |
| `console/api.py` | 195 | `db` |
| `console/api.py` | 205 | `login(body, request, response)` |
| `console/api.py` | 207 | `attempts` |
| `console/api.py` | 208 | `now` |
| `console/api.py` | 215 | `user` |
| `console/api.py` | 218 | `csrf` |
| `console/api.py` | 218 | `token` |
| `console/api.py` | 231 | `me(request)` |
| `console/api.py` | 233 | `user` |
| `console/api.py` | 237 | `logout(request, response)` |
| `console/api.py` | 245 | `fleet(request)` |
| `console/api.py` | 254 | `save_plan(identifier, body, request)` |
| `console/api.py` | 256 | `user` |
| `console/api.py` | 262 | `approve(identifier, body, request)` |
| `console/api.py` | 264 | `user` |
| `console/api.py` | 270 | `command(identifier, body, request)` |
| `console/api.py` | 272 | `user` |
| `console/api.py` | 278 | `history(identifier, request)` |
| `console/api.py` | 285 | `evidence(request)` |
| `console/api.py` | 300 | `audit_records(request)` |
| `console/api.py` | 305 | `ui` |
| `console/auth.py` | 20 | `hasher` |
| `console/auth.py` | 21 | `DUMMY` |
| `console/auth.py` | 24 | `add_user(store, name, password, role)` |
| `console/auth.py` | 34 | `db` |
| `console/auth.py` | 38 | `credentials(store, name, password)` |
| `console/auth.py` | 40 | `db` |
| `console/auth.py` | 41 | `row` |
| `console/auth.py` | 49 | `identity(request)` |
| `console/auth.py` | 51 | `token` |
| `console/auth.py` | 54 | `digest` |
| `console/auth.py` | 55 | `db` |
| `console/auth.py` | 56 | `row` |
| `console/auth.py` | 70 | `operator(request)` |
| `console/auth.py` | 72 | `user` |
| `console/auth.py` | 81 | `require_csrf(request, user)` |
| `console/auth.py` | 87 | `revoke(request)` |
| `console/auth.py` | 89 | `digest` |
| `console/auth.py` | 90 | `db` |
| `console/desktop.py` | 18 | `main()` |
| `console/desktop.py` | 20 | `parser` |
| `console/desktop.py` | 24 | `args` |
| `console/desktop.py` | 36 | `server` |
| `console/desktop.py` | 47 | `watch_parent()` |
| `console/domain.py` | 13 | `HOME_LAT` |
| `console/domain.py` | 14 | `HOME_LON` |
| `console/domain.py` | 15 | `EARTH_M` |
| `console/domain.py` | 16 | `CHECKS` |
| `console/domain.py` | 19 | `Point(class)` |
| `console/domain.py` | 22 | `model_config` |
| `console/domain.py` | 23 | `east_m` |
| `console/domain.py` | 24 | `north_m` |
| `console/domain.py` | 25 | `altitude_m` |
| `console/domain.py` | 28 | `Plan(class)` |
| `console/domain.py` | 31 | `model_config` |
| `console/domain.py` | 32 | `name` |
| `console/domain.py` | 33 | `speed_m_s` |
| `console/domain.py` | 34 | `points` |
| `console/domain.py` | 37 | `bounded_distance(self)` |
| `console/domain.py` | 39 | `p` |
| `console/domain.py` | 39 | `positions` |
| `console/domain.py` | 40 | `a` |
| `console/domain.py` | 40 | `b` |
| `console/domain.py` | 40 | `distance` |
| `console/domain.py` | 46 | `Sample(class)` |
| `console/domain.py` | 49 | `model_config` |
| `console/domain.py` | 50 | `sequence` |
| `console/domain.py` | 51 | `received_at` |
| `console/domain.py` | 52 | `east_m` |
| `console/domain.py` | 53 | `north_m` |
| `console/domain.py` | 54 | `altitude_m` |
| `console/domain.py` | 55 | `battery_pct` |
| `console/domain.py` | 56 | `speed_m_s` |
| `console/domain.py` | 57 | `mode` |
| `console/domain.py` | 58 | `armed` |
| `console/domain.py` | 59 | `healthy` |
| `console/domain.py` | 62 | `Preflight(class)` |
| `console/domain.py` | 65 | `model_config` |
| `console/domain.py` | 66 | `airspace` |
| `console/domain.py` | 67 | `area_clear` |
| `console/domain.py` | 68 | `battery` |
| `console/domain.py` | 69 | `link` |
| `console/domain.py` | 70 | `simulation` |
| `console/domain.py` | 73 | `Command(class)` |
| `console/domain.py` | 76 | `model_config` |
| `console/domain.py` | 77 | `aircraft_id` |
| `console/domain.py` | 78 | `revision` |
| `console/domain.py` | 79 | `action` |
| `console/domain.py` | 82 | `safety_issues(sample, action, now)` |
| `console/domain.py` | 84 | `now` |
| `console/domain.py` | 87 | `issues` |
| `console/domain.py` | 106 | `coordinates(point)` |
| `console/domain.py` | 114 | `default_plan()` |
| `console/domain.py` | 121 | `e` |
| `console/domain.py` | 121 | `n` |
| `console/px4.py` | 20 | `PX4_COMMIT` |
| `console/px4.py` | 23 | `ManagedPx4(class)` |
| `console/px4.py` | 26 | `name` |
| `console/px4.py` | 27 | `live` |
| `console/px4.py` | 29 | `__init__(self)` |
| `console/px4.py` | 41 | `open(self, identifiers)` |
| `console/px4.py` | 47 | `root` |
| `console/px4.py` | 48 | `git` |
| `console/px4.py` | 51 | `commit` |
| `console/px4.py` | 56 | `binary` |
| `console/px4.py` | 57 | `binary_file` |
| `console/px4.py` | 59 | `work` |
| `console/px4.py` | 62 | `env` |
| `console/px4.py` | 62 | `key` |
| `console/px4.py` | 62 | `value` |
| `console/px4.py` | 106 | `key` |
| `console/px4.py` | 112 | `collect(self, key)` |
| `console/px4.py` | 114 | `value` |
| `console/px4.py` | 117 | `tick(self)` |
| `console/px4.py` | 121 | `key` |
| `console/px4.py` | 130 | `health` |
| `console/px4.py` | 130 | `position` |
| `console/px4.py` | 130 | `velocity` |
| `console/px4.py` | 135 | `battery` |
| `console/px4.py` | 157 | `execute(self, aircraft, action, plan)` |
| `console/px4.py` | 169 | `items` |
| `console/px4.py` | 170 | `point` |
| `console/px4.py` | 171 | `latitude` |
| `console/px4.py` | 171 | `longitude` |
| `console/px4.py` | 202 | `close(self)` |
| `console/px4.py` | 204 | `task` |
| `console/px4.py` | 206 | `results` |
| `console/px4.py` | 222 | `result` |
| `console/replay.py` | 14 | `Replay(class)` |
| `console/replay.py` | 17 | `name` |
| `console/replay.py` | 19 | `__init__(self)` |
| `console/replay.py` | 24 | `open(self, identifiers)` |
| `console/replay.py` | 26 | `identifier` |
| `console/replay.py` | 38 | `tick(self)` |
| `console/replay.py` | 40 | `identifier` |
| `console/replay.py` | 40 | `state` |
| `console/replay.py` | 41 | `plan` |
| `console/replay.py` | 43 | `target` |
| `console/replay.py` | 44 | `dx` |
| `console/replay.py` | 44 | `dy` |
| `console/replay.py` | 45 | `distance` |
| `console/replay.py` | 70 | `execute(self, aircraft, action, plan)` |
| `console/replay.py` | 72 | `state` |
| `console/replay.py` | 86 | `close(self)` |
| `console/service.py` | 21 | `Operations(class)` |
| `console/service.py` | 24 | `__init__(self, store, adapter)` |
| `console/service.py` | 27 | `row` |
| `console/service.py` | 32 | `aircraft(self, identifier)` |
| `console/service.py` | 34 | `vehicle` |
| `console/service.py` | 39 | `save_plan(self, actor, identifier, plan, revision)` |
| `console/service.py` | 43 | `sample` |
| `console/service.py` | 46 | `db` |
| `console/service.py` | 47 | `result` |
| `console/service.py` | 62 | `approve(self, actor, identifier, checks, revision)` |
| `console/service.py` | 68 | `db` |
| `console/service.py` | 69 | `result` |
| `console/service.py` | 84 | `command(self, actor, identifier, key, intent)` |
| `console/service.py` | 91 | `fingerprint` |
| `console/service.py` | 94 | `db` |
| `console/service.py` | 95 | `previous` |
| `console/service.py` | 106 | `vehicle` |
| `console/service.py` | 118 | `issues` |
| `console/service.py` | 123 | `db` |
| `console/service.py` | 124 | `uploads` |
| `console/service.py` | 142 | `record` |
| `console/service.py` | 155 | `db` |
| `console/service.py` | 162 | `message` |
| `console/service.py` | 162 | `status` |
| `console/service.py` | 169 | `message` |
| `console/service.py` | 169 | `status` |
| `console/service.py` | 175 | `message` |
| `console/service.py` | 175 | `status` |
| `console/service.py` | 180 | `message` |
| `console/service.py` | 180 | `status` |
| `console/service.py` | 184 | `db` |
| `console/service.py` | 193 | `snapshot(self)` |
| `console/service.py` | 195 | `result` |
| `console/service.py` | 196 | `vehicle` |
| `console/service.py` | 197 | `sample` |
| `console/store.py` | 30 | `metadata` |
| `console/store.py` | 31 | `users` |
| `console/store.py` | 38 | `sessions` |
| `console/store.py` | 46 | `vehicles` |
| `console/store.py` | 56 | `commands` |
| `console/store.py` | 72 | `audit` |
| `console/store.py` | 82 | `observations` |
| `console/store.py` | 91 | `Store(class)` |
| `console/store.py` | 94 | `__init__(self, url)` |
| `console/store.py` | 105 | `recover_pending(self)` |
| `console/store.py` | 107 | `db` |
| `console/store.py` | 118 | `seed(self, live)` |
| `console/store.py` | 120 | `names` |
| `console/store.py` | 129 | `db` |
| `console/store.py` | 130 | `identifier` |
| `console/store.py` | 130 | `name` |
| `console/store.py` | 144 | `vehicle(self, identifier)` |
| `console/store.py` | 146 | `db` |
| `console/store.py` | 147 | `row` |
| `console/store.py` | 150 | `all_vehicles(self)` |
| `console/store.py` | 152 | `db` |
| `console/store.py` | 154 | `row` |
| `console/store.py` | 157 | `event(self, actor, event, aircraft, detail)` |
| `console/store.py` | 159 | `db` |
| `console/store.py` | 166 | `records(self, table, limit)` |
| `console/store.py` | 168 | `db` |
| `console/store.py` | 169 | `order` |
| `console/store.py` | 172 | `row` |
| `console/store.py` | 175 | `observe(self, aircraft, sample)` |
| `console/store.py` | 177 | `db` |
| `console/store.py` | 181 | `keep` |
| `console/store.py` | 193 | `history(self, aircraft)` |
| `console/store.py` | 195 | `db` |
| `console/store.py` | 198 | `row` |
| `console/store.py` | 205 | `issue_session(self, user)` |
| `console/store.py` | 207 | `csrf` |
| `console/store.py` | 207 | `token` |
| `console/store.py` | 208 | `db` |
| `console/store.py` | 220 | `close(self)` |
| `tests/conftest.py` | 14 | `PASSWORD` |
| `tests/conftest.py` | 15 | `ORIGIN` |
| `tests/conftest.py` | 19 | `workspace(tmp_path)` |
| `tests/conftest.py` | 21 | `store` |
| `tests/conftest.py` | 22 | `name` |
| `tests/conftest.py` | 22 | `role` |
| `tests/conftest.py` | 29 | `client(workspace)` |
| `tests/conftest.py` | 31 | `app` |
| `tests/conftest.py` | 32 | `result` |
| `tests/conftest.py` | 36 | `sign_in(client, name)` |
| `tests/conftest.py` | 38 | `response` |
| `tests/conftest.py` | 44 | `approve(client, aircraft, revision)` |
| `tests/conftest.py` | 51 | `k` |
| `tests/conftest.py` | 57 | `command(client, action, aircraft, revision, key, target)` |
| `tests/test_api.py` | 20 | `test_private_session_and_logout(client, workspace)` |
| `tests/test_api.py` | 24 | `response` |
| `tests/test_api.py` | 25 | `cookie` |
| `tests/test_api.py` | 28 | `body` |
| `tests/test_api.py` | 29 | `row` |
| `tests/test_api.py` | 32 | `db` |
| `tests/test_api.py` | 37 | `test_bad_credentials(client, name, password)` |
| `tests/test_api.py` | 39 | `response` |
| `tests/test_api.py` | 43 | `test_rate_limit(client)` |
| `tests/test_api.py` | 55 | `test_http_boundaries(client)` |
| `tests/test_api.py` | 72 | `headers` |
| `tests/test_api.py` | 78 | `test_roles_csrf_and_expiry(client, workspace)` |
| `tests/test_api.py` | 86 | `db` |
| `tests/test_api.py` | 89 | `db` |
| `tests/test_api.py` | 94 | `test_complete_rehearsal(client)` |
| `tests/test_api.py` | 100 | `action` |
| `tests/test_api.py` | 100 | `index` |
| `tests/test_api.py` | 101 | `response` |
| `tests/test_api.py` | 103 | `audit` |
| `tests/test_api.py` | 104 | `row` |
| `tests/test_api.py` | 105 | `export` |
| `tests/test_api.py` | 110 | `test_idempotent_target_and_revision(client)` |
| `tests/test_api.py` | 114 | `one` |
| `tests/test_api.py` | 114 | `two` |
| `tests/test_api.py` | 123 | `test_edit_clears_approval_and_conflicts(client)` |
| `tests/test_api.py` | 127 | `body` |
| `tests/test_api.py` | 128 | `first` |
| `tests/test_api.py` | 137 | `test_missing_attestation_and_unsafe_aircraft(client)` |
| `tests/test_api.py` | 140 | `k` |
| `tests/test_api.py` | 140 | `missing` |
| `tests/test_api.py` | 147 | `aircraft` |
| `tests/test_api.py` | 152 | `test_expired_or_other_actor_approval(client, workspace)` |
| `tests/test_api.py` | 158 | `db` |
| `tests/test_api.py` | 176 | `test_ambiguous_and_rejected_effects(client, error, status, monkeypatch)` |
| `tests/test_api.py` | 179 | `fail()` |
| `tests/test_api.py` | 185 | `response` |
| `tests/test_api.py` | 191 | `test_sample_history_bounded(client, workspace)` |
| `tests/test_api.py` | 196 | `index` |
| `tests/test_api.py` | 198 | `values` |
| `tests/test_api.py` | 203 | `test_crash_recovery_does_not_resend(workspace, tmp_path)` |
| `tests/test_api.py` | 205 | `db` |
| `tests/test_api.py` | 221 | `restarted` |
| `tests/test_api.py` | 236 | `test_user_provisioning_validation(workspace, name, password, role)` |
| `tests/test_api.py` | 242 | `test_invalid_hash_and_origin(workspace)` |
| `tests/test_api.py` | 244 | `db` |
| `tests/test_api.py` | 247 | `origin` |
| `tests/test_api.py` | 257 | `test_replay_route_and_unknown_action()` |
| `tests/test_api.py` | 260 | `scenario()` |
| `tests/test_api.py` | 261 | `adapter` |
| `tests/test_api.py` | 265 | `_` |
| `tests/test_api.py` | 277 | `test_upload_does_not_survive_service_boot(client)` |
| `tests/test_api.py` | 284 | `old` |
| `tests/test_api.py` | 289 | `test_armed_edits_and_uploads_blocked(client)` |
| `tests/test_api.py` | 295 | `body` |
| `tests/test_api.py` | 300 | `test_cloud_read_only_is_server_enforced(client, monkeypatch)` |
| `tests/test_api.py` | 309 | `test_concurrent_duplicate_one_effect(workspace)` |
| `tests/test_api.py` | 314 | `CountedReplay(class)` |
| `tests/test_api.py` | 317 | `calls` |
| `tests/test_api.py` | 319 | `execute(self)` |
| `tests/test_api.py` | 324 | `scenario()` |
| `tests/test_api.py` | 326 | `adapter` |
| `tests/test_api.py` | 327 | `row` |
| `tests/test_api.py` | 328 | `ops` |
| `tests/test_api.py` | 330 | `intent` |
| `tests/test_api.py` | 331 | `rows` |
| `tests/test_api.py` | 332 | `_` |
| `tests/test_api.py` | 334 | `row` |
| `tests/test_api.py` | 341 | `test_failed_sampler_closes_adapter_before_raising(workspace, during_startup)` |
| `tests/test_api.py` | 344 | `FailingReplay(class)` |
| `tests/test_api.py` | 347 | `closed` |
| `tests/test_api.py` | 348 | `calls` |
| `tests/test_api.py` | 350 | `tick(self)` |
| `tests/test_api.py` | 356 | `close(self)` |
| `tests/test_api.py` | 359 | `scenario()` |
| `tests/test_api.py` | 360 | `adapter` |
| `tests/test_api.py` | 361 | `app` |
| `tests/test_desktop_boundary.py` | 12 | `test_web_registration_is_off(client)` |
| `tests/test_desktop_boundary.py` | 21 | `test_desktop_first_user_and_owned_session(monkeypatch, tmp_path)` |
| `tests/test_desktop_boundary.py` | 26 | `store` |
| `tests/test_desktop_boundary.py` | 27 | `app` |
| `tests/test_desktop_boundary.py` | 29 | `client` |
| `tests/test_desktop_boundary.py` | 69 | `session` |
| `tests/test_domain.py` | 23 | `sample()` |
| `tests/test_domain.py` | 56 | `test_point_rejects_unsafe_values(changes)` |
| `tests/test_domain.py` | 73 | `i` |
| `tests/test_domain.py` | 78 | `test_plan_bounds(changes)` |
| `tests/test_domain.py` | 84 | `test_coordinate_units()` |
| `tests/test_domain.py` | 87 | `north` |
| `tests/test_domain.py` | 88 | `east` |
| `tests/test_domain.py` | 112 | `test_safety_edges(changes, action, blocked)` |
| `tests/test_domain.py` | 118 | `test_plans_are_independent()` |
| `tests/test_domain.py` | 120 | `one` |
| `tests/test_native_conversion.py` | 17 | `ConnectedSystem(class)` |
| `tests/test_native_conversion.py` | 20 | `is_connected(self)` |
| `tests/test_native_conversion.py` | 26 | `native_adapter()` |
| `tests/test_native_conversion.py` | 28 | `adapter` |
| `tests/test_native_conversion.py` | 46 | `test_native_v4_preserves_percentage_points(native_adapter, percentage)` |
| `tests/test_native_conversion.py` | 54 | `test_native_invalid_percentage_stays_unknown(native_adapter, invalid)` |
| `tests/test_native_conversion.py` | 61 | `test_native_subscription_failure_releases_resources()` |
| `tests/test_native_conversion.py` | 63 | `released` |
| `tests/test_native_conversion.py` | 65 | `scenario()` |
| `tests/test_native_conversion.py` | 66 | `adapter` |
| `tests/test_native_conversion.py` | 69 | `fail()` |
| `tools/build_desktop.py` | 8 | `main()` |
| `tools/build_desktop.py` | 10 | `root` |
| `tools/check_repo.py` | 15 | `main()` |
| `tools/check_repo.py` | 17 | `name` |
| `tools/check_repo.py` | 32 | `path` |
| `tools/check_repo.py` | 35 | `content` |
| `tools/check_repo.py` | 44 | `action` |
| `tools/check_repo.py` | 47 | `scripts` |
| `tools/check_repo.py` | 48 | `styles` |
| `tools/check_repo.py` | 50 | `js` |
| `tools/check_repo.py` | 50 | `p` |
| `tools/check_repo.py` | 51 | `css` |
| `tools/check_repo.py` | 51 | `p` |
| `tools/docs_index.py` | 14 | `ROOT` |
| `tools/docs_index.py` | 15 | `EXCLUDED` |
| `tools/docs_index.py` | 30 | `FILE_DESCRIPTIONS` |
| `tools/docs_index.py` | 63 | `files()` |
| `tools/docs_index.py` | 65 | `paths` |
| `tools/docs_index.py` | 66 | `directory` |
| `tools/docs_index.py` | 66 | `names` |
| `tools/docs_index.py` | 66 | `subdirectories` |
| `tools/docs_index.py` | 67 | `name` |
| `tools/docs_index.py` | 68 | `name` |
| `tools/docs_index.py` | 69 | `path` |
| `tools/docs_index.py` | 78 | `render()` |
| `tools/docs_index.py` | 80 | `catalog` |
| `tools/docs_index.py` | 88 | `source_map` |
| `tools/docs_index.py` | 98 | `path` |
| `tools/docs_index.py` | 99 | `relative` |
| `tools/docs_index.py` | 100 | `text` |
| `tools/docs_index.py` | 101 | `description` |
| `tools/docs_index.py` | 102 | `line` |
| `tools/docs_index.py` | 109 | `tree` |
| `tools/docs_index.py` | 110 | `records` |
| `tools/docs_index.py` | 111 | `node` |
| `tools/docs_index.py` | 113 | `params` |
| `tools/docs_index.py` | 114 | `arg` |
| `tools/docs_index.py` | 121 | `line` |
| `tools/docs_index.py` | 121 | `name` |
| `tools/docs_index.py` | 123 | `node_binary` |
| `tools/docs_index.py` | 126 | `node` |
| `tools/docs_index.py` | 136 | `main()` |
| `tools/docs_index.py` | 138 | `outputs` |
| `tools/docs_index.py` | 139 | `content` |
| `tools/docs_index.py` | 139 | `name` |
| `tools/docs_index.py` | 140 | `path` |
| `tools/native_acceptance.py` | 22 | `ORIGIN` |
| `tools/native_acceptance.py` | 25 | `wait_state(client, predicate, seconds)` |
| `tools/native_acceptance.py` | 27 | `deadline` |
| `tools/native_acceptance.py` | 28 | `last` |
| `tools/native_acceptance.py` | 30 | `fleet` |
| `tools/native_acceptance.py` | 31 | `last` |
| `tools/native_acceptance.py` | 38 | `main()` |
| `tools/native_acceptance.py` | 40 | `database` |
| `tools/native_acceptance.py` | 45 | `store` |
| `tools/native_acceptance.py` | 47 | `adapter` |
| `tools/native_acceptance.py` | 48 | `app` |
| `tools/native_acceptance.py` | 49 | `records` |
| `tools/native_acceptance.py` | 56 | `client` |
| `tools/native_acceptance.py` | 57 | `response` |
| `tools/native_acceptance.py` | 63 | `ready` |
| `tools/native_acceptance.py` | 69 | `revision` |
| `tools/native_acceptance.py` | 70 | `approval` |
| `tools/native_acceptance.py` | 76 | `key` |
| `tools/native_acceptance.py` | 82 | `send(action, key)` |
| `tools/native_acceptance.py` | 83 | `result` |
| `tools/native_acceptance.py` | 89 | `value` |
| `tools/native_acceptance.py` | 96 | `upload` |
| `tools/native_acceptance.py` | 97 | `duplicate` |
| `tools/native_acceptance.py` | 99 | `wrong` |
| `tools/native_acceptance.py` | 109 | `airborne` |
| `tools/native_acceptance.py` | 121 | `held` |
| `tools/native_acceptance.py` | 128 | `grounded` |
| `tools/native_acceptance.py` | 141 | `stale` |
| `tools/native_acceptance.py` | 148 | `evidence` |
| `tools/native_acceptance.py` | 150 | `report` |
| `tools/postgres_acceptance.py` | 21 | `main()` |
| `tools/postgres_acceptance.py` | 23 | `url` |
| `tools/postgres_acceptance.py` | 26 | `store` |
| `tools/postgres_acceptance.py` | 28 | `adapter` |
| `tools/postgres_acceptance.py` | 29 | `row` |
| `tools/postgres_acceptance.py` | 30 | `operations` |
| `tools/postgres_acceptance.py` | 32 | `intent` |
| `tools/postgres_acceptance.py` | 33 | `rows` |
| `tools/postgres_acceptance.py` | 34 | `_` |
| `tools/postgres_acceptance.py` | 36 | `row` |
| `tools/postgres_acceptance.py` | 37 | `row` |
| `tools/postgres_acceptance.py` | 38 | `db` |
| `tools/postgres_acceptance.py` | 41 | `reopened` |
| `tools/serve_test.py` | 20 | `main()` |
| `tools/serve_test.py` | 23 | `folder` |
| `tools/serve_test.py` | 24 | `store` |
| `tools/serve_test.py` | 25 | `name` |
| `tools/serve_test.py` | 25 | `role` |
| `tools/serve_test.py` | 28 | `port` |
| `ui/src/RehearsalPanel.tsx` | 14 | `svg` |
| `ui/src/RehearsalPanel.tsx` | 14 | `point` |
| `ui/src/RehearsalPanel.tsx` | 19 | `Rehearsal` |
| `ui/src/RehearsalPanel.tsx` | 20 | `[preset, setPreset]` |
| `ui/src/RehearsalPanel.tsx` | 21 | `[obstacles, setObstacles]` |
| `ui/src/RehearsalPanel.tsx` | 24 | `[time, setTime]` |
| `ui/src/RehearsalPanel.tsx` | 25 | `[running, setRunning]` |
| `ui/src/RehearsalPanel.tsx` | 26 | `[error, setError]` |
| `ui/src/RehearsalPanel.tsx` | 27 | `[showFuture, setShowFuture]` |
| `ui/src/RehearsalPanel.tsx` | 28 | `exercise` |
| `ui/src/RehearsalPanel.tsx` | 32 | `frame` |
| `ui/src/RehearsalPanel.tsx` | 35 | `handle` |
| `ui/src/RehearsalPanel.tsx` | 36 | `previous` |
| `ui/src/RehearsalPanel.tsx` | 37 | `animate` |
| `ui/src/RehearsalPanel.tsx` | 37 | `stamp` |
| `ui/src/RehearsalPanel.tsx` | 39 | `delta` |
| `ui/src/RehearsalPanel.tsx` | 40 | `value` |
| `ui/src/RehearsalPanel.tsx` | 46 | `visibility` |
| `ui/src/RehearsalPanel.tsx` | 60 | `reset` |
| `ui/src/RehearsalPanel.tsx` | 60 | `next` |
| `ui/src/RehearsalPanel.tsx` | 67 | `addObstacle` |
| `ui/src/RehearsalPanel.tsx` | 67 | `event` |
| `ui/src/RehearsalPanel.tsx` | 69 | `data` |
| `ui/src/RehearsalPanel.tsx` | 70 | `obstacle` |
| `ui/src/RehearsalPanel.tsx` | 78 | `error` |
| `ui/src/RehearsalPanel.tsx` | 83 | `download` |
| `ui/src/RehearsalPanel.tsx` | 84 | `evidence` |
| `ui/src/RehearsalPanel.tsx` | 91 | `_` |
| `ui/src/RehearsalPanel.tsx` | 91 | `t` |
| `ui/src/RehearsalPanel.tsx` | 101 | `url` |
| `ui/src/RehearsalPanel.tsx` | 106 | `link` |
| `ui/src/RehearsalPanel.tsx` | 156 | `o` |
| `ui/src/RehearsalPanel.tsx` | 156 | `i` |
| `ui/src/RehearsalPanel.tsx` | 180 | `path` |
| `ui/src/RehearsalPanel.tsx` | 180 | `i` |
| `ui/src/RehearsalPanel.tsx` | 189 | `a` |
| `ui/src/RehearsalPanel.tsx` | 189 | `i` |
| `ui/src/RehearsalPanel.tsx` | 232 | `value` |
| `ui/src/RehearsalPanel.tsx` | 244 | `e` |
| `ui/src/RehearsalPanel.tsx` | 259 | `a` |
| `ui/src/RehearsalPanel.tsx` | 287 | `e` |
| `ui/src/RehearsalPanel.tsx` | 349 | `o` |
| `ui/src/RehearsalPanel.tsx` | 349 | `i` |
| `ui/src/RehearsalPanel.tsx` | 354 | `_` |
| `ui/src/RehearsalPanel.tsx` | 354 | `j` |
| `ui/src/geometry.ts` | 5 | `project` |
| `ui/src/geometry.ts` | 5 | `east` |
| `ui/src/geometry.ts` | 5 | `north` |
| `ui/src/geometry.ts` | 12 | `routeLength` |
| `ui/src/geometry.ts` | 12 | `points` |
| `ui/src/geometry.ts` | 13 | `total` |
| `ui/src/geometry.ts` | 14 | `east` |
| `ui/src/geometry.ts` | 15 | `north` |
| `ui/src/geometry.ts` | 16 | `point` |
| `ui/src/geometry.ts` | 27 | `freshness` |
| `ui/src/geometry.ts` | 28 | `received` |
| `ui/src/geometry.ts` | 29 | `now` |
| `ui/src/geometry.ts` | 33 | `age` |
| `ui/src/main.tsx` | 55 | `checks` |
| `ui/src/main.tsx` | 64 | `request` |
| `ui/src/main.tsx` | 65 | `url` |
| `ui/src/main.tsx` | 66 | `method` |
| `ui/src/main.tsx` | 67 | `body` |
| `ui/src/main.tsx` | 68 | `csrf` |
| `ui/src/main.tsx` | 69 | `key` |
| `ui/src/main.tsx` | 71 | `response` |
| `ui/src/main.tsx` | 81 | `value` |
| `ui/src/main.tsx` | 92 | `App` |
| `ui/src/main.tsx` | 93 | `[user, setUser]` |
| `ui/src/main.tsx` | 94 | `[setupRequired, setSetupRequired]` |
| `ui/src/main.tsx` | 95 | `[fleet, setFleet]` |
| `ui/src/main.tsx` | 96 | `[selected, setSelected]` |
| `ui/src/main.tsx` | 97 | `[draft, setDraft]` |
| `ui/src/main.tsx` | 98 | `[draftRevision, setDraftRevision]` |
| `ui/src/main.tsx` | 99 | `[attest, setAttest]` |
| `ui/src/main.tsx` | 100 | `[notice, setNotice]` |
| `ui/src/main.tsx` | 101 | `[busy, setBusy]` |
| `ui/src/main.tsx` | 102 | `[intent, setIntent]` |
| `ui/src/main.tsx` | 107 | `[history, setHistory]` |
| `ui/src/main.tsx` | 108 | `[cursor, setCursor]` |
| `ui/src/main.tsx` | 109 | `[audit, setAudit]` |
| `ui/src/main.tsx` | 110 | `[help, setHelp]` |
| `ui/src/main.tsx` | 111 | `[now, setNow]` |
| `ui/src/main.tsx` | 112 | `dialogRef` |
| `ui/src/main.tsx` | 113 | `aircraft` |
| `ui/src/main.tsx` | 113 | `item` |
| `ui/src/main.tsx` | 114 | `writable` |
| `ui/src/main.tsx` | 116 | `draftMatches` |
| `ui/src/main.tsx` | 124 | `timer` |
| `ui/src/main.tsx` | 128 | `dialog` |
| `ui/src/main.tsx` | 135 | `refresh` |
| `ui/src/main.tsx` | 136 | `result` |
| `ui/src/main.tsx` | 143 | `result` |
| `ui/src/main.tsx` | 151 | `active` |
| `ui/src/main.tsx` | 152 | `running` |
| `ui/src/main.tsx` | 153 | `poll` |
| `ui/src/main.tsx` | 157 | `value` |
| `ui/src/main.tsx` | 169 | `timer` |
| `ui/src/main.tsx` | 178 | `item` |
| `ui/src/main.tsx` | 189 | `perform` |
| `ui/src/main.tsx` | 190 | `operation` |
| `ui/src/main.tsx` | 191 | `success` |
| `ui/src/main.tsx` | 192 | `reload` |
| `ui/src/main.tsx` | 200 | `error` |
| `ui/src/main.tsx` | 211 | `login` |
| `ui/src/main.tsx` | 211 | `event` |
| `ui/src/main.tsx` | 213 | `data` |
| `ui/src/main.tsx` | 230 | `error` |
| `ui/src/main.tsx` | 237 | `selectAircraft` |
| `ui/src/main.tsx` | 237 | `id` |
| `ui/src/main.tsx` | 247 | `shown` |
| `ui/src/main.tsx` | 248 | `pointPath` |
| `ui/src/main.tsx` | 250 | `p` |
| `ui/src/main.tsx` | 362 | `event` |
| `ui/src/main.tsx` | 405 | `item` |
| `ui/src/main.tsx` | 457 | `p` |
| `ui/src/main.tsx` | 457 | `i` |
| `ui/src/main.tsx` | 458 | `[x, y]` |
| `ui/src/main.tsx` | 519 | `e` |
| `ui/src/main.tsx` | 533 | `e` |
| `ui/src/main.tsx` | 543 | `p` |
| `ui/src/main.tsx` | 543 | `i` |
| `ui/src/main.tsx` | 546 | `key` |
| `ui/src/main.tsx` | 559 | `e` |
| `ui/src/main.tsx` | 562 | `v` |
| `ui/src/main.tsx` | 562 | `j` |
| `ui/src/main.tsx` | 622 | `[key, label]` |
| `ui/src/main.tsx` | 627 | `e` |
| `ui/src/main.tsx` | 640 | `key` |
| `ui/src/main.tsx` | 662 | `action` |
| `ui/src/main.tsx` | 687 | `issue` |
| `ui/src/main.tsx` | 709 | `value` |
| `ui/src/main.tsx` | 747 | `e` |
| `ui/src/main.tsx` | 763 | `item` |
| `ui/src/main.tsx` | 782 | `event` |
| `ui/src/main.tsx` | 814 | `captured` |
| `ui/src/rehearsal.test.ts` | 18 | `assertClear` |
| `ui/src/rehearsal.test.ts` | 19 | `path` |
| `ui/src/rehearsal.test.ts` | 20 | `obstacles` |
| `ui/src/rehearsal.test.ts` | 22 | `i` |
| `ui/src/rehearsal.test.ts` | 23 | `fraction` |
| `ui/src/rehearsal.test.ts` | 24 | `a` |
| `ui/src/rehearsal.test.ts` | 25 | `b` |
| `ui/src/rehearsal.test.ts` | 26 | `f` |
| `ui/src/rehearsal.test.ts` | 27 | `x` |
| `ui/src/rehearsal.test.ts` | 28 | `y` |
| `ui/src/rehearsal.test.ts` | 31 | `disk` |
| `ui/src/rehearsal.test.ts` | 41 | `a` |
| `ui/src/rehearsal.test.ts` | 42 | `b` |
| `ui/src/rehearsal.test.ts` | 53 | `path` |
| `ui/src/rehearsal.test.ts` | 61 | `[speed, time]` |
| `ui/src/rehearsal.test.ts` | 74 | `start` |
| `ui/src/rehearsal.test.ts` | 75 | `goal` |
| `ui/src/rehearsal.test.ts` | 81 | `offset` |
| `ui/src/rehearsal.test.ts` | 82 | `start` |
| `ui/src/rehearsal.test.ts` | 83 | `goal` |
| `ui/src/rehearsal.test.ts` | 84 | `obstacles` |
| `ui/src/rehearsal.test.ts` | 88 | `path` |
| `ui/src/rehearsal.test.ts` | 96 | `a` |
| `ui/src/rehearsal.test.ts` | 97 | `b` |
| `ui/src/rehearsal.test.ts` | 101 | `bad` |
| `ui/src/rehearsal.test.ts` | 107 | `radius` |
| `ui/src/rehearsal.test.ts` | 121 | `exercise` |
| `ui/src/rehearsal.test.ts` | 123 | `prepared` |
| `ui/src/rehearsal.test.ts` | 125 | `frame` |
| `ui/src/rehearsal.test.ts` | 133 | `exercise` |
| `ui/src/rehearsal.test.ts` | 135 | `frame` |
| `ui/src/rehearsal.test.ts` | 150 | `exercise` |
| `ui/src/rehearsal.test.ts` | 152 | `result` |
| `ui/src/rehearsal.test.ts` | 160 | `exercise` |
| `ui/src/rehearsal.test.ts` | 163 | `stopped` |
| `ui/src/rehearsal.test.ts` | 168 | `aircraft` |
| `ui/src/rehearsal.test.ts` | 170 | `p` |
| `ui/src/rehearsal.test.ts` | 172 | `t` |
| `ui/src/rehearsal.test.ts` | 173 | `f` |
| `ui/src/rehearsal.test.ts` | 180 | `blocked` |
| `ui/src/rehearsal.test.ts` | 181 | `frame` |
| `ui/src/rehearsal.test.ts` | 188 | `ordinary` |
| `ui/src/rehearsal.test.ts` | 189 | `time` |
| `ui/src/rehearsal.ts` | 18 | `BOUND` |
| `ui/src/rehearsal.ts` | 19 | `CLEARANCE` |
| `ui/src/rehearsal.ts` | 20 | `SEPARATION` |
| `ui/src/rehearsal.ts` | 21 | `CELL` |
| `ui/src/rehearsal.ts` | 22 | `WIDTH` |
| `ui/src/rehearsal.ts` | 23 | `NODES` |
| `ui/src/rehearsal.ts` | 24 | `EPSILON` |
| `ui/src/rehearsal.ts` | 27 | `distance` |
| `ui/src/rehearsal.ts` | 27 | `a` |
| `ui/src/rehearsal.ts` | 27 | `b` |
| `ui/src/rehearsal.ts` | 32 | `segmentDistance` |
| `ui/src/rehearsal.ts` | 32 | `p` |
| `ui/src/rehearsal.ts` | 32 | `a` |
| `ui/src/rehearsal.ts` | 32 | `b` |
| `ui/src/rehearsal.ts` | 33 | `dx` |
| `ui/src/rehearsal.ts` | 34 | `dy` |
| `ui/src/rehearsal.ts` | 35 | `squared` |
| `ui/src/rehearsal.ts` | 36 | `t` |
| `ui/src/rehearsal.ts` | 50 | `clearSegment` |
| `ui/src/rehearsal.ts` | 50 | `a` |
| `ui/src/rehearsal.ts` | 50 | `b` |
| `ui/src/rehearsal.ts` | 50 | `obstacles` |
| `ui/src/rehearsal.ts` | 52 | `o` |
| `ui/src/rehearsal.ts` | 57 | `validPoint` |
| `ui/src/rehearsal.ts` | 57 | `p` |
| `ui/src/rehearsal.ts` | 67 | `MinHeap` |
| `ui/src/rehearsal.ts` | 70 | `id` |
| `ui/src/rehearsal.ts` | 70 | `score` |
| `ui/src/rehearsal.ts` | 71 | `entry` |
| `ui/src/rehearsal.ts` | 72 | `index` |
| `ui/src/rehearsal.ts` | 75 | `parent` |
| `ui/src/rehearsal.ts` | 84 | `first` |
| `ui/src/rehearsal.ts` | 85 | `last` |
| `ui/src/rehearsal.ts` | 87 | `index` |
| `ui/src/rehearsal.ts` | 89 | `child` |
| `ui/src/rehearsal.ts` | 108 | `planPath` |
| `ui/src/rehearsal.ts` | 109 | `start` |
| `ui/src/rehearsal.ts` | 110 | `goal` |
| `ui/src/rehearsal.ts` | 111 | `obstacles` |
| `ui/src/rehearsal.ts` | 118 | `o` |
| `ui/src/rehearsal.ts` | 134 | `point` |
| `ui/src/rehearsal.ts` | 134 | `id` |
| `ui/src/rehearsal.ts` | 143 | `cost` |
| `ui/src/rehearsal.ts` | 144 | `previous` |
| `ui/src/rehearsal.ts` | 145 | `closed` |
| `ui/src/rehearsal.ts` | 146 | `heap` |
| `ui/src/rehearsal.ts` | 147 | `startLinks` |
| `ui/src/rehearsal.ts` | 148 | `id` |
| `ui/src/rehearsal.ts` | 153 | `current` |
| `ui/src/rehearsal.ts` | 157 | `result` |
| `ui/src/rehearsal.ts` | 158 | `id` |
| `ui/src/rehearsal.ts` | 162 | `here` |
| `ui/src/rehearsal.ts` | 163 | `neighbors` |
| `ui/src/rehearsal.ts` | 165 | `x` |
| `ui/src/rehearsal.ts` | 166 | `y` |
| `ui/src/rehearsal.ts` | 167 | `dy` |
| `ui/src/rehearsal.ts` | 168 | `dx` |
| `ui/src/rehearsal.ts` | 179 | `next` |
| `ui/src/rehearsal.ts` | 181 | `there` |
| `ui/src/rehearsal.ts` | 182 | `improved` |
| `ui/src/rehearsal.ts` | 194 | `pathLength` |
| `ui/src/rehearsal.ts` | 194 | `points` |
| `ui/src/rehearsal.ts` | 198 | `total` |
| `ui/src/rehearsal.ts` | 198 | `point` |
| `ui/src/rehearsal.ts` | 198 | `index` |
| `ui/src/rehearsal.ts` | 204 | `positionAt` |
| `ui/src/rehearsal.ts` | 204 | `points` |
| `ui/src/rehearsal.ts` | 204 | `speed` |
| `ui/src/rehearsal.ts` | 204 | `time` |
| `ui/src/rehearsal.ts` | 215 | `remaining` |
| `ui/src/rehearsal.ts` | 216 | `index` |
| `ui/src/rehearsal.ts` | 217 | `a` |
| `ui/src/rehearsal.ts` | 218 | `b` |
| `ui/src/rehearsal.ts` | 219 | `length` |
| `ui/src/rehearsal.ts` | 221 | `t` |
| `ui/src/rehearsal.ts` | 233 | `sweptSeparation` |
| `ui/src/rehearsal.ts` | 233 | `a0` |
| `ui/src/rehearsal.ts` | 233 | `a1` |
| `ui/src/rehearsal.ts` | 233 | `b0` |
| `ui/src/rehearsal.ts` | 233 | `b1` |
| `ui/src/rehearsal.ts` | 245 | `prepare` |
| `ui/src/rehearsal.ts` | 245 | `exercise` |
| `ui/src/rehearsal.ts` | 250 | `route` |
| `ui/src/rehearsal.ts` | 259 | `paths` |
| `ui/src/rehearsal.ts` | 259 | `route` |
| `ui/src/rehearsal.ts` | 260 | `result` |
| `ui/src/rehearsal.ts` | 261 | `i` |
| `ui/src/rehearsal.ts` | 262 | `leg` |
| `ui/src/rehearsal.ts` | 272 | `blocked` |
| `ui/src/rehearsal.ts` | 272 | `path` |
| `ui/src/rehearsal.ts` | 273 | `plannedDuration` |
| `ui/src/rehearsal.ts` | 274 | `path` |
| `ui/src/rehearsal.ts` | 274 | `i` |
| `ui/src/rehearsal.ts` | 278 | `duration` |
| `ui/src/rehearsal.ts` | 279 | `stop` |
| `ui/src/rehearsal.ts` | 282 | `step` |
| `ui/src/rehearsal.ts` | 283 | `t` |
| `ui/src/rehearsal.ts` | 284 | `positions` |
| `ui/src/rehearsal.ts` | 284 | `path` |
| `ui/src/rehearsal.ts` | 284 | `i` |
| `ui/src/rehearsal.ts` | 287 | `before` |
| `ui/src/rehearsal.ts` | 287 | `path` |
| `ui/src/rehearsal.ts` | 287 | `i` |
| `ui/src/rehearsal.ts` | 290 | `conflict` |
| `ui/src/rehearsal.ts` | 291 | `a` |
| `ui/src/rehearsal.ts` | 292 | `b` |
| `ui/src/rehearsal.ts` | 319 | `frameAt` |
| `ui/src/rehearsal.ts` | 319 | `exercise` |
| `ui/src/rehearsal.ts` | 319 | `requested` |
| `ui/src/rehearsal.ts` | 322 | `time` |
| `ui/src/rehearsal.ts` | 323 | `phase` |
| `ui/src/rehearsal.ts` | 332 | `aircraft` |
| `ui/src/rehearsal.ts` | 332 | `route` |
| `ui/src/rehearsal.ts` | 332 | `index` |
| `ui/src/rehearsal.ts` | 333 | `path` |
| `ui/src/rehearsal.ts` | 334 | `point` |
| `ui/src/rehearsal.ts` | 335 | `projected` |
| `ui/src/rehearsal.ts` | 336 | `_` |
| `ui/src/rehearsal.ts` | 336 | `i` |
| `ui/src/rehearsal.ts` | 359 | `scenario` |
| `ui/src/rehearsal.ts` | 359 | `name` |
| `ui/src/rehearsal.ts` | 360 | `route` |
| `ui/src/rehearsal.ts` | 360 | `id` |
| `ui/src/rehearsal.ts` | 360 | `points` |
| `ui/src/rehearsal.ts` | 364 | `[east, north]` |
| `ui/src/rehearsal.ts` | 425 | `north` |
| `tests/browser/console.spec.ts` | 6 | `login` |
| `tests/browser/console.spec.ts` | 6 | `page` |
| `tests/browser/console.spec.ts` | 6 | `username` |
| `tests/browser/console.spec.ts` | 18 | `{ page, }` |
| `tests/browser/console.spec.ts` | 28 | `label` |
| `tests/browser/console.spec.ts` | 38 | `action` |
| `tests/browser/console.spec.ts` | 45 | `dialog` |
| `tests/browser/console.spec.ts` | 59 | `[download]` |
| `tests/browser/console.spec.ts` | 66 | `{ page, }` |
| `tests/browser/console.spec.ts` | 78 | `response` |
| `tests/browser/console.spec.ts` | 88 | `{ page, }` |
| `tests/browser/console.spec.ts` | 107 | `body` |
| `tests/browser/console.spec.ts` | 117 | `{ page, }` |
| `tests/browser/console.spec.ts` | 131 | `before` |
| `tests/browser/console.spec.ts` | 137 | `after` |
| `tests/browser/rehearsal.spec.ts` | 4 | `{ page, }` |
| `tests/browser/rehearsal.spec.ts` | 13 | `exercise` |
| `tests/browser/rehearsal.spec.ts` | 17 | `commandsBefore` |
| `tests/browser/rehearsal.spec.ts` | 21 | `marker` |
| `tests/browser/rehearsal.spec.ts` | 22 | `initial` |
| `tests/browser/rehearsal.spec.ts` | 30 | `stepped` |
| `tests/browser/rehearsal.spec.ts` | 36 | `paused` |
| `tests/browser/rehearsal.spec.ts` | 56 | `i` |
| `tests/browser/rehearsal.spec.ts` | 64 | `downloaded` |
| `tests/browser/rehearsal.spec.ts` | 68 | `download` |
| `tests/browser/rehearsal.spec.ts` | 69 | `stream` |
| `tests/browser/rehearsal.spec.ts` | 70 | `chunks` |
| `tests/browser/rehearsal.spec.ts` | 71 | `chunk` |
| `tests/browser/rehearsal.spec.ts` | 72 | `evidence` |
| `tests/browser/rehearsal.spec.ts` | 89 | `body` |
| `tests/desktop/app.spec.ts` | 8 | `data` |
| `tests/desktop/app.spec.ts` | 9 | `options` |
| `tests/desktop/app.spec.ts` | 15 | `app` |
| `tests/desktop/app.spec.ts` | 17 | `page` |
| `tests/desktop/app.spec.ts` | 29 | `exercise` |
| `tests/desktop/app.spec.ts` | 34 | `marker` |
| `tests/desktop/app.spec.ts` | 35 | `before` |
| `tests/desktop/app.spec.ts` | 49 | `security` |
| `tests/desktop/app.spec.ts` | 49 | `{ BrowserWindow }` |
| `tests/desktop/app.spec.ts` | 50 | `preferences` |
| `desktop/main.cjs` | 2 | `{ app, BrowserWindow, dialog, session, Menu }` |
| `desktop/main.cjs` | 3 | `{ spawn }` |
| `desktop/main.cjs` | 4 | `{ randomBytes }` |
| `desktop/main.cjs` | 5 | `{ join }` |
| `desktop/main.cjs` | 6 | `fs` |
| `desktop/main.cjs` | 7 | `net` |
| `desktop/main.cjs` | 8 | `child` |
| `desktop/main.cjs` | 9 | `closing` |
| `desktop/main.cjs` | 12 | `freePort` |
| `desktop/main.cjs` | 13 | `socket` |
| `desktop/main.cjs` | 14 | `resolve` |
| `desktop/main.cjs` | 14 | `reject` |
| `desktop/main.cjs` | 17 | `port` |
| `desktop/main.cjs` | 18 | `resolve` |
| `desktop/main.cjs` | 23 | `launch` |
| `desktop/main.cjs` | 24 | `port` |
| `desktop/main.cjs` | 25 | `origin` |
| `desktop/main.cjs` | 26 | `token` |
| `desktop/main.cjs` | 27 | `nonce` |
| `desktop/main.cjs` | 28 | `resources` |
| `desktop/main.cjs` | 31 | `folder` |
| `desktop/main.cjs` | 33 | `log` |
| `desktop/main.cjs` | 52 | `failed` |
| `desktop/main.cjs` | 60 | `ready` |
| `desktop/main.cjs` | 61 | `attempt` |
| `desktop/main.cjs` | 63 | `result` |
| `desktop/main.cjs` | 66 | `data` |
| `desktop/main.cjs` | 72 | `resolve` |
| `desktop/main.cjs` | 78 | `isolated` |
| `desktop/main.cjs` | 81 | `_contents` |
| `desktop/main.cjs` | 81 | `_permission` |
| `desktop/main.cjs` | 81 | `callback` |
| `desktop/main.cjs` | 85 | `details` |
| `desktop/main.cjs` | 85 | `callback` |
| `desktop/main.cjs` | 86 | `allowed` |
| `desktop/main.cjs` | 94 | `details` |
| `desktop/main.cjs` | 94 | `callback` |
| `desktop/main.cjs` | 99 | `window` |
| `desktop/main.cjs` | 114 | `event` |
| `desktop/main.cjs` | 114 | `url` |
| `desktop/main.cjs` | 142 | `window` |
| `desktop/main.cjs` | 151 | `error` |
| `desktop/main.cjs` | 157 | `event` |
| `desktop/main.cjs` | 162 | `timer` |
| `tools/mutation_smoke.mjs` | 4 | `file` |
| `tools/mutation_smoke.mjs` | 5 | `original` |
| `tools/mutation_smoke.mjs` | 6 | `mutations` |
| `tools/mutation_smoke.mjs` | 20 | `suite` |
| `tools/mutation_smoke.mjs` | 27 | `baseline` |
| `tools/mutation_smoke.mjs` | 35 | `[name, before, after]` |
| `tools/mutation_smoke.mjs` | 39 | `result` |
| `tools/source_index.mjs` | 7 | `collect` |
| `tools/source_index.mjs` | 7 | `root` |
| `tools/source_index.mjs` | 8 | `a` |
| `tools/source_index.mjs` | 8 | `b` |
| `tools/source_index.mjs` | 8 | `entry` |
| `tools/source_index.mjs` | 9 | `name` |
| `tools/source_index.mjs` | 14 | `file` |
| `tools/source_index.mjs` | 14 | `name` |
| `tools/source_index.mjs` | 15 | `source` |
| `tools/source_index.mjs` | 16 | `records` |
| `tools/source_index.mjs` | 17 | `visit` |
| `tools/source_index.mjs` | 17 | `node` |
| `tools/source_index.mjs` | 20 | `name` |
| `tools/source_index.mjs` | 21 | `line` |
| `tools/source_index.mjs` | 28 | `row` |
| `playwright.config.ts` | 3 | `browsers` |
| `playwright.config.ts` | 21 | `browser` |
| `playwright.config.ts` | 28 | `browser` |
