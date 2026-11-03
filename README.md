# Dantam Dental Care: clinic website and front desk system

A public website where patients book appointments, plus a staff-only front desk app for the schedule and patient records. Built with Next.js and Firebase (free Spark plan), hosted on Vercel.

"Dantam Dental Care" and everything in `lib/clinic.ts` is fictional sample content. Replace it with the real clinic details (step 9).

## 1. How it is put together

```
dantamdental.com          Public site. Patients see free times and book.
admin.dantamdental.com    Front desk. Staff sign in with a username and password.
```

One codebase serves both. A middleware file decides which site to show from the address.

What keeps it safe:

| Risk | Protection |
| --- | --- |
| A visitor reads patient data from the browser | The database rules block every browser read and write. All data goes through server code only (`firestore.rules`). |
| A visitor opens the front desk | `/admin` returns a 404 on the public domain. On the admin domain every page and every API call checks a server-side session cookie first. |
| Someone creates their own login | A login only opens the front desk if it carries a `staff` flag. Only the `create-staff` script (using your secret server key) can set it. |
| Two people book the same time | Each booked time is a database record whose name is the date and time. Creating it twice fails, so a double booking cannot happen, even with two clicks at the same moment. |
| Bots flooding the booking form | Hidden trap field, a limit of 6 bookings per visitor per hour, input checks, and a cap of 3 upcoming visits per phone number. |
| Stolen session | Cookie is httpOnly, secure, same-site strict, and expires after 8 hours. Log out clears it. |
| Cross-site tricks | Every write checks that the request came from your own site. |

The public site can only do two things: see which times are free, and create one booking. It never sees names or phone numbers.

## 2. What you need

- Node.js 20.9 or newer (22 is best). Check with `node -v`. Download from nodejs.org.
- VS Code.
- A Google account (Firebase), a GitHub account, a Vercel account. All free.

## 3. Open the project in VS Code

1. Unzip the folder.
2. In VS Code choose File, Open Folder, and pick the `dantam-dental-care` folder.
3. Open the terminal (Terminal menu, New Terminal) and run:

```
npm install
```

4. Copy the settings file. In the terminal:

```
cp .env.example .env.local
```

On Windows PowerShell use `copy .env.example .env.local`. You will fill `.env.local` in the next step.

## 4. Set up Firebase (about 10 minutes)

Go to console.firebase.google.com and sign in.

1. **Create a project.** Add project, give it a name, turn Google Analytics off, Create.
2. **Turn on login.** Build, Authentication, Get started, Sign-in method, Email/Password, Enable, Save.
3. **Block self sign-up.** Authentication, Settings, User actions, turn off "Enable create (sign-up)". Staff accounts are created only with the script in step 5.
4. **Create the database.** Build, Firestore Database, Create database. Choose the location `asia-south1 (Mumbai)`. Choose Production mode. Create.
5. **Lock the database rules.** Firestore Database, Rules tab. Delete everything in the box, paste the contents of `firestore.rules` from this project, click Publish.
6. **Get the web app values.** Project settings (gear icon), General, scroll to "Your apps", click the web icon `</>`, register the app (any nickname), and copy `apiKey`, `authDomain`, `projectId`, `appId` into `.env.local` as the four `NEXT_PUBLIC_FIREBASE_...` lines.
7. **Get the server key.** Project settings, Service accounts, Generate new private key, Generate key. A JSON file downloads. Open it and copy three values into `.env.local`:
   - `project_id` into `FIREBASE_PROJECT_ID`
   - `client_email` into `FIREBASE_CLIENT_EMAIL`
   - `private_key` into `FIREBASE_PRIVATE_KEY` (keep the double quotes and the `\n` characters exactly as they are)
8. Set `RATE_LIMIT_SALT` to any long random text.

This key is a master key to your database. Never share it, never commit it, never post it in chat. `.gitignore` already keeps `.env.local` and key files out of GitHub. Delete the downloaded JSON file once the values are copied.

## 5. Create the front desk login and sample data

```
npm run create-staff -- frontdesk "Pick-A-Long-Password-1"
npm run seed
```

The first command creates the staff login. Use your own password of 10 or more characters. Run it again with a different username to add another staff member, or with the same username to change the password.

The second command adds fictional patients and appointments for the demo. Skip it for a real clinic.

## 6. Run it on your computer

```
npm run dev
```

- Public site: http://localhost:3000
- Front desk: http://localhost:3000/admin (works because `ALLOW_ADMIN_PATH=true` in `.env.local`)
- Subdomain style: http://admin.localhost:3000 (works in Chrome and Edge)

Try this: book a time on the public site, then sign in to the front desk. The booking appears with a "New online booking" tag. Booking the same time again shows "That time was just taken".

