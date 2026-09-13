import { Camera, ChevronRight, Lightbulb, Sparkles, Video, X } from 'lucide-react';
import { useRef } from 'react';
import type { RefObject } from 'react';

const css=`
.story-create-v2{position:fixed;inset:0;z-index:180;background:rgba(21,25,49,.48);backdrop-filter:blur(6px);display:grid;place-items:end center;padding:0}
.story-create-v2-card{width:min(560px,100%);background:linear-gradient(180deg,#fff 0%,#fbf9ff 100%);border-radius:30px 30px 0 0;padding:12px 20px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -24px 70px rgba(40,28,88,.26);border:1px solid rgba(116,71,244,.10);animation:storySheetIn .2s ease-out}
.story-create-v2-handle{width:74px;height:6px;border-radius:999px;background:#dddde8;margin:0 auto 14px}
.story-create-v2-head{display:grid;grid-template-columns:58px minmax(0,1fr) 44px;gap:12px;align-items:center;margin-bottom:18px}
.story-create-v2-icon{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,#f1ebff,#fff);color:#7247f4;box-shadow:0 10px 24px rgba(111,73,235,.12)}
.story-create-v2-icon svg{width:28px;height:28px}
.story-create-v2-title h2{margin:0;color:#151c43;font-size:30px;line-height:1.02;letter-spacing:-.04em}
.story-create-v2-title p{margin:7px 0 0;color:#7f8599;font-size:14px;line-height:1.35}
.story-create-v2-close{width:42px;height:42px;border:0;border-radius:50%;display:grid;place-items:center;background:#f4f1ff;color:#1c2449}
.story-create-v2-close svg{width:22px;height:22px}
.story-create-v2-options{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.story-create-v2-option{border:1px solid rgba(116,71,244,.12);border-radius:22px;background:linear-gradient(135deg,#fbf9ff,#f4efff);padding:16px;display:grid;grid-template-columns:50px minmax(0,1fr) 20px;align-items:center;gap:12px;text-align:left;color:#161d44;box-shadow:0 12px 28px rgba(67,42,125,.07)}
.story-create-v2-option:active{transform:scale(.985)}
.story-create-v2-option:disabled{opacity:.55}
.story-create-v2-option-icon{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#eee8ff,#fff);color:#7447f4}
.story-create-v2-option-icon svg{width:25px;height:25px}
.story-create-v2-option-copy strong{display:block;font-size:17px;line-height:1.1}
.story-create-v2-option-copy small{display:block;margin-top:5px;color:#8e94a4;font-size:12px;line-height:1.2}
.story-create-v2-option>svg{width:19px;height:19px;color:#7247f4}
.story-create-v2-tip{margin-top:14px;border-radius:18px;background:#f6f3ff;color:#7c7896;min-height:48px;padding:11px 14px;display:flex;align-items:center;justify-content:center;gap:9px;text-align:center;font-size:12px}
.story-create-v2-tip svg{width:18px;height:18px;color:#7b62dd;flex:0 0 auto}
@keyframes storySheetIn{from{transform:translateY(18px);opacity:.86}to{transform:translateY(0);opacity:1}}
@media(max-width:520px){.story-create-v2-card{padding-left:16px;padding-right:16px}.story-create-v2-options{grid-template-columns:1fr}.story-create-v2-title h2{font-size:27px}.story-create-v2-head{grid-template-columns:52px minmax(0,1fr) 42px}.story-create-v2-icon{width:52px;height:52px;border-radius:18px}}
`;

export function StoryCreateSheet({open,inputRef,uploading,onClose,onUpload}:{open:boolean;inputRef:RefObject<HTMLInputElement|null>;uploading:boolean;onClose:()=>void;onUpload:(file?:File)=>void}){
  const videoRef=useRef<HTMLInputElement|null>(null);
  if(!open)return null;
  return <div className="story-create-v2" onClick={onClose} role="presentation"><style>{css}</style><div className="story-create-v2-card" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="story-create-title">
    <div className="story-create-v2-handle"/>
    <div className="story-create-v2-head">
      <div className="story-create-v2-icon"><Sparkles/></div>
      <div className="story-create-v2-title"><h2 id="story-create-title">Subir estado</h2><p>Comparte una foto o vídeo de tu último plan.</p></div>
      <button className="story-create-v2-close" type="button" onClick={onClose} aria-label="Cerrar"><X/></button>
    </div>

    <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>onUpload(e.target.files?.[0])}/>
    <input ref={videoRef} hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>onUpload(e.target.files?.[0])}/>

    <div className="story-create-v2-options">
      <button className="story-create-v2-option" type="button" disabled={uploading} onClick={()=>inputRef.current?.click()}>
        <span className="story-create-v2-option-icon"><Camera/></span><span className="story-create-v2-option-copy"><strong>Foto</strong><small>Desde tu galería</small></span><ChevronRight/>
      </button>
      <button className="story-create-v2-option" type="button" disabled={uploading} onClick={()=>videoRef.current?.click()}>
        <span className="story-create-v2-option-icon"><Video/></span><span className="story-create-v2-option-copy"><strong>Vídeo</strong><small>Graba o elige uno</small></span><ChevronRight/>
      </button>
    </div>

    <div className="story-create-v2-tip"><Lightbulb/><span>{uploading?'Subiendo tu estado…':'Comparte los mejores momentos de tus planes en CONECTA'}</span></div>
  </div></div>;
}
