/* SAGE 医学教育一体化平台 - 交互 */
(function () {
  'use strict';

  /* ---------- 课程轮播 ---------- */
  function initCarousel() {
    const track = document.getElementById('courseTrack');
    const prev = document.getElementById('coursePrev');
    const next = document.getElementById('courseNext');
    const dotsBox = document.getElementById('courseDots');
    if (!track || !dotsBox) return;

    let index = 0;

    function visibleCount() {
      const w = track.parentElement.clientWidth;
      return w < 480 ? 2 : 3;
    }

    function maxIndex() {
      return Math.max(0, track.children.length - visibleCount());
    }

    function buildDots() {
      dotsBox.innerHTML = '';
      for (let i = 0; i <= maxIndex(); i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '第 ' + (i + 1) + ' 页');
        b.addEventListener('click', () => {
          index = i;
          update();
        });
        dotsBox.appendChild(b);
      }
    }

    function update() {
      const count = track.children.length;
      const v = visibleCount();
      const card = track.children[0];
      const gap = 12;
      const step = card.getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-index * step) + 'px)';

      Array.from(dotsBox.children).forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
      });
      if (prev) prev.style.opacity = index === 0 ? '0' : '';
      if (next) next.style.opacity = index >= maxIndex() ? '0' : '';
    }

    if (prev) prev.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
    if (next) next.addEventListener('click', () => { index = Math.min(maxIndex(), index + 1); update(); });

    window.addEventListener('resize', () => {
      index = Math.min(index, maxIndex());
      buildDots();
      update();
    });

    buildDots();
    update();
  }

  /* ---------- 导航点击态 ---------- */
  function initNav() {
    const items = document.querySelectorAll('.mainnav__item');
    items.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        items.forEach((i) => i.classList.remove('is-active'));
        item.classList.add('is-active');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initCarousel();
  });
})();
