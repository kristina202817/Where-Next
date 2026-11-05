// City content extracted from the Figma frame "City Cards — 16" (front + back of each card).
export type City = {
  id: string;
  index: number; // 1–16, order of the frames
  name: string;
  country: string;
  seasons: string;
  budget: string;
  note: string; // Caveat line on the front
  coords: string;
  language: string;
  currency: string;
  idealStay: string;
  bestSeason: string;
  temperature: string;
  tags: [string, string, string, string];
  why: string;
  photo: string;
};

const photo = (file: string) => `/assets/opt/${file}.jpg`;

export const cities: City[] = [
  {
    id: "porto", index: 1, name: "Porto", country: "Portugal", seasons: "Spring · Autumn", budget: "~€80/day",
    note: "try a francesinha!", coords: "41.1579° N, 8.6291° W", language: "Portuguese", currency: "Euro (EUR)",
    idealStay: "3–4 days", bestSeason: "May – June, Sept – Oct", temperature: "Winter 5° → 14°C · Summer 15° → 25°C",
    tags: ["Wine", "Riverside", "Food", "Azulejos"],
    why: "Port wine cellars across the river, blue-tiled facades and long golden sunsets over the Douro.",
    photo: photo("0b3d0"),
  },
  {
    id: "barcelona", index: 2, name: "Barcelona", country: "Spain", seasons: "Spring · Autumn", budget: "~€110/day",
    note: "tapas crawl in El Born", coords: "41.3874° N, 2.1686° E", language: "Spanish, Catalan", currency: "Euro (EUR)",
    idealStay: "3–4 days", bestSeason: "May – June, Sept – Oct", temperature: "Winter 8° → 14°C · Summer 22° → 29°C",
    tags: ["Beach", "Gaudí", "Tapas", "Nightlife"],
    why: "Gaudí's surreal buildings, a city beach and late-night tapas in Gothic Quarter lanes.",
    photo: photo("b88ec"),
  },
  {
    id: "buenos-aires", index: 3, name: "Buenos Aires", country: "Argentina", seasons: "Spring · Autumn", budget: "~€70/day",
    note: "dance a milonga!", coords: "34.6037° S, 58.3816° W", language: "Spanish", currency: "Peso (ARS)",
    idealStay: "4–5 days", bestSeason: "Mar – May, Sept – Nov", temperature: "Winter 8° → 15°C · Summer 20° → 30°C",
    tags: ["Tango", "Steak", "Cafés", "Street art"],
    why: "Grand boulevards, smoky tango halls and steak dinners that start at 10 pm.",
    photo: photo("59526"),
  },
  {
    id: "kyoto", index: 4, name: "Kyoto", country: "Japan", seasons: "Spring · Autumn", budget: "~€120/day",
    note: "sunrise at Fushimi Inari", coords: "35.0116° N, 135.7681° E", language: "Japanese", currency: "Yen (JPY)",
    idealStay: "3–4 days", bestSeason: "Late Mar – Apr, Oct – Nov", temperature: "Winter 1° → 9°C · Summer 24° → 33°C",
    tags: ["Temples", "Gardens", "Tea", "Kaiseki"],
    why: "Over a thousand temples, moss gardens and quiet lanes that glow with lanterns at dusk.",
    photo: photo("f1df8"),
  },
  {
    id: "marrakech", index: 5, name: "Marrakech", country: "Morocco", seasons: "Spring · Autumn", budget: "~€60/day",
    note: "haggle, then mint tea", coords: "31.6295° N, 7.9811° W", language: "Arabic, Berber", currency: "Dirham (MAD)",
    idealStay: "3–4 days", bestSeason: "Mar – May, Oct – Nov", temperature: "Winter 6° → 19°C · Summer 20° → 37°C",
    tags: ["Souks", "Riads", "Spices", "Desert"],
    why: "Labyrinthine souks, rooftop riads and the evening buzz of Jemaa el-Fnaa square.",
    photo: photo("3b57b"),
  },
  {
    id: "reykjavik", index: 6, name: "Reykjavík", country: "Iceland", seasons: "Summer · Winter", budget: "~€180/day",
    note: "chase the northern lights", coords: "64.1466° N, 21.9426° W", language: "Icelandic", currency: "Króna (ISK)",
    idealStay: "4–5 days", bestSeason: "Jun – Aug, Feb – Mar for auroras", temperature: "Winter -3° → 3°C · Summer 9° → 14°C",
    tags: ["Nature", "Hot pools", "Auroras", "Whales"],
    why: "A cosy capital on the edge of glaciers, geysers and endless midsummer daylight.",
    photo: photo("fe977"),
  },
  {
    id: "istanbul", index: 7, name: "Istanbul", country: "Türkiye", seasons: "Spring · Autumn", budget: "~€70/day",
    note: "ferry at sunset!", coords: "41.0082° N, 28.9784° E", language: "Turkish", currency: "Lira (TRY)",
    idealStay: "4–5 days", bestSeason: "Apr – May, Sept – Oct", temperature: "Winter 3° → 9°C · Summer 20° → 29°C",
    tags: ["Bazaars", "Mosques", "Bosphorus", "Mezze"],
    why: "Two continents one ferry ride apart: Byzantine domes, spice bazaars and endless çay.",
    photo: photo("a49b5"),
  },
  {
    id: "mexico-city", index: 8, name: "Mexico City", country: "Mexico", seasons: "Spring · Autumn", budget: "~€70/day",
    note: "tacos al pastor, always", coords: "19.4326° N, 99.1332° W", language: "Spanish", currency: "Peso (MXN)",
    idealStay: "4–5 days", bestSeason: "Mar – May, Oct – Nov", temperature: "Winter 6° → 22°C · Summer 13° → 25°C",
    tags: ["Tacos", "Murals", "Museums", "Markets"],
    why: "World-class museums, Frida's blue house and street tacos on every corner.",
    photo: photo("ad219"),
  },
  {
    id: "cape-town", index: 9, name: "Cape Town", country: "South Africa", seasons: "Summer", budget: "~€80/day",
    note: "hike Table Mountain", coords: "33.9249° S, 18.4241° E", language: "English, Afrikaans", currency: "Rand (ZAR)",
    idealStay: "5–6 days", bestSeason: "Nov – Mar", temperature: "Winter 7° → 18°C · Summer 16° → 27°C",
    tags: ["Ocean", "Hiking", "Wine", "Penguins"],
    why: "Table Mountain above, two oceans below and wine country just an hour away.",
    photo: photo("55a2c"),
  },
  {
    id: "tbilisi", index: 10, name: "Tbilisi", country: "Georgia", seasons: "Spring · Autumn", budget: "~€50/day",
    note: "khachapuri + sulfur baths", coords: "41.7151° N, 44.8271° E", language: "Georgian", currency: "Lari (GEL)",
    idealStay: "3–4 days", bestSeason: "May – June, Sept – Oct", temperature: "Winter -1° → 7°C · Summer 19° → 31°C",
    tags: ["Wine", "Old town", "Baths", "Khinkali"],
    why: "Carved balconies, sulfur baths and an 8,000-year-old wine tradition poured generously.",
    photo: photo("100c0"),
  },
  {
    id: "hanoi", index: 11, name: "Hanoi", country: "Vietnam", seasons: "Spring · Autumn", budget: "~€40/day",
    note: "egg coffee, trust me", coords: "21.0285° N, 105.8542° E", language: "Vietnamese", currency: "Dong (VND)",
    idealStay: "3–4 days", bestSeason: "Mar – Apr, Oct – Dec", temperature: "Winter 14° → 20°C · Summer 26° → 33°C",
    tags: ["Pho", "Old quarter", "Lakes", "Coffee"],
    why: "Scooter-packed lanes, pho for breakfast and lakeside calm just one block away.",
    photo: photo("56bdb"),
  },
  {
    id: "copenhagen", index: 12, name: "Copenhagen", country: "Denmark", seasons: "Summer", budget: "~€170/day",
    note: "rent a bike first", coords: "55.6761° N, 12.5683° E", language: "Danish", currency: "Krone (DKK)",
    idealStay: "3 days", bestSeason: "May – Aug", temperature: "Winter -1° → 3°C · Summer 13° → 22°C",
    tags: ["Design", "Bikes", "Harbour", "Hygge"],
    why: "Colourful harbour houses, design everywhere and a whole city on two wheels.",
    photo: photo("b2e53"),
  },
  {
    id: "edinburgh", index: 13, name: "Edinburgh", country: "Scotland", seasons: "Summer", budget: "~€130/day",
    note: "climb Arthur's Seat", coords: "55.9533° N, 3.1883° W", language: "English", currency: "Pound (GBP)",
    idealStay: "3 days", bestSeason: "May – Sept", temperature: "Winter 1° → 7°C · Summer 11° → 19°C",
    tags: ["Castle", "History", "Whisky", "Festivals"],
    why: "A castle on an extinct volcano, medieval closes and the world's biggest arts festival in August.",
    photo: photo("1894c"),
  },
  {
    id: "new-york", index: 14, name: "New York", country: "USA", seasons: "Spring · Autumn", budget: "~€200/day",
    note: "walk the Brooklyn Bridge", coords: "40.7128° N, 74.0060° W", language: "English", currency: "Dollar (USD)",
    idealStay: "4–5 days", bestSeason: "Apr – June, Sept – Nov", temperature: "Winter -3° → 4°C · Summer 22° → 29°C",
    tags: ["Skyline", "Museums", "Broadway", "Pizza"],
    why: "Every neighbourhood is its own city: museums, Broadway and a slice on every corner.",
    photo: photo("f9ed9"),
  },
  {
    id: "dubrovnik", index: 15, name: "Dubrovnik", country: "Croatia", seasons: "Spring · Autumn", budget: "~€120/day",
    note: "walk the walls early", coords: "42.6507° N, 18.0944° E", language: "Croatian", currency: "Euro (EUR)",
    idealStay: "2–3 days", bestSeason: "May – June, Sept", temperature: "Winter 6° → 12°C · Summer 21° → 29°C",
    tags: ["Old town", "Sea", "City walls", "Islands"],
    why: "Marble streets inside medieval walls, with the Adriatic glittering on every side.",
    photo: photo("fe5a8"),
  },
  {
    id: "seoul", index: 16, name: "Seoul", country: "South Korea", seasons: "Spring · Autumn", budget: "~€100/day",
    note: "late-night BBQ!", coords: "37.5665° N, 126.9780° E", language: "Korean", currency: "Won (KRW)",
    idealStay: "4–5 days", bestSeason: "Apr – May, Sept – Nov", temperature: "Winter -6° → 2°C · Summer 23° → 30°C",
    tags: ["K-food", "Palaces", "Neon", "Markets"],
    why: "Royal palaces beside glass towers, night markets and Korean BBQ until 2 am.",
    photo: photo("6e614"),
  },
];

// Derived values (Guidelines §4)
export const gateOf = (c: City) => String(c.index).padStart(2, "0");
export const seatOf = (c: City) => `${c.index}A`;

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";
/** Uppercase, accents stripped, anything outside the flap set becomes a space. */
export const toFlapText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split("")
    .map((ch) => (FLAP_CHARS.includes(ch) ? ch : " "))
    .join("");
export const FLAP_CHARSET = FLAP_CHARS;
