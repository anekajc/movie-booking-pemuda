# Movie Night Seat Booking

A small seat-booking app for the church movie fellowship.

- `/` shows the seat map. A guest picks **1 to 6** free seats.
- `/booking?seats=C5,C6` is where the guest enters a name and WhatsApp number for each seat. One number can be reused inside a single booking (for example, parents booking for their kids), but it can't be used again in a separate booking.
- `/tiket/<id>` is the guest's ticket: every seat and name, the event details, a **QR code** and a short ticket code. "Simpan Tiket (Gambar)" downloads the whole ticket as a PNG. The QR holds the ticket link, so scanning it with any phone camera reopens the ticket.
- `/admin` is password-protected and has four tabs:
  - **Pendaftar**: registrants (seats booked together are grouped) with attendance badges. Tapping a phone number opens WhatsApp with a reminder and the person's ticket link. Delete frees a seat. "Arsipkan & mulai acara baru" archives the event and starts a new one with an empty seat map.
  - **Kehadiran**: scan a ticket QR with the phone camera, or type the ticket code. Tick who actually came and save; rescanning later lets you add latecomers. Add **walk-ins** (name required, phone optional) for people who didn't register. It shows the attendance recap and a **Download rekap (Excel)** button.
  - **Pengaturan**: fellowship title, movie title, date, time, location and the seat grid (rows × seats per row).
  - **Riwayat**: archived events, each with its attendance recap, the full list of attendees and an Excel download.

Stack: Next.js 16 · PostgreSQL · Tailwind CSS · Docker (deployed with Coolify).

---

## 1. Change the event details and seat layout

Most settings are edited in the app: **`/admin` → Pengaturan**.

| Field | Notes |
| --- | --- |
| Nama persekutuan, Judul film, Tempat | Shown on every page and in the WhatsApp reminder |
| Tanggal, Jam | Shown as "Sabtu, 17 Oktober 2026 · 18.30 WIB" |
| Jumlah baris × Kursi per baris | Rows are labeled A, B, C…. Up to 26 rows and 30 seats per row. The aisle goes in the middle of each row automatically. |

The preview updates as you type. If shrinking the grid would leave a booked seat outside it, saving is refused. Delete those registrants first, or keep the grid bigger.

A few things are still set in code, in **`src/config/event.ts`**. Commit and push after changing them, and Coolify redeploys:

| Setting | What it does |
| --- | --- |
| `maxSeatsPerBooking` | Maximum seats per booking (default 6) |
| `blockedSeats` | Seats that can't be booked, such as reserved seats. Example: `["A1","A2"]` |
| `arrivalNote` | The "datang lebih awal" note on the ticket page |
| `whatsappReminder()` | Message pre-filled when the admin taps a phone number (includes the ticket link) |

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

Optional: `APP_URL` (for example `https://nonton.yourdomain.org`) fixes the base URL used in ticket QR codes and WhatsApp links. Without it, the app uses the domain the request came in on, which is normally correct behind Coolify.

> The QR scanner uses the phone camera, which browsers only allow over **HTTPS**. It works on your Coolify domain, but not over plain `http://<ip>`.

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
db/schema.sql              events, bookings, walk_ins (also upgrades older databases)
scripts/migrate.mjs        applies the schema (runs on every container start)
src/config/event.ts        defaults, max seats per booking, blocked seats, message texts
src/lib/                   db, settings, seat layout, phone normalisation, admin session
src/components/            seat map, seat picker, event info
src/app/page.tsx           seat selection
src/app/booking/           name + phone form, booking server action
src/app/tiket/[id]/        ticket page with QR; gambar/ renders the ticket as a PNG
src/app/admin/             login, dashboard, delete/reset actions
src/app/admin/kehadiran/   QR scanner, check-in, walk-ins
src/app/admin/pengaturan/  event settings form
src/app/admin/riwayat/     archived events and their recap
src/app/admin/rekap/       Excel export of an event's attendance
assets/fonts/              fonts used to draw the ticket image
```

Phone numbers are stored in international form (`0812…` and `+62 812…` both become `62812…`). That way the same number is recognized however it's typed, and the WhatsApp links (`https://wa.me/62…`) work.
