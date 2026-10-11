import { schema, t, type SchemaType } from "@colyseus/schema";

export const PlayerState = schema(
  {
    name: t.string(),
    company: t.string(),
    column: t.number(),
    row: t.number(),
    /** Intel card ids earned so far (F-031), in the order they were earned. */
    intel: t.array("string"),
  },
  "PlayerState",
);

export type PlayerState = SchemaType<typeof PlayerState>;

/** The dev the recruiters chase (F-060), moved by the server only. */
export const DevState = schema(
  {
    name: t.string(),
    column: t.number(),
    row: t.number(),
  },
  "DevState",
);

export type DevState = SchemaType<typeof DevState>;

export const CvRoomState = schema(
  {
    players: t.map(PlayerState),
    dev: DevState,
  },
  "CvRoomState",
);

export type CvRoomState = SchemaType<typeof CvRoomState>;
