import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Sans voyelles — Les mots ont disparu. À vous de jouer.',description:'15 secondes, des consonnes et un déclic. Un jeu de culture générale multijoueur.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
