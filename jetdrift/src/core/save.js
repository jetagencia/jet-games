// JETDrift — localStorage progression layer

export class Save {
  constructor() {
    this.key = 'jetdrift-save-v04';
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return {
      bestTimes: {},   // by mode+theme
      runs: 0,
      unlocks: { themes: ['dunes', 'spire'], modes: ['carrera', 'paseo'] },
    };
  }

  _save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch(e) {}
  }

  setBestTime(mode, theme, time) {
    const k = mode + ':' + theme;
    if (!this.data.bestTimes[k] || time < this.data.bestTimes[k]) {
      this.data.bestTimes[k] = time;
      this._save();
      return true;
    }
    return false;
  }

  getBestTime(mode, theme) {
    return this.data.bestTimes[mode + ':' + theme] || null;
  }

  incrementRuns() {
    this.data.runs++;
    this._save();
  }

  unlock(category, name) {
    if (!this.data.unlocks[category]) this.data.unlocks[category] = [];
    if (!this.data.unlocks[category].includes(name)) {
      this.data.unlocks[category].push(name);
      this._save();
    }
  }

  isUnlocked(category, name) {
    return this.data.unlocks[category]?.includes(name) || false;
  }
}
