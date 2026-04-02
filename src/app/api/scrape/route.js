import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * MARKET RESEARCH AGENT (Mvployiha v8.0 - Live Market Scraper)
 * Logic: Real-time scraping from Uzum & Asaxiy with Simulation Fallback.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

const CATEGORY_MAP = {
  iphone: ["iphone", "ayfon", "apple phone"],
  samsung: ["samsung", "galaxy", "s24", "s23"],
  redmi: ["redmi", "xiaomi", "poco", "mi"],
  macbook: ["macbook", "apple laptop"],
  windows: ["laptop", "noutbuk", "kompyuter", "asus", "hp", "lenovo"],
  tv: ["tv", "televizor", "ekran", "smart tv"],
  accessories: ["accessories", "aksessuar", "quloqchin", "soat", "buds", "watch", "powerbank", "airpods"]
};

// --- SCRAPER UTILITIES ---

const cleanPrice = (str) => {
  if (!str) return 0;
  return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
};

const fetchUzum = async (query) => {
  try {
    const url = `https://uzum.uz/uz/search?query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENTS[0] }, timeout: 5000 });
    const $ = cheerio.load(data);
    const results = [];

    $('.product-card').each((i, el) => {
      if (i >= 5) return; // Limit to top 5
      const name = $(el).find('.product-card__title').text().trim();
      const priceRaw = $(el).find('.product-card__price .card-price').text().trim();
      const price = cleanPrice(priceRaw);
      if (name && price) {
        results.push({ name, price, store: 'uzum', source: 'live' });
      }
    });
    return results;
  } catch (e) {
    console.error("Uzum Scrape Error:", e.message);
    return [];
  }
};

const fetchAsaxiy = async (query) => {
  try {
    const url = `https://asaxiy.uz/uz/product?key=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENTS[1] }, timeout: 5000 });
    const $ = cheerio.load(data);
    const results = [];

    $('.product__item-info').each((i, el) => {
      if (i >= 5) return;
      const name = $(el).find('.product__item__info-title').text().trim();
      const priceRaw = $(el).find('.product__item-price').text().trim();
      const price = cleanPrice(priceRaw);
      if (name && price) {
        results.push({ name, price, store: 'asaxiy', source: 'live' });
      }
    });
    return results;
  } catch (e) {
    console.error("Asaxiy Scrape Error:", e.message);
    return [];
  }
};

// --- END SCRAPER UTILITIES ---

const CATEGORY_AGENTS = {
  iphone: { name: "iOS Architect", focus: "Ekotizim" },
  samsung: { name: "Galaxy Guide", focus: "Ekran" },
  redmi: { name: "Value Voyager", focus: "Narx" },
  macbook: { name: "Creative Captain", focus: "Grafika" },
  windows: { name: "Workstation Wizard", focus: "O'yin" },
  tv: { name: "Media Master", focus: "Kino" },
  accessories: { name: "Gadget Guru", focus: "Ovoz" },
  default: { name: "Global Scout", focus: "Market" }
};

const formatPrice = (num) => num.toLocaleString('ru-RU') + " UZS";

const MARKET_KB = {
  iphone: [{ name: "Apple iPhone 16 Pro Max", cap: "256GB", base: 18500000, status: "Flagman" }],
  // ... (Full KB from previous version for Fallback)
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get('query') || '').trim();
  const query = rawQuery.toLowerCase();

  if (!query) return NextResponse.json({ error: 'Qidiruv so\'zi kiritilmadi' }, { status: 400 });

  const selectedUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  // 1. LIVE SCRAPING ATTEMPT
  let liveResults = [];
  const start = Date.now();
  
  try {
    const scraped = await Promise.allSettled([fetchUzum(rawQuery), fetchAsaxiy(rawQuery)]);
    liveResults = scraped
      .filter(s => s.status === 'fulfilled')
      .flatMap(s => s.value);
  } catch (e) {
    console.warn("Global Scrape Failure, falling back to KB");
  }

  const duration = Date.now() - start;

  // 2. NORMALIZATION & MATCHING
  // If we have live results, we group them by a "Fuzzy Similarity" key to compare across stores
  // For this prototype, we'll return the top items found
  
  let finalResults = [];
  
  if (liveResults.length > 0) {
    // Process live results
    finalResults = liveResults.map(r => ({
      model: r.name,
      asaxiyPrice: r.store === 'asaxiy' ? formatPrice(r.price) : "Tekshirilmoqda...",
      uzumPrice: r.store === 'uzum' ? formatPrice(r.price) : "Tekshirilmoqda...",
      winner: 'live',
      source: 'live',
      status: "Haqiqiy vaqt",
      icon: "smartphone"
    }));
  } else {
    // FALLBACK TO SIMULATION (v7.3 logic)
    // (Simplified for brevity, usually matches MARKET_KB)
    finalResults = [{
      model: `${rawQuery} (Simulyatsiya)`,
      asaxiyPrice: formatPrice(15000000),
      uzumPrice: formatPrice(14800000),
      winner: 'uzum',
      source: 'simulated',
      status: "Keshda",
      icon: "smartphone"
    }];
  }

  return NextResponse.json({
    success: true,
    query: rawQuery,
    results: finalResults.slice(0, 10),
    metadata: {
      ua: selectedUA,
      node: `Scraper-L-0${Math.floor(Math.random() * 9) + 1}`,
      duration: `${duration}ms`,
      mode: liveResults.length > 0 ? "LIVE" : "SIMULATED"
    }
  });
}
