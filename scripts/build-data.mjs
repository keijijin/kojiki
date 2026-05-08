/**
 * doc/*.txt（青空文庫形式）を読み、web/public/data/*.json を生成する。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DOC = path.join(ROOT, 'doc');
const OUT = path.join(ROOT, 'web', 'public', 'data');
const MANGA_UE_SRC = path.join(ROOT, 'manga', '上');
const MANGA_UE_PUB = path.join(ROOT, 'web', 'public', 'manga', 'ue');
const MANGA_CHU_SRC = path.join(ROOT, 'manga', '中');
const MANGA_CHU_PUB = path.join(ROOT, 'web', 'public', 'manga', 'chu');
const MANGA_GE_SRC = path.join(ROOT, 'manga', '下');
const MANGA_GE_PUB = path.join(ROOT, 'web', 'public', 'manga', 'ge');
/** 下巻のあとに添える、近代以降の元号を象徴する一枚絵（manga 直下） */
const MANGA_REKISHI_BRIDGE_FILE = '明治大正昭和平成令和.png';
const MANGA_REKISHI_BRIDGE_SRC = path.join(ROOT, 'manga', MANGA_REKISHI_BRIDGE_FILE);
const MANGA_REKISHI_BRIDGE_PUB = path.join(ROOT, 'web', 'public', 'manga', MANGA_REKISHI_BRIDGE_FILE);
const SLIDE_SRC_DIR = path.join(ROOT, 'slide');
const SLIDE_PUB_DIR = path.join(ROOT, 'web', 'public', 'slide');
const MOVIE_SRC_DIR = path.join(ROOT, 'movie');
const MOVIE_PUB_DIR = path.join(ROOT, 'web', 'public', 'movie');
const MOVIE_PUB_FILE = 'kojiki-intro.mp4';
const MOVIE_PUB_PATH = path.join(MOVIE_PUB_DIR, MOVIE_PUB_FILE);

/** 校註・上つ卷の中見出し（生成 HTML の <h2> 内文字列）と漫画ファイルの対応 */
const KOCHU_UE_MANGA = [
  { h2: '〔序文〕', file: '0_序.png', alt: '漫画・序' },
  { h2: '〔一、伊耶那岐の命と伊耶那美の命〕', file: '1_イザナギイザナミ.png', alt: '漫画・イザナギとイザナミ' },
  { h2: '〔二、天照らす大神と須佐の男の命〕', file: '2_天岩戸.png', alt: '漫画・天岩戸' },
  { h2: '〔三、須佐の男の命〕', file: '3_須佐之男命.png', alt: '漫画・須佐之男命' },
  { h2: '〔四、大國主の神〕', file: '4_大國主の神.png', alt: '漫画・大國主の神' },
  { h2: '〔五、天照らす大御神と大國主の神〕', file: '5_国譲り.png', alt: '漫画・国譲り' },
  { h2: '〔六、邇邇藝の命〕', file: '6_邇邇藝の命.png', alt: '漫画・邇邇藝の命' },
  { h2: '〔七、日子穗穗出見の命〕', file: '7_海の幸と山の幸.png', alt: '漫画・海の幸と山の幸' },
  { h2: '〔八、鵜葺草葺合へずの命〕', file: '8_鵜葺草葺合へずの命.png', alt: '漫画・鵜葺草葺不合の命' },
];

/** 現代語譯・上の卷の中見出し（表記は底本の現代語譯に合わせる） */
const GENDAIGO_UE_MANGA = [
  { h2: '序文', file: '0_序.png', alt: '漫画・序' },
  { h2: '一、イザナギの命とイザナミの命', file: '1_イザナギイザナミ.png', alt: '漫画・イザナギとイザナミ' },
  { h2: '二、天照らす大神とスサノヲの命', file: '2_天岩戸.png', alt: '漫画・天岩戸' },
  { h2: '三、スサノヲの命', file: '3_須佐之男命.png', alt: '漫画・スサノヲの命' },
  { h2: '四、大國主の命', file: '4_大國主の神.png', alt: '漫画・大國主' },
  { h2: '五、天照らす大神と大國主の命', file: '5_国譲り.png', alt: '漫画・国譲り' },
  { h2: '六、ニニギの命', file: '6_邇邇藝の命.png', alt: '漫画・ニニギの命' },
  { h2: '七、ヒコホホデミの命', file: '7_海の幸と山の幸.png', alt: '漫画・海の幸と山の幸' },
];

