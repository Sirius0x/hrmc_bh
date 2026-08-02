import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import {
  createIcons, Activity, ArrowDown, ArrowRight, ArrowUpRight, Baby, BadgeCheck,
  Brain, CalendarDays, Clock, Dumbbell, Hand, HeartHandshake, HeartPulse, MapPin,
  PersonStanding, Phone, Star, Stethoscope, Trophy, Zap
} from 'lucide';

gsap.registerPlugin(ScrollTrigger, SplitText);
document.documentElement.classList.remove('no-js');

// Replace <i data-lucide> placeholders with real SVGs before any layout math
createIcons({ icons: {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, Baby, BadgeCheck, Brain,
  CalendarDays, Clock, Dumbbell, Hand, HeartHandshake, HeartPulse, MapPin,
  PersonStanding, Phone, Star, Stethoscope, Trophy, Zap
} });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const desktop = window.matchMedia('(min-width: 861px)').matches;
if (reduceMotion) document.documentElement.classList.add('motion-off');

// ---- Preloader ----
// The scroll-scrub can only be smooth against video data the browser already
// holds, so hold the page until the clips report they can play through.
// Resolves a promise the hero intro waits on, so the entrance plays to a
// watching user instead of running behind the overlay.
const pageReady = (function(){
  const el = document.getElementById('preloader');
  if(!el) return Promise.resolve();
  const pct   = document.getElementById('plPct');
  const wave  = document.getElementById('plWave');
  const track = document.getElementById('plTrack');

  // --- Material 3 Expressive wavy progress geometry ---
  // Active portion is a sine wave wrapped around the circle; the remaining
  // track stays flat, separated by a small gap at each end.
  const CX = 74, CY = 74, R = 58;
  const AMP = 5, WAVES = 9;                 // wave depth / count around the ring
  const GAP = 0.16;                         // radians of clearance either side
  const TAU = Math.PI * 2;

  function ring(from, to, amp, phase){
    if(to - from < 0.002) return '';
    const steps = Math.max(8, Math.round((to - from) * 46));
    let d = '';
    for(let i = 0; i <= steps; i++){
      const a = from + (to - from) * (i / steps);
      const rr = R + Math.sin(a * WAVES + phase) * amp;
      d += (i ? 'L' : 'M') + (CX + rr * Math.cos(a)).toFixed(2) + ' '
                           + (CY + rr * Math.sin(a)).toFixed(2) + ' ';
    }
    return d;
  }
  const videos = [...document.querySelectorAll('video.scroll-video')];
  // Only the first clip gates the page. Waiting on all four (~13MB) before
  // showing anything would trade one bad experience for a worse one; the
  // rest keep downloading while the hero and services are being read.
  const gating = videos[0];

  const MIN_MS = 4000;              // the ramp fills evenly across four seconds
  const startedAt = performance.now();
  let target = 0, display = 0, finished = false, phase = 0;

  // How much of the gating clip is actually downloaded, 0-100. Used as the
  // ceiling on the clock-driven ramp, so a slow connection makes the ring
  // track real bytes instead of a timer that would finish ahead of the video.
  function bufferedPct(){
    if(!gating || !gating.duration || !gating.buffered.length) return 0;
    let end = 0;
    for(let i = 0; i < gating.buffered.length; i++) end = Math.max(end, gating.buffered.end(i));
    return Math.min(end / gating.duration, 1) * 100;
  }

  function paint(){
    // ease toward the target so the number counts instead of snapping
    display += (target - display) * 0.12;
    if(target - display < 0.4) display = target;
    const v = Math.round(display);
    if(pct) pct.textContent = v + '%';

    const p = Math.min(display / 100, 1);
    phase -= 0.13;                                   // travelling squiggle
    // wave flattens out as it completes, the way M3 resolves to a solid ring
    const amp = AMP * (p > 0.94 ? (1 - p) / 0.06 : 1);
    const start = -Math.PI / 2;
    const endActive = start + TAU * p;
    if(wave)  wave.setAttribute('d', ring(start, endActive, amp, phase));
    if(track) track.setAttribute('d',
      p < 0.995 ? ring(endActive + GAP, start + TAU - GAP, 0, 0) : '');

    if(!finished || v < 100) requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);

  return new Promise(function(resolve){
    let assetsReady = false;

    // Fills gradually across the four seconds rather than jumping between
    // fixed stops. The clock only ever sets the pace when the content can
    // keep up: until the clip is ready the ramp is also capped by how much
    // of it has actually downloaded, so on a slow connection the ring
    // follows the download instead of racing ahead of it. The small floor
    // keeps it from sitting frozen at 0 before the first bytes land.
    const poll = setInterval(function(){
      const elapsed = performance.now() - startedAt;
      const byTime = Math.min(100, (elapsed / MIN_MS) * 100);
      target = assetsReady ? byTime : Math.min(byTime, Math.max(bufferedPct(), 8));
    }, 80);

    function finish(){
      if(finished) return;
      finished = true;
      clearInterval(poll);
      target = 100;
      // let the ring visibly close on 100 before lifting the overlay
      setTimeout(function(){
        el.classList.add('is-done');
        setTimeout(resolve, 260);
      }, 420);
    }

    function ready(){
      if(assetsReady) return;
      assetsReady = true;
      setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - startedAt)));
    }

    if(!gating || gating.readyState >= 3){ ready(); return; }
    ['canplaythrough','loadeddata','error'].forEach(function(ev){
      gating.addEventListener(ev, ready, {once:true});      // never block on a broken asset
    });
    setTimeout(ready, 10000);                               // backstop: the page always opens
  });
})();

