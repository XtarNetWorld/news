(() => {

/* =========================================================================
   LIP-SYNC ENGINE  (pure logic, no DOM)

   text ──► tokens ──► phonemes (rule-based English G2P + Devanagari) ──►
   timed segments ──► Cohen–Massaro dominance blending ──► { open, round }

   Two timing sources feed the same engine:
     • buildAligned()   real per-character timestamps (ElevenLabs)
     • buildPredicted() modelled phoneme durations (browser voice), which the
                        host re-anchors on every word-boundary event
   ========================================================================= */
const LS = (() => {

  // ---------------------------------------------------------------------
  // 1. Phoneme → mouth-shape table
  //    o  = jaw/lip opening target        (0 closed … 1 wide open)
  //    r  = lip shape target              (-1 spread … +1 rounded/pursed)
  //    wo = dominance over the opening    (how strongly it wins vs. neighbours)
  //    wr = dominance over the lip shape
  //    d  = typical duration in ms, v = vowel
  //  Weak consonants (t d n k g h l) get LOW dominance so they borrow the
  //  neighbouring vowel's shape (coarticulation); lip-closing sounds
  //  (p b m) get very HIGH opening dominance so they really shut the mouth.
  // ---------------------------------------------------------------------
  const PP = { o: 0.00, r: 0.00, wo: 3.0, wr: 0.20, d: 62 };
  const FF = { o: 0.14, r: -0.35, wo: 1.6, wr: 0.60, d: 78 };
  const TH = { o: 0.22, r: -0.30, wo: 0.9, wr: 0.30, d: 66 };
  const DD = { o: 0.20, r: -0.20, wo: 0.35, wr: 0.15, d: 52 };
  const SS = { o: 0.12, r: -0.65, wo: 1.0, wr: 0.55, d: 88 };
  const SH = { o: 0.20, r: 0.60, wo: 0.7, wr: 1.00, d: 90 };
  const KK = { o: 0.30, r: 0.00, wo: 0.25, wr: 0.10, d: 58 };

  const PH = {
    // vowels
    aa: { o: 1.00, r: -0.05, wo: 1.0, wr: 0.8, d: 110, v: 1 },
    ae: { o: 0.82, r: -0.45, wo: 1.0, wr: 0.9, d: 115, v: 1 },
    ah: { o: 0.52, r: -0.10, wo: 0.8, wr: 0.5, d: 62, v: 1 },
    ao: { o: 0.80, r: 0.68, wo: 1.0, wr: 1.0, d: 115, v: 1 },
    eh: { o: 0.60, r: -0.50, wo: 1.0, wr: 0.9, d: 88, v: 1 },
    ih: { o: 0.36, r: -0.65, wo: 0.9, wr: 0.9, d: 68, v: 1 },
    iy: { o: 0.26, r: -0.95, wo: 0.9, wr: 1.0, d: 100, v: 1 },
    uh: { o: 0.38, r: 0.65, wo: 0.9, wr: 1.0, d: 70, v: 1 },
    uw: { o: 0.30, r: 1.00, wo: 0.9, wr: 1.1, d: 105, v: 1 },
    er: { o: 0.42, r: 0.45, wo: 0.9, wr: 0.9, d: 95, v: 1 },
    // diphthongs (expanded into two glide targets)
    ay: { d: 170, v: 1, diph: ['aa', 'ih'] },
    aw: { d: 170, v: 1, diph: ['aa', 'uw'] },
    oy: { d: 175, v: 1, diph: ['ao', 'iy'] },
    ey: { d: 150, v: 1, diph: ['eh', 'ih'] },
    ow: { d: 160, v: 1, diph: ['ao', 'uw'] },
    // consonants
    p: PP, b: PP, m: Object.assign({}, PP, { d: 68 }),
    f: FF, v: FF,
    th: TH, dh: Object.assign({}, TH, { d: 55 }),
    t: DD, d: DD, n: Object.assign({}, DD, { d: 62 }),
    l: { o: 0.32, r: -0.15, wo: 0.5, wr: 0.25, d: 64 },
    s: SS, z: SS,
    sh: SH, zh: SH, ch: Object.assign({}, SH, { d: 96 }), jh: Object.assign({}, SH, { d: 96 }),
    k: KK, g: KK, ng: Object.assign({}, KK, { d: 65 }),
    r: { o: 0.30, r: 0.55, wo: 0.6, wr: 0.9, d: 64 },
    w: { o: 0.25, r: 1.00, wo: 0.9, wr: 1.6, d: 66 },
    y: { o: 0.22, r: -0.85, wo: 0.6, wr: 0.9, d: 60 },
    hh: { o: 0.30, r: 0.00, wo: 0.12, wr: 0.08, d: 54 },
    sil: { o: 0.00, r: 0.00, wo: 1.2, wr: 0.5, d: 0 }
  };

  // ---------------------------------------------------------------------
  // 2. Text → tokens
  // ---------------------------------------------------------------------
  const PAUSE = { ',': 200, ';': 260, ':': 260, '.': 380, '!': 380, '?': 380, '…': 350, '—': 220, '–': 200 };
  const SYMBOL_WORDS = { '%': 'percent', '&': 'and', '+': 'plus', '=': 'equals', '@': 'at' };
  const FUNCTION_WORDS = new Set(('a an the of to in on at for and or but is it as be by my me we he she you i am are was ' +
    'with that this his her our your their from has have had do so if up no not can will just its').split(' '));

  function tokenize(text) {
    const re = /[\p{L}\p{M}'’]+|\d+(?:[.,]\d+)*|\S/gu;
    const out = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      const t = m[0];
      let k = 'p';
      if (/\p{L}/u.test(t)) k = 'w';
      else if (/^\d/.test(t)) k = 'n';
      else if (SYMBOL_WORDS[t]) k = 's';
      out.push({ k, t, cs: m.index, ce: m.index + t.length });
    }
    return out;
  }

  // ---------------------------------------------------------------------
  // 3. Numbers → spoken words
  // ---------------------------------------------------------------------
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
    'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function intWords(n) {
    if (n < 20) return [ONES[n]];
    if (n < 100) return [TENS[Math.floor(n / 10)]].concat(n % 10 ? [ONES[n % 10]] : []);
    if (n < 1000) return [ONES[Math.floor(n / 100)], 'hundred'].concat(n % 100 ? intWords(n % 100) : []);
    const units = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
    for (const [v, name] of units) {
      if (n >= v) return intWords(Math.floor(n / v)).concat([name], n % v ? intWords(n % v) : []);
    }
    return [];
  }
  function numberWords(str) {
    const clean = str.replace(/,/g, '');
    const parts = clean.split('.');
    let words;
    if (parts[0].length > 12) words = parts[0].split('').map((d) => ONES[+d]);
    else words = intWords(parseInt(parts[0], 10) || 0);
    if (parts[1]) words = words.concat(['point'], parts[1].split('').map((d) => ONES[+d]));
    return words;
  }

  // ---------------------------------------------------------------------
  // 4. English grapheme → phoneme (rule based) with a dictionary of the
  //    common irregular words. Each phoneme carries the letter span [s,e)
  //    it came from, so real character timestamps can be mapped onto it.
  //    (Voicing is irrelevant to lip shape, so s/z, t/d etc. are the same
  //    viseme — the rules only need to be right about lip-visible things.)
  // ---------------------------------------------------------------------
  const DICT = {
    the: 'dh ah', a: 'ah', an: 'ae n', of: 'ah v', to: 't uw', too: 't uw', two: 't uw', you: 'y uw', your: 'y ao r',
    yours: 'y ao r z', are: 'aa r', was: 'w ah z', were: 'w er', is: 'ih z', said: 's eh d', says: 's eh z',
    have: 'hh ae v', give: 'g ih v', live: 'l ih v', love: 'l ah v', come: 'k ah m', some: 's ah m', one: 'w ah n',
    once: 'w ah n s', who: 'hh uw', whom: 'hh uw m', whose: 'hh uw z', what: 'w ah t', where: 'w eh r',
    there: 'dh eh r', here: 'hh iy r', they: 'dh ey', their: 'dh eh r', them: 'dh eh m', then: 'dh eh n',
    than: 'dh ae n', this: 'dh ih s', that: 'dh ae t', these: 'dh iy z', those: 'dh ow z', with: 'w ih dh',
    do: 'd uw', does: 'd ah z', done: 'd ah n', gone: 'g ao n', been: 'b ih n', many: 'm eh n iy', any: 'eh n iy',
    people: 'p iy p ah l', would: 'w uh d', could: 'k uh d', should: 'sh uh d', know: 'n ow', knew: 'n uw',
    through: 'th r uw', though: 'dh ow', thought: 'th ao t', enough: 'ih n ah f', tough: 't ah f', laugh: 'l ae f',
    want: 'w aa n t', water: 'w ao t er', very: 'v eh r iy', every: 'eh v r iy', from: 'f r ah m', or: 'ao r',
    for: 'f ao r', four: 'f ao r', door: 'd ao r', floor: 'f l ao r', hello: 'hh eh l ow', hi: 'hh ay',
    hey: 'hh ey', robot: 'r ow b aa t', my: 'm ay', by: 'b ay', why: 'w ay', try: 't r ay', fly: 'f l ay',
    sky: 's k ay', good: 'g uh d', wood: 'w uh d', stood: 's t uh d', book: 'b uh k', look: 'l uh k', took: 't uh k',
    cook: 'k uh k', foot: 'f uh t', put: 'p uh t', full: 'f uh l', pull: 'p uh l', push: 'p uh sh',
    i: 'ay', me: 'm iy', he: 'hh iy', she: 'sh iy', we: 'w iy', be: 'b iy', no: 'n ow', so: 's ow', go: 'g ow',
    our: 'aw er', hour: 'aw er', over: 'ow v er', open: 'ow p ah n', only: 'ow n l iy',
    also: 'ao l s ow', about: 'ah b aw t', again: 'ah g eh n', against: 'ah g eh n s t', get: 'g eh t',
    gift: 'g ih f t', girl: 'g er l', begin: 'b ih g ih n', together: 't ah g eh dh er', forget: 'f er g eh t',
    young: 'y ah ng', touch: 't ah ch', country: 'k ah n t r iy', couple: 'k ah p ah l', double: 'd ah b ah l',
    trouble: 't r ah b ah l', cousin: 'k ah z ah n', how: 'hh aw', now: 'n aw', cow: 'k aw', wow: 'w aw',
    vow: 'v aw', brow: 'b r aw', allow: 'ah l aw', read: 'r iy d', lead: 'l iy d', head: 'hh eh d',
    dead: 'd eh d', bread: 'b r eh d', great: 'g r ey t', break: 'b r ey k', steak: 's t ey k', eye: 'ay',
    eyes: 'ay z', busy: 'b ih z iy', friend: 'f r eh n d', friends: 'f r eh n d z', beautiful: 'b y uw t ah f ah l',
    world: 'w er l d', word: 'w er d', work: 'w er k', worry: 'w er iy', mother: 'm ah dh er', father: 'f aa dh er',
    brother: 'b r ah dh er', other: 'ah dh er', another: 'ah n ah dh er', money: 'm ah n iy', honey: 'hh ah n iy',
    body: 'b aa d iy', move: 'm uw v', prove: 'p r uw v', lose: 'l uw z', whole: 'hh ow l', both: 'b ow th',
    talk: 't ao k', walk: 'w ao k', chalk: 'ch ao k', half: 'hh ae f', calm: 'k aa m', palm: 'p aa m',
    "i'm": 'ay m', "i'll": 'ay l', "i've": 'ay v', "i'd": 'ay d', "can't": 'k ae n t', "won't": 'w ow n t',
    "don't": 'd ow n t', "let's": 'l eh t s', "it's": 'ih t s', "that's": 'dh ae t s', "what's": 'w ah t s',
    "you're": 'y ao r', "you'll": 'y uw l', "we're": 'w iy r', "they're": 'dh eh r', "there's": 'dh eh r z',
    "here's": 'hh iy r z', "who's": 'hh uw z', "he's": 'hh iy z', "she's": 'sh iy z'
  };

  const VOW = 'aeiou';
  const isV = (ch) => !!ch && VOW.indexOf(ch) >= 0;
  const isCons = (ch) => !!ch && !isV(ch) && /[a-z]/.test(ch);
  const LONG = { a: 'ey', e: 'iy', i: 'ay', o: 'ow', u: 'uw' };
  const SHORT = { a: 'ae', e: 'eh', i: 'ih', o: 'aa', u: 'ah' };

  function spread(phs, n) {
    const m = phs.length;
    return phs.map((p, k) => {
      const s = Math.floor((k * n) / m);
      return { p, s, e: Math.max(s + 1, Math.floor(((k + 1) * n) / m)) };
    });
  }

  function g2pWord(w) {
    if (DICT[w]) return spread(DICT[w].split(' '), w.length);
    const n = w.length, out = [];
    const add = (p, s, e) => out.push({ p, s, e });
    let seenVowel = 0;
    const addV = (p, s, e) => { add(p, s, e); seenVowel++; };
    const groups = (w.match(/[aeiouy]+/g) || []).length;
    let i = 0;

    while (i < n) {
      const c = w[i], c1 = w[i + 1] || '', c2 = w[i + 2] || '', c3 = w[i + 3] || '';
      const rest = w.slice(i);

      // ---------- consonant clusters & specials ----------
      if (rest.startsWith('tch')) { add('ch', i, i + 3); i += 3; continue; }
      if (rest.startsWith('dge')) { add('jh', i, i + 3); i += 3; continue; }
      if (rest.startsWith('tion') || rest.startsWith('sion')) {
        add('sh', i, i + 2); add('ah', i + 2, i + 3); add('n', i + 3, i + 4); i += 4; continue;
      }
      if (rest.startsWith('sch')) { add('s', i, i + 1); add('k', i + 1, i + 3); i += 3; continue; }
      if (rest.startsWith('chr')) { add('k', i, i + 2); i += 2; continue; }
      if (rest.startsWith('ch')) { add('ch', i, i + 2); i += 2; continue; }
      if (rest.startsWith('sh')) { add('sh', i, i + 2); i += 2; continue; }
      if (rest.startsWith('th')) { add('th', i, i + 2); i += 2; continue; }
      if (rest.startsWith('ph')) { add('f', i, i + 2); i += 2; continue; }
      if (rest.startsWith('wh')) { add('w', i, i + 2); i += 2; continue; }
      if (rest.startsWith('ck')) { add('k', i, i + 2); i += 2; continue; }
      if (rest.startsWith('ng')) { add('ng', i, i + 2); i += 2; continue; }
      if (rest.startsWith('nk')) { add('ng', i, i + 1); add('k', i + 1, i + 2); i += 2; continue; }
      if (rest.startsWith('qu')) { add('k', i, i + 1); add('w', i + 1, i + 2); i += 2; continue; }
      if (c === 'g' && c1 === 'h') { if (i === 0) add('g', i, i + 2); i += 2; continue; }
      if (i === 0 && ((c === 'k' && c1 === 'n') || (c === 'g' && c1 === 'n') || (c === 'w' && c1 === 'r'))) {
        add(c === 'w' ? 'r' : 'n', i, i + 2); i += 2; continue;
      }
      if (c === 'm' && c1 === 'b' && i === n - 2) { add('m', i, i + 2); i += 2; continue; }
      if (c === 'x') { add('k', i, i + 1); add('s', i, i + 1); i++; continue; }
      if (rest === 'le' && i > 0 && isCons(w[i - 1])) { add('ah', i, i + 1); add('l', i + 1, i + 2); i += 2; continue; }
      if (rest === 'les' && i > 0 && isCons(w[i - 1])) { add('ah', i, i + 1); add('l', i + 1, i + 2); add('z', i + 2, i + 3); i += 3; continue; }

      // ---------- single consonants (y is a consonant only before a vowel / at start) ----------
      if (isCons(c) && !(c === 'y' && i > 0 && !isV(c1))) {
        let ph;
        switch (c) {
          case 'c': ph = (c1 && 'eiy'.includes(c1)) ? 's' : 'k'; break;
          case 'g': ph = (c1 && 'eiy'.includes(c1)) ? 'jh' : 'g'; break;
          case 'j': ph = 'jh'; break;
          case 'h': ph = 'hh'; break;
          case 'q': ph = 'k'; break;
          default: ph = c;
        }
        const len = c1 === c ? 2 : 1;
        add(ph, i, i + len); i += len; continue;
      }

      // ---------- silent e / -ed / -es ----------
      if (c === 'e' && isCons(w[i - 1]) && groups > 1) {
        if (i === n - 1) { i++; continue; }
        if (i === n - 2 && (c1 === 'd' || c1 === 's')) {
          const before = w.slice(0, i);
          if (c1 === 'd' && /[td]$/.test(before)) { addV('ih', i, i + 1); add('d', i + 1, i + 2); i += 2; continue; }
          if (c1 === 's' && /(ch|sh|[sxz])$/.test(before)) { addV('ih', i, i + 1); add('z', i + 1, i + 2); i += 2; continue; }
          i++; continue;
        }
      }

      // ---------- vowels: r-controlled with final e ----------
      const rm = rest.match(/^(are|ore|ire|ere|ure)([sd])?$/);
      if (rm) {
        const map = { are: 'eh', ore: 'ao', ire: 'ay', ere: 'iy', ure: 'uh' };
        addV(map[rm[1]], i, i + 1); add('r', i + 1, i + 3);
        if (rm[2]) add(rm[2] === 's' ? 'z' : 'd', i + 3, i + 4);
        i = n; continue;
      }

      // ---------- vowel tri/di-graphs ----------
      if (rest.startsWith('eigh')) { addV('ey', i, i + 4); i += 4; continue; }
      if (rest.startsWith('igh')) { addV('ay', i, i + 3); i += 3; continue; }
      if (rest.startsWith('augh')) {
        if (w[i - 1] === 'l') { addV('ae', i, i + 2); add('f', i + 2, i + 4); } else addV('ao', i, i + 4);
        i += 4; continue;
      }
      if (rest.startsWith('ough')) {
        if (rest === 'ough') { addV('ah', i, i + 2); add('f', i + 2, i + 4); } else addV('ao', i, i + 4);
        i += 4; continue;
      }
      if (rest.startsWith('ear')) {
        if (!c3 || isV(c3) || c3 === 's') { addV('iy', i, i + 2); add('r', i + 2, i + 3); }
        else addV('er', i, i + 3);
        i += 3; continue;
      }
      if (rest.startsWith('oor') || rest.startsWith('our')) { addV('ao', i, i + 2); add('r', i + 2, i + 3); i += 3; continue; }
      if (rest.startsWith('all')) { addV('ao', i, i + 1); add('l', i + 1, i + 3); i += 3; continue; }
      if (rest.startsWith('alk')) { addV('ao', i, i + 2); add('k', i + 2, i + 3); i += 3; continue; }
      if (rest.startsWith('ar')) { const rr = c2 === 'r' ? 3 : 2; addV('aa', i, i + 1); add('r', i + 1, i + rr); i += rr; continue; }
      if (rest.startsWith('or')) { const rr = c2 === 'r' ? 3 : 2; addV('ao', i, i + 1); add('r', i + 1, i + rr); i += rr; continue; }
      if (/^(er|ir|ur)/.test(rest)) { const rr = c2 === 'r' ? 3 : 2; addV('er', i, i + rr); i += rr; continue; }

      const di = rest.slice(0, 2);
      let dph = null;
      switch (di) {
        case 'ea': dph = /^ea(d|th|sure|lth|vy)/.test(rest) ? 'eh' : 'iy'; break;
        case 'ee': case 'ei': case 'eu': dph = di === 'eu' ? 'uw' : 'iy'; break;
        case 'ey': dph = (i + 2 === n && n <= 3) ? 'ey' : 'iy'; break;
        case 'ie': dph = (i + 2 === n && n <= 4) ? 'ay' : 'iy'; break;
        case 'ai': case 'ay': dph = 'ey'; break;
        case 'au': case 'aw': dph = 'ao'; break;
        case 'oa': case 'oe': dph = 'ow'; break;
        case 'oi': case 'oy': dph = 'oy'; break;
        case 'oo': dph = c2 === 'k' ? 'uh' : 'uw'; break;
        case 'ou': dph = (c2 === 's' && i + 3 === n) ? 'ah' : 'aw'; break;
        case 'ow':
          if (i + 2 >= n) dph = 'ow';
          else if (c2 === 'n' && i + 3 === n) dph = /(^|[^a-z])(kn|gr|sh|bl|fl|thr|s|m)?own$/.test(w) ? 'ow' : 'aw';
          else dph = isV(c2) && c2 !== 'e' ? 'ow' : 'aw';
          break;
        case 'ui': case 'ew': dph = 'uw'; break;
        case 'ue': dph = i + 2 === n ? 'uw' : 'eh'; break;
      }
      if (dph) { addV(dph, i, i + 2); i += 2; continue; }

      // ---------- single vowels ----------
      if (c === 'y') { // vowel y
        addV(i === n - 1 ? (groups === 1 ? 'ay' : 'iy') : 'ih', i, i + 1); i++; continue;
      }
      const magic = isCons(c1) && c2 === 'e' && (i + 3 === n || (i + 4 === n && (c3 === 's' || c3 === 'd')));
      const openSyl = groups >= 2 && isCons(c1) && (isV(c2) || (c2 === 'l' && c3 === 'e' && i + 4 === n));
      let ph;
      if (i === n - 1) {                     // word-final single vowel
        ph = { a: 'ah', e: 'iy', i: 'iy', o: 'ow', u: 'uw' }[c];
      } else if (magic) {
        ph = LONG[c];
      } else if (c === 'i' && /^i(nd|ld)s?$/.test(rest)) {
        ph = 'ay';
      } else if (c === 'o' && (/^o(ld|st|lt|ll)/.test(rest))) {
        ph = 'ow';
      } else if (c === 'a' && w[i - 1] === 'w') {
        ph = 'aa';
      } else if (openSyl) {
        if (c === 'a') ph = (i === 0 || seenVowel > 0) ? 'ah' : 'ey';
        else if (c === 'e') ph = (i === 0) ? 'iy' : (i === 1 && 'bdrsp'.includes(w[0]) ? 'ih' : (seenVowel > 0 ? 'ih' : 'eh'));
        else if (c === 'i') ph = (i === 0) ? 'ay' : 'ih';
        else if (c === 'o') ph = seenVowel > 0 ? 'ah' : ('mnv'.includes(c1) ? 'ah' : 'ow');
        else ph = seenVowel > 0 ? 'ah' : 'uw'; // u
      } else {
        ph = SHORT[c] || 'ah';
      }
      addV(ph, i, i + 1); i++;
    }
    return out;
  }

  // ---------------------------------------------------------------------
  // 5. Devanagari (Hindi etc.) + generic fallback for other scripts
  // ---------------------------------------------------------------------
  const DEV_IND = { 'अ': 'ah', 'आ': 'aa', 'इ': 'ih', 'ई': 'iy', 'उ': 'uh', 'ऊ': 'uw', 'ऋ': 'r', 'ए': 'ey', 'ऐ': 'ae', 'ओ': 'ow', 'औ': 'aw' };
  const DEV_MATRA = { 'ा': 'aa', 'ि': 'ih', 'ी': 'iy', 'ु': 'uh', 'ू': 'uw', 'ृ': 'r', 'े': 'ey', 'ै': 'ae', 'ो': 'ow', 'ौ': 'aw', 'ॉ': 'ao', 'ॅ': 'ae' };
  const DEV_CONS = {};
  const devRow = (chars, ph) => { for (const ch of chars) DEV_CONS[ch] = ph; };
  devRow('कखगघङक़ख़ग़', 'k'); devRow('चछजझञज़', 'ch'); devRow('टठडढणड़ढ़', 't'); devRow('तथदधन', 't');
  devRow('पबभमफ', 'p'); devRow('य', 'y'); devRow('र', 'r'); devRow('ल', 'l'); devRow('व', 'w');
  devRow('शष', 'sh'); devRow('स', 's'); devRow('ह', 'hh');
  DEV_CONS['म'] = 'm'; DEV_CONS['फ'] = 'f'; DEV_CONS['न'] = 'n';

  function g2pOther(word) {
    const out = [];
    const chars = Array.from(word);
    let pos = 0;
    const starts = [];
    chars.forEach((ch) => { starts.push(pos); pos += ch.length; });
    const isDevCons = (ch) => !!ch && DEV_CONS[ch] !== undefined;
    for (let k = 0; k < chars.length; k++) {
      const ch = chars[k], s = starts[k], e = s + ch.length;
      const nx = chars[k + 1];
      if (DEV_CONS[ch] !== undefined) {
        out.push({ p: DEV_CONS[ch], s, e });
        if (nx && DEV_MATRA[nx]) continue;                 // matra supplies the vowel
        if (nx === '्') continue;                          // virama: no inherent vowel
        if (nx === '़') continue;                          // nukta handled next loop
        if (k < chars.length - 1) out.push({ p: 'ah', s, e, amp: 0.6 }); // inherent 'a' (dropped at word end)
      } else if (DEV_IND[ch]) {
        out.push({ p: DEV_IND[ch], s, e });
      } else if (DEV_MATRA[ch]) {
        out.push({ p: DEV_MATRA[ch], s, e });
      } else if (ch === 'ं' || ch === 'ँ') {
        out.push({ p: 'n', s, e });
      } else if (ch === 'ः') {
        out.push({ p: 'hh', s, e });
      } else if (ch === '्' || ch === '़') {
        // silent modifiers
      } else if (/\p{L}/u.test(ch)) {
        // unknown script: alternate distinct vowel shapes so the mouth still articulates
        out.push({ p: ['aa', 'iy', 'uw', 'ow', 'eh'][ch.codePointAt(0) % 5], s, e });
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------
  // 6. Token → phonemes with absolute character spans
  // ---------------------------------------------------------------------
  const SUFFIX = { "n't": ['n', 't'], "'s": ['z'], "'ll": ['ah', 'l'], "'re": ['er'], "'ve": ['v'], "'d": ['d'], "'m": ['m'] };

  function stripLatin(str) {
    // lower-case + remove diacritics without changing length, apostrophes dropped (returns map)
    let plain = '';
    const map = [];
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "'" || ch === '’') continue;
      const base = ch.normalize('NFD')[0].toLowerCase();
      plain += base; map.push(i);
    }
    return { plain, map };
  }

  function wordPhonemes(tok) {
    const t = tok.t;
    let list = [];
    const lowerOrig = t.toLowerCase().replace(/’/g, "'");
    const latinOnly = /^[a-z']+$/.test(lowerOrig.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    if (!latinOnly) {
      list = g2pOther(t).map((x) => ({ p: x.p, s: tok.cs + x.s, e: tok.cs + x.e, amp: x.amp }));
    } else if (DICT[lowerOrig]) {
      list = spread(DICT[lowerOrig].split(' '), t.length).map((x) => ({ p: x.p, s: tok.cs + x.s, e: tok.cs + x.e }));
    } else {
      const cm = lowerOrig.match(/^(.+?)(n't|'s|'ll|'re|'ve|'d|'m)$/);
      if (cm && /^[a-z]+$/.test(cm[1])) {
        const baseLen = cm[1].length;
        g2pWord(cm[1]).forEach((x) => list.push({ p: x.p, s: tok.cs + x.s, e: tok.cs + x.e }));
        const sp = SUFFIX[cm[2]];
        sp.forEach((p) => list.push({ p, s: tok.cs + baseLen, e: tok.ce }));
      } else {
        const { plain, map } = stripLatin(t);
        g2pWord(plain).forEach((x) => list.push({ p: x.p, s: tok.cs + map[x.s], e: tok.cs + map[Math.min(x.e, map.length) - 1] + 1 }));
      }
    }
    // prosody: reduced function words, stressed first syllable
    const isFunc = FUNCTION_WORDS.has(lowerOrig);
    const vowels = list.filter((x) => PH[x.p] && PH[x.p].v);
    vowels.forEach((x, idx) => {
      if (x.amp) return;
      if (isFunc) x.amp = 0.82;
      else if (vowels.length >= 2) x.amp = idx === 0 ? 1.08 : 0.88;
      else x.amp = 1.03;
    });
    return { list, isFunc };
  }

  function tokenPhonemes(tok) {
    if (tok.k === 'w') return wordPhonemes(tok);
    const words = tok.k === 'n' ? numberWords(tok.t) : [SYMBOL_WORDS[tok.t]];
    const all = [];
    words.forEach((w) => g2pWord(w).forEach((x) => all.push({ p: x.p, amp: 1 })));
    const len = tok.ce - tok.cs, m = all.length;
    all.forEach((x, k) => {
      x.s = tok.cs + Math.floor((k * len) / Math.max(m, 1));
      x.e = Math.max(x.s + 1, tok.cs + Math.floor(((k + 1) * len) / Math.max(m, 1)));
    });
    return { list: all, isFunc: false };
  }

  // ---------------------------------------------------------------------
  // 7. Segments (with diphthong expansion) and blending parameters
  // ---------------------------------------------------------------------
  function pushSeg(segs, ph, s, e, amp) {
    const P = PH[ph];
    if (!P) return;
    if (P.diph) {
      const mid = s + (e - s) * 0.55;
      pushSeg(segs, P.diph[0], s, mid, amp);
      pushSeg(segs, P.diph[1], mid, e, amp);
      return;
    }
    const dur = Math.max(e - s, 20);
    const isSil = ph === 'sil';
    const hw = isSil ? Math.max(dur * 0.5, 60) : Math.max(dur * 0.55, 40) * (P.v ? 1.35 : 1);
    segs.push({
      ph, s, e, c: (s + e) / 2, hw, reach: hw * 2.2,
      o: Math.min(1.15, P.o * (amp || 1)), r: P.r, wo: P.wo, wr: P.wr
    });
  }

  // ---------------------------------------------------------------------
  // 8. Timeline from PREDICTED durations (browser voice)
  // ---------------------------------------------------------------------
  function buildPredicted(text) {
    const toks = tokenize(text);
    const segs = [], words = [];
    let t = 0;
    pushSeg(segs, 'sil', t, t + 50, 1); t += 50;
    for (let ti = 0; ti < toks.length; ti++) {
      const tok = toks[ti];
      if (tok.k === 'p') {
        const pz = PAUSE[tok.t] || 0;
        if (pz) { pushSeg(segs, 'sil', t, t + pz, 1); t += pz; }
        continue;
      }
      const { list, isFunc } = tokenPhonemes(tok);
      if (!list.length) continue;
      const nxt = toks[ti + 1];
      const phraseEnd = !nxt || (nxt.k === 'p' && (PAUSE[nxt.t] || 0) >= 200);
      const tempo = isFunc ? 0.80 : 1.0;
      const wStart = t;
      list.forEach((x, k) => {
        let d = PH[x.p] ? PH[x.p].d * tempo : 60;
        if (k === list.length - 1 && phraseEnd) d *= 1.45;        // phrase-final lengthening
        if (PH[x.p] && PH[x.p].wo >= 3) d = Math.max(d, 58);      // lips need time to close
        pushSeg(segs, x.p, t, t + d, x.amp || 1);
        t += d;
      });
      words.push({ cs: tok.cs, ce: tok.ce, s: wStart, e: t });
    }
    const speechEnd = t;
    pushSeg(segs, 'sil', t, t + 260, 1);
    return { segs, words, speechEnd, total: t + 260, aligned: false, text };
  }

  // ---------------------------------------------------------------------
  // 9. Timeline from REAL character timestamps (ElevenLabs alignment)
  // ---------------------------------------------------------------------
  function buildAligned(chars, startSec, endSec) {
    let text = '';
    const idxMap = []; // text position → alignment index
    chars.forEach((ch, ai) => { for (let k = 0; k < String(ch).length; k++) { text += String(ch)[k]; idxMap.push(ai); } });
    const T0 = (pos) => startSec[idxMap[Math.max(0, Math.min(pos, idxMap.length - 1))]] * 1000;
    const T1 = (pos) => endSec[idxMap[Math.max(0, Math.min(pos, idxMap.length - 1))]] * 1000;

    const toks = tokenize(text).filter((k) => k.k !== 'p');
    const segs = [], words = [];
    let prevEnd = 0, lastEnd = 0;

    toks.forEach((tok) => {
      const { list, isFunc } = tokenPhonemes(tok);
      if (!list.length) return;
      const wS = T0(tok.cs), wE = T1(tok.ce - 1);
      if (!isFinite(wS) || !isFinite(wE) || wE <= wS) return;
      const tempo = isFunc ? 0.8 : 1;
      const weights = list.map((x) => (PH[x.p] ? PH[x.p].d : 60) * tempo);
      const W = weights.reduce((a, b) => a + b, 0);
      let acc = 0, prevS = wS - 15;
      const timed = list.map((x, k) => {
        const ps = wS + (acc / W) * (wE - wS);
        acc += weights[k];
        const pe = wS + (acc / W) * (wE - wS);
        const ls = T0(x.s), le = T1(Math.max(x.s, x.e - 1));
        let s = ps, e = pe;
        if (isFinite(ls) && isFinite(le) && le > ls) { s = 0.5 * ps + 0.5 * ls; e = 0.5 * pe + 0.5 * le; }
        s = Math.max(s, prevS + 12);
        e = Math.max(e, s + 32);
        prevS = s;
        return { x, s, e };
      });
      if (wS - prevEnd > 70) pushSeg(segs, 'sil', prevEnd, wS, 1);
      timed.forEach(({ x, s, e }) => pushSeg(segs, x.p, s, e, x.amp || 1));
      const wEnd = timed[timed.length - 1].e;
      words.push({ cs: tok.cs, ce: tok.ce, s: wS, e: wEnd });
      prevEnd = wEnd; lastEnd = wEnd;
    });
    const first = words.length ? words[0].s : 0;
    if (first > 40) segs.unshift({ ph: 'sil', s: 0, e: first, c: first / 2, hw: Math.max(first / 2, 60), reach: Math.max(first, 120) * 1.1, o: 0, r: 0, wo: 1.2, wr: 0.5 });
    pushSeg(segs, 'sil', lastEnd, lastEnd + 300, 1);
    return { segs, words, speechEnd: lastEnd, total: lastEnd + 300, aligned: true, text };
  }

  // ---------------------------------------------------------------------
  // 10. Cohen–Massaro dominance blending
  //     Every segment exerts a Gaussian-shaped "dominance" around its centre;
  //     the mouth pose is the dominance-weighted average of all nearby
  //     targets, computed separately for opening and lip shape.
  // ---------------------------------------------------------------------
  function evalAt(tl, t) {
    let so = 0, ao = 0, sr = 0, ar = 0, best = null, bestK = 0;
    const segs = tl.segs;
    for (let i = 0; i < segs.length; i++) {
      const g = segs[i];
      const dt = t - g.c;
      if (dt > g.reach || dt < -g.reach) continue;
      const q = dt / g.hw;
      const k = Math.exp(-1.4 * q * q);
      const wo = g.wo * k, wr = g.wr * k;
      so += wo * g.o; ao += wo;
      sr += wr * g.r; ar += wr;
      if (k > bestK) { bestK = k; best = g; }
    }
    return {
      open: ao > 1e-4 ? so / ao : 0,
      round: ar > 1e-4 ? sr / ar : 0,
      ph: best ? best.ph : 'sil'
    };
  }

  function wordIndexAt(tl, t) {
    const w = tl.words;
    let lo = 0, hi = w.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (w[mid].s <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }
  // first word whose character range reaches `charIndex` (for onboundary)
  function wordIndexForChar(tl, charIndex) {
    const w = tl.words;
    for (let i = 0; i < w.length; i++) if (charIndex < w[i].ce) return i;
    return w.length - 1;
  }

  return { PH, tokenize, g2pWord, buildPredicted, buildAligned, evalAt, wordIndexAt, wordIndexForChar };
})();

if (typeof module !== 'undefined') module.exports = LS;
const stage = document.getElementById('stage');
  const shadowEl = document.getElementById('shadow');
  const labelEl = document.getElementById('label');
  const speakText = document.getElementById('speakText');
  const speakBtn = document.getElementById('speakBtn');
  const langSelect = document.getElementById('langSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const rateInput = document.getElementById('rate');
  const rateVal = document.getElementById('rateVal');
  const syncInput = document.getElementById('syncOff');
  const syncVal = document.getElementById('syncVal');
  const statusEl = document.getElementById('status');
  const dbgEl = document.getElementById('dbg');
  const W = 360, H = 360;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---- small persistence helper (just remembers the sync slider) ----
  function lsGet(key) { try { return localStorage.getItem('botlip:' + key); } catch (e) { return null; } }
  function lsSet(key, val) { try { localStorage.setItem('botlip:' + key, String(val)); } catch (e) {} }

  let syncOffsetMs = parseInt(lsGet('sync') || '0', 10) || 0;
  syncInput.value = syncOffsetMs;
  const paintSync = () => { syncVal.textContent = (syncOffsetMs > 0 ? '+' : '') + syncOffsetMs + ' ms'; };
  paintSync();
  syncInput.addEventListener('input', () => { syncOffsetMs = parseInt(syncInput.value, 10) || 0; lsSet('sync', syncOffsetMs); paintSync(); });
  rateInput.addEventListener('input', () => { rateVal.textContent = parseFloat(rateInput.value).toFixed(2) + '×'; });

  // ---- populate the browser's ACTUAL installed voices, grouped by language.
  // Modern Chrome/Edge ship natural/neural "Online" voices for dozens of
  // languages already, with zero login and zero network calls from this
  // page — we just need to surface and rank them properly. ----
  function qualityScore(v) {
    const n = v.name.toLowerCase();
    let score = 0;
    if (/natural|online|neural/.test(n)) score += 100;
    if (/google/.test(n)) score += 40;
    if (/microsoft/.test(n)) score += 20;
    if (v.localService === false) score += 10;
    return score;
  }

  let langDisplay = null;
  try { langDisplay = new Intl.DisplayNames(['en'], { type: 'language' }); } catch (e) {}

  function languageLabel(lang) {
    const base = lang.split('-')[0];
    let name = base;
    if (langDisplay) { try { name = langDisplay.of(base) || base; } catch (e) {} }
    return name + ' (' + lang + ')';
  }

  let allVoices = [];

  function populateVoiceList() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    allVoices = voices.slice().sort((a, b) => qualityScore(b) - qualityScore(a));

    const prevLang = langSelect.value;
    const prevVoiceName = voiceSelect._voiceList && voiceSelect._voiceList[parseInt(voiceSelect.value, 10)] &&
      voiceSelect._voiceList[parseInt(voiceSelect.value, 10)].name;

    const byLang = new Map(); // lang -> best quality score seen
    allVoices.forEach((v) => {
      const cur = byLang.get(v.lang);
      const q = qualityScore(v);
      if (cur === undefined || q > cur) byLang.set(v.lang, q);
    });
    const langs = Array.from(byLang.keys()).sort((a, b) => {
      const aEn = a.startsWith('en') ? 1 : 0, bEn = b.startsWith('en') ? 1 : 0;
      if (aEn !== bEn) return bEn - aEn;
      if (byLang.get(b) !== byLang.get(a)) return byLang.get(b) - byLang.get(a);
      return languageLabel(a).localeCompare(languageLabel(b));
    });

    langSelect.innerHTML = '';
    langs.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = languageLabel(lang);
      langSelect.appendChild(opt);
    });
    if (langs.includes(prevLang)) langSelect.value = prevLang;

    populateVoicesForLanguage(prevVoiceName);
  }

  function populateVoicesForLanguage(preferVoiceName) {
    const lang = langSelect.value;
    const matches = allVoices.filter((v) => v.lang === lang);
    voiceSelect.innerHTML = '';
    matches.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      const tag = qualityScore(v) >= 100 ? ' ★ natural' : '';
      opt.textContent = v.name + tag;
      voiceSelect.appendChild(opt);
    });
    voiceSelect._voiceList = matches;
    if (preferVoiceName) {
      const keep = matches.findIndex((v) => v.name === preferVoiceName);
      if (keep >= 0) voiceSelect.value = keep;
    }
  }

  langSelect.addEventListener('change', () => populateVoicesForLanguage());

  if ('speechSynthesis' in window) {
    populateVoiceList();
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
  }

  // ---- scene setup ----
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  stage.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x404040, 1.1);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x88aaff, 0.35);
  rimLight.position.set(3, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xffffff, 0.25);
  fillLight.position.set(2, 1, 4);
  scene.add(fillLight);

  // ---- the sphere (the bot's head/body) ----
  const sphereRadius = 2.2;
  const sphereGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
  const sphereMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphereMesh);

  // ---- eyes group: pivots at sphere center so eyes swing around the real curved surface ----
  const eyesGroup = new THREE.Group();
  sphereMesh.add(eyesGroup);

  const eyeSurfaceGap = 0.015;

  function positionOnSphere(mesh, dir) {
    const d = dir.clone().normalize();
    mesh.position.copy(d).multiplyScalar(sphereRadius + eyeSurfaceGap);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
  }

  function makeEye() {
    const geo = new THREE.CircleGeometry(0.42, 48);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.baseScaleY = 1;
    mesh.userData.curScaleX = 1;
    mesh.userData.curScaleY = 1;
    mesh.userData.curOffsetY = 0;
    mesh.userData.targetScaleX = 1;
    mesh.userData.targetScaleY = 1;
    mesh.userData.targetOffsetY = 0;
    mesh.userData.curColor = new THREE.Color(0xffffff);
    mesh.userData.targetColor = new THREE.Color(0xffffff);
    return mesh;
  }

  function positionEyeOnSphere(eye, xOffset, zBias) {
    positionOnSphere(eye, new THREE.Vector3(xOffset, 0, zBias));
  }

  const eyeSpacing = 0.62;

  const leftEye = makeEye();
  positionEyeOnSphere(leftEye, -eyeSpacing, sphereRadius);
  eyesGroup.add(leftEye);

  const rightEye = makeEye();
  positionEyeOnSphere(rightEye, eyeSpacing, sphereRadius);
  eyesGroup.add(rightEye);

  const eyes = [leftEye, rightEye];

  // ---- mouth: the curvy smile/frown LINE on top, with a rounded "open
  // mouth" drop hanging from it. At rest the drop has zero depth, so only the
  // line shows; when talking, the lip-sync engine drives both the opening and
  // the lip shape (spread / neutral / rounded) every frame. ----
  const mouthAnchorDir = new THREE.Vector3(0, -0.95, sphereRadius).normalize();

  const mouthGroup = new THREE.Group();
  eyesGroup.add(mouthGroup);
  positionOnSphere(mouthGroup, mouthAnchorDir);
  const mouthBasePos = mouthGroup.position.clone();
  const mouthUp = new THREE.Vector3(0, 1, 0).applyQuaternion(mouthGroup.quaternion);

  const topSegments = 24;
  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((topSegments + 1) * 3), 3));
  const topMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const topLine = new THREE.Line(topGeo, topMat);
  mouthGroup.add(topLine);

  const mouthState = {
    curCurve: 0.05, curWidth: 0.5, targetCurve: 0.05, targetWidth: 0.5,
    curTalkOpen: 1.0, targetTalkOpen: 1.0,
    curTalkSpan: 0.58, targetTalkSpan: 0.58
  };

  function topCurveY(u, curve) { return curve * (u * u - 1); }

  function rebuildTopLine(curve, halfWidth) {
    const pos = topGeo.attributes.position;
    for (let i = 0; i <= topSegments; i++) {
      const u = (i / topSegments) * 2 - 1;
      pos.setXYZ(i, u * halfWidth, topCurveY(u, curve), 0);
    }
    pos.needsUpdate = true;
  }
  rebuildTopLine(mouthState.curCurve, mouthState.curWidth);

  const dropMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  const dropMesh = new THREE.Mesh(new THREE.BufferGeometry(), dropMat);
  dropMesh.renderOrder = 1;
  mouthGroup.add(dropMesh);

  const dropState = { curOpen: 0, curVel: 0, targetOpen: 0 };

  // Rounded mouth outline. Plain deterministic geometry (never a spline, so
  // it can't overshoot or self-intersect): each side is one quadratic curve
  // whose control point sits at the "sharp corner", giving a soft rounded
  // bottom. `open` sets the depth; `round` (-1 spread … +1 pursed) changes
  // the depth/width character of the shape (wide + shallow for "ee"/"s",
  // narrow + deep for "oo"/"oh"). halfWidth already contains the round-based
  // width change, so the drop's top edge always lands exactly on the line.
  function buildMouthOutline(curve, halfWidth, open, round, span) {
    const innerHalf = halfWidth * (span || 0.58);
    const topSegs = 12;
    const shape = new THREE.Shape();
    const topPts = [];
    let lowestTopY = Infinity;
    for (let i = 0; i <= topSegs; i++) {
      const x = -innerHalf + (i / topSegs) * (innerHalf * 2);
      const y = topCurveY(x / halfWidth, curve);
      topPts.push(new THREE.Vector2(x, y));
      if (y < lowestTopY) lowestTopY = y;
    }
    const depth = innerHalf * (0.35 + 0.95 * open) * open * (1 + 0.35 * round);
    const bottomY = lowestTopY - depth;
    const leftMost = topPts[0];
    const rightMost = topPts[topPts.length - 1];
    topPts.forEach((p, i) => { if (i === 0) shape.moveTo(p.x, p.y); else shape.lineTo(p.x, p.y); });
    shape.quadraticCurveTo(rightMost.x, bottomY, 0, bottomY);
    shape.quadraticCurveTo(leftMost.x, bottomY, leftMost.x, leftMost.y);
    return shape;
  }

  function buildDropShape(curve, halfWidth, open, round, span) {
    dropMesh.geometry.dispose();
    if (open <= 0.012) {
      dropMesh.geometry = new THREE.BufferGeometry();
      return;
    }
    dropMesh.geometry = new THREE.ShapeGeometry(buildMouthOutline(curve, halfWidth, open, round, span));
  }

  // =========================================================================
  // LIP-SYNC DRIVER — connects the LS engine (above) to the sound being made.
  //   timeline : phoneme segments in "timeline ms"
  //   playhead : returns the current position on that timeline
  //     • ElevenLabs → the <audio> element's own clock (exact timestamps)
  //     • Browser    → a clock re-anchored on every word-boundary event, with
  //                    a pace remembered per voice
  // =========================================================================
  let timeline = null;
  let playhead = null;
  let activeVoicePath = null;          // 'browser' | 'waveform' | null
  let audioCtx = null, analyser = null, analyserData = null, analyserSrc = null;
  let shapeMix = 0, shapeMixTarget = 0;
  let talkBlend = 0;                   // 0 idle … 1 talking (smooth)
  let envSm = 0, envPeak = 0.05;       // live audio level (ElevenLabs path)
  let lastWordIdx = -2;
  let currentAudioEl = null;
  let speaking = false;
  let cancelled = false;
  let lastPhoneme = 'sil';

  const bp = { anchorReal: 0, anchorRel: 0, scale: 1, startReal: 0, boundaries: 0 };

  function setupAnalyser(audioEl) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      analyserSrc = audioCtx.createMediaElementSource(audioEl);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserData = new Uint8Array(analyser.fftSize);
      analyserSrc.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e) {
      analyser = null;
    }
  }

  function getAudioAmplitude() {
    if (!analyser || !analyserData) return null;
    analyser.getByteTimeDomainData(analyserData);
    let sum = 0;
    for (let i = 0; i < analyserData.length; i++) {
      const v = (analyserData[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / analyserData.length);
  }

  function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  // ---- pointer tracking: drives eyesGroup rotation, sweeping eyes around the sphere ----
  let targetRotX = 0, targetRotY = 0;
  let desiredRotX = 0, desiredRotY = 0;
  // Reduce sensitivity on wide displays while keeping smaller screens lively.
  function getMaxLookAngle() {
    const viewport = Math.max(window.innerWidth, window.innerHeight);
    return clamp(0.38 * Math.sqrt(1024 / Math.max(viewport, 1)), 0.20, 0.38);
  }

  function setLookFromPointer(clientX, clientY) {
    const botHost = document.querySelector('.orbit-bot-host');
    const botRect = botHost ? botHost.getBoundingClientRect() : null;
    const centerX = botRect ? botRect.left + botRect.width / 2 : window.innerWidth / 2;
    const centerY = botRect ? botRect.top + botRect.height / 2 : window.innerHeight / 2;
    // Normalize continuously from the bot center to each viewport edge. This
    // prevents the eyes from saturating and stopping in the middle of a large
    // screen, while keeping the bot center exactly at the neutral pose.
    const normalizeFromCenter = (value, center, viewportSize) => {
      const distance = value - center;
      const radius = distance < 0 ? center : viewportSize - center;
      return clamp(distance / Math.max(radius, 1), -1, 1);
    };
    const nx = normalizeFromCenter(clientX, centerX, window.innerWidth);
    const ny = normalizeFromCenter(clientY, centerY, window.innerHeight);
    const maxLookAngle = getMaxLookAngle();
    desiredRotY = nx * maxLookAngle;
    desiredRotX = ny * maxLookAngle;
  }

  window.addEventListener('mousemove', (e) => {
    setLookFromPointer(e.clientX, e.clientY);
  });

  window.addEventListener('pointermove', (e) => {
    setLookFromPointer(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      setLookFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  let idleTimer = null;
  function scheduleWander() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(wander, 1800);
  }
  function wander() {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * getMaxLookAngle() * 0.85;
    desiredRotY = Math.cos(angle) * r;
    desiredRotX = Math.sin(angle) * r;
    scheduleWander();
  }
  // The site version stays locked to the last cursor position instead of
  // wandering away from the arrow after an idle timeout.

  // ---- expression cycling ----
  // talkOpen = overall mouth-opening gain for this emotion while talking
  // talkSpan = how much of this mood's mouth-line width the talking mouth spans
  const MOOD_PARAMS = {
    surprised: { scaleY: 1.25, scaleX: 1.25, offsetY: 0, color: 0xffffff, mouthCurve: -0.05, mouthWidth: 0.2, talkOpen: 1.0, talkSpan: 0.8 },
    happy:     { scaleY: 1.25, scaleX: 1.25, offsetY: 0, color: 0xfff0b0, mouthCurve: 0.05,  mouthWidth: 0.2, talkOpen: 1.0, talkSpan: 0.8 },
    sad:       { scaleY: 1.25, scaleX: 1.25, offsetY: 0, color: 0x9ecbff, mouthCurve: -0.05, mouthWidth: 0.2, talkOpen: 1.0, talkSpan: 0.8 }
  };
  const moods = ['surprised', 'happy', 'sad'];
  const DEFAULT_MOOD = 'surprised';
  let moodIndex = moods.indexOf(DEFAULT_MOOD);
  let currentMood = DEFAULT_MOOD;
  let moodCycleTimer = null;

  function applyMoodShape() {
    const p = MOOD_PARAMS[currentMood] || MOOD_PARAMS[DEFAULT_MOOD];
    eyes.forEach((eye) => {
      eye.userData.targetScaleX = p.scaleX;
      eye.userData.targetScaleY = p.scaleY;
      eye.userData.targetOffsetY = p.offsetY;
      eye.userData.targetColor.set(p.color);
    });
    mouthState.targetCurve = p.mouthCurve;
    mouthState.targetWidth = p.mouthWidth;
    mouthState.targetTalkOpen = p.talkOpen;
    mouthState.targetTalkSpan = p.talkSpan;
  }

  function setMood(mood) {
    currentMood = mood;
    if (!speaking) {
      labelEl.style.opacity = 0;
      setTimeout(() => {
        if (!speaking) labelEl.textContent = mood === DEFAULT_MOOD ? 'click the bot' : mood;
        labelEl.style.opacity = 1;
      }, 140);
    }
    applyMoodShape();
  }

  function nextMood() {
    moodIndex = (moodIndex + 1) % moods.length;
    setMood(moods[moodIndex]);
  }

  setMood(DEFAULT_MOOD);
  moodCycleTimer = setInterval(nextMood, 3200);

  let squashX = 0;
  let squashV = 0;
  const springStiffness = 140;
  const springDamping = 9;

  renderer.domElement.addEventListener('click', () => {
    nextMood();
    squashV += 7;
  });

  let blinkT = 0;
  let blinking = false;

  function blinkOnce() {
    if (currentMood !== DEFAULT_MOOD) return;
    blinking = true;
  }

  function scheduleBlink() {
    const delay = 2600 + Math.random() * 2200;
    setTimeout(() => {
      blinkOnce();
      scheduleBlink();
    }, delay);
  }
  scheduleBlink();

  // =========================================================================
  // SPEECH
  // =========================================================================
  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.style.color = isError ? '#9a4d4d' : '#7a8a7a';
  }

  function setSpeakingState(isSpeaking) {
    speaking = isSpeaking;
    speakBtn.textContent = isSpeaking ? 'Stop' : 'Speak';
    if (isSpeaking) {
      clearInterval(moodCycleTimer);
      moodCycleTimer = null;
      lastWordIdx = -2;
      labelEl.style.opacity = 1;
      labelEl.textContent = 'talking…';
    } else {
      if (!moodCycleTimer) moodCycleTimer = setInterval(nextMood, 3200);
      timeline = null;
      playhead = null;
      activeVoicePath = null;
      analyser = null;
      dropState.targetOpen = 0;
      shapeMixTarget = 0;
      setMood(currentMood);
    }
  }

  function stopSpeaking() {
    cancelled = true;
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
    setSpeakingState(false);
  }

  // ---- Browser voice: modelled phoneme timeline, re-anchored on every
  // word-boundary event the browser reports. Free, no key, no login. ----
  function speakWithBrowser(text) {
    if (!('speechSynthesis' in window)) {
      setStatus('This browser has no built-in speech synthesis available.', true);
      return;
    }
    cancelled = false;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const rate = parseFloat(rateInput.value) || 1;
    utter.rate = rate;
    utter.pitch = 1.0;

    const list = voiceSelect._voiceList;
    const idx = parseInt(voiceSelect.value, 10);
    if (list && list[idx]) { utter.voice = list[idx]; utter.lang = list[idx].lang; }

    const tl = LS.buildPredicted(text);

    utter.onstart = () => {
      activeVoicePath = 'browser';
      timeline = tl;
      bp.scale = 1 / rate;           // real ms per timeline ms, refined below
      bp.anchorReal = bp.startReal = performance.now();
      bp.anchorRel = 0;
      bp.boundaries = 0;
      playhead = () => bp.anchorRel + (performance.now() - bp.anchorReal) / bp.scale;
      setStatus('', false);
      setSpeakingState(true);
    };

    // Whenever the browser reports a real word boundary, snap the mouth's
    // clock to that word and update the measured pace for all words to come.
    utter.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      if (typeof e.charIndex !== 'number' || timeline !== tl) return;
      const w = tl.words[LS.wordIndexForChar(tl, e.charIndex)];
      if (!w) return;
      const now = performance.now();
      const dReal = now - bp.anchorReal, dRel = w.s - bp.anchorRel;
      if (bp.boundaries > 0 && dRel > 120 && dReal > 60) {
        bp.scale = clamp(0.55 * bp.scale + 0.45 * (dReal / dRel), 0.35, 3);
      }
      bp.anchorReal = now;
      bp.anchorRel = w.s;
      bp.boundaries++;
    };

    utter.onend = () => {
      if (timeline === tl || !timeline) setSpeakingState(false);
    };
    utter.onerror = (e) => {
      const benign = e && (e.error === 'canceled' || e.error === 'interrupted');
      if (!cancelled && !benign) setStatus('Speech synthesis error.', true);
      if (timeline === tl || !timeline) setSpeakingState(false);
    };

    window.speechSynthesis.speak(utter);
  }

  speakBtn.addEventListener('click', () => {
    if (speaking) { stopSpeaking(); return; }
    const text = speakText.value.trim();
    if (!text) return;
    speakWithBrowser(text);
  });

  speakText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') speakBtn.click();
  });

  // ---- animation loop ----
  const baseY = 0;
  let t = 0;
  let dbgTimer = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    // Smooth the cursor target first, then ease the face toward it. This
    // removes tiny mouse-event jumps without making the bot feel laggy.
    const targetEase = 1 - Math.exp(-dt * 26);
    targetRotX += (desiredRotX - targetRotX) * targetEase;
    targetRotY += (desiredRotY - targetRotY) * targetEase;
    const lookEase = 1 - Math.exp(-dt * 16);
    eyesGroup.rotation.y += (targetRotY - eyesGroup.rotation.y) * lookEase;
    eyesGroup.rotation.x += (targetRotX - eyesGroup.rotation.x) * lookEase;

    const floatY = Math.sin(t * 1.4) * 0.28;
    sphereMesh.position.y = baseY + floatY;
    sphereMesh.rotation.z = Math.sin(t * 1.4) * 0.05;
    sphereMesh.rotation.x = Math.sin(t * 0.9) * 0.02;

    const accel = -springStiffness * squashX - springDamping * squashV;
    squashV += accel * dt;
    squashX += squashV * dt;
    const squash = 1 - squashX * 0.045;
    sphereMesh.scale.set(1 / squash, squash, 1 / squash);

    if (blinking) {
      blinkT += dt * 7.5;
      if (blinkT >= 1) { blinkT = 1; blinking = false; }
    } else if (blinkT > 0) {
      blinkT -= dt * 7.5;
      if (blinkT < 0) blinkT = 0;
    }
    const blinkEased = easeInOutSine(blinkT);

    eyes.forEach((eye) => {
      const shapeEase = 1 - Math.exp(-dt * 11);
      eye.userData.curScaleX += (eye.userData.targetScaleX - eye.userData.curScaleX) * shapeEase;
      eye.userData.curScaleY += (eye.userData.targetScaleY - eye.userData.curScaleY) * shapeEase;
      eye.userData.curOffsetY += (eye.userData.targetOffsetY - eye.userData.curOffsetY) * shapeEase;
      eye.userData.curColor.lerp(eye.userData.targetColor, shapeEase);
      eye.material.color.copy(eye.userData.curColor);

      const closeAmount = Math.max(1 - blinkEased, 0.05);
      eye.scale.set(eye.userData.curScaleX, eye.userData.curScaleY * closeAmount, 1);

      const upLocal = new THREE.Vector3(0, 1, 0).applyQuaternion(eye.quaternion);
      const basePos = eye.userData.basePos || (eye.userData.basePos = eye.position.clone());
      eye.position.copy(basePos).addScaledVector(upLocal, eye.userData.curOffsetY);
    });

    const mouthEase = 1 - Math.exp(-dt * 11);
    mouthState.curCurve += (mouthState.targetCurve - mouthState.curCurve) * mouthEase;
    mouthState.curWidth += (mouthState.targetWidth - mouthState.curWidth) * mouthEase;
    mouthState.curTalkOpen += (mouthState.targetTalkOpen - mouthState.curTalkOpen) * mouthEase;
    mouthState.curTalkSpan += (mouthState.targetTalkSpan - mouthState.curTalkSpan) * mouthEase;
    topMat.color.copy(leftEye.userData.curColor);

    // ---------------- LIP-SYNC: read the mouth pose for "now" ----------------
    if (speaking && timeline && playhead) {
      let tMs = playhead() + syncOffsetMs;
      // browser clock only: if our pace estimate runs ahead of the real voice,
      // hold on the last word instead of closing the mouth while sound continues
      if (activeVoicePath === 'browser') tMs = clamp(tMs, 0, timeline.speechEnd - 100);
      const pose = LS.evalAt(timeline, tMs);
      let open = pose.open;

      if (activeVoicePath === 'waveform' && analyser) {
        // real loudness scales the phonetic shape: quiet syllables open less,
        // loud ones fully, and true silence closes the mouth even if timing drifts
        const amp = getAudioAmplitude();
        if (amp !== null) {
          envSm += (amp - envSm) * (1 - Math.exp(-dt * 25));
          envPeak = Math.max(envPeak * Math.exp(-dt * 0.15), envSm, 0.05);
          const envNorm = envSm / envPeak;
          let gain = 0.72 + 0.5 * envNorm;
          if (envNorm < 0.07) gain *= 0.35;
          open *= gain;
        }
      }

      dropState.targetOpen = Math.min(open, 1.15) * mouthState.curTalkOpen;
      shapeMixTarget = pose.round;
      lastPhoneme = pose.ph;

      const wi = LS.wordIndexAt(timeline, tMs + 40);
      if (wi !== lastWordIdx && wi >= 0) {
        lastWordIdx = wi;
        const w = timeline.words[wi];
        labelEl.textContent = (timeline.text || '').slice(w.cs, w.ce) || 'talking…';
      }
    } else {
      dropState.targetOpen = 0;
      shapeMixTarget = 0;
    }

    // Spring on the opening — stiff and near critically damped, so it hits
    // full opens/closures on each phoneme and still settles naturally.
    const mouthSpringStiffness = 900, mouthSpringDamping = 42;
    const dropAccel = mouthSpringStiffness * (dropState.targetOpen - dropState.curOpen) - mouthSpringDamping * dropState.curVel;
    dropState.curVel += dropAccel * dt;
    dropState.curOpen += dropState.curVel * dt;
    if (dropState.curOpen < 0) { dropState.curOpen = 0; dropState.curVel *= -0.25; }

    // lip shape (spread ↔ pursed) follows quickly enough to track single phonemes
    shapeMix += (shapeMixTarget - shapeMix) * (1 - Math.exp(-dt * 28));
    talkBlend += ((speaking ? 1 : 0) - talkBlend) * (1 - Math.exp(-dt * 12));

    // Effective mouth width: talking makes the mouth bigger, and lip shape
    // widens it (spread) or narrows it (pursed). Applied to the line AND the
    // drop so they always stay attached.
    const widthMod = shapeMix >= 0 ? 1 - 0.42 * shapeMix : 1 - 0.30 * shapeMix;
    const effHalf = mouthState.curWidth * (1 + (widthMod - 1) * talkBlend) * (1 + 0.7 * talkBlend);
    rebuildTopLine(mouthState.curCurve, effHalf);
    buildDropShape(mouthState.curCurve, effHalf, dropState.curOpen, shapeMix, mouthState.curTalkSpan);
    dropMat.color.copy(leftEye.userData.curColor);

    const puff = Math.max(dropState.curOpen, 0);
    mouthGroup.scale.set(1 + puff * 0.05, 1 - puff * 0.03, 1);
    // jaw: the whole mouth drops a touch as it opens
    mouthGroup.position.copy(mouthBasePos).addScaledVector(mouthUp, -puff * 0.06);

    const talkBob = speaking ? puff * 0.06 : 0;
    sphereMesh.position.y -= talkBob;
    sphereMesh.rotation.z += talkBob * 0.25;

    const shadowScale = 1 - floatY * 0.12;
    shadowEl.style.transform = `scale(${shadowScale})`;
    shadowEl.style.opacity = 0.5 + floatY * 0.1;

    // small live readout so the sync is easy to judge
    dbgTimer += dt;
    if (dbgTimer > 0.1) {
      dbgTimer = 0;
      if (speaking) {
        dbgEl.textContent = '/' + lastPhoneme + '/ · pace ' + (1 / bp.scale).toFixed(2) + '× · ' + bp.boundaries + ' word sync' + (bp.boundaries === 1 ? '' : 's');
      }
    }

    renderer.render(scene, camera);
  }

  animate();

})();