/** 校註・中つ卷の中見出し（生成 HTML の <h2> 内文字列）と漫画ファイルの対応 */
const KOCHU_CHU_MANGA = [
  { h2: '〔一、神武天皇〕', file: '1_神武天皇.png', alt: '漫画・神武天皇' },
  { h2: '〔二、綏靖天皇以後八代〕', file: '2_綏靖天皇以後八代.png', alt: '漫画・綏靖天皇以後八代' },
  { h2: '〔三、崇神天皇〕', file: '3_崇神天皇.png', alt: '漫画・崇神天皇' },
  { h2: '〔四、垂仁天皇〕', file: '4_垂仁天皇.png', alt: '漫画・垂仁天皇' },
  { h2: '〔五、景行天皇・成務天皇〕', file: '5_景行天皇・成務天皇.png', alt: '漫画・景行天皇・成務天皇' },
  { h2: '〔六、仲哀天皇〕', file: '6_仲哀天皇.png', alt: '漫画・仲哀天皇' },
  { h2: '〔七、應神天皇〕', file: '7_應神天皇.png', alt: '漫画・應神天皇' },
];

/** 現代語譯・中の卷の中見出し（表記は底本の現代語譯に合わせる） */
const GENDAIGO_CHU_MANGA = [
  { h2: '一、神武天皇', file: '1_神武天皇.png', alt: '漫画・神武天皇' },
  { h2: '二、綏靖天皇以後八代', file: '2_綏靖天皇以後八代.png', alt: '漫画・綏靖天皇以後八代' },
  { h2: '三、崇神天皇', file: '3_崇神天皇.png', alt: '漫画・崇神天皇' },
  { h2: '四、垂仁天皇', file: '4_垂仁天皇.png', alt: '漫画・垂仁天皇' },
  { h2: '五、景行天皇・成務天皇', file: '5_景行天皇・成務天皇.png', alt: '漫画・景行天皇・成務天皇' },
  { h2: '六、仲哀天皇', file: '6_仲哀天皇.png', alt: '漫画・仲哀天皇' },
  { h2: '七、應神天皇', file: '7_應神天皇.png', alt: '漫画・應神天皇' },
];

/** 校註・下つ卷の中見出し（生成 HTML の <h2> 内文字列）と漫画ファイルの対応 */
const KOCHU_GE_MANGA = [
  { h2: '〔一、仁徳天皇〕', file: '1_仁徳天皇.png', alt: '漫画・仁徳天皇' },
  { h2: '〔二、履中天皇・反正天皇〕', file: '2_履中天皇・反正天皇.png', alt: '漫画・履中天皇・反正天皇' },
  { h2: '〔三、允恭天皇〕', file: '3_允恭天皇.png', alt: '漫画・允恭天皇' },
  { h2: '〔四、安康天皇〕', file: '4_安康天皇.png', alt: '漫画・安康天皇' },
  { h2: '〔五、雄略天皇〕', file: '5_雄略天皇.png', alt: '漫画・雄略天皇' },
  { h2: '〔六、清寧天皇・顯宗天皇・仁賢天皇〕', file: '6_清寧天皇・顯宗天皇・仁賢天皇.png', alt: '漫画・清寧天皇・顯宗天皇・仁賢天皇' },
  { h2: '〔七、武烈天皇以後九代〕', file: '7_武烈天皇以後九代.png', alt: '漫画・武烈天皇以後九代' },
];

/** 現代語譯・下の卷の中見出し（表記は底本の現代語譯に合わせる） */
const GENDAIGO_GE_MANGA = [
  { h2: '一、仁徳天皇', file: '1_仁徳天皇.png', alt: '漫画・仁徳天皇' },
  { h2: '二、履中天皇・反正天皇', file: '2_履中天皇・反正天皇.png', alt: '漫画・履中天皇・反正天皇' },
  { h2: '三、允恭天皇', file: '3_允恭天皇.png', alt: '漫画・允恭天皇' },
  { h2: '四、安康天皇', file: '4_安康天皇.png', alt: '漫画・安康天皇' },
  { h2: '五、雄略天皇', file: '5_雄略天皇.png', alt: '漫画・雄略天皇' },
  { h2: '六、清寧天皇・顯宗天皇・仁賢天皇', file: '6_清寧天皇・顯宗天皇・仁賢天皇.png', alt: '漫画・清寧天皇・顯宗天皇・仁賢天皇' },
  { h2: '七、武烈天皇以後九代', file: '7_武烈天皇以後九代.png', alt: '漫画・武烈天皇以後九代' },
];

