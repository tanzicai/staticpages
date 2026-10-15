/* ================================================================
   线性图标集（SVG，stroke 使用 currentColor，24×24）
   用法：Icon('chart', 16) → <span class="ic"><svg …></svg></span>
   ================================================================ */
(function (global) {
  'use strict';

  var P = {
    home: '<path d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z"/><path d="M9.6 20.6v-5.8h4.8v5.8"/>',
    star: '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.6 9.7l5.8-.8z"/>',
    folder: '<path d="M3.6 7.4A2 2 0 0 1 5.6 5.4h3.2l1.7 2.1h8A2 2 0 0 1 20.4 9.6v7A2 2 0 0 1 18.4 18.6h-13a2 2 0 0 1-2-2z"/>',
    cap: '<path d="M2.6 9.2 12 5l9.4 4.2L12 13.4z"/><path d="M6.6 11.4v4.2c0 1.4 2.4 2.5 5.4 2.5s5.4-1.1 5.4-2.5v-4.2"/><path d="M21.4 9.2v5"/>',
    layers: '<path d="M12 3.6 20 8l-8 4.4L4 8z"/><path d="M4 12.4 12 16.8l8-4.4"/><path d="M4 16.4 12 20.8l8-4.4"/>',
    bot: '<rect x="4" y="8.4" width="16" height="11.6" rx="3"/><path d="M12 4.4v4"/><path d="M9.4 13.4h.02M14.6 13.4h.02"/><path d="M9.6 16.6h4.8"/>',
    activity: '<path d="M3 12.6h3.6l2-5.6 2.9 10.2 2.1-6.2 1.6 3.2H21"/>',
    clipboard: '<path d="M9 4.6h6v2.4H9z"/><path d="M15 5.4h2.4A1.6 1.6 0 0 1 19 7v11.4a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 18.4V7a1.6 1.6 0 0 1 1.6-1.6H9"/><path d="M8.4 11.4h7.2M8.4 14.6h5.2"/>',
    userCheck: '<circle cx="9.6" cy="8.4" r="3.4"/><path d="M3.6 19.4c0-3 2.7-5 6-5 .9 0 1.8.2 2.6.5"/><path d="M16.2 15.4l1.9 1.9 3.5-3.7"/>',
    users: '<circle cx="9" cy="8.2" r="3.2"/><path d="M3 19.4c0-2.9 2.7-4.9 6-4.9s6 2 6 4.9"/><path d="M16.4 5.6a3 3 0 0 1 0 5.9"/><path d="M19.4 19.4c0-2.2-1.2-3.9-3.1-4.6"/>',
    chart: '<path d="M3.6 20.4h16.8"/><path d="M6.4 20.4v-6.6M11.8 20.4V5.6M17.2 20.4v-9.4"/>',
    alert: '<path d="M12 4.6 20.8 19.4H3.2z"/><path d="M12 10.2v4.2"/><path d="M12 17h.02"/>',
    award: '<circle cx="12" cy="9.4" r="5.2"/><path d="M8.6 13.8 7.2 21l4.8-2.6L16.8 21l-1.4-7.2"/>',
    book: '<path d="M5 4.6h9.4A2.4 2.4 0 0 1 16.8 7v13H7.4A2.4 2.4 0 0 1 5 17.6z"/><path d="M16.8 17h2.2V6.8a2.4 2.4 0 0 0-2.4-2.4"/><path d="M8.6 9h4.6M8.6 12.2h4.6"/>',
    plane: '<path d="M3.6 12.6 20.4 4l-6 16.4-3.1-6.6z"/><path d="M11.3 13.8 20.4 4"/>',
    hospital: '<path d="M4.6 20.4V8.6L12 4.4l7.4 4.2v11.8"/><path d="M12 9.4v5.2M9.4 12h5.2"/><path d="M3 20.4h18"/>',
    trending: '<path d="M3.6 16.6 9 11.2l3.4 3.4L20.4 6.6"/><path d="M15.4 6.6h5v5"/>',
    grid: '<rect x="3.8" y="3.8" width="7" height="7" rx="1.6"/><rect x="13.2" y="3.8" width="7" height="7" rx="1.6"/><rect x="3.8" y="13.2" width="7" height="7" rx="1.6"/><rect x="13.2" y="13.2" width="7" height="7" rx="1.6"/>',
    sliders: '<path d="M4 7.4h5.2M14.4 7.4H20M4 12h9.6M18 12h2M4 16.6h3.4M11.6 16.6H20"/><circle cx="11.6" cy="7.4" r="1.8"/><circle cx="16.2" cy="12" r="1.8"/><circle cx="9.4" cy="16.6" r="1.8"/>',
    edit: '<path d="M4 20.4h4.2L19 9.6l-4.2-4.2L4 16.2z"/><path d="M14.2 5.8 18.4 10"/>',
    target: '<circle cx="12" cy="12" r="7.6"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
    cpu: '<rect x="7.2" y="7.2" width="9.6" height="9.6" rx="2.2"/><rect x="10.4" y="10.4" width="3.2" height="3.2" rx="1"/><path d="M10 4.4v2.8M14 4.4v2.8M10 16.8v2.8M14 16.8v2.8M4.4 10h2.8M4.4 14h2.8M16.8 10h2.8M16.8 14h2.8"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="M15.9 15.9 20.6 20.6"/>',
    network: '<circle cx="12" cy="5" r="2.2"/><circle cx="5.4" cy="18.4" r="2.2"/><circle cx="18.6" cy="18.4" r="2.2"/><path d="M10.6 6.8 6.7 16.3M13.4 6.8l3.9 9.5M7.6 18.4h8.8"/>',
    gitBranch: '<circle cx="7" cy="5" r="2.2"/><circle cx="7" cy="19" r="2.2"/><circle cx="17.4" cy="12" r="2.2"/><path d="M7 7.2v9.6"/><path d="M15.2 12H11a4 4 0 0 1-4-4"/>',
    fileText: '<path d="M6.4 3.6h7L19.6 9.8v10.6a1.6 1.6 0 0 1-1.6 1.6H6.4a1.6 1.6 0 0 1-1.6-1.6V5.2a1.6 1.6 0 0 1 1.6-1.6z"/><path d="M13.2 3.6v6.4h6.4"/><path d="M8.6 13.4h6.8M8.6 16.6h4.6"/>',
    message: '<path d="M4.4 6.4A2 2 0 0 1 6.4 4.4h11.2a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2H9.6L4.4 19.6z"/><path d="M8.4 8.6h7.2M8.4 11.4h4.4"/>',
    cross: '<path d="M9.6 4h4.8v5.6H20v4.8h-5.6V20H9.6v-5.6H4V9.6h5.6z"/>',
    compass: '<circle cx="12" cy="12" r="7.8"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',
    image: '<rect x="3.8" y="4.6" width="16.4" height="14.8" rx="2.2"/><circle cx="9" cy="10" r="1.6"/><path d="M4.6 17.6 9.8 12.4l3.4 3.4 2.6-2.6 3.6 3.6"/>',
    brain: '<path d="M12 5.6a3 3 0 0 0-3 3v9.4a2.6 2.6 0 0 0 5.2 0V8.6a3 3 0 0 0-2.2-3z"/><path d="M9 9.6H7.2a2 2 0 0 0 0 4H9M15 13.6h1.8a2 2 0 0 0 0-4H15"/>',
    shield: '<path d="M12 3.6 19 6.2v5.8c0 4.2-2.9 7.6-7 9.2-4.1-1.6-7-5-7-9.2V6.2z"/><path d="M9.4 12l2 2 3.4-4"/>',
    layout: '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2"/><path d="M3.6 9.8h16.8M10 9.8v9.6"/>',
    pie: '<path d="M12 3.8a8.2 8.2 0 1 0 8.2 8.2H12z"/><path d="M12 12V3.8a8.2 8.2 0 0 1 8.2 8.2z"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.6V12l3.2 2"/>',
    play: '<path d="M8.4 5.6 18 12l-9.6 6.4z"/>',
    heart: '<path d="M12 20.2c-1.4-1.2-7.4-5.4-7.4-9.6A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.4 3.2c0 4.2-6 8.4-7.4 9.6z"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.4 4.4v4.4h-4.4"/>',
    ruler: '<path d="M14.8 3.6 20.4 9.2 9.2 20.4 3.6 14.8z"/><path d="M8.2 10.2l1.8 1.8M11 13l1.8 1.8M13.8 15.8l1.8 1.8"/>',
    check: '<path d="M5 12.6 9.6 17.2 19 7.6"/>',
    arrowRight: '<path d="M5 12h13"/><path d="M12.4 6l6 6-6 6"/>',
    flag: '<path d="M6.2 20.4V4.4"/><path d="M6.2 5.4h11l-2.2 4 2.2 4h-11"/>',
    bell: '<path d="M9.4 19.4a2.6 2.6 0 0 0 5.2 0"/><path d="M6.2 17h11.6l-1.5-2.4V10a4.7 4.7 0 1 0-9.4 0v4.6z"/>',
    help: '<circle cx="12" cy="12" r="8"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1 1-1.1 1.8v.4"/><path d="M12 17.2h.02"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bookOpen: '<path d="M12 6.6C10.4 5.2 8 4.6 4.4 4.6v13c3.6 0 6 .6 7.6 2 1.6-1.4 4-2 7.6-2v-13c-3.6 0-6 .6-7.6 2z"/><path d="M12 6.6v12.6"/>',
    calendar: '<rect x="3.8" y="5.4" width="16.4" height="14.4" rx="2"/><path d="M3.8 10h16.4M8.4 3.6v3.6M15.6 3.6v3.6"/>',
    dotSquare: '<rect x="6" y="6" width="12" height="12" rx="3"/>'
  };

  function Icon(name, size, cls) {
    var d = P[name] || P.dotSquare;
    var s = size || 16;
    return '<span class="ic ' + (cls || '') + '"><svg viewBox="0 0 24 24" width="' + s + '" height="' + s
      + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg></span>';
  }

  global.Icon = Icon;
  global.ICON_NAMES = Object.keys(P);
})(window);
