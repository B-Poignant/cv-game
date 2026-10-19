import { schema, t, type SchemaType } from "@colyseus/schema";

export const PlayerState = schema(
  {
    name: t.string(),
    company: t.string(),
    column: t.number(),
    row: t.number(),
    /** Intel card ids earned so far (F-031), in the order they were earned. */
    intel: t.array("string"),
    /** Hit by a spam email (F-063): moves at `SPAM.slowFactor` of the speed for a while. */
    slowed: t.boolean(),
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

/** A flying spam email (F-063), moved by the server only. Its id picks its subject. */
export const EmailState = schema(
  {
    id: t.number(),
    column: t.number(),
    row: t.number(),
  },
  "EmailState",
);

export type EmailState = SchemaType<typeof EmailState>;

export const CvRoomState = schema(
  {
    players: t.map(PlayerState),
    dev: DevState,
    /** Keyed by the email's id (F-063). */
    emails: t.map(EmailState),
  },
  "CvRoomState",
);

export type CvRoomState = SchemaType<typeof CvRoomState>;
