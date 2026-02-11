import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export async function resolveUserUuid(session: any): Promise<string | null> {
  const rawId = session?.user?.id ? String(session.user.id) : null;
  if (!rawId) return null;

  // 1) Если уже UUID — отлично
  if (isUuid(rawId)) return rawId;

  // 2) Иначе пробуем найти по providerId (Steam/Google/Yandex id)
  const byProviderId = await db.query.users.findFirst({
    where: eq(users.providerId, rawId),
  });
  if (byProviderId) return byProviderId.id;

  // 3) Фолбэк: по email (если есть)
  const email = session?.user?.email ? String(session.user.email).toLowerCase() : null;
  if (email) {
    const byEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (byEmail) return byEmail.id;
  }

  return null;
}