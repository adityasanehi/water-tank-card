import { LitElement, html, css, svg, nothing } from 'lit';
import pipeUrl from '../assets/tank-with-pipe.png';
import plainUrl from '../assets/tank-only.png';
import { tankLayouts } from './tank-layout.js';
import { computeLevel } from './level.js';
import './water-tank-card-editor.js';

const FITS = { cover: 'cover', contain: 'contain', fill: '100% 100%' };
const STEP = 12;
const AMP = 18; // max wave height in image px
const BUBBLES = 7;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Surface height offset at x: a few out-of-phase sines plus a slow slosh tilt.
const surface = (F, x, t, p) =>
  Math.sin(x * 0.011 * p.k + t * 1.5 * p.s + p.o) * 0.55 +
  Math.sin(x * 0.027 * p.k - t * 1.1 * p.s + p.o * 2) * 0.3 +
  Math.sin(x * 0.005 + t * 0.6 * p.s) * 0.45 +
  ((x - (F.left + F.right) / 2) / (F.right - F.left)) * Math.sin(t * 0.55 * p.s + p.o) * 0.9;

const pathAt = (F, y0, a, t, p, close = true) => {
  let d = '';
  for (let x = F.left - STEP; x <= F.right + STEP; x += STEP) {
    d += `${d ? 'L' : 'M'}${x} ${(y0 + a * surface(F, x, t, p)).toFixed(1)}`;
  }
  return close ? `${d}L${F.right + STEP} ${F.bottom + 4}L${F.left - STEP} ${F.bottom + 4}Z` : d;
};

const BACK = { k: 0.8, s: 0.8, o: 2.1 };
const FRONT = { k: 1, s: 1, o: 0 };

class WaterTankCard extends LitElement {
  static properties = { hass: {}, _config: { state: true } };

  static getConfigElement() { return document.createElement('water-tank-card-editor'); }
  static getStubConfig(hass) {
    const e = Object.keys(hass?.states || {}).find((k) => k.startsWith('sensor.'));
    return { entity: e || 'sensor.water_tank_level_percent' };
  }

  setConfig(config) {
    if (!config?.entity) throw new Error('Please define an entity');
    this._config = {
      show_percentage: true, show_name: true, animation: true, show_pipe: false, vertical_margin: 16,
      min: 0, max: 100, background_fit: 'cover', background_position: 'center',
      ...config,
    };
  }

  getCardSize() { return 5; }

  get _level() {
    return computeLevel(this.hass?.states?.[this._config?.entity], this._config);
  }

  connectedCallback() { super.connectedCallback(); this._kick(); }
  disconnectedCallback() { super.disconnectedCallback(); cancelAnimationFrame(this._raf); this._raf = 0; }
  updated() { this._kick(); }

  _kick() {
    if (this._raf || !this.isConnected || !this._config) return;
    this._last = performance.now();
    this._raf = requestAnimationFrame((ts) => this._frame(ts));
  }

  get _layout() { return this._config.show_pipe ? tankLayouts.pipe : tankLayouts.plain; }

  _frame(ts) {
    this._raf = 0;
    const F = this._layout.fill;
    const H = F.bottom - F.top;
    const root = this.renderRoot;
    const back = root.querySelector('.back');
    if (!back) return;
    const dt = Math.min(0.1, (ts - this._last) / 1000);
    this._last = ts;
    const level = this._level;
    const live = this._config.animation && !reduced();
    const target = level ?? this._shown ?? 0;
    this._shown = this._shown ?? target;
    this._shown += (target - this._shown) * Math.min(1, dt * 2.2);
    if (Math.abs(target - this._shown) < 0.02) this._shown = target;
    this._t = (this._t || 0) + (live ? dt : 0);

    const s = this._shown;
    const y0 = F.bottom - (s / 100) * H;
    // waves flatten near empty and near full
    const a = AMP * Math.min(1, Math.min(s, 100 - s) / 12) * (live ? 1 : 0.35);
    back.setAttribute('d', pathAt(F, y0 + 3, a * 0.8, this._t, BACK));
    root.querySelector('.front').setAttribute('d', pathAt(F, y0, a, this._t, FRONT));
    root.querySelector('.sheen').setAttribute('d', pathAt(F, y0, a, this._t, FRONT, false));
    root.querySelector('.water').style.opacity = level == null ? 0 : 1;

    const bubs = root.querySelectorAll('.bub');
    this._bubs = this._bubs || Array.from({ length: BUBBLES }, () => ({ x: 0, y: -1, r: 0, v: 0 }));
    this._bubs.forEach((b, i) => {
      if (live && level != null && b.y < y0 + 10) {
        b.x = F.left + 40 + Math.random() * (F.right - F.left - 80);
        b.y = F.bottom - Math.random() * 40;
        b.r = 3 + Math.random() * 5;
        b.v = 25 + Math.random() * 35;
      }
      b.y -= b.v * dt;
      const e = bubs[i];
      const show = live && level != null && b.y > y0 + 10;
      e.setAttribute('cx', (b.x + Math.sin(b.y * 0.05 + i) * 4).toFixed(1));
      e.setAttribute('cy', b.y.toFixed(1));
      e.setAttribute('r', show ? b.r.toFixed(1) : 0);
    });

    if (live || this._shown !== target) this._kick();
    else this._raf = 0;
  }

