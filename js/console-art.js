/* console-art.js — a small picture of each console, drawn to read at chip size:
   the console as you'd recognise it on a shelf or a table. All share one 60×40
   frame and the same light from the top left. The PlayStations and Xboxes are
   traced from pictures of the real consoles: each one the model and the angle
   people know best, with its controller where that helps. The drawings they
   replaced are kept in legacy/console-art.js. */

(function () {
  const svg = body => `<svg class="cart-art" viewBox="0 0 60 40" aria-hidden="true">${body}</svg>`;
  const cross = (x, y, s, c) => `<path d="M${x - s} ${y - s / 3}h${s * 2 / 3}v-${s * 2 / 3}h${s * 2 / 3}v${s * 2 / 3}h${s * 2 / 3}v${s * 2 / 3}h-${s * 2 / 3}v${s * 2 / 3}h-${s * 2 / 3}v-${s * 2 / 3}h-${s * 2 / 3}z" fill="${c}"/>`;
  const shine = (x, y, w, h, r = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" opacity=".14"/>`;
  const f1 = v => +v.toFixed(2);
  // horizontal stripes across a triangle, every `step` units: the vents in the original Xbox's X
  function stripes(pts, from, to, step, w, c) {
    let out = '';
    for (let y = from; y <= to; y += step) {
      const xs = [];
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) xs.push(p[0] + (y - p[1]) / (q[1] - p[1]) * (q[0] - p[0]));
      });
      if (xs.length > 1) out += `<rect x="${f1(Math.min(...xs))}" y="${f1(y - w / 2)}" width="${f1(Math.max(...xs) - Math.min(...xs))}" height="${w}" fill="${c}"/>`;
    }
    return out;
  }
  // the four face buttons round (x, y)
  const face = (x, y, d, r, c) => [[0, -d], [d, 0], [0, d], [-d, 0]].map(([dx, dy], i) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="${Array.isArray(c) ? c[i] : c}"/>`).join('');

  // PlayStation pads, drawn in a 24 × 15 box and placed with a transform
  // the DualShock 3: its long grips, the d-pad as four arrows in a round well, the face buttons with
  // their coloured symbols, the two sticks low in the middle, the PS button between them
  const ds3 = `
    <path d="M3.2 2.2C5 1.2 8 1.2 9.6 1.7H14.4C16 1.2 19 1.2 20.8 2.2C22.6 3.2 23.3 5 23.7 7.5C24.1 10.2 24.2 12.6 23.2 13.8C22.2 14.9 20.6 14.6 19.7 13.4L17.4 10.6C16.6 9.8 15.6 9.6 14.8 10.2C13.4 11 10.6 11 9.2 10.2C8.4 9.6 7.4 9.8 6.6 10.6L4.3 13.4C3.4 14.6 1.8 14.9 .8 13.8C-.2 12.6-.1 10.2 .3 7.5C.7 5 1.4 3.2 3.2 2.2Z" fill="#1b1b1e"/>
    <path d="M3.4 2.6C5.2 1.7 8 1.7 9.6 2.1H14.4C16 1.7 18.8 1.7 20.6 2.6" stroke="#6a6c73" stroke-width=".35" fill="none"/>
    <path d="M1.3 7Q1.8 4 3.6 3" stroke="#fff" stroke-opacity=".18" stroke-width=".5" fill="none"/>
    <circle cx="5" cy="5.6" r="2.6" fill="#101012"/>
    <g fill="#34353a"><path d="M4.4 3.3H5.6V4.6L5 5.2L4.4 4.6Z"/><path d="M4.4 7.9H5.6V6.6L5 6L4.4 6.6Z"/><path d="M2.7 5V6.2H4L4.6 5.6L4 5Z"/><path d="M7.3 5V6.2H6L5.4 5.6L6 5Z"/></g>
    <circle cx="19" cy="5.6" r="2.6" fill="#101012"/>
    ${[[19, 3.9], [20.7, 5.6], [19, 7.3], [17.3, 5.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".82" fill="#2c2d32"/>`).join('')}
    <path d="M18.6 4.25L19 3.5L19.4 4.25Z" fill="none" stroke="#4fc07a" stroke-width=".2"/>
    <circle cx="20.7" cy="5.6" r=".38" fill="none" stroke="#e0565c" stroke-width=".2"/>
    <path d="M18.65 6.95L19.35 7.65M19.35 6.95L18.65 7.65" stroke="#6f8fe0" stroke-width=".2"/>
    <rect x="16.95" y="5.25" width=".7" height=".7" fill="none" stroke="#d98cc6" stroke-width=".2"/>
    <circle cx="8.6" cy="8.5" r="2.15" fill="#0c0c0e"/><circle cx="8.6" cy="8.5" r="1.55" fill="#26272b"/><circle cx="8.6" cy="8.5" r="1.05" fill="#313237"/>
    <circle cx="15.4" cy="8.5" r="2.15" fill="#0c0c0e"/><circle cx="15.4" cy="8.5" r="1.55" fill="#26272b"/><circle cx="15.4" cy="8.5" r="1.05" fill="#313237"/>
    <circle cx="12" cy="7.5" r=".7" fill="#2c2d32" stroke="#45464c" stroke-width=".15"/>
    <rect x="9.9" y="5.3" width="1.4" height=".55" rx=".27" fill="#34353a"/><rect x="12.7" y="5.3" width="1.4" height=".55" rx=".27" fill="#34353a"/>
    <text x="12" y="3.9" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="1" letter-spacing=".1" fill="#7a7c83">SONY</text>`;
  const ds4 = `
    <path d="M3.6 1.4 H20.4 Q23 1.6 23.5 5.2 Q24.4 10.6 22.9 12.7 Q21.2 14.1 19.3 12.4 L16.9 9.9 H7.1 L4.7 12.4 Q2.8 14.1 1.1 12.7 Q-.4 10.6 .5 5.2 Q1 1.6 3.6 1.4 Z" fill="#1c1c1f"/>
    <path d="M3.6 1.8 H20.4" stroke="#47494f" stroke-width=".4"/>
    <rect x="8" y="1.6" width="8" height="4.3" rx=".7" fill="#121214" stroke="#3a3b41" stroke-width=".3"/>
    ${cross(4.3, 5.3, 1.9, '#3a3b41')}
    ${face(19.7, 5.3, 1.55, .72, '#34353b')}
    <circle cx="8.5" cy="8.9" r="1.85" fill="#0e0e10"/><circle cx="8.5" cy="8.9" r="1.2" fill="#323338"/>
    <circle cx="15.5" cy="8.9" r="1.85" fill="#0e0e10"/><circle cx="15.5" cy="8.9" r="1.2" fill="#323338"/>
    <circle cx="12" cy="8.3" r=".5" fill="#3a3b41"/>`;
  const dualsense = `
    <path d="M4 1.6 Q12 .4 20 1.6 Q22.6 2.1 23.3 5.6 Q24.4 11.6 22.8 14 Q21 15.6 19.2 13.6 L16.6 10.6 H7.4 L4.8 13.6 Q3 15.6 1.2 14 Q-.4 11.6 .7 5.6 Q1.4 2.1 4 1.6 Z" fill="#f2f3f5" stroke="#b9bcc3" stroke-width=".3"/>
    <path d="M6.2 5.4 H17.8 L19.1 9.6 Q19.3 11 17.8 11.2 H6.2 Q4.7 11 4.9 9.6 Z" fill="#17181b"/>
    <rect x="7.9" y="1.4" width="8.2" height="4.6" rx=".9" fill="#fbfbfc" stroke="#c4c7cd" stroke-width=".3"/>
    ${cross(4.3, 5.6, 1.8, '#25262a')}
    ${face(19.7, 5.6, 1.5, .62, '#25262a')}
    <circle cx="8.8" cy="9" r="1.75" fill="#f2f3f5"/><circle cx="8.8" cy="9" r="1.2" fill="#25262a"/>
    <circle cx="15.2" cy="9" r="1.75" fill="#f2f3f5"/><circle cx="15.2" cy="9" r="1.2" fill="#25262a"/>
    <rect x="11.2" y="8.5" width="1.6" height=".7" rx=".35" fill="#f2f3f5"/>`;

  window.CONSOLE_ART = {
    // the grey box from the front and above: the round lid between the two raised ends,
    // the reset and power buttons on the left, the eject button on the right, the ports below
    ps1: svg(`
      <path d="M5 3 H55 V35 L53.6 37 H6.4 L5 35 Z" fill="#c9cbd0" stroke="#7d8087" stroke-width=".45"/>
      <path d="M19.3 3.9 H40.7 V35 H19.3 Z" fill="#bfc1c6" stroke="#8a8d94" stroke-width=".35"/>
      <path d="M5 35 H55 L53.6 37 H6.4 Z" fill="#a9acb2" stroke="#7d8087" stroke-width=".35"/>
      <rect x="20.6" y="35.5" width="6.4" height="1.3" fill="#3b3d42"/><rect x="33" y="35.5" width="6.4" height="1.3" fill="#3b3d42"/>
      ${shine(5.4, 3.4, 13.4, 1.6, .5)}${shine(41.2, 3.4, 13.4, 1.6, .5)}
      <circle cx="30" cy="19" r="14.3" fill="#c6c8cd" stroke="#6f7279" stroke-width=".5"/>
      <path d="M18 14 A13.2 13.2 0 0 1 42 14" stroke="#fff" stroke-opacity=".35" stroke-width=".6" fill="none"/>
      <text x="30" y="11.4" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="2.3" letter-spacing=".25" fill="#6c6f75">SONY</text>
      <path d="M29.4 25.3 V21.3 H30.8 Q32.1 21.3 32.1 22.4 Q32.1 23.5 30.8 23.5 H30" stroke="#d8262c" stroke-width=".75" fill="none"/>
      <path d="M27.2 25.1 L29.2 24.4" stroke="#f2c418" stroke-width=".7"/><path d="M29.6 25.4 L31.4 24.8" stroke="#2a8fd6" stroke-width=".7"/><path d="M31.4 24.2 L33.1 24.8" stroke="#47b549" stroke-width=".7"/>
      <circle cx="10.5" cy="22.4" r="1.6" fill="#9a9da3" stroke="#5c5f65" stroke-width=".35"/>
      <circle cx="11.7" cy="29.6" r="3.7" fill="#cfd1d5" stroke="#5c5f65" stroke-width=".4"/>
      <path d="M10.6 28.4 V30.8 M12.4 28.6 A1.3 1.3 0 1 1 11.6 28.4" stroke="#3fbf8f" stroke-width=".45" fill="none"/>
      <rect x="11" y="34" width=".9" height=".9" rx=".2" fill="#57d36e"/>
      <circle cx="48.2" cy="29.4" r="3.7" fill="#cfd1d5" stroke="#5c5f65" stroke-width=".4"/>
      <path d="M47 29.8 L48.2 28.3 L49.4 29.8 Z M47 30.4 H49.4" stroke="#3aaee0" stroke-width=".35" fill="#3aaee0"/>
      <path d="M40.7 26 L45 28" stroke="#6f7279" stroke-width=".35"/>`),

    // the first PS2, standing: its long black side with the PS2 logo, the ridged front
    // with its two buttons, and the stepped back with the blue ports
    ps2: svg(`<g transform="translate(30 0) scale(1.3 1) translate(-30 0)">
      <path d="M21 4.7 L31.3 2 V38.4 L21.1 36.6 Z" fill="#2c2d31"/>
      <path d="M21 4.7 L31.3 2" stroke="#4a4c53" stroke-width=".35"/>
      <path d="M35.9 6 H38.8 V38 H35.9 Z" fill="#1e1f22"/>
      ${Array.from({ length: 14 }, (_, i) => `<rect x="36.4" y="${f1(7.2 + i * 1.75)}" width="1.9" height=".7" fill="#2c2d31"/>`).join('')}
      <rect x="36" y="32.8" width="2.5" height="4.3" fill="#3b8ee8"/>
      <rect x="36.5" y="33.4" width=".9" height=".9" fill="#163a66"/><rect x="36.5" y="35" width=".7" height="1.6" fill="#163a66"/><rect x="37.4" y="35" width=".7" height="1.6" fill="#163a66"/>
      <path d="M31.3 2 L35.9 2.4 V38.3 L31.3 38.4 Z" fill="#121315"/>
      ${[31.8, 32.7, 33.6, 34.5, 35.3].map(x => `<path d="M${x} 2.4 V38.2" stroke="#2a2b30" stroke-width=".3"/>`).join('')}
      <path d="M31.4 13.2 H35.8 M31.4 26.4 H35.8" stroke="#2a2b30" stroke-width=".25"/>
      <circle cx="32.1" cy="4" r=".55" fill="#57c46d"/><circle cx="34.9" cy="4.2" r=".55" fill="#4f7dff"/>
      <circle cx="33.4" cy="12" r=".3" fill="#d8262c"/>
      <path d="M22.5 19.4 V17.1 H24.7 V18.25 H22.7" stroke="#a46cff" stroke-width=".42" fill="none"/>
      <path d="M27.5 17.1 H26.1 V19.4 H24.9" stroke="#8a7cff" stroke-width=".42" fill="none"/>
      <path d="M27.9 17.1 H29.6 V18.25 H28 V19.4 H29.8" stroke="#6d9cff" stroke-width=".42" fill="none"/>
      <rect x="23.6" y="20.2" width="4.6" height=".45" fill="#4a4c53"/></g>`),

    // the PS3 slim at an angle from the front: its curved matte top with the PS3 logo, the front with the
    // disc slot and the glossy strip with its two buttons, and a DualShock 3 in front of it
    ps3: svg(`
      <path d="M58 11 L56.6 15.4 L39.3 32.7 L39.9 28.8 Z" fill="#232326"/>
      <path d="M5.95 18.5 L39.9 28.8 L39.3 32.7 L7 22.6 Z" fill="#17171a"/>
      <path d="M21.8 25 L39.6 30.1" stroke="#050506" stroke-width=".7"/>
      <path d="M22.5 25.9 L39.4 30.9 L39.1 32.6 L22.5 27.8 Z" fill="#b8b9bd"/>
      <path d="M22.5 25.9 L39.4 30.9" stroke="#e8e9ec" stroke-width=".3"/>
      <ellipse cx="29.6" cy="27.9" rx=".8" ry=".45" fill="#f4f4f6"/><ellipse cx="37.6" cy="30.9" rx=".8" ry=".45" fill="#f4f4f6"/>
      <path d="M5.95 18.5 Q13 9 27.6 2.5 Q45 6 58 11 Q50 21 39.9 28.8 Q22 24.5 5.95 18.5 Z" fill="#38383c"/>
      <path d="M8 17.6 Q15 9.6 27.6 3.6 Q40 6.6 48 9.4 Q30 9 8 17.6 Z" fill="#fff" opacity=".05"/>
      <path d="M5.95 18.5 Q13 9 27.6 2.5 Q45 6 58 11" stroke="#5a5b61" stroke-width=".35" fill="none"/>
      <path d="M5.95 18.5 Q22 24.5 39.9 28.8 Q50 21 58 11" stroke="#4a4b50" stroke-width=".3" fill="none"/>
      <g transform="matrix(.5 .15 -.27 .27 35.7 7.5)" stroke="#232326" stroke-width="1.4" fill="none">
        <path d="M14.6 16.05 H19.2 Q20.3 16.05 20.3 17.15 V17.4 Q20.3 18.45 19.2 18.45 H16.1 Q15 18.45 15 19.55 V20.9"/>
        <path d="M26.9 16.05 H24.2 Q23.2 16.05 23.2 17.05 V19.4 Q23.2 20.4 22.2 20.4 H20"/>
        <path d="M27.9 16.05 H32.1 Q33.1 16.05 33.1 17.1 V17.2 Q33.1 18.25 32.1 18.25 H29.8 M32.1 18.25 Q33.1 18.25 33.1 19.3 V19.35 Q33.1 20.4 32.1 20.4 H27.9"/>
      </g>
      <g transform="translate(12.2 28) rotate(18) scale(.8) translate(-12 -7.6)">${ds3}</g>`),

    // the PS4 slim standing up, the groove down its front edge and the PS logo on its side,
    // with a DualShock 4 in front of it
    ps4: svg(`
      <path d="M6 2.9 L11.8 2 V37.7 L6 36.9 Z" fill="#202024"/>
      <path d="M8.9 2.45 L10.6 2.2 V37.55 L8.9 37.3 Z" fill="#050506"/>
      <path d="M11.8 2 L29 3.4 V36.4 L11.8 37.7 Z" fill="#17171a"/>
      <path d="M11.8 2 L29 3.4 L29 9 L11.8 16 Z" fill="#fff" opacity=".045"/>
      <path d="M6 2.9 L11.8 2 L29 3.4" stroke="#3b3c42" stroke-width=".35" fill="none"/>
      <path d="M20 21.8 V17.8 H21.4 Q22.7 17.8 22.7 18.9 Q22.7 20 21.4 20 H20.6" stroke="#2f3036" stroke-width=".7" fill="none"/>
      <path d="M17.6 21.9 Q18.8 21 19.8 21.4 M21 22.2 Q22.6 21.5 24 21.9" stroke="#2f3036" stroke-width=".6" fill="none"/>
      <rect x="7.1" y="5" width=".5" height="3.4" fill="#3b3c42"/><rect x="7.1" y="31" width=".5" height="3" fill="#3b3c42"/>
      <path d="M5.4 38.2 L26.5 37.1 L27.4 37.6 L6.4 38.9 Z" fill="#2a2a2e"/>
      <g transform="translate(30.6 23.6) scale(1.1)">${ds4}</g>`),

    // the PS5 standing up: the white panels either side of the black core, its blue light,
    // and a DualSense in front of it
    ps5: svg(`
      <path d="M40.4 3.6 Q41.4 2.6 42.9 2.5 L42.3 36 L40.9 36.3 Z" fill="#d6d8dd"/>
      <path d="M38.1 4.4 L40.7 3.5 L40.9 36.3 L38.7 36.4 Z" fill="#111215"/>
      <path d="M38.25 5.2 L38.85 36" stroke="#4a8dff" stroke-width=".4"/>
      ${[20, 22.3, 32.3].map(y => `<rect x="39.5" y="${y}" width=".5" height="1.4" rx=".25" fill="#e8e9ec"/>`).join('')}
      <path d="M29.7 9 Q29.7 7.6 30.8 6.9 L37.3 2.5 Q38.1 2 38.1 2.9 L38.7 36.4 L29.4 35.5 Z" fill="#f4f4f6"/>
      <path d="M30.8 6.9 L37.3 2.5" stroke="#fff" stroke-width=".5"/>
      <path d="M38.1 2.9 L38.7 36.4" stroke="#c4c6cc" stroke-width=".35"/>
      <path d="M29.4 35.5 L38.7 36.4 L42.3 36" stroke="#9fa2a9" stroke-width=".4" fill="none"/>
      <g transform="translate(14.8 27.1) scale(.72)">${dualsense}</g>`),

    // the original Xbox from the front and above: the big X across its top, ridged either
    // side, the green jewel, and the front with its tray and four controller ports
    xbox: svg(`
      <path d="M4 20.3 L10 3.2 L25.2 1.7 H33.1 L48.1 3.2 L56 20.3 Z" fill="#0f0f10" stroke="#38393d" stroke-width=".4" stroke-linejoin="round"/>
      ${stripes([[10.2, 4.6], [20.2, 9.4], [5.6, 19.6]], 5.2, 19.2, 1.2, .55, '#3b3c40')}
      ${stripes([[49.8, 4.6], [39.8, 9.4], [54.4, 19.6]], 5.2, 19.2, 1.2, .55, '#3b3c40')}
      <path d="M24.2 20.3 L29.8 15.6 L36.4 20.3" stroke="#2e2f33" stroke-width=".45" fill="none"/>
      <ellipse cx="29.8" cy="9.4" rx="6" ry="4.1" fill="#2c7a1d"/>
      <ellipse cx="29.8" cy="9.2" rx="5.5" ry="3.6" fill="#5cc23a"/>
      <ellipse cx="29.2" cy="8.2" rx="3.8" ry="1.6" fill="#fff" opacity=".22"/>
      <text x="29.8" y="10.2" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="2.5" letter-spacing=".15" fill="#f4f8f0">XBOX</text>
      <path d="M4 20.3 H56 L55.4 35.8 Q55.3 37.3 53.8 37.3 H6.2 Q4.7 37.3 4.6 35.8 Z" fill="#2c2c2f" stroke="#141415" stroke-width=".35"/>
      <rect x="4.2" y="20.3" width="51.6" height="3" fill="#161617"/>
      <path d="M24.2 23.3 L29.8 18.6 L36.4 23.3 Z" fill="#1c1c1e"/><path d="M25.8 23.3 L29.8 19.9 L34.6 23.3" stroke="#3a3b3f" stroke-width=".35" fill="none"/>
      <rect x="24.2" y="23.3" width="12.2" height="14" fill="#232325"/>
      <rect x="24.9" y="24.9" width="5.1" height="2.6" fill="#141415"/><rect x="30.6" y="24.9" width="5.1" height="2.6" fill="#141415"/>
      <ellipse cx="30.3" cy="32" rx="1.3" ry="1.9" fill="#3d3e42"/><path d="M29.7 32.3 L30.3 31.3 L30.9 32.3 Z" fill="#9a9ca1"/>
      <ellipse cx="30.3" cy="35.6" rx=".45" ry=".6" fill="#3d3e42"/>
      <rect x="9.2" y="26" width="14.4" height="2.9" fill="#1a1a1b"/>
      <text x="11.2" y="28.2" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="2" letter-spacing=".12" fill="#d8dadd">XBOX</text>
      <rect x="36.9" y="26" width="17.6" height="2.9" fill="#1a1a1b"/>
      ${[15, 20.8, 38.9, 44.6].map(x => `<circle cx="${x}" cy="31.4" r=".45" fill="#0a0a0b"/><circle cx="${x}" cy="34.6" r="2.1" fill="#0a0a0b"/>`).join('')}`),

    // the Xbox 360 S standing up: glossy black, its curved front with the
    // ring of light, and its side with the silver stripe and the vents
    x360: svg(`
      <path d="M26.4 2.3 L40.9 6 Q41.9 6.3 41.9 7.3 V34.8 Q41.9 35.7 40.9 35.8 L26.4 37.1 Z" fill="#121214"/>
      <path d="M26.9 3.3 L40.3 6.8 Q40.9 12 36.6 14.4 Q31.4 17.1 26.9 18.6 Z" fill="#fff" opacity=".06"/>
      <path d="M40.3 6.8 Q40.9 12 36.6 14.4 Q31.4 17.1 26.9 18.6" stroke="#4a4c52" stroke-width=".35" fill="none"/>
      ${Array.from({ length: 16 }, (_, i) => { const y = 19.6 + i * 1.02, x0 = Math.max(27.9, 26.5 + (25.3 - y) / 0.593); return x0 < 36.6 ? `<rect x="${f1(x0)}" y="${f1(y)}" width="${f1(36.6 - x0)}" height=".42" fill="#2b2c31"/>` : ''; }).join('')}
      <path d="M26.5 25.3 L41 16.7" stroke="#cfd4da" stroke-width=".5"/>
      <path d="M18 3.1 Q20.2 20.4 18.2 37.7 L26.4 37.1 Q24 20.4 26.4 2.3 Z" fill="#0b0b0d"/>
      <path d="M26.4 2.3 Q24 20.4 26.4 37.1" stroke="#2c2d32" stroke-width=".3" fill="none"/>
      <path d="M19.4 4.2 Q21 20.4 19.6 36.4" stroke="#fff" stroke-opacity=".1" stroke-width="1.1" fill="none"/>
      <text transform="translate(22.1 5.4) rotate(90)" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="1.7" letter-spacing=".2" fill="#868b92">XBOX 360</text>
      <circle cx="21.6" cy="25.8" r="1.85" fill="#c8cdd3"/><circle cx="21.6" cy="25.8" r="1.35" fill="#1a1b1d"/>
      <circle cx="21.6" cy="25.8" r=".95" stroke="#9ee35a" stroke-width=".42" fill="none" stroke-dasharray="1.15 .34"/>
      <circle cx="21.6" cy="25.8" r=".32" fill="#9ee35a"/>
      <circle cx="24.4" cy="5.4" r=".3" fill="#868b92"/>`),

    // the Xbox One S: white, the disc slot across its left half, the power button and the
    // pairing button on the right, on its black base with the USB port
    xone: svg(`
      <path d="M6.3 11 H30 V13.3 H3 Z" fill="#f1f1f2"/>
      <path d="M30 11 H53.7 L57 13.3 H30 Z" fill="#d4d5d7"/>
      <rect x="3" y="13.3" width="27" height="4.5" fill="#e2e3e5"/>
      <rect x="4.15" y="17.8" width="25.85" height="2.25" fill="#424245"/>
      <rect x="3" y="20.05" width="27" height="4.45" fill="#e2e3e5"/>
      <rect x="30" y="13.3" width="27" height="11.2" fill="#c2c3c6"/>
      <circle cx="33.35" cy="18.9" r="1.15" fill="#eeeff0"/>
      <circle cx="53.6" cy="18.9" r="1.15" fill="#4a4a4d"/>
      <rect x="4.15" y="24.5" width="51.7" height="4.5" fill="#3e3e41"/>
      <rect x="6.35" y="25.6" width="3.4" height="2.25" fill="#202022"/>
      <circle cx="48" cy="26.75" r="1.15" fill="#646467"/>
      <rect x="50.25" y="25.6" width="3.35" height="2.25" rx="1.1" fill="#202022"/>`),

    // the boxy American SNES with its purple switches
    snes: svg(`
      <rect x="6" y="12" width="48" height="21" rx="3" fill="#cac8d2"/>
      <rect x="6" y="28" width="48" height="5" rx="2.5" fill="#b3b1bd"/>
      <rect x="13" y="13" width="34" height="11" rx="2" fill="#a29fb0"/>
      ${[16, 19, 41, 44].map(x => `<rect x="${x}" y="14" width=".9" height="9" fill="#8f8c9e"/>`).join('')}
      <rect x="21" y="14.6" width="18" height="2.8" rx="1" fill="#4f4d59"/>
      <rect x="14.5" y="19.3" width="5.5" height="2.5" rx="1" fill="#6b4fb4"/><rect x="40" y="19.3" width="5.5" height="2.5" rx="1" fill="#6b4fb4"/>
      <rect x="27" y="19.2" width="6" height="2.8" rx="1" fill="#8a8796"/>
      <rect x="12" y="29.4" width="6" height="2.2" rx="1" fill="#55535e"/><rect x="42" y="29.4" width="6" height="2.2" rx="1" fill="#55535e"/>`),

    // the original grey Game Boy (only used as a case style)
    gb: svg(`
      <rect x="20" y="3" width="20" height="34" rx="2.5" fill="#c7c7c0"/>
      <rect x="22.5" y="6" width="15" height="13" rx="1.4" fill="#5f6068"/>
      <rect x="24.5" y="8" width="11" height="9" fill="#9bbc0f"/>
      ${cross(25, 26, 2.6, '#2b2b30')}
      <circle cx="35.5" cy="24.5" r="1.4" fill="#9b1c4a"/><circle cx="32.5" cy="26.5" r="1.4" fill="#9b1c4a"/>`),

    // purple Game Boy Color
    gbc: svg(`
      <rect x="20" y="3" width="20" height="34" rx="3" fill="#7657c6"/>
      ${shine(20.5, 3.5, 19, 4, 2.5)}
      <rect x="22.5" y="6" width="15" height="13" rx="1.4" fill="#32323b"/>
      <rect x="24.5" y="8" width="11" height="9" fill="#a8cfb7"/>
      ${cross(25, 26, 2.6, '#2a2245')}
      <circle cx="35.5" cy="24.5" r="1.4" fill="#2a2245"/><circle cx="32.5" cy="26.5" r="1.4" fill="#2a2245"/>
      ${[33, 34.6, 36.2].map(x => `<rect x="${x}" y="31" width=".7" height="3.5" rx=".3" fill="#5a3fa6"/>`).join('')}`),

    // indigo Game Boy Advance, held sideways
    gba: svg(`
      <path d="M9 11 Q9 8.5 12 8.5 L48 8.5 Q51 8.5 51 11 L54 26 Q54.5 31.5 49 31.5 L11 31.5 Q5.5 31.5 6 26 Z" fill="#4c45b3"/>
      ${shine(10, 9, 40, 3)}
      <rect x="19.5" y="11" width="21" height="15.5" rx="1.5" fill="#26262f"/>
      <rect x="21.5" y="13" width="17" height="11.5" fill="#a6bccf"/>
      ${cross(12.5, 19.5, 2.6, '#25205e')}
      <circle cx="47" cy="17.5" r="1.6" fill="#25205e"/><circle cx="44" cy="20.5" r="1.6" fill="#25205e"/>`),

    // a DS Lite, open
    ds: svg(`
      <rect x="16" y="2.5" width="28" height="16.5" rx="2" fill="#e9eaee"/>
      <rect x="21.5" y="4.6" width="17" height="12.4" fill="#2a2d36"/>
      <rect x="17" y="19" width="26" height="2" fill="#c3c5cc"/>
      <rect x="16" y="21" width="28" height="16.5" rx="2" fill="#f3f4f7"/>
      <rect x="21.5" y="23.2" width="17" height="12.4" fill="#2a2d36"/>
      ${cross(18.8, 27.5, 1.8, '#4a4d56')}
      <circle cx="41.4" cy="26" r=".8" fill="#4a4d56"/><circle cx="40" cy="27.5" r=".8" fill="#4a4d56"/><circle cx="42.8" cy="27.5" r=".8" fill="#4a4d56"/><circle cx="41.4" cy="29" r=".8" fill="#4a4d56"/>`),

    // a red 3DS, open: the wider top screen and the circle pad
    '3ds': svg(`
      <rect x="14.5" y="2.5" width="31" height="16.5" rx="2" fill="#a91f29"/>
      <rect x="17.5" y="4.6" width="25" height="12.4" fill="#22252d"/>
      <rect x="15.5" y="19" width="29" height="2" fill="#7c151c"/>
      <rect x="14.5" y="21" width="31" height="16.5" rx="2" fill="#c42a33"/>
      ${shine(15, 21.5, 30, 3)}
      <rect x="23" y="23.2" width="14" height="11" fill="#22252d"/>
      <circle cx="18.6" cy="25.6" r="2" fill="#5a5d66"/>${cross(18.6, 31.5, 1.6, '#3b0d11')}
      <circle cx="41.4" cy="26" r=".8" fill="#3b0d11"/><circle cx="40" cy="27.5" r=".8" fill="#3b0d11"/><circle cx="42.8" cy="27.5" r=".8" fill="#3b0d11"/><circle cx="41.4" cy="29" r=".8" fill="#3b0d11"/>`),

    // the slim white Wii on its stand, and its remote
    wii: svg(`
      <rect x="17" y="3.5" width="10" height="30.5" rx="1.6" fill="#f4f5f7" stroke="#c8ccd2" stroke-width=".7"/>
      <rect x="21.4" y="7" width="1.3" height="20" rx=".6" fill="#7fd0ff"/>
      <rect x="14" y="34" width="16" height="2.6" rx="1.3" fill="#d6d9de"/>
      <rect x="35" y="8" width="6.4" height="26" rx="2" fill="#f4f5f7" stroke="#c8ccd2" stroke-width=".7"/>
      ${cross(38.2, 12.2, 1.6, '#aab0b8')}
      <circle cx="38.2" cy="17.5" r="1.1" fill="#c8ccd2"/><circle cx="38.2" cy="27" r=".7" fill="#7fd0ff"/>`),

    // the Wii U GamePad
    wiiu: svg(`
      <path d="M4.5 12 Q4.5 8.5 8.5 8.5 L51.5 8.5 Q55.5 8.5 55.5 12 L55.5 28.5 Q55.5 32 51.5 32 L8.5 32 Q4.5 32 4.5 28.5 Z" fill="#1c1d21"/>
      ${shine(5, 9, 50, 3)}
      <rect x="17" y="11.5" width="26" height="17" rx="1" fill="#2f5f86"/>
      <circle cx="10.5" cy="14.8" r="2.7" fill="#3a3b41" stroke="#55565d" stroke-width=".6"/><circle cx="49.5" cy="14.8" r="2.7" fill="#3a3b41" stroke="#55565d" stroke-width=".6"/>
      ${cross(10.5, 24, 2.2, '#4a4b52')}
      <circle cx="49.5" cy="22.5" r=".9" fill="#55565d"/><circle cx="48" cy="24" r=".9" fill="#55565d"/><circle cx="51" cy="24" r=".9" fill="#55565d"/><circle cx="49.5" cy="25.5" r=".9" fill="#55565d"/>`),

    // neon blue and red Joy-Con either side of the screen
    switch: svg(`
      <path d="M14 9.5 L10.5 9.5 Q5.5 9.5 5.5 15 L5.5 26 Q5.5 31.5 10.5 31.5 L14 31.5 Z" fill="#00b4e0"/>
      <path d="M46 9.5 L49.5 9.5 Q54.5 9.5 54.5 15 L54.5 26 Q54.5 31.5 49.5 31.5 L46 31.5 Z" fill="#ff4f4f"/>
      <rect x="14" y="9.5" width="32" height="22" fill="#26272c"/>
      <rect x="16" y="11.5" width="28" height="18" fill="#3c4556"/>
      <circle cx="9.8" cy="15.5" r="1.9" fill="#1e3640"/><circle cx="50.2" cy="25" r="1.9" fill="#4a1d1d"/>
      ${cross(9.8, 24.5, 1.7, '#14313b')}
      <circle cx="50.2" cy="14" r=".7" fill="#4a1d1d"/><circle cx="49" cy="15.3" r=".7" fill="#4a1d1d"/><circle cx="51.4" cy="15.3" r=".7" fill="#4a1d1d"/><circle cx="50.2" cy="16.6" r=".7" fill="#4a1d1d"/>`),

    // the bigger Switch 2: dark Joy-Con with blue and red on their inner edges
    switch2: svg(`
      <path d="M13 8.5 L9.5 8.5 Q4.5 8.5 4.5 14 L4.5 27 Q4.5 32.5 9.5 32.5 L13 32.5 Z" fill="#26272b"/>
      <path d="M47 8.5 L50.5 8.5 Q55.5 8.5 55.5 14 L55.5 27 Q55.5 32.5 50.5 32.5 L47 32.5 Z" fill="#26272b"/>
      <rect x="12.2" y="9.5" width=".9" height="22" fill="#1fa8e0"/><rect x="46.9" y="9.5" width=".9" height="22" fill="#ff3c3c"/>
      <rect x="13" y="8.5" width="34" height="24" fill="#18191c"/>
      <rect x="15" y="10.5" width="30" height="20" fill="#2f3848"/>
      <circle cx="8.8" cy="15" r="2" fill="#3c3d43"/><circle cx="51.2" cy="26" r="2" fill="#3c3d43"/>
      ${cross(8.8, 25, 1.7, '#45464c')}
      <circle cx="51.2" cy="14" r=".7" fill="#55565d"/><circle cx="50" cy="15.3" r=".7" fill="#55565d"/><circle cx="52.4" cy="15.3" r=".7" fill="#55565d"/><circle cx="51.2" cy="16.6" r=".7" fill="#55565d"/>`),

    // a monitor
    pc: svg(`
      <rect x="11" y="5" width="38" height="24" rx="1.6" fill="#1f2228"/>
      <rect x="13" y="7" width="34" height="20" fill="#2f6aa8"/>
      <path d="M13 7 L30 7 L13 20 Z" fill="#fff" opacity=".12"/>
      <path d="M27 29 L33 29 L35 34.5 L25 34.5 Z" fill="#2b2e35"/>
      <rect x="21" y="34.5" width="18" height="2" rx="1" fill="#1f2228"/>`),
  };
})();
