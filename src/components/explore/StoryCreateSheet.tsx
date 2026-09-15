import { Camera, ChevronRight, Lightbulb, Sparkles, Video, X } from 'lucide-react';
import { useRef } from 'react';
import type { RefObject } from 'react';

export function StoryCreateSheet({open,inputRef,uploading,onClose,onUpload}:{open:boolean;inputRef:RefObject<HTMLInputElement|null>;uploading:boolean;onClose:()=>void;onUpload:(file?:File)=>void}){
  const videoRef=useRef<HTMLInputElement|null>(null);
  if(!open)return null;
  return <div className="story-create-v2" onClick={onClose} role="presentation"><div className="story-create-v2-card" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="story-create-title">
    <div className="story-create-v2-handle"/>
    <div className="story-create-v2-head">
      <div className="story-create-v2-icon"><Sparkles/></div>
      <div className="story-create-v2-title"><h2 id="story-create-title">Subir estado</h2><p>Comparte una foto o vídeo de tu último plan.</p></div>
      <button className="story-create-v2-close" type="button" onClick={onClose} aria-label="Cerrar"><X/></button>
    </div>
    <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>onUpload(e.target.files?.[0])}/>
    <input ref={videoRef} hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>onUpload(e.target.files?.[0])}/>
    <div className="story-create-v2-options">
      <button className="story-create-v2-option" type="button" disabled={uploading} onClick={()=>inputRef.current?.click()}><span className="story-create-v2-option-icon"><Camera/></span><span className="story-create-v2-option-copy"><strong>Foto</strong><small>Desde tu galería</small></span><ChevronRight/></button>
      <button className="story-create-v2-option" type="button" disabled={uploading} onClick={()=>videoRef.current?.click()}><span className="story-create-v2-option-icon"><Video/></span><span className="story-create-v2-option-copy"><strong>Vídeo</strong><small>Graba o elige uno</small></span><ChevronRight/></button>
    </div>
    <div className="story-create-v2-tip"><Lightbulb/><span>{uploading?'Subiendo tu estado…':'Comparte los mejores momentos de tus planes en CONECTA'}</span></div>
  </div></div>;
}
