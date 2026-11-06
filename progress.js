/*
  Prototype tracker. Edit this list to update the home page summary and the progress page.
  status: "done", "active" or "todo".
*/
var SPECTRIL_UPDATED = '5 November 2026';
var SPECTRIL_TASKS = [
  { area: 'Design', task: 'Choose the measurement methods', status: 'done', note: 'UV at 235 and 275 nm for nitrate; 785 nm Raman as an option' },
  { area: 'Design', task: 'Parts list and cost estimate', status: 'done', note: 'About $1,450 at one-off prices' },
  { area: 'Design', task: 'Wiring and pin map', status: 'done' },
  { area: 'Design', task: 'Build guide for the UV unit', status: 'done', note: '37 steps' },
  { area: 'Design', task: 'Enclosure', status: 'active', note: 'Concept CAD only' },
  { area: 'Design', task: 'Build steps for the Raman module', status: 'todo', note: 'Waits on the laser choice' },
  { area: 'Firmware', task: 'UV module driver', status: 'todo' },
  { area: 'Firmware', task: 'pH and TDS drivers', status: 'todo' },
  { area: 'Firmware', task: 'Battery monitor fix (INA219 at 0x42)', status: 'todo' },
  { area: 'Firmware', task: 'Sensor calls in main.py and the interface', status: 'todo' },
  { area: 'Firmware', task: 'Audit record storage and export', status: 'todo' },
  { area: 'Validation', task: 'Gate 1: prove UV nitrate in software', status: 'todo', note: 'Lab-tested samples and full UV scans' },
  { area: 'Validation', task: 'Gate 2: bench prototype', status: 'todo', note: 'Detection limit 1 mg/L as N' },
  { area: 'Validation', task: 'Gate 3: field comparison with a certified lab', status: 'todo' },
  { area: 'Validation', task: 'Gate 4: three units, one calibration', status: 'todo' },
  { area: 'Validation', task: 'Gate 5: Raman bench test', status: 'todo' },
  { area: 'Project', task: 'Website', status: 'active' },
  { area: 'Project', task: 'Open-source licence', status: 'active', note: 'Chosen: CERN-OHL-P-2.0, MIT, CC BY 4.0. Files still to add to the hardware and code repos' }
];

(function () {
  'use strict';

  var LABEL = { done: 'Done', active: 'In progress', todo: 'Not started' };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function bar(done, total) {
    var pct = Math.round(done / total * 100);
    var wrap = el('div', 'pbar rv');
    var head = el('div', 'phd');
    head.appendChild(el('strong', '', pct + '%'));
    head.appendChild(el('span', '', done + ' of ' + total + ' tasks done. Updated ' + SPECTRIL_UPDATED + '.'));
    var track = el('div', 'track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(pct));
    track.setAttribute('aria-label', 'Prototype progress');
    var fill = el('i');
    fill.style.setProperty('--p', pct + '%');
    track.appendChild(fill);
    wrap.appendChild(head);
    wrap.appendChild(track);
    return wrap;
  }

  var areas = [];
  var byArea = {};
  SPECTRIL_TASKS.forEach(function (t) {
    if (!byArea[t.area]) { byArea[t.area] = []; areas.push(t.area); }
    byArea[t.area].push(t);
  });
  var done = SPECTRIL_TASKS.filter(function (t) { return t.status === 'done'; }).length;

  var summary = document.getElementById('progress-summary');
  if (summary) {
    summary.appendChild(bar(done, SPECTRIL_TASKS.length));
    var grid = el('ul', 'areas');
    areas.forEach(function (a) {
      var list = byArea[a];
      var d = list.filter(function (t) { return t.status === 'done'; }).length;
      var li = el('li', 'rv');
      li.appendChild(el('b', '', a));
      li.appendChild(el('span', 'mono', d + ' / ' + list.length));
      var mini = el('div', 'track sm');
      var f = el('i');
      f.style.setProperty('--p', Math.round(d / list.length * 100) + '%');
      mini.appendChild(f);
      li.appendChild(mini);
      grid.appendChild(li);
    });
    summary.appendChild(grid);
  }

  var listEl = document.getElementById('progress-list');
  if (listEl) {
    areas.forEach(function (a) {
      var sec = el('section', 'parea');
      sec.appendChild(el('h2', 'rv', a));
      var ul = el('ul', 'road');
      byArea[a].forEach(function (t) {
        var li = el('li', 'rv');
        var body = el('span');
        body.appendChild(el('b', '', t.task));
        if (t.note) body.appendChild(document.createTextNode(t.note));
        li.appendChild(body);
        li.appendChild(el('span', 'st ' + t.status, LABEL[t.status]));
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      listEl.appendChild(sec);
    });
  }
})();
