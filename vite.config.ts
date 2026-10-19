import { defineConfig, type Plugin } from "vite";

import { CONTACT } from "./src/content/contact";
import { CV } from "./src/content/cv";
import { renderCvPage } from "./src/cvPage/renderCvPage";

/**
 * Serves the classic HTML CV (F-032) at /cv/ while `npm run dev` runs, rendered fresh on
 * each request so edits to cv.ts show up on reload. In production `npm run cv:html` writes
 * it into dist/ instead.
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

        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(
          renderCvPage(CV, CONTACT, { gameUrl: "/", now: new Date() }),
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [cvPage()],
});
