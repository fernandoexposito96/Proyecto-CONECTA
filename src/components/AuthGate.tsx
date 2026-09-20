import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Apple, Eye, EyeOff, LockKeyhole, Mail, ArrowRight } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { clearLocalUserState, hydrateCloudState, queueCloudStateSave, resetCloudStateQueue } from '../lib/cloud';
import { setCloudStorageWriter } from '../lib/storage';
import { supabase } from '../lib/supabase';

export function AuthGate({children}:{children:ReactNode}){
  const [session,setSession]=useState<Session|null>(null);
  const [ready,setReady]=useState(false);
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [remember,setRemember]=useState(true);
  const invitePending=Boolean(new URL(window.location.href).searchParams.get('invite'));

  useEffect(()=>{
    let active=true;
    let prepareVersion=0;
    let initializedUserId:string|null|undefined;
    let preparingUserId:string|null|undefined;

    const prepare=async(nextSession:Session|null)=>{
      const nextUserId=nextSession?.user.id??null;
      if(!active)return;
      if(preparingUserId===nextUserId)return;
      if(initializedUserId!==undefined&&initializedUserId===nextUserId){
        setSession(nextSession);
        return;
      }

      const version=++prepareVersion;
      preparingUserId=nextUserId;
      setReady(false);
      setSession(nextSession);
      setCloudStorageWriter(null);
      resetCloudStateQueue();
      if(!nextSession)clearLocalUserState();

      try{
        if(nextSession){
          const hydrated=await hydrateCloudState(nextUserId||undefined);
          if(!hydrated||!active||version!==prepareVersion)return;
          setCloudStorageWriter(queueCloudStateSave);
        }
        if(active&&version===prepareVersion){
          initializedUserId=nextUserId;
          setReady(true);
        }
      }catch(error){
        console.warn('CONECTA cloud hydration failed; local state kept available',error);
        if(active&&version===prepareVersion){
          // Do not overwrite remote state with defaults after a failed read.
          initializedUserId=nextUserId;
          setReady(true);
        }
      }finally{
        if(version===prepareVersion)preparingUserId=undefined;
      }
    };

    void supabase.auth.getSession()
      .then(({data,error})=>{
        if(error)throw error;
        return prepare(data.session);
      })
      .catch(error=>{
        console.warn('CONECTA auth initialization failed',error);
        if(!active)return;
        initializedUserId=null;
        setSession(null);
        setCloudStorageWriter(null);
        resetCloudStateQueue();
        setMessage('No se ha podido conectar con el servicio de acceso. Comprueba tu conexión y vuelve a intentarlo.');
        setReady(true);
      });

    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      window.setTimeout(()=>{void prepare(nextSession)},0);
    });

    return ()=>{
      active=false;
      prepareVersion+=1;
      setCloudStorageWriter(null);
      resetCloudStateQueue();
      subscription.unsubscribe();
    };
  },[]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    const cleanEmail=email.trim();
    if(!cleanEmail||!password){
      setMessage('Escribe un correo válido y tu contraseña.');
      return;
    }
    if(mode==='signup'&&password.length<8){
      setMessage('Para crear una cuenta, la contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setBusy(true);
    setMessage('');
    try{
      if(mode==='login'){
        const {error}=await supabase.auth.signInWithPassword({email:cleanEmail,password});
        if(error)throw error;
      }else{
        const {data,error}=await supabase.auth.signUp({email:cleanEmail,password});
        if(error)throw error;
        if(!data.session)setMessage('Cuenta creada. Revisa tu correo para confirmar el registro y después inicia sesión.');
      }
    }catch(error){
      setMessage(error instanceof Error?error.message:'No se ha podido completar el acceso.');
    }finally{
      setBusy(false);
    }
  };

  if(!ready)return <div className="auth-loading"><span className="auth-loader"/><strong>CONECTA</strong><small>Preparando tus datos…</small></div>;
  if(session)return <>{children}</>;

  return <main className="auth-page auth-page-premium">
    <div className="auth-orb auth-orb-one" aria-hidden="true"/><div className="auth-orb auth-orb-two" aria-hidden="true"/>
    <div className="auth-hero-logo"><img src="./IMG_4752.jpeg" alt="CONECTA"/></div>
    <section className="auth-card auth-card-premium">
      <div className="auth-copy auth-copy-centered"><h1>{mode==='login'?'Bienvenido de nuevo':'Crea tu cuenta'}</h1><p>Tu cuenta sincroniza planes y preferencias<br className="auth-desktop-break"/> en todos tus dispositivos.</p>{invitePending&&<p><strong>Tienes una invitación a un plan.</strong> Entra o crea tu cuenta y te llevaremos directamente al plan.</p>}</div>
      <form onSubmit={submit} className="auth-form auth-form-premium">
        <label className="auth-field"><Mail size={22}/><input aria-label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="Correo electrónico" required/></label>
        <label className="auth-field"><LockKeyhole size={22}/><input aria-label="Contraseña" type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} minLength={mode==='signup'?8:undefined} placeholder={mode==='signup'?'Mínimo 8 caracteres':'Tu contraseña'} required/><button className="auth-eye" type="button" aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff size={21}/>:<Eye size={21}/>}</button></label>
        {mode==='login'&&<div className="auth-options"><label className="auth-remember"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/><span>Recordarme</span></label><button type="button" className="auth-forgot" onClick={()=>setMessage('Para recuperar tu contraseña, usa el correo asociado a tu cuenta.')}>¿Has olvidado tu contraseña?</button></div>}
        {message&&<div className="auth-message" role="status">{message}</div>}
        <button className="auth-submit" type="submit" disabled={busy}><span>{busy?'Procesando…':mode==='login'?'Entrar':'Crear cuenta'}</span>{!busy&&<ArrowRight size={24}/>}</button>
      </form>
      <div className="auth-divider"><span>o continúa con</span></div>
      <div className="auth-social" aria-label="Opciones de acceso"><button type="button" aria-label="Google"><span className="google-mark" aria-hidden="true"><i>G</i></span></button><button type="button" aria-label="Apple"><Apple size={25} fill="currentColor"/></button><button type="button" aria-label="Mensajes"><Mail size={25}/></button></div>
      <div className="auth-account-row"><span>{mode==='login'?'¿No tienes cuenta?':'¿Ya tienes cuenta?'}</span><button className="auth-switch" type="button" onClick={()=>{setMode(current=>current==='login'?'signup':'login');setMessage('')}}>{mode==='login'?'Crear una cuenta':'Iniciar sesión'} <ArrowRight size={19}/></button></div>
    </section>
  </main>;
}
