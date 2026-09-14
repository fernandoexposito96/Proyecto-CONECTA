import { useEffect, useMemo, useState } from 'react';
import { people } from '../data/demoData';
import { searchPeopleByName, type PersonSearchResult } from '../lib/communityBackend';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { requestBackendConnection } from '../lib/socialBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { PeopleFilter, Person } from '../types';

export function useExplorePeople(){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [filter,setFilter]=useState<PeopleFilter>(()=>canUseLocation(privacy)?'near':'match');
  const [liked,setLiked]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.exploreLikes,[])));
  const [connected,setConnected]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.connections,[])));
  const [query,setQuery]=useState('');
  const [remotePeople,setRemotePeople]=useState<PersonSearchResult[]>([]);
  const [searching,setSearching]=useState(false);

  const locationAllowed=canUseLocation(privacy);
  const visiblePeople=useMemo(()=>people.filter(person=>!blocked.has(person.name)),[blocked]);
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
    const timer=window.setTimeout(()=>{void searchPeopleByName(clean).then(items=>{if(active)setRemotePeople(items)}).catch(()=>{if(active)setRemotePeople([])}).finally(()=>{if(active)setSearching(false)})},220);
    return()=>{active=false;window.clearTimeout(timer)};
  },[query]);

  const persistLikes=(next:Set<string>)=>{setLiked(next);saveStored(storageKeys.exploreLikes,[...next]);};
  const persistConnections=(next:Set<string>)=>{setConnected(next);saveStored(storageKeys.connections,[...next]);};

  const toggleLike=(person:Person)=>{const next=new Set(liked);next.has(person.name)?next.delete(person.name):next.add(person.name);persistLikes(next);};
  const addPerson=async(person:Person)=>{if(connected.has(person.name))return;const next=new Set(connected);next.add(person.name);persistConnections(next);if(person.userId){try{await requestBackendConnection(person.userId)}catch(error){console.warn('CONECTA connection request failed; local connection kept',error)}}};
  const addRemotePerson=async(person:PersonSearchResult)=>{if(connected.has(person.id))return;const sent=await requestBackendConnection(person.id);if(!sent)throw new Error('No se ha podido enviar la solicitud.');setConnected(current=>{const next=new Set(current);next.add(person.id);saveStored(storageKeys.connections,[...next]);return next;});};

  return {privacy,locationAllowed,filter,setFilter,liked,connected,query,setQuery,visiblePeople,filteredPeople,remotePeople,searching,toggleLike,addPerson,addRemotePerson};
}
