import { afterNextRender, DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, MorphSVGPlugin, DrawSVGPlugin, Flip);

@Directive({ selector: '[appScene]' })
export class SceneDirective {
  readonly appScene = input.required<string>();

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);
    const render = afterNextRender(() => {
      const scene = this.appScene();
      let titleSplit: SplitText | undefined;
      const context = gsap.context(() => {
        if (scene === 'welcome') {
          const title = host.querySelector('h1');
          if (title) titleSplit = SplitText.create(title, { type: 'lines,words', mask: 'lines' });
          const words = titleSplit?.words ?? [];
          gsap.timeline({ defaults: { ease: 'expo.out' } })
            .from('.hero-visual', { clipPath: 'inset(0 0 100% 0 round 24px)', y: 32, duration: 1.15 }, 0)
            .from(words, { yPercent: 115, rotation: 7, stagger: .08, duration: .85 }, .12)
            .from('.hero-copy > p, .hero-actions, .hero-bottom', { opacity: 0, y: 18, stagger: .09, duration: .55 }, .38);
          gsap.to('.hero-water', {
            morphSVG: 'M120 184q25 16 50-1t50-1 56 2v60H120Z',
            duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
          });
          gsap.to('.hero-bubbles circle', {
            y: -18, x: 5, opacity: .35, stagger: .13, duration: 2.2,
            yoyo: true, repeat: -1, ease: 'sine.inOut',
          });
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
      }, host);
      destroy.onDestroy(() => { context.revert(); titleSplit?.revert(); });
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
    const timeline = gsap.timeline({ paused: true });
    const render = afterNextRender(() => {
      timeline.fromTo(panel, { autoAlpha: 0, clipPath: 'inset(0 0 100% 65% round 16px)' }, {
        autoAlpha: 1, clipPath: 'inset(0 0 0% 0% round 16px)', duration: .34,
        ease: 'power4.out', easeReverse: 'power2.out',
      }).fromTo(panel.querySelectorAll('button'), { opacity: 0, x: 8 }, {
        opacity: 1, x: 0, duration: .2, stagger: .035, ease: 'power2.out', easeReverse: true,
      }, .1);
      if (this.appMenu()) timeline.progress(1);
    });
    effect(() => {
      if (this.appMenu()) timeline.timeScale(1).play();
      else timeline.timeScale(1.55).reverse();
    });
    destroy.onDestroy(() => { render.destroy(); timeline.revert(); });
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
      const pill = host.querySelector('.motion-pill');
      if (!pill) return;
      const state = initial ? null : Flip.getState(pill);
      motion?.kill();
      gsap.set(pill, { clearProps: 'transform' });
      host.style.setProperty('--selected-index', String(index));
      if (state) motion = Flip.from(state, { duration: .33, ease: 'power3.out' });
      initial = false;
    });
    inject(DestroyRef).onDestroy(() => motion?.revert());
  }
}

@Directive({ selector: '[appSuccess]' })
export class SuccessDirective {
  constructor() {
    const icon: SVGSVGElement = inject(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);
    const render = afterNextRender(() => {
      const ring = icon.querySelector('.success-ring')!;
      const tick = icon.querySelector('.success-tick')!;
      const circle = ring.getAttribute('d')!;
      const motion = gsap.timeline({ defaults: { ease: 'sine.inOut' } })
        .set(tick, { drawSVG: '0%' })
        .set(ring, { attr: { d: 'M 10 24 L 38 24' } })
        .to(ring, { morphSVG: 'M 9 24 A 15 15 0 0 1 39 24', duration: .48 })
        .to(ring, { morphSVG: circle, duration: .5 })
        .to(tick, { drawSVG: '100%', duration: .42, ease: 'power2.out' });
      destroy.onDestroy(() => motion.revert());
    });
    destroy.onDestroy(() => render.destroy());
  }
}
