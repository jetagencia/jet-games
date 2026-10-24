/* JET//Portada · contenido (segunda parte) y armado de las listas. */
(function (G) {
'use strict';
const RAW = G.__PORTADA_RAW, SLOTS = G.__PORTADA_SLOTS;
// ───────────────────────── CIENCIA ─────────────────────────
RAW.CIE = {
tit: `Las calabazas lunares crecen con música lenta|Moon pumpkins grow better to slow music
Hallan agua en un asteroide con forma de pato|Water found on a duck-shaped asteroid
Un telescopio ve su propio reflejo|Telescope spots its own reflection
Crean un imán que solo atrae calcetines|New magnet attracts only socks
El primer robot que bosteza al aburrirse|First robot that yawns when bored
Confirman que Saturno tiene un anillo más|Saturn confirmed to have one more ring
Inventan un casco que traduce suspiros|Helmet that translates sighs invented
La sonda Ciruela envía su primera foto|Plum probe sends back its first photo
Un microbio de hielo aprende a nadar|Ice microbe learns to swim
Logran hervir agua en gravedad cero|Water boiled in zero gravity at last
Mapa completo de la cara oculta|Full map of the far side completed
Descubren un cometa que vuelve cada martes|Comet that returns every Tuesday found
Una planta de algas resuelve un laberinto|Algae plant solves a maze
El reloj atómico se adelanta un segundo|Atomic clock runs one second fast
Nueva vacuna contra el mareo orbital|New vaccine against orbit sickness
Detectan una señal: era un microondas|Signal detected: it was a microwave
Primer trasplante de raíz en la Luna|First root transplant on the Moon
Un láser mide la paciencia de los gatos|Laser measures how patient cats are
Fabrican ladrillos con polvo de cráter|Bricks made from crater dust
Estudio: dormir flotando mejora la memoria|Study: sleeping afloat boosts memory`,
nota: `La música lenta ayuda a las calabazas|En los invernaderos de {l} ya suenan baladas desde el amanecer.|Slow music helps moon pumpkins|Greenhouses in {l} now play ballads from dawn.
Agua en un asteroide con forma de pato|{P} cree que alcanza para llenar mil teteras.|Water on a duck-shaped asteroid|{P} believes it could fill a thousand kettles.
Un telescopio que se mira a sí mismo|Un espejo mal puesto regaló la foto más extraña del año.|A telescope that sees itself|A misplaced mirror produced the strangest photo of the year.
El imán de los calcetines|Por fin una solución para el misterio del calcetín perdido.|The sock magnet|At last, a fix for the mystery of the missing sock.
Un robot que bosteza|Sus creadores dicen que es la prueba de que piensa demasiado.|A robot that yawns|Its makers say it proves the robot thinks too much.
Saturno suma un anillo|Es muy fino y casi transparente. Se ve mejor de reojo.|Saturn adds a ring|It's very thin and almost clear. Best seen from the corner of your eye.
El casco que traduce suspiros|{P} lo probó y descubrió que suspira por el café.|The helmet that translates sighs|{P} tried it and learned they sigh about coffee.
Primera foto de la sonda Ciruela|Muestra un valle, una roca y, al fondo, otra sonda saludando.|First photo from the Plum probe|It shows a valley, a rock and, far off, another probe waving.
Un microbio de hielo que nada|Lo bautizaron Pip. Hace largos de un milímetro.|An ice microbe that swims|They named it Pip. It swims one-millimeter laps.
Agua hirviendo sin gravedad|La burbuja de vapor quedó flotando en el laboratorio de {l}.|Boiling water without gravity|The steam bubble is still floating in the {l} lab.
La cara oculta, al fin en el mapa|El atlas tiene {n} cráteres nuevos y ninguno tiene nombre todavía.|The far side, mapped at last|The atlas has {n} new craters, none of them named yet.
Un cometa que vuelve cada martes|Los astrónomos de {l} ya lo esperan con café y galletas.|A comet that comes back every Tuesday|Astronomers in {l} now wait for it with coffee and cookies.
Algas que resuelven laberintos|Encontraron la salida en dos días. Los estudiantes, en tres.|Algae that solve mazes|They found the exit in two days. The students took three.
El reloj atómico se adelantó|Nadie llegó tarde esta semana y nadie sabe por qué.|The atomic clock ran fast|No one was late this week, and nobody knows why.
Vacuna contra el mareo orbital|Una dosis basta para dar vueltas sin perder el almuerzo.|A vaccine for orbit sickness|One dose lets you spin without losing lunch.
La señal misteriosa era un microondas|Venía de la cocina del observatorio de {l}.|The mystery signal was a microwave|It came from the kitchen at the {l} observatory.
Un trasplante de raíz en la Luna|El árbol se recupera bien y ya pidió más sol.|A root transplant on the Moon|The tree is recovering well and has asked for more sun.
Los gatos, más pacientes de lo que creíamos|Un láser siguió a {n} gatos durante una semana.|Cats are more patient than we thought|A laser tracked {n} cats for a week.
Ladrillos de polvo de cráter|Con ellos se construirá la nueva escuela de {l}.|Bricks made of crater dust|They will be used to build the new school in {l}.
Dormir flotando mejora la memoria|{P} encabezó el estudio y no recuerda haber dormido mal.|Sleeping afloat helps memory|{P} led the study and can't recall a bad night.`,
col: `Ciencia lenta|Las calabazas no tienen prisa.|Slow science|Pumpkins are never in a hurry.
El pato de agua|Un asteroide con sed de fama.|The water duck|An asteroid thirsty for fame.
Espejos traviesos|A veces el cielo te devuelve la mirada.|Mischievous mirrors|Sometimes the sky looks back.
Calcetines unidos|Un imán para la paz doméstica.|Socks united|A magnet for household peace.
Robots cansados|Bostezar también es pensar.|Tired robots|Yawning is a kind of thinking.
Anillos discretos|Saturno guardaba un secreto.|Discreet rings|Saturn was keeping a secret.
Suspiros traducidos|Ahora sabemos qué extrañamos.|Translated sighs|Now we know what we miss.
Postal de Ciruela|Una roca, un valle y un saludo.|A postcard from Plum|A rock, a valley and a wave.
Pip, el nadador|Un milímetro de gloria.|Pip the swimmer|One millimeter of glory.
Hervir en órbita|El vapor no sabe adónde ir.|Boiling in orbit|Steam doesn't know where to go.
Cráteres sin nombre|Se aceptan sugerencias.|Nameless craters|Suggestions welcome.
El cometa de los martes|Puntual como pocos.|The Tuesday comet|More punctual than most.
Algas listas|Salir del laberinto es cuestión de luz.|Clever algae|Escaping the maze is all about light.
Un segundo de más|El tiempo también se equivoca.|One second too many|Time makes mistakes too.
Contra el mareo|Girar sin consecuencias.|Against dizziness|Spinning without consequences.
Falsa alarma|La señal solo quería calentar sopa.|False alarm|The signal just wanted to heat soup.
Raíces lunares|El árbol se adapta mejor que nosotros.|Lunar roots|The tree adapts better than we do.
Gatos y láser|La paciencia tiene un límite rojo.|Cats and lasers|Patience has a red limit.
Ladrillos de cráter|Construir con lo que hay.|Crater bricks|Building with what we have.
Memoria flotante|Soñar sin almohada.|Floating memory|Dreaming without a pillow.`,
breve: `Calabazas con música|{n}|Pumpkins with music|{n}
Teteras de agua del pato|1.000|Kettles of duck water|1,000
Anillos de Saturno|+1|Saturn's rings|+1
Calcetines recuperados|{n}|Socks recovered|{n}
Bostezos del robot|{n}|Robot yawns|{n}
Fotos de la sonda|1|Probe photos|1
Largos del microbio Pip|{n}|Laps by Pip the microbe|{n}
Cráteres nuevos|{n}|New craters|{n}
Días de las algas|2|Days for the algae|2
Segundos de adelanto|1|Seconds fast|1
Dosis contra el mareo|1|Doses against dizziness|1
Señales misteriosas|0|Mystery signals|0
Árboles trasplantados|1|Trees transplanted|1
Gatos observados|{n}|Cats observed|{n}
Ladrillos de cráter|{n}|Crater bricks|{n}
Horas de sueño flotante|8|Hours of floating sleep|8
Martes con cometa|{n}|Tuesdays with a comet|{n}
Telescopios en servicio|{n}|Telescopes in service|{n}
Laboratorios activos|{n}|Active labs|{n}
Suspiros traducidos|{n}|Sighs translated|{n}`,
foto: `{P} en el laboratorio de {l}.|{P} in the lab at {l}.
El asteroide con forma de pato, visto de perfil.|The duck-shaped asteroid in profile.
La primera imagen de la sonda Ciruela.|The first image from the Plum probe.
Saturno y su anillo recién confirmado.|Saturn and its newly confirmed ring.
El telescopio de {l}, apuntando a sí mismo.|The {l} telescope pointing at itself.
Un invernadero con calabazas y altavoces.|A greenhouse with pumpkins and speakers.
{P} sostiene un ladrillo de polvo de cráter.|{P} holds a brick made of crater dust.
El robot que bosteza, durante una prueba.|The yawning robot during a test.`
};
// ───────────────────────── CULTURA ─────────────────────────
RAW.CUL = {
tit: `Abre el museo de objetos que se fueron flotando|Museum of things that floated away opens
Una ópera en gravedad cero: el tenor flota|Zero-g opera: the tenor floats
El cine del cráter estrena tres películas|Crater cinema opens three new films
Récord de lectores en la biblioteca orbital|Record readers at the orbital library
Un cuadro hecho con polvo de estrellas|A painting made of stardust
La orquesta afina con un cometa|Orchestra tunes up to a comet
Festival de danza sin suelo|Dance festival with no floor
Gana el premio un poema de tres palabras|Three-word poem wins the prize
El teatro de títeres llega a Titán|Puppet theater arrives on Titan
Una novela escrita por toda la colonia|A novel written by the whole colony
Exposición de cascos pintados a mano|Exhibition of hand-painted helmets
El coro de robots canta en cuatro voces|Robot choir sings in four parts
Abren una escuela de baile lunar|Moon dance school opens
Reaparece un disco perdido de 2051|Lost record from 2051 resurfaces
La feria del libro bate su récord|Book fair breaks its record
Museo nuevo: el primer tornillo de la colonia|New museum: the colony's first screw
Concierto al aire libre... con casco|Open-air concert, helmets on
Un mural de 200 metros en el anillo|A 200-meter mural on the ring
Estreno: comedia sobre una nave perdida|Premiere: a comedy about a lost ship
La radio de la colonia cumple tres años|Colony radio turns three`,
nota: `Abre el museo de lo que se fue flotando|Hay llaves, gorras, un sándwich histórico y {o}.|Museum of floating losses opens|There are keys, caps, a historic sandwich and {o}.
Ópera sin gravedad: el tenor sube|El último acto se cantó desde el techo. Ovación de pie y de cabeza.|Opera without gravity: the tenor rises|The last act was sung from the ceiling. A standing, and upside-down, ovation.
Tres estrenos en el cine del cráter|La función de medianoche de {l} se agotó en una hora.|Three premieres at the crater cinema|The midnight show in {l} sold out in an hour.
La biblioteca orbital, llena|{n} lectores pasaron en un día. Lo más pedido: guías de jardinería.|The orbital library is full|{n} readers came in one day. Most wanted: gardening guides.
Pintar con polvo de estrellas|La artista tardó un año en juntar el material. Brilla de noche.|Painting with stardust|The artist spent a year collecting it. It glows at night.
La orquesta afina con un cometa|El cometa pasa en la nota la y la orquesta no lo dejó escapar.|The orchestra tunes to a comet|The comet passes on an A, and the orchestra didn't miss it.
Danza sin suelo en {l}|Los bailarines giran en el aire y el público también, un poco.|Floorless dance in {l}|Dancers spin in the air, and so does the audience, a little.
Un poema de tres palabras, premiado|«Mira. Arriba. Casa.» El jurado lloró en silencio.|A three-word poem wins|"Look. Up. Home." The jury wept quietly.
Los títeres llegan a Titán|La obra cuenta la historia de una antena que quería ser árbol.|Puppets arrive on Titan|The play tells the story of an antenna that wanted to be a tree.
Una novela de toda la colonia|Cada vecino escribió una línea. {P} escribió el final.|A novel by the whole colony|Every resident wrote one line. {P} wrote the ending.
Cascos pintados a mano|Más de {n} cascos decorados llenan la galería de {l}.|Hand-painted helmets|More than {n} decorated helmets fill the gallery in {l}.
Un coro de robots a cuatro voces|Los sopranos se recalientan, pero el público pidió otra.|A four-part robot choir|The sopranos overheat, but the crowd asked for an encore.
Escuela de baile lunar|Primera lección: no saltar demasiado alto.|A moon dance school|Lesson one: don't jump too high.
Aparece un disco perdido de 2051|Lo encontraron en una caja de {l} junto a {o}.|A lost 2051 record turns up|It was found in a box in {l}, next to {o}.
Récord en la feria del libro|Los puestos de ciencia ficción se quedaron sin ejemplares.|Book fair sets a record|Science fiction stalls sold out.
El primer tornillo, en una vitrina|Lo colocó {p} el día uno. Ahora tiene su propio museo.|The first screw, in a display case|{P} fixed it on day one. Now it has its own museum.
Concierto al aire libre con casco|La música llegó por radio a cada traje. Nadie se perdió una nota.|Open-air concert in helmets|Music reached every suit by radio. Nobody missed a note.
Un mural que da vuelta al anillo|Tiene 200 metros y cuenta la historia de la colonia.|A mural that circles the ring|It's 200 meters long and tells the colony's story.
Comedia sobre una nave perdida|La nave nunca se perdió: solo tenía el mapa al revés.|A comedy about a lost ship|The ship was never lost; the map was upside down.
La radio de la colonia cumple tres años|La festejó con 24 horas de canciones pedidas por los oyentes.|Colony radio turns three|It celebrated with 24 hours of listener requests.`,
col: `Museo de lo perdido|Todo lo que flota, vuelve.|Museum of lost things|Everything that floats comes back.
Ópera en el techo|Cantar de cabeza tiene su encanto.|Opera on the ceiling|Singing upside down has its charm.
Cine de cráter|La mejor pantalla, el cielo.|Crater cinema|The best screen is the sky.
Leer en órbita|Las páginas pasan solas.|Reading in orbit|The pages turn themselves.
Polvo de estrellas|Arte que brilla de noche.|Stardust|Art that glows at night.
Afinar con cometas|La nota la pasa cada 80 años.|Tuning with comets|The A note passes every 80 years.
Bailar sin suelo|El ritmo no necesita piso.|Dancing without a floor|Rhythm doesn't need ground.
Poesía breve|Tres palabras bastan.|Brief poetry|Three words are enough.
Títeres en Titán|Antenas que sueñan.|Puppets on Titan|Antennas that dream.
Novela colectiva|Una línea por vecino.|A collective novel|One line per resident.
Cascos con arte|Cada traje, una firma.|Helmets as art|Every suit has a signature.
Coros metálicos|Afinados, pero calientes.|Metal choirs|In tune, but hot.
Baile lunar|Saltar poco, girar mucho.|Moon dance|Jump little, spin a lot.
Discos perdidos|La música siempre aparece.|Lost records|Music always turns up.
Feria del libro|Ciencia ficción agotada.|The book fair|Science fiction sold out.
El primer tornillo|Una pieza pequeña, una gran historia.|The first screw|A small part, a big story.
Música por radio|Un concierto en cada casco.|Music by radio|A concert in every helmet.
Murales largos|200 metros de memoria.|Long murals|200 meters of memory.
Risas a bordo|Perderse también es un arte.|Laughs on board|Getting lost is an art too.
Tres años al aire|La radio que nos acompaña.|Three years on air|The radio that keeps us company.`,
breve: `Objetos en el museo|{n}|Objects in the museum|{n}
Minutos de ovación|{n}|Minutes of applause|{n}
Estrenos de la semana|3|Premieres this week|3
Lectores en un día|{n}|Readers in one day|{n}
Cuadros que brillan|{n}|Paintings that glow|{n}
Bailarines en el aire|{n}|Dancers in the air|{n}
Palabras del poema|3|Words in the poem|3
Funciones de títeres|{n}|Puppet shows|{n}
Líneas de la novela|{n}|Lines in the novel|{n}
Cascos pintados|{n}|Painted helmets|{n}
Voces del coro|4|Choir parts|4
Alumnos de baile|{n}|Dance students|{n}
Discos de 2051|1|Records from 2051|1
Libros vendidos|{n}|Books sold|{n}
Tornillos en vitrina|1|Screws on display|1
Metros de mural|200|Meters of mural|200
Años de radio|3|Years of radio|3
Canciones pedidas|{n}|Songs requested|{n}
Butacas del cine|{n}|Cinema seats|{n}
Museos nuevos|2|New museums|2`,
foto: `{P} recorre el museo de lo perdido.|{P} tours the museum of floating losses.
El tenor, en el último acto, cerca del techo.|The tenor in the final act, near the ceiling.
El mural del anillo, en su tramo más colorido.|The ring mural at its most colorful stretch.
Cascos pintados en la galería de {l}.|Painted helmets at the {l} gallery.
El coro de robots, antes de recalentarse.|The robot choir before overheating.
La fila para el cine del cráter.|The queue for the crater cinema.
Títeres de la obra de la antena soñadora.|Puppets from the dreaming antenna play.
{P} lee el final de la novela colectiva.|{P} reads the last line of the colony novel.`
};
// ───────────────────────── SOCIEDAD ─────────────────────────
RAW.SOC = {
tit: `Nace la vaca número mil en órbita|Cow no. 1,000 born in orbit
Una pareja se casa en plena caminata espacial|Couple weds during a spacewalk
El barrio Ganímedes estrena plaza con césped|Ganymede Quarter opens a park with grass
Vecinos organizan la primera feria de trueque|Residents hold the first swap fair
Récord de mascotas: un asteroide con collar|Pet record: an asteroid on a leash
Abre una guardería con gravedad suave|Soft-gravity nursery opens
La colonia celebra su tercer aniversario|The colony celebrates its third birthday
Encuentran al gato que se escondió en la antena|Cat hiding in the antenna found
El club de abuelos aprende a pilotar|Grandparents' club learns to fly ships
Mudanza masiva al anillo norte|Mass move to the north ring
Una cena para mil en el comedor del domo|Dinner for a thousand in the dome hall
Clases de cocina sin migas flotantes|Cooking classes with no floating crumbs
La escuela suma un recreo de gravedad cero|School adds a zero-g recess
Vuelve el mercado de pulgas del puerto|Port flea market is back
Récord de voluntarios para limpiar el cráter|Record volunteers clean the crater
Un perro aprende a usar el traje solo|Dog learns to put on its own suit
Los vecinos eligen el nombre de la nueva calle|Residents choose the new street's name
Fiesta en el anillo hasta el amanecer|Ring party lasts until sunrise
Primer día de clases para cien niños|First day of school for a hundred kids
Abre la lavandería que pliega la ropa sola|Self-folding laundry opens`,
nota: `La vaca mil ya flota en el establo|Se llama Estrella y da leche con burbujas. {P} la bautizó.|Cow number 1,000 floats in the barn|Her name is Star and her milk has bubbles. {P} named her.
Boda en plena caminata espacial|Los anillos se pasaron de casco a casco. Nadie soltó el cable.|A wedding on a spacewalk|The rings went from helmet to helmet. Nobody let go of the line.
Una plaza con césped en {l}|Los niños tocan césped por primera vez y no quieren volver a casa.|A park with grass in {l}|Kids are touching grass for the first time and won't go home.
Primera feria de trueque|Se cambiaron {n} objetos. El más pedido: {o}.|The first swap fair|{n} items were swapped. Most wanted: {o}.
El asteroide mascota tiene collar|Su dueña lo pasea cada tarde por la órbita baja.|The pet asteroid gets a collar|Its owner walks it every afternoon in low orbit.
Guardería con gravedad suave|Los bebés aprenden a caminar a la mitad de su peso.|A soft-gravity nursery|Babies learn to walk at half their weight.
La colonia cumple tres años|{P} sopló las velas, que en el espacio no se apagan.|The colony turns three|{P} blew out the candles, which don't go out in space.
El gato de la antena, a salvo|Pasó dos días arriba. Bajó solo cuando oyó la lata de atún.|The antenna cat is safe|It spent two days up there and came down at the sound of a tuna can.
Abuelos al mando de la nave|El club de {l} aprobó el curso de pilotaje con notas altas.|Grandparents at the controls|The {l} club passed the piloting course with high marks.
Mudanza al anillo norte|Cientos de familias se mudan por la vista y el silencio.|Moving to the north ring|Hundreds of families are moving for the view and the quiet.
Cena para mil en el domo|Hubo sopa de algas, pan de cráter y un postre que flotó.|Dinner for a thousand in the dome|There was algae soup, crater bread and a dessert that floated.
Cocinar sin migas flotantes|El secreto, según {p}, es cortar despacio.|Cooking without floating crumbs|The secret, says {p}, is to slice slowly.
Recreo de gravedad cero|Diez minutos de vuelo libre entre clase y clase.|A zero-g recess|Ten minutes of free flight between lessons.
Vuelve el mercado de pulgas|Los puestos de {l} venden de todo, menos pulgas.|The flea market is back|Stalls in {l} sell everything except fleas.
Voluntarios limpian el cráter|{n} vecinos juntaron basura espacial durante todo el sábado.|Volunteers clean the crater|{n} residents collected space junk all Saturday.
Un perro que se pone el traje solo|Lo aprendió mirando a su dueño. Tarda menos que él.|A dog that suits up on its own|It learned by watching its owner. It's faster than him.
La calle nueva ya tiene nombre|Ganó «Calle del Primer Café» por {n} votos.|The new street has a name|"First Coffee Street" won by {n} votes.
Fiesta en el anillo hasta el amanecer|El amanecer llegó a las 4. La fiesta siguió hasta el siguiente.|Ring party until sunrise|Sunrise came at 4. The party went on until the next one.
Primer día de clases para cien niños|La maestra de {l} les enseñó a abrocharse el casco.|First day of school for a hundred kids|The {l} teacher showed them how to fasten their helmets.
La ropa se pliega sola|La lavandería nueva usa un truco: un poco de gravedad y paciencia.|Laundry that folds itself|The new laundry uses a trick: a little gravity and patience.`,
col: `La vaca Estrella|Leche con burbujas, sabor a futuro.|Star the cow|Bubbly milk with a taste of the future.
Bodas en el vacío|Sí, quiero, con casco.|Weddings in the void|"I do," in a helmet.
Césped por primera vez|Tocar el suelo también es aprender.|Grass for the first time|Touching the ground is learning too.
Trueque vecinal|Lo que sobra en una casa falta en otra.|Neighborly swaps|What one home has spare, another needs.
Mascotas raras|Un asteroide también necesita paseo.|Unusual pets|An asteroid needs walks too.
Crecer liviano|Los bebés de la colonia vuelan antes de caminar.|Growing up light|Colony babies fly before they walk.
Tres años juntos|Una colonia que aprendió a ser barrio.|Three years together|A colony that learned to be a neighborhood.
Gatos aventureros|La antena era su mirador.|Adventurous cats|The antenna was its lookout.
Abuelos pilotos|La experiencia también despega.|Grandparent pilots|Experience takes off too.
Mudarse al norte|Más silencio, más estrellas.|Moving north|More quiet, more stars.
Mesa para mil|Comer juntos sigue siendo lo mejor.|A table for a thousand|Eating together is still the best.
Cocina ordenada|Cortar despacio, comer tranquilo.|Tidy cooking|Slice slowly, eat calmly.
Recreo volador|Diez minutos que valen el día.|Flying recess|Ten minutes that make the day.
Pulgas sin pulgas|El mercado que nunca decepciona.|Flea-free flea market|The market that never disappoints.
Cráter limpio|Un sábado bien aprovechado.|A clean crater|A Saturday well spent.
Perros listos|Ponerse el traje es cosa de todos.|Clever dogs|Suiting up is everyone's job.
Nombres de calle|El café ganó por goleada.|Street names|Coffee won by a landslide.
Fiestas largas|Dos amaneceres, una sola fiesta.|Long parties|Two sunrises, one party.
Primer día|Mochila, casco y muchas preguntas.|First day|Backpack, helmet and lots of questions.
Ropa doblada|La mejor noticia de la semana.|Folded laundry|The best news of the week.`,
breve: `Vacas en órbita|1.000|Cows in orbit|1,000
Bodas espaciales|{n}|Space weddings|{n}
Metros de césped|{n}|Meters of grass|{n}
Objetos cambiados|{n}|Items swapped|{n}
Asteroides mascota|{n}|Pet asteroids|{n}
Bebés en la guardería|{n}|Babies at the nursery|{n}
Años de la colonia|3|Colony years|3
Días del gato arriba|2|Days the cat stayed up|2
Abuelos con licencia|{n}|Licensed grandparents|{n}
Familias al anillo norte|{n}|Families to the north ring|{n}
Platos servidos|1.000|Plates served|1,000
Migas flotantes|0|Floating crumbs|0
Minutos de recreo|10|Minutes of recess|10
Puestos del mercado|{n}|Market stalls|{n}
Voluntarios del cráter|{n}|Crater volunteers|{n}
Perros con traje|{n}|Dogs in suits|{n}
Votos por el café|{n}|Votes for coffee|{n}
Amaneceres de fiesta|2|Party sunrises|2
Niños en la escuela|100|Kids at school|100
Prendas plegadas|{n}|Clothes folded|{n}`,
foto: `{P} junto a la vaca Estrella.|{P} with Star the cow.
Los novios, durante la caminata espacial.|The couple during the spacewalk.
Niños en la nueva plaza de {l}.|Children in the new park in {l}.
El gato de la antena, ya en brazos de su dueña.|The antenna cat, back in its owner's arms.
La cena para mil, en el comedor del domo.|Dinner for a thousand in the dome hall.
Voluntarios con bolsas en el borde del cráter.|Volunteers with bags on the crater rim.
{P} corta la cinta de la guardería.|{P} cuts the ribbon at the nursery.
El perro que se pone el traje, listo para salir.|The dog that suits up, ready to go.`
};
// ───────────────────────── CLIMA ESPACIAL ─────────────────────────
RAW.CLI = {
tit: `Lluvia de meteoritos el jueves: lleva casco|Meteor shower Thursday: bring a helmet
Tormenta solar: apaga tus antenas a las 18|Solar storm: switch off antennas at 6 p.m.
Llega la estación de las auroras violetas|Violet aurora season arrives
Ola de frío: −180 grados en la cara oculta|Cold snap: −180 degrees on the far side
Polvo de cráter: se esperan ráfagas fuertes|Crater dust: strong gusts expected
Eclipse total el sábado a las 10|Total eclipse on Saturday at 10
Viento solar suave toda la semana|Gentle solar wind all week
Alerta: un cometa pasará muy cerca|Alert: a comet will pass very close
Cielo despejado para mirar los anillos|Clear skies for ring watching
Granizo de hielo de cometa en el puerto|Comet hail at the port
La noche más larga del año dura 9 días|Longest night of the year lasts 9 days
Se espera un amanecer doble el domingo|Double sunrise expected on Sunday
Calor récord en el lado diurno|Record heat on the day side
Pronóstico: nubes de polvo hasta el lunes|Forecast: dust clouds until Monday
Aurora cian sobre el barrio Ganímedes|Cyan aurora over Ganymede Quarter
Tormenta magnética desordena las brújulas|Magnetic storm scrambles compasses
Llega el invierno orbital: abrígate|Orbital winter is here: wrap up warm
Nieve de metano en las montañas|Methane snow in the mountains
Un rayo cósmico ilumina el puerto|Cosmic ray lights up the port
Calma total: ni un meteorito en 30 días|Total calm: no meteors for 30 days`,
nota: `Meteoritos el jueves: casco y paraguas|La lluvia será de tamaño grano de arroz. Mejor no salir sin protección.|Meteors on Thursday: helmet and umbrella|They'll be rice-sized. Better not to go out unprotected.
Tormenta solar: antenas apagadas|Desde las 18, {l} quedará sin señal por dos horas.|Solar storm: antennas off|From 6 p.m., {l} will be without signal for two hours.
Empiezan las auroras violetas|Se verán mejor desde {l}, sobre todo después de medianoche.|Violet auroras begin|Best seen from {l}, especially after midnight.
Frío extremo en la cara oculta|{P} recomienda doble traje y sopa caliente.|Extreme cold on the far side|{P} recommends a double suit and hot soup.
Ráfagas de polvo de cráter|Cierren escotillas y guarden lo que pueda volar, incluido {o}.|Crater dust gusts|Close hatches and stow anything that can fly off, including {o}.
Eclipse total el sábado|Durará siete minutos. Los grillos del invernadero dejarán de cantar.|Total eclipse on Saturday|It will last seven minutes. The greenhouse crickets will go quiet.
Semana de viento solar suave|Ideal para tender la ropa en la terraza de {l}.|A week of gentle solar wind|Perfect for hanging laundry on the {l} terrace.
Un cometa pasará muy cerca|Se verá a simple vista. {P} pidió que nadie intente tocarlo.|A comet will pass very close|It will be visible to the naked eye. {P} asked everyone not to touch it.
Cielo limpio para ver los anillos|Esta noche no habrá polvo ni nubes sobre {l}.|Clear skies for the rings|No dust or clouds over {l} tonight.
Granizo de hielo de cometa|Cayeron bloques del tamaño de un dado. Los niños los coleccionan.|Comet ice hail|Dice-sized chunks fell. Kids are collecting them.
La noche que dura nueve días|Las farolas de {l} trabajarán horas extra.|The nine-day night|Streetlights in {l} will work overtime.
Dos amaneceres el domingo|El sol saldrá dos veces por un efecto de los anillos. Pon dos alarmas.|Two sunrises on Sunday|The sun will rise twice thanks to the rings. Set two alarms.
Calor récord en el lado diurno|Se recomienda viajar de noche y llevar agua de hielo.|Record heat on the day side|Travel at night and carry ice water.
Nubes de polvo hasta el lunes|Los vuelos desde {l} podrían retrasarse.|Dust clouds until Monday|Flights from {l} may be delayed.
Aurora cian sobre los tejados|Los vecinos salieron en pijama para verla mejor.|Cyan aurora over the rooftops|Residents came out in pajamas for a better look.
Las brújulas, desorientadas|Durante la tormenta magnética, el norte quedó un poco al este.|Compasses lose their way|During the magnetic storm, north drifted a bit east.
Comienza el invierno orbital|{P} aconseja revisar la calefacción del traje.|Orbital winter begins|{P} advises checking your suit heater.
Nieve de metano en las cumbres|Es preciosa, pero no sirve para hacer muñecos.|Methane snow on the peaks|It's beautiful, but no good for snowmen.
Un rayo cósmico ilumina el puerto|Duró un segundo y dejó a todos sin palabras.|A cosmic ray lights up the port|It lasted a second and left everyone speechless.
Treinta días sin meteoritos|Los techos de {l} descansan. Los paraguas, también.|Thirty days without meteors|The roofs of {l} get a rest. So do the umbrellas.`,
col: `Paraguas de metal|El accesorio del jueves.|Metal umbrellas|Thursday's must-have.
Antenas en pausa|Dos horas sin señal, un respiro.|Antennas on pause|Two hours offline, a breather.
Auroras violetas|El cielo se pone de gala.|Violet auroras|The sky dresses up.
Frío de verdad|−180 grados no perdonan.|Real cold|−180 degrees shows no mercy.
Polvo en el aire|Cierra la escotilla, por si acaso.|Dust in the air|Close the hatch, just in case.
Siete minutos de noche|El eclipse calla a los grillos.|Seven minutes of night|The eclipse silences the crickets.
Viento amable|Buen día para tender la ropa.|A kind wind|A good day to hang laundry.
Cometa de visita|Mirar sí, tocar no.|A visiting comet|Look, but don't touch.
Anillos a la vista|Noche limpia, cielo generoso.|Rings in sight|Clear night, generous sky.
Granizo coleccionable|Cada dado es un tesoro.|Collectible hail|Every chunk is a treasure.
Noches largas|Nueve días para soñar.|Long nights|Nine days to dream.
Doble amanecer|Dos alarmas, un solo café.|Double sunrise|Two alarms, one coffee.
Lado caliente|Viaja de noche.|The hot side|Travel by night.
Nubes de polvo|Los vuelos, con paciencia.|Dust clouds|Flights need patience.
Aurora cian|En pijama, mirando arriba.|Cyan aurora|In pajamas, looking up.
Norte movedizo|Las brújulas también dudan.|Shifting north|Compasses have doubts too.
Invierno orbital|Revisa la calefacción.|Orbital winter|Check your heater.
Nieve rara|Bonita, pero no sirve para jugar.|Strange snow|Pretty but useless for play.
Un segundo de luz|El rayo que nadie olvidará.|One second of light|The ray no one will forget.
Calma espacial|Treinta días de techos tranquilos.|Space calm|Thirty days of quiet roofs.`,
breve: `Meteoritos por hora|{n}|Meteors per hour|{n}
Horas sin antena|2|Hours without antennas|2
Noches de aurora|{n}|Aurora nights|{n}
Grados en la cara oculta|−180|Degrees on the far side|−180
Ráfagas de polvo|{n}|Dust gusts|{n}
Minutos de eclipse|7|Minutes of eclipse|7
Viento solar|suave|Solar wind|gentle
Kilómetros al cometa|{n}|Kilometers to the comet|{n}
Nubes esta noche|0|Clouds tonight|0
Granizos coleccionados|{n}|Hailstones collected|{n}
Días de noche|9|Days of night|9
Amaneceres del domingo|2|Sunday sunrises|2
Grados en el lado diurno|120|Degrees on the day side|120
Vuelos retrasados|{n}|Flights delayed|{n}
Grados que se movió el norte|{n}|Degrees north shifted|{n}
Capas de traje sugeridas|2|Suit layers advised|2
Centímetros de nieve|{n}|Centimeters of snow|{n}
Segundos de rayo|1|Seconds of lightning|1
Días sin meteoritos|30|Days without meteors|30
Alertas de la semana|{n}|Alerts this week|{n}`,
foto: `La aurora violeta sobre {l}.|The violet aurora over {l}.
Vecinos con paraguas de metal, el jueves.|Residents with metal umbrellas on Thursday.
El cometa, visto desde el puerto.|The comet seen from the port.
{P} explica el pronóstico de la semana.|{P} explains this week's forecast.
El eclipse, a las 10 en punto.|The eclipse at 10 o'clock sharp.
Granizo de cometa en el muelle de {l}.|Comet hail on the {l} dock.
Nieve de metano en las cumbres.|Methane snow on the peaks.
El doble amanecer sobre los anillos.|The double sunrise over the rings.`
};

// ───────────────────────── PUBLICIDAD ─────────────────────────
const PUB = `¿Tu nave hace ruidos raros? Taller Nébula, abierto 25 horas|Ship making weird noises? Nebula Garage, open 25 hours
Cascos Brillo: ve las estrellas, no las rayas|Brillo Helmets: see stars, not scratches
Algas Doña Rita: frescas desde el tanque|Aunt Rita's Algae: fresh from the tank
Mudanzas Orbitales: llevamos hasta tu gato|Orbital Movers: we even bring the cat
Café Órbita: despierta a cualquier hora del día solar|Orbit Coffee: wake up at any solar hour
Seguros Asteroide: por si llueve en serio|Asteroid Insurance: for when it really rains
Academia Pilotos: aprende en 10 órbitas|Pilot Academy: learn in 10 orbits
Panadería del Cráter: pan que no flota|Crater Bakery: bread that stays put
Trajes Kepler: talla única para todo el sistema|Kepler Suits: one size fits the system
Gimnasio Gravedad: entrena con peso de verdad|Gravity Gym: train with real weight
Hotel Anillo: vista a Saturno sin costo extra|Ring Hotel: Saturn view at no extra cost
Óptica Cometa: ve más lejos|Comet Optics: see farther
Lavandería Plegada: tu ropa, lista y doblada|Folded Laundry: your clothes, done and folded
Cine Cráter: estreno cada martes|Crater Cinema: new films every Tuesday
Jardines Lunares: semillas que sí crecen|Moon Gardens: seeds that actually grow
Relojes Eclipse: puntuales incluso a oscuras|Eclipse Watches: on time even in the dark
Tienda de Imanes: para que nada se escape|Magnet Shop: so nothing gets away
Escuela de Idiomas: habla con cualquier colonia|Language School: talk to any colony
Pizzería Gravedad: la mozzarella no se escapa|Gravity Pizza: the cheese stays on
Agencia Viajes Lejos: escápate a la cara oculta|Far Away Travel: escape to the far side
Antenas Rumbo: señal clara aunque haya tormenta|Rumbo Antennas: clear signal, storm or not
Heladería Polo: el helado más frío del sistema|Pole Ice Cream: the coldest in the system
Baterías Siempre: energía para tres eclipses|Always Batteries: power for three eclipses
Muebles Ancla: no se mueven de su lugar|Anchor Furniture: they stay where you put them
Clínica Sonrisa: dentistas sin gravedad|Smile Clinic: zero-g dentists
Floristería Polvo de Estrella: flores que brillan|Stardust Florist: flowers that glow
Taller de Robots Pepa: arreglamos bostezos|Pepa's Robot Repair: we fix yawns
Mercado Noche: abierto mientras dure la noche|Night Market: open as long as night lasts
Bicicletas Cráter: subidas sin sufrir|Crater Bikes: climbs without the pain
Biblioteca Orbital: libros que no se van flotando|Orbital Library: books that don't float off
Peluquería Cero G: peinados que se sostienen|Zero G Salon: hairstyles that hold
Zapatos Imán: camina sin despegarte|Magnet Shoes: walk without lifting off
Radio Colonia: la música que te acompaña|Colony Radio: music that keeps you company
Tés del Anillo: calma en cada taza|Ring Teas: calm in every cup
Mascotas Felices: collares para asteroides|Happy Pets: collars for asteroids
Banco Gravedad: tus ahorros, en su sitio|Gravity Bank: your savings stay put
Pinturas Aurora: colores del cielo para tu casa|Aurora Paints: sky colors for your home
Juguetería Saturno: anillos para jugar|Saturn Toys: rings to play with
Fotos Sonda: retratos con fondo galáctico|Probe Photos: portraits with a galaxy backdrop
Paraguas de Metal Tito: listos para el jueves|Tito's Metal Umbrellas: ready for Thursday`;
const CLAS = `Vendo tostadora gravitacional, poco uso|For sale: gravity toaster, barely used
Busco compañero de nave, ruta Titán|Seeking shipmate, Titan route
Regalo cachorro de cometa, muy cariñoso|Free to a good home: comet pup
Clases de baile lunar, primera gratis|Moon dance lessons, first one free
Se alquila vivienda con vista al anillo|Home for rent with a ring view
Perdí un calcetín flotando. Recompensa|Lost: one floating sock. Reward
Compro discos de 2051|Buying records from 2051
Reparo cascos a domicilio|Helmet repair, we come to you
Se busca gato que vive en la antena|Wanted: cat who lives in the antenna
Cambio calabaza lunar por café|Will swap moon pumpkin for coffee
Clases de pilotaje para abuelos|Piloting lessons for grandparents
Vendo paraguas de metal, casi nuevo|For sale: metal umbrella, like new
Se ofrece robot para cuidar plantas|Robot available to water plants
Busco banda para tocar en el anillo|Band wanted for ring gigs
Alquilo telescopio por noches|Telescope for rent by the night
Clases de cocina sin migas|Crumb-free cooking classes
Vendo traje talla única, color cian|For sale: one-size suit, cyan
Busco vecino para compartir oxígeno|Seeking neighbor to share oxygen
Se arreglan relojes adelantados|Fast clocks fixed
Regalo ladrillos de cráter|Free crater bricks
Taller de títeres para niños|Puppet workshop for kids
Cuido mascotas durante el eclipse|Pet sitting during the eclipse
Vendo mapa de la cara oculta|For sale: map of the far side
Busco imán para calcetines|Wanted: sock magnet
Clases de natación en burbuja|Bubble swimming lessons
Compro cascos pintados a mano|Buying hand-painted helmets
Se alquila amarre orbital para naves|Orbital parking spot for rent
Busco quien escriba la línea 1.001|Wanted: writer for line 1,001
Vendo entradas para el clásico|Derby tickets for sale
Ofrezco paseos de asteroides mascota|Pet asteroid walking service`;

// ───────────────────────── armado ─────────────────────────
const SECS = ['POL', 'ECO', 'DEP', 'CIE', 'CUL', 'SOC', 'CLI'];
const lines = s => s.split('\n').map(x => x.trim()).filter(Boolean).map(x => x.split('|'));
const text = { tit: {}, nota: {}, col: {}, breve: {} }, foto = {};
SECS.forEach(s => {
  ['tit', 'nota', 'col', 'breve'].forEach(k => { text[k][s] = lines(RAW[s][k]); });
  foto[s] = lines(RAW[s].foto);
});
// viñetas de fotos (ver art.js): índice → dibujo
const ILL = { POL: [0, 1, 2, 7], ECO: [3, 4, 5, 14], DEP: [6, 8, 9, 7], CIE: [10, 11, 12, 13, 7], CUL: [15, 1, 14, 7], SOC: [8, 2, 5, 7], CLI: [11, 13, 12, 10] };

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function fill(str, sl, lang) {
  if (!str) return '';
  sl = sl || { l: 0, p: 0, e: 0, o: 0, n: 7 };
  const L = lang === 'en' ? 'en' : 'es';
  const num = n => (L === 'es' ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  let out = str.replace(/\{([lpeonLPEO])\}/g, (m, k) => {
    if (k === 'n') return num(sl.n);
    const low = k.toLowerCase(), v = SLOTS[low][L][sl[low] % SLOTS[low][L].length];
    return k === low ? v : cap(v);
  });
  return cap(out);
}
/** Texto de una pieza: {h: título, d: bajada, f: cifra} */
function pieceText(p, lang) {
  const en = lang === 'en';
  if (p.t === 'excl') return en ? { h: 'EXCLUSIVE', d: 'The story every paper wanted. Only you have it.' } : { h: 'EXCLUSIVA', d: 'La noticia que todos querían. Solo la tienes tú.' };
  if (p.t === 'pub') { const r = PUB_L[p.tx % PUB_L.length]; return { h: fill(en ? r[1] : r[0], p.sl, lang) }; }
  if (p.t === 'clas') { const r = CLAS_L[p.tx % CLAS_L.length]; return { h: fill(en ? r[1] : r[0], p.sl, lang) }; }
  if (p.t === 'foto') { const r = foto[p.sec][p.tx % foto[p.sec].length]; return { h: fill(en ? r[1] : r[0], p.sl, lang) }; }
  const pool = text[p.t][p.sec], r = pool[p.tx % pool.length];
  if (p.t === 'tit') return { h: fill(en ? r[1] : r[0], p.sl, lang) };
  if (p.t === 'breve') return { h: fill(en ? r[2] : r[0], p.sl, lang), f: fill(en ? r[3] : r[1], p.sl, lang) };
  return { h: fill(en ? r[2] : r[0], p.sl, lang), d: fill(en ? r[3] : r[1], p.sl, lang) };
}
const PUB_L = lines(PUB), CLAS_L = lines(CLAS);
G.PortadaContent = {
  SLOTS, text, foto, ill: ILL, pub: PUB_L, clas: CLAS_L, fill, pieceText,
  slotSizes() { return { l: SLOTS.l.es.length, p: SLOTS.p.es.length, e: SLOTS.e.es.length, o: SLOTS.o.es.length }; }
};
delete G.__PORTADA_RAW; delete G.__PORTADA_SLOTS;
})(typeof window !== 'undefined' ? window : globalThis);
