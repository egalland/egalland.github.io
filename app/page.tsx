import Comparator from "../components/comparator";

function Wordmark() {
  return <span className="dp-wordmark"><span className="dp-logo" aria-hidden="true"><i/><i/></span>Double Programme</span>;
}

export default function Home() {
  return <div className="dp-shell">
    <header className="dp-mast">
      <a className="dp-home" href="#haut" aria-label="Double Programme, accueil"><Wordmark/></a>
      <a className="dp-help" href="#fonctionnement"><span aria-hidden="true">?</span> Mode d’emploi</a>
    </header>
    <main id="haut">
      <section className="dp-hero" aria-labelledby="dp-title">
        <div className="dp-hero-photo" aria-hidden="true"><img src="/salle.webp" alt="" fetchPriority="high"/></div>
        <div className="dp-hero-copy">
          <div className="dp-kicker"><span className="dp-reel" aria-hidden="true"/> Comparateur Letterboxd</div>
          <h1 id="dp-title">Vos cinémas,<br/><em>face à face.</em></h1>
          <p>Retrouvez vos films en commun, les notes qui vous divisent et votre prochaine séance.</p>
        </div>
      </section>
      <Comparator/>
      <section id="fonctionnement" className="dp-method" aria-labelledby="method-title">
        <h2 id="method-title">Mode d’emploi</h2>
        <details><summary>Que peut-on comparer avec deux pseudos&nbsp;?</summary><p>Chaque pseudo donne accès aux films présents dans le journal public récent de ce membre. Un film peut déjà avoir été vu sans apparaître dans ce flux.</p></details>
        <details><summary>Comment comparer tous les films enregistrés&nbsp;?</summary><p>Depuis un navigateur sur ordinateur, chaque personne peut <a href="https://letterboxd.com/user/exportdata/" target="_blank" rel="noreferrer">télécharger son export Letterboxd</a>. Dans « Exports », sélectionnez les deux ZIP. Leur contenu est lu sur votre appareil. Un fichier de notes CSV seul permet aussi de comparer les notes qu’il contient.</p></details>
        <details><summary>Comment lire le score d’affinité&nbsp;?</summary><p>Il mesure la proximité de vos notes sur les films que vous avez tous les deux notés. Des notes identiques donnent 100 %. Un écart moyen d’une étoile donne environ 78 %. Le nombre de films pris en compte est indiqué à côté du score.</p></details>
      </section>
    </main>
    <footer className="dp-footer"><Wordmark/><span>Un outil indépendant de Letterboxd.</span></footer>
  </div>;
}
