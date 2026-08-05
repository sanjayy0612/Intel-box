/** Persisted-side fixtures: the company library, people, drafts, and tracker.
 *
 *  Ages are expressed in days from "now" so the freshness states stay correct
 *  whenever this is read -- a hardcoded date would silently go stale and every
 *  row would render Ember within a month.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

export const companies = [
  {
    slug: "zepto",
    name: "Zepto",
    category: "quick commerce",
    lastResearched: daysAgo(4),
    peopleFound: 4,
    outreachStatus: "3 drafts",
    competitors: 6,
  },
  {
    slug: "blinkit",
    name: "Blinkit",
    category: "quick commerce",
    lastResearched: daysAgo(23),
    peopleFound: 6,
    outreachStatus: "2 sent",
    competitors: 5,
  },
  {
    slug: "swiggy-instamart",
    name: "Swiggy Instamart",
    category: "quick commerce",
    lastResearched: daysAgo(41),
    peopleFound: 2,
    outreachStatus: "None",
    competitors: 5,
  },
  {
    slug: "notion",
    name: "Notion",
    category: "productivity software",
    lastResearched: daysAgo(1),
    peopleFound: 5,
    outreachStatus: "1 replied",
    competitors: 8,
  },
  {
    slug: "linear",
    name: "Linear",
    category: "issue tracking",
    lastResearched: daysAgo(29),
    peopleFound: 3,
    outreachStatus: "None",
    competitors: 4,
  },
];

export const companyDetail = {
  zepto: {
    ...companies[0],
    reportMarkdown: [
      "# Company overview",
      "",
      "Zepto operates a dark-store network across eleven Indian metros, positioning on",
      "ten-minute delivery rather than assortment breadth. Its category share has grown",
      "against Blinkit in tier-1 cities while remaining thin outside them.",
      "",
      "The company's public narrative leans hard on delivery speed as the product. That",
      "framing is doing real work commercially — it lets Zepto avoid competing on",
      "catalogue depth, where it is structurally behind, and instead compete on store",
      "density, where its capital has gone.",
      "",
      "## Market position",
      "",
      "The category has consolidated to three serious operators. Zepto's differentiation",
      "is operational rather than commercial: stores per square kilometre, not price.",
      "",
      "> Category leadership in quick commerce is a function of store density, and store",
      "> density is a function of how long you can fund negative contribution margin.",
      "",
      "## Competitor mapping",
      "",
      "1. Blinkit — the closest operational analogue, with a wider catalogue.",
      "2. Swiggy Instamart — distribution advantage through the parent app.",
      "3. BigBasket BB Now — slower, but stronger in scheduled grocery.",
      "",
      "## Strategic watchouts",
      "",
      "- Dark-store unit economics remain unproven outside the top six cities.",
      "- Competitor discounting is currently funded by parent-company balance sheets,",
      "  which means the price floor is not set by anyone's cost base.",
      "- Category regulation on gig-worker classification is an unpriced risk.",
    ].join("\n"),
    people: [
      {
        id: "p1",
        name: "Aarti Menon",
        title: "VP Growth",
        seniority: "senior",
        relevance: 0.92,
        snippet: "Leads category growth and new-city launches. Posts regularly on dark-store economics.",
      },
      {
        id: "p2",
        name: "Rohan Iyer",
        title: "Head of Category Marketing",
        seniority: "senior",
        relevance: 0.84,
        snippet: "Owns brand partnerships across the grocery and personal-care categories.",
      },
      {
        id: "p3",
        name: "Devika Rao",
        title: "Director, Partnerships",
        seniority: "senior",
        relevance: 0.71,
        snippet: "Handles co-marketing with FMCG brands.",
      },
      {
        id: "p4",
        name: "Sameer Kulkarni",
        title: "Growth Lead, New Markets",
        seniority: "mid",
        relevance: 0.63,
        snippet: "Recently moved from the Blinkit growth team.",
      },
    ],
    competitorList: [
      { name: "Blinkit", note: "Wider catalogue, comparable delivery promise." },
      { name: "Swiggy Instamart", note: "Distribution through the parent app." },
      { name: "BigBasket BB Now", note: "Stronger in scheduled grocery." },
      { name: "Dunzo Daily", note: "Retreating from the category." },
      { name: "Flipkart Minutes", note: "Recent entrant, metro-only." },
      { name: "JioMart Express", note: "Price-led, slower fulfilment." },
    ],
  },
};

export const drafts = [
  {
    id: "d1",
    companySlug: "zepto",
    companyName: "Zepto",
    personName: "Aarti Menon",
    personTitle: "VP Growth",
    channel: "email",
    status: "drafted",
    subject: "Dark-store density, not discounting",
    body:
      "Hi Aarti,\n\nYour last three city launches all led with store density rather than " +
      "price, which is the opposite of how the category is being covered.\n\nWe've been " +
      "modelling contribution margin by store radius and thought the comparison might be " +
      "useful to you.",
  },
  {
    id: "d2",
    companySlug: "zepto",
    companyName: "Zepto",
    personName: "Rohan Iyer",
    personTitle: "Head of Category Marketing",
    channel: "linkedin",
    status: "drafted",
    subject: "",
    body:
      "Hi Rohan — the personal-care category push you ran last quarter is the clearest " +
      "example of a quick-commerce brand partnership actually landing. Would you be open " +
      "to comparing notes?",
  },
  {
    id: "d3",
    companySlug: "notion",
    companyName: "Notion",
    personName: "Priya Sharma",
    personTitle: "Head of Product Marketing",
    channel: "email",
    status: "sent",
    subject: "Positioning against the AI-first note-takers",
    body: "Hi Priya,\n\nA quick observation on how the category is being reframed.",
  },
];

export const trackerEntries = [
  {
    id: "t1",
    companyName: "Notion",
    personName: "Priya Sharma",
    channel: "email",
    status: "replied",
    sentAt: daysAgo(9),
    followUpDue: null,
  },
  {
    id: "t2",
    companyName: "Blinkit",
    personName: "Vikram Shah",
    channel: "linkedin",
    status: "opened",
    sentAt: daysAgo(5),
    followUpDue: daysAgo(-1),
  },
  {
    id: "t3",
    companyName: "Blinkit",
    personName: "Nisha Patel",
    channel: "email",
    status: "sent",
    sentAt: daysAgo(4),
    followUpDue: daysAgo(1),
  },
];

/** Backed by IntelBoxRepository.find_follow_ups_due, which exists in the backend
 *  and has nothing surfacing it. The dashboard is where that becomes visible. */
export const followUpsDue = trackerEntries.filter(
  (entry) => entry.followUpDue && Date.parse(entry.followUpDue) <= Date.now()
);

export const recentRuns = [
  { runId: "zepto-1774600100", company: "Zepto", category: "quick commerce", status: "completed", finishedAt: daysAgo(4) },
  { runId: "notion-1774500100", company: "Notion", category: "productivity software", status: "completed", finishedAt: daysAgo(1) },
  { runId: "linear-1774400100", company: "Linear", category: "issue tracking", status: "failed", finishedAt: daysAgo(6) },
];
