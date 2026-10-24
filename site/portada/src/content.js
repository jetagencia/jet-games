/* JET//Portada · contenido: noticias inventadas de la colonia (ES neutro de tú / EN neutro).
   Formatos por línea:  tit/foto/pub/clas: «es|en» · nota/col: «títuloES|bajadaES|títuloEN|bajadaEN» · breve: «textoES|cifraES|textoEN|cifraEN».
   Huecos: {l} lugar, {p} persona, {e} equipo, {o} objeto, {n} número. */
(function (G) {
'use strict';
const SLOTS = {
  l: { es: ['Colonia Kepler', 'Puerto Titán', 'Valle Olympus', 'Estación Ciruela', 'Cráter Esperanza', 'Barrio Ganímedes', 'Villa Encélado'],
       en: ['Kepler Colony', 'Titan Port', 'Olympus Valley', 'Plum Station', 'Hope Crater', 'Ganymede Quarter', 'Enceladus Village'] },
  p: { es: ['la capitana Odalys Brum', 'el ministro Teo Varela', 'la doctora Inés Quark', 'el chef Rómulo Tang', 'la alcaldesa Mila Ferro', 'el robot K-9 Ramos'],
       en: ['Captain Odalys Brum', 'Minister Teo Varela', 'Dr. Ines Quark', 'Chef Romulo Tang', 'Mayor Mila Ferro', 'the robot K-9 Ramos'] },
  e: { es: ['Real Fobos', 'Atlético Ceres', 'Unión Calisto', 'Deportivo Tritón'],
       en: ['Phobos United', 'Ceres Athletic', 'Callisto Union', 'Triton Sporting'] },
  o: { es: ['la tostadora gravitacional', 'el asteroide mascota', 'la calabaza lunar', 'el cometa doméstico'],
       en: ['the gravity toaster', 'the pet asteroid', 'the moon pumpkin', 'the house comet'] }
};

const RAW = {};
// ───────────────────────── POLÍTICA ─────────────────────────
RAW.POL = {
tit: `El Senado vota a oscuras: falló la cúpula|Senate votes in the dark as the dome fails
Nueva ley: prohibido silbar en la escotilla|New law bans whistling in the airlock
La alcaldía promete gravedad para todos|City hall promises gravity for everyone
Seis horas de debate por el color del domo|Six-hour debate over the color of the dome
El Consejo aprueba el lunes de cuatro horas|Council approves the four-hour Monday
Votación récord: 99 % a favor de la siesta|Record vote: 99% back the afternoon nap
Un ministro jura el cargo en gravedad cero|Minister sworn in at zero gravity
Eligen al primer robot concejal|First robot elected to the council
Acuerdo histórico entre Titán y Encélado|Historic deal between Titan and Enceladus
La oposición pide más ventanas al espacio|Opposition calls for more windows to space
Referéndum: ¿el himno será un pitido?|Referendum: should the anthem be a beep?
El Parlamento flota tras un fallo del imán|Parliament floats off after magnet mishap
La cumbre de colonias acaba en abrazo grupal|Colony summit ends in a group hug
Nuevo impuesto a los meteoritos de jardín|New tax on garden meteorites
Inauguran el primer semáforo para naves|First traffic light for spaceships opens
Ley del silencio: nada de ruido tras el ocaso|Quiet law: no noise after sunset
El presupuesto cabe, por fin, en una hoja|The budget finally fits on one page
Un eclipse interrumpe el debate de candidatos|Eclipse cuts the candidates' debate short
Aprueban el derecho a mirar las estrellas|Right to stargaze becomes law
Concejales votan sin quitarse el traje|Councillors vote without taking off suits`,
nota: `La cúpula se apagó en plena votación|El recuento siguió con linternas y nadie sabe todavía quién votó dos veces.|Dome lights fail mid-vote|The count went on by flashlight, and no one knows yet who voted twice.
Ley de escotillas: se acabó silbar|{P} defendió la norma: «el eco dura tres días».|Airlock law: no more whistling|{P} defended the rule: "the echo lasts three days."
Gravedad para todos, promete la alcaldía|El plan empieza en {l} y sigue por los barrios que más flotan.|City hall promises gravity for all|The plan starts in {l} and moves on to the floatiest districts.
El color del domo divide al Consejo|Unos quieren violeta, otros cian. Se votará otra vez el jueves.|Dome color splits the council|Some want violet, others cyan. They vote again on Thursday.
Nace el lunes de cuatro horas|La medida se probará en {l} durante un mes, o hasta el martes.|The four-hour Monday is born|The measure will be tested in {l} for a month, or until Tuesday.
La siesta ya es ley en toda la colonia|Rige de 14 a 15. Los relojes darán un bostezo para avisar.|The nap is now law colony-wide|From 2 to 3 p.m. Clocks will yawn to let everyone know.
Primer robot concejal: «Soy de todos»|{P} juró con su antena en alto y pidió enchufes en cada plaza.|First robot councillor: "I serve all"|{P} took the oath, antenna raised, and asked for plugs in every square.
Titán y Encélado firman la paz del hielo|El acuerdo reparte los cubitos por partes iguales hasta 2030.|Titan and Enceladus sign ice peace|The deal splits ice cubes equally until 2030.
Más ventanas, pide la oposición|Dicen que en {l} hay vecinos que nunca vieron una estrella.|More windows, says the opposition|They say some residents of {l} have never seen a star.
Un himno de un solo pitido|El referéndum fue reñido: ganó el pitido largo sobre el corto.|An anthem made of one beep|It was close: the long beep beat the short one.
El imán falla y el Parlamento flota|La sesión terminó en el techo. Nadie resultó herido, solo mareado.|Magnet fails, Parliament floats|The session ended on the ceiling. No one was hurt, just dizzy.
La cumbre termina con abrazo grupal|Los delegados no lograron acuerdo, pero sí una foto muy tierna.|Summit ends in a group hug|Delegates reached no deal, but they got a very sweet photo.
Impuesto a los meteoritos de jardín|Quien tenga más de tres pagará una cuota. Los coleccionistas protestan.|Tax on garden meteorites|Anyone with more than three will pay a fee. Collectors object.
Un semáforo para naves en {l}|Durará en verde lo que tarda en hervir el agua de un té.|A traffic light for ships in {l}|It stays green as long as it takes to boil water for tea.
Silencio tras el ocaso, dice la ley|{P} pidió excepciones para los grillos del invernadero.|Silence after sunset, says the law|{P} asked for an exception for the greenhouse crickets.
El presupuesto en una sola hoja|La letra es tan pequeña que se lee con telescopio.|The budget fits on one page|The print is so small you need a telescope to read it.
Un eclipse corta el debate|Los candidatos siguieron hablando a oscuras durante diez minutos.|Eclipse cuts the debate|The candidates kept talking in the dark for ten minutes.
Mirar las estrellas ya es un derecho|Cada vivienda tendrá al menos media hora diaria de cielo despejado.|Stargazing is now a right|Every home gets at least half an hour of clear sky a day.
Votar con casco, la nueva costumbre|El aire del salón falló y nadie quiso quitarse el traje para votar.|Voting in helmets, the new normal|The chamber's air failed, so no one took off their suit to vote.
El Consejo estrena sala con vista a Saturno|{P} prometió que nadie se distraerá con los anillos.|Council opens room with a Saturn view|{P} promised no one will get distracted by the rings.`,
col: `Una ley para el eco|Silbar en la escotilla dura tres días. Ya era hora.|A law for the echo|A whistle in the airlock lasts three days. About time.
El domo y sus colores|Violeta o cian: lo único seguro es otro debate.|The dome and its colors|Violet or cyan: the only sure thing is another debate.
Elogio de la siesta|La colonia por fin coincide en algo: dormir.|In praise of the nap|At last the colony agrees on something: sleep.
Robots al Consejo|Votan rápido y nunca piden un receso.|Robots on the council|They vote fast and never ask for a break.
Hielo para todos|La paz del hielo se mide en cubitos.|Ice for everyone|The ice peace is measured in cubes.
La urna flotante|Si el voto flota, ¿cuenta? Debate abierto.|The floating ballot box|If a vote floats, does it count? Discuss.
Ventanas, por favor|Ver una estrella no debería ser un lujo.|Windows, please|Seeing a star shouldn't be a luxury.
El himno pitido|Corto, claro y fácil de aprender.|The beep anthem|Short, clear and easy to learn.
Presupuesto mínimo|Una hoja. Letra minúscula. Lupa incluida.|A tiny budget|One page. Tiny print. Magnifier included.
Semáforos en órbita|El verde dura un té. El rojo, dos.|Traffic lights in orbit|Green lasts one cup of tea. Red, two.
Silencio, por ley|Los grillos piden permiso para cantar.|Silence by law|The crickets ask permission to sing.
Debatir a oscuras|Sin luz, los argumentos se oyen mejor.|Debating in the dark|Without light, arguments sound better.
Meteoritos con impuesto|Tres son colección. Cuatro, contribución.|Taxed meteorites|Three is a collection. Four is a tax bill.
Concejales con casco|El aire falló, la democracia no.|Councillors in helmets|The air failed; democracy didn't.
Cumbres y abrazos|Sin acuerdo, pero con buena foto.|Summits and hugs|No deal, but a good photo.
La silla que flota|En {l}, cada escaño lleva cinturón.|The floating chair|In {l}, every seat has a seatbelt.
Lunes cortos|Cuatro horas bastan para un lunes.|Short Mondays|Four hours is plenty for a Monday.
Derecho al cielo|Media hora de estrellas por día.|A right to the sky|Half an hour of stars a day.
Gravedad, la promesa|Todos quieren tener los pies en el suelo.|Gravity, the promise|Everyone wants their feet on the ground.
Vista a Saturno|Una sala nueva y un anillo que distrae.|A view of Saturn|A new room and a distracting ring.`,
breve: `Leyes aprobadas este mes|{n}|Laws passed this month|{n}
Votos por el pitido largo|51 %|Votes for the long beep|51%
Minutos de debate a oscuras|10|Minutes debating in the dark|10
Concejales con casco|12|Councillors in helmets|12
Abrazos en la cumbre|{n}|Hugs at the summit|{n}
Horas del lunes nuevo|4|Hours in the new Monday|4
Ventanas pedidas|{n}|Windows requested|{n}
Semáforos para naves|1|Traffic lights for ships|1
Hojas de presupuesto|1|Budget pages|1
Robots en el Consejo|1|Robots on the council|1
Minutos de siesta legal|60|Minutes of legal nap|60
Cubitos por colonia|{n}|Ice cubes per colony|{n}
Meteoritos por jardín|3|Meteorites per garden|3
Grillos con permiso|{n}|Crickets with a permit|{n}
Sesiones en el techo|2|Sessions on the ceiling|2
Votos que flotaron|{n}|Ballots that floated|{n}
Colores en debate|2|Colors under debate|2
Pitidos del himno|1|Beeps in the anthem|1
Días de eco|3|Days of echo|3
Mociones archivadas|{n}|Motions shelved|{n}`,
foto: `{P} sale del recinto tras la votación.|Pictured: {p} leaves the chamber after the vote.
{P} saluda desde la escotilla del Consejo.|{P} waves from the council airlock.
La sala del Consejo, en {l}, durante la sesión.|The council room in {l} during the session.
Concejales votan con linternas tras el apagón.|Councillors vote by flashlight after the blackout.
El nuevo semáforo para naves, ya en servicio.|The new ship traffic light, now in service.
{P} firma el acuerdo del hielo.|{P} signs the ice agreement.
La cúpula de {l}, en su primer día violeta.|The dome of {l} on its first violet day.
El robot concejal, minutos antes de jurar.|The robot councillor minutes before the oath.`
};
// ───────────────────────── ECONOMÍA ─────────────────────────
RAW.ECO = {
tit: `El oxígeno baja por tercer mes seguido|Oxygen prices fall for a third month
Récord de exportación de hielo de cometa|Record exports of comet ice
El crédito colonial sube un 2 %|The colonial credit rises 2%
Abre el primer banco con gravedad propia|First bank with its own gravity opens
Falta de tornillos: suben los precios|Screw shortage pushes prices up
La bolsa de Titán cierra en verde|Titan stock exchange closes higher
Las calabazas lunares se cotizan en alza|Moon pumpkin prices are climbing
Alquileres con vista a Saturno, por las nubes|Saturn-view rents go sky-high
Boom de talleres de naves de segunda mano|Boom in second-hand ship garages
La inflación del aire, bajo control|Air inflation is under control
Récord de ventas de cascos de invierno|Winter helmet sales hit a record
Abren un mercado nocturno en el anillo|Night market opens on the ring
Las empresas piden turnos de 25 horas|Companies ask for 25-hour shifts
El precio del agua de hielo se estabiliza|Ice water prices level off
Nueva moneda: el crédito de bolsillo|New currency: the pocket credit
Cierra la última fábrica de paraguas|The last umbrella factory closes
Sube el empleo en el sector de antenas|Antenna jobs are on the rise
El turismo a la cara oculta crece un 30 %|Far-side tourism grows 30%
La cosecha de algas supera lo previsto|Algae harvest beats forecasts
El ahorro en baterías bate su récord|Battery savings hit an all-time high`,
nota: `El oxígeno baja y los globos festejan|Por tercer mes consecutivo cae el precio y en {l} ya inflan globos.|Oxygen drops, balloon makers cheer|Prices fell for a third month, and {l} is already inflating balloons.
Hielo de cometa: exportación récord|Las naves cargueras hacen fila en {l} para llevarse los bloques.|Comet ice: record exports|Cargo ships are lining up in {l} to haul the blocks away.
El crédito colonial gana terreno|Los analistas lo atribuyen a la buena cosecha de algas.|The colonial credit gains ground|Analysts credit the strong algae harvest.
Un banco con gravedad propia|Las monedas ya no flotan y los cajeros respiran tranquilos.|A bank with its own gravity|Coins no longer float, and the tellers can relax.
Faltan tornillos en toda la colonia|{P} pidió calma: «Los tornillos sueltos no se tiran».|Screw shortage across the colony|{P} asked for calm: "Loose screws are not trash."
Jornada verde en la bolsa de Titán|Subieron las acciones de antenas, algas y paraguas plegables.|A green day on the Titan exchange|Antennas, algae and folding umbrellas all rose.
Calabazas lunares, la nueva inversión|En {l} ya hay quien guarda calabazas en lugar de créditos.|Moon pumpkins, the new investment|Some people in {l} now save pumpkins instead of credits.
Alquilar con vista a Saturno, un lujo|Los anillos suben el precio un 40 %. Las cortinas, gratis.|Renting with a Saturn view is a luxury|The rings add 40% to the price. Curtains are free.
Naves usadas: el negocio del año|Los talleres de {l} no dan abasto con tanto motor viejo.|Used ships: deal of the year|Garages in {l} can't keep up with all the old engines.
El aire deja de inflarse|El índice del oxígeno se mantiene estable por primera vez en años.|Air stops inflating|The oxygen index holds steady for the first time in years.
Cascos de invierno, agotados|Las tiendas de {l} esperan una nueva carga para el lunes.|Winter helmets sell out|Shops in {l} expect a new shipment on Monday.
Mercado nocturno en el anillo|Se puede comprar de todo, hasta {o}, bajo las estrellas.|Night market on the ring|You can buy anything under the stars, even {o}.
Turnos de 25 horas, la propuesta|Los sindicatos responden que el día sigue teniendo 24.|25-hour shifts, the proposal|Unions reply that a day still has 24 hours.
El agua de hielo encuentra su precio|Tras meses de subidas, los vecinos vuelven a llenar la tetera.|Ice water finds its price|After months of increases, people are filling the kettle again.
Llega el crédito de bolsillo|Es tan pequeño que entra en el bolsillo del traje espacial.|Here comes the pocket credit|It's small enough to fit in a spacesuit pocket.
Cierra la última fábrica de paraguas|Bajo la cúpula nunca llueve. Solo caían los pedidos.|Last umbrella factory closes|It never rains under the dome. Only orders fell.
Las antenas crean empleo|Hacen falta {n} técnicos para orientar señales hacia la Tierra.|Antennas create jobs|{n} technicians are needed to point signals toward Earth.
La cara oculta atrae turistas|Los visitantes pagan por no ver la Tierra durante una semana.|The far side draws tourists|Visitors pay to not see Earth for a whole week.
Las algas superan lo esperado|La cosecha de {l} alcanza para sopas hasta el próximo año.|Algae beats expectations|The {l} harvest will keep soups going until next year.
Récord de ahorro en baterías|Las familias guardan energía como antes se guardaban monedas.|Battery savings set a record|Families store energy the way they once saved coins.`,
col: `El precio del aire|Respirar sale más barato. Inhala tranquilo.|The price of air|Breathing is cheaper. Inhale with confidence.
Tornillos y paciencia|Lo que se afloja, también se aprieta.|Screws and patience|What comes loose can be tightened.
Invertir en calabazas|Crecen, se guardan y se comen.|Investing in pumpkins|They grow, they keep, and you can eat them.
La bolsa de Titán|Verde por fuera, helada por dentro.|The Titan exchange|Green on the outside, frozen inside.
Alquiler con anillos|La vista se paga. Las cortinas, no.|Rent with rings|You pay for the view. Not the curtains.
El crédito pequeño|Más fácil de llevar, igual de difícil de ganar.|The small credit|Easier to carry, just as hard to earn.
Paraguas sin lluvia|Una industria que esperó un chaparrón.|Umbrellas without rain|An industry that waited for a downpour.
Turnos imposibles|El día tiene 24 horas, por ahora.|Impossible shifts|A day has 24 hours, for now.
Naves de segunda mano|Revisa el motor y no el color.|Second-hand ships|Check the engine, not the paint.
Ahorrar energía|La batería llena es la nueva alcancía.|Saving energy|A full battery is the new piggy bank.
Mercado bajo estrellas|Se regatea mejor con poca luz.|A market under the stars|Haggling is easier in dim light.
Hielo que se exporta|El frío de {l} viaja lejos.|Exported ice|The cold of {l} travels far.
Empleo en antenas|Apuntar bien también es un oficio.|Antenna jobs|Aiming well is a trade too.
Turismo a oscuras|Pagar por no ver la Tierra. Curioso.|Tourism in the dark|Paying not to see Earth. Curious.
Algas en la mesa|Abundantes, verdes y baratas.|Algae on the table|Plentiful, green and cheap.
Un banco que pesa|Por fin las monedas se quedan quietas.|A bank with weight|At last the coins stay still.
Cascos agotados|El invierno llegó antes que la carga.|Helmets sold out|Winter arrived before the shipment.
Agua de hielo|La tetera vuelve a silbar.|Ice water|The kettle whistles again.
Inflación del aire|Un dato que nadie quiere inhalar.|Air inflation|A figure nobody wants to inhale.
Créditos coloniales|Suben poco, pero suben.|Colonial credits|Up a little, but up.`,
breve: `Baja del oxígeno|−3 %|Oxygen price drop|−3%
Bloques de hielo vendidos|{n}|Ice blocks sold|{n}
Valor del crédito|+2 %|Credit value|+2%
Tornillos disponibles|{n}|Screws in stock|{n}
Recargo por vista a Saturno|40 %|Saturn-view surcharge|40%
Talleres de naves nuevos|{n}|New ship garages|{n}
Cascos vendidos hoy|{n}|Helmets sold today|{n}
Puestos del mercado nocturno|{n}|Night market stalls|{n}
Horas pedidas por turno|25|Hours asked per shift|25
Fábricas de paraguas|0|Umbrella factories|0
Técnicos de antenas buscados|{n}|Antenna techs wanted|{n}
Turismo a la cara oculta|+30 %|Far-side tourism|+30%
Toneladas de algas|{n}|Tons of algae|{n}
Baterías ahorradas|{n}|Batteries saved|{n}
Calabazas en bóvedas|{n}|Pumpkins in vaults|{n}
Precio del agua de hielo|=|Ice water price|=
Créditos de bolsillo nuevos|{n}|Pocket credits issued|{n}
Bancos con gravedad|1|Banks with gravity|1
Inflación del aire|0,1 %|Air inflation|0.1%
Cierres en verde seguidos|{n}|Straight days in the green|{n}`,
foto: `{P} muestra el primer crédito de bolsillo.|{P} shows off the first pocket credit.
Bloques de hielo de cometa listos para exportar.|Comet ice blocks ready for export.
El mercado nocturno del anillo, a pleno.|The ring night market in full swing.
Un taller de naves usadas en {l}.|A used-ship garage in {l}.
La pantalla de la bolsa de Titán, en verde.|The Titan exchange board, all green.
Cosecha de algas en los tanques de {l}.|Algae harvest in the tanks of {l}.
Fila para comprar cascos de invierno.|Queue for winter helmets.
{P} recorre el nuevo banco con gravedad.|{P} tours the new bank with gravity.`
};
// ───────────────────────── DEPORTES ─────────────────────────
RAW.DEP = {
tit: `Gana en la prórroga... de tres días|Wins in overtime, all three days of it
Récord: un salto de 40 metros en la Luna|Record: a 40-meter jump on the Moon
La final de fútbol flotante, sin pelota|Floating soccer final, missing the ball
Real Fobos asciende a primera división|Phobos United promoted to the top league
La maratón del anillo dura una órbita|Ring marathon lasts a full orbit
Ajedrez: un satélite gana por tiempo|Chess: a satellite wins on time
Nace la liga de natación en gravedad cero|Zero-gravity swimming league is born
Tenis lunar: la pelota aún no ha caído|Moon tennis: the ball still hasn't landed
El equipo local estrena traje y gana|Home team debuts new suits and wins
Un gol desde la otra punta de la cúpula|A goal from across the whole dome
Crónica de un empate que nadie entendió|A draw that nobody understood
Ciclismo de cráter: subida histórica|Crater cycling: a historic climb
La selección viaja con 11 cascos extra|National team travels with 11 spare helmets
Atlético Ceres ficha a un robot portero|Ceres Athletic signs a robot goalkeeper
Medalla de oro en salto de asteroide|Gold medal in asteroid jumping
Árbitro expulsa a un cometa del campo|Referee sends a comet off the pitch
El clásico de Titán agota las entradas|Titan derby sells out
Fin de temporada: la copa sigue flotando|Season ends with the cup still floating
Un tiro libre da la vuelta a la luna|A free kick goes around the moon
Récord de público en el estadio domo|Record crowd at the dome stadium`,
nota: `{E} gana en una prórroga eterna|El partido duró tres días y el último gol llegó en pijama.|{E} wins in endless overtime|The match lasted three days; the last goal came in pajamas.
Un salto de 40 metros en la Luna|La atleta tardó dos minutos en volver a tocar el suelo.|A 40-meter jump on the Moon|The athlete took two minutes to touch the ground again.
La final, sin pelota|La pelota salió flotando y nadie quiso ir a buscarla.|The final, without a ball|The ball floated away and no one wanted to fetch it.
{E} sube a primera división|Sus seguidores celebraron con fuegos artificiales silenciosos.|{E} reaches the top league|Fans celebrated with silent fireworks.
Una maratón de una órbita entera|Los corredores dieron la vuelta al anillo y llegaron al desayuno.|A marathon a full orbit long|Runners circled the ring and arrived in time for breakfast.
Un satélite gana al ajedrez por tiempo|El rival pensó 40 minutos y la señal tardó 41 en llegar.|Satellite wins at chess on time|Its rival thought for 40 minutes; the signal took 41 to arrive.
Natación sin gravedad: arranca la liga|Se nada dentro de una burbuja gigante. El agua no se escapa.|Zero-g swimming league kicks off|The pool is one giant bubble. The water stays put.
Tenis lunar: un punto de diez minutos|La pelota sigue en el aire y el público ya fue a cenar.|Moon tennis: a ten-minute point|The ball is still in the air and the crowd went to dinner.
Trajes nuevos, victoria nueva|El equipo de {l} estrenó trajes y ganó por primera vez en meses.|New suits, new win|The {l} team debuted new suits and won for the first time in months.
Gol de cúpula a cúpula|El balón cruzó todo el estadio y entró sin tocar a nadie.|A dome-to-dome goal|The ball crossed the whole stadium and went in untouched.
Un empate imposible de explicar|Los dos equipos marcaron el mismo gol. Se revisa la grabación.|A draw nobody can explain|Both teams scored the same goal. The footage is under review.
Ciclismo de cráter: la gran subida|Los ciclistas subieron el borde de {l} sin bajar de la bici.|Crater cycling: the big climb|Riders climbed the rim of {l} without getting off the bike.
La selección viaja con cascos de sobra|{P} lo explicó: «En la Luna nunca se sabe».|The national team packs spare helmets|{P} explained: "On the Moon, you never know."
{E} ficha a un robot portero|Lo para todo, pero se apaga si llueven meteoritos.|{E} signs a robot goalkeeper|It stops everything, but shuts down in meteor showers.
Oro en salto de asteroide|La campeona cayó de pie sobre una roca del tamaño de una mesa.|Gold in asteroid jumping|The champion landed on her feet on a table-sized rock.
Un cometa expulsado del campo|Atravesó el área dos veces sin permiso. El árbitro fue claro.|A comet sent off the pitch|It crossed the box twice without permission. The ref was clear.
El clásico de Titán, sin entradas|Los seguidores de {e} hicieron fila desde el amanecer.|Titan derby sells out|{E} fans queued from sunrise.
La copa sigue flotando|Terminó la temporada y el trofeo no baja del techo del estadio.|The cup is still floating|The season is over and the trophy won't come down from the roof.
Tiro libre alrededor de la luna|El balón dio una vuelta entera y volvió a la red rival.|A free kick around the moon|The ball looped all the way around and back into the net.
Lleno total en el estadio domo|{n} mil personas vieron el partido sin despegar los pies.|Full house at the dome stadium|{n} thousand people watched with their feet firmly down.`,
col: `Prórrogas eternas|El fútbol no termina, se pospone.|Endless overtime|Soccer doesn't end; it gets postponed.
Saltar en la Luna|Lo difícil no es subir, es bajar.|Jumping on the Moon|Going up is easy. Coming down is hard.
La pelota perdida|Flotó, se fue y nadie la extraña.|The lost ball|It floated away and no one misses it.
Ascenso merecido|Años en segunda, por fin arriba.|A deserved promotion|Years in the second tier, finally up.
Correr una órbita|Salir de noche, llegar de día.|Running an orbit|Leave at night, arrive by day.
Ajedrez con retraso|La señal también juega.|Chess with lag|The signal plays too.
Nadar sin peso|Brazada, burbuja, brazada.|Swimming without weight|Stroke, bubble, stroke.
Tenis paciente|Un punto puede durar una cena.|Patient tennis|One point can last a whole dinner.
Trajes de la suerte|Ganar también es cuestión de tela.|Lucky suits|Winning is partly about fabric.
Porteros de metal|Lo paran todo, menos meteoritos.|Metal goalkeepers|They save it all, except meteors.
El VAR del espacio|Revisar un gol lleva una órbita.|Space video review|Checking a goal takes an orbit.
Subir el cráter|Las piernas de {l} no se rinden.|Climbing the crater|The legs of {l} never give up.
Salto de asteroide|Caer de pie, ese es el arte.|Asteroid jumping|Landing on your feet is the art.
Cometas en el campo|Velocidad sin reglamento.|Comets on the pitch|Speed with no rulebook.
El clásico|Una ciudad partida en dos colores.|The derby|A city split in two colors.
Copa en el techo|El trofeo celebra a su manera.|Cup on the ceiling|The trophy celebrates in its own way.
Tiros con curva|La luna también es parte del juego.|Curving shots|The moon is part of the game too.
Estadio lleno|Nadie flota cuando grita gol.|A full stadium|No one floats when they cheer a goal.
Empates raros|Dos goles iguales, un misterio.|Strange draws|Two identical goals, one mystery.
Cascos extra|Mejor que sobren que falten.|Spare helmets|Better too many than too few.`,
breve: `Días de prórroga|3|Days of overtime|3
Metros de salto lunar|40|Meters jumped on the Moon|40
Pelotas perdidas|{n}|Balls lost|{n}
Puntos de {e}|{n}|{E} points|{n}
Corredores en la maratón|{n}|Marathon runners|{n}
Minutos de ajedrez|41|Minutes of chess|41
Equipos de natación|{n}|Swim teams|{n}
Golpes en un punto de tenis|{n}|Shots in one tennis rally|{n}
Goles de cúpula a cúpula|1|Dome-to-dome goals|1
Ciclistas en el cráter|{n}|Crater riders|{n}
Cascos extra|11|Spare helmets|11
Paradas del robot|{n}|Robot saves|{n}
Medallas de oro|{n}|Gold medals|{n}
Cometas expulsados|1|Comets sent off|1
Entradas vendidas|{n}|Tickets sold|{n}
Altura de la copa|30 m|Cup height|30 m
Vueltas del balón|1|Ball laps|1
Mil personas en el domo|{n}|Thousand people at the dome|{n}
Empates inexplicables|1|Inexplicable draws|1
Partidos esta semana|{n}|Matches this week|{n}`,
foto: `{P} levanta la copa, que sigue flotando.|{P} lifts the cup, which is still floating.
El estadio domo, lleno hasta la cúpula.|The dome stadium, packed to the roof.
La atleta, en pleno salto lunar.|The athlete in mid moon jump.
Los seguidores de {e} celebran el ascenso.|{E} fans celebrate promotion.
El robot portero, en su presentación.|The robot goalkeeper at its unveiling.
Corredores pasan frente a {l}.|Runners pass in front of {l}.
La pelota, vista por última vez.|The ball, last seen here.
Ciclistas suben el borde del cráter.|Cyclists climb the crater rim.`
};
G.__PORTADA_RAW = RAW; G.__PORTADA_SLOTS = SLOTS;
})(typeof window !== 'undefined' ? window : globalThis);