  render() {
    const c = this._config;
    if (!c) return nothing;
    const L = this._layout;
    const F = L.fill;
    const H = F.bottom - F.top;
    const stateObj = this.hass?.states?.[c.entity];
    const level = this._level;
    const name = c.name ?? stateObj?.attributes?.friendly_name ?? '';
    const text = level == null ? '--' : `${Math.round(level)}%`;
    const bg = c.background_image
      ? `background-image:url("${c.background_image}");background-size:${FITS[c.background_fit] || 'cover'};background-position:${c.background_position}`
      : '';
    return html`<ha-card>
      <div class="stage" style="aspect-ratio:${L.width}/${L.height};width:${L.span * 100}%;margin:${Number(c.vertical_margin) || 0}px auto">
        ${bg ? html`<div class="bg" style=${bg}></div>` : nothing}
        <svg viewBox="0 0 ${L.width} ${L.height}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="tank"><rect x=${F.left} y=${F.top} width=${F.right - F.left}
              height=${H} rx=${F.radius}/></clipPath>
            <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7fd0ff" stop-opacity=".88"/>
              <stop offset=".35" stop-color="#2f9be8" stop-opacity=".9"/>
              <stop offset="1" stop-color="#0c4aa6" stop-opacity=".95"/>
            </linearGradient>
            <linearGradient id="deepBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#4db4f5" stop-opacity=".55"/>
              <stop offset="1" stop-color="#0a3d95" stop-opacity=".6"/>
            </linearGradient>
          </defs>
          ${svg`<g clip-path="url(#tank)"><g class="water">
            <path class="back" fill="url(#deepBack)"/>
            <path class="front" fill="url(#deep)"/>
            <path class="sheen" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
            ${Array.from({ length: BUBBLES }, () => svg`<circle class="bub" r="0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>`)}
          </g></g>`}
        </svg>
        <img class="shell" src=${c.show_pipe ? pipeUrl : plainUrl} alt="" />
        ${c.show_percentage || (c.show_name && name)
          ? html`<div class="ui" style="left:${((F.left + L.labelOffsetX) / L.width) * 100}%;width:${((F.right - F.left) / L.width) * 100}%;top:${(((F.top + F.bottom) / 2) / L.height) * 100}%">
              ${c.show_percentage ? html`<div class="pct">${text}</div>` : nothing}
              ${c.show_name && name ? html`<div class="name">${name}</div>` : nothing}
            </div>` : nothing}
      </div>
    </ha-card>`;
  }

  static styles = css`
    ha-card { overflow: hidden; background: transparent; box-shadow: none; border: none; }
    .stage { position: relative; }
    .bg, svg, .shell { position: absolute; inset: 0; width: 100%; height: 100%; }
    .bg { background-repeat: no-repeat; }
    .shell { object-fit: contain; pointer-events: none; }
    .water { transition: opacity .4s; }
    .ui { font-family: var(--primary-font-family, Roboto, 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); position: absolute; transform: translateY(-50%);
      text-align: center; color: #fff; pointer-events: none;
      text-shadow: 0 1px 6px rgba(0, 40, 80, .75), 0 0 2px rgba(0, 40, 80, .9); }
    .pct { font-size: clamp(18px, 7vw, 36px); font-weight: 600; line-height: 1; }
    .name { margin-top: 6px; font-size: 1.1em; opacity: .95; }
  `;
}

customElements.define('water-tank-card', WaterTankCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'water-tank-card', name: 'Water Tank Card',
  description: 'Animated water tank for a level or percentage sensor',
});
