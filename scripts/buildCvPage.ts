// `npm run cv:html` (F-032): writes the classic HTML CV from src/content/cv.ts.
// Usage: tsx scripts/buildCvPage.ts [output file], default dist/cv/index.html, which the
// game server serves at /cv. `npm run build` runs it after the client build.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { CONTACT } from "../src/content/contact";
import { CV } from "../src/content/cv";
import { renderCvPage } from "../src/cvPage/renderCvPage";

const output = path.resolve(process.argv[2] ?? "dist/cv/index.html");

const html = renderCvPage(CV, CONTACT, { gameUrl: "/", now: new Date() });

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html, "utf8");

console.log(`CV page written to ${path.relative(process.cwd(), output)}`);
