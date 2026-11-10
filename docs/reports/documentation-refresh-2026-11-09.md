# Documentation refresh — 2026-11-09

By Jason Stys.

This documentation-only edition describes source `176209ed96178351a3265676ae8d50396503b9ca`. It does not change application behavior, accounts, private data, installers or published releases.

## Published editions and completed review

| File                                                 | Bytes | SHA-256                                                            | Reviewed scope                                                                                                                      |
| ---------------------------------------------------- | ----: | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [project-guide.docx](project-guide.docx)             | 44532 | `c74ebdfe430779c3670b1d53bfe00dc1dac7943cb71df9a424ef9b80ce765221` | 5 pages, each viewed individually                                                                                                   |
| [validation-review.docx](validation-review.docx)     | 44248 | `c69a6bb35dd2e52033200a5f5cde4f5461d91f9034625020309f137cbbc76d43` | 4 pages, each viewed individually                                                                                                   |
| [validation-evidence.xlsx](validation-evidence.xlsx) |  7434 | `6519757c3f996c95ccea56a7af4e2e675f2035db28b225560bffe9d134d51b8e` | Both tab previews; two actual Excel Tables/autoFilters; four formulas; failure-change/restore recalculation and zero formula errors |

Word review checked plain black titles, readable pagination, whole table rows, source references, practical limits and absence of clipping or overflow. Render receipts were matched to the current DOCX digest before approval. Workbook review inspected both tab previews and actual exported Table/autoFilter elements; recalculated success/failure summaries were compared independently with workflow metadata. Static previews do not draw Excel dropdown arrows; the exported workbook contains the actual filters.

## Evidence and change boundary

- Functional baseline: `176209ed96178351a3265676ae8d50396503b9ca`.
- Workflow observation: `2026-11-10T05:25:40.628667+00:00`; exact run URLs and source identities remain in [publications.json](publications.json).
- Local document-package validation verifies exact copied bytes, Office ZIP integrity, approved page/tab identities and internal documentation links. Repository-specific documentation and source-policy commands are run separately and recorded in the integration handoff.
- Source/index metadata is regenerated using the repository’s existing tools. Existing privacy, security, coverage and workflow gates are retained.
- PR and later main workflows must pass independently. This record does not claim future or unrun integration CI success.

## Interpretation

The Word files document the cited source; dated source reports retain their original execution scope. A passing workflow is distinct from completed analysis with zero findings, and neither establishes production suitability. The Excel source inventory is not a per-test execution report. Checksums identify exact bytes, not a signature or publisher attestation.

Use the [handbook](../handbook.md) to choose usage, design, security and test documentation. Keep editable Markdown and reviewed editions together; do not replace historical measurements with undated claims.
