export type View =
  | "Inicio"
  | "Explorar"
  | "Ahora"
  | "Mapa"
  | "Planes"
  | "Grupos"
  | "Chat"
  | "Calendario"
  | "Perfil"
  | "Seguridad"
  | "Vida"
  | "Conecta+";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  birth_date: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  interests: string[];
  latitude: number | null;
  longitude: number | null;
  profile_visibility: "public" | "connections" | "private";
  show_location: boolean;
  show_age: boolean;
  show_online: boolean;
  allow_messages: "everyone" | "connections" | "nobody";
  online: boolean;
  last_seen: string | null;
  availability: Record<string, unknown>;
  languages: string[];
  social_goals: string[];
  activity_levels: Record<string, string>;
  max_distance_km: number;
  preferred_group_size: "small" | "medium" | "large" | "any";
  preferred_atmospheres: string[];
  budget_max_cents: number | null;
  onboarding_completed: boolean;
  identity_status?: "unverified" | "pending" | "verified" | "rejected";
  audience_mode?: "general" | "families" | "seniors" | "lgbtq" | "students" | "company";
  city_mode_until?: string | null;
  social_pause_until?: string | null;
  public_slug?: string | null;
  social_streak_weeks?: number;
  organizer_verified?: boolean;
  text_scale?: "normal" | "large";
};

export type ProfileTrust = {
  user_id: string;
  email_verified: boolean;
  phone_verified: boolean;
  meetups_attended: number;
  plans_organized: number;
  attendance_rate: number;
  punctuality_rate: number;
  organizer_tier: string;
};

export type Plan = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  starts_at: string | null;
  ends_at: string | null;
  expires_at: string | null;
  max_people: number | null;
  min_people: number;
  image_url: string | null;
  visibility: "public" | "connections" | "private";
  level: "all" | "beginner" | "intermediate" | "advanced" | "competition";
  atmosphere: "calm" | "social" | "intense" | "party";
  cost_cents: number;
  currency: string;
  approximate_age_min: number | null;
  approximate_age_max: number | null;
  approval_mode: "automatic" | "manual";
  requirements: string[];
  logistics: Record<string, unknown>;
  sport_details: Record<string, unknown>;
  is_spontaneous: boolean;
  recurrence_rule: string | null;
  meeting_safety: "public_place";
  status: "draft" | "published" | "full" | "completed" | "cancelled";
  created_at: string;
  newcomer_friendly?: boolean;
  child_friendly?: boolean;
  safe_space?: boolean;
  audience_mode?: "general" | "families" | "seniors" | "lgbtq" | "students" | "company";
  indoor_backup?: string | null;
  reservation_url?: string | null;
  transport_enabled?: boolean;
  share_slug?: string | null;
  community_id?: string | null;
};

export type PlanMember = {
  plan_id: string;
  user_id: string;
  joined_at: string;
  status:
    | "interested"
    | "requested"
    | "attending"
    | "waitlist"
    | "declined"
    | "attended"
    | "no_show";
  role: "participant" | "coorganizer" | "organizer";
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  punctuality_minutes: number | null;
  note: string | null;
};

export type Community = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  visibility: "public" | "connections" | "private";
  category: string | null;
  location_name: string | null;
  member_limit: number | null;
  recurrence_rule: string | null;
  rules: string[];
  auto_approve: boolean;
  organizer_tier: string;
  created_at: string;
};

export type CommunityMember = {
  community_id: string;
  user_id: string;
  role: "member" | "coorganizer" | "admin" | "owner";
  status: "pending" | "active" | "rejected" | "banned";
  joined_at: string;
};

export type Conversation = {
  id: string;
  type: "direct" | "group";
  title: string | null;
  created_by: string;
  plan_id: string | null;
  community_id: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  kind: string;
  media_url: string | null;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
  read_at: string | null;
};

export type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
};

export type SavedItem = {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
};
