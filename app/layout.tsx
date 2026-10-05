import type { Metadata } from 'next';
import './globals.css';
import SustainApp from './sustain-app';
import { getChatGPTUser } from './chatgpt-auth';
export const metadata:Metadata={title:'SustainAI — Predict. Simulate. Improve.',description:'Location-aware sustainability insights, transparent forecasts, scenarios, and goals.'};
export const dynamic='force-dynamic';
export default async function RootLayout({children}:{children:React.ReactNode}){const user=await getChatGPTUser();return <html lang="en"><body><SustainApp user={user}>{children}</SustainApp></body></html>;}
