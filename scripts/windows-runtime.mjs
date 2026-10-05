import os from 'node:os';
import {syncBuiltinESMExports} from 'node:module';
const original=os.userInfo;
os.userInfo=(...args)=>{try{return original(...args);}catch(e){if(e.code!=='ERR_SYSTEM_ERROR')throw e;return {username:process.env.USERNAME||'site-builder',homedir:process.env.USERPROFILE||process.cwd(),uid:-1,gid:-1,shell:null};}};
syncBuiltinESMExports();
