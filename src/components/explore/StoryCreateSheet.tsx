import { Camera, Video, X } from 'lucide-react';
import type { RefObject } from 'react';

export function StoryCreateSheet({open,inputRef,uploading,onClose,onUpload}:{open:boolean;inputRef:RefObject<HTMLInputElement|null>;uploading:boolean;onClose:()=>void;onUpload:(file?:File)=>void}){
  if(!open)return null;
  return <div className="story-create-sheet" onClick={onClose}><div className="story-create-card" onClick={e=>e.stopPropagation()}><button className="story-create-close" onClick={onClose}><X/></button><h2>Subir estado</h2><p>Comparte una foto o vídeo de tu último plan.</p><input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={e=>onUpload(e.target.files?.[0])}/><button className="story-create-option" disabled={uploading} onClick={()=>inputRef.current?.click()}><Camera/> Foto</button><button className="story-create-option" disabled={uploading} onClick={()=>inputRef.current?.click()}><Video/> Vídeo</button></div></div>;
}
