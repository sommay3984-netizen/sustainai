import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { coordinate,fetchJson,locationData,recommendations } from '../../../lib/sustain';
import { z } from 'zod';
import { analyzeWithGemini } from '../../../lib/gemini';
export const dynamic='force-dynamic';
function database(){ const db=(env as any).DB; if(!db)throw new Error('Persistent storage is unavailable. Please try again later.');return db; }
const kinds=['location','goal','plan','profile'] as const;
function reply(data:any,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function GET(req:Request){try{
 const u=new URL(req.url),op=u.searchParams.get('op');
 if(op==='search'){
 const q=u.searchParams.get('q')?.trim(); if(!q||q.length>200)return reply({error:'Enter a location or latitude, longitude.'},400);
 const pair=q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/); if(pair){const p=coordinate(pair[1],pair[2]);return reply({places:[{...p,name:`${p.lat}, ${p.lon}`,resolution:'Exact user coordinate'}]});}
 const key=`search:${q.toLowerCase()}`,db=database();const cached=await db.prepare('SELECT payload FROM records WHERE id = ? AND kind = ? AND updated > ?').bind(key,'cache',new Date(Date.now()-86400000).toISOString()).first();if(cached)return reply(JSON.parse(cached.payload));
 const limit=await db.prepare('INSERT INTO records (id,owner,kind,payload,updated) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated WHERE records.updated < ? RETURNING id').bind('geocode-throttle','system','throttle','{}',new Date().toISOString(),new Date(Date.now()-1200).toISOString()).first();if(!limit)return reply({error:'Please wait a moment before another search.'},429);
 const endpoint=(env as any).GEOCODER_URL||'https://photon.komoot.io'; const data=await fetchJson(`${endpoint}/api/?q=${encodeURIComponent(q)}&limit=6`);
 const result={places:data.features.map((f:any)=>({lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1],name:[f.properties.name,f.properties.street,f.properties.city,f.properties.state,f.properties.country].filter((v:any,i:number,a:any[])=>v&&a.indexOf(v)===i).join(', '),resolution:f.properties.type||f.properties.osm_value||'OSM place'}))};
 await db.prepare('INSERT OR REPLACE INTO records (id,owner,kind,payload,updated) VALUES (?,?,?,?,?)').bind(key,'system','cache',JSON.stringify(result),new Date().toISOString()).run();return reply(result);
 }
 if(op==='data'){ const {lat,lon}=coordinate(u.searchParams.get('lat'),u.searchParams.get('lon')); const d=await locationData(lat,lon);return reply({...d,recommendations:recommendations(d)}); }
 const user=await getChatGPTUser();if(!user)return reply({error:'Sign in to access your saved data.'},401);
 if(op==='records'){const r=await database().prepare('SELECT id,kind,payload,updated FROM records WHERE owner = ? ORDER BY updated DESC').bind(user.userId).all();return reply({records:r.results.map((r:any)=>({...r,payload:JSON.parse(r.payload)}))});}
 return reply({error:'Unknown operation'},400);
 }catch(e:any){console.error('SustainAI GET',e.message);return reply({error:e.message||'Data unavailable'},503);}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Origin check failed'},403);
 const user=await getChatGPTUser();if(!user)return reply({error:'Sign in to save changes or use AI.'},401);
 if(Number(req.headers.get('content-length'))>24000)return reply({error:'Request too large'},413);
 const text=await req.text();if(text.length>24000)return reply({error:'Request too large'},413);const b=JSON.parse(text);
 if(b.op==='ai'){
 const parsed=z.object({lat:z.number(),lon:z.number(),question:z.string().min(1).max(2000)}).parse(b);const {lat,lon}=coordinate(parsed.lat,parsed.lon);const key=(env as any).GEMINI_API_KEY;
 if(!key)return reply({error:'AI is not connected. Configure the server-side Gemini API key to activate this assistant.'},503);
 const db=database(),now=new Date().toISOString();const allowed=await db.prepare('INSERT INTO records (id,owner,kind,payload,updated) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated WHERE records.updated < ? RETURNING id').bind(`ai-limit:${user.userId}`,user.userId,'limit','{}',now,new Date(Date.now()-15000).toISOString()).first();if(!allowed)return reply({error:'Please wait 15 seconds between AI requests.'},429);
 const data=await locationData(lat,lon);const answer=await analyzeWithGemini(key,(env as any).GEMINI_MODEL||'gemini-3.8-flash',parsed.question,data);return reply({answer,provider:'Gemini',fetchedAt:data.fetchedAt});
 }
 if(b.op==='delete'){ const id=z.string().uuid().parse(b.id);await database().prepare('DELETE FROM records WHERE id = ? AND owner = ?').bind(id,user.userId).run();return reply({ok:true}); }
 const parsed=z.object({op:z.literal('save'),id:z.string().uuid().optional(),kind:z.enum(kinds),payload:z.record(z.unknown())}).parse(b);if(parsed.kind==='location')z.object({name:z.string().min(1).max(500),lat:z.number().min(-90).max(90),lon:z.number().min(-180).max(180),resolution:z.string().max(100)}).parse(parsed.payload);
if(parsed.kind==='goal')z.object({title:z.string().min(1).max(150),target:z.union([z.string(),z.number()]).refine(v=>Number.isFinite(Number(v))&&Number(v)>0),progress:z.number().nonnegative().finite(),category:z.enum(['Water','Energy','Transport','Environment']),unit:z.string().min(1).max(30),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),locKey:z.string().min(1),history:z.array(z.object({value:z.number().nonnegative().finite(),at:z.string()})).max(1000)}).parse(parsed.payload);
const id=parsed.id||crypto.randomUUID(),db=database();
 if(parsed.id){const existing=await db.prepare('SELECT owner FROM records WHERE id = ?').bind(id).first();if(!existing||existing.owner!==user.userId)return reply({error:'Record not found'},404);}
 await db.prepare('INSERT INTO records (id,owner,kind,payload,updated) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated=excluded.updated WHERE records.owner=excluded.owner').bind(id,user.userId,parsed.kind,JSON.stringify(parsed.payload),new Date().toISOString()).run();return reply({ok:true,id});
 }catch(e:any){console.error('SustainAI POST',e.message);return reply({error:e instanceof z.ZodError?'Invalid input.':e.message||'Unable to save.'},e instanceof z.ZodError?400:503);}}
