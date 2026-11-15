import { afterNextRender, DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, MorphSVGPlugin, DrawSVGPlugin, Flip);

function initWasherMotion(host: HTMLElement): () => void {
  const mm = gsap.matchMedia();
  let ctx: gsap.Context | undefined;

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    ctx = gsap.context(() => {
      // 5 bubbles max, amplitude <= 8px, decoupled sine frequencies, no opacity breathing
      const bubbles = Array.from(host.querySelectorAll<SVGCircleElement>('.hero-bubbles circle')).slice(0, 5);
      const bubbleConfigs = [
        { y: -8, x: 4, durY: 2.8, durX: 3.6, delay: 0.1 },
        { y: -6, x: -5, durY: 2.2, durX: 3.1, delay: 0.5 },
        { y: -7, x: 3, durY: 3.0, durX: 3.8, delay: 0.9 },
        { y: -5, x: -4, durY: 2.5, durX: 3.3, delay: 0.3 },
        { y: -8, x: 5, durY: 2.9, durX: 3.5, delay: 0.7 },
      ];
      bubbles.forEach((bubble, i) => {
        const cfg = bubbleConfigs[i % bubbleConfigs.length];
        gsap.to(bubble, {
          y: cfg.y,
          duration: cfg.durY,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: -cfg.delay,
        });
        gsap.to(bubble, {
          x: cfg.x,
          duration: cfg.durX,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: -(cfg.delay * 1.5),
        });
      });

      // Water sloshing morph inside the drum window
      const waters = host.querySelectorAll('.hero-water');
      if (waters.length) {
        gsap.to(waters, {
          morphSVG: 'M120 184q25 16 50-1t50-1 56 2v60H120Z',
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // Foam drifting inside the drum
      const foams = host.querySelectorAll('.hero-foam circle');
      if (foams.length) {
        gsap.to(foams, {
          y: -4,
          x: 2,
          stagger: { each: 0.18, yoyo: true, repeat: -1 },
          duration: 2.2,
          ease: 'sine.inOut',
        });
      }

      // Pause washer loops when offscreen via ScrollTrigger
      ScrollTrigger.create({
        trigger: host,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => ctx?.resume(),
        onLeave: () => ctx?.pause(),
        onEnterBack: () => ctx?.resume(),
        onLeaveBack: () => ctx?.pause(),
      });
    }, host);
  });

  return () => {
    ctx?.revert();
    mm.revert();
  };
}

@Directive({ selector: '[appScene]' })
export class SceneDirective {
  readonly appScene = input.required<string>();

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);
    const render = afterNextRender(() => {
      const scene = this.appScene();
      let titleSplit: SplitText | undefined;
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(host, { opacity: 0.6, duration: 0.15, ease: 'none', clearProps: 'all' });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cleanupWasher = initWasherMotion(host);
        if (scene === 'welcome') {
          const title = host.querySelector('h1');
          if (title) titleSplit = SplitText.create(title, { type: 'lines,words', mask: 'lines' });
          const words = titleSplit?.words ?? [];
          gsap.timeline({ defaults: { ease: 'expo.out' } })
            .from('.hero-visual', { clipPath: 'inset(0 0 100% 0 round 24px)', y: 32, duration: 1.15 }, 0)
            .from(words, { yPercent: 115, rotation: 7, stagger: .08, duration: .85 }, .12)
            .from('.hero-copy > p, .hero-actions, .hero-bottom', { opacity: 0, y: 18, stagger: .09, duration: .55 }, .38);
        } else if (scene === 'auth') {
          gsap.from(host, { y: 14, opacity: .6, duration: .38, ease: 'power3.out', clearProps: 'transform,opacity' });
          const orbs = host.querySelectorAll('.auth-orb');
          if (orbs.length) {
            gsap.to(orbs, {
              y: -10,
              x: 6,
              duration: 4.2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              stagger: 1.2,
            });
          }
        } else if (scene === 'services') {
          gsap.from('.section-heading, .service-choice', {
            y: 24, opacity: .25, stagger: .06, duration: .65, ease: 'power3.out', clearProps: 'transform,opacity',
          });
        } else if (scene === 'scroll') {
          gsap.from(host, {
            y: 24, opacity: .45, duration: .65, ease: 'power3.out', clearProps: 'transform,opacity',
            scrollTrigger: { trigger: host, start: 'top 92%', once: true },
          });
        } else {
          gsap.from(host, { y: 14, opacity: .6, duration: .38, ease: 'power3.out', clearProps: 'transform,opacity' });
        }
        return () => cleanupWasher();
      });

      destroy.onDestroy(() => {
        mm.revert();
        titleSplit?.revert();
      });
    });
    destroy.onDestroy(() => render.destroy());
  }
}

