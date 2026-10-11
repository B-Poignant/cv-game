// Recruiter identities (F-012), shared so the join form and the server apply the same rules.

export interface RecruiterIdentity {
  name: string;
  company: string;
}

/**
 * Longest name and company, so labels above characters stay readable. Counted in UTF-16
 * units, like the form inputs' `maxLength`.
 */
export const NAME_MAX_LENGTH = 20;
export const COMPANY_MAX_LENGTH = 24;

/**
 * Letters (any language, with accents), digits, spaces and a little punctuation:
 * enough for "Wile E. Coyote" or "Moe's Tavern", not for markup.
 */
const ALLOWED_CHARACTERS = /^[\p{L}\p{M}\p{N} .,'’&!?()-]+$/u;

/** The defaults offered in the join form, picked at random (validated by the CV owner). */
export const DEFAULT_RECRUITERS = [
  // Simpsons
  { name: "Homer", company: "Springfield Nuclear" },
  { name: "Snake", company: "Philanthropie" },
  { name: "Hank Scorpio", company: "Globex Corporation" },
  { name: "Apu", company: "Kwik-E-Mart" },
  { name: "Moe", company: "Moe's Tavern" },
  { name: "Krusty", company: "Krusty Burger" },
  { name: "Mr. Burns", company: "Burns Casino" },
  // South Park
  { name: "Randy", company: "Tegridy Farms" },
  { name: "Tuong Lu Kim", company: "City Wok" },
  { name: "Mr. Mackey", company: "South Park Elementary" },
  { name: "Cartman", company: "Cheesy Poofs" },
  // Office and tech culture
  { name: "Michael", company: "Dunder Mifflin" },
  { name: "Bill Lumbergh", company: "Initech" },
  { name: "Gavin Belson", company: "Hooli" },
  { name: "Cave Johnson", company: "Aperture Science" },
  { name: "Wile E. Coyote", company: "Acme Corp" },
  { name: "Bruce", company: "Wayne Enterprises" },
  // French references
  { name: "Hubert", company: "SDECE" },
  { name: "Jean-Claude", company: "Aware" },
] as const satisfies readonly RecruiterIdentity[];

/** A random default identity. `random` returns a number in [0, 1). */
export function randomRecruiter(
  random: () => number = Math.random,
): RecruiterIdentity {
  const index = Math.floor(random() * DEFAULT_RECRUITERS.length);

  return { ...DEFAULT_RECRUITERS[index] };
}

/**
 * Cleans what a visitor typed (trims, collapses spaces) and returns it, or `undefined` if
 * it's not a valid identity: missing, empty, too long, or with characters outside the
 * allowed set. Takes `unknown` because the server gets it straight from the network.
 */
export function normalizeIdentity(
  input: unknown,
): RecruiterIdentity | undefined {
  if (typeof input !== "object" || input === null) {
    return undefined;
  }

  const { name, company } = input as Record<string, unknown>;
  const cleanName = cleanField(name, NAME_MAX_LENGTH);
  const cleanCompany = cleanField(company, COMPANY_MAX_LENGTH);

  if (cleanName === undefined || cleanCompany === undefined) {
    return undefined;
  }

  return { name: cleanName, company: cleanCompany };
}

function cleanField(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim().replace(/\s+/g, " ");
  const isValid =
    cleaned.length > 0 &&
    cleaned.length <= maxLength &&
    ALLOWED_CHARACTERS.test(cleaned);

  return isValid ? cleaned : undefined;
}
