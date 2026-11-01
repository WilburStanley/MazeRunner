# Maze Runner

A maze game where **every maze is a short ID**. Share the ID and everyone plays the exact same maze. Every time is checked by the API, so nobody has to take your word for it. There is no database: the whole app is stateless and runs on the free Vercel Hobby plan.

- **Live app:** https://mazerunner-genesis.vercel.app
- **Repo:** https://github.com/WilburStanley/mazerunner-genesis
- **Built for:** the FlyRank "Your 10x Solution" capstone

## What it does

- **Play any maze by ID.** `M1-K-21-7QX4D2-F` means: version 1, Kruskal algorithm, 21 × 21 cells, seed `7QX4D2`, checksum `F`. The same ID always builds the same maze.
- **Daily maze.** One shared maze per day (changes at 00:00 UTC).
- **Verified times.** The API replays your recorded moves through the maze and measures the time with its own clock. The browser never reports a time.
- **Challenge a friend online.** After a run you get a signed **challenge ID** (`C1-…`) and a link. A friend opens it, sees your time to beat, and the result screen tells them who won and by how much.
- **Challenge a friend on paper.** Download a printable PDF with your time on it, or print a blank maze for anyone.
- **Controls:** W/A/S/D, arrow keys, or the on-screen pad on touch screens.

## How to play

**Goal.** Get from the small dot in the top-left corner to the ring in the bottom-right corner as fast as you can, using as few wrong turns as you can. Every maze has exactly one route.

### Start a game

| You want to | Do this |
|---|---|
| Play today's shared maze | Click **Play daily maze** on the home page. Everyone gets the same maze that day. |
| Make a new maze | Under **New maze**, pick an algorithm and a size, then click **Generate and play**. The preview shows the exact maze you will get. **Shuffle** gives you a different one. |
| Replay a friend's maze | Paste its ID (`M1-…`) into **Play by maze or challenge ID** and click **Load**. |
| Beat a friend's time | Paste their challenge ID (`C1-…`) into the same box, or open the link they sent. |

**Algorithm.** *Kruskal* makes winding mazes with many dead ends (harder). *Binary Tree* makes mazes with a steady diagonal lean (easier).
**Size.** 11, 21, 31 or 41 cells per side. Bigger means longer runs.

### Run a maze

1. The maze stays hidden until you press **Start run**, so nobody can study the layout on a stopped clock. You can add an optional **nickname** first (up to 20 letters, numbers, spaces, `.`, `_` or `-`).
2. The clock starts when you press **Start run**.
3. Move with **W / A / S / D**, the **arrow keys**, or the **on-screen pad** on a phone or tablet. Hold a direction to keep moving.
4. Walking into a wall just bumps you back. Only real steps count as moves.
5. Press **R** (or **Restart**) to start over at any time.
6. Reach the ring. The API checks your moves and shows **Verified run** with your time and move count.

The timer you see while running is only a display. The time on the result screen is measured by the API, and your moves are replayed through the maze to make sure they are legal. A run that is impossibly fast, or whose token is older than 2 hours, is rejected.

### After a run

- **Play again** restarts the same maze.
- **New maze** goes back to the home page.
- **Copy ID** copies the maze ID, so friends can play the same maze.

### Challenge a friend

Open **Challenge a friend** on the result screen. There are two ways:

**Online (challenge ID).**
1. Click **Copy link** (or **Copy ID**).
2. Send it to a friend. Anyone with the link, or the `C1-…` ID pasted on the home page, plays your maze.
3. Before they start, they see an orange box with your time to beat, such as "Can you beat Ana's time?".
4. After their run, their result says who won and by how much: "You beat Ana by 3.2s", "Ana wins by 1.1s" or "Dead heat with Ana".

The time and name inside a challenge ID are signed, so nobody can edit them to fake a better score.

