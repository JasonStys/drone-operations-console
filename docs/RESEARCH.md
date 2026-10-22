# Research and attribution

By Jason Stys. Public primary documentation reviewed 2026-10-21/22. These sources
inform interfaces and safety limits; they do not endorse or certify the application.

- [PX4 simulation](https://docs.px4.io/main/en/simulation/) and
  [SIH](https://docs.px4.io/main/en/sim_sih/): distinguish actual autopilot simulation
  from a UI animation. Runtime/build is pinned to v1.17.0 source, whose actual CMake
  SIH target is built through `px4_sitl_default`; main documentation evolves.
- [MAVSDK native Python](https://mavsdk.mavlink.io/main/en/python/quickstart.html):
  native 4.0.6 async SDK and plugins; library source signatures were inspected.
  No custom flight-control stack or gRPC exposure is needed.
- [MAVLink security](https://mavlink.io/en/about/faq.html): signing is not encryption.
- [FastAPI deployment](https://fastapi.tiangolo.com/deployment/docker/) and
  [SQLAlchemy](https://docs.sqlalchemy.org/en/21/): service/persistence patterns;
  one process and bounded inputs are explicit prototype limits.
- [OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
  and [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html):
  independent sessions/CSRF, Argon2id, no default real password or secret logging.
- [Microsoft Container Apps](https://learn.microsoft.com/azure/container-apps/overview)
  and [managed identity](https://learn.microsoft.com/azure/container-apps/managed-identity):
  private read-only cloud reference; syntax verification is not a live deployment.
- [FAA emergency situations](https://www.faa.gov/uas/advanced_operations/emergency_situations)
  and [LAANC](https://www.faa.gov/uas/getting_started/laanc): a preflight checklist
  does not issue an aviation authorization, including during emergencies.

All demo scenarios are original fictional data. No employer/customer material,
private flight records, scraped imagery or actual incident/person locations are
included. This project is domain-relevant original portfolio work, not affiliated
with an employer or a replacement for official operational procedures.
