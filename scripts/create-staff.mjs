// Creates (or updates) a front desk login.
// Usage: npm run create-staff -- <username> "<password>"
// Example: npm run create-staff -- frontdesk "Choose-A-Long-Password-1"
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [username, password] = process.argv.slice(2);
const domain = process.env.STAFF_EMAIL_DOMAIN || "staff.dantam.local";

if (!username || !password) {
  console.error('Usage: npm run create-staff -- <username> "<password>"');
  process.exit(1);
}
if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
  console.error("Username: 3 to 30 characters, lowercase letters, numbers, dot, dash or underscore.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
for (const key of ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Fill in .env.local first.`);
    process.exit(1);
  }
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();
const email = `${username}@${domain}`;

let user;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password, emailVerified: true, disabled: false });
  console.log(`Updated existing login: ${username}`);
} catch (err) {
  if (err.code !== "auth/user-not-found") throw err;
  user = await auth.createUser({ email, password, emailVerified: true, displayName: username });
  console.log(`Created login: ${username}`);
}

// The "staff" claim is what lets this account into the front desk.
await auth.setCustomUserClaims(user.uid, { staff: true });
console.log(`Done. Sign in at the front desk with username "${username}" and the password you just set.`);
process.exit(0);
