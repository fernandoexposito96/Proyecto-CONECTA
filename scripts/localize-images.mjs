import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const assetsDir=path.join(root,'public','assets','images');
fs.mkdirSync(assetsDir,{recursive:true});

const extensions=new Set(['.ts','.tsx','.html','.css','.webmanifest']);
const roots=[path.join(root,'src'),path.join(root,'index.html')];
const backendPhotoIds=[
  'photo-1457369804613-52c61a468e7d',
  'photo-1525351484163-7529414344d8',
  'photo-1554068865-24cecd4e34b8',
];

function walk(target){
  const stat=fs.statSync(target);
  if(stat.isFile())return [target];
  return fs.readdirSync(target,{withFileTypes:true}).flatMap(entry=>walk(path.join(target,entry.name)));
}

const sourceFiles=roots.flatMap(walk).filter(file=>extensions.has(path.extname(file)));
const photoIds=new Set(backendPhotoIds);
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const match of text.matchAll(/photo-\d+-[A-Za-z0-9_-]+/g))photoIds.add(match[0]);
}

console.log(`CONECTA local images: ${photoIds.size} unique Unsplash photos found`);

for(const id of [...photoIds].sort()){
  const output=path.join(assetsDir,`${id}.jpg`);
  if(fs.existsSync(output)&&fs.statSync(output).size>1000){
    console.log(`✓ ${id} already local`);
    continue;
  }
  const url=`https://images.unsplash.com/${id}?fm=jpg&fit=crop&w=1200&q=82`;
  const response=await fetch(url,{headers:{'User-Agent':'CONECTA-image-localizer/1.0'}});
  if(!response.ok)throw new Error(`Failed ${response.status} downloading ${id}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<1000)throw new Error(`Downloaded image is unexpectedly small: ${id}`);
  fs.writeFileSync(output,bytes);
  console.log(`↓ ${id} ${(bytes.length/1024).toFixed(0)} KB`);
}

const staticRemote=/https:\/\/images\.unsplash\.com\/(photo-\d+-[A-Za-z0-9_-]+)\?[^'"`\s<]+/g;
for(const file of sourceFiles){
  const original=fs.readFileSync(file,'utf8');
  let next=original.replace(staticRemote,(_url,id)=>`./assets/images/${id}.jpg`);
  next=next.replace(/`https:\/\/images\.unsplash\.com\/\$\{id\}\?[^`]+`/g,'`./assets/images/${id}.jpg`');
  if(path.basename(file)==='index.html'){
    next=next
      .replace(/<link rel="preconnect" href="https:\/\/images\.unsplash\.com" crossorigin\/>/g,'')
      .replace(/<link rel="dns-prefetch" href="\/\/images\.unsplash\.com"\/>/g,'');
  }
  if(next!==original){
    fs.writeFileSync(file,next);
    console.log(`↺ localized references in ${path.relative(root,file)}`);
  }
}

const remaining=[];
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  if(text.includes('images.unsplash.com'))remaining.push(path.relative(root,file));
}
if(remaining.length)throw new Error(`Remote Unsplash references remain: ${remaining.join(', ')}`);

console.log('CONECTA local images: OK — no runtime Unsplash image dependency remains.');
