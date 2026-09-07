import type { User } from '@supabase/supabase-js';
import type { AccountSettings } from '../types';

export const demoAccount:AccountSettings={name:'Fernando',email:'fernando96@gmail.com'};
export const demoAvatar='./assets/images/photo-1500648767791-00dcc994a43e.jpg';

function nameFromEmail(email:string){
  const local=email.split('@')[0]||'';
  return local
    .replace(/[._-]+/g,' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part=>part.charAt(0).toLocaleUpperCase('es')+part.slice(1))
    .join(' ')||'Usuario';
}

function metadataName(user:User|null){
  const metadata=user?.user_metadata as Record<string,unknown>|undefined;
  for(const key of ['full_name','name','display_name']){
    const value=metadata?.[key];
    if(typeof value==='string'&&value.trim())return value.trim();
  }
  return '';
}

export function accountFromUser(user:User|null,stored?:AccountSettings|null):AccountSettings{
  if(!user)return stored||demoAccount;
  const email=(user.email||stored?.email||demoAccount.email).trim();
  const sameStoredEmail=Boolean(stored?.email&&stored.email.trim().toLocaleLowerCase('es')===email.toLocaleLowerCase('es'));
  const name=metadataName(user)||(sameStoredEmail&&stored?.name.trim()?stored.name.trim():nameFromEmail(email));
  return {name,email};
}

export function avatarFromUser(user:User|null,name:string){
  const metadata=user?.user_metadata as Record<string,unknown>|undefined;
  for(const key of ['avatar_url','picture']){
    const value=metadata?.[key];
    if(typeof value==='string'&&value.trim())return value.trim();
  }
  if(!user)return demoAvatar;
  const initials=(name.trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0).toLocaleUpperCase('es')).join('')||'C').slice(0,2);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7148ff"/><stop offset="1" stop-color="#8b68ff"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(#g)"/><text x="100" y="116" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="800" fill="#fff">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function isDemoAccount(account:AccountSettings){
  return account.email.trim().toLocaleLowerCase('es')===demoAccount.email.toLocaleLowerCase('es');
}
