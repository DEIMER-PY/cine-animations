import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Split a text node into words wrapped in spans (for GSAP stagger reveals). */
export function splitWords(el) {
  if (!el) return [];
  const textNodes = Array.from(el.childNodes);
  const words = [];
  textNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const frag = node.textContent.trim().split(/\s+/);
      const wrap = document.createElement('span');
      wrap.innerHTML = frag
        .map(
          (w) =>
            `<span class="split-word inline-block overflow-hidden align-top"><span class="split-word-inner inline-block">${w}</span></span>`
        )
        .join('\u00A0');
      el.replaceChild(wrap, node);
      words.push(...Array.from(wrap.querySelectorAll('.split-word-inner')));
    }
  });
  return words;
}

/** Animated text-scramble effect on a node's textContent. */
export function scrambleText(el, text, { duration = 1, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*' } = {}) {
  const start = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const out = text
        .split('')
        .map((ch, i) => {
          const reveal = p * text.length;
          if (i < reveal) return ch;
          if (p < 1 && reveal - i < 3) return chars[Math.floor(Math.random() * chars.length)];
          return ch;
        })
        .join('');
      if (el) el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export function animateCounter(el, to, { duration = 1.6, decimals = 0, suffix = '' } = {}) {
  const obj = { val: 0 };
  return new Promise((resolve) => {
    gsap.to(obj, {
      val: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (el) el.textContent = obj.val.toFixed(decimals) + suffix;
      },
      onComplete: resolve,
    });
  });
}

/** Fade/slide sections in as they enter the viewport. */
export function revealElements(scope, { trigger = '.reveal', y = 48, stagger = 0.1, delay = 0 } = {}) {
  const items = scope.querySelectorAll(trigger);
  if (!items.length) return () => {};
  const ctx = gsap.context(() => {
    gsap.set(items, { opacity: 0, y, willChange: 'transform' });
    items.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: delay + i * stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, scope);
  return () => ctx.revert();
}

export { gsap, ScrollTrigger };
