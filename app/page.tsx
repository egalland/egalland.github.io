import Comparator from "../components/comparator";
import { letterboxdConfigured } from "@/lib/letterboxd-client";

export const dynamic = "force-dynamic";

function Wordmark() {
  return <span className="dp-wordmark">
    <span className="dp-logo" aria-hidden="true"><i/><i/></span>
    <span>Double<br/>Programme</span>
  </span>;
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { mode } = await searchParams;
  const historyAvailable = await letterboxdConfigured();
  const initialMode = mode === "recent" ? "rss" : mode === "import" ? "export" : "history";
  return <div className="dp-shell" id="haut">
    <header className="dp-mast">
      <div className="dp-mast-inner">
        <a className="dp-home" href="#haut" aria-label="Double Programme, accueil"><Wordmark/></a>
        <nav aria-label="Navigation principale">
          <a className="dp-jump" href="#comparateur">Comparer</a>
          <a className="dp-help" href="#fonctionnement">Mode d’emploi</a>
        </nav>
      </div>
    </header>
    <main className="dp-main">
      <section className="dp-hero" aria-labelledby="dp-title">
        <div className="dp-hero-copy">
          <p className="dp-kicker">Comparateur Letterboxd</p>
          <h1 id="dp-title">Face<br/><span>à face.</span></h1>
          <p className="dp-intro">Vos films en commun, vos désaccords et les films à vous faire découvrir.</p>
        </div>
        <div className="dp-hero-photo" aria-hidden="true">
          <img src="/salle-print.webp" alt="" fetchPriority="high" width="1500" height="750"/>
        </div>
      </section>
      <Comparator initialMode={initialMode} historyAvailable={historyAvailable}/>
      <section id="fonctionnement" className="dp-method" aria-labelledby="method-title">
        <h2 id="method-title">Mode<br className="dp-method-break"/> d’emploi</h2>
        <div className="dp-questions">
        <details><summary>Que peut-on comparer avec deux pseudos&nbsp;?</summary><p>{historyAvailable ? 'Le mode « Historique complet » parcourt les films vus et toutes les séances publiques de films des deux membres, y compris les revisionnages.' : 'L’accès de Double Programme à l’historique complet par pseudo est indisponible. Vous pouvez consulter le journal de chaque membre sur Letterboxd en saisissant son pseudo.'} Le mode « Activité récente » utilise uniquement les dernières entrées des flux publics.</p></details>
        <details><summary>Que contient une comparaison par fichier&nbsp;?</summary><p>Dans « Importer », les deux ZIP permettent de comparer les films marqués comme vus et les séances datées, revisionnages compris. Depuis un navigateur sur ordinateur, chaque personne peut <a href="https://letterboxd.com/user/exportdata/" target="_blank" rel="noreferrer">télécharger son export Letterboxd</a>. Les fichiers restent sur votre appareil.</p></details>
        <details><summary>Comment lire le score d’affinité&nbsp;?</summary><p>Il mesure la proximité de vos notes sur les films que vous avez tous les deux notés. Des notes identiques donnent 100 %. Un écart moyen d’une étoile donne environ 78 %. Le nombre de films pris en compte est indiqué à côté du score.</p></details>
        </div>
      </section>
    </main>
    <footer className="dp-footer"><div className="dp-footer-inner"><a className="dp-home" href="#haut" aria-label="Double Programme, retour en haut"><Wordmark/></a><span>Un outil indépendant de Letterboxd.</span></div></footer>
  </div>;
}