// ---- Header show/hide ----
const header = document.getElementById('siteHeader');
let lastY = window.scrollY;
window.addEventListener('scroll', function(){
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 40);
  if(y > lastY && y > 160){ header.classList.add('hide'); }
  else { header.classList.remove('hide'); }
  lastY = y;
}, {passive:true});

// ---- Mobile menu ----
const burger = document.getElementById('burgerBtn');
const menu = document.getElementById('mobileMenu');
const closeBtn = document.getElementById('mobileClose');
function openMenu(){
  menu.classList.add('open');
  burger.classList.add('open');
  burger.setAttribute('aria-expanded','true');
}
function closeMenu(){
  menu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded','false');
}
burger.addEventListener('click', ()=> burger.classList.contains('open') ? closeMenu() : openMenu());
closeBtn.addEventListener('click', closeMenu);
menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeMenu));

// ---- Treatment explorer: list (L) drives the detail panel (R) ----
(function(){
  const tabs = [...document.querySelectorAll('.te-item')];
  const panels = [...document.querySelectorAll('.te-panel')];
  if(!tabs.length || !panels.length) return;

  // Hover previews on pointer devices only — on touch, hover fires as a
  // synthetic pre-click and would swap the panel twice.
  const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let current = 0;

  function select(idx, focus){
    if(idx === current) return;
    current = idx;
    tabs.forEach(function(t, i){
      const on = i === idx;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function(p, i){
      const on = i === idx;
      p.classList.toggle('is-active', on);
      if(on) p.removeAttribute('hidden'); else p.setAttribute('hidden','');
    });
    const panel = panels[idx];
    if(!reduceMotion && panel){
      gsap.fromTo(panel, { opacity:0, y:14 }, { opacity:1, y:0, duration:.45, ease:'power3.out' });
      gsap.fromTo(panel.querySelectorAll('.te-points li'),
        { opacity:0, x:-12 },
        { opacity:1, x:0, duration:.4, ease:'power3.out', stagger:.06, delay:.08 });
    }
    if(focus) tabs[idx].focus();
  }

  tabs.forEach(function(tab, i){
    tab.addEventListener('click', ()=> select(i));
    if(hoverable) tab.addEventListener('mouseenter', ()=> select(i));
    tab.addEventListener('keydown', function(e){
      const last = tabs.length - 1;
      let next = null;
      if(e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
      else if(e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
      else if(e.key === 'Home') next = 0;
      else if(e.key === 'End') next = last;
      if(next !== null){ e.preventDefault(); select(next, true); }
    });
  });
})();

// ---- Lenis smooth scrolling, synced to GSAP's ticker ----
if(!reduceMotion){
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.3 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time)=> lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ---- Count-up stats ----
// Fires on the same 'top 90%' trigger point as the .stat card's own fade-in
// (below) — the old IntersectionObserver at 50%-visible fired well after the
// card had already finished revealing, leaving a beat of visibly blank/zero
// numbers before counting started.
function runCounter(el){
  const target = parseFloat(el.getAttribute('data-count'));
  const isDecimal = target % 1 !== 0;
  const start = performance.now();
  const dur = 1400;
  function tick(now){
    const p = Math.min((now-start)/dur, 1);
    const eased = 1 - Math.pow(1-p, 3);
    const cur = target * eased;
    el.textContent = isDecimal ? cur.toFixed(1) : Math.round(cur);
    if(p < 1) requestAnimationFrame(tick);
    else el.textContent = isDecimal ? target.toFixed(1) : target;
  }
  requestAnimationFrame(tick);
}
const counters = document.querySelectorAll('[data-count]');
if(reduceMotion){
  const cIo = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      runCounter(entry.target);
      cIo.unobserve(entry.target);
    });
  }, {threshold:0.5});
  counters.forEach(el=> cIo.observe(el));
} else {
  counters.forEach(function(el){
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: ()=> runCounter(el)
    });
  });
}

