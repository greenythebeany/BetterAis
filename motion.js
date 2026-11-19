// Animated expand for the dashboard cards. The site's menitka.js toggles a
// card's extra links with a bare jQuery .toggle() - an instant jump with no
// animation at all, on any OS setting.
//
// Animating height doesn't work here: style.css pins the cards to
// height:auto !important (against the site's fixed heights), and an
// !important declaration outranks any animation. Cards in a row also all
// stretch to the tallest one. So the layout is left to change instantly and
// every card that grew is revealed with an animated clip-path instead - it
// visibly unrolls from its old height to the new one - while the newly shown
// links fade in.
//
// Runs only while the popup's Animácie switch is on (content.js sets
// html[data-motion]); it deliberately ignores the OS reduced-motion
// preference, since switching animations on there is an explicit opt-in.
(function () {
  'use strict';

  const DURATION = 340;
  const EASE = 'cubic-bezier(.2, .7, .15, 1)';

  function motionOn() {
    return document.documentElement.getAttribute('data-motion') !== 'off';
  }

  function cards() {
    return Array.from(document.querySelectorAll('#vsechny-polozky > .polozky-obal'));
  }

  function visibleItems(card) {
    return Array.from(card.querySelectorAll('li')).filter((li) => li.offsetParent !== null);
  }

  // Capture phase: runs before the site's handler (bound on the chevron
  // itself), so this sees the layout as it was. The "after" half runs in the
  // next animation frame: after the site's handler (which ends in
  // `return false`, so a bubbling listener would never see the click) but
  // before that frame is painted - nothing visibly jumps first.
  document.addEventListener('click', (event) => {
    if (!motionOn()) return;
    const trigger = event.target.closest && event.target.closest('.menusectiondown, .menusectionup');
    const clicked = trigger && trigger.closest('.polozky-obal');
    if (!clicked) return;

    const before = new Map(cards().map((card) => [card, card.getBoundingClientRect().height]));
    const shownBefore = new Set(visibleItems(clicked));

    requestAnimationFrame(() => {
      before.forEach((from, card) => {
        const to = card.getBoundingClientRect().height;
        if (to - from < 1) return; // only cards that grew
        const radius = getComputedStyle(card).borderRadius || '0';
        card.animate(
          [
            { clipPath: `inset(0 0 ${to - from}px 0 round ${radius})` },
            { clipPath: `inset(0 0 0 0 round ${radius})` },
          ],
          { duration: DURATION, easing: EASE }
        );
      });

      visibleItems(clicked)
        .filter((li) => !shownBefore.has(li))
        .forEach((li, i) => {
          li.animate(
            [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }],
            { duration: 260, delay: 80 + i * 35, easing: 'ease-out', fill: 'backwards' }
          );
        });
    });
  }, true);
})();