function readDoc(name) {
  return fs.readFileSync(path.join(DOC, name), 'utf8').replace(/\r\n/g, '\n');
}

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

/** ［＃…］を除去（入れ子なし前提で終端］まで） */
function stripHashNotes(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s.slice(i, i + 2) === '［＃') {
      let j = i + 2;
      while (j < s.length && s[j] !== '］') j++;
      i = j < s.length ? j + 1 : s.length;
    } else {
      out += s[i++];
    }
  }
  return out;
}

/** 《》を ruby に（｜は除去済み想定） */
function rubyify(s) {
  return s.replace(
    /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3005\u3400-\u4DBF]+)《([^》]+)》/g,
    '<ruby>$1<rt>$2</rt></ruby>'
  );
}

function cleanLine(line) {
  let t = stripHashNotes(line).replace(/｜/g, '').trim();
  t = t.replace(/^［＃[^］]*］/g, '').trim();
  return t;
}

/** 行単位でブロック化（見出し・本文・注釈風行） */
function linesToBlocks(lines, opts = {}) {
  const { skipUntilDelimiter = true, classifyNotes = true } = opts;
  const blocks = [];
  let i = 0;
  let delim = 0;
  if (skipUntilDelimiter) {
    while (i < lines.length) {
      if (lines[i].includes('-------------------------------------------------------')) delim++;
      i++;
      if (delim >= 2) break;
    }
  }

  const chuMid = /」は中見出し］/;
  const shoMid = /」は小見出し］/;
  const annLine = /^[一二三四五六七八九十百〇0-9０-９]+[　\s]/;

  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.includes('底本：')) break;
    if (raw.includes('青空文庫作成ファイル')) break;

    let chu = raw.match(/［＃「([^」]+)」は中見出し］/);
    let sho = raw.match(/［＃「([^」]+)」は小見出し］/);
    const cleaned = cleanLine(raw);
    if (!cleaned) continue;

    if (chu) {
      blocks.push({ type: 'h2', text: chu[1] });
      continue;
    }
    if (sho && !chu) {
      blocks.push({ type: 'h3', text: sho[1] });
      continue;
    }

    if (classifyNotes && annLine.test(cleaned)) {
      blocks.push({ type: 'note', text: cleaned });
    } else {
      blocks.push({ type: 'p', text: cleaned });
    }
  }

  return blocks;
}

