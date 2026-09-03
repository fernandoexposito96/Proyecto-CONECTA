import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { mergeDemoCommunities, mergeDemoPlans, mergeDemoProfiles } from "../demoMode";
import type {
  Community,
  CommunityMember,
  Connection,
  Conversation,
  NotificationRecord,
  Plan,
  PlanMember,
  Profile,
  ProfileTrust,
  SavedItem,
} from "../types";

export type ConectaDataSnapshot = {
  profile: Profile | null;
  trust: ProfileTrust | null;
  plans: Plan[];
  planMembers: PlanMember[];
  profiles: Profile[];
  connections: Connection[];
  communities: Community[];
  communityMembers: CommunityMember[];
  conversations: Conversation[];
  notifications: NotificationRecord[];
  savedItems: SavedItem[];
  errorMessage: string | null;
};

const INITIAL_LIMITS = {
  plans: 120,
  planMembers: 300,
  profiles: 80,
  connections: 160,
  communities: 80,
  communityMembers: 240,
  conversations: 80,
  notifications: 30,
  savedItems: 200,
} as const;

const PROFILE_COLUMNS = "id,username,display_name,bio,birth_date,city,country,avatar_url,cover_url,interests,latitude,longitude,profile_visibility,show_location,show_age,show_online,allow_messages,online,last_seen,availability,languages,social_goals,activity_levels,max_distance_km,preferred_group_size,preferred_atmospheres,budget_max_cents,onboarding_completed,identity_status,audience_mode,city_mode_until,social_pause_until,public_slug,social_streak_weeks,organizer_verified,text_scale";
const TRUST_COLUMNS = "user_id,email_verified,phone_verified,meetups_attended,plans_organized,attendance_rate,punctuality_rate,organizer_tier";
const PLAN_COLUMNS = "id,creator_id,title,description,category,location_name,latitude,longitude,starts_at,ends_at,expires_at,max_people,min_people,image_url,visibility,level,atmosphere,cost_cents,currency,approximate_age_min,approximate_age_max,approval_mode,requirements,logistics,sport_details,is_spontaneous,recurrence_rule,meeting_safety,status,created_at,newcomer_friendly,child_friendly,safe_space,audience_mode,indoor_backup,reservation_url,transport_enabled,share_slug,community_id";
const PLAN_MEMBER_COLUMNS = "plan_id,user_id,joined_at,status,role,confirmed_at,checked_in_at,checked_out_at,punctuality_minutes,note";
const COMMUNITY_COLUMNS = "id,owner_id,name,description,image_url,visibility,category,location_name,member_limit,recurrence_rule,rules,auto_approve,organizer_tier,created_at";
const COMMUNITY_MEMBER_COLUMNS = "community_id,user_id,role,status,joined_at";
const CONNECTION_COLUMNS = "id,requester_id,receiver_id,status,created_at";
const CONVERSATION_COLUMNS = "id,type,title,created_by,plan_id,community_id,created_at";
const NOTIFICATION_COLUMNS = "id,user_id,actor_id,type,title,body,entity_type,entity_id,read,created_at";
const SAVED_ITEM_COLUMNS = "id,user_id,item_type,item_id,created_at";

export async function loadConectaData(currentUser: User, demoModeEnabled: boolean): Promise<ConectaDataSnapshot> {
  /*
   * Phase 1 loads independent slices in parallel. Relationship-heavy slices are
   * intentionally deferred until we know which plans/communities/conversations
   * are actually relevant to the authenticated user.
   */
  const [
    profileResult,
    trustResult,
    plansResult,
    profilesResult,
    connectionsResult,
    communitiesResult,
    conversationMembershipsResult,
    notificationsResult,
    savedResult,
  ] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", currentUser.id).maybeSingle(),
    supabase.from("profile_trust").select(TRUST_COLUMNS).eq("user_id", currentUser.id).maybeSingle(),
    supabase.from("plans").select(PLAN_COLUMNS).in("status", ["published", "full"]).order("starts_at", { ascending: true }).limit(INITIAL_LIMITS.plans),
    supabase.from("profiles").select(PROFILE_COLUMNS).neq("id", currentUser.id).limit(INITIAL_LIMITS.profiles),
    supabase.from("connections").select(CONNECTION_COLUMNS).or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order("created_at", { ascending: false }).limit(INITIAL_LIMITS.connections),
    supabase.from("communities").select(COMMUNITY_COLUMNS).order("created_at", { ascending: false }).limit(INITIAL_LIMITS.communities),
    supabase.from("conversation_members").select("conversation_id").eq("user_id", currentUser.id).limit(INITIAL_LIMITS.conversations),
    supabase.from("notifications").select(NOTIFICATION_COLUMNS).eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(INITIAL_LIMITS.notifications),
    supabase.from("saved_items").select(SAVED_ITEM_COLUMNS).eq("user_id", currentUser.id).limit(INITIAL_LIMITS.savedItems),
  ]);

  const realPlans = (plansResult.data as unknown as Plan[] | null) ?? [];
  const realCommunities = (communitiesResult.data as unknown as Community[] | null) ?? [];
  const planIds = realPlans.map((plan) => plan.id);
  const communityIds = realCommunities.map((community) => community.id);
  const conversationIds = (((conversationMembershipsResult.data as unknown as Array<{ conversation_id: string }> | null) ?? []))
    .map((membership) => membership.conversation_id)
    .filter(Boolean);

  const [membersResult, communityMembersResult, conversationsResult] = await Promise.all([
    planIds.length
      ? supabase.from("plan_members").select(PLAN_MEMBER_COLUMNS).in("plan_id", planIds).order("joined_at", { ascending: false }).limit(INITIAL_LIMITS.planMembers)
      : Promise.resolve({ data: [] as PlanMember[], error: null }),
    communityIds.length
      ? supabase.from("community_members").select(COMMUNITY_MEMBER_COLUMNS).in("community_id", communityIds).order("joined_at", { ascending: false }).limit(INITIAL_LIMITS.communityMembers)
      : Promise.resolve({ data: [] as CommunityMember[], error: null }),
    conversationIds.length
      ? supabase.from("conversations").select(CONVERSATION_COLUMNS).in("id", conversationIds).order("created_at", { ascending: false }).limit(INITIAL_LIMITS.conversations)
      : Promise.resolve({ data: [] as Conversation[], error: null }),
  ]);

  const firstError = [
    profileResult.error,
    trustResult.error,
    plansResult.error,
    profilesResult.error,
    connectionsResult.error,
    communitiesResult.error,
    conversationMembershipsResult.error,
    notificationsResult.error,
    savedResult.error,
    membersResult.error,
    communityMembersResult.error,
    conversationsResult.error,
  ].find(Boolean);

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    trust: (trustResult.data as ProfileTrust | null) ?? null,
    plans: mergeDemoPlans(realPlans, demoModeEnabled),
    planMembers: (membersResult.data as unknown as PlanMember[] | null) ?? [],
    profiles: mergeDemoProfiles((profilesResult.data as unknown as Profile[] | null) ?? [], demoModeEnabled),
    connections: (connectionsResult.data as unknown as Connection[] | null) ?? [],
    communities: mergeDemoCommunities(realCommunities, demoModeEnabled),
    communityMembers: (communityMembersResult.data as unknown as CommunityMember[] | null) ?? [],
    conversations: (conversationsResult.data as unknown as Conversation[] | null) ?? [],
    notifications: (notificationsResult.data as unknown as NotificationRecord[] | null) ?? [],
    savedItems: (savedResult.data as unknown as SavedItem[] | null) ?? [],
    errorMessage: firstError?.message ?? null,
  };
}
