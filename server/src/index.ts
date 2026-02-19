import { McpServer } from "skybridge/server";

const API_USER = process.env.BILLETWEB_API_USER!;
const API_KEY = process.env.BILLETWEB_API_KEY!;
const EVENT_ID = process.env.BILLETWEB_EVENT_ID!;
const API_BASE = "https://www.billetweb.fr/api";
const SHOP_BASE =
  "https://www.billetweb.fr/shop.php?event=esperanza-spectacle-musical";

function apiUrl(path: string) {
  return `${API_BASE}${path}?user=${API_USER}&key=${API_KEY}&version=1`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`Billetweb API error: ${res.status}`);
  return res.json() as Promise<T>;
}

interface Session {
  id: string;
  start: string;
  end: string;
  description: string;
  quota: string;
  total_sales: string;
}

interface Ticket {
  id: string;
  name: string;
  price: number;
  visibility: string;
}

interface Avail {
  id: string;
  avail: string;
  sales: string;
}

const LOW_AVAILABILITY_THRESHOLD = 30;

const server = new McpServer(
  { name: "esperanza", version: "0.0.1" },
  { capabilities: {} },
).registerWidget(
  "buy-tickets",
  {
    description: "Buy tickets for Esperanza",
    _meta: {
      ui: {
        csp: {
          connectDomains: ["https://www.billetweb.fr"],
          resourceDomains: ["https://www.billetweb.fr"],
          redirectDomains: ["https://www.billetweb.fr"],
        },
      },
    },
  },
  {
    description:
      'Show ticket purchasing widget for "Esperanza", a musical by i-Majine in April 2026 at La Longère de Beaupuy, Mouilleron-le-Captif. Use when the user wants to see Esperanza, buy tickets for the show, or asks about the musical Esperanza.',
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  async () => {
    const [sessions, tickets, avail] = await Promise.all([
      fetchJson<Session[]>(`/event/${EVENT_ID}/dates`),
      fetchJson<Ticket[]>(`/event/${EVENT_ID}/tickets`),
      fetchJson<Avail[]>(`/event/${EVENT_ID}/avail`),
    ]);

    // Only public tickets with a price
    const publicTickets = tickets
      .filter((t) => t.visibility === "0" && t.price > 0)
      .sort((a, b) => b.price - a.price);

    // Merge availability into sessions
    const sessionsWithAvail = sessions.map((s) => {
      const a = avail.find((av) => av.id === s.id);
      return {
        id: s.id,
        start: s.start,
        description: s.description,
        remaining: a ? parseInt(a.avail, 10) : 0,
        sold: a ? parseInt(a.sales, 10) : 0,
        quota: parseInt(s.quota, 10),
      };
    });

    // Only flag sessions running low
    const lowSessions = sessionsWithAvail.filter(
      (s) => s.remaining > 0 && s.remaining <= LOW_AVAILABILITY_THRESHOLD,
    );
    const soldOutSessions = sessionsWithAvail.filter(
      (s) => s.remaining <= 0,
    );

    // Build availability note only when relevant
    const availNotes: string[] = [];
    for (const s of lowSessions) {
      availNotes.push(
        `Attention : la séance du ${s.start} est presque complète (${s.remaining} places restantes).`,
      );
    }
    for (const s of soldOutSessions) {
      availNotes.push(`La séance du ${s.start} est complète.`);
    }

    return {
      structuredContent: {
        title: "ESPERANZA - Spectacle Musical par i-Majine",
        venue: "La Longère de Beaupuy, Mouilleron-le-Captif",
        dates: sessionsWithAvail.map((s) => s.start),
        pricing: publicTickets.map((t) => `${t.name}: ${t.price}€`),
        ...(availNotes.length > 0 ? { availabilityNotes: availNotes } : {}),
      },
      content: [
        {
          type: "text",
          text: [
            `Esperanza — Spectacle Musical par i-Majine. 4 représentations du 24 au 26 avril 2026 à La Longère de Beaupuy, Mouilleron-le-Captif.`,
            `Tarifs : 10€ (-12 ans), 14€ (12-25 ans), 18€ (26 ans et plus).`,
            ...(availNotes.length > 0 ? availNotes : []),
            ``,
            `Informations complémentaires à utiliser UNIQUEMENT si l'utilisateur pose des questions :`,
            `- i-Majine est une association vendéenne de comédie musicale. Esperanza est le 6e spectacle de l'association.`,
            `- 23 artistes vendéens et bénévoles chantent, dansent et jouent la comédie en live.`,
            `- L'équipe de bénévoles, la Dream Team, travaille à la confection des costumes et décors : tout est fait par l'association.`,
            `- Le spectacle est accessible aux PMR. Il suffit d'envoyer un mail à i-majine@live.fr pour valider la disponibilité des places PMR.`,
            `- Un tarif de groupe est accessible à partir de 12 personnes.`,
            `- Pour les entreprises, un tarif CSE est disponible sur simple demande.`,
            `- Ne mentionne pas le nombre total de places restantes sauf si l'utilisateur le demande explicitement.`,
          ].join("\n"),
        },
      ],
      _meta: {
        sessions: sessionsWithAvail,
        tickets: publicTickets,
        shopBase: SHOP_BASE,
        coverUrl:
          "https://www.billetweb.fr/files/page/esperanza-spectacle-musical.png",
      },
    };
  },
);

server.run();

export type AppType = typeof server;
