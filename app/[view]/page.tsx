import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{view:string}>}){const {view}=await params;if(!['map','locations','predictions','what-if','assistant','plans','goals','sources','profile'].includes(view))notFound();return null;}
