# Third-party notices

Original QuoteCarry source and synthetic fixture text are MIT licensed. No external PDF, research-paper text, third-party screenshots or competitor code is redistributed in the demo.

Direct dependencies, exact versions in the lockfile:
- `pdfjs-dist` 6.3.289: Apache License 2.0, Mozilla Foundation and contributors. The build copies `pdfjs-dist/LICENSE` and all upstream notices bundled with `cmaps`, `standard_fonts`, `wasm` and `iccs` into the matching public asset directories. PDF.js supplies the PDF parser, renderer, font handling and decoders; QuoteCarry does not claim authorship of these capabilities
- `pdf-lib` 1.17.1: MIT. Used only to generate the original synthetic demo PDFs
- `vite` 8.3.1: MIT. Development/build tooling
- `@playwright/test` 1.63.0: Apache License 2.0. Browser test tooling

The sample PDFs use PDF standard Helvetica references; no new proprietary font file is embedded. Upstream PDF.js fallback font license files are retained with the packaged assets. Transitive dependencies remain governed by their own licenses distributed in the npm packages. Review those notices before changing the packaging.
