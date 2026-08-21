# Kindlf

Kindle plus shelf. A small PWA that lays out your Kindle library the way you
want it. Add it to the iPad home screen and it opens full screen, with no
Safari toolbar in the way.

The Kindle app changed its library UI and became harder to read. This does not
try to fix that app, and it does not try to wrap the Kindle web reader either
— Amazon's sign-in page sends `X-Frame-Options: SAMEORIGIN`, so nobody can put
it in an iframe. Instead this is a plain static page of your own: your HTML,
your CSS, your grid. The only thing it borrows from Amazon is the cover image
for each ASIN. Tapping a book hands off to Kindle to do the actual reading.

## Run it

```bash
python3 -m http.server 8787
```

Open `http://<your-mac>:8787/` in Safari on the iPad, then **Share → Add to
Home Screen**. The manifest declares `display: standalone`, so launching from
the icon gives you no toolbar. On iOS 26, leave the "Open as Web App" toggle on.

Without `books.json` the page falls back to `books.example.json`, so a fresh
clone shows something straight away.

If you want it around permanently, host the directory somewhere. Service
workers need HTTPS anywhere other than `localhost`, so the offline cache stays
off until you serve it over TLS.

## Your library

`books.json` is an array:

```json
{ "asin": "B0CVTYT329", "title": "Some Book", "author": "", "acquired": "2026-01-15T09:00:00.000Z" }
```

Only `asin` matters; the rest is for display. Books are sorted by `acquired`,
newest first.

### Importing from Amazon

Amazon will hand you your own data if you ask. Go to **Request My Data**, pick
Kindle, and wait — mine took about a month. Then:

```bash
python3 scripts/import-ownership.py ~/Downloads/Kindle.zip
```

Inside the zip, `Digital.Content.Ownership/` holds one JSON file per title. The
script keeps the ones where `resourceType` is `KindleEBook`, `originType` is
`Purchase`, and `rightStatus` is `Active` — so samples, Kindle Unlimited, Prime
Reading, dictionaries and apps all drop out. A title can carry several rights
records, so they get deduplicated by ASIN. For me, 15,563 records came down to
2,039 books.

Nothing here scrapes Amazon. The Amazon.co.jp conditions of use say the licence
they grant "does not include any use of data mining, robots, or similar data
gathering and extraction tools," which is exactly why the import goes through
the official disclosure request instead.

Authors are not in the disclosure data, so `author` comes out empty.

### Keeping up with new purchases

Unsolved. The disclosure request is a one-time snapshot and says nothing about
what you buy tomorrow. Order confirmation emails carry both the title and a
link with the ASIN, and Amazon sent those to you, so parsing your own inbox
looks like the clean way in. Not built yet.

## Covers

`https://m.media-amazon.com/images/P/{ASIN}.09.LZZZZZZZ.jpg` returns the
artwork. An ASIN that does not exist gives you a 43-byte GIF instead, so a
blank card usually means a typo.

The service worker keeps covers in a `covers` cache. After the first look at a
shelf it stops going to the network, and the grid still fills in offline.

## Privacy

`books.json` is your whole reading history, which is why it is in
`.gitignore`. Host it somewhere public and anyone with the URL can read the
lot. Pick where it lives with that in mind.

## Icons

```bash
python3 scripts/build-icons.py
```

macOS ships no SVG rasteriser that preserves transparency, so rather than pull
in a dependency the script writes the PNG pixels directly.

## Known gaps

- Opening a book points at `https://read.amazon.co.jp/?asin={ASIN}`. Whether
  that reaches the Kindle app on an iPad or just opens the web reader is
  untested — swap `OPEN` at the top of `app.js` if it misbehaves.
- The importer only knows about the `.co.jp` disclosure layout. Other
  marketplaces may name things differently.

## Licence

MIT
