import type { Community, Plan } from "./types";

function ics(value: string | null) { return value ? new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "") : ""; }
function safe(value: string) { return value.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n"); }

export function exportSocialCalendar(plans: Plan[], communities: Community[]) {
  const events = plans.filter((plan) => plan.starts_at).flatMap((plan) => ["BEGIN:VEVENT", `UID:${plan.id}@conecta`, `DTSTART:${ics(plan.starts_at)}`, `DTEND:${ics(plan.ends_at ?? plan.starts_at)}`, `SUMMARY:${safe(plan.title)}`, `LOCATION:${safe(plan.location_name ?? "")}`, "END:VEVENT"]);
  const notes = communities.map((community) => `X-CONECTA-COMMUNITY:${safe(community.name)}`);
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CONECTA//Agenda social//ES", ...events, ...notes, "END:VCALENDAR"].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "conecta-agenda.ics"; link.click(); URL.revokeObjectURL(url);
}