Optional checks: `npm test` (booking rules, needs Node 22) and `npm run typecheck`.

## 7. Put it online with Vercel (demo link for the sales team)

1. **Put the code on GitHub.** Create a new empty private repository on github.com. Then in the VS Code terminal:

```
git init
git add .
git commit -m "Clinic website and front desk"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/dantam-dental-care.git
git push -u origin main
```

2. **Import it.** On vercel.com click Add New, Project, pick the repository. Leave the framework as Next.js.
3. **Add environment variables** before you click Deploy (Settings, Environment Variables). Add every line from your `.env.local`, with these changes for the free vercel.app address:
   - `ALLOW_ADMIN_PATH` = `true`
   - `ADMIN_HOST` = leave empty
   - `NEXT_PUBLIC_SITE_URL` = leave empty for the first deploy, then set it to your Vercel address (for example `https://dantam-dental-care.vercel.app`) and redeploy once.
   - For `FIREBASE_PRIVATE_KEY` paste the value with the quotes removed and keep the `\n` text.
4. Click Deploy. When it finishes you get the live link:
   - Public site: `https://your-project.vercel.app`
   - Front desk: `https://your-project.vercel.app/admin`
5. Give the sales team the public link, the front desk link, and the demo username and password. Use a demo-only password, not the real clinic one.

## 8. Going live with the clinic's own domain

1. Buy the domain (for example `dantamdental.com`).
2. In Vercel, Project, Settings, Domains, add `dantamdental.com` and `admin.dantamdental.com`. Vercel shows the DNS records to add at the domain provider.
3. Change the environment variables:
   - `ADMIN_HOST` = `admin.dantamdental.com`
   - `ALLOW_ADMIN_PATH` = `false` (now `/admin` on the public domain returns 404)
   - `NEXT_PUBLIC_SITE_URL` = `https://dantamdental.com`
4. Redeploy. Create real staff logins with `npm run create-staff` and a strong password each. Disable or change the demo login.
5. Empty the sample data: in Firebase, Firestore Database, delete the `patients`, `appointments` and `slots` collections.

## 9. Make it the real clinic

Edit `lib/clinic.ts`: clinic name, doctor, phone, address, treatments and prices, opening hours, slot length, booking window. The sample reviews and the doctor photo placeholder are in `app/page.tsx`. Use only real reviews with the patient's permission.

## 10. Things to know

- **Cost.** The Firebase Spark plan is free and is enough for one clinic. Vercel Hobby is free for demos. Vercel asks for a paid plan for commercial sites, so check their current terms before the clinic goes live.
- **Not included yet.** WhatsApp or SMS reminders, billing and invoices, online payments, staff roles beyond one staff level, an audit log, automatic backups. Each is a separate piece of work.
- **Backups.** The free plan has no automatic backups. Export the database from the Google Cloud console on a schedule, or move to the Blaze plan.
- **Patient privacy.** This holds health related data. Add a privacy notice to the website, collect only what the clinic needs, and get the clinic's legal advice on India's data protection rules before going live.
- **Time zone.** All slot logic runs on Indian time, whatever the server's time zone.
- **Rate limit records.** The `rateLimits` collection grows slowly. You can delete old documents there now and then.

## 11. If something goes wrong

| Message or symptom | Fix |
| --- | --- |
| "Setup needed" on the front desk | `.env.local` is missing or incomplete. Restart `npm run dev` after editing it. |
| "The booking system is not set up yet" | Same cause on the public site. |
| Sign in says "Wrong username or password" | Run `create-staff` again for that username. |
| Sign in says "This account is not allowed here" | The account was not made with `create-staff`. |
| Error mentioning `private key` or `DECODER` | `FIREBASE_PRIVATE_KEY` lost its `\n` characters or quotes. Paste it again from the JSON file. |
| Error "The query requires an index" | Open the link in the error and click Create index. The app avoids these, so tell the developer if you see one. |
| `/admin` shows 404 online | `ALLOW_ADMIN_PATH` is not `true`, or you are on the public domain after setting up the admin domain. Use the admin subdomain. |

## 12. Folder guide

```
app/                 Pages and API routes
  page.tsx           Public landing page
  admin/             Front desk pages (login, schedule, patients)
  api/               Booking, slots and staff API
components/          Booking form, schedule, patients screens
lib/clinic.ts        Clinic details and booking rules (edit this)
lib/data.ts          All database reads and writes
lib/auth.ts          Staff session check
middleware.ts        Splits public site and admin site by address
firestore.rules      Database lock (publish this in Firebase)
scripts/             create-staff and seed
tests/               Booking rule tests
```
