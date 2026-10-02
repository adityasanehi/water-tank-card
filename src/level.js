const PERCENT_CLASSES = ['battery', 'humidity', 'moisture'];

// Returns tank level 0-100, or null when the state is unusable.
export function computeLevel(stateObj, { min = 0, max = 100 } = {}) {
  if (!stateObj || stateObj.state === '' || stateObj.state == null) return null;
  const value = Number(stateObj.state);
  if (!Number.isFinite(value)) return null;
  const attrs = stateObj.attributes || {};
  const isPercent =
    attrs.unit_of_measurement === '%' || PERCENT_CLASSES.includes(attrs.device_class);
  let pct = value;
  if (!isPercent) {
    const lo = Number(min), hi = Number(max);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return null;
    pct = ((value - lo) / (hi - lo)) * 100;
  }
  return Math.min(100, Math.max(0, pct));
}
