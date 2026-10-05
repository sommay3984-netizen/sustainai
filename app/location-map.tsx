 'use client';
import { useEffect, useRef, useState } from 'react';
import type { Place } from '../lib/sustain';
let loading: Promise<any> | undefined;
function leaflet() {
 if ((window as any).L) return Promise.resolve((window as any).L);
 if (!loading) loading = new Promise((resolve, reject) => {
  if (!document.querySelector('link[data-sustain-map]')) {
   const css=document.createElement('link');css.rel='stylesheet';css.href='/vendor/leaflet/leaflet.css';css.dataset.sustainMap='true';document.head.appendChild(css);
  }
  const script=document.createElement('script');script.src='/vendor/leaflet/leaflet.js';
  script.onload=()=>resolve((window as any).L);script.onerror=()=>{loading=undefined;script.remove();reject(new Error('Map could not load. Use the location search above.'));};document.head.appendChild(script);
 });
 return loading;
}
export default function LocationMap({place,onSelect}:{place:Place|null,onSelect:(p:Place)=>void}) {
 const element=useRef<HTMLDivElement>(null), map=useRef<any>(null), marker=useRef<any>(null), current=useRef(place), select=useRef(onSelect);
 const [error,setError]=useState('');current.current=place;select.current=onSelect;
 useEffect(()=>{
  let disposed=false;let resize:ResizeObserver|undefined;
  leaflet().then(L=>{
   if(disposed||!element.current)return;
   const p=current.current;
   const instance=L.map(element.current,{scrollWheelZoom:false}).setView(p?[p.lat,p.lon]:[20,0],p?12:2);map.current=instance;
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(instance);
   const mark=(lat:number,lon:number)=>{
    if(marker.current)marker.current.setLatLng([lat,lon]);else marker.current=L.circleMarker([lat,lon],{radius:9,color:'#17362e',weight:3,fillColor:'#b5ed69',fillOpacity:1}).addTo(instance);
   };
   if(p)mark(p.lat,p.lon);
   instance.on('click',(event:any)=>{
    const lat=Number(event.latlng.lat.toFixed(6)),lon=Number(((event.latlng.lng+180)%360+360)%360-180);
    mark(lat,lon);
    select.current({lat,lon:Number(lon.toFixed(6)),name:`Selected area (${lat.toFixed(5)}, ${lon.toFixed(5)})`,resolution:'Exact map coordinate'});
   });
   resize=new ResizeObserver(()=>instance.invalidateSize());resize.observe(element.current);
  }).catch(e=>{if(!disposed)setError(e.message);});
  return()=>{disposed=true;resize?.disconnect();map.current?.remove();map.current=null;marker.current=null;};
 },[]);
 useEffect(()=>{
  const instance=map.current,L=(window as any).L;if(!instance||!L||!place)return;
  if(marker.current)marker.current.setLatLng([place.lat,place.lon]);else marker.current=L.circleMarker([place.lat,place.lon],{radius:9,color:'#17362e',weight:3,fillColor:'#b5ed69',fillOpacity:1}).addTo(instance);
  if(!instance.getBounds().contains([place.lat,place.lon]))instance.setView([place.lat,place.lon],12);
 },[place?.lat,place?.lon]);
 return <><div className="location-map" ref={element} role="region" aria-label="Interactive location map"/>{error&&<p className="map-error" role="alert">{error}</p>}</>;
}
