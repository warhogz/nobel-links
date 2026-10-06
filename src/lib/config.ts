/**
 * The single place links, films and positions live. Nothing below duplicates
 * them.
 */

export const SITE = {
  title: "NOBÉL — Interior Architecture",
  tagline: "From vision to reality. Worldwide.",
  lede:
    "NOBÉL delivers integrated interior architecture for complex residential " +
    "and commercial projects, from concept to completion.",
  motto: ["Spaces for a more", "meaningful life."] as const,

  /** the company presentation, served from `public/` and opened in a tab */
  overview: "/assets/NOBEL-Company-Overview.pdf",
  /* the new main site — the flagship */
  main: "https://nobeldesignstudio.com",
  instagram: "https://www.instagram.com/nobel.la/",
  /** Contact Us. Digits only after the plus — `wa.me` takes nothing else. */
  whatsapp: "+971503784954",
  whatsappLabel: "+971 50 378 4954",
};

export const whatsappHref = (n: string) => `https://wa.me/${n.replace(/[^\d]/g, "")}`;

/* ─────────────────────────────  offices  ─────────────────────────────
   Contact Us leads here. The numbers are exactly the exhibition page's, and
   sit on the same offices. An office with an empty phone / whatsapp simply
   hides that line — the site stays correct with incomplete data, and nothing
   is made up to fill the gap. */

export type Office = {
  id: string;
  name: string;
  city: string;
  country: string;
  tz: string;
  thumb: string;
  /** the film's own tone just under Safari's strip — see `.chrome-tint` */
  tint: string;
  phone: string;
  whatsapp: string;
  email: string;
};

export const OFFICES: Office[] = [
  {
    id: "la",
    name: "LA Office, USA",
    city: "Los Angeles",
    country: "United States",
    tz: "America/Los_Angeles",
    thumb: "/assets/thumb-la.webp",
    tint: "#afcce2",
    phone: "+18186203412",
    whatsapp: "+18186203412",
    email: "info@nobel.la",
  },
  {
    id: "dubai",
    name: "Dubai Office, UAE",
    city: "Dubai",
    country: "United Arab Emirates",
    tz: "Asia/Dubai",
    thumb: "/assets/thumb-dubai.webp",
    tint: "#cdd9db",
    phone: "", // TODO: Dubai number
    whatsapp: "", // TODO: Dubai WhatsApp
    email: "info@nobel.la",
  },
  {
    id: "europe",
    name: "Europe Office",
    city: "Europe",
    country: "Central European Time",
    tz: "Europe/Rome",
    thumb: "/assets/thumb-europe.webp",
    tint: "#c9d4db",
    phone: "+393318044921",
    whatsapp: "", // TODO: is this number on WhatsApp?
    email: "info@nobel.la",
  },
];

export const officeById = (id: string) => OFFICES.find((o) => o.id === id);

/* ─────────────────────────────  YouTube  ───────────────────────────── */

export type Film = {
  id: string;
  /** the project, as the studio names it */
  name: string;
  meta: string;
  /** a local copy of YouTube's own preview, cut to 16:9 */
  thumb: string;
};

export const FILMS: Film[] = [
  { id: "ir_L4Bc_TsY", name: "St. Ives", meta: "Hollywood Hills · Home tour", thumb: "/assets/yt/st-ives.webp" },
  { id: "hjPmOuM_c_c", name: "Hidden Hills", meta: "Barn house · Home tour", thumb: "/assets/yt/hidden-hills.webp" },
  { id: "JEFJtnfKuIE", name: "Hidden Hills", meta: "Max Nobel · Interview", thumb: "/assets/yt/max-nobel.webp" },
];

export const filmHref = (id: string) => `https://youtu.be/${id}`;

/* ─────────────────────────────  careers  ─────────────────────────────
   The three positions the studio is hiring for now — the ones with an
   application form in Tally — word for word as the main site's vacancies
   page has them.

   Each position applies through its own Tally form: `form` is that form's
   share link (Tally → the form → Share → Copy link, https://tally.so/r/…).
   Until one is in, its button writes an email instead of going nowhere: a
   dead "Apply" is the one thing this screen must not have. */

export const CAREERS = {
  email: "careers@nobel-la.com",
};

export type Offer = { text: string; note?: string };

export type Vacancy = {
  slug: string;
  title: string;
  mode: string;
  location: string;
  type: string;
  details: string;
  requirements: readonly string[];
  offers: readonly Offer[];
  /** the position's own Tally form — its share link */
  form: string;
};

const offer = {
  salary: { text: "Competitive salary + bonuses" },
  brand: { text: "Premium architectural brand" },
  international: { text: "International projects", note: "USA, Europe, Middle East" },
  hybrid: { text: "Office / hybrid format" },
  growth: { text: "Professional growth" },
  team: { text: "Creative team environment" },
} satisfies Record<string, Offer>;

export const POSITIONS: readonly Vacancy[] = [
  {
    slug: "architect",
    title: "Architect — ArchiCAD / Revit",
    mode: "Office / Hybrid",
    location: "Dubai",
    type: "Full-time",
    details: "Lead residential projects from first sketch through technical coordination.",
    requirements: [
      "2+ years of experience",
      "Architectural drawings & documentation",
      "ArchiCAD or Revit required",
      "Experience with large-scale projects",
    ],
    offers: [offer.salary, offer.brand, offer.international, offer.hybrid, offer.growth],
    form: "https://tally.so/r/VLKDDv", // Tally — "Join NOBÉL as an Architect"
  },
  {
    slug: "finishing-manager",
    title: "Interior Finishing Manager / Procurement",
    mode: "Office / Hybrid",
    location: "Dubai",
    type: "Full-time",
    details: "Carry the design intent into the final layer, from sourcing to installation.",
    requirements: [
      "2+ years of experience",
      "Specifications, budgeting & suppliers",
      "Knowledge of furniture, lighting & materials",
      "Ability to manage 2+ projects simultaneously",
      "Strong organizational skills",
    ],
    offers: [offer.international, offer.team, offer.hybrid, offer.growth],
    form: "https://tally.so/r/LZeOYJ", // Tally — "Join NOBÉL as an FF&E / Procurement Manager"
  },
  {
    slug: "client-relations",
    title: "Client Relations & Development Manager",
    mode: "Office / Hybrid",
    location: "Dubai",
    type: "Full-time",
    details: "Build thoughtful relationships with clients and partners who share our standards.",
    requirements: [
      "2+ years of sales experience",
      "Self-driven & results-oriented",
      "Strong communication & negotiation skills",
      "Experience with international clients",
      "Fluent English",
      "Arabic-speaking candidates are preferred",
    ],
    offers: [offer.salary, offer.hybrid, offer.brand, offer.international, offer.growth],
    form: "https://tally.so/r/BzrPxQ", // Tally — "Join our team as Sales Manager in Dubai"
  },
];

/** Where "Apply" goes: the position's own Tally form, or until then an email. */
export function applyHref(v: Vacancy) {
  if (v.form) return v.form;
  return `mailto:${CAREERS.email}?subject=${encodeURIComponent(`Application — ${v.title}`)}`;
}
