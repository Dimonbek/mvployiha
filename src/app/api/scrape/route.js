import { NextResponse } from 'next/server';

/**
 * MARKET RESEARCH AGENT (Mvployiha v7.2 - Precision Omni-Agent)
 * Logic: Strict Token Intersection, Zero-Leak Category Filtering.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

const CATEGORY_MAP = {
  iphone: ["iphone", "ayfon", "apple phone", "apple smartphone"],
  samsung: ["samsung", "galaxy", "s24", "s23", "samsung smartphone"],
  redmi: ["redmi", "xiaomi", "poco", "mi", "redmi smartphone"],
  macbook: ["macbook", "apple laptop", "m3", "m2"],
  windows: ["laptop", "noutbuk", "kompyuter", "asus", "hp", "lenovo"],
  tv: ["tv", "televizor", "ekran", "smart tv", "artel tv", "samsung tv", "lg tv"],
  accessories: ["accessories", "aksessuar", "quloqchin", "soat", "buds", "watch", "powerbank", "airpods"]
};

const CATEGORY_AGENTS = {
  iphone: { name: "iOS Architect", focus: "Ekotizim va Xavfsizlik" },
  samsung: { name: "Galaxy Guide", focus: "Ekran va Innovatsiya" },
  redmi: { name: "Value Voyager", focus: "Narx va Unumdorlik" },
  macbook: { name: "Creative Captain", focus: "Grafika va Samaradorlik" },
  windows: { name: "Workstation Wizard", focus: "O'yin va Ofis" },
  tv: { name: "Media Master", focus: "Kino va Sifat" },
  accessories: { name: "Gadget Guru", focus: "Ovoz va Batareya" },
  default: { name: "Global Scout", focus: "Barcha Market" }
};

const formatPrice = (num) => num.toLocaleString('ru-RU') + " UZS";
const simulatePriceChange = (price) => {
  const change = 1 + (Math.random() * 0.02 - 0.01);
  return Math.round(price * change / 1000) * 1000;
};

const MARKET_KB = {
  iphone: [
    { name: "Apple iPhone 16 Pro Max", cap: "256GB", base: 24500000, status: "Yangi flagman" },
    { name: "Apple iPhone 16 Pro", cap: "128GB", base: 21200000, status: "Yangi flagman" },
    { name: "Apple iPhone 15 Pro Max", cap: "256GB", base: 18500000, status: "Mashhur tanlov" },
    { name: "Apple iPhone 15 Pro", cap: "128GB", base: 15800000, status: "Mashhur tanlov" },
    { name: "Apple iPhone 15", cap: "128GB", base: 12400000, status: "Standart" },
    { name: "Apple iPhone 14 Pro", cap: "128GB", base: 13500000, status: "Ishonchli" },
    { name: "Apple iPhone 13 Pro", cap: "128GB", base: 6200000, status: "Used" },
    { name: "Apple iPhone 11", cap: "64GB", base: 4200000, status: "Byudjetli" }
  ],
  samsung: [
    { name: "Samsung Galaxy S24 Ultra", cap: "12/512GB", base: 18500000, status: "Premium Android" },
    { name: "Samsung Galaxy S24+", cap: "12/256GB", base: 14500000, status: "Flagman" },
    { name: "Samsung Galaxy S24", cap: "8/256GB", base: 11200000, status: "Flagman" },
    { name: "Samsung Galaxy A55", cap: "8/256GB", base: 5100000, status: "O'rta klass" },
    { name: "Samsung Galaxy Z Fold 6", cap: "12/512GB", base: 22800000, status: "Premium Fold" }
  ],
  redmi: [
    { name: "Redmi Note 13 Pro 5G", cap: "12/512GB", base: 4850000, status: "Eng xaridorgir" },
    { name: "Redmi Note 13 Pro", cap: "8/256GB", base: 3850000, status: "Mashhur" },
    { name: "Xiaomi 14 Ultra", cap: "16/512GB", base: 16500000, status: "Xiaomi Flagman" }
  ],
  macbook: [
    { name: "Apple MacBook Air 13\" M3", cap: "8/256GB", base: 14200000, status: "Yangi Air" },
    { name: "Apple MacBook Pro 14\" M3 Pro", cap: "18/512GB", base: 28500000, status: "Professional Max" }
  ],
  windows: [
    { name: "HP Victus 15", cap: "16/512GB RTX 3050", base: 9800000, status: "Geymerlar" },
    { name: "ASUS VivoBook 15", cap: "8/512GB i5", base: 6500000, status: "O'quvchilar" },
    { name: "Lenovo Legion 5", cap: "16/512GB RTX 4060", base: 14200000, status: "Mashhur geymer" }
  ],
  tv: [
    { name: "Samsung QLED Q80C 65\"", cap: "4K Smart", base: 18500000, status: "Premium QLED" },
    { name: "Samsung Crystal UHD 55\"", cap: "4K Smart", base: 8200000, status: "Mashhur tanlov" },
    { name: "Artel Android TV 43\"", cap: "FHD Smart", base: 3450000, status: "Eng ko'p sotilgan" }
  ],
  accessories: [
    { name: "Apple AirPods Pro 2 (USB-C)", cap: "Buds", base: 2850000, status: "Premium Audio" },
    { name: "Sony WH-1000XM5", cap: "Headphones", base: 4800000, status: "ANC Professional" },
    { name: "Apple Watch Series 9 45mm", cap: "Watch", base: 5200000, status: "Yangi Watch" },
    { name: "Anker 737 (140W)", cap: "Powerbank", base: 1850000, status: "Eng kuchli" }
  ]
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get('query') || '').trim();
  const queryTokens = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

  if (queryTokens.length === 0) return NextResponse.json({ error: 'Qidiruv so\'zi kiritilmadi' }, { status: 400 });

  const selectedUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  let matches = [];

  // V7.2 PRECISION SEARCH: Strict Token Intersection
  for (const [catId, items] of Object.entries(MARKET_KB)) {
    const catKeywords = CATEGORY_MAP[catId] || [];
    
    items.forEach(item => {
      const itemName = item.name.toLowerCase();
      
      // An item matches ONLY if EVERY token in query is found in (item.name OR catKeywords)
      const allTokensMatch = queryTokens.every(token => {
        const inName = itemName.includes(token);
        const inCategory = catKeywords.some(kw => kw.includes(token));
        return inName || inCategory;
      });

      if (allTokensMatch) {
        // Calculate relevance score
        let score = 0;
        queryTokens.forEach(token => {
          if (itemName.includes(token)) score += 10; // Name match is higher priority
          if (catKeywords.some(kw => kw.includes(token))) score += 5;
        });
        matches.push({ ...item, category: catId, score });
      }
    });
  }

  // Sort by score (desc) then by base price (desc)
  matches.sort((a, b) => b.score - a.score || b.base - a.base);

  // Identify the dominant agent based on results
  let activeAgent = CATEGORY_AGENTS.default;
  if (matches.length > 0) {
    const topCategory = matches[0].category;
    activeAgent = CATEGORY_AGENTS[topCategory] || CATEGORY_AGENTS.default;
  }

  const finalResults = matches.map(m => {
    const pUz = simulatePriceChange(m.base);
    const pAs = simulatePriceChange(m.base * 1.01);
    
    const priceChange = Math.random() > 0.8 ? (Math.random() > 0.5 ? "2% pasaydi" : "1% ko'tarildi") : null;
    const agentNote = priceChange ? `${activeAgent.name}: ${priceChange}` : "Bot: Narx barqaror";

    let icon = "smartphone";
    if (m.category === 'windows' || m.category === 'macbook') icon = "laptop";
    else if (m.category === 'tv') icon = "tv";
    else if (m.category === 'accessories') {
      const n = m.name.toLowerCase();
      if (n.includes('airpods') || n.includes('buds')) icon = "buds";
      else if (n.includes('watch')) icon = "watch";
      else if (n.includes('powerbank')) icon = "powerbank";
      else icon = "headphones";
    }

    return {
      model: m.name,
      capacity: m.cap,
      asaxiyPrice: formatPrice(pAs),
      uzumPrice: formatPrice(pUz),
      winner: pUz < pAs ? 'uzum' : 'asaxiy',
      condition: m.name.includes("Used") ? "Used" : "Yangi",
      status: m.status,
      icon: icon,
      insight: agentNote,
      changeType: priceChange ? (priceChange.includes("pasaydi") ? "down" : "up") : "stable"
    };
  });

  return NextResponse.json({
    success: true,
    query: rawQuery,
    results: finalResults.slice(0, 15),
    agent: activeAgent,
    features: [
      { feature: "Yetkazib berish", asaxiy: "Tezkor", uzum: "1 kun" },
      { feature: "Agent Fokus", asaxiy: activeAgent.focus, uzum: "Optimal" },
      { feature: "Filtratsiya", asaxiy: "Precision Active 🎯", uzum: "Strict ✅" }
    ],
    metadata: {
      ua: selectedUA,
      node: `Tashkent-Node-PR-${Math.floor(Math.random() * 99) + 1}`,
      agent: activeAgent.name
    }
  });
}
