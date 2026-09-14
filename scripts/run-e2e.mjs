import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {preview} from 'vite';

// Own the server lifecycle; never test another application's existing preview.
const server=await preview({preview:{host:'127.0.0.1',port:43173,strictPort:true}});
const cli=fileURLToPath(new URL('../node_modules/playwright/cli.js',import.meta.url));
let code=1;
try{
  const child=spawn(process.execPath,[cli,'test',...process.argv.slice(2)],{
    stdio:'inherit',env:{...process.env,CONECTA_EXTERNAL_PREVIEW:'1'},
  });
  code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',value=>resolve(value??1));});
}finally{
  server.httpServer.closeAllConnections();
  await server.close();
}
process.exitCode=code;
