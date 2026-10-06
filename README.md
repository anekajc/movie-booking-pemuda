# Movie Night Seat Booking

A small seat-booking app for the church movie fellowship.

- `/` shows the seat map. A guest picks **one** free seat.
- `/booking?seat=C5` is where the guest enters a name and WhatsApp number. Each phone number can book only one seat.
- `/sukses` shows the confirmation ticket and the event details.
- `/admin` is password-protected. It shows counts, the registrant list with WhatsApp links, delete (which frees the seat), and a reset for the next event.

Stack: Next.js 16 · PostgreSQL · Tailwind CSS · Docker (deployed with Coolify).

---

## 1. Change the event details and seat layout

Edit **`src/config/event.ts`**:

| Setting | What it does |
| --- | --- |
| `event.title / movie / date / time / location / note` | Text shown on every page |
| `seating.rows` | Row labels, front to back. Example: `["A","B","C","D","E","F"]` |
| `seating.seatsPerRow` | Number of seats in each row |
| `seating.aisleAfter` | Draws an aisle gap after these seat numbers. Example: `[5]` |
| `seating.blocked` | Seats that can't be booked, such as reserved seats. Example: `["A1","A2"]` |
| `whatsappReminder()` | Message pre-filled when the admin taps a phone number |

Commit and push the change. Coolify then redeploys automatically.

---

## 2. Create the PostgreSQL database in Coolify

1. Open Coolify, go to your **Project**, then **+ New**, then **Database**, then **PostgreSQL** (version 17 or 16). Choose the **same server** the app will run on.
2. In the database settings, set:
   - **Initial Database**: `movie_order`
   - **Username** / **Password**: anything you like. Coolify can generate a strong password.
3. Click **Start** and wait for the status to turn green (*Running*).
4. Copy the **Postgres URL (internal)**. It looks like:
   ```
   postgres://postgres:XXXXXXXX@abc123xyz:5432/movie_order
   ```
   This becomes the app's `DATABASE_URL`. The internal URL only works between containers on the same server, which keeps the database off the public internet.
5. Recommended: open the **Backups** tab and add a scheduled backup, for example daily.

You don't need to create the table yourself. The app runs `db/schema.sql` every time it starts, and that script is safe to run repeatedly.
To create it by hand anyway, open the database resource in Coolify, go to **Terminal**, and run:
```bash
psql -U postgres -d movie_order
```
Then paste the contents of `db/schema.sql`.

> **Looking at the data with a GUI (DBeaver, pgAdmin, TablePlus):** don't leave the database public. Either use an SSH tunnel to the VPS, or turn on *Make it publicly available* in Coolify for a short time and turn it off when you're done.

---

## 3. Deploy the app in Coolify

1. Push this folder to a **private GitHub repo**:
   ```bash
   git init
   git add .
   git commit -m "Movie night booking app"
   git branch -M main
   git remote add origin git@github.com:<you>/movie-order.git
   git push -u origin main
   ```
2. In Coolify, go to **+ New**, then **Private Repository (with GitHub App)**. If you haven't connected GitHub yet, Coolify walks you through installing its GitHub App. Then pick the repo and the `main` branch.
3. Settings:
   - **Build Pack**: `Dockerfile`
   - **Ports Exposes**: `3000`
   - **Domains**: `https://nonton.yourdomain.org`
4. At your DNS provider, add an **A record**: `nonton` pointing to your VPS IP. Coolify then issues the HTTPS certificate automatically.
5. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the *internal* Postgres URL from step 2.4 |
   | `ADMIN_PASSWORD` | password for `/admin` |
   | `SESSION_SECRET` | a long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

6. Click **Deploy**. The deployment log should end with `[migrate] schema is up to date` and then `Ready`.
7. Open `https://nonton.yourdomain.org` and test a booking. Then open `/admin`, log in, and delete the test booking.

Every `git push` to `main` redeploys the app automatically.

### Troubleshooting
- **`[migrate] failed: getaddrinfo ENOTFOUND ...`**: the app can't reach the database. Make sure you used the *internal* URL and that both resources are on the same server and network. If they still can't connect, enable **Connect to Predefined Network** on the app.
- **Admin login keeps returning to the password screen**: open the site over `https://`. The login cookie is "secure" in production.

---

## 4. Running locally (Windows)

Requirements: Node.js 22, and Docker Desktop (or a local PostgreSQL).

```bash
# start a local database
docker run -d --name movie-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=movie_order -p 5433:5432 postgres:17-alpine

# create .env.local (see .env.example)
#   DATABASE_URL=postgres://postgres:dev@localhost:5433/movie_order
#   ADMIN_PASSWORD=rahasia123
#   SESSION_SECRET=any-local-secret-at-least-16-chars

npm install
npm run migrate
npm run dev        # http://localhost:3000
```

---

## Project layout

```
db/schema.sql              the bookings table
scripts/migrate.mjs        applies the schema (runs on every container start)
src/config/event.ts        event details + seat layout  ← edit this
src/lib/                   db, seat layout, phone normalisation, admin session
src/components/            seat map, seat picker, event info
src/app/page.tsx           seat selection
src/app/booking/           name + phone form, booking server action
src/app/sukses/            confirmation ticket
src/app/admin/             login, dashboard, delete/reset actions
```

Phone numbers are stored in international form (`0812…` and `+62 812…` both become `62812…`). That way the same number can't register twice, and the WhatsApp links (`https://wa.me/62…`) work.
