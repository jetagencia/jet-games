# Aplica a site/index.html la dirección editorial de las 22 portadas sin arte raster nuevo:
# 5 SVG recompuestos (archivos en img/cards/), encuadres de transición para los 17 JPG, alt ES/EN,
# hover unificado y respeto de prefers-reduced-motion. Idempotente (busca marcadores).
import re, json, sys
P = '/home/user/jet-games/site/index.html'
s = open(P, encoding='utf-8').read()
if 'data-cards-editorial' in s:
    print('ya aplicado'); sys.exit(0)

# ---- 1. Los cinco SVG inline → img (ball con <picture> para el recorte 32:9)
def replace_svg_block(html, href_sub, new_inner):
    # localiza la tarjeta por su href y reemplaza el contenido de su .card-art (un <svg ...>...</svg>)
    i = html.find(href_sub); assert i > 0, href_sub
    a = html.find('<div class="card-art">', i); b = html.find('</div>', html.find('</svg>', a)) + len('</div>')
    assert a > 0 and b > a
    return html[:a] + '<div class="card-art">' + new_inner + '</div>' + html[b:]

IMG = lambda src, alt_en, alt_es, extra='': f'<img src="{src}" alt="{alt_en}" data-alt-es="{alt_es}" loading="lazy" width="320" height="180"{extra}>'
s = replace_svg_block(s, 'href="https://jetball.jetgames.fun"',
    '<picture><source media="(min-width: 1200px)" srcset="img/cards/ball-featured.svg">' +
    IMG('img/cards/ball.svg', 'A wall under construction advances toward a ball inside a board split into zones', 'Una pared en construcción avanza hacia una bola dentro de un tablero dividido en zonas') + '</picture>')
s = replace_svg_block(s, 'href="https://jetrocket.jetgames.fun"', IMG('img/cards/rocket.svg', 'The ship curls around its own crystal tail toward a new crystal', 'La nave gira sobre su propia cola de cristales hacia un cristal nuevo'))
s = replace_svg_block(s, 'href="https://jetslalom.jetgames.fun"', IMG('img/cards/slalom.svg', 'The skier carves a turn to pass between the flags of the next gate', 'El esquiador traza una curva para pasar entre las banderas de la próxima puerta'))
s = replace_svg_block(s, 'href="https://jetwords.jetgames.fun"', IMG('img/cards/words-en.svg', 'Two scored guesses and a third in progress on a five-letter grid', 'Dos intentos evaluados y un tercero en curso en una grilla de cinco letras', ' data-src-es="img/cards/words-es.svg" data-src-en="img/cards/words-en.svg"'))
s = replace_svg_block(s, 'href="https://jetgames.fun/jetbox/"', IMG('img/cards/box.svg', 'The astronaut pushes a container toward a free pad; another container is already in place', 'El astronauta empuja un contenedor hacia una plataforma libre; otro contenedor ya está en su sitio'))

