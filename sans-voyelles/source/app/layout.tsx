import type { Metadata } from 'next';
import './globals.css';
import './puppet.css';
export const metadata:Metadata={title:'Sans voyelles — Les mots ont disparu. À vous de jouer.',description:'20 secondes, des consonnes et un déclic. Un jeu de culture générale multijoueur.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><head>{["body","parts","eyes","mouth"].map(name=><link key={name} rel="preload" as="image" href={"/puppets/"+name+".webp?v=2"}/>)}</head><body>{children}</body></html>}
