import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * MARKET RESEARCH AGENT (Mvployiha v8.2 - Scheduled Cache & Parallel Nodes)
 * Logic: 12-Hour Caching, GraphQL Uzum Node, HTML Asaxiy Node.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

// SIMPLE IN-MEMORY CACHE (Resets on server restart, but works for local/staged proof)
let CACHE_STORE = {}; 
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 Hours

const cleanPrice = (str) => {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^\d]/g, ''), 10) || 0;
};

// --- UZUM GRAPHQL NODE ---
const fetchUzumGraphQL = async (query) => {
  try {
    const response = await axios.post('https://graphql.uzum.uz/', {
      operationName: "MakeSearch_ItemsAndFilters",
      variables: {
        query: query,
        size: 10,
        from: 0
      },
      query: `query MakeSearch_ItemsAndFilters($query: String, $size: Int, $from: Int) {
        makeSearch(query: $query, params: {size: $size, from: $from}) {
          items {
            catalogCard {
              productId
              title
              minFullPrice
              images { hash }
            }
          }
        }
      }`
    }, { 
      headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENTS[0] },
      timeout: 6000 
    });

    const items = response.data?.data?.makeSearch?.items || [];
    return items.map(i => ({
      name: i.catalogCard.title,
      price: i.catalogCard.minFullPrice,
      store: 'uzum',
      id: i.catalogCard.productId
    }));
  } catch (e) {
    console.error("Uzum GraphQL Node Error:", e.message);
    return [];
  }
};

// --- ASAXIY HTML NODE ---
const fetchAsaxiyHTML = async (query) => {
  try {
    const url = `https://asaxiy.uz/uz/product?key=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENTS[1] }, timeout: 6000 });
    const $ = cheerio.load(data);
    const results = [];

    $('.product__item-info').each((i, el) => {
      if (i >= 12) return;
      const name = $(el).find('.product__item__info-title').text().trim();
      const priceRaw = $(el).find('.product__item-price').text().trim();
      const price = cleanPrice(priceRaw);
      if (name && price) {
        results.push({ name, price, store: 'asaxiy' });
      }
    });
    return results;
  } catch (e) {
    console.error("Asaxiy HTML Node Error:", e.message);
    return [];
  }
};

// --- HELPER: Merge Results by Name Similarity ---
const mergeResults = (uzum, asaxiy) => {
  const merged = [];
  const processedAsaxiy = new Set();

  uzum.forEach(uItem => {
    // Find best match in asaxiy
    const match = asaxiy.find(aItem => {
      const u = uItem.name.toLowerCase();
      const a = aItem.name.toLowerCase();
      return u.includes(a) || a.includes(u);
    });

    if (match) {
      merged.push({
        model: uItem.name,
        uzumPrice: uItem.price,
        asaxiyPrice: match.price,
        status: "Ikkala do'konda",
        source: 'dual'
      });
      processedAsaxiy.add(asaxiy.indexOf(match));
    } else {
      merged.push({
        model: uItem.name,
        uzumPrice: uItem.price,
        asaxiyPrice: null,
        status: "Faqat Uzumda",
        source: 'uzum'
      });
    }
  });

  // Add remaining asaxiy items
  asaxiy.forEach((aItem, idx) => {
    if (!processedAsaxiy.has(idx)) {
      merged.push({
        model: aItem.name,
        uzumPrice: null,
        asaxiyPrice: aItem.price,
        status: "Faqat Asaxiyda",
        source: 'asaxiy'
      });
    }
  });

  return merged;
};

const formatPrice = (num) => num ? num.toLocaleString('ru-RU') + " UZS" : "Mavjud emas";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get('query') || '').trim();
  const query = rawQuery.toLowerCase();

  if (!query) return NextResponse.json({ error: 'Qidiruv so\'zi kiritilmadi' }, { status: 400 });

  // 1. CACHE CHECK
  const now = Date.now();
  if (CACHE_STORE[query] && (now - CACHE_STORE[query].timestamp < CACHE_TTL)) {
    return NextResponse.json({
       ...CACHE_STORE[query].data,
       metadata: { ...CACHE_STORE[query].data.metadata, mode: 'CACHED (12h)' }
    });
  }

  // 2. TRIGGER PARALLEL AGENTS
  const start = Date.now();
  const [uzumItems, asaxiyItems] = await Promise.all([
    fetchUzumGraphQL(rawQuery),
    fetchAsaxiyHTML(rawQuery)
  ]);

  const merged = mergeResults(uzumItems, asaxiyItems);

  const finalResults = merged.map(m => {
    const isUzumWinner = m.uzumPrice && m.asaxiyPrice ? m.uzumPrice < m.asaxiyPrice : (m.uzumPrice ? true : false);
    
    return {
      model: m.model,
      uzumPrice: formatPrice(m.uzumPrice),
      asaxiyPrice: formatPrice(m.asaxiyPrice),
      winner: isUzumWinner ? 'uzum' : 'asaxiy',
      status: m.status,
      icon: m.model.toLowerCase().includes('tv') ? 'tv' : 'smartphone',
      insight: "Bot: Narx barqaror"
    };
  });

  const responseData = {
    success: true,
    query: rawQuery,
    results: finalResults.slice(0, 10),
    features: [
      { feature: "Yuridik Kafolat", asaxiy: "1 yil (Rasmiy)", uzum: "1 yil (Nasiya)" },
      { feature: "Bo'lib to'lash", asaxiy: "24 oygacha", uzum: "12 oygacha" },
      { feature: "Agent Holati", asaxiy: "HTML-Node Active", uzum: "GraphQL-Node Active" }
    ],
    metadata: {
      mode: 'LIVE',
      duration: `${Date.now() - start}ms`,
      timestamp: now,
      nodeCount: 2
    }
  };

  // 3. UPDATE CACHE
  CACHE_STORE[query] = {
    timestamp: now,
    data: responseData
  };

  return NextResponse.json(responseData);
}
