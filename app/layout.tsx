import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'STRATE — Observatoire planétaire',
  description: 'Observatoire privé de STRATE. Suivez les colonies autonomes, leurs territoires, leurs factions et leurs guildes.',
};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="fr"><body>{children}</body></html>;
}
