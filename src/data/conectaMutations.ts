import { supabase } from "../supabase";

function assertOk(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function joinPlanMutation(planId: string, userId: string) {
  const { error } = await supabase
    .from("plan_members")
    .insert({ plan_id: planId, user_id: userId, role: "participant" });
  assertOk(error);
}

export async function leavePlanMutation(planId: string, userId: string) {
  const { error } = await supabase
    .from("plan_members")
    .delete()
    .eq("plan_id", planId)
    .eq("user_id", userId);
  assertOk(error);
}

export async function savePlanMutation(planId: string, userId: string) {
  const { error } = await supabase
    .from("saved_items")
    .insert({ user_id: userId, item_type: "plan", item_id: planId });
  assertOk(error);
}

export async function unsavePlanMutation(planId: string, userId: string) {
  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", "plan")
    .eq("item_id", planId);
  assertOk(error);
}

export async function requestConnectionMutation(requesterId: string, receiverId: string) {
  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: requesterId, receiver_id: receiverId });
  assertOk(error);
}

export async function acceptConnectionMutation(connectionId: string) {
  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", connectionId);
  assertOk(error);
}

export async function deleteConnectionMutation(connectionId: string) {
  const { error } = await supabase.from("connections").delete().eq("id", connectionId);
  assertOk(error);
}

export async function blockConnectionMutation(userId: string, personId: string) {
  const { error: blockError } = await supabase
    .from("blocks")
    .insert({ blocker_id: userId, blocked_id: personId });
  assertOk(blockError);

  const { error: connectionError } = await supabase
    .from("connections")
    .delete()
    .or(`and(requester_id.eq.${userId},receiver_id.eq.${personId}),and(requester_id.eq.${personId},receiver_id.eq.${userId})`);
  assertOk(connectionError);
}