// ---- Video playback ----
// Desktop: scroll-scrubbed, so the timeline is driven by scroll progress —
// a section always plays from its first frame as it enters, forward on
// scroll-down and backward on scroll-up (videos are all-keyframe encoded
// for frame-accurate seeking).
// Mobile + reduced-motion: plain autoplay-in-view at natural speed. Phones
// have no pinned stage to scrub against (the card sits below the video, not
// over it), so scroll progress there maps a 10s clip onto a couple hundred
// pixels and the whole video blurs past in one flick. Letting it just play
// gives the full duration back and is independent of scroll speed.
if(reduceMotion || !desktop){
  const vIo = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.play().catch(()=>{}); }
      else { entry.target.pause(); }
    });
  }, {threshold:0.2});
  document.querySelectorAll('video.scroll-video').forEach(v=> vIo.observe(v));
} else {
  document.querySelectorAll('[data-clip]').forEach(function(media){
    const section = media.closest('section');
    const video = media.querySelector('video');
    video.pause();
    video.removeAttribute('loop');

    // Seeking is only smooth into data the browser already holds. Served
    // over HTTP (Vercel) rather than off local disk, an un-buffered seek
    // fires a byte-range request and the element shows the last decoded
    // frame until it lands — which reads as a hard cut. Clamping the seek
    // to the buffered range degrades that into a brief hold on the nearest
    // available frame instead, then catches up once the fetch completes.
    function seekable(t){
      const b = video.buffered;
      for(let i = 0; i < b.length; i++){
        if(t >= b.start(i) && t <= b.end(i)) return true;
      }
      return false;
    }
    // Nudge the browser into fetching the whole clip up front so the
    // buffered range covers the section before the user reaches it.
    video.preload = 'auto';
    video.load();

    // Starts once the section's top reaches the top of the screen (fully in
    // view), not as it's still entering from below. Lenis already smooths
    // the scroll itself, so the playhead tracks scroll progress directly
    // here — an extra eased chase on top of that lagged behind on fast
    // scrolls and never caught up before the section left view.
    // Ends at 'bottom bottom' (one section-height of scroll after 'top top'),
    // not 'bottom top' (full exit) — the video reaches its last frame while
    // the section still fills the screen, leaving a settled buffer to read
    // the panel before the section actually scrolls away.
    ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate(self){
        if(!video.duration) return;
        const t = self.progress * (video.duration - 0.05);
        // Skip seeks that would land outside the buffer — holding the
        // current frame for a beat looks intentional; a stalled seek does not.
        if(seekable(t)) video.currentTime = t;
      }
    });
  });
}

