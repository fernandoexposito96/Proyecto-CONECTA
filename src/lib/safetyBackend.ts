import { supabase } from './supabase';

export type EmergencyContact={
  id:string;
  name:string;
  phone:string;
  relationship:string|null;
};

export type SafetySession={
  id:string;
  contact:EmergencyContact;
};

export async function loadPrimaryEmergencyContact():Promise<EmergencyContact|null>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return null;
  const {data,error}=await supabase
    .from('emergency_contacts')
    .select('id,name,phone,relationship,is_primary,created_at')
    .eq('user_id',user.id)
    .order('is_primary',{ascending:false})
    .order('created_at',{ascending:true})
    .limit(1)
    .maybeSingle();
  if(error)throw error;
  if(!data)return null;
  return {
    id:String(data.id||''),
    name:String(data.name||'Contacto de emergencia'),
    phone:String(data.phone||''),
    relationship:typeof data.relationship==='string'?data.relationship:null,
  };
}

export async function savePrimaryEmergencyContact(name:string,phone:string,relationship:string){
  const cleanName=name.trim();
  const cleanPhone=phone.trim();
  const cleanRelationship=relationship.trim();
  if(cleanName.length<2)throw new Error('Escribe el nombre de tu contacto de emergencia.');
  if(cleanPhone.length<6)throw new Error('Escribe un teléfono válido.');
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para guardar un contacto de emergencia.');

  const current=await loadPrimaryEmergencyContact();
  if(current){
    const {error}=await supabase
      .from('emergency_contacts')
      .update({name:cleanName,phone:cleanPhone,relationship:cleanRelationship||null,is_primary:true,updated_at:new Date().toISOString()})
      .eq('id',current.id);
    if(error)throw error;
  }else{
    const {error}=await supabase.from('emergency_contacts').insert({
      user_id:user.id,
      name:cleanName,
      phone:cleanPhone,
      relationship:cleanRelationship||null,
      is_primary:true,
    });
    if(error)throw error;
  }
  return loadPrimaryEmergencyContact();
}

export async function startSafetySession(planId?:string):Promise<SafetySession>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para activar el modo seguridad.');
  const contact=await loadPrimaryEmergencyContact();
  if(!contact)throw new Error('Añade primero un contacto de emergencia en tu cuenta.');

  const {data,error}=await supabase
    .from('safety_sessions')
    .insert({
      user_id:user.id,
      plan_id:planId||null,
      emergency_contact_id:contact.id,
      status:'active',
      expires_at:new Date(Date.now()+4*60*60*1000).toISOString(),
    })
    .select('id')
    .single();
  if(error)throw error;
  return {id:String(data.id||''),contact};
}

export async function finishSafetySession(sessionId:string){
  if(!sessionId)return;
  const {error}=await supabase
    .from('safety_sessions')
    .update({status:'completed',updated_at:new Date().toISOString()})
    .eq('id',sessionId);
  if(error)throw error;
}

export function safetySmsUrl(contact:EmergencyContact,planTitle:string,finished=false){
  const message=finished
    ? `CONECTA: he terminado mi plan “${planTitle}” y estoy bien.`
    : `CONECTA: inicio mi check-in de seguridad para “${planTitle}”. Te avisaré cuando termine.`;
  const separator=/iPhone|iPad|iPod/i.test(navigator.userAgent)?'&':'?';
  return `sms:${encodeURIComponent(contact.phone)}${separator}body=${encodeURIComponent(message)}`;
}
