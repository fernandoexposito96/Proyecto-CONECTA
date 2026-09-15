import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Video } from 'lucide-react';
import { loadProfileMedia, removeProfileMedia, uploadProfileMedia, type ProfileMediaItem } from '../lib/communityBackend';
import type { View } from '../types';
import { ProfileView } from './ProfileView';

export function ProfileEnhancedView({setView}:{setView:(v:View)=>void}){
  const [items,setItems]=useState<ProfileMediaItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const photoRef=useRef<HTMLInputElement|null>(null);
  const videoRef=useRef<HTMLInputElement|null>(null);

  const refresh=()=>{setLoading(true);setError('');void loadProfileMedia().then(setItems).catch(e=>setError(e instanceof Error?e.message:'No se ha podido cargar tu contenido.')).finally(()=>setLoading(false))};
  useEffect(()=>{refresh()},[]);

  const upload=async(file?:File)=>{if(!file)return;setUploading(true);setError('');try{const item=await uploadProfileMedia(file,'profile');setItems(prev=>[item,...prev]);}catch(e){setError(e instanceof Error?e.message:'No se ha podido subir el archivo.')}finally{setUploading(false);if(photoRef.current)photoRef.current.value='';if(videoRef.current)videoRef.current.value='';}};
  const remove=async(item:ProfileMediaItem)=>{setError('');try{await removeProfileMedia(item);setItems(prev=>prev.filter(value=>value.id!==item.id));}catch(e){setError(e instanceof Error?e.message:'No se ha podido eliminar el archivo.')}};

  return <><ProfileView setView={setView}/><section className="profile-media-section"><div className="profile-media-shell"><div className="profile-media-head"><div><h2>Fotos y vídeos</h2><p>Todo lo que subas aquí o como estado queda guardado en tu perfil.</p></div><div className="profile-media-actions"><button type="button" disabled={uploading} onClick={()=>photoRef.current?.click()}><ImagePlus size={18}/>Foto</button><button type="button" disabled={uploading} onClick={()=>videoRef.current?.click()}><Video size={18}/>Vídeo</button></div></div>{error&&<div className="profile-media-error" role="alert">{error}</div>}<input ref={photoRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{void upload(e.target.files?.[0])}}/><input ref={videoRef} hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>{void upload(e.target.files?.[0])}}/>{loading?<div className="profile-media-empty">Cargando tus publicaciones…</div>:items.length?<div className="profile-media-grid">{items.map(item=><article className="profile-media-card" key={item.id}>{item.mediaType==='video'?<><video src={item.url} controls playsInline preload="metadata"/><span><Video size={15}/></span></>:<><img src={item.url} alt="Contenido de tu perfil"/><span><Camera size={15}/></span></>}<button type="button" aria-label="Eliminar contenido" onClick={()=>{void remove(item)}}><Trash2 size={15}/></button></article>)}</div>:<div className="profile-media-empty">Todavía no has subido fotos o vídeos.</div>}</div></section></>;
}
