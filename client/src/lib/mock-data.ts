import heroBg from "../assets/hero-bg.png";
import trophyStag from "../assets/trophy-stag.png";
import trophyKudu from "../assets/trophy-kudu.png";

export interface Trophy {
  id: string;
  species: string;
  name: string; // Nickname or specific animal
  date: string;
  location: string;
  score: string; // SCI or Boone & Crockett
  imageUrl: string;
  notes: string;
  method: "Rifle" | "Bow" | "Muzzleloader";
  featured?: boolean;
}

export const trophies: Trophy[] = [
  {
    id: "1",
    species: "Red Stag",
    name: "The Monarch",
    date: "2023-10-15",
    location: "Highlands, Scotland",
    score: "SCI 230",
    imageUrl: trophyStag,
    notes: "Taken at last light after a 3-day stalk. Heavy rainfall made the approach difficult.",
    method: "Rifle",
    featured: true,
  },
  {
    id: "2",
    species: "Greater Kudu",
    name: "Grey Ghost",
    date: "2024-05-22",
    location: "Limpopo, South Africa",
    score: "55 inches",
    imageUrl: trophyKudu,
    notes: "Spotted near the waterhole. Perfect shot placement at 150 yards.",
    method: "Bow",
    featured: true,
  },
  {
    id: "3",
    species: "Whitetail Deer",
    name: "Wide 10-Point",
    date: "2023-11-04",
    location: "Kansas, USA",
    score: "165 B&C",
    imageUrl: "https://images.unsplash.com/photo-1534759846116-5799c33ce22a?q=80&w=1000&auto=format&fit=crop", // Placeholder
    notes: "Rut activity was high. Came in rattling.",
    method: "Bow",
    featured: false,
  },
  {
    id: "4",
    species: "Elk",
    name: "Royal Bull",
    date: "2022-09-18",
    location: "Colorado, USA",
    score: "310",
    imageUrl: "https://images.unsplash.com/photo-1506917728037-b6af011561e3?q=80&w=1000&auto=format&fit=crop", // Placeholder
    notes: "Bugling match for 2 hours before he stepped out.",
    method: "Rifle",
    featured: false,
  },
];

export const heroImage = heroBg;
