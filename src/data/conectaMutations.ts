import { supabase } from "../supabase";

function assertOk(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function joinPlanMutation(planId: string, userId: string) {
  const { error } = await supabase.from("plan_members").upsert(
    { plan_id: planId, user_id: userId, attendance_status: "going" },
    { onConflict: "plan_id,user_id" },
  );
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
  const { error } = await supabase.from("saved_items").upsert(
    { user_id: userId, item_type: "plan", item_id: planId },
    { onConflict: "user_id,item_type,item_id" },
  );
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

export async function connectMutation(requesterId: string, addresseeId: string) {
  const { error } = await supabase.from("connections").upsert(
    { requester_id: requesterId, addressee_id: addresseeId, status: "pending" },
    { onConflict: "requester_id,addressee_id" },
  );
  assertOk(error);
}

export async function blockConnectionMutation(userId: string, personId: string) {
  const { error } = await supabase
    .from("connections")
    .update({ status: "blocked" })
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${personId}),and(requester_id.eq.${personId},addressee_id.eq.${userId})`);
  assertOk(error);
}
