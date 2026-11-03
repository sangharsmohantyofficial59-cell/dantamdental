import { createHash } from "node:crypto";
import { adminDb } from "./firebase-admin";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/**
 * Counts requests per visitor per hour in Firestore and refuses after `limit`.
 * The visitor's address is hashed, so no raw IPs are stored.
 */
export async function allow(req: Request, bucket: string, limit: number): Promise<boolean> {
  const salt = process.env.RATE_LIMIT_SALT ?? "change-me";
  const hour = Math.floor(Date.now() / 3_600_000);
  const key = createHash("sha256").update(`${salt}|${bucket}|${clientIp(req)}`).digest("hex").slice(0, 40);
  const ref = adminDb().collection("rateLimits").doc(`${bucket}_${hour}_${key}`);
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = (snap.exists ? (snap.data()?.count as number) : 0) + 1;
    if (count > limit) return false;
    tx.set(ref, { count, expiresAt: (hour + 2) * 3_600_000 });
    return true;
  });
}