function blocksToHtml(blocks) {
  return blocks.map((b) => {
    const inner = rubyify(escapeHtml(b.text));
    if (b.type === 'h2') return `<h2>${inner}</h2>`;
    if (b.type === 'h3') return `<h3>${inner}</h3>`;
    if (b.type === 'note') return `<p class="note">${inner}</p>`;
    return `<p>${inner}</p>`;
  });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitLines(text) {
  return text.split('\n');
}

function sliceLines(lines, start, end) {
  return lines.slice(start, end).join('\n');
}

function findLine(lines, pred) {
  const i = lines.findIndex(pred);
  return i === -1 ? lines.length : i;
}

function copyMangaUe() {
  if (!fs.existsSync(MANGA_UE_SRC)) return;
  fs.mkdirSync(path.dirname(MANGA_UE_PUB), { recursive: true });
  fs.cpSync(MANGA_UE_SRC, MANGA_UE_PUB, { recursive: true });
}

function copyMangaChu() {
  if (!fs.existsSync(MANGA_CHU_SRC)) return;
  fs.mkdirSync(path.dirname(MANGA_CHU_PUB), { recursive: true });
  fs.cpSync(MANGA_CHU_SRC, MANGA_CHU_PUB, { recursive: true });
}

function copyMangaGe() {
  if (!fs.existsSync(MANGA_GE_SRC)) return;
  fs.mkdirSync(path.dirname(MANGA_GE_PUB), { recursive: true });
  fs.cpSync(MANGA_GE_SRC, MANGA_GE_PUB, { recursive: true });
}

function copyMangaRekishiBridge() {
  if (!fs.existsSync(MANGA_REKISHI_BRIDGE_SRC)) return;
  fs.mkdirSync(path.dirname(MANGA_REKISHI_BRIDGE_PUB), { recursive: true });
  fs.copyFileSync(MANGA_REKISHI_BRIDGE_SRC, MANGA_REKISHI_BRIDGE_PUB);
}

function copySlideAssets() {
  if (!fs.existsSync(SLIDE_SRC_DIR)) return;
  fs.mkdirSync(SLIDE_PUB_DIR, { recursive: true });
  fs.cpSync(SLIDE_SRC_DIR, SLIDE_PUB_DIR, { recursive: true });
}

function pickFirstMp4(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const mp4 = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.mp4'))
    .map((e) => path.join(dir, e.name))
    .sort()[0];
  return mp4 || null;
}

function copyIntroMovie() {
  const src = pickFirstMp4(MOVIE_SRC_DIR);
  if (!src) return null;
  fs.mkdirSync(MOVIE_PUB_DIR, { recursive: true });
  fs.copyFileSync(src, MOVIE_PUB_PATH);
  const stat = fs.statSync(MOVIE_PUB_PATH);
  return {
    title: path.basename(src).replace(/\.mp4$/i, ''),
    src: `/movie/${encodeURIComponent(MOVIE_PUB_FILE)}`,
    bytes: stat.size,
  };
}

/** blocksToHtml の h2 と同じく rubyify(escapeHtml) でタグを再構成 */
function h2OpenClose(headingPlain) {
  const inner = rubyify(escapeHtml(headingPlain));
  return `<h2>${inner}</h2>`;
}

function mangaFigure(mangaDir, file, alt) {
  const src = `/manga/${encodeURIComponent(mangaDir)}/${encodeURIComponent(file)}`;
  return `<figure class="manga-panel"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" /></figure>`;
}

/** 各中見出しの直後に漫画を差し込む */
function injectMangaAfterH2(html, rows, mangaDir) {
  let out = html;
  for (const { h2, file, alt } of rows) {
    const tag = h2OpenClose(h2);
    if (!out.includes(tag)) {
      console.warn('[build-data] manga: <h2> が見つかりません:', h2);
      continue;
    }
    out = out.replace(tag, `${tag}\n${mangaFigure(mangaDir, file, alt)}`);
  }
  return out;
}

/** 現代語譯・第八章は中見出しがないため、「海幸と山幸」小見出しの直前に挿入 */
function injectGendaigoManga8(html) {
  const fig = mangaFigure('ue', '8_鵜葺草葺合へずの命.png', '漫画・鵜葺草葺不合の命');
  const patterns = [
    /<h3><ruby>海幸<rt>[^<]*<\/rt><\/ruby>と山幸<\/h3>/,
    /<h3>海幸と山幸<\/h3>/,
  ];
  for (const re of patterns) {
    if (re.test(html)) {
      return html.replace(re, `${fig}\n$&`);
    }
  }
  console.warn('[build-data] gendaigo 漫画8: 小見出し「海幸と山幸」が見つかりません');
  return html;
}

/** 下巻末尾：古事記の意義と、近代以降の御代を象徴する漫画 */
function eraBridgeAppendixHtml() {
  if (!fs.existsSync(MANGA_REKISHI_BRIDGE_SRC)) return '';
  const src = `/manga/${encodeURIComponent(MANGA_REKISHI_BRIDGE_FILE)}`;
  const title = '古事記の流れ、いまへ';
  const h2Inner = rubyify(escapeHtml(title));
  const paras = [
    '古事記は、天地開闢から神々の系譜をたどり、やがて人皇の御代の記事へと続きます。古代の年譜であると同時に、わたしたちが共有する物語の背後や、制度の由来を考えるときの手がかりにもなります。',
    '帝紀の流れのなかで古代の一断面に触れたうえで、明治・大正・昭和・平成・令和と続く元号を一枚の漫画で示すのは、物語が「いま」で打ち切られるという意味ではありません。長い時間のつながりを、一枚の画のなかで象徴的にまとめる試みです。',
    '古事記を読む意義のひとつは、起源をただの昔話に閉じ込めず、いまの言葉や制度と静かに対話できる想像力を与えてくれることではないでしょうか。源流を意識するとき、わたしたちは自分の立ち位置を、少し横から見ることができます。',
  ];
  const body = paras.map((t) => `<p>${rubyify(escapeHtml(t))}</p>`).join('\n');
  const alt = '漫画・明治以降の元号に示した御代の象徴';
  return `<section class="manga-epilogue">
<h2>${h2Inner}</h2>
${body}
<figure class="manga-panel"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" /></figure>
</section>`;
}

function buildKochu() {
  const text = readDoc('02kochu_kojiki.txt');
  const lines = splitLines(text);
  const iChu = findLine(lines, (l) => l.includes('［＃１字下げ］古事記　中つ卷'));
  const iGe = findLine(lines, (l) => l.includes('［＃１字下げ］古事記　下つ卷'));
  const iFoot = findLine(lines, (l) => l.trim().startsWith('底本：'));

  const parts = [
    { id: 'jo-ue', title: '上つ卷（序を含む）', slice: [0, iChu] },
    { id: 'chu', title: '中つ卷', slice: [iChu, iGe] },
    { id: 'ge', title: '下つ卷', slice: [iGe, iFoot] },
  ];

  const volumes = parts.map((p) => {
    const chunk = sliceLines(lines, p.slice[0], p.slice[1]);
    const bl = linesToBlocks(splitLines(chunk), {
      skipUntilDelimiter: p.id === 'jo-ue',
    });
    return {
      id: p.id,
      title: p.title,
      html: blocksToHtml(bl).join('\n'),
    };
  });

  const kJo = volumes.find((v) => v.id === 'jo-ue');
  if (kJo && fs.existsSync(MANGA_UE_SRC)) {
    kJo.html = injectMangaAfterH2(kJo.html, KOCHU_UE_MANGA, 'ue');
  }
  const kChu = volumes.find((v) => v.id === 'chu');
  if (kChu && fs.existsSync(MANGA_CHU_SRC)) {
    kChu.html = injectMangaAfterH2(kChu.html, KOCHU_CHU_MANGA, 'chu');
  }
  const kGe = volumes.find((v) => v.id === 'ge');
  if (kGe) {
    if (fs.existsSync(MANGA_GE_SRC)) {
      kGe.html = injectMangaAfterH2(kGe.html, KOCHU_GE_MANGA, 'ge');
    }
    if (fs.existsSync(MANGA_REKISHI_BRIDGE_SRC)) {
      kGe.html += `\n${eraBridgeAppendixHtml()}`;
    }
  }

  fs.writeFileSync(path.join(OUT, 'kochu.json'), JSON.stringify({ volumes }, null, 0), 'utf8');
}

function buildGendaigo() {
  const text = readDoc('03gendaigoyaku_kojiki.txt');
  const lines = splitLines(text);
  const iChu = findLine(lines, (l) => l.includes('古事記　中の卷'));
  const iGe = findLine(lines, (l) => l.includes('古事記　下の卷'));
  const iFoot = findLine(lines, (l) => l.trim().startsWith('底本：'));

  const parts = [
    { id: 'jo-ue', title: '上の卷（序・現代語）', slice: [0, iChu] },
    { id: 'chu', title: '中の卷', slice: [iChu, iGe] },
    { id: 'ge', title: '下の卷', slice: [iGe, iFoot] },
  ];

  const volumes = parts.map((p) => {
    const chunk = sliceLines(lines, p.slice[0], p.slice[1]);
    const bl = linesToBlocks(splitLines(chunk), {
      skipUntilDelimiter: p.id === 'jo-ue',
    });
    return {
      id: p.id,
      title: p.title,
      html: blocksToHtml(bl).join('\n'),
    };
  });

  const gJo = volumes.find((v) => v.id === 'jo-ue');
  if (gJo && fs.existsSync(MANGA_UE_SRC)) {
    gJo.html = injectMangaAfterH2(gJo.html, GENDAIGO_UE_MANGA, 'ue');
    gJo.html = injectGendaigoManga8(gJo.html);
  }
  const gChu = volumes.find((v) => v.id === 'chu');
  if (gChu && fs.existsSync(MANGA_CHU_SRC)) {
    gChu.html = injectMangaAfterH2(gChu.html, GENDAIGO_CHU_MANGA, 'chu');
  }
  const gGe = volumes.find((v) => v.id === 'ge');
  if (gGe) {
    if (fs.existsSync(MANGA_GE_SRC)) {
      gGe.html = injectMangaAfterH2(gGe.html, GENDAIGO_GE_MANGA, 'ge');
    }
    if (fs.existsSync(MANGA_REKISHI_BRIDGE_SRC)) {
      gGe.html += `\n${eraBridgeAppendixHtml()}`;
    }
  }

  fs.writeFileSync(path.join(OUT, 'gendaigo.json'), JSON.stringify({ volumes }, null, 0), 'utf8');
}

function slugify(s) {
  return s
    .replace(/《[^》]+》/g, '')
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'story';
}

function buildMonogatari() {
  const text = readDoc('kojiki_monogatari.txt');
  const lines = splitLines(text);
  const stories = [];
  const re = /［＃大見出し］(.+?)［＃大見出し終わり］/;
  let cur = null;
  let buf = [];

  const flush = () => {
    if (!cur) return;
    const chunk = buf.join('\n');
    const bl = linesToBlocks(splitLines(chunk), {
      skipUntilDelimiter: false,
      classifyNotes: false,
    });
    const base = slugify(cur);
    stories.push({
      id: `${base}-${stories.length}`,
      title: stripHashNotes(cur).replace(/｜/g, '').trim(),
      html: blocksToHtml(bl).join('\n'),
    });
    buf = [];
  };

  let i = 0;
  let delim = 0;
  while (i < lines.length) {
    if (lines[i].includes('-------------------------------------------------------')) delim++;
    i++;
    if (delim >= 2) break;
  }

  for (; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (m) {
      flush();
      cur = m[1];
      continue;
    }
    if (lines[i].trim().startsWith('底本：')) break;
    buf.push(lines[i]);
  }
  flush();

  fs.writeFileSync(path.join(OUT, 'monogatari.json'), JSON.stringify({ stories }, null, 0), 'utf8');
}

function buildPlainDoc(filename, outName, titleField) {
  const text = readDoc(filename);
  const lines = splitLines(text);
  const blocks = linesToBlocks(lines, {
    skipUntilDelimiter: true,
    classifyNotes: false,
  });
  const data = {
    title: titleField,
    html: blocksToHtml(blocks).join('\n'),
  };
  fs.writeFileSync(path.join(OUT, outName), JSON.stringify(data, null, 0), 'utf8');
}

function buildIndexFile(filename, outName, title) {
  let text = readDoc(filename);
  const iFoot = text.indexOf('\n底本：');
  if (iFoot !== -1) text = text.slice(0, iFoot);
  text = stripHashNotes(text).replace(/｜/g, '');
  const lines = text.split('\n').map((l) => l.trimEnd());
  const html =
    '<pre class="index-pre">' +
    escapeHtml(lines.join('\n')).replace(/\n/g, '<br/>') +
    '</pre>';
  fs.writeFileSync(
    path.join(OUT, outName),
    JSON.stringify({ title, html }, null, 0),
    'utf8'
  );
}

function buildManifest() {
  const mono = JSON.parse(fs.readFileSync(path.join(OUT, 'monogatari.json'), 'utf8'));
  const movie = copyIntroMovie();
  const slidePdf = path.join(SLIDE_PUB_DIR, 'The_Genesis_Blueprint.pdf');
  const slideNav = fs.existsSync(slidePdf) ? [{ href: '#/slide', label: 'スライド' }] : [];
  const manifest = {
    site: '古事記を読む',
    description: '角川文庫底本の校註・現代語譯、解説、物語、索引を一つの場所で。',
    nav: [
      ...(movie ? [{ href: '#/movie', label: '紹介ビデオ' }] : []),
      ...slideNav,
      { href: '#/kochu', label: '校註（書き下し＋注）' },
      { href: '#/gendaigo', label: '現代語譯' },
      { href: '#/monogatari', label: '古事記物語' },
      { href: '#/kaisetsu', label: '解説' },
      { href: '#/hanrei', label: '凡例' },
      { href: '#/sakuin-go', label: '語索引' },
      { href: '#/sakuin-kayo', label: '歌謠索引' },
    ],
    kochuVolumes: ['jo-ue', 'chu', 'ge'],
    gendaigoVolumes: ['jo-ue', 'chu', 'ge'],
    monogatari: mono.stories.map((s) => ({ id: s.id, title: s.title })),
    movie,
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

ensureOut();
copyMangaUe();
copyMangaChu();
copyMangaGe();
copyMangaRekishiBridge();
copySlideAssets();
buildKochu();
buildGendaigo();
buildMonogatari();
buildPlainDoc('01hanrei.txt', 'hanrei.json', '凡例');
buildPlainDoc('04kaisetsu.txt', 'kaisetsu.json', '解説');
buildIndexFile('05goku_sakuin.txt', 'sakuin-go.json', '語索引');
buildIndexFile('06kayo_kakku_sakuin.txt', 'sakuin-kayo.json', '歌謠・各句索引');
buildManifest();

console.log('Wrote JSON to', OUT);
