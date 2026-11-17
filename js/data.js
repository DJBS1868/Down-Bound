(() => {
  'use strict';

  const SAVE_KEY = 'downbound.save.v2';
  const MAX_SLOTS = 5;
  const SLOT_COSTS = [80, 140, 220, 320];
  const SKILL_COOLDOWN = 7;
  const HERO_XP_BASE = 58;

  const HEROES = [
    {
      id: 'pip', name: 'Pip', role: 'Foreman', rarity: 'common', weight: 10,
      hp: 138, atk: 12, interval: 1.18,
      blurb: 'A stubborn old foreman who swings first and asks later.',
      skill: { name: 'Power Swing', type: 'all', mult: 1.55, desc: 'A wide swing that hits every foe.' }
    },
    {
      id: 'nyx', name: 'Nyx', role: 'Scout', rarity: 'rare', weight: 6,
      hp: 98, atk: 16, interval: 0.92,
      blurb: 'Quiet feet. Quick blade. She always finds the soft spot.',
      skill: { name: 'Backstab', type: 'single', mult: 3.3, desc: 'A brutal strike on one enemy.' }
    },
    {
      id: 'bram', name: 'Bram', role: 'Warden', rarity: 'common', weight: 9,
      hp: 182, atk: 9, interval: 1.42,
      blurb: 'A wall of iron and beard. Nothing gets past Bram.',
      skill: { name: 'Shield Bash', type: 'all', mult: 1.15, stun: 1.7, desc: 'Smashes every foe and stuns them.' }
    },
    {
      id: 'mica', name: 'Mica', role: 'Arcanist', rarity: 'epic', weight: 3,
      hp: 86, atk: 19, interval: 1.5,
      blurb: 'Reads the crystal veins like a map. Her magic runs deep.',
      skill: { name: 'Crystal Nova', type: 'all', mult: 2.05, desc: 'A shattering blast of cave magic.' }
    },
    {
      id: 'sable', name: 'Sable', role: 'Ranger', rarity: 'rare', weight: 6,
      hp: 114, atk: 14, interval: 1.03,
      blurb: 'Three arrows, three heartbeats, three very bad days.',
      skill: { name: 'Triple Volley', type: 'multi', mult: 1.35, hits: 3, desc: 'Looses three piercing arrows.' }
    },
    {
      id: 'flint', name: 'Flint', role: 'Brawler', rarity: 'common', weight: 9,
      hp: 148, atk: 15, interval: 1.12,
      blurb: 'A pit fighter with a chin like a pickaxe head.',
      skill: { name: 'Haymaker', type: 'single', mult: 3.45, stun: 1.2, desc: 'One enormous punch. One very quiet foe.' }
    },
    {
      id: 'wren', name: 'Wren', role: 'Medic', rarity: 'rare', weight: 5,
      hp: 108, atk: 10, interval: 1.15,
      blurb: 'Keeps the crew breathing and the tea brewing.',
      skill: { name: 'Field Mend', type: 'heal', mult: 0.3, desc: 'Patches up every living crew member.' }
    },
    {
      id: 'orin', name: 'Orin', role: 'Bombardier', rarity: 'epic', weight: 3,
      hp: 124, atk: 18, interval: 1.48,
      blurb: 'Loves the sound of a well-placed explosion. Mostly.',
      skill: { name: 'Deep Blast', type: 'all', mult: 1.8, desc: 'A chain of blasts across the cave.' }
    }
  ];

  const HERO_BY_ID = Object.fromEntries(HEROES.map(h => [h.id, h]));
  const RARITY_LABEL = { common: 'Common', rare: 'Rare', epic: 'Epic' };

  const ENEMY_TYPES = {
    bat:     { name: 'Cave Bat',     hp: 0.78, atk: 0.82, interval: 1.2,  coins: 0.8, tone: '#ad6477' },
    slime:   { name: 'Moss Slime',   hp: 1.18, atk: 0.9,  interval: 1.5,  coins: 1,   tone: '#6eaa74' },
    goblin:  { name: 'Cave Goblin',  hp: 1,    atk: 1,    interval: 1.08, coins: 1.1, tone: '#9d9b55' },
    skeleton:{ name: 'Lost Miner',   hp: 1.23, atk: 1.12, interval: 1.15, coins: 1.2, tone: '#c1b49e' },
    spider:  { name: 'Silkfang',     hp: 0.92, atk: 1.1,  interval: 0.9,  coins: 1.15,tone: '#8b6aa8' },
    golem:   { name: 'Gloom Golem',  hp: 2.05, atk: 1.28, interval: 1.7,  coins: 2.4, tone: '#9c8064', boss: true },
    wraith:  { name: 'Vein Wraith',  hp: 1.5,  atk: 1.2,  interval: 1.2,  coins: 2,   tone: '#75a9a1', boss: true }
  };

  const DEPTH_NAMES = [
    'The Shallows', 'Mossy Hollow', 'Echo Warrens', 'The Long Drop',
    'Gloom Golem Rest', 'Broken Ladder', 'Crystal Chapel', 'The Low Vein',
    'Sunless Sea', 'The Deep Works'
  ];

  const PAD_POSITIONS = {
    1: [[50, 58]],
    2: [[34, 54], [66, 62]],
    3: [[24, 57], [50, 44], [76, 60]],
    4: [[21, 53], [40, 66], [61, 45], [80, 61]],
    5: [[18, 57], [36, 44], [54, 60], [72, 45], [87, 61]]
  };

  /* Battle formations: [x% across arena, floor depth 0 (back) .. 1 (front)].
     y is derived from the arena's floor line at fight time. */
  const HERO_FORMATIONS = {
    1: [[28, 0.5]],
    2: [[22, 0.28], [36, 0.78]],
    3: [[18, 0.2], [32, 0.55], [17, 0.9]],
    4: [[18, 0.16], [33, 0.45], [17, 0.72], [34, 0.97]],
    5: [[15, 0.1], [30, 0.35], [16, 0.6], [32, 0.84], [19, 1]]
  };

  const ENEMY_FORMATIONS = {
    1: [[79, 0.42]],
    2: [[76, 0.24], [88, 0.76]],
    3: [[74, 0.16], [89, 0.52], [77, 0.88]],
    4: [[72, 0.1], [88, 0.4], [74, 0.66], [89, 0.94]]
  };

  const ICONS = {
    shop: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 9.2h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v15m0 0 6-6m-6 6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20V5m0 0 6 6m-6-6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none"><rect x="5.5" y="10" width="13" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" stroke-width="2"/></svg>',
    swords: '<svg viewBox="0 0 24 24" fill="none"><path d="m5 4 7 7-4 4-3-3V4Zm14 0-7 7 4 4 3-3V4Z" fill="currentColor"/><path d="m8 16-4 4m12-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    hammer: '<svg viewBox="0 0 24 24" fill="none"><path d="m13 4 7 7-3 3-7-7 3-3ZM9 11l-5 5 4 4 5-5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    pick: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 20 18 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 4c4 0 7 2 8 5-3-1-6-1-8 1M4 12c0-4 2-7 5-8-1 3-1 6 1 8" fill="currentColor"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5h3l2 9h9l2-6H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="18" r="1.6" fill="currentColor"/><circle cx="17" cy="18" r="1.6" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.2 4L19 6.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.8 14 9l6.2 2-6.2 2-2 6.2-2-6.2L3.8 11 10 9l2-6.2Z" fill="currentColor"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" fill="currentColor"/></svg>'
  };

  /* =========================================================
     PORTRAIT ART
     ========================================================= */

  function portraitSvg(hero) {
    // Bubble portraits reuse the full-body battle models, cropped to a bust,
    // so the crew looks the same everywhere in the game.
    const art = HERO_SPRITE_ART[hero.id] || HERO_SPRITE_ART.pip;
    return `<svg viewBox="7 1 50 50" role="img" aria-hidden="true">${art}</svg>`;
  }

  /* =========================================================
     BATTLE SPRITE ART — full-body characters for the arena
     ========================================================= */

  const HERO_SPRITE_ART = {
      pip: `
        <rect x="23" y="54" width="8" height="16" rx="3" fill="#3f5878"/>
        <rect x="33" y="54" width="8" height="16" rx="3" fill="#46648c"/>
        <rect x="20" y="68" width="13" height="6" rx="2.5" fill="#2c211a"/>
        <rect x="31" y="68" width="13" height="6" rx="2.5" fill="#2c211a"/>
        <path d="M21 38c0-7 5-11 11-11s11 4 11 11v14c0 3-2 5-5 5H26c-3 0-5-2-5-5Z" fill="#8a5636"/>
        <path d="M26 38h12v19H26z" fill="#46648c"/>
        <path d="M26 38h12v4H26z" fill="#3a5270"/>
        <circle cx="29.5" cy="45" r="1.4" fill="#e0c06a"/><circle cx="34.5" cy="45" r="1.4" fill="#e0c06a"/>
        <rect x="20" y="42" width="6" height="13" rx="3" fill="#7a4a2c"/>
        <rect x="38" y="33" width="6" height="14" rx="3" transform="rotate(40 41 40)" fill="#8a5636"/>
        <circle cx="45" cy="30" r="2.7" fill="#d9a06b"/>
        <path d="M44 32 52 12" stroke="#6e4a28" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M45 10c6-4 12-2 15 3-4 0-9 2-12 5Z" fill="#c3ccd2"/>
        <circle cx="32" cy="24" r="7.5" fill="#d9a06b"/>
        <path d="M25 25c0 6 3 10 7 10s7-4 7-10c-2 2-4 3-7 3s-5-1-7-3Z" fill="#b6b0a3"/>
        <circle cx="29.5" cy="23" r="1.3" fill="#2a1d14"/><circle cx="34.5" cy="23" r="1.3" fill="#2a1d14"/>
        <path d="M23 18c1-6 5-9 9-9s8 3 9 9c-3-2-6-3-9-3s-6 1-9 3Z" fill="#e6b53c"/>
        <rect x="20" y="17" width="24" height="3.4" rx="1.7" fill="#d8a72e"/>
        <circle cx="38" cy="12" r="1.6" fill="#f4d97a"/>`,
      nyx: `
        <rect x="26" y="56" width="5.5" height="14" rx="2.5" fill="#1d2b31"/>
        <rect x="33" y="56" width="5.5" height="14" rx="2.5" fill="#22333a"/>
        <rect x="24" y="68" width="10" height="5" rx="2" fill="#141d21"/>
        <rect x="31" y="68" width="10" height="5" rx="2" fill="#141d21"/>
        <path d="M25 36c0-6 3-10 7-10s7 4 7 10l1 16c0 3-2 5-4 5h-8c-2 0-4-2-4-5Z" fill="#2c4149"/>
        <path d="M25 36c4-3 10-3 14 0v5c-4-2-10-2-14 0Z" fill="#22333a"/>
        <rect x="22" y="38" width="5" height="12" rx="2.5" fill="#2c4149"/>
        <circle cx="24.5" cy="51" r="2" fill="#c9a07a"/>
        <path d="M24.5 51l-5.4-6.2 2.4-2 5.2 6Z" fill="#c9d4d8"/>
        <rect x="37" y="38" width="5" height="12" rx="2.5" transform="rotate(26 39.5 44)" fill="#354d55"/>
        <circle cx="43.5" cy="51.5" r="2.2" fill="#c9a07a"/>
        <path d="M45.5 53.5l6 6-2.3 2.2-6-6Z" fill="#c9d4d8"/>
        <circle cx="32" cy="23" r="7" fill="#171f23"/>
        <ellipse cx="32" cy="25" rx="4.4" ry="4" fill="#0d1315"/>
        <circle cx="30" cy="24.5" r="1.1" fill="#8fe8d8"/><circle cx="34.6" cy="24.5" r="1.1" fill="#8fe8d8"/>
        <path d="M25 21c0-5.5 3-9.5 7-9.5s7 4 7 9.5c-2-2.5-4-3.5-7-3.5s-5 1-7 3.5Z" fill="#2c4149"/>
        <path d="M23 27c2 8 5 12 9 13l-1.5 6c-7-3.5-10-10-10-19Z" fill="#22333a"/>`,
      bram: `
        <rect x="22" y="56" width="8" height="14" rx="3" fill="#3a3f47"/>
        <rect x="32" y="56" width="8" height="14" rx="3" fill="#43494f"/>
        <rect x="19" y="68" width="13" height="6" rx="2.5" fill="#262b31"/>
        <rect x="30" y="68" width="13" height="6" rx="2.5" fill="#262b31"/>
        <path d="M20 40c0-8 5-13 12-13s12 5 12 13v14c0 3-2 5-5 5H25c-3 0-5-2-5-5Z" fill="#5b636e"/>
        <path d="M20 40c4-3 20-3 24 0l-1 5c-7-2-15-2-22 0Z" fill="#495059"/>
        <circle cx="27" cy="47" r="1.5" fill="#8f9aa5"/><circle cx="37" cy="47" r="1.5" fill="#8f9aa5"/>
        <rect x="21" y="42" width="6" height="12" rx="3" fill="#525a64"/>
        <circle cx="32" cy="23" r="8" fill="#d9a06b"/>
        <path d="M25 26c0 5 3 9 7 9s7-4 7-9c-2 2-12 2-14 0Z" fill="#c96f3a"/>
        <circle cx="29" cy="22" r="1.4" fill="#2a1d14"/><circle cx="35" cy="22" r="1.4" fill="#2a1d14"/>
        <path d="M24 20c0-7 4-10 8-10s8 3 8 10l-2-1c0-5-2-7-6-7s-6 2-6 7Z" fill="#6b727b"/>
        <rect x="23" y="19" width="18" height="3" rx="1.5" fill="#7d8590"/>
        <path d="M31 20h2v6h-2z" fill="#5b636e"/>
        <rect x="42" y="30" width="16" height="34" rx="4" fill="#7a4a2e"/>
        <rect x="44.5" y="32.5" width="11" height="29" rx="2.5" fill="#8d5a38"/>
        <rect x="42" y="30" width="16" height="34" rx="4" fill="none" stroke="#4a4f57" stroke-width="2.4"/>
        <circle cx="50" cy="45" r="3.4" fill="#9aa4ae"/>`,
      mica: `
        <ellipse cx="27" cy="75" rx="3.6" ry="2" fill="#2a2130"/>
        <ellipse cx="37" cy="75" rx="3.6" ry="2" fill="#2a2130"/>
        <path d="M24 44c0-9 4-14 8-14s8 5 8 14l2 26c0 3-2 5-4 5H26c-2 0-4-2-4-5Z" fill="#46395f"/>
        <path d="M24 44c4-3 12-3 16 0v4c-5-2-11-2-16 0Z" fill="#5a4a78"/>
        <path d="M25 52c4 2 10 2 14 0l1 4c-5 2-11 2-16 0Z" fill="#3a2f4e"/>
        <circle cx="30" cy="54" r="1.6" fill="#e0c06a"/>
        <rect x="20" y="38" width="5" height="12" rx="2.5" transform="rotate(16 22.5 44)" fill="#46395f"/>
        <circle cx="22" cy="36" r="2.2" fill="#dcb48c"/>
        <path d="M22 10v44" stroke="#6e5a40" stroke-width="3" stroke-linecap="round"/>
        <path d="M22 8c-4 2-5 6-3 9 2-2 5-3 8-3-2-2-3-4-5-6Z" fill="#7fe0d0"/>
        <circle cx="21.5" cy="10" r="3.2" fill="#aef0e2" opacity=".5"/>
        <rect x="39" y="40" width="5" height="12" rx="2.5" transform="rotate(-18 41.5 46)" fill="#5a4a78"/>
        <circle cx="41.5" cy="41" r="2.2" fill="#dcb48c"/>
        <circle cx="32" cy="25" r="7.5" fill="#e3bd97"/>
        <path d="M24 22c1-7 5-10 8-10s7 3 8 10c1 5-1 9-2 10l-1-6c-3 2-9 2-12 0l-1 6c-1-1-3-5 0-10Z" fill="#cbb6d8"/>
        <circle cx="29.5" cy="25" r="1.3" fill="#2a1d28"/><circle cx="34.5" cy="25" r="1.3" fill="#2a1d28"/>
        <path d="M30 29q2 1.5 4 0" stroke="#a06a5a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
      sable: `
        <rect x="26" y="56" width="5.5" height="14" rx="2.5" fill="#3c3126"/>
        <rect x="33" y="56" width="5.5" height="14" rx="2.5" fill="#453a2c"/>
        <rect x="24" y="68" width="10" height="5" rx="2" fill="#241d15"/>
        <rect x="31" y="68" width="10" height="5" rx="2" fill="#241d15"/>
        <path d="M25 36c0-6 3-10 7-10s7 4 7 10l1 18c0 3-2 5-4 5h-8c-2 0-4-2-4-5Z" fill="#4e6b40"/>
        <path d="M20 30l9-7 3 4-9 7z" fill="#5d4a30"/>
        <path d="M22 25l5 7" stroke="#c9c2b0" stroke-width="1.3"/>
        <path d="M22 25l-3-4" stroke="#b34a3c" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M26 22l-3-4" stroke="#d8c98e" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="21" y="38" width="5" height="11" rx="2.5" fill="#44603a"/>
        <rect x="38" y="36" width="5" height="12" rx="2.5" transform="rotate(32 40.5 42)" fill="#5d7a4c"/>
        <circle cx="46" cy="44" r="2.5" fill="#d9a06b"/>
        <path d="M46 26c8 6 8 30 0 36" fill="none" stroke="#8a6a3e" stroke-width="3" stroke-linecap="round"/>
        <path d="M46 26v36" stroke="#d8d2c0" stroke-width="1.2"/>
        <path d="M46 44h13" stroke="#d8d2c0" stroke-width="1.4"/>
        <path d="M59 44l-4-2.4v4.8Z" fill="#c9d4d8"/>
        <circle cx="32" cy="23" r="7" fill="#d9a06b"/>
        <path d="M25 22c0-6 3-10 7-10s7 4 7 10l-1 8c-1-3-2-4-3-5-2 1-5 1-7 0-1 1-2 2-3 5Z" fill="#4e6b40"/>
        <ellipse cx="32" cy="25" rx="4.2" ry="3.8" fill="#c98a5e"/>
        <circle cx="30.5" cy="24.5" r="1.1" fill="#2a1d14"/><circle cx="34.5" cy="24.5" r="1.1" fill="#2a1d14"/>`,
      flint: `
        <rect x="24" y="54" width="8" height="16" rx="3" fill="#33302e"/>
        <rect x="33" y="54" width="8" height="16" rx="3" fill="#3a3734"/>
        <rect x="21" y="68" width="13" height="6" rx="2.5" fill="#1e1b19"/>
        <rect x="31" y="68" width="13" height="6" rx="2.5" fill="#1e1b19"/>
        <path d="M23 34c0-6 4-10 9-10s9 4 9 10v12c0 3-2 5-5 5H28c-3 0-5-2-5-5Z" fill="#c98a5e"/>
        <path d="M23 38c4 2 14 2 18 0v4c-5 2-13 2-18 0Z" fill="#a86f48"/>
        <path d="M26 31l8 6" stroke="#8a5442" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="18" y="34" width="6" height="13" rx="3" transform="rotate(18 21 40)" fill="#c98a5e"/>
        <circle cx="16.5" cy="49" r="2.8" fill="#b8452f"/>
        <rect x="40" y="31" width="6" height="13" rx="3" transform="rotate(-54 43 37.5)" fill="#c98a5e"/>
        <circle cx="49.5" cy="25.5" r="3.2" fill="#b8452f"/>
        <circle cx="32" cy="22" r="7.5" fill="#c98a5e"/>
        <path d="M25 19c1-6 4-9 7-9s6 3 7 9l-2-2c-3 1-7 1-10 0Z" fill="#211c1a"/>
        <path d="M24 16.5h16v2.5H24z" fill="#b8452f"/>
        <circle cx="29.5" cy="23" r="1.3" fill="#2a1d14"/><circle cx="34.5" cy="23" r="1.3" fill="#2a1d14"/>
        <path d="M30 27q2.5 2 5 0" stroke="#7a4a34" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
      wren: `
        <rect x="26" y="58" width="5.5" height="13" rx="2.5" fill="#5d4a34"/>
        <rect x="33" y="58" width="5.5" height="13" rx="2.5" fill="#6a5540"/>
        <rect x="24" y="69" width="10" height="5" rx="2" fill="#3a2d20"/>
        <rect x="31" y="69" width="10" height="5" rx="2" fill="#3a2d20"/>
        <path d="M24 36c0-6 3-10 8-10s8 4 8 10v20c0 3-2 5-5 5H29c-3 0-5-2-5-5Z" fill="#d8d2c0"/>
        <path d="M24 36c4-2 12-2 16 0l-1 4c-4-1-10-1-14 0Z" fill="#c2bba6"/>
        <path d="M32 39v8M28.5 43h7" stroke="#b8452f" stroke-width="2.2"/>
        <path d="M26 34c4-2 10-2 13 1l-2.5 3c-3-2-6-2-9-1Z" fill="#7a5a38"/>
        <path d="M38 45h7l-1 8h-5Z" fill="#7a5a38"/>
        <rect x="20" y="38" width="5" height="12" rx="2.5" fill="#c2bba6"/>
        <rect x="39" y="35" width="5" height="12" rx="2.5" transform="rotate(-32 41.5 41)" fill="#d8d2c0"/>
        <circle cx="45" cy="30" r="2.4" fill="#dcb48c"/>
        <rect x="43" y="23.5" width="5" height="7" rx="1.4" fill="#7fb8a8"/>
        <rect x="44.4" y="21.4" width="2.2" height="3" fill="#6a5540"/>
        <circle cx="32" cy="23" r="7.5" fill="#e3bd97"/>
        <path d="M24 20c1-6 4-9 8-9s7 3 8 9l-2 1c0-4-2-6-6-6s-6 2-6 6Z" fill="#8a5a3a"/>
        <path d="M25 16c1-5 4-8 7-8s6 3 7 8c-4-1.6-10-1.6-14 0Z" fill="#e6e0d0"/>
        <path d="M31 10.5v3M29.5 12h3" stroke="#b8452f" stroke-width="1.6"/>
        <circle cx="29.5" cy="23" r="1.3" fill="#2a1d14"/><circle cx="34.5" cy="23" r="1.3" fill="#2a1d14"/>
        <path d="M30 27q2.5 2 5 0" stroke="#a06a5a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
      orin: `
        <rect x="25" y="56" width="6" height="14" rx="2.5" fill="#4a3a28"/>
        <rect x="33" y="56" width="6" height="14" rx="2.5" fill="#554430"/>
        <rect x="22" y="68" width="12" height="6" rx="2.5" fill="#2c2118"/>
        <rect x="30" y="68" width="12" height="6" rx="2.5" fill="#2c2118"/>
        <path d="M23 36c0-6 4-10 9-10s9 4 9 10l2 24c0 3-2 5-5 5H26c-3 0-5-2-5-5Z" fill="#6b4a2e"/>
        <path d="M23 36c4-2 14-2 18 0l-1 4c-5-1-11-1-16 0Z" fill="#584028"/>
        <circle cx="27" cy="44" r="1.4" fill="#d8b564"/><circle cx="27" cy="50" r="1.4" fill="#d8b564"/>
        <rect x="20" y="38" width="5" height="12" rx="2.5" fill="#5d4128"/>
        <rect x="39" y="33" width="5" height="12" rx="2.5" transform="rotate(-42 41.5 39)" fill="#6b4a2e"/>
        <circle cx="47" cy="26" r="2.6" fill="#dcb48c"/>
        <circle cx="49" cy="20" r="5.5" fill="#2e2a26"/>
        <circle cx="47" cy="18" r="1.6" fill="#4a4540"/>
        <path d="M50.5 15q3-3 6-2" stroke="#8a6a3e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="57.5" cy="12.5" r="1.8" fill="#f5a04a"/>
        <circle cx="32" cy="23" r="7.5" fill="#d9a06b"/>
        <path d="M24 20c0-7 4-10 8-10s8 3 8 10l-2-1c0-4-2-6-6-6s-6 2-6 6Z" fill="#3a3128"/>
        <rect x="23" y="18" width="18" height="3" rx="1.5" fill="#2e261f"/>
        <circle cx="29" cy="21.5" r="3" fill="#c9973a" stroke="#8a6a3e" stroke-width="1.2"/>
        <circle cx="36.5" cy="21.5" r="3" fill="#c9973a" stroke="#8a6a3e" stroke-width="1.2"/>
        <path d="M31.8 21.5h1.9" stroke="#8a6a3e" stroke-width="1.6"/>
        <circle cx="29" cy="21.5" r="1.4" fill="#5a4632"/><circle cx="36.5" cy="21.5" r="1.4" fill="#5a4632"/>`
  };

  function heroSpriteSvg(hero) {
    return `<svg viewBox="0 0 64 80" aria-hidden="true">${HERO_SPRITE_ART[hero.id] || HERO_SPRITE_ART.pip}</svg>`;
  }

  /* =========================================================
     ENEMY ART
     ========================================================= */

  function enemySvg(type) {
    const art = {
      bat: `
        <path d="M31 27C22 12 9 10 3 22c5 1 4 6 2 10 6-4 12-2 16 6 3-3 6-4 10-4Z" fill="#4a2b3a"/>
        <path d="M33 27c9-15 22-17 28-5-5 1-4 6-2 10-6-4-12-2-16 6-3-3-6-4-10-4Z" fill="#3f2532"/>
        <path d="M30 28 12 17M28 30 9 28M29 33 15 43" stroke="#2b1721" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M34 28 52 17M36 30 55 28M35 33 49 43" stroke="#241119" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M7 22c3 0 5 2 6 5m44-5c-3 0-5 2-6 5" stroke="#6e4256" stroke-width="1" fill="none" opacity=".7"/>
        <path d="M25 22c-2-7 1-12 3-14 1 5 3 7 4 7s3-2 4-7c2 2 5 7 3 14Z" fill="#5b3444"/>
        <circle cx="32" cy="25" r="8" fill="#6a3d50"/>
        <path d="M24 24c0-5 3-8 8-8s8 3 8 8c-2-2-4-3-8-3s-6 1-8 3Z" fill="#4a2b3a"/>
        <ellipse cx="32" cy="36" rx="7.5" ry="9" fill="#5b3444"/>
        <path d="M26 33c2 5 4 7 6 7s4-2 6-7c-2 2-10 2-12 0Z" fill="#6e4256"/>
        <circle cx="28.5" cy="25" r="2.4" fill="#ff6b6b"/><circle cx="35.5" cy="25" r="2.4" fill="#ff6b6b"/>
        <circle cx="28.5" cy="25" r="1" fill="#3a1015"/><circle cx="35.5" cy="25" r="1" fill="#3a1015"/>
        <path d="M29 29l1.4 3 1.6-3m0 0 1.4 3 1.6-3" fill="#f4e9d8"/>
        <path d="M27 45l-1.5 4m4.5-4v4m5.5-4 1.5 4" stroke="#8a5a6e" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M30 20l-1-4m4 4 1-4" stroke="#8a5a6e" stroke-width="1.2" stroke-linecap="round"/>`,
      slime: `
        <ellipse cx="32" cy="54" rx="21" ry="5" fill="#16281b" opacity=".55"/>
        <path d="M10 47c0-17 9-29 22-35 13 6 22 18 22 35 0 8-9 13-22 13S10 55 10 47Z" fill="#3f7a4a"/>
        <path d="M14 46c2-14 9-24 18-29 9 5 16 15 18 29-7 6-29 6-36 0Z" fill="#5da565"/>
        <path d="M20 28c3-6 7-10 12-12 5 2 9 6 12 12-8-4-16-4-24 0Z" fill="#7fc078"/>
        <ellipse cx="22" cy="37" rx="4" ry="2.4" fill="#a8d98a" opacity=".65" transform="rotate(-32 22 37)"/>
        <circle cx="16" cy="47" r="2.6" fill="#2f5e3a" opacity=".8"/>
        <circle cx="49" cy="45" r="2.1" fill="#2f5e3a" opacity=".8"/>
        <circle cx="43" cy="51" r="1.6" fill="#2f5e3a" opacity=".7"/>
        <path d="M14 51c-2 4-1 7 1 9" stroke="#4d8f57" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="26" cy="41" r="4.4" fill="#eaf2c8"/><circle cx="38.5" cy="41" r="4.4" fill="#eaf2c8"/>
        <circle cx="26.8" cy="42" r="2.1" fill="#22331f"/><circle cx="39.3" cy="42" r="2.1" fill="#22331f"/>
        <circle cx="25.8" cy="40.6" r=".8" fill="#fff"/><circle cx="38.3" cy="40.6" r=".8" fill="#fff"/>
        <path d="M28 49q4.5 3.4 9 0" stroke="#274a2c" stroke-width="1.7" fill="none" stroke-linecap="round"/>
        <path d="M24 15c1-4 4-5 5-1m4-5c1-4 5-3 5 1" stroke="#8fbf6a" stroke-width="2" stroke-linecap="round"/>
        <path d="M18 22c-2-3-5-2-5 1" stroke="#6f9f56" stroke-width="1.8" stroke-linecap="round"/>`,
      goblin: `
        <path d="M20 22c-6-8-15-8-15 2 0 6 5 9 11 9" fill="#7c8f45"/>
        <path d="M44 22c6-8 15-8 15 2 0 6-5 9-11 9" fill="#6c7d3d"/>
        <path d="M22 42c0-3 4-5 10-5s10 2 10 5l1 12c0 3-4 5-11 5s-11-2-11-5Z" fill="#6b4a2e"/>
        <path d="M26 37v21M38 37v21" stroke="#573a22" stroke-width="1.3"/>
        <circle cx="28" cy="45" r="1.2" fill="#c9a15a"/><circle cx="28" cy="50" r="1.2" fill="#c9a15a"/>
        <path d="M22 59c-2 3 0 5 3 5h5l-1-5m12 0 1 5h5c3 0 4-2 3-5" fill="#5d6a32"/>
        <path d="M20 44c-4 2-6 6-5 10l3 2 3-4" fill="#8d9a4e"/>
        <path d="M44 44c4 2 7 5 8 8l-3 3-4-3" fill="#8d9a4e"/>
        <path d="M51 50l8-9 2.2 2-7.2 9.2Z" fill="#c9d4d8"/>
        <path d="M50.5 51.5l-2.5 3.2 3 1.3 2.2-3.2Z" fill="#7a5230"/>
        <ellipse cx="32" cy="30" rx="12" ry="13" fill="#8d9a4e"/>
        <path d="M22 27c1-8 5-13 10-13s9 5 10 13c-3-3-17-3-20 0Z" fill="#7c8a44"/>
        <path d="M26 25c2-2 4-2 5 0m2 0c2-2 4-2 5 0" stroke="#4f5a2b" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="28" cy="28.5" r="2.1" fill="#e9d060"/><circle cx="36" cy="28.5" r="2.1" fill="#e9d060"/>
        <circle cx="28.4" cy="29" r="1" fill="#2a2212"/><circle cx="36.4" cy="29" r="1" fill="#2a2212"/>
        <path d="M33 26c3 2 3 7-1 9l-2-1 1-8Z" fill="#97a55a"/>
        <path d="M26 40q6 4 12 0" stroke="#3f4823" stroke-width="1.5" fill="none"/>
        <path d="M28 40l1 2.4m6-2.4-1 2.4" stroke="#e8e2c8" stroke-width="1.4" stroke-linecap="round"/>`,
      skeleton: `
        <path d="M46 21 58 9" stroke="#5f4526" stroke-width="3" stroke-linecap="round"/>
        <path d="M50 8c4-3 9-2 12 1-3 0-6 1-8 3Z" fill="#8a8f96"/>
        <path d="M32 34v14" stroke="#d8cfba" stroke-width="3" stroke-linecap="round"/>
        <path d="M27 37h10m-10 4h10m-10 4h10" stroke="#bdb298" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M32 48l-4 10m4-10 4 10" stroke="#d8cfba" stroke-width="3" stroke-linecap="round"/>
        <path d="M22 40c-4 3-5 7-4 11m24-11c4 3 5 7 4 11" stroke="#cfc5ae" stroke-width="3" stroke-linecap="round"/>
        <path d="M18 51l-2 4m4-4 2 4m24-4 2 4m2-4-2 4" stroke="#d8cfba" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M23 24c0-7 4-11 9-11s9 4 9 11c0 4-2 7-5 9H28c-3-2-5-5-5-9Z" fill="#e6ddc6"/>
        <path d="M26 21.5c2-1.6 4-1.6 5 0m2 0c2-1.6 4-1.6 5 0" stroke="#a89a7e" stroke-width="1.3" stroke-linecap="round"/>
        <ellipse cx="28" cy="25" rx="2.8" ry="3.2" fill="#231f1a"/><ellipse cx="36" cy="25" rx="2.8" ry="3.2" fill="#231f1a"/>
        <circle cx="28" cy="24.4" r="1.1" fill="#e8c476"/><circle cx="36" cy="24.4" r="1.1" fill="#e8c476"/>
        <path d="M30 29.5h4l-2 3Z" fill="#b8ab8d"/>
        <path d="M27 33.5l1.4 2 1.8-2 1.8 2 1.4-2" stroke="#9c8f74" stroke-width="1.3" fill="none"/>
        <path d="M22 20c0-8 4-12 10-12s10 4 10 12c-3-3-17-3-20 0Z" fill="#6f6450"/>
        <path d="M20 18.5h24v3H20z" fill="#5c5240"/>
        <circle cx="32" cy="8.6" r="2.6" fill="#d8b564"/>
        <circle cx="32" cy="8.6" r="1.2" fill="#f4e2a6"/>
        <path d="M24 44l-2 9 4-3 3 4 3-4 4 3-2-9Z" fill="#4a4438" opacity=".85"/>`,
      spider: `
        <path d="M30 34 16 22 8 26M30 35 13 35 6 40M30 37 16 47 10 54M31 39 22 50 20 58" stroke="#3a2a48" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M34 34 48 22 56 26M34 35 51 35 58 40M34 37 48 47 54 54M33 39 42 50 44 58" stroke="#4a3459" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="16" cy="22" r="1.3" fill="#8a6aa0"/><circle cx="48" cy="22" r="1.3" fill="#8a6aa0"/>
        <circle cx="13" cy="35" r="1.2" fill="#8a6aa0"/><circle cx="51" cy="35" r="1.2" fill="#8a6aa0"/>
        <circle cx="16" cy="47" r="1.2" fill="#8a6aa0"/><circle cx="48" cy="47" r="1.2" fill="#8a6aa0"/>
        <ellipse cx="32" cy="41" rx="12" ry="13" fill="#3d2c4d"/>
        <ellipse cx="32" cy="42" rx="8.5" ry="10" fill="#513a66"/>
        <path d="M32 34l3 5-3 4-3-4Z" fill="#8f6fb0"/>
        <circle cx="29" cy="46" r="1.3" fill="#8f6fb0"/><circle cx="35" cy="46" r="1.3" fill="#8f6fb0"/>
        <path d="M25 54c2 2 4 3 7 3s5-1 7-3" stroke="#2e203a" stroke-width="1.4" fill="none"/>
        <circle cx="32" cy="27" r="8.5" fill="#4a3459"/>
        <path d="M26 22c2-2 4-3 6-3s4 1 6 3" stroke="#5f4475" stroke-width="1.4" fill="none"/>
        <circle cx="28.5" cy="26" r="2.1" fill="#f1a75f"/><circle cx="35.5" cy="26" r="2.1" fill="#f1a75f"/>
        <circle cx="25.6" cy="29" r="1.2" fill="#e58b57"/><circle cx="38.4" cy="29" r="1.2" fill="#e58b57"/>
        <circle cx="30" cy="22.4" r="1" fill="#f7c98b"/><circle cx="34" cy="22.4" r="1" fill="#f7c98b"/>
        <circle cx="28.5" cy="26" r=".8" fill="#2a1620"/><circle cx="35.5" cy="26" r=".8" fill="#2a1620"/>
        <path d="M28.5 32.5l1.6 4 1.9-4m0 0 1.6 4 1.9-4" fill="#d8c6a8"/>
        <path d="M32 53c0 5-1 8-1.5 11" stroke="#9fb3a8" stroke-width="1" opacity=".65"/>`,
      golem: `
        <path d="M12 31c0-14 8-23 20-23s20 9 20 23v21c0 8-8 12-20 12S12 60 12 52Z" fill="#6d5c49"/>
        <path d="M16 26c3-10 7-14 16-14s13 4 16 14c-8-4-24-4-32 0Z" fill="#86745c"/>
        <path d="M10 36c-6-1-8 4-7 9l8 4m43-13c6-1 8 4 7 9l-8 4" fill="#5a4a3a"/>
        <path d="M3 45l-1 4m6-4 1 4m52-4 1 4m-6-4-1 4" stroke="#4e4032" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M20 30c4-4 8-5 12-5s8 1 12 5v9c-3 4-7 6-12 6s-9-2-12-6Z" fill="#4e4032"/>
        <path d="M23.5 33.5l5.5-2v5.5l-5.5 2Zm17 0L35 31.5v5.5l5.5 2Z" fill="#ff9a4a"/>
        <path d="M27 46h10" stroke="#3a2e24" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M17 27l4 6-3 4 4 5m25-15-4 6 3 4-4 5" stroke="#e8873f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M20 55l3 5m21-5-3 5" stroke="#3f342a" stroke-width="2" stroke-linecap="round"/>
        <path d="M16 18l5-9 4 8Z" fill="#7fd8c4"/>
        <path d="M44 17l5-10 5 9Z" fill="#63c2b0"/>
        <circle cx="20" cy="13.5" r="1.8" fill="#b8f0e0" opacity=".65"/>
        <path d="M14 50c2-3 5-3 7 0m24 0c2-3 5-3 7 0" stroke="#5f7a4a" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="22" cy="37" r="1.5" fill="#9a8a72"/><circle cx="42" cy="37" r="1.5" fill="#9a8a72"/>
        <path d="M28 18l2-5 2 5" stroke="#c18145" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
      wraith: `
        <path d="M12 55c2-19 4-34 20-46 16 12 18 27 20 46-7-4-8 4-14 1-3 3-9 2-12-1-6 4-8-5-14 0Z" fill="#27514d"/>
        <path d="M18 38c2-13 7-20 14-25 7 5 12 12 14 25-4-5-8-8-14-12-6 4-10 7-14 12Z" fill="#376d66"/>
        <path d="M23 30c1-8 4-12 9-15 5 3 8 7 9 15-3-3-6-5-9-7-3 2-6 4-9 7Z" fill="#0d2422"/>
        <circle cx="28.5" cy="31" r="2.3" fill="#a4e5d3"/><circle cx="35.5" cy="31" r="2.3" fill="#a4e5d3"/>
        <circle cx="28.5" cy="31" r=".9" fill="#eafff8"/><circle cx="35.5" cy="31" r=".9" fill="#eafff8"/>
        <path d="M32 41l4 5-4 8-4-8Z" fill="#7fe0d0"/>
        <circle cx="32" cy="47" r="5.5" fill="#7fe0d0" opacity=".3"/>
        <path d="M17 40c-4 2-6 5-6 9l3 2 3-3m30-8c4 2 6 5 6 9l-3 2-3-3" stroke="#cfe6da" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M12 49l-1 4m4-4 1 4m31-4 1 4m3-4-1 4" stroke="#cfe6da" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M22 57c-3 3-3 5 0 6m20-6c3 3 3 5 0 6" stroke="#54a396" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M20 15c2-4 4-5 5-1m13-2c3-4 5-3 6 1" stroke="#7fd8c4" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
        <circle cx="23" cy="22" r="1.2" fill="#b8f0e0" opacity=".7"/>
        <circle cx="42" cy="18" r="1" fill="#b8f0e0" opacity=".6"/>
        <circle cx="16" cy="32" r=".9" fill="#7fd8c4" opacity=".5"/>`
    };
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${art[type] || art.bat}</svg>`;
  }

  window.DB_DATA = {
    SAVE_KEY, MAX_SLOTS, SLOT_COSTS, SKILL_COOLDOWN, HERO_XP_BASE,
    HEROES, HERO_BY_ID, RARITY_LABEL, ENEMY_TYPES, DEPTH_NAMES,
    PAD_POSITIONS, HERO_FORMATIONS, ENEMY_FORMATIONS, ICONS,
    portraitSvg, enemySvg, heroSpriteSvg
  };
})();
