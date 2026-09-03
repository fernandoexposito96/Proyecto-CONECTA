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

// Initial-screen safety bounds. Dedicated screens can page beyond these windows.
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

export async function loadConectaData(currentUser: User, demoModeEnabled: boolean): Promise<ConectaDataSnapshot> {
  const [
    profileResult,
    trustResult,
    plansResult,
    membersResult,
    profilesResult,
    connectionsResult,
    communitiesResult,
    communityMembersResult,
    conversationsResult,
    notificationsResult,
    savedResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
    supabase.from("profile_trust").select("*").eq("user_id", currentUser.id).maybeSingle(),
    supabase.from("plans").select("*").in("status", ["published", "full"]).order("starts_at", { ascending: true }).limit(INITIAL_LIMITS.plans),
    supabase.from("plan_members").select("*").order("joined_at", { ascending: false }).limit(INITIAL_LIMITS.planMembers),
    supabase.from("profiles").select("*").neq("id", currentUser.id).limit(INITIAL_LIMITS.profiles),
    supabase.from("connections").select("*").order("created_at", { ascending: false }).limit(INITIAL_LIMITS.connections),
    supabase.from("communities").select("*").order("created_at", { ascending: false }).limit(INITIAL_LIMITS.communities),
    supabase.from("community_members").select("*").order("joined_at", { ascending: false }).limit(INITIAL_LIMITS.communityMembers),
    supabase.from("conversations").select("*").order("created_at", { ascending: false }).limit(INITIAL_LIMITS.conversations),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(INITIAL_LIMITS.notifications),
    supabase.from("saved_items").select("*").eq("user_id", currentUser.id).limit(INITIAL_LIMITS.savedItems),
  ]);

  const firstError = [
    profileResult.error,
    trustResult.error,
    plansResult.error,
    membersResult.error,
    profilesResult.error,
    connectionsResult.error,
    communitiesResult.error,
    communityMembersResult.error,
    conversationsResult.error,
    notificationsResult.error,
    savedResult.error,
  ].find(Boolean);

  return {
    profile: (profileResult.data as Profile | null) ?? null,
    trust: (trustResult.data as ProfileTrust | null) ?? null,
    plans: mergeDemoPlans((plansResult.data as Plan[] | null) ?? [], demoModeEnabled),
    planMembers: (membersResult.data as PlanMember[] | null) ?? [],
    profiles: mergeDemoProfiles((profilesResult.data as Profile[] | null) ?? [], demoModeEnabled),
    connections: (connectionsResult.data as Connection[] | null) ?? [],
    communities: mergeDemoCommunities((communitiesResult.data as Community[] | null) ?? [], demoModeEnabled),
    communityMembers: (communityMembersResult.data as CommunityMember[] | null) ?? [],
    conversations: (conversationsResult.data as Conversation[] | null) ?? [],
    notifications: (notificationsResult.data as NotificationRecord[] | null) ?? [],
    savedItems: (savedResult.data as SavedItem[] | null) ?? [],
    errorMessage: firstError?.message ?? null,
  };
}
