# Validation record

Date: 2026-10-01. Release status: **experimental browser preview deployed and checked**.

## Completed locally

- 52 Node tests passed, zero failures/skips (Node 24.19.0, PDF.js 6.3.289)
- Vite 8.3.1 production build passed; all parser/rendering assets are packaged locally
- Actual PDF.js extraction of two original synthetic PDFs produced the five expected outcomes: literal+moved, normalized+moved, possible negation edit, two occurrences, not located
- Every accepted synthetic occurrence points to the expected physical page and an exact raw extracted UTF-16 span
- Repeated comparisons produce identical substantive JSON
- Standalone report escaping covers source names, page labels, quotes, context and notes containing HTML/script payloads. Reports have no scripts and a restrictive CSP
- Pure/adversarial checks cover Unicode letter/mark/number boundaries, exact+normalized duplication, distant and same-page duplicates, baseline failure/selection, hints, case, hyphens, ligatures, NBSP, context negation, numbers, page/layout boundaries and occurrence limits
- Extraction checks cover invalid signature/malformed content, blank/failed pages, password-exception handling, timeout, cancellation, adjacent styled runs, punctuation and split decimals

The encrypted-PDF check uses a parser exception stub; it is not a real encrypted-file interoperability test. Multi-column checks use controlled geometry and do not establish universal layout detection. The app exposes these limitations.

## Real revised-PDF sample

A separate check evaluated 30 selected quotations across three publicly available revised research-paper pairs with actual PDF.js Node extraction, a separate Poppler page-location oracle and visual inspection of relevant pages. See [`real-pair-validation.json`](real-pair-validation.json) for aggregate results, public sources and exact matching/extraction code hashes: 30/30 expected classifications and locations agreed, with 23 retained passages, seven changed passages (four with suggestions, three correctly unlocated) and five moved passages. Twenty-three relevant pages were visually reviewed by an AI reviewer. Source PDFs and private quotation fixtures are deliberately outside this repository; do not copy them in without reviewing redistribution rights.

The matching and extraction code hashes in that record remain unchanged in the published code. Three selected prose papers cannot establish general accuracy. Candidate recall must be distinguished from literal/normalized location precision.

## Browser verification

- [Final repair PR CI](https://github.com/mozzie49/quotecarry/actions/runs/36871362253) on `49be4949e88fb3a776a6905c0496a4c7063fa8d9`: 52 Node tests, production build, and 12 Chromium desktop/mobile checks passed
- [Deployment workflow](https://github.com/mozzie49/quotecarry/actions/runs/36872412497) on merged commit `79eb9fdc80d122a16bfc1e1d81f4960c8923afc8` passed all 52 Node and 12 desktop/mobile browser checks, then deployed GitHub Pages
- Browser coverage includes five demo outcomes, local-file network restrictions, editable import preview, result invalidation, repeated runs, cancellation, clear/reload, rendered PDF previews, JSON contents, HTML export reopening, and app/report mobile overflow
- AI visual review covered desktop and Pixel 7 emulation screenshots of the landing page, changed passage with PDF preview/highlight, and reopened standalone report
- The first browser run correctly blocked publication: PDF.js 6 removed `convertToViewportRectangle`, so highlighting threw after the page canvas rendered. The fix uses supported point conversion. Visual review also found and fixed unbroken SHA-256 overflow in the mobile report
- Local Chromium could not run because a required socket operation was forbidden (`EPERM`). No workaround was used; the browser tests above ran on GitHub-hosted runners

## Live deployment check

On 2026-10-01, the [live app](https://mozzie49.github.io/quotecarry/) was opened in a separate cloud Chromium browser. Its bundle `index-BczniRMY.js` matches the reviewed production build. The five demo outcomes, two revised occurrences, conservative unlocated wording, changed-passage PDF preview and highlight, clear/reset, repeat run, and GitHub source link were checked. The cloud-browser download bridge timed out, so JSON contents and reopening exported HTML are established by the passing deployment browser suite, not by that bridge. Mobile evidence is CI emulation, not a physical phone.

## Remaining limits

- No external usability sessions, real user adoption, independent demand validation or star-growth outcome has been established
- No physical-phone testing, Safari/Firefox compatibility matrix, assistive-technology audit, or broad PDF-layout benchmark has been completed
- No Excel/Zotero/PDF++ workflow integration, annotation migration, OCR, multilingual recall or semantic validity is promised
- The three real paper pairs and original synthetic fixtures are selected tests, not a representative accuracy benchmark

Before relying on a passage, inspect the original source. Test with independent people using their own sources before calling this broadly useful software. Treat failures and abstentions as findings.

## Code review

Code review fixed an asynchronous reset/disposal race: old documents are detached from app state before destruction, and reset clears inputs synchronously. Stale demo fetch completion cannot re-enable or overwrite a newer operation. Matching now yields between passages and checks cancellation. PDF previews reject non-finite/invalid dimensions and oversized canvas allocations. A clear-then-reload browser regression was added and passed in both desktop and mobile CI.
