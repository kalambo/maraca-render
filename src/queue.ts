export default class Queue {
  onChange;
  changes = {};
  held = {};
  emit(flush = false) {
    this.onChange(
      Object.keys({ ...this.changes, ...this.held }).reduce(
        (res, key) => ({
          ...res,
          [key]: this.changes[key] ? this.changes[key][0] : this.held[key],
        }),
        {},
      ),
      flush || Object.keys(this.changes).length > 0,
    );
  }
  set(key, value) {
    if ((value === 'down' && !this.held[key]) || value === 'up') {
      this.changes[key] = [...(this.changes[key] || []), value];
    }
    this.held[key] = ['down', 'true'].includes(value);
    this.emit();
  }
  update(values, onChange) {
    this.onChange = onChange;
    for (const key of Object.keys(values || {})) {
      if (this.changes[key] && values[key] === this.changes[key][0]) {
        this.changes[key].shift();
        if (this.changes[key].length === 0) delete this.changes[key];
      }
    }
    if (Object.keys(this.changes).length > 0) this.emit();
  }
  clear() {
    this.changes = {};
    this.held = {};
    this.onChange(null, true);
  }
}
