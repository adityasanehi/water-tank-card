import { LitElement, html } from 'lit';

const SCHEMA = [
  { name: 'entity', required: true, selector: { entity: {} } },
  { name: 'name', selector: { text: {} } },
  { type: 'grid', name: '', schema: [
    { name: 'min', selector: { number: { mode: 'box', step: 'any' } } },
    { name: 'max', selector: { number: { mode: 'box', step: 'any' } } },
  ] },
  { name: 'background_image', selector: { text: {} } },
  { type: 'grid', name: '', schema: [
    { name: 'background_fit', selector: { select: { mode: 'dropdown', options: [
      { value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' },
    ] } } },
    { name: 'background_position', selector: { text: {} } },
  ] },
  { name: 'vertical_margin', selector: { number: { mode: 'box', min: 0, step: 1, unit_of_measurement: 'px' } } },
  { type: 'grid', name: '', schema: [
    { name: 'show_percentage', type: 'boolean' },
    { name: 'show_name', type: 'boolean' },
    { name: 'animation', type: 'boolean' },
    { name: 'show_pipe', type: 'boolean' },
  ] },
];
const LABELS = {
  entity: 'Entity', name: 'Name', min: 'Min (non-% entities)', max: 'Max (non-% entities)',
  background_image: 'Background image URL (optional)', background_fit: 'Background fit',
  background_position: 'Background position', show_percentage: 'Show percentage',
  show_name: 'Show name', animation: 'Animation', show_pipe: 'Show pipe',
  vertical_margin: 'Top/bottom margin',
};

class WaterTankCardEditor extends LitElement {
  static properties = { hass: {}, _config: { state: true } };
  setConfig(config) { this._config = config; }
  render() {
    if (!this._config) return html``;
    const data = { show_percentage: true, show_name: true, animation: true, show_pipe: false, vertical_margin: 16,
      background_fit: 'cover', background_position: 'center', ...this._config };
    return html`<ha-form .hass=${this.hass} .data=${data} .schema=${SCHEMA}
      .computeLabel=${(s) => LABELS[s.name] || s.name} @value-changed=${this._changed}></ha-form>`;
  }
  _changed(e) {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: e.detail.value }, bubbles: true, composed: true,
    }));
  }
}
customElements.define('water-tank-card-editor', WaterTankCardEditor);
