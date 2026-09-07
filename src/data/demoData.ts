import type { CategoryTuple, ChatPreviewTuple, EscapeTuple, Person, Plan } from '../types';

export const plans: Plan[] = [
  {title:'Pádel Sunset',image:'./assets/images/photo-1622279457486-62dcc4a431d6.jpg',time:'Hoy · 19:00',place:'Club Pádel Tarragona',distance:'5 km',spots:'6 plazas',category:'Deporte'},
  {title:'Cena entre amigos',image:'./assets/images/photo-1517248135467-4c7edcad34c4.jpg',time:'Hoy · 21:00',place:'Tarragona centro',distance:'2 km',spots:'8 plazas',category:'Comida'},
  {title:'Ruta al atardecer',image:'./assets/images/photo-1551632811-561732d1e306.jpg',time:'Sáb · 10:30',place:'La Mussara',distance:'26 km',spots:'10 plazas',category:'Senderismo'},
  {title:'Café y gente nueva',image:'./assets/images/photo-1501339847302-ac426a4a7cbb.jpg',time:'Mañana · 17:30',place:'Rambla Nova',distance:'3 km',spots:'5 plazas',category:'Café'},
  {title:'Running por la costa',image:'./assets/images/photo-1552674605-db6ffd4facb5.jpg',time:'Dom · 09:00',place:'La Pineda',distance:'7 km',spots:'12 plazas',category:'Deporte'},
  {title:'Noche de música',image:'./assets/images/photo-1501386761578-eac5c94b800a.jpg',time:'Vie · 22:30',place:'Sala Zero',distance:'4 km',spots:'14 plazas',category:'Música'},
  {title:'Tarde de playa',image:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',time:'Sáb · 17:00',place:'Platja Llarga',distance:'9 km',spots:'9 plazas',category:'Playa'},
  {title:'Juegos y cervezas 0,0',image:'./assets/images/photo-1606167668584-78701c57f13d.jpg',time:'Jue · 20:00',place:'Tarragona',distance:'2 km',spots:'7 plazas',category:'Gaming'},
];

export const categories = [
  ['Deporte','./assets/images/photo-1534438327276-14e5300c3a48.jpg'],
  ['Comida','./assets/images/photo-1504674900247-0877df9cc836.jpg'],
  ['Café','./assets/images/photo-1501339847302-ac426a4a7cbb.jpg'],
  ['Cine','./assets/images/photo-1489599849927-2ee91cede3ba.jpg'],
  ['Música','./assets/images/photo-1501386761578-eac5c94b800a.jpg'],
  ['Playa','./assets/images/photo-1507525428034-b723cf961d3e.jpg'],
  ['Viajes','./assets/images/photo-1500530855697-b586d89ba3ee.jpg'],
  ['Senderismo','./assets/images/photo-1551632811-561732d1e306.jpg'],
  ['Gaming','./assets/images/photo-1606167668584-78701c57f13d.jpg'],
  ['Fotografía','./assets/images/photo-1452780212940-6f5c0d14d848.jpg'],
  ['Idiomas','./assets/images/photo-1523240795612-9a054b0db644.jpg'],
  ['Fiestas','./assets/images/photo-1492684223066-81342ee5ff30.jpg'],
  ['Familias','./assets/images/photo-1511632765486-a01980e01a18.jpg'],
  ['Estudiantes','./assets/images/photo-1523240795612-9a054b0db644.jpg'],
  ['Lectura','./assets/images/photo-1512820790803-83ca734da794.jpg'],
  ['Mascotas','./assets/images/photo-1552053831-71594a27632d.jpg'],
] as const satisfies readonly CategoryTuple[];

export const people: Person[] = [
  {name:'Marta',age:26,distance:'4 km',match:'94%',bio:'Running, cine, música y escapadas de fin de semana.',job:'Fisioterapeuta',tags:['Running','Viajes','Cine','Música'],image:'./assets/images/photo-1494790108377-be9c29b29330.jpg',gallery:['./assets/images/photo-1494790108377-be9c29b29330.jpg','./assets/images/photo-1552674605-db6ffd4facb5.jpg','./assets/images/photo-1489599849927-2ee91cede3ba.jpg','./assets/images/photo-1501386761578-eac5c94b800a.jpg']},
  {name:'Javi',age:28,distance:'5 km',match:'91%',bio:'Pádel, gastronomía y planes tranquilos con gente nueva.',job:'Comercial',tags:['Pádel','Gastronomía','Deporte'],image:'./assets/images/photo-1500648767791-00dcc994a43e.jpg',gallery:['./assets/images/photo-1500648767791-00dcc994a43e.jpg','./assets/images/photo-1622279457486-62dcc4a431d6.jpg']},
  {name:'Laura',age:25,distance:'6 km',match:'88%',bio:'Playa, música y escapadas de fin de semana.',job:'Diseñadora',tags:['Playa','Música','Viajes'],image:'./assets/images/photo-1534528741775-53994a69daeb.jpg',gallery:['./assets/images/photo-1534528741775-53994a69daeb.jpg','./assets/images/photo-1507525428034-b723cf961d3e.jpg']},
  {name:'Carlos',age:27,distance:'3 km',match:'89%',bio:'Viajes, fotografía, café y descubrir sitios nuevos con buena compañía.',job:'Diseñador',tags:['Viajes','Fotografía','Café','Arte'],image:'./assets/images/photo-1507003211169-0a1dd7228f2d.jpg',gallery:['./assets/images/photo-1507003211169-0a1dd7228f2d.jpg','./assets/images/photo-1452780212940-6f5c0d14d848.jpg','./assets/images/photo-1500530855697-b586d89ba3ee.jpg']},
  {name:'Lucía',age:24,distance:'2 km',match:'92%',bio:'Le gusta el deporte, los planes al aire libre y la buena comida.',job:'Estudiante de Marketing',tags:['Deporte','Viajes','Música','Playa'],image:'./assets/images/photo-1524504388940-b1c1722653e1.jpg',gallery:['./assets/images/photo-1524504388940-b1c1722653e1.jpg','./assets/images/photo-1507525428034-b723cf961d3e.jpg','./assets/images/photo-1500530855697-b586d89ba3ee.jpg','./assets/images/photo-1519046904884-53103b34b206.jpg']},
  {name:'Álex',age:25,distance:'5 km',match:'87%',bio:'Senderismo, playa, buena comida y planes espontáneos.',job:'Ingeniero',tags:['Senderismo','Playa','Comida','Deporte'],image:'./assets/images/photo-1507591064344-4c6ce005b128.jpg',gallery:['./assets/images/photo-1507591064344-4c6ce005b128.jpg','./assets/images/photo-1551632811-561732d1e306.jpg','./assets/images/photo-1507525428034-b723cf961d3e.jpg']},
  {name:'Sara',age:23,distance:'6 km',match:'84%',bio:'Fotografía, conciertos, viajes y tardes de café.',job:'Estudiante',tags:['Fotografía','Música','Viajes','Café'],image:'./assets/images/photo-1544005313-94ddf0286df2.jpg',gallery:['./assets/images/photo-1544005313-94ddf0286df2.jpg','./assets/images/photo-1452780212940-6f5c0d14d848.jpg','./assets/images/photo-1501386761578-eac5c94b800a.jpg']},
  {name:'Nuria',age:29,distance:'7 km',match:'84%',bio:'Senderismo, café y planes de mañana.',job:'Administrativa',tags:['Senderismo','Café','Viajes'],image:'./assets/images/photo-1524504388940-b1c1722653e1.jpg',gallery:['./assets/images/photo-1524504388940-b1c1722653e1.jpg','./assets/images/photo-1551632811-561732d1e306.jpg']},
  {name:'David',age:30,distance:'8 km',match:'78%',bio:'Running, cine y planes deportivos.',job:'Técnico',tags:['Running','Cine','Deporte'],image:'./assets/images/photo-1506794778202-cad84cf45f1d.jpg',gallery:['./assets/images/photo-1506794778202-cad84cf45f1d.jpg','./assets/images/photo-1552674605-db6ffd4facb5.jpg']},
];

export const escapes = [
  ['Escapada a Barcelona','Este sábado','./assets/images/photo-1539037116277-4db20889f2d4.jpg'],
  ['Costa Brava en grupo','Próximo finde','./assets/images/photo-1500530855697-b586d89ba3ee.jpg'],
  ['Montaña y desconexión','Domingo','./assets/images/photo-1464822759023-fed622ff2c3b.jpg']
] as const satisfies readonly EscapeTuple[];

export const chats = [
  ['Grupo Pádel','Javi: Nos vemos a las 19:00! 🎾','3'],
  ['Marta','Genial! Nos apuntamos 😊','1'],
  ['Viaje a Madrid','Ana: He encontrado unos hoteles...','5'],
  ['Carlos','¿Te apuntas al plan de mañana?',''],
  ['Running Tarragona','Laura: Ruta confirmada ✅','2'],
  ['Sara','Nos vemos allí! 🥰',''],
  ['Cine y palomitas','Javi: Película confirmada 🎬','']
] as const satisfies readonly ChatPreviewTuple[];
