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
| `console/api.py` | 29 | `Login(class)` |
| `console/api.py` | 32 | `model_config` |
| `console/api.py` | 33 | `username` |
| `console/api.py` | 34 | `password` |
| `console/api.py` | 37 | `PlanUpdate(class)` |
| `console/api.py` | 40 | `model_config` |
| `console/api.py` | 41 | `revision` |
| `console/api.py` | 42 | `plan` |
| `console/api.py` | 45 | `Approval(class)` |
| `console/api.py` | 48 | `model_config` |
| `console/api.py` | 49 | `revision` |
| `console/api.py` | 50 | `checks` |
| `console/api.py` | 53 | `create_app(store, adapter, origin, background)` |
| `console/api.py` | 55 | `origin` |
| `console/api.py` | 56 | `parsed` |
| `console/api.py` | 68 | `owned` |
| `console/api.py` | 71 | `store` |
| `console/api.py` | 77 | `adapter` |
| `console/api.py` | 78 | `adapter` |
| `console/api.py` | 82 | `lifespan(app)` |
| `console/api.py` | 84 | `row` |
| `console/api.py` | 86 | `sample_loop()` |
| `console/api.py` | 90 | `aircraft` |
| `console/api.py` | 90 | `sample` |
| `console/api.py` | 94 | `task` |
| `console/api.py` | 106 | `app` |
| `console/api.py` | 121 | `boundaries(request, call_next)` |
| `console/api.py` | 124 | `result` |
| `console/api.py` | 129 | `result` |
| `console/api.py` | 131 | `total` |
| `console/api.py` | 132 | `parts` |
| `console/api.py` | 133 | `part` |
| `console/api.py` | 134 | `total` |
| `console/api.py` | 139 | `result` |
| `console/api.py` | 142 | `result` |
| `console/api.py` | 156 | `health()` |
| `console/api.py` | 161 | `login(body, request, response)` |
| `console/api.py` | 163 | `attempts` |
| `console/api.py` | 164 | `now` |
| `console/api.py` | 171 | `user` |
| `console/api.py` | 174 | `csrf` |
| `console/api.py` | 174 | `token` |
| `console/api.py` | 187 | `me(request)` |
| `console/api.py` | 189 | `user` |
| `console/api.py` | 193 | `logout(request, response)` |
| `console/api.py` | 201 | `fleet(request)` |
| `console/api.py` | 210 | `save_plan(identifier, body, request)` |
| `console/api.py` | 212 | `user` |
| `console/api.py` | 218 | `approve(identifier, body, request)` |
| `console/api.py` | 220 | `user` |
| `console/api.py` | 226 | `command(identifier, body, request)` |
| `console/api.py` | 228 | `user` |
| `console/api.py` | 234 | `history(identifier, request)` |
| `console/api.py` | 241 | `evidence(request)` |
| `console/api.py` | 256 | `audit_records(request)` |
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
| `console/px4.py` | 21 | `PX4_COMMIT` |
| `console/px4.py` | 24 | `ManagedPx4(class)` |
| `console/px4.py` | 27 | `name` |
| `console/px4.py` | 28 | `live` |
| `console/px4.py` | 30 | `__init__(self)` |
| `console/px4.py` | 42 | `open(self, identifiers)` |
| `console/px4.py` | 48 | `root` |
| `console/px4.py` | 49 | `git` |
| `console/px4.py` | 52 | `commit` |
| `console/px4.py` | 57 | `binary` |
| `console/px4.py` | 58 | `binary_file` |
| `console/px4.py` | 60 | `work` |
| `console/px4.py` | 63 | `env` |
| `console/px4.py` | 63 | `key` |
| `console/px4.py` | 63 | `value` |
| `console/px4.py` | 105 | `key` |
| `console/px4.py` | 111 | `collect(self, key)` |
| `console/px4.py` | 113 | `value` |
| `console/px4.py` | 116 | `tick(self)` |
| `console/px4.py` | 120 | `key` |
| `console/px4.py` | 129 | `health` |
| `console/px4.py` | 129 | `position` |
| `console/px4.py` | 129 | `velocity` |
| `console/px4.py` | 134 | `battery` |
| `console/px4.py` | 155 | `execute(self, aircraft, action, plan)` |
| `console/px4.py` | 167 | `items` |
| `console/px4.py` | 168 | `point` |
| `console/px4.py` | 169 | `latitude` |
| `console/px4.py` | 169 | `longitude` |
| `console/px4.py` | 200 | `close(self)` |
| `console/px4.py` | 202 | `task` |
| `console/px4.py` | 204 | `task` |
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
| `console/service.py` | 86 | `vehicle` |
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
| `tools/check_repo.py` | 15 | `main()` |
| `tools/check_repo.py` | 17 | `name` |
| `tools/check_repo.py` | 32 | `path` |
| `tools/check_repo.py` | 35 | `content` |
| `tools/check_repo.py` | 44 | `action` |
| `tools/check_repo.py` | 47 | `scripts` |
| `tools/check_repo.py` | 48 | `styles` |
| `tools/check_repo.py` | 49 | `js` |
| `tools/check_repo.py` | 49 | `p` |
| `tools/check_repo.py` | 50 | `css` |
| `tools/check_repo.py` | 50 | `p` |
| `tools/docs_index.py` | 13 | `ROOT` |
| `tools/docs_index.py` | 14 | `EXCLUDED` |
| `tools/docs_index.py` | 29 | `files()` |
| `tools/docs_index.py` | 33 | `path` |
| `tools/docs_index.py` | 35 | `part` |
| `tools/docs_index.py` | 40 | `render()` |
| `tools/docs_index.py` | 42 | `catalog` |
| `tools/docs_index.py` | 50 | `source_map` |
| `tools/docs_index.py` | 60 | `path` |
| `tools/docs_index.py` | 61 | `relative` |
| `tools/docs_index.py` | 62 | `text` |
| `tools/docs_index.py` | 63 | `description` |
| `tools/docs_index.py` | 64 | `line` |
| `tools/docs_index.py` | 69 | `tree` |
| `tools/docs_index.py` | 70 | `records` |
| `tools/docs_index.py` | 71 | `node` |
| `tools/docs_index.py` | 73 | `params` |
| `tools/docs_index.py` | 74 | `arg` |
| `tools/docs_index.py` | 81 | `line` |
| `tools/docs_index.py` | 81 | `name` |
| `tools/docs_index.py` | 83 | `node_binary` |
| `tools/docs_index.py` | 86 | `node` |
| `tools/docs_index.py` | 96 | `main()` |
| `tools/docs_index.py` | 98 | `outputs` |
| `tools/docs_index.py` | 99 | `content` |
| `tools/docs_index.py` | 99 | `name` |
| `tools/docs_index.py` | 100 | `path` |
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
| `ui/src/main.tsx` | 54 | `checks` |
| `ui/src/main.tsx` | 63 | `request` |
| `ui/src/main.tsx` | 64 | `url` |
| `ui/src/main.tsx` | 65 | `method` |
| `ui/src/main.tsx` | 66 | `body` |
| `ui/src/main.tsx` | 67 | `csrf` |
| `ui/src/main.tsx` | 68 | `key` |
| `ui/src/main.tsx` | 70 | `response` |
| `ui/src/main.tsx` | 80 | `value` |
| `ui/src/main.tsx` | 91 | `App` |
| `ui/src/main.tsx` | 92 | `[user, setUser]` |
| `ui/src/main.tsx` | 93 | `[fleet, setFleet]` |
| `ui/src/main.tsx` | 94 | `[selected, setSelected]` |
| `ui/src/main.tsx` | 95 | `[draft, setDraft]` |
| `ui/src/main.tsx` | 96 | `[draftRevision, setDraftRevision]` |
| `ui/src/main.tsx` | 97 | `[attest, setAttest]` |
| `ui/src/main.tsx` | 98 | `[notice, setNotice]` |
| `ui/src/main.tsx` | 99 | `[busy, setBusy]` |
| `ui/src/main.tsx` | 100 | `[intent, setIntent]` |
| `ui/src/main.tsx` | 105 | `[history, setHistory]` |
| `ui/src/main.tsx` | 106 | `[cursor, setCursor]` |
| `ui/src/main.tsx` | 107 | `[audit, setAudit]` |
| `ui/src/main.tsx` | 108 | `[help, setHelp]` |
| `ui/src/main.tsx` | 109 | `[now, setNow]` |
| `ui/src/main.tsx` | 110 | `dialogRef` |
| `ui/src/main.tsx` | 111 | `aircraft` |
| `ui/src/main.tsx` | 111 | `item` |
| `ui/src/main.tsx` | 112 | `writable` |
| `ui/src/main.tsx` | 114 | `draftMatches` |
| `ui/src/main.tsx` | 122 | `timer` |
| `ui/src/main.tsx` | 126 | `dialog` |
| `ui/src/main.tsx` | 133 | `refresh` |
| `ui/src/main.tsx` | 134 | `result` |
| `ui/src/main.tsx` | 146 | `active` |
| `ui/src/main.tsx` | 147 | `running` |
| `ui/src/main.tsx` | 148 | `poll` |
| `ui/src/main.tsx` | 152 | `value` |
| `ui/src/main.tsx` | 164 | `timer` |
| `ui/src/main.tsx` | 173 | `item` |
| `ui/src/main.tsx` | 184 | `perform` |
| `ui/src/main.tsx` | 185 | `operation` |
| `ui/src/main.tsx` | 186 | `success` |
| `ui/src/main.tsx` | 187 | `reload` |
| `ui/src/main.tsx` | 195 | `error` |
| `ui/src/main.tsx` | 206 | `login` |
| `ui/src/main.tsx` | 206 | `event` |
| `ui/src/main.tsx` | 208 | `data` |
| `ui/src/main.tsx` | 218 | `error` |
| `ui/src/main.tsx` | 225 | `selectAircraft` |
| `ui/src/main.tsx` | 225 | `id` |
| `ui/src/main.tsx` | 235 | `shown` |
| `ui/src/main.tsx` | 236 | `pointPath` |
| `ui/src/main.tsx` | 238 | `p` |
| `ui/src/main.tsx` | 338 | `event` |
| `ui/src/main.tsx` | 378 | `item` |
| `ui/src/main.tsx` | 430 | `p` |
| `ui/src/main.tsx` | 430 | `i` |
| `ui/src/main.tsx` | 431 | `[x, y]` |
| `ui/src/main.tsx` | 492 | `e` |
| `ui/src/main.tsx` | 506 | `e` |
| `ui/src/main.tsx` | 516 | `p` |
| `ui/src/main.tsx` | 516 | `i` |
| `ui/src/main.tsx` | 519 | `key` |
| `ui/src/main.tsx` | 532 | `e` |
| `ui/src/main.tsx` | 535 | `v` |
| `ui/src/main.tsx` | 535 | `j` |
| `ui/src/main.tsx` | 595 | `[key, label]` |
| `ui/src/main.tsx` | 600 | `e` |
| `ui/src/main.tsx` | 613 | `key` |
| `ui/src/main.tsx` | 635 | `action` |
| `ui/src/main.tsx` | 660 | `issue` |
| `ui/src/main.tsx` | 681 | `value` |
| `ui/src/main.tsx` | 719 | `e` |
| `ui/src/main.tsx` | 735 | `item` |
| `ui/src/main.tsx` | 754 | `event` |
| `ui/src/main.tsx` | 786 | `captured` |
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
| `tools/source_index.mjs` | 7 | `collect` |
| `tools/source_index.mjs` | 7 | `root` |
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
