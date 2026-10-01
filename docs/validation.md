# Validation record

Date: 2026-10-01. Release status: **public source staging; browser QA, deployment and pre-release pending**.

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

The coordinator separately evaluated 30 selected quotations across three publicly available revised research-paper pairs with actual PDF.js Node extraction, a separate Poppler page-location oracle and visual inspection of relevant pages. See [`real-pair-validation.json`](real-pair-validation.json) for aggregate results, public sources and exact matching/extraction code hashes: 30/30 expected classifications and locations agreed, with 23 retained passages, seven changed passages (four with suggestions, three correctly unlocated) and five moved passages. Twenty-three relevant pages were visually reviewed by an AI reviewer. Source PDFs and private quotation fixtures are deliberately outside this repository; do not copy them in without reviewing redistribution rights.

This build's final release gate remains contingent on that record and its exact code snapshot. Three selected prose papers cannot establish general accuracy. Candidate recall must be distinguished from literal/normalized location precision.

## Not executed / remaining gates

- The Playwright desktop/mobile suite is present but **not run**: local Chromium launch failed because its required socket operation is forbidden (`EPERM`). No workaround was attempted
- Actual browser rendering, accessibility, network isolation, downloads/reopening, cancellation/reset and mobile layout therefore remain unverified
- No remote CI, GitHub Pages deployment, public users, external usability sessions or star-growth outcome has been established
- No Excel/Zotero/PDF++ workflow integration, annotation migration, OCR, multilingual recall or semantic validity has been tested or promised

Before publishing as useful software: run the browser suite on a supported machine, inspect the five demo screens and exported report, review the real-pair evidence, and test with independent people using their own sources. Treat failures and abstentions as findings, not data to hide.

## Coordinator code review

The coordinator fixed an asynchronous reset/disposal race: old documents are detached from app state before destruction, and reset clears inputs synchronously. Stale demo fetch completion cannot re-enable or overwrite a newer operation. Matching now yields between passages and checks cancellation. PDF previews reject non-finite/invalid dimensions and oversized canvas allocations. A clear-then-reload browser regression was added; browser execution remains pending.
