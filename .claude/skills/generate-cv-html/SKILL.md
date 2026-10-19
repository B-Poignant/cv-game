---
name: generate-cv-html
description: Generate the classic HTML CV page of cv-game (F-032, served at /cv) from src/content/cv.ts, after syncing the CV from the owner's PDF or LinkedIn export when it changed. Use when the owner asks for the "HTML CV", the "classic CV", the "/cv page", to regenerate it, or says their CV PDF changed and the page should follow.
---

# Generate the classic HTML CV

The page at `/cv` is the owner's CV as a classic, print-ready HTML page, in French. It is
**generated**, never edited by hand: `renderCvPage` (`src/cvPage/`) builds it from the same
`src/content/cv.ts` and `src/content/contact.ts` as the game, so the two can't disagree.

## 1. Is the CV itself up to date?

The page shows exactly what `cv.ts` says. If the owner says their CV, PDF or LinkedIn
changed, or drops a new export:

- Run the `sync-cv` skill first. It reads the PDF / export and shows every change for
  approval. **Never** copy text from the PDF into the page or into `src/cvPage/`.
- If nothing changed, go to step 2.

## 2. Generate it

```bash
npm run cv:html                 # writes dist/cv/index.html (served at /cv by npm start)
npm run cv:html -- out/cv.html  # or anywhere else, e.g. to send the file
```

`npm run build` runs it too, so the Docker image and `npm start` always serve a fresh page.
While `npm run dev` runs, Vite serves it live at http://localhost:5173/cv/ (rebuilt on each
reload, see `vite.config.ts`).

## 3. Check it

- `npx vitest run tests/unit/cvPage` (content, escaping, empty sections).
- Open the page and look at it: wide screen, phone width, dark mode, and the print preview
  (A4, one clean column, no links bar). Check that nothing is cut off and that every section
  of `cv.ts` is there.
- A design change (layout, colours, fonts) goes in `src/cvPage/cvPageStyles.ts`. Accents come
  from the buildings' colours in `shared/buildings.ts`; keep small coloured text at 4.5:1
  contrast (that's what `--accent-ink` is for), in both light and dark.

## 4. Report

Tell the owner where the page is (`dist/cv/index.html`, `/cv` once deployed) and what
changed. The generated file is build output: don't commit it (`dist/` is ignored).
