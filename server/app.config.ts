import path from "node:path";

import { defineRoom, defineServer } from "colyseus";

import { configureHttp } from "./http";
import { CvRoom } from "./rooms/CvRoom";

/** The built client (`npm run build`), relative to the working directory. */
const CLIENT_DIR = path.resolve(process.env.CLIENT_DIR ?? "dist");

export const server = defineServer({
  rooms: {
    cv: defineRoom(CvRoom),
  },
  express: (app) => {
    configureHttp(app, CLIENT_DIR);
  },
});

export default server;
