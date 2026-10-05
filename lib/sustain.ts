export type Place = { name:string; lat:number; lon:number; resolution:string };
export function coordinate(lat: unknown, lon: unknown) {
 const a=Number(lat), b=Number(lon); if(lat===null||lon===null||!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>90||Math.abs(b)>180) throw new Error('Valid latitude and longitude are required.'); return {lat:a,lon:b};
}
export async function fetchJson(url:string) { const r=await fetch(url,{signal:AbortSignal.timeout(15000)}); if(!r.ok) throw new Error(`Data provider returned ${r.status}.`); return r.json() as Promise<any>; }
export async function locationData(lat:number,lon:number) {
 const q=`latitude=${lat}&longitude=${lon}&timezone=GMT`;
 const results=await Promise.allSettled([
 fetchJson(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,shortwave_radiation_sum&forecast_days=7`),
 fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&domains=cams_global&current=pm2_5,us_aqi&hourly=pm2_5,us_aqi&forecast_days=5`)
 ]);
 return {lat,lon,fetchedAt:new Date().toISOString(),weather:results[0].status==='fulfilled'?results[0].value:null,air:results[1].status==='fulfilled'?results[1].value:null,errors:results.flatMap((r,i)=>r.status==='rejected'?[`${i===0?'Weather':'Air quality'}: ${r.reason.message}`]:[]),sources:[{name:'Open-Meteo weather models',url:'https://open-meteo.com/en/docs',resolution:'Model grid varies by region (~1â€“25 km); selected coordinate is not a street-level measurement',type:'Model forecast'},{name:'CAMS Global via Open-Meteo',url:'https://open-meteo.com/en/docs/air-quality-api',resolution:'0.4Â° (~45 km), interpolated hourly',type:'Model forecast'}]};
}
export function recommendations(d:any) {
 const hot=d?.weather?.daily?.temperature_2m_max?.some((v:number)=>v>=30);
 const polluted=d?.air?.current?.us_aqi>100;
 return [{title:'Measure before you improve',category:'Water',detail:'Record a week of water consumption and check for leaks. Water savings can also reduce pumping and hot-water energy.'},{title:hot?'Shift cooling demand':'Reduce standby demand',category:'Energy',detail:hot?'The forecast includes hot days. Shade windows and shift flexible loads away from cooling peaks.':'Measure idle electricity consumption and switch off avoidable standby loads.'},{title:polluted?'Plan around air quality':'Replace a short car trip',category:'Transport',detail:polluted?'The regional model indicates elevated AQI. Review hourly forecasts before planning outdoor travel.':'Choose walking, cycling, or shared transport where practical. Log avoided distance to track progress.'},{title:'Connect water and green cover',category:'Environment',detail:'Consider locally suitable vegetation and rainwater capture. Benefits depend on rainfall, space, maintenance, and local rules.'}];
}
export function simulate(b:any,changes:any) {
 const input=(value:any)=>value===null||value===undefined||String(value).trim()===''?null:Number(value);
 const w=input(b.water),e=input(b.energy),k=input(b.distance),f=input(b.factor),v=input(b.vehicleFactor);
 const waterSaved=w===null?null:w*Number(changes.water)/100;
 const energySaved=e===null?null:e*Number(changes.energy)/100;
 const distanceAvoided=k===null?null:k*Number(changes.transport)/100;
 const hasCarbonActivity=energySaved!==null||distanceAvoided!==null;
 const missingFactor=(energySaved!==null&&energySaved>0&&f===null)||(distanceAvoided!==null&&distanceAvoided>0&&v===null);
 const emissionsAvoided=!hasCarbonActivity||missingFactor?null:(energySaved||0)*(f||0)+(distanceAvoided||0)*(v||0);
 return {waterSaved,energySaved,distanceAvoided,emissionsAvoided};
}
