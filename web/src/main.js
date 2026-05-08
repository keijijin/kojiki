import './styles.css';

const main = document.getElementById('main');
const navEl = document.getElementById('site-nav');
const navToggle = document.querySelector('.nav-toggle');

let manifest = null;

async function loadManifest() {
  if (!manifest) {
    const r = await fetch('/data/manifest.json');
    manifest = await r.json();
  }
  return manifest;
}

function renderNav() {
  navEl.innerHTML = manifest.nav
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join('');
}

function setMain(html, withSidebar = false) {
  main.innerHTML = html;
  main.classList.toggle('has-sidebar', withSidebar);
}

function homePage() {
  const movieCard = manifest.movie
    ? `
      <a class="card" href="#/movie">
        <h2>紹介ビデオ</h2>
        <p>古事記の概要を動画でつかむ。</p>
      </a>
    `
    : '';
  const slideCard = `
      <a class="card" href="#/slide">
        <h2>スライド</h2>
        <p>概要をPDF/画像でまとめて見る。</p>
      </a>
    `;
  setMain(`
    <div class="hero">
      <h1>古事記を読む</h1>
      <p class="lead">${manifest.description}</p>
    </div>
    <div class="cards">
      ${movieCard}
      ${slideCard}
      <a class="card" href="#/kochu/jo-ue">
        <h2>校註・書き下し文</h2>
        <p>ルビと脚註付きの本文。上・中・下の三巻。</p>
      </a>
      <a class="card" href="#/gendaigo/jo-ue">
        <h2>現代語譯</h2>
        <p>武田祐吉訳の現代語で、まず物語の筋を楽しめます。</p>
      </a>
      <a class="card" href="#/monogatari">
        <h2>古事記物語</h2>
        <p>鈴木三重吉による語り口の物語抄。</p>
      </a>
      <a class="card" href="#/kaisetsu">
        <h2>解説</h2>
        <p>成立・帝紀と本辞・文体など、読むための背景。</p>
      </a>
      <a class="card" href="#/hanrei">
        <h2>凡例</h2>
        <p>記号・ルビ・注の読み方。</p>
      </a>
      <a class="card" href="#/sakuin-go">
        <h2>語索引</h2>
        <p>用語から本文位置をたどる索引。</p>
      </a>
      <a class="card" href="#/sakuin-kayo">
        <h2>歌謠・各句索引</h2>
        <p>歌や各句の出典を引く索引。</p>
      </a>
    </div>
  `);
}

function volumeSubnav(base, volumes, currentId, labels) {
  return `<nav class="subnav">${volumes
    .map((id) => {
      const active = id === currentId ? 'is-active' : '';
      const label = labels[id] || id;
      return `<a class="${active}" href="#/${base}/${id}">${label}</a>`;
    })
    .join('')}</nav>`;
}

const volLabels = {
  'jo-ue': '上（序含む）',
  chu: '中',
  ge: '下',
};

async function readerPage(kind, volId) {
  const file = kind === 'kochu' ? 'kochu.json' : 'gendaigo.json';
  const r = await fetch(`/data/${file}`);
  const data = await r.json();
  const vol = data.volumes.find((v) => v.id === volId) || data.volumes[0];

  const wrap = document.createElement('div');
  wrap.innerHTML = vol.html;
  const h2list = [...wrap.querySelectorAll('h2')];
  const toc = [];
  h2list.forEach((h, i) => {
    const id = `sec-${i}`;
    h.id = id;
    toc.push({ id, text: h.textContent.trim().slice(0, 100) });
  });

  const sidebar =
    toc.length > 0
      ? `<aside class="side-toc" id="side-toc"><h2>この巻の見出し</h2>${toc
          .map((h) => `<a href="#" data-jump="${h.id}">${escapeAttr(h.text)}</a>`)
          .join('')}</aside>`
      : '';

  setMain(
    `
    ${sidebar}
    <article class="content">
      <h1 class="page-title">${kind === 'kochu' ? '校註・古事記' : '現代語譯・古事記'}</h1>
      ${volumeSubnav(kind, manifest[`${kind}Volumes`], vol.id, volLabels)}
      <h2 style="font-size:1.1rem;margin:0 0 1rem;color:var(--muted);font-weight:600;">${escapeAttr(vol.title)}</h2>
      <div class="reader-toolbar">
        <label><input type="checkbox" id="toggle-ruby" checked /> ルビを表示</label>
      </div>
      <div class="reader-body" id="reader-body"></div>
    </article>
  `,
    Boolean(sidebar)
  );

  const bodyEl = document.getElementById('reader-body');
  bodyEl.append(...wrap.childNodes);

  document.getElementById('toggle-ruby')?.addEventListener('change', (e) => {
    document.body.classList.toggle('hide-ruby', !e.target.checked);
  });

  document.getElementById('side-toc')?.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-jump]');
    if (!a) return;
    e.preventDefault();
    document.getElementById(a.dataset.jump)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
}

/** readerPage が innerHTML したあと h2 に id を付ける */
function patchReaderHeadings() {
  const body = document.getElementById('reader-body');
  if (!body) return;
  let n = 0;
  body.querySelectorAll('h2').forEach((h) => {
    if (!h.id) h.id = `sec-${n++}`;
  });
}

