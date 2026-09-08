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
  visibility?: 'Todos' | 'Solo conexiones';
};

export type PeopleFilter = 'near' | 'match' | 'age' | 'interests';

export type Person = {
  userId?: string;
  name: string;
  age: number;
  distance: string;
  match: string;
  bio: string;
  job: string;
  tags: string[];
  image: string;
  gallery: string[];
};

export type Story = {
  name: string;
  time: string;
  avatar: string;
  image: string;
  caption: string;
  location: string;
};

export type CategoryTuple = readonly [name: string, image: string];
export type EscapeTuple = readonly [title: string, date: string, image: string];
export type ChatPreviewTuple = readonly [name: string, message: string, count: string];

export type ChatTab = 'Todos' | 'Planes' | 'Grupos';

export type ChatItem = {
  name: string;
  msg: string;
  count: string;
  isGroup: boolean;
  avatar: string;
  conversationId?: string;
  userId?: string;
};

export type ProfileTab = 'Fotos' | 'Planes' | 'Conexiones' | 'Valoraciones';

export type SettingsScreen =
  | 'root'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'help'
  | 'premium'
  | 'account'
  | 'appearance'
  | 'language'
  | 'about'
  | 'helpDetail'
  | 'actionDetail'
  | 'supportForm'
  | 'privacyField'
  | 'blockedUsers'
  | 'changePassword';

export type ToggleKey = 'messages' | 'requests' | 'planUpdates' | 'reminders' | 'news' | 'offers';
export type Theme = 'Claro' | 'Oscuro' | 'Sistema';
export type Language = 'Español' | 'Català' | 'English';
export type NotificationFrequency = 'daily' | 'weekly' | 'important';
export type HelpItem = { title: string; body: string };
export type ActionItem = { title: string; body: string };
export type AccountSettings = { name: string; email: string };

export type PrivacyFieldKey = 'profileVisibility' | 'planVisibility' | 'locationSharing' | 'messagePermission' | 'connectionRequests';

export type PrivacySettings = {
  profileVisibility: 'Todos' | 'Solo conexiones';
  planVisibility: 'Todos' | 'Solo conexiones';
  locationSharing: 'Siempre' | 'Al usar la app' | 'Nunca';
  messagePermission: 'Todos' | 'Solo conexiones';
  connectionRequests: 'Todos' | 'Nadie';
};

export type BlockedUser = {
  userId: string;
  name: string;
  avatar?: string;
};
