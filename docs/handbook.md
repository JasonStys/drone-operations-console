# Drone Operations Console handbook

By Jason Stys.

Import, edit, save and replay bounded friendly-route scenes with obstacle validation, paused scrubbing and safe asynchronous replacement.

Import, edit, save and replay bounded friendly-route scenes with obstacle validation, paused scrubbing and safe asynchronous replacement.

Makes civilian simulation demonstrations repeatable and prevents unsafe starting scenes or stale imports from replacing current work.

## Read the documentation

| Edition                                                      | Audience and contents                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [project-guide.docx](reports/project-guide.docx)             | User and developer guide: purpose, current usage, design, boundaries and source references.                        |
| [validation-review.docx](reports/validation-review.docx)     | Reviewer edition: exact tested baseline, observed workflows, dated local results and remaining limits.             |
| [validation-evidence.xlsx](reports/validation-evidence.xlsx) | Two filterable Excel Tables for observed workflows and test-source inventory, with recalculating outcome formulas. |

The editable Markdown remains the maintenance source. The Word files are readable editions. The workbook is an evidence index rather than a test runner. See [publication identities and review](reports/publications.json) and the [documentation refresh record](reports/documentation-refresh-2026-11-09.md).

## Current usage and help

[README quick start](../README.md) is the entry point. Use the project-specific guides below before changing inputs, operating modes or deployment assumptions.

### Usage and operations

- [OPERATIONS](OPERATIONS.md)
- [RELEASE 0 2](RELEASE_0_2.md)
- [RELEASE 0 3](RELEASE_0_3.md)

### Design and contracts

- [ARCHITECTURE](ARCHITECTURE.md)
- [RESEARCH](RESEARCH.md)

### Security and validation

- [SECURITY](SECURITY.md)
- [TESTING](TESTING.md)
- [VALIDATION](VALIDATION.md)

## Historical results and reproduction

The reviewed source is [`176209ed96178351a3265676ae8d50396503b9ca`](https://github.com/JasonStys/drone-operations-console/tree/176209ed96178351a3265676ae8d50396503b9ca). The observed functional workflow baseline is `176209ed96178351a3265676ae8d50396503b9ca`; those observations are recorded at `2026-11-10T05:25:40.628667+00:00`. They do not certify an unrun later revision.

- [Detailed recorded validation](reports/practical-workflows-2026-11-09.md)
- [Current Actions](https://github.com/JasonStys/drone-operations-console/actions) records later integration checks separately.
- Preserve dated measurements and follow the existing testing guide to reproduce them; a test-source inventory alone does not establish execution.

## Practical boundaries

- Civilian cooperative 2D simulations only; no pursuit, evasion, targeting or real-aircraft commands.
- Point-centerline grid paths and global holds do not model swept aircraft bodies or certified flight dynamics.
- Scenes require explicit save/export; no account sync or automatic browser persistence is supplied.
- The application is an unsigned simulation package, not operational flight-control software or flight authorization.

## Maintaining these editions

Update the editable usage/design/test documents first. Rebuild and visually review every Word page and workbook tab before replacing an edition; verify the exact binary digests and evidence source in publications.json. Keep account data, logs with secrets, installed-app state and private test stores out of documentation. Source and release assets retain their existing security and licensing boundaries.
