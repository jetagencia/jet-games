// Calidad gráfica: un solo sitio decide qué modelos y qué resolución usa cada dispositivo.
// `?calidad=baja|alta` fuerza una u otra; si no, los teléfonos, tabletas y equipos con poca memoria usan la liviana.
// (Fuera del navegador, por ejemplo en las pruebas del motor en Node, todo queda en calidad alta y sin movimiento reducido.)
const web = typeof location !== 'undefined' && typeof matchMedia !== 'undefined';
const stored = (() => { try { return web ? localStorage.getItem('criaturas.calidad') : null; } catch (e) { return null; } })();   // Ajustes › Calidad gráfica
const want = web ? new URLSearchParams(location.search).get('calidad') || (stored === 'baja' || stored === 'alta' ? stored : null) : null;
export const QUALITY_PREF = () => (stored === 'baja' || stored === 'alta' ? stored : 'auto');
const coarse = web && matchMedia('(pointer: coarse)').matches;
const memory = typeof navigator !== 'undefined' ? navigator.deviceMemory : 0;
export const LOW = want === 'baja' ? true : want === 'alta' ? false : coarse || !!(memory && memory <= 4);
export const LOD = LOW ? 'sd' : 'hd';
export const DPR_MAX = LOW ? 1.5 : 2;
export const CALM = web && matchMedia('(prefers-reduced-motion: reduce)').matches;   // sin temblores ni balanceos de cámara
