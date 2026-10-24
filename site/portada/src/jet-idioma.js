/* JET//Games — idioma único para todo el sitio (2026-10-22).
   Copiar tal cual al principio de cada juego (antes de pintar textos).
   Prioridad: ?lang=es|en en la URL  >  elección guardada (cookie de .jetgames.fun + localStorage)  >  idioma del navegador.
   La elección se comparte entre la portada y todos los juegos porque la cookie vale para todo jetgames.fun. */
(function () {
  'use strict';
  var KEY = 'jet_lang';
  var OK = { es: 1, en: 1 };

  function leerCookie() {
    var m = document.cookie.match(/(?:^|;\s*)jet_lang=(es|en)\b/);
    return m ? m[1] : null;
  }
  function guardar(lang) {
    var dominio = /(^|\.)jetgames\.fun$/.test(location.hostname) ? '; domain=.jetgames.fun' : '';
    var seguro = location.protocol === 'https:' ? '; Secure' : '';
    try { document.cookie = KEY + '=' + lang + '; path=/; max-age=31536000; SameSite=Lax' + dominio + seguro; } catch (e) {}
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }
  function delNavegador() {
    var l = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^es\b/i.test(l) ? 'es' : 'en';
  }

  var desdeUrl = (location.search.match(/[?&]lang=(es|en)\b/) || [])[1] || null;
  var guardado = leerCookie();
  if (!guardado) { try { var ls = localStorage.getItem(KEY); if (OK[ls]) guardado = ls; } catch (e) {} }
  var actual = desdeUrl || guardado || delNavegador();
  if (desdeUrl || (guardado && !leerCookie())) guardar(actual);
  document.documentElement.lang = actual;

  window.JETIdioma = {
    get: function () { return actual; },
    /* Cambia el idioma, lo recuerda para todo el sitio y avisa con el evento 'jet-idioma'. */
    set: function (lang) {
      if (!OK[lang] || lang === actual) return;
      actual = lang; guardar(lang);
      document.documentElement.lang = lang;
      try { window.dispatchEvent(new CustomEvent('jet-idioma', { detail: lang })); } catch (e) {}
    },
  };
})();