**On paper (PDF).**
1. Tick what should appear on the sheet:
   - **Name**: your nickname (only offered if you gave one).
   - **Time to beat**: your verified time.
   - **Maze ID and play link**: so the friend can play it online too.
   - **Route**: draws the answer on the maze. It is **off by default**, because it spoils the maze.
2. Click **Download challenge sheet**. The headline reads "Can you beat *name*'s time?", or "Can you beat this time?" if the name is off.
3. Print it, solve the maze with a pen, and write your own name and time at the bottom.

A challenge sheet can only be made from a verified run. For a sheet with no time on it, use **Print blank maze** on the home page, on the start panel, or on the result screen.

## Tech stack

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 plus a hand-written design system in `src/app/globals.css` |
| PDF | `pdf-lib` |
| Tests | Vitest |
| Hosting | Vercel Hobby (free) |
| Cost | $0 |

## Run it locally

You need Node.js 20 or newer.

```bash
git clone https://github.com/WilburStanley/mazerunner-genesis.git
cd mazerunner-genesis
npm install
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder with your own secret. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm test            # run the test suite
npm run typecheck   # TypeScript, no emit
npm run lint        # ESLint
npm run build       # production build
```

### Environment variables

| Name | Required | Purpose |
|---|---|---|
| `SIGNING_SECRET` | Yes | Signs run tokens, result tokens and challenge IDs. Never commit it. Set it in `.env.local` locally and in the Vercel dashboard when deployed. |

`.env*` files are ignored by Git. Only `.env.example` (placeholder text, no real value) is committed.

## Concepts → code

| Concept | What it means here | Where to look |
|---|---|---|
| **API endpoints** | Six routes with validated input, clear status codes (`400`, `401`, `422`) and JSON errors | `src/app/api/**/route.ts`, rules in `src/lib/run.ts` |
| **Reporting / PDF** | A printable blank maze, and a challenge sheet built from a verified result | `src/lib/pdf/*`, `src/app/api/maze/[id]/pdf/route.ts`, `src/app/api/challenge/pdf/route.ts` |
| **Caching** | A maze and its PDF depend only on the ID, so they are sent with an immutable `Cache-Control` header | `src/lib/http.ts` (`IMMUTABLE_CACHE_CONTROL`), proof below |
| **Test suite** (instead of a database) | 145 tests in 22 files cover IDs, generation, replay, tokens, PDFs and every API route | `tests/*.test.ts` |
| **Deployment** (instead of background jobs) | Live on Vercel's free plan, with the secret kept in the dashboard | https://mazerunner-genesis.vercel.app |

### The API

| Method and path | What it does | Cached |
|---|---|---|
| `GET /api/maze/{id}` | The maze for a valid ID | Forever (immutable) |
| `GET /api/daily` | Today's date and maze ID | 60 seconds |
| `POST /api/run/start` | Takes `{ mazeId }`, returns a signed `runToken` | No |
| `POST /api/run/finish` | Takes `{ runToken, moves, nickname }`. Replays the moves, measures the time, returns the verified result, a `resultToken` and a `challengeId` | No |
| `GET /api/maze/{id}/pdf` | Blank printable maze sheet | Forever (immutable) |
| `GET /api/challenge/pdf?code=…` | Challenge sheet built from a signed `resultToken`. Optional toggles: `name`, `time`, `path`, `seed` (`1` or `0`) | Forever (immutable) |

Error responses look like `{"error":"invalid-maze-id"}` and are never cached (`no-store`).

## How the trust works (no database)

The API stores nothing, so signed values carry the proof:

1. **Start.** `POST /api/run/start` returns a **run token**: the maze ID and the start time, signed with `SIGNING_SECRET`.
2. **Finish.** `POST /api/run/finish` checks the token's signature, replays the moves through the maze (walls, route, finish), and measures the time from its own clock. Impossibly fast times (under 50 ms per move) and stale tokens (over 2 hours) are rejected.
3. **Share.** The result is signed again as a **result token** (used by the PDF) and as a short **challenge ID**: `C1-<algorithm>-<size>-<seed>-<time>-<name>-<signature>`. Edit one character and the signature no longer matches.

