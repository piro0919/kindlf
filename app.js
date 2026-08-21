const COVER = asin => `https://m.media-amazon.com/images/P/${asin}.09.LZZZZZZZ.jpg`;
// Kindle アプリへの引き渡し。実機で通るかは未検証。駄目なら OPEN を差し替える
const OPEN = asin => `https://read.amazon.co.jp/?asin=${asin}`;

const grid = document.getElementById('grid');
const tagBar = document.getElementById('tags');
const empty = document.getElementById('empty');
const q = document.getElementById('q');

let books = [];
let active = null;

const norm = s => (s || '').toLowerCase();

function render() {
  const term = norm(q.value).trim();
  const shown = books.filter(b => {
    if (active && !(b.tags || []).includes(active)) return false;
    if (!term) return true;
    return norm(b.title).includes(term) || norm(b.author).includes(term);
  });

  grid.replaceChildren(...shown.map(b => {
    const a = document.createElement('a');
    a.className = 'book';
    a.href = OPEN(b.asin);
    a.innerHTML = `
      <img src="${COVER(b.asin)}" alt="" loading="lazy" decoding="async">
      <span class="t"></span>
      <span class="a"></span>`;
    a.querySelector('.t').textContent = b.title;
    a.querySelector('.a').textContent = b.author || '';
    return a;
  }));
  empty.hidden = shown.length > 0;
}

function renderTags() {
  const all = [...new Set(books.flatMap(b => b.tags || []))].sort();
  tagBar.replaceChildren(...all.map(t => {
    const btn = document.createElement('button');
    btn.className = 'tag';
    btn.type = 'button';
    btn.textContent = t;
    btn.setAttribute('aria-pressed', String(active === t));
    btn.addEventListener('click', () => {
      active = active === t ? null : t;
      renderTags();
      render();
    });
    return btn;
  }));
}

q.addEventListener('input', render);

// books.json が無い間は同梱の見本で動かす
const load = () => fetch('books.json').then(r => r.ok ? r.json() : Promise.reject())
  .catch(() => fetch('books.example.json').then(r => r.json()));

load()
  .then(data => { books = data; renderTags(); render(); })
  .catch(() => { empty.textContent = '蔵書データを読み込めませんでした'; empty.hidden = false; });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
