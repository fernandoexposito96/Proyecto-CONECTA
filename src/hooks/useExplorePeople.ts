import { useEffect, useMemo, useState } from 'react';
import { people } from '../data/demoData';
import { searchPeopleByName, type PersonSearchResult } from '../lib/communityBackend';
import { blockedNames, blockedUserIds, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { requestBackendConnection } from '../lib/socialBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { PeopleFilter, Person } from '../types';

function loadLegacyConnectionValues(){
  try{
    const raw=window.localStorage.getItem(storageKeys.connections);
    if(!raw)return [];
    const parsed:unknown=JSON.parse(raw);
    return Array.isArray(parsed)?parsed.filter((value):value is string=>typeof value==='string'):[];
  }catch{
    return [];
  }
}

function initialConnections(){
  // Read the legacy key directly here: loadStored intentionally filters backend UUIDs
  // from that mixed key, but the migration still needs those IDs once to preserve them.
  const legacy=loadLegacyConnectionValues();
  const demoNames=new Set(people.map(person=>person.name));
  const storedDemo=loadStored<string[]>(storageKeys.demoConnections,[]);
  const storedBackend=loadStored<string[]>(storageKeys.backendConnections,[]);
  const demo=new Set([...storedDemo,...legacy.filter(value=>demoNames.has(value))]);
  const backend=new Set([...storedBackend,...legacy.filter(value=>!demoNames.has(value))]);
  if(legacy.length){saveStored(storageKeys.demoConnections,[...demo]);saveStored(storageKeys.backendConnections,[...backend]);}
  return {demo,backend};
}

export function useExplorePeople(){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [blockedIds]=useState<Set<string>>(()=>blockedUserIds());
  // Snapshot tomado una sola vez al montar, igual que "blocked": a alguien a quien
  // le das a "No me gusta" en esta sesión no desaparece de la lista hasta la próxima
  // vez que se abra la app. Así se evita que el índice del carrusel se desplace en
  // caliente y se salte a la siguiente persona sin querer.
  const [dislikedInitial]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.exploreDislikes,[])));
  const [filter,setFilter]=useState<PeopleFilter>(()=>canUseLocation(privacy)?'near':'match');
  const [liked,setLiked]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.exploreLikes,[])));
  const [disliked,setDisliked]=useState<Set<string>>(dislikedInitial);
  const [connectionState]=useState(initialConnections);
  const [demoConnected,setDemoConnected]=useState<Set<string>>(connectionState.demo);
  const [backendConnected,setBackendConnected]=useState<Set<string>>(connectionState.backend);
  const [query,setQuery]=useState('');
  const [remotePeople,setRemotePeople]=useState<PersonSearchResult[]>([]);
  const [searching,setSearching]=useState(false);

  const connected=useMemo(()=>new Set([...demoConnected,...backendConnected]),[demoConnected,backendConnected]);
  const locationAllowed=canUseLocation(privacy);
  const visiblePeople=useMemo(()=>people.filter(person=>!blocked.has(person.name)&&(!person.userId||!blockedIds.has(person.userId))&&!dislikedInitial.has(person.name)),[blocked,blockedIds,dislikedInitial]);
  const filteredPeople=useMemo(()=>{
    const clean=query.trim().toLocaleLowerCase('es');
    const list=visiblePeople.filter(person=>!clean||person.name.toLocaleLowerCase('es').includes(clean));
    const sorted=[...list];
    if(filter==='match'||(filter==='near'&&!locationAllowed))return sorted.sort((a,b)=>parseInt(b.match)-parseInt(a.match));
    if(filter==='age')return sorted.sort((a,b)=>a.age-b.age);
    if(filter==='interests')return sorted.sort((a,b)=>b.tags.length-a.tags.length);
    return sorted.sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance));
  },[filter,locationAllowed,query,visiblePeople]);

  useEffect(()=>{
    const clean=query.trim();
    if(clean.length<2){setRemotePeople([]);setSearching(false);return;}
    let active=true;setSearching(true);
    const timer=window.setTimeout(()=>{void searchPeopleByName(clean).then(items=>{if(active)setRemotePeople(items.filter(item=>!blockedIds.has(item.id)))}).catch(()=>{if(active)setRemotePeople([])}).finally(()=>{if(active)setSearching(false)})},220);
    return()=>{active=false;window.clearTimeout(timer)};
  },[query,blockedIds]);

  const persistLikes=(next:Set<string>)=>{setLiked(next);saveStored(storageKeys.exploreLikes,[...next]);};
  const persistDislikes=(next:Set<string>)=>{setDisliked(next);saveStored(storageKeys.exploreDislikes,[...next]);};
  const persistDemoConnections=(next:Set<string>)=>{setDemoConnected(next);saveStored(storageKeys.demoConnections,[...next]);};
  const persistBackendConnections=(next:Set<string>)=>{setBackendConnected(next);saveStored(storageKeys.backendConnections,[...next]);};

  const toggleLike=(person:Person)=>{const next=new Set(liked);next.has(person.name)?next.delete(person.name):next.add(person.name);persistLikes(next);};
  const dislikePerson=(person:Person)=>{
    if(disliked.has(person.name))return;
    const next=new Set(disliked);
    next.add(person.name);
    persistDislikes(next);
    if(liked.has(person.name)){const nextLiked=new Set(liked);nextLiked.delete(person.name);persistLikes(nextLiked);}
  };
  const addPerson=async(person:Person)=>{
    if(demoConnected.has(person.name)||(person.userId&&backendConnected.has(person.userId)))return;
    const nextDemo=new Set(demoConnected);nextDemo.add(person.name);persistDemoConnections(nextDemo);
    if(person.userId&&!blockedIds.has(person.userId)){
      try{const sent=await requestBackendConnection(person.userId);if(sent){const nextBackend=new Set(backendConnected);nextBackend.add(person.userId);persistBackendConnections(nextBackend);}}
      catch(error){console.warn('CONECTA connection request failed; demo connection kept',error)}
    }
  };
  const addRemotePerson=async(person:PersonSearchResult)=>{
    if(blockedIds.has(person.id))throw new Error('No puedes conectar con un usuario bloqueado.');
    if(backendConnected.has(person.id))return;
    const sent=await requestBackendConnection(person.id);
    if(!sent)throw new Error('No se ha podido enviar la solicitud.');
    const next=new Set(backendConnected);next.add(person.id);persistBackendConnections(next);
  };

  return {privacy,locationAllowed,filter,setFilter,liked,disliked,connected,demoConnected,backendConnected,query,setQuery,visiblePeople,filteredPeople,remotePeople,searching,toggleLike,dislikePerson,addPerson,addRemotePerson};
}
