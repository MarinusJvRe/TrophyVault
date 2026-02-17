import heroBg from "../assets/hero-bg.png";
import trophyStag from "../assets/trophy-stag.png";
import trophyKudu from "../assets/trophy-kudu.png";

export interface Weapon {
  id: string;
  name: string;
  type: "Rifle" | "Bow" | "Muzzleloader" | "Handgun" | "Shotgun";
  caliber?: string; // e.g. .300 Win Mag
  make?: string;
  model?: string;
  optic?: string;
  notes?: string;
  imageUrl?: string;
}

export const weapons: Weapon[] = [
  {
    id: "1",
    name: "Old Faithful",
    type: "Rifle",
    caliber: ".300 Win Mag",
    make: "Remington",
    model: "700",
    optic: "Leupold VX-3i",
    imageUrl: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "2",
    name: "Mathews Phase4",
    type: "Bow",
    make: "Mathews",
    model: "Phase4 29",
    notes: "70lb draw weight, 28.5\" draw length",
    imageUrl: "https://images.unsplash.com/photo-1590422749833-2557cb484c0f?q=80&w=1000&auto=format&fit=crop"
  }
];

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
  weaponId?: string; // Link to a weapon in the safe
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
