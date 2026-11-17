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
    const art = {
      pip: `
        <rect width="64" height="64" fill="#493a2b"/>
        <circle cx="50" cy="9" r="23" fill="#e0a94e" opacity=".18"/>
        <circle cx="12" cy="57" r="20" fill="#100d0d" opacity=".16"/>
        <path d="M5 64c2-13 12-19 27-19s25 6 27 19" fill="#715033"/>
        <path d="M18 53h28v11H18z" fill="#553922"/>
        <path d="M24 50h16l3 14H21z" fill="#8a6237"/>
        <rect x="28" y="35" width="8" height="11" rx="3" fill="#c4875d"/>
        <ellipse cx="32" cy="29" rx="13" ry="14" fill="#e3aa79"/>
        <path d="M19 28c0-8 5-13 13-13s13 5 13 13v5H19z" fill="#b78048"/>
        <path d="M19 31c0 7 5 11 13 11s13-4 13-11c-3 4-8 6-13 6s-10-2-13-6Z" fill="#8d6037"/>
        <path d="M24 28h6m4 0h6" stroke="#4a2e22" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="27" cy="27" r="1.3" fill="#2a1a16"/><circle cx="37" cy="27" r="1.3" fill="#2a1a16"/>
        <path d="M30 33q2 1.5 4 0" stroke="#6d4229" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M15 27c0-12 7-19 17-19s17 7 17 19H15Z" fill="#d59c40"/>
        <path d="M15 25h34v4H15z" fill="#ad752c"/>
        <path d="M24 14c5-3 12-2 16 2" stroke="#eec272" stroke-width="2" stroke-linecap="round" opacity=".6"/>
        <circle cx="32" cy="17" r="5" fill="#3e3024"/>
        <circle cx="32" cy="17" r="3.2" fill="#ffe5a1"/>
        <circle cx="33" cy="16" r="1.1" fill="#fff9de"/>
        <path d="M20 43c4-2 8-2 12 0" stroke="#5e3b26" stroke-width="2.4" stroke-linecap="round"/>`,
      nyx: `
        <rect width="64" height="64" fill="#153638"/>
        <circle cx="52" cy="10" r="24" fill="#3d9a8c" opacity=".18"/>
        <circle cx="8" cy="58" r="21" fill="#091a1c" opacity=".2"/>
        <path d="M4 64c2-13 13-20 28-20s26 7 28 20" fill="#245c58"/>
        <path d="M13 44c1-9 5-16 11-20" stroke="#3e8b82" stroke-width="2" opacity=".5"/>
        <path d="M10 58V36c0-17 9-27 22-27s22 10 22 27v22l-8-9-14 10-14-10-8 9Z" fill="#286b66"/>
        <path d="M17 35c1-12 7-19 15-19s14 7 15 19c-4-6-9-9-15-9s-11 3-15 9Z" fill="#327d75"/>
        <ellipse cx="32" cy="30" rx="12" ry="13" fill="#cf936d"/>
        <path d="M20 35c3 3 7 5 12 5s9-2 12-5l-1 10c-3 3-7 4-11 4s-8-1-11-4l-1-10Z" fill="#244d4b"/>
        <path d="M24 25c2-2 5-2 7 0m2 0c2-2 5-2 7 0" stroke="#4d664d" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="27" cy="28" r="1.4" fill="#ffd777"/><circle cx="37" cy="28" r="1.4" fill="#ffd777"/>
        <path d="M18 35c-4-1-7 1-8 6 4 1 8-1 10-4m26-2c4-1 7 1 8 6-4 1-8-1-10-4" fill="#245c58"/>
        <path d="M41 12c4 2 7 6 8 11" stroke="#70b6a3" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
        <path d="M14 50c4-2 8-1 11 2" stroke="#b68254" stroke-width="2" stroke-linecap="round" opacity=".65"/>`,
      bram: `
        <rect width="64" height="64" fill="#3a2d33"/>
        <circle cx="13" cy="11" r="23" fill="#a86b5c" opacity=".15"/>
        <path d="M2 64c3-14 14-20 30-20s27 6 30 20" fill="#6f737f"/>
        <path d="M15 48h34v16H15z" fill="#555967"/>
        <path d="M10 57c3-7 9-10 15-8l7 15H6c0-3 1-5 4-7Zm44 0c-3-7-9-10-15-8l-7 15h26c0-3-1-5-4-7Z" fill="#878c98"/>
        <path d="M25 45h14l3 19H22z" fill="#8f3730"/>
        <rect x="28" y="35" width="8" height="12" rx="3" fill="#c0825a"/>
        <ellipse cx="32" cy="29" rx="13" ry="14" fill="#d99b70"/>
        <path d="M19 30c0 8 5 13 13 13s13-5 13-13c-3 5-8 7-13 7s-10-2-13-7Z" fill="#9a4b33"/>
        <path d="M25 31q7 4 14 0" stroke="#743628" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="27" cy="27" r="1.4" fill="#32201b"/><circle cx="37" cy="27" r="1.4" fill="#32201b"/>
        <path d="M24 25h5m6 0h5" stroke="#5f3529" stroke-width="2" stroke-linecap="round"/>
        <path d="M15 27c0-13 7-20 17-20s17 7 17 20H15Z" fill="#7d818d"/>
        <path d="M14 25h36v5H14z" fill="#606571"/>
        <path d="M29 13h6v24h-6z" fill="#686d79"/>
        <path d="M23 13c5-3 13-3 18 0" stroke="#b2b6be" stroke-width="1.8" stroke-linecap="round" opacity=".65"/>
        <path d="M20 45c6-3 18-3 24 0" stroke="#9ba0aa" stroke-width="2" stroke-linecap="round"/>`,
      mica: `
        <rect width="64" height="64" fill="#312643"/>
        <circle cx="50" cy="12" r="23" fill="#c586e7" opacity=".17"/>
        <circle cx="11" cy="55" r="20" fill="#100a18" opacity=".18"/>
        <path d="M4 64c2-13 12-20 28-20s26 7 28 20" fill="#4f376b"/>
        <path d="M17 50h30v14H17z" fill="#68448b"/>
        <path d="M20 50c3-3 8-4 12-2 4-2 9-1 12 2" fill="#d6bce9"/>
        <rect x="28" y="34" width="8" height="12" rx="3" fill="#d0a17f"/>
        <path d="M17 28c1-13 7-19 15-19s14 6 15 19l-7 9-8 4-8-4-7-9Z" fill="#e4d4e9"/>
        <ellipse cx="32" cy="29" rx="11.5" ry="13" fill="#e5b690"/>
        <path d="M21 26c3-2 7-2 10 0m1 0c3-2 7-2 10 0" stroke="#a07193" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="27" cy="29" r="1.4" fill="#5d376b"/><circle cx="37" cy="29" r="1.4" fill="#5d376b"/>
        <path d="M30 34q2 1.4 4 0" stroke="#b27569" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M15 23 32 3l17 20-5 3-12-12-12 12-5-3Z" fill="#744c94"/>
        <path d="M14 21c12-4 24-4 36 0l-2 5c-10-3-22-3-32 0l-2-5Z" fill="#523364"/>
        <path d="M31 5 32 1l1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" fill="#f5cf7a"/>
        <circle cx="44" cy="23" r="1" fill="#f5cf7a"/><circle cx="42" cy="32" r=".8" fill="#f5cf7a" opacity=".8"/>
        <path d="M19 44c4-2 8-2 12 0" stroke="#d8c3e8" stroke-width="2" stroke-linecap="round"/>`,
      sable: `
        <rect width="64" height="64" fill="#20382a"/>
        <circle cx="51" cy="12" r="23" fill="#81a65f" opacity=".16"/>
        <circle cx="9" cy="56" r="20" fill="#0b150d" opacity=".2"/>
        <path d="M4 64c2-13 13-20 28-20s26 7 28 20" fill="#35523a"/>
        <path d="M10 55V36c0-16 9-26 22-26s22 10 22 26v19l-7-7-15 9-15-9-7 7Z" fill="#406a46"/>
        <path d="M16 35c1-11 7-18 16-18s15 7 16 18c-4-7-9-10-16-10s-12 3-16 10Z" fill="#527d53"/>
        <ellipse cx="32" cy="30" rx="12" ry="13" fill="#c79069"/>
        <path d="M20 30c4-3 8-4 12-4s8 1 12 4v5c-4-2-8-3-12-3s-8 1-12 3v-5Z" fill="#355638"/>
        <circle cx="27" cy="28" r="1.4" fill="#cae695"/><circle cx="37" cy="28" r="1.4" fill="#cae695"/>
        <path d="M28 35q4 2 8 0" stroke="#744c3d" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M16 22c5-7 12-10 19-9-2 4-5 8-9 11l-10-2Z" fill="#6e9b5c"/>
        <path d="M38 9c5-3 10-3 14 0-4 1-7 3-9 6" fill="#c9a961"/>
        <path d="M44 44c-5-3-9-3-13 0" stroke="#c3935e" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M50 16c-5 10-5 22 0 34" stroke="#94794d" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
        <path d="M50 16c7 10 7 22 0 34" stroke="#94794d" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
        <path d="M49 16v34" stroke="#d8be8a" stroke-width=".8" opacity=".65"/>`,
      flint: `
        <rect width="64" height="64" fill="#3b2527"/>
        <circle cx="52" cy="9" r="23" fill="#c8614f" opacity=".16"/>
        <circle cx="10" cy="57" r="20" fill="#120b0c" opacity=".18"/>
        <path d="M3 64c3-13 13-19 29-19s26 6 29 19" fill="#5f3932"/>
        <path d="M15 50h34v14H15z" fill="#49302b"/>
        <path d="M18 51c4-6 10-8 14-6 4-2 10 0 14 6" fill="#87412f"/>
        <rect x="28" y="35" width="8" height="12" rx="3" fill="#b77e59"/>
        <ellipse cx="32" cy="28" rx="13" ry="14" fill="#d19569"/>
        <path d="M19 30c0 8 5 13 13 13s13-5 13-13c-3 4-7 6-13 6s-10-2-13-6Z" fill="#9d6e4c" opacity=".8"/>
        <path d="M25 27h5m4 0h5" stroke="#5e3025" stroke-width="2" stroke-linecap="round"/>
        <circle cx="27" cy="28" r="1.4" fill="#2a1713"/><circle cx="37" cy="28" r="1.4" fill="#2a1713"/>
        <path d="M30 34q2 1 4 0" stroke="#7e3f30" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M21 26c2-9 7-13 12-13 8 0 12 5 12 13l-24-2v2Z" fill="#d8b287" opacity=".5"/>
        <path d="M16 25c1-8 7-13 16-13s15 5 16 13l-4 3c-3-4-7-6-12-6s-9 2-12 6l-4-3Z" fill="#a84535"/>
        <path d="M18 23c8-4 20-4 28 0" stroke="#d46d53" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M50 23c3-2 5-1 5 2-1 3-4 4-7 2" fill="#a84535"/>
        <path d="M44 17c2-3 5-4 8-3" stroke="#e07b60" stroke-width="2" stroke-linecap="round"/>
        <path d="M39 35c2-3 4-4 6-4" stroke="#814a34" stroke-width="1.2" stroke-linecap="round"/>`,
      wren: `
        <rect width="64" height="64" fill="#293d3a"/>
        <circle cx="51" cy="10" r="23" fill="#a8cfb8" opacity=".15"/>
        <circle cx="9" cy="56" r="20" fill="#091514" opacity=".2"/>
        <path d="M4 64c2-13 13-20 28-20s26 7 28 20" fill="#355b52"/>
        <path d="M17 50h30v14H17z" fill="#447165"/>
        <path d="M22 51c4-4 9-5 15-2 3-1 6 0 8 2" fill="#e7d9bd"/>
        <rect x="28" y="35" width="8" height="12" rx="3" fill="#d2a080"/>
        <ellipse cx="32" cy="29" rx="12.5" ry="13.5" fill="#e3b38b"/>
        <path d="M20 29c0-8 5-13 12-13s12 5 12 13H20Z" fill="#d8c7a7"/>
        <path d="M19 28c1-9 6-14 13-14s12 5 13 14c-4-4-8-6-13-6s-9 2-13 6Z" fill="#efe1c4"/>
        <path d="M27 27h4m2 0h4" stroke="#9a6d55" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="27" cy="28" r="1.3" fill="#34413b"/><circle cx="37" cy="28" r="1.3" fill="#34413b"/>
        <path d="M30 34q2 1.5 4 0" stroke="#b87b63" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M31 14h2v5h-2zM29.5 15.5h5v2h-5z" fill="#5f9d8b"/>
        <path d="M18 39c-2 8 0 12 3 16m25-16c2 8 0 12-3 16" stroke="#b99465" stroke-width="3" stroke-linecap="round"/>
        <path d="M22 55c-2 4-2 7 0 9m20-9c2 4 2 7 0 9" stroke="#b99465" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M19 43c3-2 7-2 10 0" stroke="#d5b78e" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="49" cy="42" r="2" fill="#8bc9a8" opacity=".4"/>`,
      orin: `
        <rect width="64" height="64" fill="#3a2f24"/>
        <circle cx="51" cy="10" r="23" fill="#e08e44" opacity=".18"/>
        <circle cx="9" cy="57" r="20" fill="#120d09" opacity=".18"/>
        <path d="M4 64c2-13 12-20 28-20s26 7 28 20" fill="#5d4c38"/>
        <path d="M15 50h34v14H15z" fill="#474135"/>
        <path d="M18 51c5-5 9-6 14-4 5-2 9-1 14 4" fill="#8e6c3e"/>
        <rect x="28" y="35" width="8" height="12" rx="3" fill="#b47e59"/>
        <ellipse cx="32" cy="29" rx="13" ry="13.5" fill="#d39d73"/>
        <path d="M20 28c0-8 5-13 12-13s12 5 12 13H20Z" fill="#4e3a2d"/>
        <path d="M17 27c1-9 6-14 15-14s14 5 15 14c-3-3-7-5-15-5s-12 2-15 5Z" fill="#d8883f"/>
        <path d="M14 25h36v4H14z" fill="#b76a2e"/>
        <path d="M29 12h6v9h-6z" fill="#e7a759" opacity=".7"/>
        <path d="M22 29c3-2 6-2 9 0m2 0c3-2 6-2 9 0" stroke="#5a3929" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="27" cy="30" r="1.3" fill="#261813"/><circle cx="37" cy="30" r="1.3" fill="#261813"/>
        <path d="M28 34q4 2 8 0" stroke="#804b39" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="25" cy="26" r="5.4" fill="#2d2b25" stroke="#b88f57" stroke-width="1.7"/>
        <circle cx="39" cy="26" r="5.4" fill="#2d2b25" stroke="#b88f57" stroke-width="1.7"/>
        <path d="M30.5 25h3" stroke="#b88f57" stroke-width="1.7"/>
        <circle cx="26" cy="25" r="2.1" fill="#9fd3c4" opacity=".8"/>
        <circle cx="40" cy="25" r="2.1" fill="#9fd3c4" opacity=".8"/>
        <circle cx="46" cy="47" r="6" fill="#2e2923" stroke="#c3914e" stroke-width="1.3"/>
        <path d="M44 41c0-3 4-3 4 0" stroke="#d5b578" stroke-width="1.4"/>
        <path d="M49 43c3-3 5-2 5 1" stroke="#f1b55b" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M19 44c4-2 8-1 11 2" stroke="#a3794d" stroke-width="2.4" stroke-linecap="round"/>`
    };
    return `<svg viewBox="0 0 64 64" role="img" aria-hidden="true">${art[hero.id] || art.pip}</svg>`;
  }

  /* =========================================================
     BATTLE SPRITE ART — full-body characters for the arena
     ========================================================= */

  function heroSpriteSvg(hero) {
    const art = {
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
    return `<svg viewBox="0 0 64 80" aria-hidden="true">${art[hero.id] || art.pip}</svg>`;
  }

  /* =========================================================
     ENEMY ART
     ========================================================= */

  function enemySvg(type) {
    const art = {
      bat: `<path d="M31 25C23 13 12 12 5 22c4 2 4 7 2 11 6-2 11 0 15 6l9-5 9 5c4-6 9-8 15-6-2-4-2-9 2-11-7-10-18-9-26 3Z" fill="#4d2d3a"/><path d="M31 24c1-7 6-11 12-9 5 2 7 8 5 13-3 7-12 11-17 17-5-6-14-10-17-17-2-5 0-11 5-13 6-2 11 2 12 9Z" fill="#62394a"/><circle cx="27" cy="29" r="2.6" fill="#ef7b77"/><circle cx="38" cy="29" r="2.6" fill="#ef7b77"/><path d="M29 37q3 2 6 0" stroke="#d8a08a" stroke-width="1.2" stroke-linecap="round"/><path d="M30 32h4l-2 4-2-4Z" fill="#cf8d84"/><path d="M15 23c4 2 6 5 6 9M49 23c-4 2-6 5-6 9" stroke="#7f4d5b" stroke-width="1.3" stroke-linecap="round"/>`,
      slime: `<path d="M9 47c1-15 8-27 23-33 15 6 22 18 23 33 0 8-7 12-23 12S9 55 9 47Z" fill="#467c51"/><path d="M14 46c2-11 8-20 18-26 10 6 16 15 18 26-8 5-28 5-36 0Z" fill="#6fa963"/><ellipse cx="32" cy="48" rx="20" ry="12" fill="#568b54"/><circle cx="25" cy="41" r="3.7" fill="#e8e4b9"/><circle cx="39" cy="41" r="3.7" fill="#e8e4b9"/><circle cx="25.8" cy="41.7" r="1.8" fill="#223322"/><circle cx="39.8" cy="41.7" r="1.8" fill="#223322"/><path d="M27 50q5 4 10 0" stroke="#253d2a" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="22" cy="30" rx="4" ry="2.6" fill="#a5c977" opacity=".5" transform="rotate(-28 22 30)"/><path d="M46 32c3-5 7-7 10-5 2 2 0 6-4 8" fill="#3f6e48"/>`,
      goblin: `<path d="M20 27C13 15 4 14 5 26c1 7 6 10 12 10m27-9c7-12 16-13 15-1-1 7-6 10-12 10" fill="#6c7d3d"/><path d="M20 27c1-10 6-16 12-16s11 6 12 16c1 12-4 23-12 23S19 39 20 27Z" fill="#8d9a4e"/><path d="M25 25c2-2 4-2 6 0m2 0c2-2 4-2 6 0" stroke="#4b562a" stroke-width="1.4" stroke-linecap="round"/><circle cx="28" cy="27" r="1.8" fill="#f0cf64"/><circle cx="36" cy="27" r="1.8" fill="#f0cf64"/><circle cx="28" cy="27" r=".8" fill="#232713"/><circle cx="36" cy="27" r=".8" fill="#232713"/><path d="M29 34h6l-3 4-3-4Z" fill="#7f8d49"/><path d="M26 43q6 3 12 0" stroke="#475028" stroke-width="1.4" stroke-linecap="round"/><path d="M32 16c4 0 7 3 8 7-3-2-5-2-8 0-3-2-5-2-8 0 1-4 4-7 8-7Z" fill="#5d412b"/><path d="M13 46c-2 5 0 8 4 9l4-5m26-4c2 5 0 8-4 9l-4-5" fill="#6f7c40"/><path d="M24 50v5m16-5v5" stroke="#536029" stroke-width="1.4" stroke-linecap="round"/>`,
      skeleton: `<path d="M20 20c0-10 5-16 12-16s12 6 12 16c0 7-3 11-7 13v3H27v-3c-4-2-7-6-7-13Z" fill="#d7cdb6"/><path d="M25 14c2-2 5-2 7 0m0 0c2-2 5-2 7 0" stroke="#8d836e" stroke-width="1.3" stroke-linecap="round"/><circle cx="28" cy="20" r="3" fill="#342f2a"/><circle cx="36" cy="20" r="3" fill="#342f2a"/><circle cx="28" cy="19.5" r="1.2" fill="#d8b86d"/><circle cx="36" cy="19.5" r="1.2" fill="#d8b86d"/><path d="M29 27h6l-3 4-3-4Z" fill="#a79c84"/><path d="M27 33v7m10-7v7M25 39h14M27 36h10" stroke="#c9bfa8" stroke-width="1.5" stroke-linecap="round"/><path d="M20 38c-5 3-7 7-6 14m30-14c5 3 7 7 6 14" fill="none" stroke="#c9bfa8" stroke-width="3" stroke-linecap="round"/><path d="M18 40c-4 0-6 2-6 5" stroke="#8f8470" stroke-width="1.4"/><path d="M22 8c5-3 12-3 17 0" stroke="#977a48" stroke-width="3" stroke-linecap="round"/><path d="M21 8h22l-3 4H24l-3-4Z" fill="#7e6844"/><circle cx="32" cy="6" r="2.4" fill="#d8b564"/>`,
      spider: `<path d="M32 30 16 17M32 30 13 31M32 30 17 45M32 30 25 52M32 30 39 52M32 30 47 45M32 30 51 31M32 30 48 17" stroke="#513c62" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="34" r="12" fill="#3d2c4d"/><circle cx="32" cy="25" r="7" fill="#5b4470"/><circle cx="29" cy="24" r="1.7" fill="#f1a75f"/><circle cx="35" cy="24" r="1.7" fill="#f1a75f"/><circle cx="32" cy="28" r="1.3" fill="#e58b57"/><circle cx="26" cy="30" r=".9" fill="#baa1cc"/><circle cx="38" cy="30" r=".9" fill="#baa1cc"/><path d="M32 39c-3 2-7 3-10 2 3 4 8 5 10 5s7-1 10-5c-3 1-7 0-10-2Z" fill="#2e203a"/><path d="M23 43c2 2 4 3 7 3m11-3c-2 2-4 3-7 3" stroke="#7f6494" stroke-width="1" stroke-linecap="round"/>`,
      golem: `<path d="M12 30c0-13 8-23 20-23s20 10 20 23v21c0 7-8 11-20 11s-20-4-20-11V30Z" fill="#756451"/><path d="M17 24c2-10 7-14 15-14s13 4 15 14c-6-3-24-3-30 0Z" fill="#8c7b64"/><path d="M10 35c-5-1-7 3-6 8l7 3m33-11c5-1 7 3 6 8l-7 3" fill="#665644"/><path d="M20 30c3-3 7-4 12-4s9 1 12 4v8c-3 4-7 5-12 5s-9-1-12-5v-8Z" fill="#5c4d3d"/><circle cx="26" cy="31" r="2.8" fill="#f1a04f"/><circle cx="38" cy="31" r="2.8" fill="#f1a04f"/><path d="M27 43h10" stroke="#44382c" stroke-width="2.4" stroke-linecap="round"/><path d="M16 50c5 3 11 4 16 4s11-1 16-4M22 58l-2 5m24-5 2 5" stroke="#4e4032" stroke-width="2" stroke-linecap="round"/><path d="m31 22 3-7 3 7m-8 28 2 5m9-5-2 5" stroke="#c18145" stroke-width="1.3" stroke-linecap="round"/><path d="M14 15c2 4 1 7-2 9m40-9c-2 4-1 7 2 9" stroke="#8c7b64" stroke-width="2" stroke-linecap="round"/>`,
      wraith: `<path d="M12 55c2-18 3-33 20-45 17 12 18 27 20 45-7-5-8 4-14 1-3 3-9 2-12-1-6 4-8-5-14 0Z" fill="#2d5d59" opacity=".92"/><path d="M20 34c2-12 6-18 12-23 6 5 10 11 12 23-5-4-7-7-12-11-5 4-7 7-12 11Z" fill="#3d7770"/><path d="M23 45c1-10 4-15 9-19 5 4 8 9 9 19-3-2-5-4-9-7-4 3-5 5-9 7Z" fill="#102b2a"/><circle cx="28" cy="41" r="2.4" fill="#a4e5d3"/><circle cx="36" cy="41" r="2.4" fill="#a4e5d3"/><path d="M30 47q2 2 4 0" stroke="#76b5a8" stroke-width="1.2" stroke-linecap="round"/><path d="M19 30c-4 2-5 6-4 10m30-10c4 2 5 6 4 10" stroke="#447f77" stroke-width="1.4" stroke-linecap="round" opacity=".8"/><circle cx="32" cy="20" r="1.4" fill="#bfe8da" opacity=".8"/><circle cx="23" cy="26" r=".9" fill="#bfe8da" opacity=".5"/>`
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
