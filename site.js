(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal and line drawing ---------- */

  function prepDraw(root) {
    var i = 0;
    root.querySelectorAll('.hz path.tl').forEach(function (p) { p.classList.add('beam'); });
    root.querySelectorAll('.art path.n').forEach(function (p) {
      if (p.classList.contains('d') || p.classList.contains('beam') || p.closest('.ph')) return;
      var len = p.getTotalLength();
      if (!len) return;
      p.classList.add('ln');
      p.style.setProperty('--len', (len + 1).toFixed(1));
      p.style.setProperty('--i', Math.min(i++, 80));
    });
  }

  document.querySelectorAll('.draw').forEach(prepDraw);

  var targets = document.querySelectorAll('.rv, .draw');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var once = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        once.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { once.observe(el); });

    var seq = document.querySelector('.seq');
    if (seq) {
      new IntersectionObserver(function (entries) {
        seq.classList.toggle('run', entries[0].isIntersecting);
      }).observe(seq);
    }
  }

  /* ---------- Device model ---------- */

  var stage = document.getElementById('stage');
  if (!stage) return;
  var svg = stage.querySelector('svg');
  var VW = 800, VH = 560, PERSP = 1400;

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // Axis-aligned box, optionally turned about its own vertical centre line.
  function box(x0, y0, z0, x1, y1, z1, turn) {
    var P = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    var faces = [
      { v: [0, 3, 2, 1], n: [0, 0, -1] }, { v: [4, 5, 6, 7], n: [0, 0, 1] },
      { v: [0, 1, 5, 4], n: [0, -1, 0] }, { v: [2, 3, 7, 6], n: [0, 1, 0] },
      { v: [1, 2, 6, 5], n: [1, 0, 0] }, { v: [3, 0, 4, 7], n: [-1, 0, 0] }
    ];
    var rot = function (p) { return p; };
    if (turn) {
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, c = Math.cos(turn), s = Math.sin(turn);
      rot = function (p, isNormal) {
        var x = isNormal ? p[0] : p[0] - cx, y = isNormal ? p[1] : p[1] - cy;
        var r = [x * c - y * s, x * s + y * c, p[2]];
        return isNormal ? r : [r[0] + cx, r[1] + cy, r[2]];
      };
    }
    return faces.map(function (f) {
      return { v: f.v.map(function (k) { return rot(P[k]); }), n: rot(f.n, true) };
    });
  }

  // Cylinder from base centre c along an axis.
  function cyl(c, axis, r, len, sides) {
    sides = sides || 16;
    var W = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[axis];
    var U = axis === 'z' ? [1, 0, 0] : [0, 0, 1];
    var V = cross(W, U);
    var top = add(c, mul(W, len));
    var ring0 = [], ring1 = [];
    for (var k = 0; k < sides; k++) {
      var a = k / sides * Math.PI * 2;
      var off = add(mul(U, r * Math.cos(a)), mul(V, r * Math.sin(a)));
      ring0.push(add(c, off));
      ring1.push(add(top, off));
    }
    var faces = [{ v: ring0.slice().reverse(), n: mul(W, -1) }, { v: ring1, n: W }];
    for (k = 0; k < sides; k++) {
      var m = (k + 0.5) / sides * Math.PI * 2;
      var j = (k + 1) % sides;
      faces.push({ v: [ring0[k], ring0[j], ring1[j], ring1[k]], n: add(mul(U, Math.cos(m)), mul(V, Math.sin(m))) });
    }
    return faces;
  }

  function bezier(p0, p1, p2, p3, steps) {
    var out = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, u = 1 - t;
      out.push(add(add(mul(p0, u * u * u), mul(p1, 3 * u * u * t)), add(mul(p2, 3 * u * t * t), mul(p3, t * t * t))));
    }
    return out;
  }

  function part(id, mod, name, desc, faces, extra) {
    var p = { id: id, mod: mod, name: name, desc: desc, faces: faces, lines: [], ghost: false, glass: false, alpha: 1, target: 1 };
    for (var k in extra) p[k] = extra[k];
    return p;
  }

  function cat() { return [].concat.apply([], arguments); }

  // Dimensions in millimetres. Concept layout: the enclosure isn't designed yet.
  var probeX = [-84, -60, -36, -12];
  var probeTop = [70, 70, 64, 64];
  var cables = probeX.map(function (px, i) {
    var gx = -80 + i * 22;
    return bezier([gx, 54, 22], [gx, 74, 22], [px, 92, probeTop[i] + 34], [px, 92, probeTop[i]], 16);
  });

  var parts = [
    part('shell', 'shell', 'Enclosure', '205 × 95 × 65 mm concept. The real enclosure isn\'t designed yet.',
      box(-102.5, -47.5, 0, 102.5, 47.5, 65), { ghost: true }),
    part('display', 'core', '5-inch touchscreen', 'Waveshare 5-DSI-TOUCH-A. Runs the interface in the field.',
      cat(box(-97, -42, 58, 27, 40, 62), box(-91, -35, 62, 21, 33, 62.6))),
    part('gps', 'core', 'GPS HAT', 'Adds position and time to every result.',
      cat(box(-95, -28, 46, -10, 28, 47.6), box(-52, -9, 47.6, -36, 7, 51))),
    part('pi', 'core', 'Raspberry Pi 5', 'Runs the sensors, the analysis and the interface.',
      cat(box(-95, -28, 30, -10, 28, 31.6), box(-26, -27, 31.6, -10, 27, 45), box(-72, -8, 31.6, -58, 6, 34))),
    part('ups', 'core', 'UPS HAT and 2× 18650 cells', 'Battery power for field use, about 5 V out.',
      cat(box(-95, -28, 23, -10, 28, 24.6), cyl([-90, -11, 12], 'x', 9.25, 64), cyl([-90, 11, 12], 'x', 9.25, 64))),
    part('board', 'core', 'Sensor board', 'Two ADS1115 converters, op amps, isolators and the 15 V boost module.',
      cat(box(-4, -40, 5, 36, 40, 6.6), box(2, -34, 6.6, 18, -18, 9), box(2, -12, 6.6, 18, 4, 9), box(22, -34, 6.6, 33, -14, 15), box(22, -8, 6.6, 33, 12, 15), box(4, 14, 6.6, 30, 32, 11))),
    part('front', 'core', 'Power switch and charger jack', 'On the front wall.',
      cat(box(-82, -50, 20, -68, -47.5, 30), cyl([-56, -51, 25], 'y', 4, 3.5))),

    part('chamber', 'uv', 'Light-tight chamber', 'Opaque bay with a lid. Lid switches cut LED and laser power when it opens.',
      box(42, -46, 2, 100, 46, 58), { ghost: true }),
    part('cell', 'uv', 'Four-window quartz cell', '10 mm path. UV crosses it low; the laser crosses higher up.',
      box(63.75, -36.25, 8, 76.25, -23.75, 53), { glass: true }),
    part('leds', 'uv', '235 and 275 nm LEDs', '235 nm reads nitrate. 275 nm corrects for organic matter.',
      cat(box(50, -35, 15, 56, -25, 25), box(56, -33, 17, 58, -27, 23))),
    part('sdiode', 'uv', 'Sample diode', 'sglux SG01D-18 silicon carbide photodiode. Reads UV after the cell.',
      cyl([84, -30, 20], 'x', 4.5, 5)),
    part('rdiode', 'uv', 'Reference diode', 'Watches the LEDs directly, so drift cancels out.',
      cyl([53, -43, 14], 'z', 4.5, 5)),

    part('laser', 'raman', '785 nm laser', 'About 90 mW diode with driver. Class 3B, so it stays enclosed and interlocked.',
      cyl([44, -30, 35], 'x', 6, 16)),
    part('dump', 'raman', 'Beam dump', 'Absorbs the laser after it crosses the cell.',
      box(84, -35, 29, 92, -25, 41)),
    part('mirror', 'raman', 'Concave mirror', 'Sends backward Raman light toward the lens.',
      box(62, -45, 24, 78, -42.5, 46)),
    part('lens', 'raman', 'Collection lens', 'Gathers Raman light at 90° to the laser.',
      cyl([70, 4, 35], 'y', 11, 4)),
    part('filter', 'raman', 'RG830 filter', 'Blocks scattered laser light and passes the Raman signal.',
      box(59, 14, 24, 81, 16, 46)),
    part('grating', 'raman', 'Grating', '600 lines/mm. Spreads the Raman light into a spectrum.',
      box(59, 20, 24, 81, 22, 46)),
    part('camera', 'raman', 'Camera Module 3 NoIR', 'Records the spectrum. Long exposures, up to 112 s.',
      box(66, 32, 23, 90, 40, 47, -0.52)),

    part('glands', 'probes', 'Cable glands', 'Seal the probe cables through the back wall.',
      cat(cyl([-80, 47.5, 22], 'y', 5, 7, 12), cyl([-58, 47.5, 22], 'y', 5, 7, 12), cyl([-36, 47.5, 22], 'y', 5, 7, 12), cyl([-14, 47.5, 22], 'y', 5, 7, 12))),
    part('probes', 'probes', 'Water probes', 'pH, TDS, turbidity and temperature, used in a separate cup so they never touch the cell.',
      cat(cyl([-84, 92, 0], 'z', 6, 70), box(-64, 88, 6, -56, 96, 70), box(-46, 84, 22, -26, 100, 64), cyl([-12, 92, 4], 'z', 3, 60, 12)),
      { lines: cables })
  ];

  var byId = {};
  parts.forEach(function (p) { byId[p.id] = p; });

  // Beams drawn on top while both ends are present.
  var beams = [
    { mod: 'uv', a: [58, -30, 20], b: [84, -30, 20] },
    { mod: 'raman', a: [60, -30, 35], b: [84, -30, 35] }
  ];

  // Fit and centre on every part, so toggling never rescales the view.
  var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  parts.forEach(function (p) {
    p.faces.forEach(function (f) { f.v.forEach(function (v) { for (var k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } }); });
  });
  var C = mul(add(lo, hi), 0.5);
  var R = 0;
  parts.forEach(function (p) {
    p.faces.forEach(function (f) { f.v.forEach(function (v) { var d = sub(v, C); R = Math.max(R, Math.hypot(d[0], d[1], d[2])); }); });
  });
  var S = (Math.min(VW, VH) / 2 - 8) / R * 1.2;

  var YAW0 = -0.62, PITCH0 = 0.5;
  var yaw = YAW0, pitch = PITCH0;
  var selected = null;
  var shellOn = true;
  var auto = !reduce;

  function project(p, lift, cy, sy, cp, sp) {
    var x = p[0] - C[0], y = p[1] - C[1], z = p[2] - C[2] + lift;
    var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
    var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
    var k = PERSP / (PERSP + y2 * S);
    return [VW / 2 + x1 * S * k, VH / 2 - z2 * S * k, y2];
  }

  function pathOf(pts, close) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) d += 'L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    return close ? d + 'Z' : d;
  }

  var dashOffset = 0;

  function render() {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var solid = [], ghosts = '', top = '';

    parts.forEach(function (p) {
      if (p.alpha < 0.01) return;
      var lift = (1 - p.alpha) * 36;
      var op = p.alpha < 0.99 ? ' opacity="' + p.alpha.toFixed(2) + '"' : '';
      var sel = selected === p.id ? ' sel' : '';
      p.faces.forEach(function (f) {
        var pts = f.v.map(function (v) { return project(v, lift, cy, sy, cp, sp); });
        if (p.ghost) {
          ghosts += '<path class="gh" d="' + pathOf(pts, true) + '"' + op + '/>';
          return;
        }
        var n = f.n, ny1 = n[0] * sy + n[1] * cy, ny2 = ny1 * cp - n[2] * sp;
        if (ny2 >= 0) return;
        // The view is always from above, so bias higher surfaces to draw later.
        // This keeps stacked boards and the display in the right order.
        var depth = 0, height = 0;
        pts.forEach(function (q) { depth += q[2]; });
        f.v.forEach(function (v) { height += v[2]; });
        solid.push({ z: (depth - 0.4 * height) / pts.length, s: '<path class="mf' + (p.glass ? ' glass' : '') + sel + '" data-p="' + p.id + '" d="' + pathOf(pts, true) + '"' + op + '/>' });
      });
      p.lines.forEach(function (ln) {
        var pts = ln.map(function (v) { return project(v, lift, cy, sy, cp, sp); });
        // Cables run outside the back wall, so draw them first and let the device cover them.
        solid.push({ z: Infinity, s: '<path class="cb' + sel + '" data-p="' + p.id + '" d="' + pathOf(pts, false) + '"' + op + '/>' });
      });
    });

    beams.forEach(function (b) {
      var holder = b.mod === 'uv' ? byId.leds : byId.laser;
      if (holder.alpha < 0.98 || byId.cell.alpha < 0.98) return;
      var a = project(b.a, 0, cy, sy, cp, sp), c = project(b.b, 0, cy, sy, cp, sp);
      top += '<path class="bm" style="stroke-dashoffset:' + dashOffset.toFixed(1) + '" d="' + pathOf([a, c], false) + '"/>';
    });

    solid.sort(function (a, b) { return b.z - a.z; });
    svg.innerHTML = '<g class="model">' + solid.map(function (o) { return o.s; }).join('') + top + ghosts + '</g>';
  }

  /* Animation loop: runs only while something is moving and the hero is on screen. */
  var raf = 0, last = 0, onScreen = true;

  function frame(t) {
    raf = 0;
    var dt = Math.min(50, t - (last || t));
    last = t;
    var moving = false;
    if (auto && !dragging) { yaw += dt * 0.00011; moving = true; }
    parts.forEach(function (p) {
      if (p.alpha === p.target) return;
      p.alpha += (p.target - p.alpha) * (1 - Math.exp(-dt / 110));
      if (Math.abs(p.target - p.alpha) < 0.01) p.alpha = p.target;
      moving = true;
    });
    if (!reduce && (byId.leds.alpha > 0.98 || byId.laser.alpha > 0.98)) {
      dashOffset = -((t * 0.012) % 24);
      moving = true;
    }
    render();
    if (moving && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf || !onScreen || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) kick();
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', kick);

  /* Selection */
  var pick = document.getElementById('pick');
  var pickDefault = pick.innerHTML;

  function select(id) {
    selected = id && byId[id] && !byId[id].ghost ? id : null;
    if (selected) {
      var p = byId[selected];
      pick.innerHTML = '<strong></strong><p></p>';
      pick.querySelector('strong').textContent = p.name;
      pick.querySelector('p').textContent = p.desc;
    } else {
      pick.innerHTML = pickDefault;
    }
    render();
  }

  /* Rotation by pointer */
  var dragging = false, moved = 0, px = 0, py = 0;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    px = e.clientX;
    py = e.clientY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX;
    py = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved < 5) return;
    auto = false;
    yaw += dx * 0.008;
    pitch = Math.max(0.08, Math.min(1.3, pitch + dy * 0.006));
    render();
  });
  stage.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    if (moved >= 5) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var hit = el && el.closest ? el.closest('[data-p]') : null;
    select(hit ? hit.getAttribute('data-p') : null);
  });
  stage.addEventListener('pointercancel', function () { dragging = false; });

  stage.addEventListener('keydown', function (e) {
    var step = 0.12;
    if (e.key === 'ArrowLeft') yaw -= step;
    else if (e.key === 'ArrowRight') yaw += step;
    else if (e.key === 'ArrowUp') pitch = Math.min(1.3, pitch + step);
    else if (e.key === 'ArrowDown') pitch = Math.max(0.08, pitch - step);
    else if (e.key === 'Escape') { select(null); return; }
    else return;
    e.preventDefault();
    auto = false;
    render();
  });

  /* Configurator */
  var BASE = 320;
  var mods = { probes: true, uv: true, raman: true };
  var price = { probes: 120, uv: 510, raman: 500 };
  var buttons = document.querySelectorAll('.mod[data-mod]');
  var total = document.getElementById('total');

  function apply() {
    var sum = BASE;
    buttons.forEach(function (b) {
      var m = b.getAttribute('data-mod');
      b.setAttribute('aria-pressed', mods[m] ? 'true' : 'false');
      if (mods[m]) sum += price[m];
    });
    total.textContent = '$' + sum.toLocaleString('en-US');
    parts.forEach(function (p) {
      if (p.mod === 'core') p.target = 1;
      else if (p.mod === 'shell') p.target = shellOn ? 1 : 0;
      else p.target = mods[p.mod] ? 1 : 0;
      if (reduce) p.alpha = p.target;
    });
    if (selected && byId[selected].target === 0) select(null);
    render();
    kick();
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-mod');
      mods[m] = !mods[m];
      // Raman uses the UV module's quartz cell.
      if (m === 'raman' && mods.raman) mods.uv = true;
      if (m === 'uv' && !mods.uv) mods.raman = false;
      apply();
    });
  });

  var shellBtn = document.getElementById('shell');
  shellBtn.addEventListener('click', function () {
    shellOn = !shellOn;
    shellBtn.setAttribute('aria-pressed', shellOn ? 'true' : 'false');
    apply();
  });
  document.getElementById('reset').addEventListener('click', function () {
    yaw = YAW0;
    pitch = PITCH0;
    select(null);
  });

  apply();
})();
