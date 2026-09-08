import { useEffect, useState } from 'react';
import { BadgeCheck, Camera, Database, Globe, LockKeyhole, LogOut, Mail, PhoneCall, ShieldCheck, Smartphone } from 'lucide-react';
import { loadPrimaryEmergencyContact, savePrimaryEmergencyContact, type EmergencyContact } from '../../lib/safetyBackend';
import { loadIdentityVerification, submitSelfieVerification, type IdentityVerificationState } from '../../lib/verificationBackend';
import { SettingsHeader, SettingsInfoScreen, SettingsRow } from './SettingsPrimitives';

const emptyVerification:IdentityVerificationState={status:'none',createdAt:null,reviewNote:null};
const verificationLabel=(status:IdentityVerificationState['status'])=>status==='approved'?'Verificada':status==='pending'?'Pendiente de revisión':status==='rejected'?'Revisión rechazada':'Sin verificar';

export function SecuritySettingsScreen({email,signingOut,notice,onBack,onChangePassword,onOpenAction,onSignOutAll}:{email:string;signingOut:boolean;notice:string;onBack:()=>void;onChangePassword:()=>void;onOpenAction:(title:string,body:string)=>void;onSignOutAll:()=>void}){
  const [showSelfie,setShowSelfie]=useState(false);
  const [verification,setVerification]=useState<IdentityVerificationState>(emptyVerification);
  const [verificationBusy,setVerificationBusy]=useState(false);
  const [verificationError,setVerificationError]=useState('');
  const [showEmergency,setShowEmergency]=useState(false);
  const [emergency,setEmergency]=useState<EmergencyContact|null>(null);
  const [emergencyName,setEmergencyName]=useState('');
  const [emergencyPhone,setEmergencyPhone]=useState('');
  const [emergencyRelationship,setEmergencyRelationship]=useState('');
  const [emergencyBusy,setEmergencyBusy]=useState(false);
  const [emergencyError,setEmergencyError]=useState('');

  useEffect(()=>{
    let active=true;
    void loadIdentityVerification()
      .then(state=>{if(active)setVerification(state)})
      .catch(error=>console.warn('CONECTA identity verification status unavailable',error));
    void loadPrimaryEmergencyContact()
      .then(contact=>{
        if(!active)return;
        setEmergency(contact);
        if(contact){
          setEmergencyName(contact.name);
          setEmergencyPhone(contact.phone);
          setEmergencyRelationship(contact.relationship||'');
        }
      })
      .catch(error=>console.warn('CONECTA emergency contact unavailable',error));
    return ()=>{active=false};
  },[]);

  const submitSelfie=async(file:File|null)=>{
    if(!file)return;
    setVerificationBusy(true);
    setVerificationError('');
    try{
      const state=await submitSelfieVerification(file);
      setVerification(state);
    }catch(error){
      setVerificationError(error instanceof Error?error.message:'No se ha podido enviar la selfie.');
    }finally{
      setVerificationBusy(false);
    }
  };

  const saveEmergency=async()=>{
    setEmergencyBusy(true);
    setEmergencyError('');
    try{
      const contact=await savePrimaryEmergencyContact(emergencyName,emergencyPhone,emergencyRelationship);
      setEmergency(contact);
      if(contact){
        setEmergencyName(contact.name);
        setEmergencyPhone(contact.phone);
        setEmergencyRelationship(contact.relationship||'');
      }
    }catch(error){
      setEmergencyError(error instanceof Error?error.message:'No se ha podido guardar el contacto.');
    }finally{
      setEmergencyBusy(false);
    }
  };

  return <div className="page settings-page">
    <div className="settings-shell">
      <SettingsHeader title="Seguridad" subtitle="Mantén tu cuenta protegida" onBack={onBack}/>
      <div className="settings-list-card">
        <SettingsRow icon={LockKeyhole} title="Contraseña" subtitle="Cambia tu contraseña de acceso" onClick={onChangePassword}/>
        <SettingsRow icon={Camera} title="Verificación por selfie" subtitle={verificationLabel(verification.status)} onClick={()=>setShowSelfie(value=>!value)}/>
        <SettingsRow icon={PhoneCall} title="Contacto de emergencia" subtitle={emergency?`${emergency.name} · configurado`:'Sin configurar'} onClick={()=>setShowEmergency(value=>!value)}/>
        <SettingsRow icon={ShieldCheck} title="Verificación en dos pasos" subtitle="Opción de seguridad del demo" onClick={()=>onOpenAction('Verificación en dos pasos','Esta opción sigue siendo demostrativa. La sesión actual ya está gestionada por el sistema de autenticación de CONECTA.')}/>
        <SettingsRow icon={Mail} title="Verificación de email" subtitle={`${email} · Cuenta actual`} onClick={()=>onOpenAction('Verificación de email','Este es el correo asociado a la sesión autenticada con la que has entrado en CONECTA.')}/>
        <SettingsRow icon={Smartphone} title="Verificación de teléfono" subtitle="Disponible en el demo" onClick={()=>onOpenAction('Verificación de teléfono','La verificación por teléfono sigue formando parte de la experiencia demo y aún no está activada como método de acceso.')}/>
        <SettingsRow icon={BadgeCheck} title="Apple" subtitle="Acceso demo" onClick={()=>onOpenAction('Acceso con Apple','Apple se mantiene visible como parte del diseño demo. El acceso real disponible actualmente es el de correo y contraseña.')}/>
        <SettingsRow icon={Globe} title="Google" subtitle="Acceso demo" onClick={()=>onOpenAction('Acceso con Google','Google se mantiene visible como parte del diseño demo. El acceso real disponible actualmente es el de correo y contraseña.')}/>
        <SettingsRow icon={Database} title="Sesiones activas" subtitle="Gestionadas por tu cuenta" onClick={()=>onOpenAction('Sesiones activas','La sesión actual está gestionada por la autenticación real. El botón inferior cierra las sesiones activas de tu cuenta.')}/>
      </div>
      {showSelfie&&<div className="settings-account-form">
        <strong>Verificación de identidad</strong>
        <p>Haz una selfie frontal y nítida. La imagen se guarda en almacenamiento privado y queda pendiente de revisión.</p>
        {verification.status==='approved'?<p className="settings-success">Tu identidad ya está verificada.</p>:<label>Selfie JPEG<input type="file" accept="image/jpeg" capture="user" disabled={verificationBusy} onChange={event=>{void submitSelfie(event.target.files?.[0]||null);event.currentTarget.value=''}}/></label>}
        {verification.status==='pending'&&<p className="settings-field-hint">Solicitud enviada. Estado: pendiente de revisión.</p>}
        {verification.reviewNote&&<p className="settings-field-hint">Revisión: {verification.reviewNote}</p>}
        {verificationError&&<p className="settings-error" role="alert">{verificationError}</p>}
        {verificationBusy&&<p className="settings-field-hint">Subiendo selfie de forma segura…</p>}
      </div>}
      {showEmergency&&<div className="settings-account-form">
        <strong>Contacto de emergencia</strong>
        <p>Se usa al activar el check-in de seguridad desde un plan.</p>
        <label>Nombre<input value={emergencyName} disabled={emergencyBusy} onChange={event=>setEmergencyName(event.target.value)} placeholder="Nombre del contacto"/></label>
        <label>Teléfono<input type="tel" value={emergencyPhone} disabled={emergencyBusy} onChange={event=>setEmergencyPhone(event.target.value)} placeholder="+34 600 000 000"/></label>
        <label>Relación<input value={emergencyRelationship} disabled={emergencyBusy} onChange={event=>setEmergencyRelationship(event.target.value)} placeholder="Familia, amigo…"/></label>
        {emergencyError&&<p className="settings-error" role="alert">{emergencyError}</p>}
        <button className="settings-inline-action" disabled={emergencyBusy} onClick={()=>{void saveEmergency()}}>{emergencyBusy?'Guardando…':emergency?'Actualizar contacto':'Guardar contacto'}</button>
      </div>}
      <button className="settings-danger-cta" disabled={signingOut} onClick={onSignOutAll}><LogOut/><span><strong>{signingOut?'Cerrando sesiones…':'Cerrar todas las sesiones'}</strong><small>Cierra sesión en todos tus dispositivos</small></span></button>
      {notice&&<p className="settings-success">{notice}</p>}
    </div>
  </div>;
}

export function ChangePasswordScreen({newPassword,confirmPassword,saving,error,onBack,onNewPassword,onConfirmPassword,onSave}:{newPassword:string;confirmPassword:string;saving:boolean;error:string;onBack:()=>void;onNewPassword:(value:string)=>void;onConfirmPassword:(value:string)=>void;onSave:()=>void}){
  return <SettingsInfoScreen title="Cambiar contraseña" subtitle="Actualiza tu acceso a CONECTA" onBack={onBack}>
    <div className="settings-account-form">
      <label>Nueva contraseña<input type="password" value={newPassword} onChange={e=>onNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password"/></label>
      <label>Confirmar contraseña<input type="password" value={confirmPassword} onChange={e=>onConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" autoComplete="new-password"/></label>
      <small className="settings-field-hint">Usa al menos 8 caracteres y evita reutilizar una contraseña de otro servicio.</small>
      {error&&<p className="settings-error" role="alert">{error}</p>}
      <div>
        <button className="settings-inline-action" disabled={saving} onClick={onSave}>{saving?'Guardando…':'Guardar contraseña'}</button>
        <button className="settings-secondary-action" disabled={saving} onClick={onBack}>Cancelar</button>
      </div>
    </div>
  </SettingsInfoScreen>;
}
