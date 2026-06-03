export const leadHistoryInclude = {
  assignedUser: { select: { id: true, name: true, email: true, position: true } },
} as const;

export const userHistorySelect = {
  id: true,
  name: true,
  email: true,
  profileImageUrl: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} as const;
