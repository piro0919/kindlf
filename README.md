# Kindlf

Kindle plus shelf. A small PWA that lays out your Kindle library the way you
want it. Install it to the home screen and it opens full screen, with no
browser chrome in the way.

The Kindle app changed its library UI and became harder to read. This does not
try to fix that app, and it does not try to wrap the Kindle web reader either
— Amazon's sign-in page sends `X-Frame-Options: SAMEORIGIN`, so nobody can put
it in an iframe. Instead this is a page of your own: your layout, your grid,
your sort order. The only thing it borrows from Amazon is the cover image for
each ASIN. Tapping a book hands off to Kindle to do the actual reading.

Your library never leaves the device. There is no database and no account —
the book list lives in IndexedDB in your browser.

## Run it

```bash
npm install
npm run dev
```

Anything that runs Node and Python works — macOS, Windows, Linux.

Next.js 16, React 19, TypeScript, Tailwind 4. Put `books.json` in `public/` and
the shelf reads it; without one it falls back to `public/books.example.json`, so
a fresh clone shows something straight away.

`npm run build` is pinned to `--webpack`. Next 16 builds with Turbopack by
default, and that collides with the webpack config Serwist installs.

Press the install button in the header. On Chrome, Edge and most Android
browsers that opens the browser's own install prompt; on iOS and iPadOS, where
no such prompt exists, it walks you through **Share → Add to Home Screen**
instead. Either way the manifest declares `display: standalone`, so launching
from the icon gives you no toolbar. On iOS 26, leave the "Open as Web App"
toggle on.

Service workers need HTTPS anywhere other than `localhost`, so offline support
only kicks in on a deployed build.

## Your library

Books live in IndexedDB on whichever device you loaded them onto. Nothing is
synced and there is no account. To put the same library on a second device,
open the settings screen on both, press **送る** on the one that has it, and
type the six digits it shows into the other. The two browsers connect directly;
only the introduction goes through a public Nostr relay, and the books
themselves never touch it.

Internally a library is an array:

```json
{ "asin": "B0CVTYT329", "title": "Some Book", "author": "", "acquired": "2026-01-15T09:00:00.000Z", "lastRead": "2026-03-02T11:20:00.000Z" }
```

Only `asin` matters; the rest is for display. Books are sorted by whichever is
later, `acquired` or `lastRead` — so a book you just bought and a book you are
partway through both stay near the top.

### Importing from Amazon

Amazon will hand you your own data if you ask. Go to **Request My Data**, pick
Kindle, and wait. The confirmation screen says a month; mine landed the next
day. What arrives is `Kindle.zip` — hand that straight to the settings screen
and the app reads it in place. 45 MB and 15,563 files went through in under a
second, and nothing leaves the browser.

Inside the zip, `Digital.Content.Ownership/` holds one JSON file per title, and
`Digital.Content.Whispersync/whispersync.csv` records when each one was last
open — that survives across devices, which is where `lastRead` comes from. The
app keeps the ones where `resourceType` is `KindleEBook`, `originType` is
`Purchase`, and `rightStatus` is `Active` — so samples, Kindle Unlimited, Prime
Reading, dictionaries and apps all drop out. A title can carry several rights
records, so they get deduplicated by ASIN. For me, 15,563 records came down to
2,039 books.

The same filtering also exists as a script, for when you would rather batch it
on a computer:

```bash
python3 scripts/import-ownership.py ~/Downloads/Kindle.zip
```

Keep the two in step. `src/lib/disclosure.ts` and the script must agree, or a
`books.json` built on a computer will not match what the app produces.

Nothing here scrapes Amazon. The Amazon.co.jp conditions of use say the licence
they grant "does not include any use of data mining, robots, or similar data
gathering and extraction tools," which is exactly why the import goes through
the official disclosure request instead.

Authors are not in the disclosure data, so `author` comes out empty.

### Keeping up with new purchases

Ask again. Each disclosure request is a snapshot, but one arriving in a day or
two is quick enough to treat as a refresh: file a request when you think of it,
run the importer over the new zip, load it on your devices. Run it monthly and
the shelf is never more than a few days behind, which is close enough for a
sort order built on what you bought and read recently.

Nothing automates this, and nothing needs to. Parsing the order confirmation
emails Amazon sends you would close the last few days of lag, at the cost of a
mail integration nobody asked for.

## Covers

`https://m.media-amazon.com/images/P/{ASIN}.09.LZZZZZZZ.jpg` returns the
artwork. An ASIN that does not exist gives you a 43-byte GIF instead, so a
blank card usually means a typo.

The service worker keeps covers in a `covers` cache. After the first look at a
shelf it stops going to the network, and the grid still fills in offline.

## Privacy

`public/books.json` is your whole reading history, which is why it is in
`.gitignore`. Deploy it and anyone with the URL can read the lot, so keep it
local and let the browser hold your copy instead.

## Icons

```bash
python3 scripts/build-icons.py
```

Python only, no image library. macOS in particular ships no SVG rasteriser that
preserves transparency, so rather than pull in a dependency for one platform the
script writes the PNG pixels directly.

## Known gaps

- New purchases only show up when you file another disclosure request and
  import the result. There is no automatic sync.
- Search, sorting options and series grouping are not in the UI. Series
  grouping by title exists in the history, at `Rebuild the shelf on Next.js`.
- Opening a book points at `https://read.amazon.co.jp/?asin={ASIN}`. Whether
  that hands off to an installed Kindle app or just opens the web reader has
  not been checked on any platform — swap `openUrl` in `src/lib/books.ts` if it
  misbehaves.
- The importer only knows about the `.co.jp` disclosure layout. Other
  marketplaces may name things differently.

## Licence

MIT
