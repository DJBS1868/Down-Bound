(() => {
  'use strict';

  const {
    SAVE_KEY, MAX_SLOTS, SLOT_COSTS, SKILL_COOLDOWN, HERO_XP_BASE,
    HEROES, HERO_BY_ID, RARITY_LABEL, ENEMY_TYPES, DEPTH_NAMES,
    PAD_POSITIONS, HERO_FORMATIONS, ENEMY_FORMATIONS, ICONS,
    portraitSvg, enemySvg, heroSpriteSvg
  } = window.DB_DATA;
  const { surfaceArt, caveArt, battleArt, chestSvg, shopChestSvg } = window.DB_ART;

  const $ = (selector, root = document) => root.querySelector(selector);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const rand = (min, max) => min + Math.random() * (max - min);

  const app = $('#app');
  const stage = $('#stage');
  const overlayRoot = $('#overlayRoot');
  const toastRoot = $('#toastRoot');
  const dragRoot = $('#dragRoot');
  const coinCount = $('#coinCount');
  const coinPill = $('#coinPill');
  const soundBtn = $('#soundBtn');
  const helpBtn = $('#helpBtn');
  const brandBtn = $('#brandBtn');

  let view = 'surface';
  let cave = null;
  let battle = null;
  let battleRaf = 0;
  let lastFrame = 0;
  let drag = null;
  let suppressClickUntil = 0;
  let lastHitSound = 0;
  let lastDeniedToast = 0;
  let activeResult = null;

  /* =========================================================
     STATE
     ========================================================= */

  function defaultState() {
    return {
      version: 2,
      coins: 35,
      slots: 1,
      heroes: ['pip', 'nyx'],
      levels: { pip: 1, nyx: 1 },
      xp: { pip: 0, nyx: 0 },
      cart: [],
      depth: 1,
      bestDepth: 1,
      wins: 0,
      chests: 0,
      sound: true
    };
  }

  function loadState() {
    const base = defaultState();
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    } catch (error) {
      raw = null;
    }
    if (!raw || typeof raw !== 'object') return base;

    const owned = Array.from(new Set((Array.isArray(raw.heroes) ? raw.heroes : [])
      .filter(id => HERO_BY_ID[id])));
    ['pip', 'nyx'].forEach(id => { if (!owned.includes(id)) owned.push(id); });

    const levels = {};
    const xp = {};
    owned.forEach(id => {
      levels[id] = clamp(Math.round(Number(raw.levels?.[id]) || 1), 1, 12);
      xp[id] = Math.max(0, Math.round(Number(raw.xp?.[id]) || 0));
    });

    const slots = clamp(Math.round(Number(raw.slots) || 1), 1, MAX_SLOTS);
    const cart = Array.from(new Set((Array.isArray(raw.cart) ? raw.cart : [])
      .filter(id => owned.includes(id)))).slice(0, slots);

    return {
      version: 2,
      coins: clamp(Math.round(Number(raw.coins) || 0), 0, 999999),
      slots,
      heroes: owned,
      levels,
      xp,
      cart,
      depth: clamp(Math.round(Number(raw.depth) || 1), 1, 999),
      bestDepth: clamp(Math.round(Number(raw.bestDepth) || raw.depth || 1), 1, 999),
      wins: Math.max(0, Math.round(Number(raw.wins) || 0)),
      chests: Math.max(0, Math.round(Number(raw.chests) || 0)),
      sound: raw.sound !== false
    };
  }

  let state = loadState();

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) { /* Storage can be unavailable in private contexts. */ }
  }

  function owned(id) {
    return state.heroes.includes(id);
  }

  function levelOf(id) {
    return clamp(state.levels[id] || 1, 1, 12);
  }

  function xpNeeded(level) {
    return HERO_XP_BASE + (level - 1) * 34;
  }

  function heroStats(id) {
    const hero = HERO_BY_ID[id];
    const level = levelOf(id);
    const boost = 1 + (level - 1) * 0.135;
    return {
      ...hero,
      level,
      maxHp: Math.round(hero.hp * boost),
      power: Math.round(hero.atk * boost)
    };
  }

  function heroPortrait(id, withLevel = true, extraClass = '') {
    const hero = HERO_BY_ID[id];
    if (!hero) return '';
    return `<div class="portrait rarity-${hero.rarity} ${extraClass}">
      ${portraitSvg(hero)}
      ${withLevel ? `<span class="level-chip">${levelOf(id)}</span>` : ''}
    </div>`;
  }

  function updateHeader() {
    coinCount.textContent = String(state.coins);
    soundBtn.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    soundBtn.setAttribute('aria-label', state.sound ? 'Mute sound' : 'Enable sound');
  }

  function bumpCoins() {
    updateHeader();
    coinPill.classList.remove('bump');
    void coinPill.offsetWidth;
    coinPill.classList.add('bump');
    window.setTimeout(() => coinPill.classList.remove('bump'), 260);
  }

  function setCoins(value, animate = true) {
    state.coins = clamp(Math.round(value), 0, 999999);
    updateHeader();
    if (animate) bumpCoins();
  }

  /* =========================================================
     AUDIO
     ========================================================= */

  let audioCtx = null;
  let masterGain = null;

  function ensureAudio() {
    if (!state.sound) return null;
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.55;
        masterGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (error) {
      return null;
    }
  }

  function tone(freq, duration = 0.09, type = 'sine', volume = 0.035, delay = 0, slideTo = 0) {
    if (!state.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + duration);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.03);
  }

  function noiseBurst(duration = 0.08, volume = 0.025, frequency = 900) {
    if (!state.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
  }

  function sfx(name) {
    if (!state.sound) return;
    switch (name) {
      case 'click':
        tone(530, 0.045, 'triangle', 0.022, 0, 440);
        break;
      case 'equip':
        tone(390, 0.08, 'triangle', 0.03);
        tone(590, 0.1, 'triangle', 0.026, 0.07);
        break;
      case 'remove':
        tone(310, 0.08, 'triangle', 0.025, 0, 190);
        break;
      case 'deploy':
        tone(180, 0.12, 'sine', 0.04, 0, 330);
        tone(510, 0.08, 'triangle', 0.018, 0.08);
        break;
      case 'descend':
        tone(210, 0.6, 'sawtooth', 0.02, 0, 55);
        noiseBurst(0.55, 0.012, 460);
        break;
      case 'fight':
        tone(120, 0.26, 'sawtooth', 0.032, 0, 260);
        noiseBurst(0.2, 0.018, 700);
        break;
      case 'hit':
        if (performance.now() - lastHitSound < 55) return;
        lastHitSound = performance.now();
        noiseBurst(0.055, 0.014, 1150);
        tone(140, 0.05, 'square', 0.015, 0, 90);
        break;
      case 'crit':
        noiseBurst(0.1, 0.024, 1700);
        tone(160, 0.1, 'square', 0.022, 0, 80);
        break;
      case 'hurt':
        if (performance.now() - lastHitSound < 55) return;
        lastHitSound = performance.now();
        noiseBurst(0.075, 0.018, 420);
        tone(95, 0.08, 'sawtooth', 0.014, 0, 70);
        break;
      case 'special':
        tone(220, 0.3, 'sawtooth', 0.028, 0, 880);
        tone(660, 0.22, 'triangle', 0.022, 0.05, 1200);
        noiseBurst(0.16, 0.02, 1600);
        break;
      case 'heal':
        tone(520, 0.18, 'sine', 0.025);
        tone(660, 0.2, 'sine', 0.02, 0.08);
        tone(820, 0.26, 'sine', 0.018, 0.16);
        break;
      case 'coin':
        tone(1040, 0.07, 'triangle', 0.02);
        tone(1400, 0.13, 'triangle', 0.017, 0.055);
        break;
      case 'chestshake':
        tone(90, 0.08, 'square', 0.012, 0, 74);
        break;
      case 'chestopen':
        [392, 494, 587, 784, 988].forEach((freq, i) => {
          tone(freq, 0.22, 'triangle', 0.022, i * 0.07);
        });
        noiseBurst(0.4, 0.018, 1200);
        break;
      case 'reveal':
        [523, 659, 784, 1047].forEach((freq, i) => {
          tone(freq, 0.42, 'sine', 0.022, i * 0.06);
        });
        break;
      case 'upgrade':
        [330, 440, 554, 660, 880].forEach((freq, i) => {
          tone(freq, 0.16, 'triangle', 0.02, i * 0.045);
        });
        break;
      case 'win':
        [392, 523, 659, 784].forEach((freq, i) => {
          tone(freq, 0.48, 'sine', 0.024, i * 0.08);
        });
        tone(1047, 0.75, 'sine', 0.018, 0.34);
        break;
      case 'lose':
        tone(240, 0.25, 'triangle', 0.025, 0, 200);
        tone(180, 0.35, 'sine', 0.022, 0.18, 130);
        tone(120, 0.55, 'sine', 0.018, 0.38, 85);
        break;
      case 'error':
        tone(130, 0.09, 'square', 0.018, 0, 110);
        break;
      case 'select':
        tone(720, 0.05, 'sine', 0.015);
        break;
      case 'travel':
        tone(300, 0.2, 'sine', 0.02, 0, 450);
        break;
      default:
        tone(500, 0.05, 'triangle', 0.02);
    }
  }

  document.addEventListener('pointerdown', ensureAudio, { once: true, passive: true });

  /* =========================================================
     HELPERS
     ========================================================= */

  function toast(message, type = '') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    toastRoot.appendChild(node);
    while (toastRoot.children.length > 3) toastRoot.firstElementChild.remove();
    window.setTimeout(() => {
      node.classList.add('out');
      window.setTimeout(() => node.remove(), 260);
    }, 2300);
  }

  function depthName(depth) {
    const base = DEPTH_NAMES[(depth - 1) % DEPTH_NAMES.length];
    const loop = Math.floor((depth - 1) / DEPTH_NAMES.length);
    return loop > 0 ? `${base} ${loop + 1}` : base;
  }

  function waveFoeKeys(depth) {
    const count = Math.min(4, 1 + Math.floor((depth - 1) / 2));
    const seed = depth * 7919 + 17;
    let value = seed;
    const next = () => {
      value = (value * 48271) % 2147483647;
      return value / 2147483647;
    };
    let pool = ['bat'];
    if (depth === 2) pool = ['slime', 'bat'];
    else if (depth === 3) pool = ['goblin', 'bat', 'slime'];
    else if (depth === 4) pool = ['skeleton', 'spider', 'goblin'];
    else if (depth >= 5) pool = ['skeleton', 'spider', 'goblin', 'bat', 'slime'];
    if (depth >= 9) pool = ['skeleton', 'spider', 'goblin', 'wraith', 'bat'];

    const foes = [];
    if (depth % 5 === 0) {
      foes.push(depth % 10 === 0 ? 'wraith' : 'golem');
    }
    while (foes.length < count) {
      foes.push(pool[Math.floor(next() * pool.length)]);
    }
    return foes.slice(0, count);
  }

  function threatLevel(depth) {
    if (depth <= 2) return 1;
    if (depth <= 5) return 2;
    return 3;
  }

  function threatLabel(depth) {
    return ['Low', 'Rising', 'Deadly'][threatLevel(depth) - 1];
  }

  function estimatedReward(depth) {
    const foes = waveFoeKeys(depth);
    const base = 12 + depth * 3;
    const clear = 14 + depth * 2;
    return Math.round(foes.reduce((sum, key) => sum + base * ENEMY_TYPES[key].coins, 0) + clear);
  }

  function renderThreatDots(depth) {
    const level = threatLevel(depth);
    return `<span class="threat-dots">${[1, 2, 3].map(i => `<i class="${i <= level ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  function miniEnemyStack(foes) {
    return `<div class="enemy-stack">${foes.slice(0, 4).map(key => 
      `<span class="mini-foe">${enemySvg(key)}</span>`).join('')}</div>`;
  }

  /* =========================================================
     STAGE SWAPPING — crossfade instead of a black blink
     ========================================================= */

  function swapStage(html) {
    const previous = stage.querySelector('.screen');
    const ghost = previous ? previous.cloneNode(true) : null;
    stage.innerHTML = html;
    if (!ghost) return;
    ghost.classList.add('no-enter');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('button, a, input, select, textarea').forEach(node => {
      node.setAttribute('tabindex', '-1');
    });
    const wrap = document.createElement('div');
    wrap.className = 'stage-ghost';
    wrap.appendChild(ghost);
    stage.appendChild(wrap);
    window.setTimeout(() => wrap.remove(), 400);
  }

  /* =========================================================
     SURFACE
     ========================================================= */

  function renderSurface() {
    view = 'surface';
    const foes = waveFoeKeys(state.depth);
    const cart = state.cart.filter(id => owned(id));
    const ownedCount = state.heroes.length;
    const cartFull = cart.length >= state.slots;
    const nextDepth = state.depth;
    const cartMeta = cart.length === 0 ? 'Tap a crew member' : `${cart.length} / ${state.slots} seat${state.slots === 1 ? '' : 's'}`;

    const slotsHtml = Array.from({ length: state.slots }, (_, index) => {
      const id = cart[index];
      if (!id) {
        return `<button class="cart-slot empty" data-slot="${index}" aria-label="Empty cart seat ${index + 1}">
          <span class="plus">+</span>
          <span class="cart-seat-label">Seat ${index + 1}</span>
        </button>`;
      }
      return `<button class="cart-slot filled" data-slot="${index}" aria-label="Remove ${HERO_BY_ID[id].name} from cart">
        ${heroPortrait(id, true)}
        <span class="slot-remove" aria-hidden="true">×</span>
      </button>`;
    }).join('');

    const crewHtml = HEROES.map(hero => {
      const isOwned = owned(hero.id);
      const inCart = cart.includes(hero.id);
      const stats = heroStats(hero.id);
      const classes = ['hero-card', `rarity-${hero.rarity}`];
      if (!isOwned) classes.push('locked');
      if (inCart) classes.push('in-cart');
      return `<button class="${classes.join(' ')}" data-equip="${hero.id}" aria-label="${isOwned ? (inCart ? `Remove ${hero.name} from cart` : `Load ${hero.name} into cart`) : `${hero.name} is locked. Open the shop to recruit.`}">
        ${inCart ? '<span class="checkmark" aria-hidden="true">✓</span>' : ''}
        ${!isOwned ? `<span class="lockmark" aria-hidden="true">${ICONS.lock}</span>` : ''}
        ${heroPortrait(hero.id, isOwned)}
        <span class="name">${hero.name}</span>
        <span class="role">${isOwned ? hero.role : 'Locked'}</span>
        ${isOwned ? `<span class="hero-stats"><span>${stats.power} atk</span><span>${stats.maxHp} hp</span></span>` : ''}
      </button>`;
    }).join('');

    const ledgerTip = cart.length === 0
      ? 'Load a hero, then chase the next depth.'
      : state.slots === 1
        ? 'One seat is tight. A second seat changes everything.'
        : 'Tap a deployed hero in battle to fire their special.';

    const miniFoes = miniEnemyStack(foes);

    swapStage(`
      <section class="screen surface" aria-label="Surface camp">
        <div class="surface-scene">
          ${surfaceArt()}
          <div class="scene-copy">
            <span class="eyebrow">Above the deep</span>
            <h1>Load up.<br><em>Go down.</em></h1>
          </div>
          <div class="scene-meta">
            <span><span class="live-dot"></span>Camp awake</span>
            <strong>Depth ${nextDepth} awaits</strong>
          </div>
        </div>

        <div class="cart-zone">
          <div class="cart-card">
            <div class="section-head"><span>Mine cart</span><span>${cartMeta}</span></div>
            <div class="cart-rig" style="--slots:${state.slots}">
              <div class="cart-body">
                <i class="rivet"></i><i class="rivet"></i><i class="rivet"></i><i class="rivet"></i>
                ${slotsHtml}
              </div>
              <span class="cart-wheel left" aria-hidden="true"></span>
              <span class="cart-wheel right" aria-hidden="true"></span>
              <div class="rail" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <div class="crew-deck">
          <div class="section-head"><span>Your crew</span><span>${ownedCount} / ${HEROES.length} recruited</span></div>
          <div class="crew-grid">${crewHtml}</div>

          <div class="run-preview">
            <div class="depth-medallion"><small>DEPTH</small><strong>${nextDepth}</strong></div>
            <div class="run-preview-copy">
              <strong>${depthName(nextDepth)}</strong>
              <span>${foes.length} foe${foes.length === 1 ? '' : 's'} · clear worth ~${estimatedReward(nextDepth)} coins</span>
            </div>
            <div class="threat">
              ${renderThreatDots(nextDepth)}
              <span>${threatLabel(nextDepth)}</span>
            </div>
          </div>

          <div class="camp-ledger">
            <div class="ledger-top">
              <span class="eyebrow">Camp ledger</span>
              <span class="ledger-stamp">${state.wins} clear${state.wins === 1 ? '' : 's'}</span>
            </div>
            <div class="ledger-grid">
              <div><span>Best depth</span><strong>${state.bestDepth}</strong></div>
              <div><span>Cart seats</span><strong>${state.slots}<small>/${MAX_SLOTS}</small></strong></div>
              <div><span>Purse</span><strong>${state.coins}<small>c</small></strong></div>
            </div>
            <p class="ledger-tip">${ledgerTip}</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn shop-btn" data-action="shop" aria-label="Open shop">
            <span class="shop-glyph" aria-hidden="true">${ICONS.shop}</span>
            <span class="btn-stack">Shop<span class="btn-sub">Trading post</span></span>
          </button>
          <button class="btn primary descend-btn ${cart.length ? '' : 'is-waiting'}" data-action="descend" aria-label="Descend into the mine">
            <span class="btn-icon" aria-hidden="true">${ICONS.down}</span>
            <span class="btn-stack">Descend<span class="btn-sub">${cart.length ? `Depth ${state.depth} · ${foes.length} foe${foes.length === 1 ? '' : 's'}` : 'Load a hero first'}</span></span>
          </button>
        </div>
      </section>`);
    updateHeader();
  }

  function toggleCartHero(id) {
    const hero = HERO_BY_ID[id];
    if (!hero) return;
    if (!owned(id)) {
      sfx('error');
      toast(`${hero.name} is still locked. Try your luck with a hero chest.`, 'warn');
      openShop();
      return;
    }
    if (state.cart.includes(id)) {
      state.cart = state.cart.filter(item => item !== id);
      sfx('remove');
      save();
      renderSurface();
      return;
    }
    if (state.cart.length >= state.slots) {
      sfx('error');
      toast('The cart is full. Tap a loaded hero to free a seat.', 'warn');
      const card = $('.cart-card');
      if (card) {
        card.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
          { duration: 260, easing: 'ease-out' }
        );
      }
      return;
    }
    state.cart.push(id);
    sfx('equip');
    save();
    renderSurface();
  }

  function shakeElement(element) {
    if (!element) return;
    element.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
      { duration: 280, easing: 'ease-out' }
    );
  }

  function startDescent() {
    if (state.cart.length === 0) {
      sfx('error');
      toast('Load at least one hero into the minecart.', 'warn');
      shakeElement($('.cart-card'));
      return;
    }
    sfx('descend');
    const veil = document.createElement('div');
    veil.className = 'descent-veil';
    veil.innerHTML = `
      <div class="descent-cart">${ICONS.pick}</div>
      <p>Depth ${state.depth}</p>
      <small>${state.cart.length} aboard · ${depthName(state.depth)}</small>`;
    app.appendChild(veil);
    window.setTimeout(() => {
      enterCave();
    }, 240);
    window.setTimeout(() => {
      veil.classList.add('lift');
      window.setTimeout(() => veil.remove(), 340);
    }, 620);
  }

  /* =========================================================
     STAGE INPUT
     ========================================================= */

  stage.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) return;
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'shop') { sfx('click'); openShop(); return; }
      if (action === 'descend') { startDescent(); return; }
      if (action === 'cave-back') { leaveCave(); return; }
      if (action === 'fight') { tryStartFight(); return; }
    }

    const equipEl = event.target.closest('[data-equip]');
    if (equipEl && view === 'surface') {
      toggleCartHero(equipEl.dataset.equip);
      return;
    }

    const slotEl = event.target.closest('[data-slot]');
    if (slotEl && view === 'surface') {
      const index = Number(slotEl.dataset.slot);
      const id = state.cart[index];
      if (id) {
        toggleCartHero(id);
      } else {
        sfx('select');
        toast(state.cart.length >= state.slots ? 'All seats are full.' : 'Tap a crew member below to fill this seat.');
        const crew = $('.crew-grid');
        if (crew) {
          crew.animate(
            [{ filter: 'brightness(1)' }, { filter: 'brightness(1.3)' }, { filter: 'brightness(1)' }],
            { duration: 420, easing: 'ease-out' }
          );
        }
      }
      return;
    }

    const cartHero = event.target.closest('[data-cart-hero]');
    if (cartHero && view === 'cave') {
      selectCaveHero(cartHero.dataset.cartHero);
      return;
    }

    const pad = event.target.closest('[data-pad]');
    if (pad && view === 'cave') {
      handlePadTap(Number(pad.dataset.pad));
      return;
    }

    const battleHero = event.target.closest('[data-battle-hero]');
    if (battleHero && view === 'battle') {
      castHeroSkill(battleHero.dataset.battleHero);
    }
  });

  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    updateHeader();
    save();
    if (state.sound) {
      ensureAudio();
      sfx('click');
      toast('Sound on');
    } else {
      toast('Sound off');
    }
  });

  helpBtn.addEventListener('click', () => {
    if (view === 'battle') {
      toast('Finish the fight first.', 'warn');
      return;
    }
    sfx('click');
    openHelp();
  });

  brandBtn.addEventListener('click', () => {
    if (view === 'battle') return;
    sfx('click');
    openHelp();
  });

  /* =========================================================
     CAVE / DEPLOYMENT
     ========================================================= */

  function enterCave() {
    view = 'cave';
    cave = {
      pads: Array.from({ length: state.slots }, () => null),
      cart: state.cart.filter(id => owned(id)).slice(0, state.slots),
      selected: null
    };
    renderCave();
    sfx('travel');
  }

  function caveHintText() {
    if (!cave) return '';
    const deployed = cave.pads.filter(Boolean).length;
    if (cave.selected) {
      const hero = HERO_BY_ID[cave.selected];
      return `Now tap a glowing stone pad to place ${hero.name}.`;
    }
    if (deployed === 0) return 'Tap a hero in the cart, then tap a stone pad.';
    if (cave.cart.length > 0) return `${cave.cart.length} hero${cave.cart.length === 1 ? '' : 'es'} still aboard. Place more or fight.`;
    return 'Everyone is in position. Ready the charge.';
  }

  function renderCave() {
    if (!cave) return;
    const foes = waveFoeKeys(state.depth);
    const positions = PAD_POSITIONS[state.slots] || PAD_POSITIONS[1];
    const deployed = cave.pads.filter(Boolean).length;
    const selectedHero = cave.selected ? HERO_BY_ID[cave.selected] : null;
    const hasBoss = foes.some(key => ENEMY_TYPES[key].boss);

    const padsHtml = positions.map(([x, y], index) => {
      const id = cave.pads[index];
      const targetable = !id && cave.selected;
      if (!id) {
        return `<button class="deploy-pad ${targetable ? 'targetable' : ''}" data-pad="${index}" style="--x:${x};--y:${y}" aria-label="Empty deployment pad ${index + 1}">
          <span class="pad-plus">+</span>
          <span class="pad-number">Pad ${index + 1}</span>
        </button>`;
      }
      return `<button class="deploy-pad filled" data-pad="${index}" style="--x:${x};--y:${y}" aria-label="Return ${HERO_BY_ID[id].name} to the cart">
        ${heroPortrait(id, true)}
        <span class="pad-hero-name">${HERO_BY_ID[id].name}</span>
      </button>`;
    }).join('');

    const cartTokens = cave.cart.length
      ? cave.cart.map(id => `<button class="cart-token ${cave.selected === id ? 'selected' : ''}" data-cart-hero="${id}" aria-label="Select ${HERO_BY_ID[id].name} for deployment">
          ${heroPortrait(id, true)}
        </button>`).join('')
      : `<div class="dock-empty">${ICONS.check}<span>All heroes deployed</span></div>`;

    const foeTitle = foes.length === 1
      ? ENEMY_TYPES[foes[0]].name
      : `${foes.length} hostiles${hasBoss ? ' · boss' : ''}`;

    swapStage(`
      <section class="screen cave" aria-label="Cave deployment">
        <div class="cave-head">
          <button class="cave-back" data-action="cave-back" aria-label="Return to surface">${ICONS.back}<span>Surface</span></button>
          <div class="depth-badge"><small>DEPTH</small><strong>${state.depth}</strong></div>
          <div class="cave-threat">${renderThreatDots(state.depth)}<span>${threatLabel(state.depth)}</span></div>
        </div>

        <div class="cave-world">
          ${caveArt()}
          <span class="cave-glint" style="left:18%;top:66%"></span>
          <span class="cave-glint g2" style="left:82%;top:48%"></span>
          <span class="cave-glint g3" style="left:61%;top:78%"></span>

          <div class="cart-dock">
            <div class="dock-head"><span>Mine cart</span><span>${cave.cart.length === 0 ? 'All heroes deployed' : `${cave.cart.length} aboard`}</span></div>
            <div class="dock-bed">${cartTokens}</div>
          </div>

          <div class="cave-hint">${caveHintText()}</div>
          ${padsHtml}
        </div>

        <div class="cave-bottom">
          <div class="cave-intel">
            <div class="enemy-peek">
              ${miniEnemyStack(foes)}
              <div class="enemy-peek-copy">
                <strong>${foeTitle}</strong>
                <span>Clear reward ~${estimatedReward(state.depth)} coins</span>
              </div>
            </div>
            <div class="threat">${renderThreatDots(state.depth)}<span>${threatLabel(state.depth)}</span></div>
          </div>
          <button class="btn primary fight-btn" data-action="fight" ${deployed === 0 ? 'disabled' : ''}>
            <span class="fight-swords" aria-hidden="true">${ICONS.swords}</span>
            <span class="btn-stack">${deployed === 0 ? 'Deploy a hero' : 'Fight'}<span class="btn-sub">${deployed === 0 ? 'Tap a cart hero, then a pad' : `${deployed} ready · ${foes.length} foe${foes.length === 1 ? '' : 's'}`}</span></span>
          </button>
        </div>
      </section>`);
    updateHeader();
  }

  function updateCaveSelection() {
    if (!cave) return;
    const selected = cave.selected;
    document.querySelectorAll('.cart-token').forEach(el => {
      el.classList.toggle('selected', el.dataset.cartHero === selected);
    });
    document.querySelectorAll('.deploy-pad').forEach(el => {
      const index = Number(el.dataset.pad);
      el.classList.toggle('targetable', Boolean(selected) && !cave.pads[index]);
    });
    const hint = $('.cave-hint');
    if (hint) hint.textContent = caveHintText();
  }

  function selectCaveHero(id) {
    if (!cave || !cave.cart.includes(id)) return;
    cave.selected = cave.selected === id ? null : id;
    sfx('select');
    updateCaveSelection();
  }

  function handlePadTap(index) {
    if (!cave) return;
    const placed = cave.pads[index];
    if (cave.selected) {
      if (placed) {
        sfx('error');
        toast('That pad is occupied. Pick an empty pad.', 'warn');
        return;
      }
      deployHero(cave.selected, index);
      return;
    }
    if (placed) {
      recallHero(index);
      return;
    }
    sfx('select');
    toast('Pick a hero from the cart first.');
  }

  function deployHero(id, index) {
    if (!cave || !cave.cart.includes(id) || cave.pads[index]) return;
    cave.cart = cave.cart.filter(item => item !== id);
    cave.pads[index] = id;
    cave.selected = null;
    sfx('deploy');
    renderCave();
  }

  function recallHero(index) {
    const id = cave?.pads[index];
    if (!id) return;
    cave.pads[index] = null;
    cave.cart.push(id);
    cave.selected = null;
    sfx('remove');
    renderCave();
  }

  function leaveCave() {
    if (view !== 'cave') return;
    sfx('travel');
    cave = null;
    renderSurface();
  }

  function tryStartFight() {
    if (!cave) return;
    const deployed = cave.pads.filter(Boolean);
    if (deployed.length === 0) {
      sfx('error');
      toast('Deploy at least one hero before the fight.', 'warn');
      shakeElement($('.fight-btn'));
      return;
    }
    if (cave.cart.length > 0) {
      toast(`${cave.cart.length} hero${cave.cart.length === 1 ? '' : 'es'} stayed in the cart.`);
    }
    startBattle(deployed);
  }

  /* ---------- Drag & drop deployment ---------- */

  stage.addEventListener('pointerdown', event => {
    if (view !== 'cave' || !cave) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const token = event.target.closest('[data-cart-hero]');
    if (!token) return;
    const id = token.dataset.cartHero;
    if (!cave.cart.includes(id)) return;
    drag = {
      id,
      source: token,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      ghost: null,
      hoverPad: null
    };
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragCancel);
  });

  function onDragMove(event) {
    if (!drag) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.moved && distance > 7) {
      drag.moved = true;
      drag.source.classList.add('drag-source');
      const ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.innerHTML = heroPortrait(drag.id, true);
      dragRoot.appendChild(ghost);
      drag.ghost = ghost;
      if (window.navigator.vibrate) window.navigator.vibrate(8);
    }
    if (!drag.moved) return;
    event.preventDefault();
    if (drag.ghost) {
      drag.ghost.style.left = `${event.clientX}px`;
      drag.ghost.style.top = `${event.clientY}px`;
    }
    const padEl = document.elementFromPoint(event.clientX, event.clientY)?.closest('.deploy-pad');
    let hoverPad = null;
    if (padEl && cave && !cave.pads[Number(padEl.dataset.pad)]) {
      hoverPad = padEl;
    }
    document.querySelectorAll('.deploy-pad.hover').forEach(el => {
      if (el !== hoverPad) el.classList.remove('hover');
    });
    if (hoverPad) hoverPad.classList.add('hover');
    drag.hoverPad = hoverPad ? Number(hoverPad.dataset.pad) : null;
  }

  function clearDrag(shouldSuppress) {
    if (!drag) return;
    drag.ghost?.remove();
    drag.source?.classList.remove('drag-source');
    document.querySelectorAll('.deploy-pad.hover').forEach(el => el.classList.remove('hover'));
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    window.removeEventListener('pointercancel', onDragCancel);
    if (shouldSuppress) suppressClickUntil = performance.now() + 320;
    drag = null;
  }

  function onDragEnd() {
    if (!drag) return;
    if (drag.moved && drag.hoverPad !== null) {
      deployHero(drag.id, drag.hoverPad);
    }
    clearDrag(drag.moved);
  }

  function onDragCancel() {
    clearDrag(Boolean(drag?.moved));
  }

  /* =========================================================
     OVERLAY HELPERS
     ========================================================= */

  function showOverlay(html, className = '') {
    overlayRoot.classList.add('open');
    const isFullBleed = /^<div class="(?:chest-overlay|result-overlay)/.test(html.trim());
    overlayRoot.innerHTML = isFullBleed
      ? html
      : `<div class="overlay ${className}">${html}</div>`;
  }

  function closeOverlay() {
    overlayRoot.classList.remove('open');
    overlayRoot.innerHTML = '';
  }

  function bindBackdropClose(overlay, callback) {
    overlay?.addEventListener('click', event => {
      if (event.target === overlay) callback();
    });
  }

  /* =========================================================
     SHOP
     ========================================================= */

  function chestCost() {
    return 55 + state.chests * 10;
  }

  function slotCost() {
    return state.slots < MAX_SLOTS ? SLOT_COSTS[state.slots - 1] : null;
  }

  function openShop() {
    if (view === 'battle') {
      toast('Finish the fight first.', 'warn');
      return;
    }
    const lockedHeroes = HEROES.filter(hero => !owned(hero.id));
    const cost = chestCost();
    const upgrade = slotCost();
    const collection = HEROES.map(hero => `
      <div class="collection-portrait ${owned(hero.id) ? '' : 'locked'}" title="${owned(hero.id) ? hero.name : 'Recruit to reveal'}" aria-label="${owned(hero.id) ? hero.name : 'Locked hero'}">
        ${heroPortrait(hero.id, false)}
      </div>`).join('');

    showOverlay(`
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Trading post">
        <div class="sheet-head">
          <div class="sheet-title">
            <span class="eyebrow">Spend it underground</span>
            <h2>Trading Post</h2>
          </div>
          <button class="close-btn" id="shopCloseBtn" aria-label="Close shop">${ICONS.close}</button>
        </div>
        <div class="shop-body">
          <div class="wallet-strip">
            <span>Your purse · everything is earned below</span>
            <strong><span class="coin-icon"></span>${state.coins}</strong>
          </div>

          <article class="shop-card">
            <div class="shop-art">${shopChestSvg()}</div>
            <div class="shop-copy">
              <span class="tag">One random recruit</span>
              <h3>Hero Chest</h3>
              <p>${lockedHeroes.length ? '82% chance to pull a new crew member. If the chest is empty, it coughs up bonus coins.' : 'Your crew is complete. The chest now holds a coin cache.'}</p>
            </div>
            <button class="buy-btn" id="buyChestBtn" aria-label="Buy hero chest">
              <span class="buy-price"><span class="coin-icon"></span>${cost}</span>
              <small>Open</small>
            </button>
          </article>

          <article class="shop-card">
            <div class="shop-art">
              <div class="slot-art" aria-hidden="true">
                <span class="slot-art-cart">${ICONS.cart}</span>
                <span class="slot-art-plus">+1</span>
                <span class="slot-art-dots">${Array.from({ length: state.slots }, () => '<i></i>').join('')}</span>
              </div>
            </div>
            <div class="shop-copy">
              <span class="tag">Cart upgrade</span>
              <h3>Extra Seat</h3>
              <p>${upgrade === null ? 'The cart cannot hold another soul. It is at maximum capacity.' : `Add another hero to the cart. Each seat puts one more fighter in the cave. (${state.slots}/${MAX_SLOTS})`}</p>
            </div>
            <button class="buy-btn" id="buySlotBtn" ${upgrade === null ? 'disabled' : ''} aria-label="Buy extra cart seat">
              <span class="buy-price">${upgrade === null ? 'Max' : `<span class="coin-icon"></span>${upgrade}`}</span>
              <small>${upgrade === null ? 'Full' : 'Upgrade'}</small>
            </button>
          </article>

          <div class="shop-collection">
            <div class="collection-head"><span>Collection</span><span>${state.heroes.length} / ${HEROES.length}</span></div>
            <div class="collection-row">${collection}</div>
          </div>
          <p class="shop-note">Coins are only found in the cave. Deeper runs pay better.<br>Recruits join at level 1 and can level up on future runs.</p>
        </div>
        <div class="sheet-foot">
          <button class="btn" id="shopDoneBtn">Back to camp</button>
        </div>
      </div>`, 'shop-overlay');

    const overlay = $('.overlay');
    const close = () => { sfx('click'); closeOverlay(); renderSurface(); };
    $('#shopCloseBtn')?.addEventListener('click', close);
    $('#shopDoneBtn')?.addEventListener('click', close);
    bindBackdropClose(overlay, close);

    $('#buyChestBtn')?.addEventListener('click', () => {
      const price = chestCost();
      if (state.coins < price) {
        sfx('error');
        toast(`You need ${price - state.coins} more coins for a chest.`, 'warn');
        return;
      }
      setCoins(state.coins - price, false);
      state.chests += 1;
      save();
      sfx('coin');
      openChestOverlay();
    });

    $('#buySlotBtn')?.addEventListener('click', () => {
      const price = slotCost();
      if (price === null) return;
      if (state.coins < price) {
        sfx('error');
        toast(`You need ${price - state.coins} more coins for another seat.`, 'warn');
        return;
      }
      setCoins(state.coins - price);
      state.slots = Math.min(MAX_SLOTS, state.slots + 1);
      save();
      sfx('upgrade');
      toast(`Cart expanded — ${state.slots} seats!`, 'good');
      openShop();
    });
  }

  /* =========================================================
     HERO CHEST
     ========================================================= */

  function openChestOverlay() {
    showOverlay(`
      <div class="chest-overlay" id="chestOverlay" role="dialog" aria-modal="true" aria-label="Hero chest">
        <div class="chest-rays" aria-hidden="true"></div>
        <div class="chest-panel">
          <div class="chest-stage">
            <div class="chest-glow" aria-hidden="true"></div>
            ${chestSvg()}
          </div>
          <div class="chest-copy" id="chestCopy">
            <span class="eyebrow">Something waits inside</span>
            <h2>A hero chest</h2>
            <p>The crew holds its breath. Tap to break the seal.</p>
            <button class="btn primary chest-cta" id="openChestBtn">Open the chest</button>
          </div>
          <div class="chest-result" id="chestResult"></div>
        </div>
      </div>`);

    const overlay = $('#chestOverlay');
    let opened = false;

    const beginOpen = () => {
      if (opened) return;
      opened = true;
      sfx('chestshake');
      overlay.classList.add('opening', 'lit');
      const button = $('#openChestBtn');
      if (button) {
        button.disabled = true;
        button.textContent = 'Opening…';
      }
      window.setTimeout(() => {
        overlay.classList.remove('opening');
        overlay.classList.add('opened');
        sfx('chestopen');
      }, 720);
      window.setTimeout(() => revealChest(), 1420);
    };

    overlay.addEventListener('click', event => {
      if (event.target.closest('#openChestBtn') || event.target.closest('.chest-stage')) {
        beginOpen();
      }
    });
  }

  function chooseChestReward() {
    const lockedHeroes = HEROES.filter(hero => !owned(hero.id));
    if (lockedHeroes.length && Math.random() < 0.82) {
      const weighted = [];
      lockedHeroes.forEach(hero => {
        const weight = hero.rarity === 'epic' ? 2 : hero.rarity === 'rare' ? 5 : 8;
        for (let i = 0; i < weight; i++) weighted.push(hero.id);
      });
      return { type: 'hero', heroId: pick(weighted) };
    }
    const amount = 35 + state.depth * 5 + Math.floor(rand(0, 21));
    return { type: 'coins', amount };
  }

  function revealChest() {
    const overlay = $('#chestOverlay');
    if (!overlay) return;
    const reward = chooseChestReward();
    const resultEl = $('#chestResult');
    let content = '';

    if (reward.type === 'hero') {
      const hero = HERO_BY_ID[reward.heroId];
      state.heroes.push(hero.id);
      state.levels[hero.id] = 1;
      state.xp[hero.id] = 0;
      save();
      content = `
        <div class="reveal-card" style="--rarity:${hero.rarity === 'epic' ? '#c084d7' : hero.rarity === 'rare' ? '#67b6d5' : '#86a98d'}">
          <div class="reveal-portrait">${heroPortrait(hero.id, false)}</div>
          <div class="reveal-copy">
            <span class="eyebrow">${RARITY_LABEL[hero.rarity]} recruit</span>
            <h3>${hero.name} joins!</h3>
            <span class="reveal-role">${hero.role}</span>
            <p>${hero.blurb}</p>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn primary" id="collectChestBtn">Meet the crew</button>
        </div>`;
    } else {
      setCoins(state.coins + reward.amount);
      save();
      content = `
        <div class="reveal-card coins">
          <div class="reveal-portrait" style="--rarity:#f4bb55"><span class="big-coin"></span></div>
          <div class="reveal-copy">
            <span class="eyebrow">No hero this time</span>
            <h3>+${reward.amount} coins</h3>
            <span class="reveal-role">Cave cache</span>
            <p>The chest was packed with old pay. Spend it on another pull or a bigger cart.</p>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn primary" id="collectChestBtn">Pocket the coins</button>
        </div>`;
    }

    resultEl.innerHTML = content;
    resultEl.classList.add('show');
    overlay.classList.add('revealed');
    sfx(reward.type === 'hero' ? 'reveal' : 'coin');
    spawnChestConfetti();

    $('#collectChestBtn')?.addEventListener('click', () => {
      sfx('click');
      closeOverlay();
      openShop();
    });
  }

  function spawnChestConfetti() {
    const panel = $('.chest-panel');
    if (!panel) return;
    const colors = ['#f4bb55', '#f8ead2', '#8bc9a8', '#c4694e', '#b789d7'];
    for (let i = 0; i < 28; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti';
      const angle = rand(0, Math.PI * 2);
      const distance = rand(65, 190);
      bit.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      bit.style.setProperty('--dy', `${Math.sin(angle) * distance + 35}px`);
      bit.style.setProperty('--rot', `${rand(-260, 260)}deg`);
      bit.style.background = pick(colors);
      bit.style.animationDelay = `${rand(0, 0.15)}s`;
      panel.appendChild(bit);
      window.setTimeout(() => bit.remove(), 1600);
    }
  }

  /* =========================================================
     HELP / RESET
     ========================================================= */

  function openHelp() {
    showOverlay(`
      <div class="sheet" role="dialog" aria-modal="true" aria-label="How to play">
        <div class="sheet-head">
          <div class="sheet-title">
            <span class="eyebrow">Field notes · Deep Vein Co.</span>
            <h2>How to play</h2>
          </div>
          <button class="close-btn" id="helpCloseBtn" aria-label="Close help">${ICONS.close}</button>
        </div>
        <div class="help-body">
          <div class="how-step">
            <span class="step-num">1</span>
            <div><strong>Load the cart</strong><p>Tap a crew member on the surface. The cart starts with one seat; buy extra seats in the shop to bring more heroes down.</p></div>
          </div>
          <div class="how-step">
            <span class="step-num">2</span>
            <div><strong>Deploy in the cave</strong><p>Tap a hero in the mine cart, then tap a glowing stone pad to put them down. Drag them down from the cart if you prefer.</p></div>
          </div>
          <div class="how-step">
            <span class="step-num">3</span>
            <div><strong>Fight &amp; collect</strong><p>Press Fight to wake the cave. During battle, tap any deployed hero to unleash their special. Enemy kills drop coins; a clear pays a bonus.</p></div>
          </div>
          <div class="how-step">
            <span class="step-num">4</span>
            <div><strong>Grow stronger</strong><p>Spend coins at the trading post on random hero chests and extra cart seats. Every victory pushes the next descent one depth deeper.</p></div>
          </div>
          <p class="shop-note">Progress saves automatically on this device.</p>
        </div>
        <div class="sheet-foot">
          <div class="help-foot">
            <button class="btn reset-btn" id="resetBtn">Reset progress</button>
            <button class="btn primary" id="helpDoneBtn">Got it</button>
          </div>
        </div>
      </div>`, 'help-overlay');

    const overlay = $('.overlay');
    const close = () => { sfx('click'); closeOverlay(); };
    $('#helpCloseBtn')?.addEventListener('click', close);
    $('#helpDoneBtn')?.addEventListener('click', close);
    bindBackdropClose(overlay, close);

    $('#resetBtn')?.addEventListener('click', () => {
      sfx('error');
      openResetConfirm();
    });
  }

  function openResetConfirm() {
    showOverlay(`
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Confirm reset">
        <div class="sheet-head">
          <div class="sheet-title">
            <span class="eyebrow">This cannot be undone</span>
            <h2>Start over?</h2>
          </div>
          <button class="close-btn" id="resetCloseBtn" aria-label="Cancel reset">${ICONS.close}</button>
        </div>
        <div class="help-body">
          <p class="shop-note" style="text-align:left;font-size:8px;line-height:1.6">
            Your coins, recruited heroes, cart upgrades and depth record will all be wiped. Pip and Nyx will be waiting back at camp.
          </p>
        </div>
        <div class="sheet-foot">
          <div class="help-foot">
            <button class="btn" id="resetCancelBtn">Keep my crew</button>
            <button class="btn reset-btn" id="resetConfirmBtn">Erase everything</button>
          </div>
        </div>
      </div>`, 'reset-overlay');

    const close = () => { sfx('click'); openHelp(); };
    $('#resetCloseBtn')?.addEventListener('click', close);
    $('#resetCancelBtn')?.addEventListener('click', close);
    bindBackdropClose($('.overlay'), close);

    $('#resetConfirmBtn')?.addEventListener('click', () => {
      state = defaultState();
      save();
      closeOverlay();
      cave = null;
      renderSurface();
      toast('A fresh start. Mind the dark.', 'good');
      sfx('descend');
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlayRoot.classList.contains('open')) {
      const closeBtn = $('#shopCloseBtn') || $('#helpCloseBtn');
      if (closeBtn) closeBtn.click();
    }
  });

  /* =========================================================
     BATTLE
     ========================================================= */

  function startBattle(deployedIds) {
    const depth = state.depth;
    const foeKeys = waveFoeKeys(depth);
    const heroes = deployedIds.map((id, index) => {
      const stats = heroStats(id);
      return {
        uid: `h-${index}-${id}`,
        id,
        name: stats.name,
        level: stats.level,
        slot: index,
        maxHp: stats.maxHp,
        hp: stats.maxHp,
        atk: stats.power,
        interval: stats.interval * rand(0.95, 1.05),
        timer: rand(0.5, 1.2) + 0.55,
        cooldown: 1.2,
        alive: true,
        x: 0,
        y: 0,
        hx: 0,
        hy: 0,
        wt: null,
        el: null,
        hpEl: null,
        ringEl: null
      };
    });

    const heroPositions = HERO_FORMATIONS[Math.min(heroes.length, 5)] || HERO_FORMATIONS[5];
    heroes.forEach((hero, index) => {
      const pos = heroPositions[index] || [50, 0.5];
      hero.fx = pos[0];
      hero.fd = pos[1];
    });

    const depthHp = Math.pow(1.3, depth - 1);
    const depthAtk = Math.pow(1.18, depth - 1);
    const partyScale = 1 + Math.max(0, heroes.length - 1) * 0.14;
    const enemies = foeKeys.map((key, index) => {
      const type = ENEMY_TYPES[key];
      const maxHp = Math.round(46 * depthHp * type.hp * partyScale);
      return {
        uid: `e-${index}-${key}`,
        key,
        name: type.name,
        slot: index,
        maxHp,
        hp: maxHp,
        atk: Math.max(2, Math.round(4.8 * depthAtk * type.atk)),
        interval: type.interval * rand(0.92, 1.08),
        timer: rand(0.9, 1.9) + 0.55,
        stun: 0,
        alive: true,
        boss: Boolean(type.boss),
        x: 0,
        y: 0,
        hx: 0,
        hy: 0,
        wt: null,
        el: null,
        hpEl: null
      };
    });

    const enemyPositions = ENEMY_FORMATIONS[Math.min(enemies.length, 4)] || ENEMY_FORMATIONS[4];
    enemies.forEach((enemy, index) => {
      const pos = enemyPositions[index] || [80, 0.5];
      enemy.fx = pos[0];
      enemy.fd = pos[1];
    });

    battle = {
      depth,
      heroes,
      enemies,
      coinsEarned: 0,
      elapsed: 0,
      delay: 0.7,
      over: false,
      ending: false,
      lastDenied: 0,
      lastStatusUpdate: 0
    };
    view = 'battle';
    renderBattleShell();
    bindBattleUnits();
    placeFormations();
    sfx('fight');
    cancelAnimationFrame(battleRaf);
    lastFrame = performance.now();
    battleRaf = requestAnimationFrame(battleTick);
  }

  function renderBattleShell() {
    const depth = battle.depth;
    const heroUnits = battle.heroes.map(hero => {
      const heroData = HERO_BY_ID[hero.id];
      return `<div class="battle-unit hero rarity-${heroData.rarity}" data-battle-hero="${hero.uid}" data-uid="${hero.uid}" style="--x:${hero.x};--y:${hero.y}">
        <span class="unit-name">${hero.name}</span>
        <span class="unit-health"><i style="width:100%"></i></span>
        <div class="unit-figure">
          <span class="skill-aura" style="--p:0"></span>
          <div class="unit-sprite">${heroSpriteSvg(heroData)}</div>
        </div>
      </div>`;
    }).join('');

    const enemyUnits = battle.enemies.map(enemy => `
      <div class="battle-unit enemy ${enemy.boss ? 'boss' : ''}" data-uid="${enemy.uid}" style="--x:${enemy.x};--y:${enemy.y}">
        <span class="unit-name">${enemy.name}</span>
        <span class="unit-health enemy"><i style="width:100%"></i></span>
        <div class="unit-figure"><div class="unit-sprite">${enemySvg(enemy.key)}</div></div>
      </div>`).join('');

    swapStage(`
      <section class="screen battle" aria-label="Cave battle">
        <div class="battle-head">
          <div class="battle-chip depth"><span>Depth</span><strong>${depth}</strong></div>
          <div class="battle-chip"><span id="foeCount">${battle.enemies.length} foe${battle.enemies.length === 1 ? '' : 's'}</span></div>
          <div class="battle-chip"><span class="coin-icon" aria-hidden="true"></span><strong id="battleCoins">+0</strong></div>
        </div>

        <div class="battle-arena" id="battleArena">
          ${battleArt()}
          ${heroUnits}
          ${enemyUnits}
          <div class="fx-layer" id="fxLayer"></div>
          <div class="battle-start-banner" aria-hidden="true">Fight!</div>
        </div>

        <div class="battle-foot">
          <div class="battle-instruction"><span class="tap-orb" aria-hidden="true"></span><span>Tap a hero for their special</span></div>
          <div class="battle-status">
            <span class="status-left">${ICONS.swordLike || ICONS.pick}<span>${depthName(depth)}</span></span>
            <span class="status-right">Auto-attack on</span>
          </div>
        </div>
      </section>`);
  }

  function bindBattleUnits() {
    const arena = $('#battleArena');
    if (!arena) return;
    arena.querySelectorAll('[data-uid]').forEach(el => {
      const unit = battle.heroes.find(item => item.uid === el.dataset.uid) || battle.enemies.find(item => item.uid === el.dataset.uid);
      if (!unit) return;
      unit.el = el;
      unit.hpEl = el.querySelector('.unit-health i');
    });
    battle.heroes.forEach(hero => {
      hero.ringEl = hero.el?.querySelector('.skill-aura');
    });
  }

  function battleTick(now) {
    if (!battle || battle.over) return;
    const dt = Math.min(0.055, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;

    if (battle.delay > 0) {
      battle.delay -= dt;
      battleRaf = requestAnimationFrame(battleTick);
      return;
    }

    battle.elapsed += dt;
    updateWalks(dt);

    battle.heroes.forEach(hero => {
      if (!hero.alive) return;
      hero.cooldown = Math.max(0, hero.cooldown - dt);
      if (hero.cooldown <= 0 && hero.ringEl) {
        hero.el?.classList.add('ready');
      }
      if (hero.wt) return;
      hero.timer -= dt;
      if (hero.timer <= 0) {
        const targets = livingEnemies();
        if (targets.length) {
          heroAttack(hero, targets);
          hero.timer = hero.interval * rand(0.95, 1.05);
        }
      }
    });

    battle.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      if (enemy.stun > 0) {
        enemy.stun = Math.max(0, enemy.stun - dt);
        return;
      }
      if (enemy.wt) return;
      enemy.timer -= dt;
      if (enemy.timer <= 0) {
        const targets = livingHeroes();
        if (targets.length) {
          enemyAttack(enemy, targets);
          enemy.timer = enemy.interval * rand(0.94, 1.08);
        }
      }
    });

    updateSkillRings();
    if (battle && !battle.over) {
      if (!livingEnemies().length) {
        finishBattle(true);
        return;
      }
      if (!livingHeroes().length) {
        finishBattle(false);
        return;
      }
      battleRaf = requestAnimationFrame(battleTick);
    }
  }

  function livingEnemies() {
    return battle ? battle.enemies.filter(enemy => enemy.alive) : [];
  }

  function livingHeroes() {
    return battle ? battle.heroes.filter(hero => hero.alive) : [];
  }

  function updateSkillRings() {
    if (!battle) return;
    battle.heroes.forEach(hero => {
      if (!hero.ringEl) return;
      const progress = hero.cooldown <= 0 ? 1 : 1 - hero.cooldown / SKILL_COOLDOWN;
      hero.ringEl.style.setProperty('--p', String(clamp(progress, 0, 1)));
      if (hero.alive) hero.el?.classList.toggle('ready', hero.cooldown <= 0);
    });
  }

  /* =========================================================
     UNIT MOVEMENT — characters close in and strike
     ========================================================= */

  /* The floor line's on-screen height depends on the arena's aspect ratio
     (the background art uses "slice" fitting), so place feet on the real floor. */
  function placeFormations() {
    if (!battle) return;
    const arena = $('#battleArena');
    if (!arena) return;
    const rect = arena.getBoundingClientRect();
    const aspect = rect.width / Math.max(1, rect.height);
    const floorTop = clamp(0.5 + 0.26 * aspect, 0.52, 0.9);
    const floorBottom = 97;
    const apply = (unit, fx, fd) => {
      unit.x = unit.hx = clamp(fx, 6, 94);
      unit.y = unit.hy = floorTop * 100 + fd * (floorBottom - floorTop * 100);
      if (unit.el) {
        unit.el.style.setProperty('--x', unit.x.toFixed(2));
        unit.el.style.setProperty('--y', unit.y.toFixed(2));
      }
    };
    battle.heroes.forEach(hero => apply(hero, hero.fx, hero.fd));
    battle.enemies.forEach(enemy => apply(enemy, enemy.fx, enemy.fd));
  }

  function walkUnit(unit, tx, ty, cb, track, off) {
    unit.wt = {
      x: tx,
      y: ty,
      cb,
      speed: unit.boss ? 44 : 80,
      track: track || null,
      off: off || 0
    };
    unit.el?.classList.add('walking');
  }

  function walkHome(unit) {
    if (!unit.alive || unit.wt || !battle || battle.over) return;
    walkUnit(unit, unit.hx, unit.hy, null);
  }

  function cancelWalk(unit) {
    unit.wt = null;
    unit.el?.classList.remove('walking');
  }

  function updateWalks(dt) {
    if (!battle) return;
    battle.heroes.forEach(hero => stepWalk(hero, dt));
    battle.enemies.forEach(enemy => stepWalk(enemy, dt));
  }

  function stepWalk(unit, dt) {
    const walk = unit.wt;
    if (!walk) return;
    if (!unit.alive) {
      cancelWalk(unit);
      return;
    }
    const dx = walk.x - unit.x;
    const dy = walk.y - unit.y;
    const dist = Math.hypot(dx, dy);
    const step = walk.speed * dt;
    if (walk.track && walk.track.alive) {
      walk.x = clamp(walk.track.x + walk.off, 4, 96);
      walk.y = walk.track.y;
    }
    if (dist <= step || dist < 0.8) {
      unit.x = walk.x;
      unit.y = walk.y;
      unit.wt = null;
      unit.el?.classList.remove('walking');
      if (walk.cb) walk.cb();
      return;
    }
    unit.x += dx / dist * step;
    unit.y += dy / dist * step;
    if (unit.el) {
      unit.el.style.setProperty('--x', unit.x.toFixed(2));
      unit.el.style.setProperty('--y', unit.y.toFixed(2));
    }
  }

  function arenaQuake() {
    const arena = $('#battleArena');
    arena?.classList.add('quake');
    window.setTimeout(() => arena?.classList.remove('quake'), 240);
  }

  function unitPoint(unit) {
    const arena = $('#battleArena');
    if (!arena || !unit.el) return { x: 0, y: 0 };
    const arenaRect = arena.getBoundingClientRect();
    const rect = unit.el.getBoundingClientRect();
    return {
      x: rect.left - arenaRect.left + rect.width / 2,
      y: rect.top - arenaRect.top + rect.height / 2
    };
  }

  function addDamageFloat(text, point, className = '') {
    const layer = $('#fxLayer');
    if (!layer) return;
    const node = document.createElement('span');
    node.className = `dmg-number ${className}`;
    node.textContent = text;
    node.style.left = `${point.x + rand(-6, 6)}px`;
    node.style.top = `${point.y}px`;
    layer.appendChild(node);
    window.setTimeout(() => node.remove(), 950);
  }

  function addSlash(point, enemy = false) {
    const layer = $('#fxLayer');
    if (!layer) return;
    const node = document.createElement('span');
    node.className = `slash-fx ${enemy ? 'enemy' : ''}`;
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
    layer.appendChild(node);
    window.setTimeout(() => node.remove(), 430);
  }

  function addBurst(point) {
    const layer = $('#fxLayer');
    if (!layer) return;
    const node = document.createElement('span');
    node.className = 'skill-burst';
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
    layer.appendChild(node);
    window.setTimeout(() => node.remove(), 700);
  }

  function addSkillLabel(text, point) {
    const layer = $('#fxLayer');
    if (!layer) return;
    const arena = $('#battleArena');
    const maxX = Math.max(60, (arena?.clientWidth || 390) - 56);
    const node = document.createElement('span');
    node.className = 'skill-label';
    node.textContent = text;
    node.style.left = `${clamp(point.x, 56, maxX)}px`;
    node.style.top = `${point.y - 14}px`;
    layer.appendChild(node);
    window.setTimeout(() => node.remove(), 1200);
  }

  function addProjectile(from, to, enemy = false) {
    const layer = $('#fxLayer');
    if (!layer) return;
    const node = document.createElement('span');
    node.className = `projectile-fx ${enemy ? 'enemy' : ''}`;
    node.style.left = `${from.x}px`;
    node.style.top = `${from.y}px`;
    layer.appendChild(node);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const anim = node.animate([
      { transform: 'translate(-50%, -50%) scale(.7)', opacity: 0.9 },
      { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55 - 12}px)) scale(1.1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 0 }
    ], { duration: 240, easing: 'ease-in' });
    anim.onfinish = () => node.remove();
  }

  function playLunge(unit, direction) {
    const className = direction === 'right' ? 'lunge-right' : 'lunge-left';
    unit.el?.classList.remove(className);
    if (!unit.el) return;
    void unit.el.offsetWidth;
    unit.el.classList.add(className);
    window.setTimeout(() => unit.el?.classList.remove(className), 260);
  }

  function flashHit(unit) {
    unit.el?.classList.remove('hit');
    if (!unit.el) return;
    void unit.el.offsetWidth;
    unit.el.classList.add('hit');
    window.setTimeout(() => unit.el?.classList.remove('hit'), 300);
  }

  function syncHealth(unit) {
    if (!unit.hpEl) return;
    const ratio = clamp(unit.hp / unit.maxHp, 0, 1);
    unit.hpEl.style.width = `${ratio * 100}%`;
    if (ratio < 0.3) {
      unit.hpEl.style.background = 'linear-gradient(90deg, #b94f48, #dc7f63)';
    } else if (ratio < 0.62) {
      unit.hpEl.style.background = 'linear-gradient(90deg, #c89345, #ddbc6c)';
    } else if (!unit.boss) {
      unit.hpEl.style.background = '';
    }
  }

  function heroAttack(hero, targets) {
    const target = pick(targets);
    if (!target) return;
    const crit = Math.random() < 0.12;
    const base = hero.atk * rand(0.9, 1.1) * (crit ? 1.68 : 1);
    const ranged = ['mica', 'sable', 'orin'].includes(hero.id);

    if (ranged) {
      playLunge(hero, 'right');
      addProjectile(unitPoint(hero), unitPoint(target), false);
      window.setTimeout(() => {
        if (!battle || battle.over || !target.alive) return;
        addSlash(unitPoint(target), false);
        damageEnemy(target, base, crit);
        sfx(crit ? 'crit' : 'hit');
      }, 230);
      return;
    }

    const off = -7 - (hero.slot % 2 ? 3.5 : 0);
    walkUnit(hero, clamp(target.x + off, 5, 95), target.y, () => {
      if (!battle || battle.over || !target.alive || !hero.alive) {
        walkHome(hero);
        return;
      }
      playLunge(hero, 'right');
      window.setTimeout(() => {
        if (target.alive) addSlash(unitPoint(target), false);
      }, 70);
      window.setTimeout(() => {
        if (!battle || battle.over || !target.alive) return;
        damageEnemy(target, base, crit);
        sfx(crit ? 'crit' : 'hit');
      }, 100);
      window.setTimeout(() => {
        if (hero.alive && !hero.wt) walkHome(hero);
      }, 170);
    }, target, off);
  }

  function enemyAttack(enemy, targets) {
    const target = pick(targets);
    if (!target) return;
    const ranged = ['spider', 'wraith'].includes(enemy.key);

    if (ranged) {
      playLunge(enemy, 'left');
      addProjectile(unitPoint(enemy), unitPoint(target), true);
      window.setTimeout(() => {
        if (!battle || battle.over || !target.alive) return;
        damageHero(target, enemy.atk * rand(0.9, 1.14));
        sfx(enemy.boss ? 'crit' : 'hurt');
      }, 230);
      if (enemy.boss) arenaQuake();
      return;
    }

    const off = 7 + (enemy.slot % 2 ? 3.5 : 0);
    walkUnit(enemy, clamp(target.x + off, 5, 95), target.y, () => {
      if (!battle || battle.over || !target.alive || !enemy.alive) {
        walkHome(enemy);
        return;
      }
      playLunge(enemy, 'left');
      window.setTimeout(() => {
        if (target.alive) addSlash(unitPoint(target), true);
      }, 70);
      window.setTimeout(() => {
        if (!battle || battle.over || !target.alive) return;
        damageHero(target, enemy.atk * rand(0.9, 1.14));
        sfx(enemy.boss ? 'crit' : 'hurt');
        if (enemy.boss) arenaQuake();
      }, 100);
      window.setTimeout(() => {
        if (enemy.alive && !enemy.wt) walkHome(enemy);
      }, 170);
    }, target, off);
  }

  function damageEnemy(enemy, amount, crit = false) {
    if (!enemy.alive || !battle) return;
    const damage = Math.max(1, Math.round(amount));
    enemy.hp = Math.max(0, enemy.hp - damage);
    const point = unitPoint(enemy);
    addDamageFloat(`-${damage}`, { x: point.x, y: point.y - 16 }, crit ? 'crit' : 'enemy-hit');
    flashHit(enemy);
    syncHealth(enemy);
    if (enemy.hp <= 0) killEnemy(enemy, point);
  }

  function damageHero(hero, amount) {
    if (!hero.alive || !battle) return;
    const damage = Math.max(1, Math.round(amount));
    hero.hp = Math.max(0, hero.hp - damage);
    const point = unitPoint(hero);
    addDamageFloat(`-${damage}`, { x: point.x, y: point.y - 18 }, '');
    flashHit(hero);
    syncHealth(hero);
    if (hero.hp <= 0) {
      hero.alive = false;
      cancelWalk(hero);
      hero.el?.classList.add('dead');
      hero.el?.classList.remove('ready');
      sfx('lose');
    }
  }

  function killEnemy(enemy, point) {
    if (!enemy.alive || !battle) return;
    enemy.alive = false;
    cancelWalk(enemy);
    enemy.el?.classList.add('dying');
    enemy.el?.classList.remove('ready');
    const type = ENEMY_TYPES[enemy.key];
    const reward = Math.round((12 + battle.depth * 3) * type.coins);
    battle.coinsEarned += reward;
    const chip = $('#battleCoins');
    if (chip) {
      chip.textContent = `+${battle.coinsEarned}`;
      chip.animate(
        [{ transform: 'scale(1)', color: '#f2e3ce' }, { transform: 'scale(1.22)', color: '#ffd46b' }, { transform: 'scale(1)' }],
        { duration: 300, easing: 'ease-out' }
      );
    }
    addDamageFloat(`+${reward}`, { x: point.x, y: point.y - 22 }, 'coin');
    const count = livingEnemies().length;
    const foeChip = $('#foeCount');
    if (foeChip) foeChip.textContent = `${count} foe${count === 1 ? '' : 's'}`;
    sfx('coin');
    if (enemy.boss) {
      battle.coinsEarned += Math.round(reward * 0.6);
    }
  }

  function castHeroSkill(uid) {
    if (!battle || battle.over || battle.delay > 0) return;
    const hero = battle.heroes.find(item => item.uid === uid);
    if (!hero || !hero.alive) return;
    if (hero.cooldown > 0) {
      sfx('error');
      if (performance.now() - battle.lastDenied > 1400) {
        battle.lastDenied = performance.now();
        toast(`${hero.name}'s ${HERO_BY_ID[hero.id].skill.name} is still charging.`);
      }
      return;
    }

    const skill = HERO_BY_ID[hero.id].skill;
    hero.cooldown = SKILL_COOLDOWN;
    if (hero.el) hero.el.classList.remove('ready');
    const point = unitPoint(hero);
    addBurst(point);
    addSkillLabel(skill.name, point);

    if (skill.type === 'heal') {
      const heal = Math.round(hero.maxHp * skill.mult);
      livingHeroes().forEach(ally => {
        const before = ally.hp;
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        syncHealth(ally);
        const healed = ally.hp - before;
        if (healed > 0) addDamageFloat(`+${healed}`, { x: unitPoint(ally).x, y: unitPoint(ally).y - 20 }, 'heal');
      });
      sfx('heal');
    } else {
      const enemies = livingEnemies();
      if (skill.type === 'single') {
        const target = enemies.sort((a, b) => b.hp - a.hp)[0];
        if (target) {
          const p = unitPoint(target);
          addSlash(p, false);
          damageEnemy(target, hero.atk * skill.mult, true);
          if (skill.stun) {
            target.stun = Math.max(target.stun, skill.stun * (target.boss ? 0.55 : 1));
            addDamageFloat('STUN', { x: p.x, y: p.y - 38 });
          }
        }
      } else if (skill.type === 'multi') {
        for (let i = 0; i < skill.hits; i++) {
          const alive = livingEnemies();
          if (!alive.length) break;
          const target = pick(alive);
          window.setTimeout(() => {
            if (!battle || battle.over || !target.alive) return;
            addSlash(unitPoint(target), false);
            damageEnemy(target, hero.atk * skill.mult, i === skill.hits - 1);
          }, i * 115);
        }
      } else {
        enemies.forEach((target, index) => {
          window.setTimeout(() => {
            if (!battle || battle.over || !target.alive) return;
            addSlash(unitPoint(target), false);
            damageEnemy(target, hero.atk * skill.mult, false);
            if (skill.stun) {
              target.stun = Math.max(target.stun, skill.stun * (target.boss ? 0.55 : 1));
            }
          }, index * 80);
        });
      }
      sfx('special');
      arenaQuake();
    }
    updateSkillRings();
  }

  function grantHeroXp(id, amount) {
    if (!owned(id)) return null;
    state.xp[id] = (state.xp[id] || 0) + amount;
    let leveled = false;
    while (levelOf(id) < 12 && state.xp[id] >= xpNeeded(levelOf(id))) {
      state.xp[id] -= xpNeeded(levelOf(id));
      state.levels[id] = levelOf(id) + 1;
      leveled = true;
    }
    if (state.levels[id] >= 12) state.xp[id] = 0;
    return leveled ? levelOf(id) : null;
  }

  function finishBattle(victory) {
    if (!battle || battle.over) return;
    battle.over = true;
    battle.ending = true;
    cancelAnimationFrame(battleRaf);
    battle.heroes.forEach(cancelWalk);
    battle.enemies.forEach(cancelWalk);

    const depth = battle.depth;
    let totalCoins = battle.coinsEarned;
    let xpTotal = 0;
    const levelUps = [];

    if (victory) {
      totalCoins += 14 + depth * 2;
      const baseXp = 17 + depth * 5;
      battle.heroes.forEach(hero => {
        const amount = Math.round(baseXp * (hero.alive ? 1 : 0.5));
        xpTotal += amount;
        const level = grantHeroXp(hero.id, amount);
        if (level) levelUps.push({ name: HERO_BY_ID[hero.id].name, level });
      });
      state.coins += totalCoins;
      state.wins += 1;
      state.depth = Math.min(999, depth + 1);
      state.bestDepth = Math.max(state.bestDepth, depth);
      sfx('win');
    } else {
      state.coins += totalCoins;
      sfx('lose');
    }

    updateHeader();
    bumpCoins();
    save();

    const result = {
      victory,
      totalCoins,
      xpTotal,
      levelUps,
      depth,
      nextDepth: state.depth
    };

    window.setTimeout(() => {
      showBattleResult(result);
    }, victory ? 900 : 800);
  }

  function showBattleResult(result) {
    if (view !== 'battle') return;
    const bossFight = battle?.enemies.some(enemy => enemy.boss);
    const subtitle = result.victory
      ? bossFight
        ? 'The boss collapses into dust. The lower tunnels are yours — for now.'
        : 'The last foe hits the floor. Your crew hauls the ore and coins back into the light.'
      : 'The cave wins this round. Your crew drags itself home with whatever was already in its pockets.';
    const levelPills = result.levelUps.map(item => `<span class="level-up-pill">${item.name} · Lv ${item.level}</span>`).join('');
    const depthLine = result.victory
      ? `<div class="depth-unlock">${ICONS.down}<span>Depth <strong>${result.nextDepth}</strong> charted · next run is harder</span></div>`
      : `<div class="depth-unlock">${ICONS.hammer}<span>Depth <strong>${result.depth}</strong> held · crew fully healed</span></div>`;

    showOverlay(`
      <div class="result-overlay ${result.victory ? '' : 'loss'}" role="dialog" aria-modal="true" aria-label="${result.victory ? 'Victory' : 'Defeat'}">
        <div class="result-card">
          <div class="result-emblem">${result.victory ? ICONS.pick : ICONS.hammer}</div>
          <span class="eyebrow">${result.victory ? 'Cave cleared' : 'Run ended'}</span>
          <h2>${result.victory ? 'Haul secured!' : 'Crew down.'}</h2>
          <p class="result-sub">${subtitle}</p>
          <div class="loot-grid">
            <div class="loot-cell"><span>Coins hauled</span><strong><span class="coin-icon"></span>${result.totalCoins}</strong></div>
            <div class="loot-cell xp"><span>${result.victory ? 'Crew XP' : 'Cave record'}</span><strong>${result.victory ? `+${result.xpTotal}` : `Depth ${result.depth}`}</strong></div>
          </div>
          ${levelPills ? `<div class="level-ups">${levelPills}</div>` : ''}
          ${depthLine}
          <button class="btn primary" id="resultCloseBtn">Return to surface</button>
        </div>
      </div>`, 'result-layer');

    const close = () => {
      sfx('click');
      const wasVictory = result.victory;
      const nextDepth = result.nextDepth;
      closeOverlay();
      battle = null;
      cave = null;
      renderSurface();
      sfx('travel');
      toast(wasVictory ? `Depth ${nextDepth} charted. The next descent is harder.` : 'Back at camp. Patch up and try again.', wasVictory ? 'good' : '');
    };

    $('#resultCloseBtn')?.addEventListener('click', close);
    $('.result-overlay')?.addEventListener('click', event => {
      if (event.target === event.currentTarget) {
        // Results are intentionally sticky: no accidental dismissal.
      }
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */

  function init() {
    updateHeader();
    renderSurface();
    document.addEventListener('gesturestart', event => event.preventDefault());
    window.addEventListener('beforeunload', save);
  }

  init();
})();
