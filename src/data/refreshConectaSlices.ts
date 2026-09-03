import { supabase } from "../supabase";
import type { Connection, Conversation, PlanMember, SavedItem } from "../types";

const SLICE_LIMITS = {
  planMembers: 300,
  connections: 160,
  conversations: 80,
  savedItems: 200,
} as const;

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function refreshPlanMembers(): Promise<PlanMember[]> {
  const { data, error } = await supabase
    .from("plan_members")
    .select("*")
    .order("joined_at", { ascending: false })
    .limit(SLICE_LIMITS.planMembers);
  throwIfError(error);
  return (data as PlanMember[] | null) ?? [];
}

export async function refreshSavedItems(userId: string): Promise<SavedItem[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .limit(SLICE_LIMITS.savedItems);
  throwIfError(error);
  return (data as SavedItem[] | null) ?? [];
}

export async function refreshConnections(): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(SLICE_LIMITS.connections);
  throwIfError(error);
  return (data as Connection[] | null) ?? [];
}

export async function refreshConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(SLICE_LIMITS.conversations);
  throwIfError(error);
  return (data as Conversation[] | null) ?? [];
}
