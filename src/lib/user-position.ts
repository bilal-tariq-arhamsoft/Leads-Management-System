/** Mirrors Prisma `UserPosition` without importing `@prisma/client` (edge-safe). */
export const UserPosition = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
} as const;

export type UserPosition = (typeof UserPosition)[keyof typeof UserPosition];

export const USER_POSITION_VALUES: readonly UserPosition[] = [
  UserPosition.ADMIN,
  UserPosition.MANAGER,
];

export function isUserPosition(value: unknown): value is UserPosition {
  return (
    typeof value === "string" &&
    USER_POSITION_VALUES.includes(value as UserPosition)
  );
}
