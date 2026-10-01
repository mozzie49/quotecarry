# QuoteCarry

**Your saved passages, across PDF revisions.**

An experimental, browser-local review tool for people who keep quotations from changing sources. Select an old PDF, a revised PDF and the passages you care about. Review extracted-text locations, page movement, whitespace changes, possible edits and ambiguous matches side by side.

**Prototype, not a citation validator.** A located passage does not prove unchanged meaning, source authenticity or whether an AI read the file. Counts concern searchable extracted text; additional occurrences can be missed in unreliable reading order. Not located does not mean deleted.

## Try the original five-passage demo

```sh
npm ci --ignore-scripts
npm run dev
```

Open the address printed by Vite and choose **Try the synthetic demo**. It loads two fictional, original “Field Notes Review Handbook” PDFs and five saved quotes:

| Passage | Demonstrated outcome |
| --- | --- |
| Completed uploads… | Literal occurrence, PDF page 2 → 3 |
| The review queue… | Whitespace-normalized occurrence, PDF page 2 → 3 |
| Failed imports… | Possible changed passage; inserted **not** is visible |
| Reviewers can export… | Two revised occurrences, both retained for review |
| Each archived report… | Not located in extracted revised text |

These controlled fixtures demonstrate behavior, not real-world accuracy. Downloadable fixtures and an offline HTML/JSON evidence report are in [`public/demo`](public/demo). No real user or employer data is included.

## Workflow

1. Choose the **old** and **revised** PDF explicitly
2. Paste one saved passage per card, or import a UTF-8 `.txt` file with blank lines between passages
3. Review the editable import preview, including skipped oversized blocks
4. Compare; inspect raw context, physical PDF-page indices, embedded page labels and optional previews
5. If the old source contains repeated text, explicitly select the intended occurrence. The report retains that intervention and the original ambiguity
6. Download a self-contained HTML or versioned JSON report. Reports contain quoted text, your notes, file names and hashes; review before sharing

Nothing moves or edits PDF annotations. There is no automatic Zotero/PDF++ import, OCR, backend, account, API key, telemetry, browser storage or file upload. The static app loads its own code, PDF.js assets and optional synthetic demo files from the same origin. Clear the page to release loaded files from the app; your browser/device may retain downloads.

## What the statuses mean

The old baseline is evaluated first: located, ambiguous, not located or unavailable. A failed or unresolved baseline blocks a revision verdict. A page hint never silently chooses an occurrence.

The revised source can show:
- **Literal match:** one occurrence of the exact words in searchable extracted text
- **Whitespace-normalized match:** one occurrence after documented whitespace normalization
- **Multiple matches:** every accepted occurrence remains visible
- **Possible changed passage:** a bounded deterministic suggestion, never an accepted match
- **Not located in extracted revised text:** neither an accepted occurrence nor a supported suggestion was found
- **Revised extraction incomplete:** available evidence is shown, but no unique or negative verdict is produced

Page movement and surrounding-context change are separate badges. Up to ten adjacent tokens on either side are compared textually. This is not semantic interpretation.

## Deliberately narrow limits

- Latin-script, mostly single-column selectable text; 25 MiB and 100 physical PDF pages per file
- Up to 50 passages, each at most 2,000 characters; short passages carry a warning
- Whitespace normalization only. Case, punctuation, digits, ordinary hyphens, ligatures and word order are preserved. No NFKC, dehyphenation, OCR correction or wildcard ellipses
- Quotes cannot cross pages or detected spatial discontinuities. Complex layouts may have unreliable order that cannot always be detected
- Blank/failed pages block whole-search completeness, even if a blank page was intentional. Scans and unreliable OCR layers are not repaired
- Candidate search is first-word anchored, capped at 1,500 comparisons and three non-overlapping suggestions, for 5–160 tokens. It may miss edits to the first word, long passages, columns or altered typography
- Precise page highlighting is shown only when the span aligns with whole extracted text runs; otherwise only the page and raw text are shown
- A SHA-256 hash identifies bytes, not authenticity. Embedded page labels may be absent or duplicated

## Development and checks

Requires Node.js 24+ and a current browser with module workers, Web Crypto and Canvas. Exact dependency versions are pinned in `package-lock.json`.

```sh
npm test                 # pure matching, extraction, fixture and export checks
npm run build            # bundled, self-contained static assets
npm run preview          # serve the production build locally
npm run demo:generate    # regenerate original demo PDFs and reports
npx playwright install chromium
npm run test:browser     # desktop/mobile integration suite
```

The browser suite is prepared but could not run in the build sandbox: Chromium could not create a required local socket (`EPERM`). Do not count it as passed. It checks the demo, previews, exports, local-file network behavior, imports, cancellation/reset, repeated runs and mobile overflow. See [`docs/validation.md`](docs/validation.md) for the actual evidence and remaining gates.

## Static GitHub Pages deployment

`npm run build` writes `dist/`, including PDF.js worker, fonts, character maps and decoder assets. Relative paths support a project subdirectory. No CDN is required.

The included `Deploy reviewed prototype` workflow is **manual only**. After independent review, browser testing and an explicit publication decision, enable GitHub Pages with GitHub Actions and run it. CI runs core tests, builds and the browser suite on pushes/PRs. The repository is public staging. GitHub Pages and the experimental pre-release remain gated on remote CI and browser review.

## Provenance and prior art

Original implementation and fictional fixture prose were developed with AI assistance for project owner `mozzie49`. No competitor code was copied. Quote matching, fuzzy anchoring and annotation transfer are established ideas; this prototype is a selected-passage revision review workflow, not a claim to have invented them.

- [citefact](https://github.com/hearthresearch/citefact): broader quote auditing and reports
- [Hypothesis fuzzy anchoring](https://web.hypothes.is/blog/fuzzy-anchoring/): established text anchoring techniques
- [pdf-annotations-transfer](https://github.com/maforn/pdf-annotations-transfer): annotation transfer prior art
- [Zotero PDF reader](https://www.zotero.org/support/pdf_reader): annotation workflows and revision-position limitations

MIT licensed original code and demo text. PDF.js is Apache-2.0; pdf-lib and Vite are MIT; Playwright is Apache-2.0. Third-party bundled asset licenses remain included. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
