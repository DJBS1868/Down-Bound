(() => {
  'use strict';

  function surfaceArt() {
    return `
    <svg class="surface-art" viewBox="0 0 800 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="surfaceSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d98d6d"/>
          <stop offset=".32" stop-color="#c47f76"/>
          <stop offset=".64" stop-color="#6a5d7b"/>
          <stop offset="1" stop-color="#2c3a4d"/>
        </linearGradient>
        <radialGradient id="surfaceSun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#ffeac1" stop-opacity=".86"/>
          <stop offset=".3" stop-color="#ffd491" stop-opacity=".34"/>
          <stop offset="1" stop-color="#ffc27d" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="surfaceLamp" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#ffd88b" stop-opacity=".6"/>
          <stop offset=".35" stop-color="#ffb34f" stop-opacity=".22"/>
          <stop offset="1" stop-color="#ff9d3e" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="surfaceFog" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#eee0c2" stop-opacity="0"/>
          <stop offset=".45" stop-color="#eee0c2" stop-opacity=".1"/>
          <stop offset="1" stop-color="#eee0c2" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#surfaceSky)"/>
      <circle cx="622" cy="94" r="160" fill="url(#surfaceSun)"/>
      <circle cx="622" cy="94" r="39" fill="#ffe2b2" opacity=".92"/>
      <g fill="#fff4dd" opacity=".55">
        <circle cx="76" cy="48" r="1.2"/><circle cx="134" cy="76" r=".8"/>
        <circle cx="205" cy="43" r="1"/><circle cx="285" cy="91" r=".7"/>
        <circle cx="358" cy="55" r="1.1"/><circle cx="468" cy="39" r=".8"/>
        <circle cx="520" cy="120" r=".7"/><circle cx="732" cy="150" r=".8"/>
      </g>
      <g fill="#ffd9ac" opacity=".2">
        <ellipse cx="120" cy="135" rx="94" ry="12"/>
        <ellipse cx="475" cy="109" rx="108" ry="10"/>
        <ellipse cx="680" cy="180" rx="84" ry="8"/>
      </g>
      <path d="M0 251 72 203l52 25 78-75 55 59 49-30 60 68 62-44 74 57 69-70 58 59 59-32 65 44 29-17v158H0Z" fill="#62637b" opacity=".68"/>
      <path d="M0 289 87 238l58 35 69-62 62 45 57-47 74 66 66-51 71 55 64-53 55 39 63-27 74 57v81H0Z" fill="#424e65"/>
      <path d="M0 322 76 276l55 29 76-48 51 37 65-26 51 45 63-34 67 39 62-29 55 38 62-31 67 39v42H0Z" fill="#2f3d4d"/>
      <path d="M0 352c72-28 128-18 190 4 75 26 128 14 190-8 81-29 135-16 203 8 67 24 126 22 217-8v58H0Z" fill="#22312f"/>
      <ellipse cx="392" cy="335" rx="280" ry="36" fill="url(#surfaceFog)" opacity=".36"/>

      <!-- Mine camp -->
      <g transform="translate(582 168)">
        <path d="M-68 90c2-46 28-76 74-88 51-13 101 9 118 52 7 18 8 36 6 55l-198-19Z" fill="#273537"/>
        <path d="M-34 84c1-31 21-57 54-65 35-9 68 7 81 37 5 11 7 23 5 35L-34 84Z" fill="#1b292c"/>
        <path d="M21 73c1-21 15-35 33-35 20 0 34 16 33 38-1 8-3 15-4 22H24c-1-8-3-16-3-25Z" fill="#0d1317"/>
        <path d="M36 99V72c0-11 8-20 19-20s19 9 19 20v27H36Z" fill="#070b0e"/>
        <path d="M52 63v-8m19 8v-8M54 69l-5-5m24 5 5-5M55 78l-6 1m22-1 6 1" stroke="#8d704b" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>
        <path d="M12 102V75l11-8 10 8v27" fill="#322b2b"/>
        <path d="M12 75 23 67l10 8" stroke="#5e4b3b" stroke-width="1.5" fill="none"/>
        <rect x="20" y="82" width="4" height="5" fill="#e8b05d"/>
        <path d="M-7 103h81" stroke="#1b1c1e" stroke-width="3" stroke-linecap="round"/>
        <g stroke="#1a1c1e" stroke-width="3" fill="none">
          <path d="M42 101V42m0 0L13 97m0 0 58 0M42 42l30 55"/>
          <path d="M42 62 24 97m18-35 19 35"/>
        </g>
        <circle cx="42" cy="42" r="13" fill="none" stroke="#1a1c1e" stroke-width="3"/>
        <circle cx="42" cy="42" r="4" fill="#1a1c1e"/>
        <g stroke="#1a1c1e" stroke-width="1.6">
          <path d="M42 29v26M29 42h26M33 33l18 18M51 33 33 51"/>
        </g>
        <path d="M83 79c1-16 12-25 25-25s24 9 25 25v20H83V79Z" fill="#2b2c2d"/>
        <path d="M83 79c1-16 12-25 25-25s24 9 25 25" fill="#343433"/>
        <path d="M88 101V79c0-11 9-20 20-20 12 0 20 9 20 20v22" fill="#202325"/>
        <rect x="100" y="84" width="6" height="7" fill="#e6ad55"/>
        <rect x="113" y="84" width="5" height="7" fill="#d99143"/>
        <path d="M108 70v-7m0 0h10m-10 0h-7" stroke="#383533" stroke-width="2" stroke-linecap="round"/>
        <path d="M-47 103h54" stroke="#181c1d" stroke-width="3" stroke-linecap="round"/>
        <rect x="-27" y="84" width="3" height="20" fill="#171b1c"/>
        <rect x="-3" y="84" width="3" height="20" fill="#171b1c"/>
        <circle cx="-26" cy="86" r="7" fill="url(#surfaceLamp)"/>
        <circle cx="-26" cy="86" r="2.5" fill="#ffd383"/>
        <circle cx="82" cy="74" r="2" fill="#ffd383"/>
        <circle cx="82" cy="74" r="11" fill="url(#surfaceLamp)" opacity=".8"/>
      </g>

      <!-- Pines -->
      <g fill="#172522" opacity=".94">
        <path d="M90 333l13-38 11 25 8-20 13 33Zm25-30 8-27 7 19 7-14 9 22Z"/>
        <path d="M143 343l9-27 8 17 6-13 9 23Zm18-22 6-19 5 12 5-10 7 17Z"/>
        <path d="M725 340l10-31 9 20 7-16 12 27Zm19-25 7-22 5 14 6-11 8 19Z"/>
      </g>
      <path d="M0 420V355c58-16 110-6 156 12 57 23 105 23 171 6 76-19 127-16 191 6 66 23 132 25 282-8v49Z" fill="#192726"/>
      <path d="M0 420V382c48-16 95-3 139 10 64 19 120 14 189-6 84-24 139-18 205 0 72 20 137 19 267-9v43Z" fill="#111c1b"/>

      <!-- Rails toward the foreground -->
      <g opacity=".85">
        <path d="M497 420 632 293" stroke="#6b5540" stroke-width="3"/>
        <path d="M513 420 641 301" stroke="#6b5540" stroke-width="3"/>
        <path d="M518 414 637 309M530 405 629 316M544 395 621 325M559 384 612 337M576 373 601 352" stroke="#3c302a" stroke-width="7"/>
      </g>
      <g fill="#ffd483" opacity=".75">
        <circle cx="523" cy="319" r="1.5"/><circle cx="558" cy="347" r="1.2"/>
        <circle cx="731" cy="326" r="1.3"/>
      </g>
      <g stroke="#242c2a" stroke-width="1.5" fill="none" opacity=".5">
        <path d="M194 112c4-4 8-4 12 0m11-7c3-3 6-3 9 0"/>
      </g>
    </svg>`;
  }

  function caveArt() {
    return `
    <svg class="cave-art" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="caveDeep" cx=".5" cy=".48" r=".62">
          <stop offset="0" stop-color="#24443f" stop-opacity=".65"/>
          <stop offset=".5" stop-color="#142826" stop-opacity=".25"/>
          <stop offset="1" stop-color="#071011" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="caveShaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6c477" stop-opacity=".38"/>
          <stop offset=".65" stop-color="#c9b07a" stop-opacity=".04"/>
          <stop offset="1" stop-color="#9b9873" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="caveFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a2a27"/>
          <stop offset="1" stop-color="#091011"/>
        </linearGradient>
        <radialGradient id="crystalGlow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#86d4c1" stop-opacity=".52"/>
          <stop offset=".45" stop-color="#5eaa9c" stop-opacity=".15"/>
          <stop offset="1" stop-color="#5eaa9c" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="lampGlow2" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#ffd083" stop-opacity=".52"/>
          <stop offset=".4" stop-color="#db8c42" stop-opacity=".15"/>
          <stop offset="1" stop-color="#db8c42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="500" height="700" fill="#0b1416"/>
      <path d="M0 0h500v700H0z" fill="url(#caveDeep)"/>
      <path d="M214 0h72l61 273-37 103H187l-40-102Z" fill="url(#caveShaft)"/>
      <path d="M0 0h117c-13 74-11 151 4 233 12 69 5 135-21 198-30 72-28 143 9 214l-109 55Z" fill="#121d1e"/>
      <path d="M500 0h-94c8 74 7 143-7 210-13 62-8 117 16 169 34 73 37 155 8 249l77 72Z" fill="#0e1819"/>
      <path d="M0 0h500v70l-34 27-37-44-39 35-31-26-45 39-35-48-44 34-32-27-43 34-43-39-36 44-37-35-33 32-28-25Z" fill="#070d0e"/>
      <g fill="#0e191a">
        <path d="M69 0h19l-8 76-9 18-11-37Z"/>
        <path d="M124 0h13l-4 52-7 16-6-21Z"/>
        <path d="M308 0h11l3 42 8 19-12 2-10-25Z"/>
        <path d="M360 0h22l-4 68-12 25-10-34Z"/>
        <path d="M452 0h15l-2 44-7 15-9-22Z"/>
      </g>
      <g fill="#142321" stroke="#2a3f39" stroke-width="1.2">
        <path d="M0 432 52 409l32 18 36-11 27 21 22-4v86l-34-24-36 13-44-20-55 16Z"/>
        <path d="M500 425 448 403l-33 17-36-15-26 20-18-3v89l29-25 38 8 42-18 56 14Z"/>
      </g>
      <g opacity=".8">
        <path d="M48 159h24v137H48z" fill="#3d3227"/>
        <path d="M43 168h34v10H43z" fill="#5e4931"/>
        <path d="M54 162v130" stroke="#645139" stroke-width="1"/>
        <path d="M61 309c-9 26-8 44 1 58m-1-58c9 26 8 44-1 58" stroke="#2e2a22" stroke-width="2" fill="none"/>
      </g>
      <ellipse cx="129" cy="584" rx="91" ry="52" fill="url(#crystalGlow)"/>
      <g fill="#5fa795" opacity=".68">
        <path d="m91 572 9-46 12 46 7 18-30 1Z"/>
        <path d="m112 578 5-28 9 29 4 14-18 1Z"/>
        <path d="m69 583 8-31 10 30 5 13-23 1Z"/>
      </g>
      <g fill="#85c8b8" opacity=".5">
        <path d="m97 560 5-22 6 23-6 14Z"/>
        <path d="m75 570 5-17 6 18-5 11Z"/>
      </g>
      <circle cx="359" cy="600" r="102" fill="url(#crystalGlow)" opacity=".52"/>
      <g fill="#735f9c" opacity=".6">
        <path d="m376 586 6-54 16 55 6 19-29 1Z"/>
        <path d="m401 599 5-34 10 34 4 11-20 1Z"/>
        <path d="m352 602 7-30 8 31 3 10-18 1Z"/>
      </g>
      <g fill="#a488cc" opacity=".45">
        <path d="m382 572 4-25 7 25-7 15Z"/>
        <path d="m358 590 3-19 5 20-4 9Z"/>
      </g>
      <g opacity=".85">
        <path d="M356 256c8-7 17-7 25 0-5 2-9 2-13 5-4-3-8-3-12-5Z" fill="#522e32"/>
        <circle cx="364" cy="258" r="1.4" fill="#ffb36f" opacity=".8"/>
        <circle cx="373" cy="258" r="1.4" fill="#ffb36f" opacity=".8"/>
        <path d="M402 291c6-5 12-5 18 0-4 1-6 2-9 4-3-2-5-3-9-4Z" fill="#522e32" opacity=".7"/>
        <circle cx="408" cy="293" r="1" fill="#ffb36f" opacity=".55"/>
        <circle cx="414" cy="293" r="1" fill="#ffb36f" opacity=".55"/>
      </g>
      <g transform="translate(41 344)">
        <path d="M0 31h84" stroke="#1a1817" stroke-width="4"/>
        <path d="M10 27V7h19v20M47 27V11h23v16" fill="#2a2822"/>
        <path d="M10 7 19 0l10 7M47 11l11-8 10 8" fill="#3e382c"/>
        <rect x="15" y="14" width="7" height="8" fill="#e9b25e"/>
        <rect x="52" y="16" width="6" height="7" fill="#d99b4a"/>
        <circle cx="66" cy="36" r="17" fill="url(#lampGlow2)"/>
        <circle cx="66" cy="36" r="3" fill="#ffd380"/>
        <path d="M66 20v-7" stroke="#2f2a22" stroke-width="1.5"/>
      </g>
      <path d="M0 545c65-17 115 6 167 15 49 8 86-9 129-10 51-1 101 21 204 10v140H0Z" fill="url(#caveFloor)"/>
      <path d="M0 566c63-16 111 9 167 15 57 6 88-9 132-9 57 0 107 18 201 8v25c-88 13-152-4-204-6-50-1-80 12-132 8-54-4-105-25-164-12Z" fill="#22342f" opacity=".55"/>
      <g opacity=".55">
        <path d="M23 650c83-20 179-15 261 4 59 14 125 18 216 4v42H0v-31c9-8 15-13 23-19Z" fill="#071011"/>
        <path d="M0 700 500 611v89Z" fill="#050b0c"/>
      </g>
      <g stroke="#645038" stroke-width="2" opacity=".55">
        <path d="M133 700 183 613m79 87 27-67"/>
        <path d="M141 686 250 668m-93 3 101-15M336 687l64-13" stroke="#46392b" stroke-width="3"/>
        <path d="M136 690 258 668m46 20 97-18" stroke="#8c6b45" stroke-width="1"/>
      </g>
      <g fill="#6b8c68" opacity=".4">
        <path d="M400 560c-1-9 4-16 12-19 2 8 0 15-4 21l8-7c1 6-2 12-9 15-5 2-9 0-12-2 4-1 5-4 5-8Z"/>
        <path d="M425 571c0-6 3-10 8-12 1 5-1 9-4 12l6-3c0 4-3 7-7 8-3 0-5-1-7-2 2-1 4-2 4-3Z"/>
      </g>
      <g fill="#3d5e56" opacity=".45">
        <circle cx="81" cy="369" r="2"/><circle cx="86" cy="361" r="1.2"/>
        <circle cx="90" cy="373" r="1.5"/><circle cx="76" cy="360" r="1"/>
      </g>
    </svg>`;
  }

  function battleArt() {
    return `
    <svg class="battle-art" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="battleGlow" cx=".52" cy=".48" r=".58">
          <stop offset="0" stop-color="#325b50" stop-opacity=".42"/>
          <stop offset=".48" stop-color="#172a27" stop-opacity=".16"/>
          <stop offset="1" stop-color="#060b0c" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="battleFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1b2b26"/>
          <stop offset="1" stop-color="#080d0e"/>
        </linearGradient>
        <radialGradient id="battleCrystal" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#92e0ca" stop-opacity=".47"/>
          <stop offset=".45" stop-color="#4e8c80" stop-opacity=".12"/>
          <stop offset="1" stop-color="#4e8c80" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="battleWarm" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#f6c06a" stop-opacity=".36"/>
          <stop offset=".5" stop-color="#b8763a" stop-opacity=".1"/>
          <stop offset="1" stop-color="#b8763a" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="battleBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#b9d4c4" stop-opacity=".11"/>
          <stop offset="1" stop-color="#b9d4c4" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="500" height="700" fill="#080e10"/>
      <rect width="500" height="700" fill="url(#battleGlow)"/>
      <path d="M0 0h500v88l-41 42-35-51-44 46-38-34-48 56-37-43-53 47-41-39-47 42-33-31-38 42-44-49Z" fill="#050a0b"/>
      <path d="M0 0h104c-12 66-7 128 14 186 20 54 20 105 3 153-21 59-24 115-6 166 11 31 12 63 2 98L0 613Z" fill="#101a1b"/>
      <path d="M500 0H394c11 70 5 132-16 189-18 49-17 98 2 145 23 56 27 118 10 178-7 27-9 53-4 79l114 22Z" fill="#0c1516"/>
      <path d="M240 0h20l113 388H132Z" fill="url(#battleBeam)" opacity=".45"/>
      <g fill="#273c35" opacity=".55">
        <path d="m53 175 12-44 10 49 7 28-31-1Z"/>
        <path d="m421 212 9-36 12 43 4 22-28-2Z"/>
        <path d="M46 390c-3-28 6-49 22-58 9 11 12 30 5 49 8-9 17-12 26-8-6 17-19 25-35 25-8 0-14-3-18-8Z"/>
      </g>
      <circle cx="90" cy="384" r="78" fill="url(#battleCrystal)" opacity=".7"/>
      <g fill="#5da795" opacity=".48">
        <path d="m71 383 6-45 12 44 6 17-25 1Z"/>
        <path d="m91 389 5-27 8 28 3 12-16 1Z"/>
      </g>
      <circle cx="431" cy="145" r="66" fill="url(#battleWarm)" opacity=".8"/>
      <g opacity=".8">
        <circle cx="431" cy="145" r="3" fill="#f5c06c"/>
        <path d="M414 127c8-8 23-8 31 0M408 116l-8-9m51 9 8-9" stroke="#584936" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
      <path d="M0 480c55-19 101-15 147-2 47 13 86 18 139 4 60-16 120-17 214 2v216H0Z" fill="url(#battleFloor)"/>
      <path d="M0 510c59-17 102-11 148 1 48 13 92 16 142 3 62-16 125-12 210 4v32c-94-14-153-16-209-3-52 13-96 11-145-3-46-13-91-20-146-3Z" fill="#223530" opacity=".54"/>
      <g opacity=".38">
        <path d="M107 700 168 574m-3 117 31-78" stroke="#5b4935" stroke-width="3"/>
        <path d="M330 700 287 582m93 113-32-76" stroke="#5b4935" stroke-width="2.5"/>
        <path d="M158 596h45m-58 20h42m-55 18h35" stroke="#3b3228" stroke-width="3"/>
      </g>
      <g fill="#1a2b26" opacity=".75">
        <path d="M0 700v-74l56-25 51 17 45-22 71 26 37-8 56 24 55-19 58 25v56Z"/>
      </g>
      <g fill="#72bfae" opacity=".28">
        <circle cx="91" cy="382" r="1.5"/><circle cx="118" cy="366" r="1"/>
        <circle cx="104" cy="342" r="1.2"/><circle cx="437" cy="144" r="1.4"/>
      </g>
    </svg>`;
  }

  function chestSvg() {
    return `
    <svg class="chest-svg" viewBox="0 0 240 200" aria-hidden="true">
      <defs>
        <linearGradient id="chestWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a56b39"/>
          <stop offset=".5" stop-color="#7a4c2b"/>
          <stop offset="1" stop-color="#4a2d1f"/>
        </linearGradient>
        <linearGradient id="chestLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#b87c43"/>
          <stop offset=".6" stop-color="#8d572f"/>
          <stop offset="1" stop-color="#5b3825"/>
        </linearGradient>
        <linearGradient id="chestMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f2ce80"/>
          <stop offset=".5" stop-color="#c98f3d"/>
          <stop offset="1" stop-color="#88541e"/>
        </linearGradient>
        <linearGradient id="chestInside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffda7a"/>
          <stop offset=".45" stop-color="#b9742e"/>
          <stop offset="1" stop-color="#4c2917"/>
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="183" rx="78" ry="11" fill="#000" opacity=".32"/>
      <rect x="49" y="89" width="142" height="18" rx="5" fill="#2b1712"/>
      <rect x="54" y="92" width="132" height="9" rx="3" fill="url(#chestInside)"/>
      <g class="chest-body">
        <rect x="43" y="102" width="154" height="68" rx="9" fill="url(#chestWood)" stroke="#3f271c" stroke-width="2"/>
        <path d="M43 120h154M43 150h154" stroke="#4b2c1d" stroke-width="2" opacity=".65"/>
        <rect x="56" y="102" width="15" height="68" fill="url(#chestMetal)" opacity=".82"/>
        <rect x="169" y="102" width="15" height="68" fill="url(#chestMetal)" opacity=".82"/>
        <rect x="56" y="102" width="15" height="68" fill="#ffdb8c" opacity=".1"/>
        <rect x="94" y="99" width="52" height="41" rx="7" fill="url(#chestMetal)" stroke="#6f441a" stroke-width="1.5"/>
        <rect x="101" y="106" width="38" height="27" rx="4" fill="#3b2515"/>
        <circle cx="120" cy="117" r="6" fill="#eec36b"/>
        <path d="M118 120v8h4v-8" fill="#6c4218"/>
        <g fill="#684018" opacity=".7">
          <circle cx="65" cy="111" r="1.5"/><circle cx="65" cy="133" r="1.5"/><circle cx="65" cy="159" r="1.5"/>
          <circle cx="176" cy="111" r="1.5"/><circle cx="176" cy="133" r="1.5"/><circle cx="176" cy="159" r="1.5"/>
        </g>
      </g>
      <g class="lid">
        <path d="M39 101c0-35 18-53 81-53s81 18 81 53H39Z" fill="url(#chestLid)" stroke="#3f271c" stroke-width="2"/>
        <path d="M58 94c3-24 17-36 62-36s59 12 62 36" fill="none" stroke="#c28a4d" stroke-width="2" opacity=".4"/>
        <rect x="56" y="43" width="15" height="58" rx="3" fill="url(#chestMetal)" opacity=".88"/>
        <rect x="169" y="43" width="15" height="58" rx="3" fill="url(#chestMetal)" opacity=".88"/>
        <path d="M39 95h162v8H39z" fill="#53321f" opacity=".75"/>
        <rect x="94" y="54" width="52" height="29" rx="6" fill="url(#chestMetal)" stroke="#6f441a" stroke-width="1.5"/>
        <rect x="102" y="61" width="36" height="16" rx="3" fill="#3b2515" opacity=".72"/>
        <path d="M63 54c15-16 36-23 57-23s42 7 57 23" fill="none" stroke="#e0b267" stroke-width="1.5" opacity=".25"/>
        <g fill="#684018" opacity=".75">
          <circle cx="63" cy="53" r="1.5"/><circle cx="177" cy="53" r="1.5"/>
          <circle cx="63" cy="78" r="1.5"/><circle cx="177" cy="78" r="1.5"/>
        </g>
      </g>
    </svg>`;
  }

  function shopChestSvg() {
    return `
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <ellipse cx="40" cy="67" rx="27" ry="4" fill="#000" opacity=".25"/>
      <rect x="20" y="36" width="40" height="27" rx="4" fill="#754829" stroke="#3e271c" stroke-width="1.4"/>
      <path d="M17 36c0-15 8-22 23-22s23 7 23 22H17Z" fill="#95603a" stroke="#3e271c" stroke-width="1.4"/>
      <rect x="24" y="20" width="5" height="43" fill="#d3a14e" opacity=".75"/>
      <rect x="51" y="20" width="5" height="43" fill="#d3a14e" opacity=".75"/>
      <rect x="34" y="28" width="12" height="14" rx="2" fill="#e1b05f" stroke="#71441a"/>
      <circle cx="40" cy="34" r="2" fill="#5a3415"/>
      <path d="M39 36v3h2v-3" fill="#5a3415"/>
      <circle cx="28" cy="28" r="11" fill="#ffcf6e" opacity=".15"/>
    </svg>`;
  }

  function miniChestSvg() { return shopChestSvg(); }

  window.DB_ART = {
    surfaceArt, caveArt, battleArt, chestSvg, shopChestSvg, miniChestSvg
  };
})();