@Directive({ selector: '[appMenu]' })
export class MenuDirective {
  readonly appMenu = input.required<boolean>();

  constructor() {
    const panel: HTMLElement = inject(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);
    let timeline: gsap.core.Timeline | undefined;
    const mm = gsap.matchMedia();

    const render = afterNextRender(() => {
      mm.add('(prefers-reduced-motion: reduce)', () => {
        timeline = gsap.timeline({ paused: true })
          .fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: 'none' });
        if (this.appMenu()) timeline.progress(1);
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        timeline = gsap.timeline({ paused: true })
          .fromTo(panel, { autoAlpha: 0, clipPath: 'inset(0 0 100% 65% round 16px)' }, {
            autoAlpha: 1, clipPath: 'inset(0 0 0% 0% round 16px)', duration: .34,
            ease: 'power4.out', easeReverse: 'power2.out',
          }).fromTo(panel.querySelectorAll('button'), { opacity: 0, x: 8 }, {
            opacity: 1, x: 0, duration: .2, stagger: .035, ease: 'power2.out', easeReverse: true,
          }, .1);
        if (this.appMenu()) timeline.progress(1);
      });
    });

    effect(() => {
      if (this.appMenu()) timeline?.timeScale(1).play();
      else timeline?.timeScale(1.55).reverse();
    });

    destroy.onDestroy(() => {
      render.destroy();
      timeline?.revert();
      mm.revert();
    });
  }
}

@Directive({ selector: '[appSelection]' })
export class SelectionDirective {
  readonly appSelection = input.required<number>();

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    let motion: gsap.core.Timeline | undefined;
    let initial = true;
    effect(() => {
      const index = this.appSelection();
      const pill = host.querySelector<HTMLElement>('.motion-pill');
      if (!pill) return;
      const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const state = initial || isReduced ? null : Flip.getState(pill);
      motion?.kill();
      gsap.set(pill, { clearProps: 'transform' });
      host.style.setProperty('--selected-index', String(index));
      if (state && !isReduced) motion = Flip.from(state, { duration: .33, ease: 'power3.out' });
      initial = false;
    });
    inject(DestroyRef).onDestroy(() => motion?.revert());
  }
}

@Directive({ selector: '[appSuccess]' })
export class SuccessDirective {
  constructor() {
    const icon: SVGSVGElement = inject(ElementRef).nativeElement;
    const badge = icon.closest<HTMLElement>('.success-check') || icon;
    const destroy = inject(DestroyRef);
    const render = afterNextRender(() => {
      const ring = icon.querySelector<SVGCircleElement>('.success-circle-ring');
      const tick = icon.querySelector<SVGPathElement>('.success-check-tick');
      if (!ring || !tick) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(badge, { scale: 1, opacity: 1 });
        gsap.set(ring, { drawSVG: '100%' });
        gsap.set(tick, { drawSVG: '100%', scale: 1 });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const motion = gsap.timeline({ defaults: { ease: 'power2.out' } });

        // Badge spring: back.out(1.4) (softened from 2.2, no secondary micro-pulse)
        motion.fromTo(badge,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.38, ease: 'back.out(1.4)' },
          0
        );

        // Sweeps 360 smoothly from 12 o'clock
        motion.fromTo(ring,
          { drawSVG: '0%', rotation: -90, svgOrigin: '26 26' },
          { drawSVG: '100%', duration: 0.45, ease: 'power2.inOut' },
          0.06
        );

        // Checkmark draws in cleanly
        motion.fromTo(tick,
          { drawSVG: '0%', scale: 0.85, svgOrigin: '26 26' },
          { drawSVG: '100%', scale: 1, duration: 0.35, ease: 'power3.out' },
          0.36
        );
      });

      destroy.onDestroy(() => mm.revert());
    });
    destroy.onDestroy(() => render.destroy());
  }
}
