import { defineConfig, type Plugin } from "vite";

/**
 * Serves the classic HTML CV (F-032) at /cv/ while `npm run dev` runs, rendered fresh on
 * each request so edits to cv.ts show up on reload. In production `npm run cv:html` writes
 * it into dist/ instead.
 *
 * The CV modules go through `ssrLoadModule` rather than a static import, so they stay out of
 * the config's own import graph (Vite's native config loader wants file extensions there).
 */
function cvPage(): Plugin {
  return {
    name: "cv-page",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split("?")[0];

        if (url !== "/cv" && url !== "/cv/") {
          next();
          return;
        }

        void renderPage().then((html) => {
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(html);
        }, next);
      });

      async function renderPage(): Promise<string> {
        const [{ CONTACT }, { CV }, { renderCvPage }] = await Promise.all([
          server.ssrLoadModule("/src/content/contact.ts") as Promise<
            typeof import("./src/content/contact")
          >,
          server.ssrLoadModule("/src/content/cv.ts") as Promise<
            typeof import("./src/content/cv")
          >,
          server.ssrLoadModule("/src/cvPage/renderCvPage.ts") as Promise<
            typeof import("./src/cvPage/renderCvPage")
          >,
        ]);

        return renderCvPage(CV, CONTACT, { gameUrl: "/", now: new Date() });
      }
    },
  };
}

export default defineConfig({
  plugins: [cvPage()],
});
