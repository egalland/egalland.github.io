import type { Film, Profile } from "./compare";

function film(title: string, year: string, slug: string, rating: number | null): Film {
  return { title, year, rating, url: "https://letterboxd.com/film/" + slug + "/" };
}
const picks = [
  ["Mulholland Drive", "2001", "mulholland-drive", 5, 5],
  ["Les Affranchis", "1990", "goodfellas", 5, 4.5],
  ["Phantom Thread", "2017", "phantom-thread", 4.5, 2.5],
  ["Parasite", "2019", "parasite-2019", 4.5, 4.5],
  ["2001 : L’Odyssée de l’espace", "1968", "2001-a-space-odyssey", 5, 3],
  ["Portrait de la jeune fille en feu", "2019", "portrait-of-a-lady-on-fire", 4, 5],
  ["La Haine", "1995", "la-haine", null, 4],
] as const;

export const demoProfiles: [Profile, Profile] = [
  { name: "Camille", source: "demo", complete: false,
    films: [...picks.map(([t,y,s,r]) => film(t,y,s,r)),
      film("Paris, Texas", "1984", "paris-texas", 5),
      film("The Master", "2012", "the-master-2012", 4.5)] },
  { name: "Lou", source: "demo", complete: false,
    films: [...picks.map(([t,y,s,,r]) => film(t,y,s,r)),
      film("Cléo de 5 à 7", "1962", "cleo-from-5-to-7", 5),
      film("In the Mood for Love", "2000", "in-the-mood-for-love", 4.5)] },
];

export const demoHistoryProfiles: [Profile, Profile] = [
  {
    ...demoProfiles[0], complete: true,
    diary: [
      { film: demoProfiles[0].films[0], watchedDate: "2026-11-08", rewatch: true },
      { film: demoProfiles[0].films[3], watchedDate: "2025-10-12", rewatch: false },
      { film: { ...demoProfiles[0].films[0], rating: 4 }, watchedDate: "2021-02-07", rewatch: false },
    ],
  },
  {
    ...demoProfiles[1], complete: true,
    diary: [
      { film: demoProfiles[1].films[5], watchedDate: "2026-11-02", rewatch: false },
      { film: demoProfiles[1].films[1], watchedDate: "2025-10-12", rewatch: true },
      { film: { ...demoProfiles[1].films[1], rating: 4 }, watchedDate: "2020-08-16", rewatch: false },
    ],
  },
];
