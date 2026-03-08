export interface ScoringThreshold {
  species: string;
  sci: string | null;
  rowlandWard: string | null;
  booneAndCrockett: string | null;
}

const thresholds: ScoringThreshold[] = [
  { species: "Greater Kudu", sci: "54", rowlandWard: '53 1/2"', booneAndCrockett: null },
  { species: "Cape Buffalo", sci: "100", rowlandWard: '42"', booneAndCrockett: null },
  { species: "Gemsbok", sci: "35", rowlandWard: '40"', booneAndCrockett: null },
  { species: "Sable Antelope", sci: "100", rowlandWard: '41"', booneAndCrockett: null },
  { species: "Nyala", sci: "57", rowlandWard: '27"', booneAndCrockett: null },
  { species: "Blue Wildebeest", sci: "70", rowlandWard: '28 1/2"', booneAndCrockett: null },
  { species: "Black Wildebeest", sci: "72", rowlandWard: '22 3/4"', booneAndCrockett: null },
  { species: "Impala", sci: "54", rowlandWard: '23 5/8"', booneAndCrockett: null },
  { species: "Waterbuck", sci: "55", rowlandWard: '28"', booneAndCrockett: null },
  { species: "Eland", sci: "77", rowlandWard: '35"', booneAndCrockett: null },
  { species: "Springbok", sci: "30", rowlandWard: '14"', booneAndCrockett: null },
  { species: "Blesbok", sci: "40", rowlandWard: '16 1/2"', booneAndCrockett: null },
  { species: "Bushbuck", sci: "31", rowlandWard: '15"', booneAndCrockett: null },
  { species: "Warthog", sci: "30", rowlandWard: '13"', booneAndCrockett: null },
  { species: "Zebra", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Burchell's Zebra", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Mountain Zebra", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Giraffe", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Hartebeest", sci: "55", rowlandWard: '23"', booneAndCrockett: null },
  { species: "Red Hartebeest", sci: "55", rowlandWard: '23"', booneAndCrockett: null },
  { species: "Tsessebe", sci: "35", rowlandWard: '15"', booneAndCrockett: null },
  { species: "Roan Antelope", sci: "55", rowlandWard: '27"', booneAndCrockett: null },
  { species: "Oryx", sci: "35", rowlandWard: '40"', booneAndCrockett: null },
  { species: "Steenbok", sci: "11", rowlandWard: '4 1/2"', booneAndCrockett: null },
  { species: "Duiker", sci: "11", rowlandWard: '4 1/2"', booneAndCrockett: null },
  { species: "Common Duiker", sci: "11", rowlandWard: '4 1/2"', booneAndCrockett: null },
  { species: "Klipspringer", sci: "11", rowlandWard: '4 5/8"', booneAndCrockett: null },
  { species: "Mountain Reedbuck", sci: "14", rowlandWard: '7"', booneAndCrockett: null },
  { species: "Common Reedbuck", sci: "14", rowlandWard: '14"', booneAndCrockett: null },
  { species: "Kudu", sci: "54", rowlandWard: '53 1/2"', booneAndCrockett: null },
  { species: "Lion", sci: "24", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Leopard", sci: "14", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Elephant", sci: "90", rowlandWard: "100 lbs", booneAndCrockett: null },
  { species: "African Elephant", sci: "90", rowlandWard: "100 lbs", booneAndCrockett: null },
  { species: "Hippopotamus", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Crocodile", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },
  { species: "Nile Crocodile", sci: "n/a", rowlandWard: "n/a", booneAndCrockett: null },

  { species: "White-tailed Deer", sci: "n/a", rowlandWard: null, booneAndCrockett: '170 (typical) / 195 (non-typical)' },
  { species: "Whitetail Deer", sci: "n/a", rowlandWard: null, booneAndCrockett: '170 (typical) / 195 (non-typical)' },
  { species: "Mule Deer", sci: "n/a", rowlandWard: null, booneAndCrockett: '190 (typical) / 230 (non-typical)' },
  { species: "Elk", sci: "n/a", rowlandWard: null, booneAndCrockett: '360 (typical) / 385 (non-typical)' },
  { species: "Rocky Mountain Elk", sci: "n/a", rowlandWard: null, booneAndCrockett: '360 (typical) / 385 (non-typical)' },
  { species: "Roosevelt Elk", sci: "n/a", rowlandWard: null, booneAndCrockett: '275 (typical) / 285 (non-typical)' },
  { species: "Moose", sci: "n/a", rowlandWard: null, booneAndCrockett: "195" },
  { species: "Alaska-Yukon Moose", sci: "n/a", rowlandWard: null, booneAndCrockett: "224" },
  { species: "Canada Moose", sci: "n/a", rowlandWard: null, booneAndCrockett: "195" },
  { species: "Shiras Moose", sci: "n/a", rowlandWard: null, booneAndCrockett: "155" },
  { species: "Caribou", sci: "n/a", rowlandWard: null, booneAndCrockett: "375" },
  { species: "Mountain Caribou", sci: "n/a", rowlandWard: null, booneAndCrockett: "375" },
  { species: "Woodland Caribou", sci: "n/a", rowlandWard: null, booneAndCrockett: "295" },
  { species: "Barren Ground Caribou", sci: "n/a", rowlandWard: null, booneAndCrockett: "400" },
  { species: "Pronghorn", sci: "n/a", rowlandWard: null, booneAndCrockett: "82" },
  { species: "Pronghorn Antelope", sci: "n/a", rowlandWard: null, booneAndCrockett: "82" },
  { species: "Bighorn Sheep", sci: "n/a", rowlandWard: null, booneAndCrockett: "175" },
  { species: "Dall Sheep", sci: "n/a", rowlandWard: null, booneAndCrockett: "170" },
  { species: "Stone Sheep", sci: "n/a", rowlandWard: null, booneAndCrockett: "170" },
  { species: "Desert Bighorn Sheep", sci: "n/a", rowlandWard: null, booneAndCrockett: "168" },
  { species: "Mountain Goat", sci: "n/a", rowlandWard: null, booneAndCrockett: "50" },
  { species: "Bison", sci: "n/a", rowlandWard: null, booneAndCrockett: "115" },
  { species: "American Bison", sci: "n/a", rowlandWard: null, booneAndCrockett: "115" },
  { species: "Black Bear", sci: "18", rowlandWard: null, booneAndCrockett: '21 (skull)' },
  { species: "Grizzly Bear", sci: "n/a", rowlandWard: null, booneAndCrockett: '24 (skull)' },
  { species: "Brown Bear", sci: "n/a", rowlandWard: null, booneAndCrockett: '28 (skull)' },
  { species: "Polar Bear", sci: "n/a", rowlandWard: null, booneAndCrockett: '27 (skull)' },
  { species: "Cougar", sci: "n/a", rowlandWard: null, booneAndCrockett: '15 (skull)' },
  { species: "Mountain Lion", sci: "n/a", rowlandWard: null, booneAndCrockett: '15 (skull)' },
  { species: "Wild Turkey", sci: "n/a", rowlandWard: null, booneAndCrockett: null },
  { species: "Coues Deer", sci: "n/a", rowlandWard: null, booneAndCrockett: '110 (typical)' },
  { species: "Sitka Blacktail Deer", sci: "n/a", rowlandWard: null, booneAndCrockett: '108 (typical)' },
  { species: "Columbia Blacktail Deer", sci: "n/a", rowlandWard: null, booneAndCrockett: '135 (typical) / 155 (non-typical)' },

  { species: "Red Deer", sci: "28", rowlandWard: '36"', booneAndCrockett: null },
  { species: "Red Stag", sci: "28", rowlandWard: '36"', booneAndCrockett: null },
  { species: "Fallow Deer", sci: "30", rowlandWard: '28"', booneAndCrockett: null },
  { species: "Roe Deer", sci: "n/a", rowlandWard: '10"', booneAndCrockett: null },
  { species: "Chamois", sci: "25", rowlandWard: '9"', booneAndCrockett: null },
  { species: "Alpine Ibex", sci: "30", rowlandWard: '33"', booneAndCrockett: null },
  { species: "Ibex", sci: "30", rowlandWard: '33"', booneAndCrockett: null },
  { species: "Spanish Ibex", sci: "26", rowlandWard: '26"', booneAndCrockett: null },
  { species: "Mouflon", sci: "27", rowlandWard: '28"', booneAndCrockett: null },
  { species: "Wild Boar", sci: "18", rowlandWard: '10"', booneAndCrockett: null },
  { species: "Aoudad", sci: "60", rowlandWard: '28"', booneAndCrockett: null },
  { species: "Barbary Sheep", sci: "60", rowlandWard: '28"', booneAndCrockett: null },
  { species: "Tahr", sci: "25", rowlandWard: '12"', booneAndCrockett: null },
  { species: "Himalayan Tahr", sci: "25", rowlandWard: '12"', booneAndCrockett: null },
  { species: "Markhor", sci: "80", rowlandWard: '38"', booneAndCrockett: null },
  { species: "Marco Polo Sheep", sci: "45", rowlandWard: '55"', booneAndCrockett: null },
  { species: "Axis Deer", sci: "26", rowlandWard: '30"', booneAndCrockett: null },
  { species: "Chital", sci: "26", rowlandWard: '30"', booneAndCrockett: null },
  { species: "Sambar", sci: "29", rowlandWard: '30"', booneAndCrockett: null },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[''`\-]/g, "").replace(/\s+/g, " ").trim();
}

export function getThreshold(species: string, system: string): string | null {
  const normalizedSpecies = normalize(species);
  const entry = thresholds.find(t => normalize(t.species) === normalizedSpecies);
  if (!entry) return null;

  const sys = system.toLowerCase().replace(/[&\s]/g, "");
  if (sys === "sci" || sys.includes("safari")) return entry.sci;
  if (sys.includes("rowland")) return entry.rowlandWard;
  if (sys.includes("boone") || sys === "bc" || sys === "b&c" || sys === "bc") return entry.booneAndCrockett;

  return entry.sci;
}

export function getAllThresholds(species: string): ScoringThreshold | null {
  const normalizedSpecies = normalize(species);
  return thresholds.find(t => normalize(t.species) === normalizedSpecies) || null;
}

export function parseScoreNumeric(raw: string): number | null {
  if (!raw || raw.trim() === "" || raw.toLowerCase() === "n/a") return null;
  const cleaned = raw.replace(/[""″]/g, "").replace(/\(.*?\)/g, "").trim();
  const fractionMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1]) + parseInt(fractionMatch[2]) / parseInt(fractionMatch[3]);
  }
  const simpleFraction = cleaned.match(/^(\d+)\/(\d+)$/);
  if (simpleFraction) {
    return parseInt(simpleFraction[1]) / parseInt(simpleFraction[2]);
  }
  const num = parseFloat(cleaned.replace(/[^0-9.\-]/g, ""));
  return isNaN(num) ? null : num;
}

export function findClosestSpecies(species: string): ScoringThreshold | null {
  const normalizedSpecies = normalize(species);
  const exact = thresholds.find(t => normalize(t.species) === normalizedSpecies);
  if (exact) return exact;

  const partial = thresholds.find(t => {
    const n = normalize(t.species);
    return n.includes(normalizedSpecies) || normalizedSpecies.includes(n);
  });
  return partial || null;
}
