import type { User } from "@supabase/supabase-js";
import { demoCommunities, demoPlans, demoProfiles } from "../demoMode";
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

/**
 * Temporary full-demo policy.
 *
 * CONECTA currently runs with isolated demo content so product work can continue
 * without mixing example entities with production records or reading social
 * slices from the live database. Authentication remains separate from this data
 * snapshot and can be restored to live data later without changing the UI.
 */
export async function loadConectaData(
  _currentUser: User,
  _demoModeEnabled: boolean,
): Promise<ConectaDataSnapshot> {
  const demoProfile = demoProfiles[0] ?? null;

  return {
    profile: demoProfile,
    trust: null,
    plans: [...demoPlans],
    planMembers: [],
    profiles: [...demoProfiles],
    connections: [],
    communities: [...demoCommunities],
    communityMembers: [],
    conversations: [],
    notifications: [],
    savedItems: [],
    errorMessage: null,
  };
}
