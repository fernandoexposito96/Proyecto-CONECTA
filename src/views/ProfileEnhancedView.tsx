import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Video } from 'lucide-react';
import { loadProfileMedia, removeProfileMedia, uploadProfileMedia, type ProfileMediaItem } from '../lib/communityBackend';
import type { View } from '../types';
import { ProfileView } from './ProfileView';

const css=`
.profile-media-section{margin:20px auto 120px;max-width:960px;padding:0 18px}.profile-media-shell{padding:20px;border:1px solid rgba(116,71,244,.11);border-radius:28px;background:linear-gradient(180deg,#faf7ff,#fff);box-shadow:0 15px 36px rgba(61,40,121,.08)}.profile-media-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:15px}.profile-media-head h2{margin:0;color:#171e45;font-size:27px}.profile-media-head p{margin:5px 0 0;color:#81879b}.profile-media-actions{display:flex;gap:8px}.profile-media-actions button{height:42px;padding:0 14px;border:0;border-radius:999px;background:#7447f4;color:#fff;font-weight:900;display:flex;align-items:center;gap:7px}.profile-media-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.profile-media-card{position:relative;overflow:hidden;aspect-ratio:1/1;border-radius:18px;background:#eee8fb}.profile-media-card img,.profile-media-card video{width:100%;height:100%;object-fit:cover}.profile-media-card>span{position:absolute;left:9px;top:9px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;color:#7447f4}.profile-media-card>button{position:absolute;right:9px;top:9px;width:30px;height:30px;border:0;border-radius:50%;background:rgba(22,20,37,.72);display:grid;place-items:center;color:#fff}.profile-media-empty{padding:24px;border-radius:18px;background:#fff;color:#777e92;text-align:center}.profile-media-error{margin-bottom:12px;padding:10px 12px;border-radius:14px;background:#fff0f1;color:#a83b4b}@media(max-width:620px){.profile-media-head{align-items:flex-start;flex-direction:column}.profile-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.profile-media-actions{width:100%}.profile-media-actions button{flex:1;justify-content:center}}
`;

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

  return <><style>{css}</style><ProfileView setView={setView}/><section className="profile-media-section"><div className="profile-media-shell"><div className="profile-media-head"><div><h2>Fotos y vídeos</h2><p>Todo lo que subas aquí o como estado queda guardado en tu perfil.</p></div><div className="profile-media-actions"><button type="button" disabled={uploading} onClick={()=>photoRef.current?.click()}><ImagePlus size={18}/>Foto</button><button type="button" disabled={uploading} onClick={()=>videoRef.current?.click()}><Video size={18}/>Vídeo</button></div></div>{error&&<div className="profile-media-error" role="alert">{error}</div>}<input ref={photoRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{void upload(e.target.files?.[0])}}/><input ref={videoRef} hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>{void upload(e.target.files?.[0])}}/>{loading?<div className="profile-media-empty">Cargando tus publicaciones…</div>:items.length?<div className="profile-media-grid">{items.map(item=><article className="profile-media-card" key={item.id}>{item.mediaType==='video'?<><video src={item.url} controls playsInline preload="metadata"/><span><Video size={15}/></span></>:<><img src={item.url} alt="Contenido de tu perfil"/><span><Camera size={15}/></span></>}<button type="button" aria-label="Eliminar contenido" onClick={()=>{void remove(item)}}><Trash2 size={15}/></button></article>)}</div>:<div className="profile-media-empty">Todavía no has subido fotos o vídeos.</div>}</div></section></>;
}
