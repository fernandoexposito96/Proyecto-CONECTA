import { supabase } from './supabase';

export type PlanPollOption={
  id:string;
  label:string;
  position:number;
  votes:number;
  votedByMe:boolean;
};

export type PlanPoll={
  id:string;
  question:string;
  multipleChoice:boolean;
  closesAt:string|null;
  options:PlanPollOption[];
};

export async function loadPlanPolls(planId:string):Promise<PlanPoll[]>{
  if(!planId)return [];
  const {data:pollRows,error:pollError}=await supabase
    .from('plan_polls')
    .select('id,question,multiple_choice,closes_at,created_at')
    .eq('plan_id',planId)
    .order('created_at',{ascending:false});
  if(pollError)throw pollError;
  const pollIds=(pollRows||[]).map(row=>String(row.id||'')).filter(Boolean);
  if(!pollIds.length)return [];

  const [{data:optionRows,error:optionError},{data:voteRows,error:voteError},{data:{user},error:userError}]=await Promise.all([
    supabase.from('plan_poll_options').select('id,poll_id,label,position').in('poll_id',pollIds).order('position',{ascending:true}),
    supabase.from('plan_poll_votes').select('option_id,user_id').in('option_id',(await supabase.from('plan_poll_options').select('id').in('poll_id',pollIds)).data?.map(row=>row.id)||[]),
    supabase.auth.getUser(),
  ]);
  if(optionError)throw optionError;
  if(voteError)throw voteError;
  if(userError)throw userError;

  const currentUserId=user?.id||'';
  return (pollRows||[]).map(row=>{
    const id=String(row.id||'');
    const options=(optionRows||[])
      .filter(option=>String(option.poll_id||'')===id)
      .map(option=>{
        const optionId=String(option.id||'');
        const votes=(voteRows||[]).filter(vote=>String(vote.option_id||'')===optionId);
        return {
          id:optionId,
          label:String(option.label||''),
          position:Number(option.position||0),
          votes:votes.length,
          votedByMe:Boolean(currentUserId&&votes.some(vote=>String(vote.user_id||'')===currentUserId)),
        } satisfies PlanPollOption;
      });
    return {
      id,
      question:String(row.question||''),
      multipleChoice:Boolean(row.multiple_choice),
      closesAt:typeof row.closes_at==='string'?row.closes_at:null,
      options,
    } satisfies PlanPoll;
  });
}

export async function createPlanPoll(planId:string,question:string,labels:string[]){
  const cleanQuestion=question.trim();
  const cleanLabels=[...new Set(labels.map(label=>label.trim()).filter(Boolean))].slice(0,6);
  if(!planId)throw new Error('Falta el plan real asociado a la encuesta.');
  if(cleanQuestion.length<3)throw new Error('Escribe una pregunta de al menos 3 caracteres.');
  if(cleanLabels.length<2)throw new Error('Añade al menos dos opciones.');

  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para crear una encuesta.');

  const {data:poll,error:pollError}=await supabase
    .from('plan_polls')
    .insert({plan_id:planId,created_by:user.id,question:cleanQuestion,multiple_choice:false})
    .select('id')
    .single();
  if(pollError)throw pollError;

  const pollId=String(poll.id||'');
  const {error:optionError}=await supabase.from('plan_poll_options').insert(cleanLabels.map((label,index)=>({poll_id:pollId,label,position:index})));
  if(optionError){
    await supabase.from('plan_polls').delete().eq('id',pollId);
    throw optionError;
  }
  return pollId;
}

export async function votePlanPoll(poll:PlanPoll,optionId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para votar.');
  const optionIds=poll.options.map(option=>option.id);
  if(!optionIds.includes(optionId))throw new Error('Opción de encuesta no válida.');

  if(!poll.multipleChoice){
    const {error:deleteError}=await supabase
      .from('plan_poll_votes')
      .delete()
      .eq('user_id',user.id)
      .in('option_id',optionIds);
    if(deleteError)throw deleteError;
  }

  const alreadyVoted=poll.options.find(option=>option.id===optionId)?.votedByMe;
  if(poll.multipleChoice&&alreadyVoted){
    const {error}=await supabase.from('plan_poll_votes').delete().eq('user_id',user.id).eq('option_id',optionId);
    if(error)throw error;
    return;
  }

  const {error}=await supabase.from('plan_poll_votes').insert({option_id:optionId,user_id:user.id});
  if(error&&error.code!=='23505')throw error;
}

export async function createPlanInvite(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para invitar a alguien.');
  const {data,error}=await supabase
    .from('plan_invites')
    .insert({plan_id:planId,inviter_id:user.id})
    .select('invite_code')
    .single();
  if(error)throw error;
  const code=String(data.invite_code||'');
  const url=new URL(window.location.href);
  url.searchParams.set('invite',code);
  url.hash='';
  return {code,url:url.toString()};
}

export async function issuePlanCheckinCode(planId:string){
  const {data,error}=await supabase.rpc('issue_plan_checkin_code',{p_plan:planId});
  if(error)throw error;
  return String(data||'');
}

export async function checkinWithCode(code:string){
  const clean=code.trim();
  if(!clean)throw new Error('Introduce el código de check-in.');
  const {data,error}=await supabase.rpc('checkin_with_code',{p_code:clean});
  if(error)throw error;
  return String(data||'');
}
