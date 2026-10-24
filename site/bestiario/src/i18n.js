// Idioma del juego. La elección es común a todo jetgames.fun: la decide window.JETIdioma (../jet-idioma.js, copia tal cual
// de _shared). Aquí solo hay ayudas: L(es, en) elige el texto del idioma actual y bi() vuelve bilingües los datos del catálogo.
// Cambiar de idioma no recarga: JETIdioma emite el evento 'jet-idioma' y cada módulo repinta lo suyo (onLang).
const win = () => (typeof window !== 'undefined' ? window : null);
export const lang = () => { const W = win(); return W && W.JETIdioma ? W.JETIdioma.get() : 'es'; };
export const isEn = () => lang() === 'en';
export const L = (es, en) => (isEn() ? en : es);
export const setLang = (l) => { const W = win(); if (W && W.JETIdioma) W.JETIdioma.set(l); };
export const onLang = (f) => { const W = win(); if (W) W.addEventListener('jet-idioma', f); };

// Datos bilingües: { name: 'Dragón', ..., en: { name: 'Dragon' } }. Cada clave de `en` pasa a ser un getter que devuelve
// el texto del idioma actual, así quien lee obj.name recibe siempre el idioma vigente sin tocar el resto del código.
// Los textos de los dos idiomas quedan en obj.i18n (no enumerable) para reconocer nombres guardados en cualquiera de ellos.
export function bi(obj) {
  const en = obj && obj.en; if (!en) return obj;
  delete obj.en;
  const es = {};
  for (const k of Object.keys(en)) {
    es[k] = obj[k];
    Object.defineProperty(obj, k, { get: () => (isEn() ? en[k] : es[k]), enumerable: true, configurable: true });
  }
  Object.defineProperty(obj, 'i18n', { value: { es, en }, enumerable: false });
  return obj;
}
export const biAll = (list) => { for (const o of list) bi(o); return list; };
// copia que conserva los getters de idioma (el operador ... los congelaría en el idioma del momento)
export const withProps = (o, extra) => Object.defineProperties({}, { ...Object.getOwnPropertyDescriptors(o), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, { value: v, enumerable: true, writable: true, configurable: true }])) });
