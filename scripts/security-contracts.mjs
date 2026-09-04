import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".html", ".json", ".svg"]);

async function collectFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (TEXT_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const frontendFiles = [...await collectFiles("src"), ...await collectFiles("public")];
const forbidden = [
  { name: "Supabase service-role token", pattern: /\bservice_role\b/i },
  { name: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_-]+/ },
  { name: "service-role environment variable", pattern: /SUPABASE_SERVICE_ROLE(?:_KEY)?/i },
  { name: "private/secret VITE variable", pattern: /VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE)[A-Z0-9_]*/ },
  { name: "embedded private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

for (const path of frontendFiles) {
  const content = await readFile(path, "utf8");
  for (const rule of forbidden) {
    assert.doesNotMatch(content, rule.pattern, `${rule.name} must never ship in frontend file ${path}`);
  }
}

const envExample = await readFile(".env.example", "utf8");
assert.match(envExample, /^VITE_SUPABASE_URL=/m);
assert.match(envExample, /^VITE_SUPABASE_PUBLISHABLE_KEY=/m);
assert.doesNotMatch(envExample, /SERVICE_ROLE|SECRET|PRIVATE_KEY/i);

const supabaseClient = await readFile("src/supabase.ts", "utf8");
assert.match(supabaseClient, /VITE_SUPABASE_PUBLISHABLE_KEY/);
assert.doesNotMatch(supabaseClient, /SUPABASE_SERVICE_ROLE|sb_secret_/i);

const leastPrivilegeMigration = await readFile(
  "supabase/migrations/20260904163000_enforce_least_privilege_api_roles.sql",
  "utf8",
);
assert.match(leastPrivilegeMigration, /revoke all privileges on all tables in schema public from anon/i);
assert.match(leastPrivilegeMigration, /revoke truncate, references, trigger[\s\S]*from authenticated/i);
assert.match(leastPrivilegeMigration, /revoke execute on all functions in schema private from public/i);

const retiredPasskeysMigration = await readFile(
  "supabase/migrations/20260904164500_retire_legacy_passkey_table.sql",
  "utf8",
);
assert.match(retiredPasskeysMigration, /revoke all privileges on table public\.passkey_credentials from anon, authenticated/i);

console.log(`✓ CONECTA security contracts …61073 tokens truncated…onBusy} onChange={(event) => void submitIdentityVideo(event)} /></label></article></section><section className="section-block"><SectionTitle eyebrow="CONTACTO DE EMERGENCIA" title="Comparte tu próxima quedada" /><div className="emergency-layout"><form className="emergency-form" onSubmit={addContact}><Field label="Nombre"><input name="name" required /></Field><Field label="Teléfono"><input name="phone" type="tel" required placeholder="+34…" /></Field><Field label="Relación"><input name="relationship" required /></Field><button className="primary-action" type="submit"><Plus /> Añadir contacto</button></form><div className="contact-list">{contacts.map((contact) => <article key={contact.id}><span>{contact.name[0]?.toUpperCase()}</span><div><strong>{contact.name}</strong><small>{contact.relationship} · {contact.phone}</small></div><button onClick={async () => { const { error } = await supabase.from("emergency_contacts").delete().eq("id", contact.id); if (error) return toast.error(error.message); await loadContacts(); }}><X /></button></article>)}{!contacts.length && <EmptyCompact icon={<Phone />} title="Sin contacto configurado" text="Añade una persona de confianza para compartir tus quedadas." />}</div></div></section><section className="section-block"><SectionTitle eyebrow="SESIÓN DE SEGURIDAD" title="Comparte tu quedada durante 2 horas" /><article className="security-status"><span><Navigation /></span><div><small>{safetySession ? "SEGUIMIENTO ACTIVO" : "CHECK-IN DE SEGURIDAD"}</small><h2>{safetySession ? "Tu contacto puede seguir este enlace temporal" : "Activa la protección al llegar al plan"}</h2></div><div>{safetySession ? <><button className="secondary-action" onClick={() => void shareSafetySession()}>Compartir</button><button className="primary-action" disabled={safetyBusy} onClick={() => void endSafetySession()}>Finalizar</button></> : <button className="primary-action" disabled={safetyBusy || !contacts.length} onClick={() => void startSafetySession()}><Shield /> Activar 2 horas</button>}</div></article></section><section className="section-block"><SectionTitle eyebrow="TUS DATOS" title="Portabilidad y control" /><article className="security-status"><span><Download /></span><div><h2>Descarga una copia de tus datos</h2><p>Genera un JSON con tus datos vinculados a CONECTA.</p></div><button className="secondary-action" onClick={() => void downloadMyConectaData(user.id)}><Download /> Descargar mis datos</button></article></section><section className="danger-zone"><div><strong>Eliminar mi cuenta y todos mis datos</strong><p>Esta acción es definitiva.</p></div><AlertDialog><AlertDialogTrigger asChild><button>Eliminar cuenta</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar tu cuenta para siempre?</AlertDialogTitle><AlertDialogDescription>No se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void onDeleted()}>Eliminar definitivamente</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></section></div>;
}
