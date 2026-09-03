import { supabase } from "./supabase";

const tables = [["profile","profiles","id"],["trust","profile_trust","user_id"],["plan_memberships","plan_members","user_id"],["community_memberships","community_members","user_id"],["connections_requested","connections","requester_id"],["connections_received","connections","receiver_id"],["messages","messages","sender_id"],["notifications","notifications","user_id"],["saved_items","saved_items","user_id"],["reviews","plan_ratings","reviewer_id"],["emergency_contacts","emergency_contacts","user_id"],["privacy_consents","privacy_consents","user_id"],["achievements","user_achievements","user_id"],["challenges","user_challenges","user_id"]] as const;

export async function downloadMyConectaData(userId: string) {
  const payload: Record<string, unknown> = { exported_at: new Date().toISOString(), format: "CONECTA personal data export v1", user_id: userId };
  for (const [label, table, column] of tables) { const { data, error } = await supabase.from(table).select("*").eq(column, userId); payload[label] = error ? { unavailable: true, reason: error.message } : data ?? []; }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `conecta-mis-datos-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
}
