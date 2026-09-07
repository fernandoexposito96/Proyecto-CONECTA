import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { hydrateCloudState, queueCloudStateSave } from '../lib/cloud';
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

  useEffect(()=>{
    let active=true;

    const prepare=async(nextSession:Session|null)=>{
      if(!active)return;
      setReady(false);
      setSession(nextSession);
      setCloudStorageWriter(null);
      if(nextSession){
        try{
          await hydrateCloudState();
          setCloudStorageWriter(queueCloudStateSave);
        }catch(error){
          console.warn('CONECTA cloud hydration failed',error);
        }
      }
      if(active)setReady(true);
    };

    void supabase.auth.getSession().then(({data})=>prepare(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      window.setTimeout(()=>{void prepare(nextSession)},0);
    });

    return ()=>{
      active=false;
      setCloudStorageWriter(null);
      subscription.unsubscribe();
    };
  },[]);

  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    const cleanEmail=email.trim();
    if(!cleanEmail||password.length<6){
      setMessage('Escribe un correo válido y una contraseña de al menos 6 caracteres.');
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

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><span>C</span><div><strong>CONECTA</strong><small>Planes reales · gente compatible</small></div></div>
      <div className="auth-copy"><h1>{mode==='login'?'Bienvenido de nuevo':'Crea tu cuenta'}</h1><p>Tu cuenta sincroniza planes y preferencias entre dispositivos mediante el backend de CONECTA.</p></div>
      <form onSubmit={submit} className="auth-form">
        <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="tu@email.com" required/></label>
        <label>Contraseña<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} minLength={6} placeholder="Mínimo 6 caracteres" required/></label>
        {message&&<div className="auth-message" role="status">{message}</div>}
        <button type="submit" disabled={busy}>{busy?'Procesando…':mode==='login'?'Entrar':'Crear cuenta'}</button>
      </form>
      <button className="auth-switch" type="button" onClick={()=>{setMode(current=>current==='login'?'signup':'login');setMessage('')}}>{mode==='login'?'¿No tienes cuenta? Crear una':'Ya tengo cuenta · Iniciar sesión'}</button>
    </section>
  </main>;
}
