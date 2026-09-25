import { supabase } from './supabase';
import { isRealUserId } from './privacyBackend';

export async function reportUser(reportedUserId:string,reason:string,details?:string){
  const cleanReason=reason.trim();
  const cleanDetails=details?.trim()||null;
  if(!isRealUserId(reportedUserId))return false;
  if(cleanReason.length<2||cleanReason.length>120)throw new Error('El motivo de la denuncia no es válido.');
  if(cleanDetails&&cleanDetails.length>1500)throw new Error('Los detalles de la denuncia son demasiado largos.');
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user||user.id===reportedUserId)return false;
  const {error}=await supabase.from('reports').insert({reporter_id:user.id,reported_user_id:reportedUserId,reason:cleanReason,details:cleanDetails,status:'pending'});
  if(error)throw error;
  return true;
}
