import type { CollisionMap } from "../../shared/CollisionMap";
import type { GridPosition } from "../../shared/grid";
import { isWalkable } from "../../shared/world";

/** Directions tried each step: enough to slide along walls and slip between recruiters. */
const DIRECTION_COUNT = 16;

/**
 * Unit vectors, rounded so the ones along an axis are exactly 0 across. Otherwise
 * cos(3π/2) ≈ -1.8e-16 would put a step along the map's edge just off the map.
 */
const DIRECTIONS = Array.from({ length: DIRECTION_COUNT }, (_, index) => {
  const angle = (index / DIRECTION_COUNT) * 2 * Math.PI;

  return { column: round(Math.cos(angle)), row: round(Math.sin(angle)) };
});

/** Below this, a recruiter counts as on top of him (avoids dividing by zero). */
const MIN_DISTANCE = 0.1;

/** Recruiters within `radius` tiles of `position`. */
export function threatsWithin(
  position: GridPosition,
  recruiters: readonly GridPosition[],
  radius: number,
): GridPosition[] {
  return recruiters.filter(
    (recruiter) => distance(position, recruiter) < radius,
  );
}

/**
 * The dev's next position when running from `threats` (F-061), or `undefined` if no step
 * gets him safer than standing still, which is what being cornered looks like.
 *
 * He tries a step of `stepLength` in each of 16 directions and keeps the walkable one that
 * puts him farthest from the recruiters, the closest ones counting most. Walls and map edges
 * block steps, so against a wall he slides along it, and in a corner he's stuck.
 */
export function fleeStep(
  position: GridPosition,
  threats: readonly GridPosition[],
  stepLength: number,
  collisions: CollisionMap,
): GridPosition | undefined {
  if (threats.length === 0 || stepLength <= 0) {
    return undefined;
  }

  // Weights fixed from where he stands now: the closest recruiter matters most.
  const weights = threats.map(
    (threat) => 1 / Math.max(distance(position, threat), MIN_DISTANCE),
  );
  const safety = (candidate: GridPosition) =>
    threats.reduce(
      (total, threat, index) =>
        total + weights[index] * distance(candidate, threat),
      0,
    );

  let best: GridPosition | undefined;
  let bestSafety = safety(position);

  for (const direction of DIRECTIONS) {
    const candidate = {
      column: position.column + direction.column * stepLength,
      row: position.row + direction.row * stepLength,
    };

    if (!isWalkable(candidate, collisions)) {
      continue;
    }

    const candidateSafety = safety(candidate);

    if (candidateSafety > bestSafety) {
      best = candidate;
      bestSafety = candidateSafety;
    }
  }

  return best;
}

function distance(from: GridPosition, to: GridPosition): number {
  return Math.hypot(to.column - from.column, to.row - from.row);
}

function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}
