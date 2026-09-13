import { useMemo, useRef, useState } from 'react';
import { people } from '../data/demoData';
import { loadProfileMedia, uploadProfileMedia, type ProfileMediaItem } from '../lib/communityBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { Story } from '../types';

const demoStories:Story[]=[
  {name:'Marta',time:'Reciente',avatar:people.find(p=>p.name==='Marta')?.image||'',image:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',caption:'Atardecer increíble',location:'Tarragona'},
  {name:'Javi',time:'Reciente',avatar:'./assets/images/photo-1500648767791-00dcc994a43e.jpg',image:'./assets/images/photo-1517248135467-4c7edcad34c4.jpg',caption:'Noche de amigos',location:'Salou'},
  {name:'Laura',time:'Reciente',avatar:'./assets/images/photo-1544005313-94ddf0286df2.jpg',image:'./assets/images/photo-1519046904884-53103b34b206.jpg',caption:'Plan improvisado',location:'Cambrils'},
];

export function useExploreStories(){
  const [media,setMedia]=useState<ProfileMediaItem[]>([]);
  const [storyLikes,setStoryLikes]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.storyLikes,[])));
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const inputRef=useRef<HTMLInputElement|null>(null);

  const refresh=async()=>{try{setMedia(await loadProfileMedia())}catch{setMedia([])}};
  const upload=async(file?:File)=>{if(!file)return;setUploading(true);setError('');try{const item=await uploadProfileMedia(file,'status');setMedia(prev=>[item,...prev]);}catch(e){setError(e instanceof Error?e.message:'No se ha podido subir el estado.')}finally{setUploading(false);if(inputRef.current)inputRef.current.value='';}};
  const toggleLike=(key:string)=>{const next=new Set(storyLikes);next.has(key)?next.delete(key):next.add(key);setStoryLikes(next);saveStored(storageKeys.storyLikes,[...next]);};

  const stories=useMemo(()=>[
    ...media.slice(0,4).map((item,index)=>({name:'Tu estado',time:'Ahora',avatar:item.url,image:item.url,caption:item.caption||'Tu nuevo estado',location:'Tu perfil',mediaType:item.mediaType,key:`media-${item.id||index}`})),
    ...demoStories.map((story,index)=>({...story,mediaType:'image' as const,key:`demo-${index}`}))
  ],[media]);

  return {media,stories,storyLikes,toggleLike,uploading,error,inputRef,upload,refresh};
}