The signature proves the API issued the time. The move replay is what keeps the time honest.

## Caching proof

The blank PDF depends only on the maze ID, so it is built deterministically (fixed document dates) and sent with an immutable header. Checked on the live app:

```bash
curl -I https://mazerunner-genesis.vercel.app/api/maze/M1-K-21-7QX4D2-F/pdf
```

First request (the CDN builds and stores it):

```
HTTP/1.1 200 OK
Age: 0
Cache-Control: public, max-age=31536000, immutable
Content-Disposition: attachment; filename="maze-M1-K-21-7QX4D2-F-blank.pdf"
Content-Type: application/pdf
X-Vercel-Cache: MISS
```

Second request (served from the CDN, same `Date` as the first):

```
HTTP/1.1 200 OK
Age: 82
Cache-Control: public, max-age=31536000, immutable
Content-Type: application/pdf
X-Vercel-Cache: HIT
```

The app sends `public, max-age=31536000, s-maxage=31536000, immutable`. Vercel's CDN uses `s-maxage` for its own cache and removes it from the response, which is why only `max-age` shows above. A test (`tests/pdf-api.test.ts`) checks the header the app itself sends.

Bad input is rejected and never cached:

```bash
curl -i https://mazerunner-genesis.vercel.app/api/maze/M1-K-99-AAAAAA-Z/pdf
# 400 {"error":"invalid-maze-id"}   Cache-Control: no-store

curl -i "https://mazerunner-genesis.vercel.app/api/challenge/pdf?code=nope"
# 401 {"error":"invalid-token"}     Cache-Control: no-store
```

## Demo path (2 minutes)

1. Open https://mazerunner-genesis.vercel.app (works on a phone too).
2. Click **Play daily maze**, or pick an algorithm and size and click **Generate and play**.
3. Type a nickname, press **Start run**, and reach the ring with W/A/S/D, the arrow keys or the on-screen pad.
4. See the **Verified run** screen with your time and moves.
5. Open **Challenge a friend**. Click **Copy link**.
6. Open that link in a private window. You see "Can you beat *name*'s time?" with the time to beat. Finish the run and read who won.
7. Back on the result screen, choose which items go on the printed sheet (name, time, maze ID, route) and click **Download challenge sheet**.
8. On the home page, click **Print blank maze** for a blank sheet.

## Sample data

Maze IDs to try (they always build the same maze):

| ID | What it is |
|---|---|
| `M1-K-21-7QX4D2-F` | 21 × 21, Kruskal |
| `M1-B-11-M35SW6-1` | 11 × 11, Binary Tree |
| `M1-B-41-M35SW6-K` | 41 × 41, Binary Tree |

The checksum (last character) is computed by the app. An ID with a wrong checksum is rejected, so typos are caught.

**Challenge IDs** depend on the secret key, so a sample ID from one deployment would not work on another. To get one, finish any run and copy the ID from **Challenge a friend**. The format is `C1-K-21-7QX4D2-<time>-<name>-<signature>`.

## Design notes and trade-offs

- **Stateless on purpose.** No database means no cost, no accounts and nothing to leak. The trade-off is that there is no global leaderboard. Challenges are between people who share an ID.
- **Binary Tree is biased.** It is quick and simple, and its mazes lean diagonally. Its open edges lead away from the finish, so there is no shortcut along the border (a test checks this). Kruskal mazes are the harder ones.
- **Perfect mazes.** Every maze is a spanning tree, so there is exactly one route between any two cells. The PDF's optional route and the solver both rely on that.
- **Secrets.** Only `.env.example` is committed. The real `SIGNING_SECRET` lives in `.env.local` and in Vercel's environment settings. Changing it invalidates all existing challenge IDs.