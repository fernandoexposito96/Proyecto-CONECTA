import { supabase } from "../supabase";
import type { Connection, Conversation, PlanMember, SavedItem } from "../types";

const SLICE_LIMITS = {
  planMembers: 300,
  connections: 160,
  conversations: 80,
  savedItems: 200,
} as const;

const PLAN_MEMBER_COLUMNS = "plan_id,user_id,joined_at,status,role,confirmed_at,checked_in_at,checked_out_at,punctuality_minutes,note";
const SAVED_ITEM_COLUMNS = "id,user_id,item_type,item_id,created_at";
const CONNECTION_COLUMNS = "id,requester_id,receiver_id,status,created_at";
const CONVERSATION_COLUMNS = "id,type,title,created_by,plan_id,community_id,created_at";

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function refreshPlanMembers(): Promise<PlanMember[]> {
  const { data, error } = await supabase
    .from("plan_members")
    .select(PLAN_MEMBER_COLUMNS)
    .order("joined_at", { ascending: false })
    .limit(SLICE_LIMITS.planMembers);
  throwIfError(error);
  return (data as unknown as PlanMember[] | null) ?? [];
}

export async function refreshSavedItems(userId: string): Promise<SavedItem[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select(SAVED_ITEM_COLUMNS)
    .eq("user_id", userId)
    .limit(SLICE_LIMITS.savedItems);
  throwIfError(error);
  return (data as unknown as SavedItem[] | null) ?? [];
}

export async function refreshConnections(): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(SLICE_LIMITS.connections);
  throwIfError(error);
  return (data as unknown as Connection[] | null) ?? [];
}

export async function refreshConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(SLICE_LIMITS.conversations);
  throwIfError(error);
  return (data as unknown as Conversation[] | null) ?? [];
}