// ============================================================
// Everything below is motion flourish — skipped for reduced motion
// ============================================================
if(!reduceMotion){

  // Wait for fonts so SplitText line breaks are final
  document.fonts.ready.then(()=>{

    // ---- Split-line headings: masked line reveals on scroll ----
    document.querySelectorAll('.split-lines').forEach(function(el){
      const split = new SplitText(el, { type:'lines', mask:'lines', linesClass:'sl-line' });
      gsap.from(split.lines, {
        yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' }
      });
    });

    // ---- Generic reveals ----
    gsap.utils.toArray('.reveal').forEach(function(el, i){
      gsap.fromTo(el,
        { opacity:0, y:30 },
        {
          opacity:1, y:0, duration:1, ease:'power3.out', delay:(i % 4) * 0.05,
          scrollTrigger:{ trigger: el, start:'top 90%', toggleActions:'play none none none' }
        }
      );
    });

    // ---- HERO entrance ----
    const heroTitle = document.querySelector('.hero-title');
    const heroSplit = new SplitText(heroTitle, { type:'lines', mask:'lines' });
    // Held until the preloader lifts, otherwise the entrance plays out behind
    // the overlay and the user arrives to an already-finished hero.
    const intro = gsap.timeline({ paused:true, defaults:{ ease:'power4.out' } });
    pageReady.then(()=> intro.play());
    intro
      .from(heroSplit.lines, { yPercent:115, duration:1.3, stagger:0.12 }, 0.15)
      .from('.hero-eyebrow:not(.hero-eyebrow-end)', { opacity:0, y:16, duration:.9 }, 0.4)
      .from('.hero-lead',    { opacity:0, y:22, duration:.9 }, 0.55)
      .from('.hero-actions', { opacity:0, y:22, duration:.9 }, 0.68)
      .from('.rating-row',   { opacity:0, y:16, duration:.9 }, 0.8)
      .from('.hero-eyebrow-end', { opacity:0, y:16, duration:.9 }, 0.92)
      .from('.hero-chip',    { opacity:0, scale:.7, duration:.8, ease:'back.out(1.6)', stagger:0.07 }, 0.6)
      .from('.hero-watermark', { opacity:0, duration:1.6, ease:'power2.out' }, 0.3)
      .from('.scroll-cue',   { opacity:0, duration:1 }, 1.1);

    // ---- HERO title word-cycle: "Move" <-> "Live" swap, "Better." stays fixed ----
    const heroCycleWords = document.querySelectorAll('#heroCycle .ht-cycle-word');
    if(heroCycleWords.length === 2){
      gsap.set(heroCycleWords, { yPercent:(i)=> i===0 ? 0 : 28 });
      let cycleIdx = 0;
      setInterval(function(){
        const outWord = heroCycleWords[cycleIdx];
        cycleIdx = (cycleIdx+1) % heroCycleWords.length;
        const inWord = heroCycleWords[cycleIdx];
        gsap.to(outWord, { opacity:0, yPercent:-28, duration:.5, ease:'power2.inOut' });
        gsap.fromTo(inWord, { opacity:0, yPercent:28 }, { opacity:1, yPercent:0, duration:.5, ease:'power2.inOut' });
      }, 2600);
    }

    // ---- HERO scroll exit: pinned 3D recede (desktop only) ----
    if(desktop){
      const heroScrub = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero', start: 'top top', end: '+=65%',
          pin: '.hero-pin', scrub: true, anticipatePin: 1,
          // This pin adds ~65svh of scroll distance to the document, which
          // shifts every trigger below it. The video scrubs are created
          // earlier (top-level) than this timeline (inside fonts.ready), so
          // without a higher refresh priority they'd measure their start
          // positions before the pin-spacer exists and end up ~585px early.
          refreshPriority: 10
        }
      });
      // fromTo with explicit starting values — the entrance intro above is
      // still mid-fade when this timeline is created, so a plain .to() would
      // capture opacity near 0 as its implicit start and never restore to 1
      // on scroll back up.
      heroScrub
        .fromTo('.hero-core', { z:0, opacity:1, filter:'blur(0px)' }, { z:-260, opacity:0, filter:'blur(6px)', transformPerspective:900, ease:'power1.in' }, 0)
        .fromTo('.hero-watermark', { scale:1, opacity:1 }, { scale:1.18, opacity:0, ease:'none' }, 0)
        .fromTo('.hero-halo', { opacity:1 }, { opacity:0, ease:'none' }, 0)
        .fromTo('.scroll-cue', { opacity:1 }, { opacity:0 }, 0);
      document.querySelectorAll('.hero-chip').forEach(function(chip){
        const depth = parseFloat(chip.dataset.depth || 1);
        heroScrub.fromTo(chip, { y:0, opacity:1 }, { y: -160 * depth, opacity: 0, ease: 'power1.in' }, 0);
      });
    }

    // ---- HERO chips: cursor depth parallax ----
    if(finePointer && desktop){
      const chips = [...document.querySelectorAll('.hero-chip')].map(function(chip){
        return {
          depth: parseFloat(chip.dataset.depth || 1),
          xTo: gsap.quickTo(chip, 'x', { duration: 0.8, ease: 'power3.out' }),
          yTo: gsap.quickTo(chip, 'y', { duration: 0.8, ease: 'power3.out' })
        };
      });
      const hero = document.querySelector('.hero-pin');
      hero.addEventListener('mousemove', function(e){
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        chips.forEach(function(c){ c.xTo(nx * -34 * c.depth); c.yTo(ny * -26 * c.depth); });
      });
    }

    // ---- COVER SECTIONS (conditions + lifestyle): video fills the frame
    //      as you scroll — clip-path expands to full bleed, video de-zooms,
    //      and the content panel drifts against the scroll. ----
    document.querySelectorAll('[data-clip]').forEach(function(media){
      const section = media.closest('section');
      const video = media.querySelector('video');
      const isLifestyle = media.classList.contains('lifestyle-media');
      const startClip = isLifestyle
        ? 'inset(10% 8% 10% 8% round 28px)'
        : 'inset(8% 6% 8% 6% round 26px)';

      // Quick reveal beat right as the section reaches the top of the
      // screen — finishes 20% of a viewport later, before the longer
      // video-content scrub below takes over.
      gsap.fromTo(media,
        { clipPath: startClip },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'top -20%', scrub: true } }
      );
      // Matches the video-playback scrub's start/end so the de-zoom finishes
      // exactly when the video reaches its last frame.
      gsap.fromTo(video,
        { scale: 1.18 },
        { scale: 1, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true } }
      );
    });

    document.querySelectorAll('.condition.cover').forEach(function(sec){
      const panel = sec.querySelector('.cond-panel');
      const num = sec.querySelector('.condition-num');
      const numDir = sec.classList.contains('reverse') ? -1 : 1;

      // Parallax drift only makes sense while the panel floats over the
      // video (desktop). On phones the card sits in normal flow below the
      // video, so a ±70px drift would just shove it around / open gaps.
      if(desktop){
        gsap.fromTo(panel, {y:70}, {y:-70, ease:'none',
          scrollTrigger:{trigger:sec, start:'top bottom', end:'bottom top', scrub:true}});
      }
      gsap.fromTo(num, {x: 50 * numDir, y: -30}, {x: -50 * numDir, y: 40, ease:'none',
        scrollTrigger:{trigger:sec, start:'top bottom', end:'bottom top', scrub:true}});

      // Card details reveal as a scroll-scrubbed micro-animation. On desktop
      // it's tied to the pinned window ('top top'); on mobile the card is
      // below the video and would still be off-screen at that point, so it
      // triggers off the panel itself as it scrolls into view.
      const detailsTl = gsap.timeline({
        scrollTrigger: desktop
          ? { trigger: sec, start:'top top', end:'top -20%', scrub:true }
          : { trigger: panel, start:'top 92%', end:'top 45%', scrub:true }
      });
      detailsTl
        .from(panel, { opacity:0, scale:.96, ease:'none' }, 0)
        .from(sec.querySelector('.condition-tag'), { opacity:0, y:10, ease:'none' }, 0)
        .from(sec.querySelector('.condition-copy'), { opacity:0, y:10, ease:'none' }, 0.05)
        .from(sec.querySelectorAll('.symptom-item'), { opacity:0, x:-18, ease:'none', stagger:0.08 }, 0.1);
    });

    // ---- Tilt cards: cursor-reactive 3D ----
    if(finePointer && desktop){
      document.querySelectorAll('.tilt-card').forEach(function(card){
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
        gsap.set(card, { transformPerspective: 700 });
        card.addEventListener('mousemove', function(e){
          const r = card.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          rx(ny * -8); ry(nx * 9);
        });
        card.addEventListener('mouseleave', function(){ rx(0); ry(0); });
      });
    }

    // ---- Magnetic buttons ----
    if(finePointer && desktop){
      document.querySelectorAll('.btn-magnetic').forEach(function(btn){
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
        btn.addEventListener('mousemove', function(e){
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width/2)) * 0.28);
          yTo((e.clientY - (r.top + r.height/2)) * 0.34);
        });
        btn.addEventListener('mouseleave', function(){ xTo(0); yTo(0); });
      });
    }

    ScrollTrigger.refresh();
    // The video/poster assets and their preload="auto" downloads can still be
    // settling after fonts.ready resolves; a late refresh once everything
    // (images, video metadata) has actually loaded keeps the scroll-trigger
    // boundaries lined up with final layout instead of a mid-load snapshot.
    window.addEventListener('load', ()=> ScrollTrigger.refresh());
  });
} else {
  // Reduced motion: everything visible, no transforms
  gsap.set('.reveal', { opacity: 1 });
}
