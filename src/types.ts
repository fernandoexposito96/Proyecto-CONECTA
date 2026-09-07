export type View = 'Inicio' | 'Explora' | 'Chat' | 'Perfil' | 'Ajustes' | 'Notificaciones' | 'Crear';

export type ExploreFilter = 'all' | 'near' | 'today' | 'afternoon' | 'tonight' | 'weekend';

export type Plan = {
  title: string;
  image: string;
  time: string;
  place: string;
  distance: string;
  spots: string;
  category: string;
};
