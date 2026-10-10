// JETJump — worker: simula los recorridos de los rivales sin bloquear el render.
import { simulateRound } from './sim.js';
import { buildCourse } from './courses.js';

self.onmessage = (e) => {
  const { id, spec, rivals, mode } = e.data;
  const course = buildCourse(spec.layout, spec.opts);
  const results = rivals.map((r) => {
    const out = simulateRound(course, r.horse, r.rider, r.skill, r.seed, mode, r.cruise);
    return { ...out, name: r.name, horseName: r.horseName };
  });
  self.postMessage({ id, results });
};