# ---- 2. Encuadre de transición y alt de los 17 JPG (sin tocar el archivo de imagen)
JPG = {
 'img/astro.jpg': ('50% 55%', 'Small astronaut boosting over asteroids, with Jupiter behind', 'Astronauta pequeño impulsándose sobre asteroides, con Júpiter detrás'),
 'img/jetflow.jpg': ('45% 50%', 'A plasma route being built through pipes on a ship board', 'Una ruta de plasma en construcción por tuberías sobre el tablero de la nave'),
 'img/jetmatch.jpg': ('50% 50%', 'Board of flat gems: yellow squares, cyan circles, green triangles and magenta diamonds', 'Tablero de gemas planas: cuadrados amarillos, círculos cian, triángulos verdes y rombos magenta'),
 'img/salchidrez.jpg': ('100% 50%', 'Green chessboard with sausage-dog pieces in costume', 'Tablero verde de ajedrez con piezas de perros salchicha disfrazados'),
 'img/escudos.jpg': ('50% 50%', 'Mosaic of national team crests', 'Mosaico de escudos de selecciones'),
 'img/senal.jpg': ('50% 45%', 'The alien probe examining a sample of shapes', 'La sonda alienígena examinando una muestra de formas'),
 'img/antes.jpg': ('50% 92%', 'The astronaut and two echoes of past moves holding plates in a corridor', 'El astronauta y dos ecos de movimientos pasados sosteniendo placas en un corredor'),
 'img/telemetria.jpg': ('50% 50%', 'Ship diagnostic cabin with sensor readings', 'Cabina de diagnóstico de la nave con lecturas de sensores'),
 'img/portada.jpg': ('0% 50%', 'Front page of the newspaper El Eco Orbital being laid out', 'Primera plana del diario El Eco Orbital en maquetación'),
 'img/cajanegra.jpg': ('50% 45%', 'Cockpit frame and report pieces of a case under reconstruction', 'Fotograma de la cabina y fichas del informe de un caso en reconstrucción'),
 'img/crater.jpg': ('35% 45%', 'Crater map with candidate landing sites', 'Mapa de cráteres con sitios candidatos para aterrizar'),
 'img/frentes.jpg': ('50% 45%', 'Five planets with fleets assigned to each front', 'Cinco planetas con flotas asignadas a cada frente'),
 'img/balizas.jpg': ('50% 65%', 'The ship leaves a beacon while crossing fog between asteroids', 'La nave deja una baliza mientras cruza la niebla entre asteroides'),
 'img/estacion.jpg': ('50% 88%', 'Astronaut below a row of consoles in an empty station', 'Astronauta bajo una fila de consolas en una estación vacía'),
 'img/jetdrive.jpg': ('55% 55%', 'Hovercraft turning on the water', 'Hovercraft girando sobre el agua'),
 'img/jetjump.jpg': ('50% 45%', 'Horse and rider in the arena', 'Caballo y jinete en la pista'),
 'img/bestiario.jpg': ('50% 30%', 'The ash dragon with wings spread', 'El dragón de ceniza con las alas desplegadas'),
}
def fix_img(m):
    tag = m.group(0); src = re.search(r'src="([^"?]+)', tag).group(1)
    if src not in JPG: return tag
    pos, alt_en, alt_es = JPG[src]
    tag = re.sub(r'\salt="[^"]*"', f' alt="{alt_en}" data-alt-es="{alt_es}"', tag)
    if 'width=' not in tag: tag = tag.replace('<img ', '<img width="320" height="180" ')
    return tag.replace('<img ', f'<img style="object-position:{pos}" ', 1)
s = re.sub(r'<img [^>]*src="img/[^"]+"[^>]*>', fix_img, s)

# ---- 3. Estación: a 32:9 (w3) se muestra entera sobre un fondo de su paleta en vez de recortar al astronauta
s = s.replace('<a class="card reveal w3" href="https://jetgames.fun/estacion/"', '<a class="card reveal w3 art-contain-f" href="https://jetgames.fun/estacion/"', 1)

# ---- 4. CSS: hover unificado, reduced-motion, contain destacado
css = '''
  /* Portadas editoriales (auditoría 22-10-2026): mismo hover discreto para imagen y vector; sin zoom en táctil ni con movimiento reducido */
  .card-art img, .card-art svg { transition: transform .5s ease; }
  .card:hover .card-art img, .card:hover .card-art svg { transform: scale(1.02); }
  @media (hover: none), (prefers-reduced-motion: reduce) { .card:hover .card-art img, .card:hover .card-art svg { transform: none; } }
  .card-art picture { display: block; width: 100%; height: 100%; }
  @media (min-width: 900px) and (max-width: 1199px) { .card.art-contain-f .card-art img { object-fit: contain; background: #0b1a2a; } }
'''
s = s.replace('  .card-body { padding: 18px 22px 22px;', css + '  .card-body { padding: 18px 22px 22px;', 1)
s = s.replace('.card:hover .card-art img { transform: scale(1.04); }', '/* hover de imagen: ver bloque de portadas editoriales */', 1)
s = s.replace('''  .card:hover .card-art svg {
    transform: scale(1.08);
  }''', '', 1)

# ---- 5. Idioma: alt y fuente de la portada de Words
s = s.replace("    document.querySelectorAll('[data-es]').forEach(el => { el.textContent = L === 'es' ? el.dataset.es : el.dataset.en; });",
"""    document.querySelectorAll('[data-es]').forEach(el => { el.textContent = L === 'es' ? el.dataset.es : el.dataset.en; });
    document.querySelectorAll('img[data-alt-es]').forEach(img => { if (!img.dataset.altEn) img.dataset.altEn = img.alt; img.alt = L === 'es' ? img.dataset.altEs : img.dataset.altEn; });
    document.querySelectorAll('img[data-src-es]').forEach(img => { const src = L === 'es' ? img.dataset.srcEs : img.dataset.srcEn; if (img.getAttribute('src') !== src) img.setAttribute('src', src); });""", 1)
s = s.replace('<body>', '<body data-cards-editorial="2026-10-22">', 1)
open(P, 'w', encoding='utf-8').write(s)
print('ok: portadas aplicadas')
