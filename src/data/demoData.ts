import type { Plan } from '../types';

export const plans: Plan[] = [
  {title:'Pádel Sunset',image:'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=88',time:'Hoy · 19:00',place:'Club Pádel Tarragona',distance:'5 km',spots:'6 plazas',category:'Deporte'},
  {title:'Cena entre amigos',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=88',time:'Hoy · 21:00',place:'Tarragona centro',distance:'2 km',spots:'8 plazas',category:'Comida'},
  {title:'Ruta al atardecer',image:'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=88',time:'Sáb · 10:30',place:'La Mussara',distance:'26 km',spots:'10 plazas',category:'Senderismo'},
  {title:'Café y gente nueva',image:'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=88',time:'Mañana · 17:30',place:'Rambla Nova',distance:'3 km',spots:'5 plazas',category:'Café'},
  {title:'Running por la costa',image:'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=88',time:'Dom · 09:00',place:'La Pineda',distance:'7 km',spots:'12 plazas',category:'Deporte'},
  {title:'Noche de música',image:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=88',time:'Vie · 22:30',place:'Sala Zero',distance:'4 km',spots:'14 plazas',category:'Música'},
  {title:'Tarde de playa',image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=88',time:'Sáb · 17:00',place:'Platja Llarga',distance:'9 km',spots:'9 plazas',category:'Playa'},
  {title:'Juegos y cervezas 0,0',image:'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=900&q=88',time:'Jue · 20:00',place:'Tarragona',distance:'2 km',spots:'7 plazas',category:'Gaming'},
];

export const categories = [
  ['Deporte','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=82'],
  ['Comida','https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=82'],
  ['Café','https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=500&q=82'],
  ['Cine','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=82'],
  ['Música','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=500&q=82'],
  ['Playa','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=82'],
  ['Viajes','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=82'],
  ['Senderismo','https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=500&q=82'],
  ['Gaming','https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=500&q=82'],
  ['Fotografía','https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=500&q=82'],
  ['Idiomas','https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=82'],
  ['Fiestas','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=82'],
  ['Familias','https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=82'],
  ['Estudiantes','https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=82'],
  ['Lectura','https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=82'],
  ['Mascotas','https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=82'],
] as const;

export const people = [
  ['Marta','94% compatible','Running · Viajes','https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85'],
  ['Javi','91% compatible','Pádel · Gastronomía','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=85'],
  ['Laura','88% compatible','Playa · Música','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85'],
  ['Carlos','86% compatible','Gaming · Cine','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=85']
] as const;

export const escapes = [
  ['Escapada a Barcelona','Este sábado','https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=85'],
  ['Costa Brava en grupo','Próximo finde','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85'],
  ['Montaña y desconexión','Domingo','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85']
] as const;

export const chats = [
  ['Grupo Pádel','Javi: Nos vemos a las 19:00! 🎾','3'],
  ['Marta','Genial! Nos apuntamos 😊','1'],
  ['Viaje a Madrid','Ana: He encontrado unos hoteles...','5'],
  ['Carlos','¿Te apuntas al plan de mañana?',''],
  ['Running Tarragona','Laura: Ruta confirmada ✅','2'],
  ['Sara','Nos vemos allí! 🥰',''],
  ['Cine y palomitas','Javi: Película confirmada 🎬','']
] as const;
