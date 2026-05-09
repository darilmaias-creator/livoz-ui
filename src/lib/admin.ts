import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function isAdminUser(userId: string) {
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
    },
  });

  return user?.role === UserRole.ADMIN;
}