async function monogatariList() {
  const r = await fetch('/data/monogatari.json');
  const data = await r.json();
  const items = data.stories
    .map(
      (s) =>
        `<li><a href="#/monogatari/${encodeURIComponent(s.id)}">${escapeAttr(s.title)}</a></li>`
    )
    .join('');
  setMain(`
    <article class="content">
      <h1 class="page-title">古事記物語</h1>
      <p style="color:var(--muted);margin-top:0">鈴木三重吉</p>
      <ul class="story-list">${items}</ul>
    </article>
  `);
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

async function monogatariStory(id) {
  const r = await fetch('/data/monogatari.json');
  const data = await r.json();
  const story = data.stories.find((s) => s.id === decodeURIComponent(id));
  if (!story) {
    setMain('<p>該当する話が見つかりません。</p>');
    return;
  }
  setMain(`
    <article class="content">
      <p style="margin:0 0 0.5rem"><a href="#/monogatari">← 話の一覧</a></p>
      <h1 class="page-title">${escapeAttr(story.title)}</h1>
      <div class="reader-toolbar">
        <label><input type="checkbox" id="toggle-ruby" checked /> ルビを表示</label>
      </div>
      <div class="reader-body" id="reader-body">${story.html}</div>
    </article>
  `);
  document.getElementById('toggle-ruby')?.addEventListener('change', (e) => {
    document.body.classList.toggle('hide-ruby', !e.target.checked);
  });
  patchReaderHeadings();
}

async function staticJsonPage(file, defaultTitle) {
  const r = await fetch(`/data/${file}`);
  const data = await r.json();
  setMain(`
    <article class="content">
      <h1 class="page-title">${escapeAttr(data.title || defaultTitle)}</h1>
      <div class="reader-body">${data.html}</div>
    </article>
  `);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function moviePage() {
  if (!manifest.movie) {
    setMain('<p>紹介ビデオが見つかりません。</p>');
    return;
  }
  const m = manifest.movie;
  setMain(`
    <article class="content">
      <h1 class="page-title">紹介ビデオ</h1>
      <p style="color:var(--muted);margin-top:0">${escapeAttr(m.title)}（${formatBytes(m.bytes)}）</p>
      <div class="video-wrap">
        <video class="video" controls preload="metadata" playsinline>
          <source src="${m.src}" type="video/mp4" />
          お使いのブラウザは video タグに対応していません。
        </video>
      </div>
      <p class="video-actions">
        <a class="btn" href="${m.src}" download>動画をダウンロード</a>
      </p>
    </article>
  `);
}

function slidePage() {
  const pdf = '/slide/The_Genesis_Blueprint.pdf';
  const img = '/slide/日本誕生物語.png';
  setMain(`
    <article class="content">
      <h1 class="page-title">スライド</h1>
      <p style="color:var(--muted);margin-top:0">
        PDFと画像で概要をまとめています。
      </p>
      <p class="video-actions">
        <a class="btn" href="${pdf}" target="_blank" rel="noopener noreferrer">PDFを開く</a>
        <a class="btn" href="${pdf}" download>PDFをダウンロード</a>
      </p>
      <div style="border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--surface);">
        <iframe
          title="The Genesis Blueprint"
          src="${pdf}"
          style="width:100%;height:min(80vh,900px);border:0;display:block;"
          loading="lazy"
        ></iframe>
      </div>
      <h2 style="margin-top:2rem">画像（日本誕生物語）</h2>
      <p style="margin:0.5rem 0 0">
        <a href="${img}" target="_blank" rel="noopener noreferrer">画像を別タブで開く</a>
      </p>
      <p style="margin:1rem 0 0">
        <img src="${img}" alt="日本誕生物語" style="max-width:100%;height:auto;border-radius:14px;border:1px solid var(--border);" loading="lazy" />
      </p>
    </article>
  `);
}

async function route() {
  await loadManifest();
  renderNav();
  const raw = location.hash.replace(/^#\/?/, '').trim();
  const parts = raw.split('/').filter(Boolean);

  if (parts.length === 0) {
    homePage();
    return;
  }

  const [a, b] = parts;
  if (a === 'movie') {
    moviePage();
    return;
  }
  if (a === 'slide') {
    slidePage();
    return;
  }
  if (a === 'kochu' && b) {
    await readerPage('kochu', b);
    return;
  }
  if (a === 'kochu') {
    location.hash = '#/kochu/jo-ue';
    return;
  }
  if (a === 'gendaigo' && b) {
    await readerPage('gendaigo', b);
    return;
  }
  if (a === 'gendaigo') {
    location.hash = '#/gendaigo/jo-ue';
    return;
  }
  if (a === 'monogatari' && b) {
    await monogatariStory(b);
    return;
  }
  if (a === 'monogatari') {
    await monogatariList();
    return;
  }
  if (a === 'hanrei') {
    await staticJsonPage('hanrei.json', '凡例');
    return;
  }
  if (a === 'kaisetsu') {
    await staticJsonPage('kaisetsu.json', '解説');
    return;
  }
  if (a === 'sakuin-go') {
    await staticJsonPage('sakuin-go.json', '語索引');
    return;
  }
  if (a === 'sakuin-kayo') {
    await staticJsonPage('sakuin-kayo.json', '歌謠索引');
    return;
  }

  homePage();
}

navToggle?.addEventListener('click', () => {
  navEl.classList.toggle('is-open');
});

window.addEventListener('hashchange', route);
route();
