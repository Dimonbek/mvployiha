"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Smartphone, Laptop, Headphones, Tv, 
  ChevronLeft, Loader2, MoreHorizontal, Apple, 
  MonitorSmartphone, Watch, BatteryCharging, Speaker,
  Moon, Sun, TrendingUp, X, LineChart, Activity, Zap, Headset
} from "lucide-react";
import './globals.css';

const CATEGORIES = [
  { id: 'Smartfonlar', icon: <Smartphone size={32} strokeWidth={1.5} />, 
    brands: [
      { name: 'iPhone', icon: <Apple size={32} strokeWidth={1.5} /> },
      { name: 'Samsung', icon: <MonitorSmartphone size={32} strokeWidth={1.5} /> },
      { name: 'Redmi', icon: <Smartphone size={32} strokeWidth={1.5} /> },
      { name: 'Boshqa', icon: <MoreHorizontal size={32} strokeWidth={1.5} /> }
    ],
    trend: { points: "M0,180 L100,200 L200,150 L300,170 L400,100 L500,130 L600,80", area: "M0,250 L0,180 L100,200 L200,150 L300,170 L400,100 L500,130 L600,80 L600,250 Z", avg: "11.2M", diff: "-14.5% 📉" }
  },
  { id: 'Noutbuklar', icon: <Laptop size={32} strokeWidth={1.5} />, 
    brands: [
      { name: 'MacBook', icon: <Apple size={32} strokeWidth={1.5} /> },
      { name: 'Windows', icon: <Laptop size={32} strokeWidth={1.5} /> },
      { name: 'Boshqa', icon: <MoreHorizontal size={32} strokeWidth={1.5} /> }
    ],
    trend: { points: "M0,150 L100,160 L200,155 L300,165 L400,160 L500,170 L600,165", area: "M0,250 L0,150 L100,160 L200,155 L300,165 L400,160 L500,170 L600,165 L600,250 Z", avg: "18.5M", diff: "+2.1% ↔️" }
  },
  { id: 'Aksessuarlar', icon: <Headphones size={32} strokeWidth={1.5} />, 
    brands: [
      { name: 'AirPods', icon: <Headphones size={32} strokeWidth={1.5} /> },
      { name: 'Smart Soat', icon: <Watch size={32} strokeWidth={1.5} /> },
      { name: 'Power Bank', icon: <BatteryCharging size={32} strokeWidth={1.5} /> }
    ],
    trend: { points: "M0,80 L100,120 L200,90 L300,110 L400,85 L500,115 L600,95", area: "M0,250 L0,80 L100,120 L200,90 L300,110 L400,85 L500,115 L600,95 L600,250 Z", avg: "1.2M", diff: "+4.8% 📉" }
  },
  { id: 'Televizorlar', icon: <Tv size={32} strokeWidth={1.5} />, 
    brands: [
      { name: 'Samsung TV', icon: <Tv size={32} strokeWidth={1.5} /> },
      { name: 'Artel TV', icon: <MonitorSmartphone size={32} strokeWidth={1.5} /> },
      { name: 'LG TV', icon: <Speaker size={32} strokeWidth={1.5} /> }
    ],
    trend: { points: "M0,220 L100,200 L200,180 L300,160 L400,140 L500,120 L600,100", area: "M0,250 L0,220 L100,200 L200,180 L300,160 L400,140 L500,120 L600,100 L600,250 Z", avg: "8.5M", diff: "+24% 📈" }
  }
];

const GLOBAL_TREND = { 
  id: 'Bozor Trendi', 
  trend: { points: "M0,150 L100,170 L200,130 L300,160 L400,90 L500,110 L600,70", area: "M0,250 L0,150 L100,170 L200,130 L300,160 L400,90 L500,110 L600,70 L600,250 Z", avg: "12.8M", diff: "+12.4% 📈" }
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [metadata, setMetadata] = useState(null); // Advanced Architecture Info
  
  // Premium Features
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  
  // AGENT MONITORING STATE
  const [lastCheckTime, setLastCheckTime] = useState("Hozirgina");
  const [agentNotification, setAgentNotification] = useState(null);

  // Persistence for Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // AGENT SIMULATION LOOP
  useEffect(() => {
    const interval = setInterval(() => {
      const times = ["3s avval", "8s avval", "hozirgina", "10s avval", "2s avval"];
      setLastCheckTime(times[Math.floor(Math.random() * times.length)]);
      
      if (Math.random() > 0.8 && hasSearched && results.length > 0) {
        setAgentNotification(`Agent: ${results[0].model} uchun eng yaxshi narx tasdiqlandi!`);
        setTimeout(() => setAgentNotification(null), 5000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [hasSearched, results]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSearch = async (e, forcedQuery) => {
    if (e) e.preventDefault();
    const finalQuery = forcedQuery || query;
    if (finalQuery.trim().length === 0) return;
    
    setHasSearched(true);
    setLoading(true);
    setError(null);
    setResults([]);
    setFeatures([]);
    // We NO LONGER close the graph automatically here, per user request "always on"

    try {
      const res = await fetch(`/api/scrape?query=${encodeURIComponent(finalQuery)}`);
      if (!res.ok) throw new Error("Loyiha agenti bloklandi yoki xato yuz berdi");
      const data = await res.json();
      setResults(data.results);
      setFeatures(data.features || []);
      setMetadata(data.metadata || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === selectedCategory) || GLOBAL_TREND;

  return (
    <>
      <nav>
        <div style={{ flex: 1 }}>{/* Spacer for minimalism */}</div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            background: 'hsl(var(--secondary) / 0.7)', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '9999px',
            border: '1px solid hsl(var(--border))',
            fontSize: '0.75rem',
            fontWeight: 500
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: '#22c55e', 
              display: 'inline-block',
              boxShadow: '0 0 8px #22c55e',
              animation: 'pulse 2s infinite'
            }}></span>
            <span style={{ color: 'hsl(var(--foreground))' }}>Agent Monitoring...</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className={`btn ${showGraph ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem' }} onClick={() => setShowGraph(!showGraph)} title="Narxlar Trendi">
              <LineChart size={20} />
            </button>
            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={toggleTheme}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <main className={`container ${showGraph ? 'hero-split-view' : ''}`}>
        <div className="hero-main-container">
          {/* LEFT: All content except graph */}
          <div className="hero-left-content">
            <section className="header-section animate-in" style={{ paddingBottom: '2rem' }}>
              <h1 className="header-title">Nimani qidirmoqchisiz?</h1>
              <p className="header-desc">
                Marketpleyslar bo'ylab eng yaxshi narxlarni bir zumda toping va o'zaro solishtiring.
              </p>

              <form onSubmit={(e) => handleSearch(e)} className="search-container">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={20} />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Masalan: iPhone 17..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', maxWidth: '500px', padding: '0.75rem 0' }} disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader2 className="animate-spin" size={18} />
                      Qidirilmoqda...
                    </span>
                  ) : "Qidirish"}
                </button>
              </form>

              {!hasSearched && (
                <div className="animate-in" style={{ marginTop: '2.5rem', minHeight: '200px' }}>
                  {selectedCategory ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', alignSelf: 'center' }} 
                          onClick={() => { setSelectedCategory(null); }}>
                        <ChevronLeft size={18} />
                        <span style={{ fontSize: '0.875rem' }}>Boshqa toifalar</span>
                      </div>
                      <div className="icons-container" style={{ margin: '0' }}>
                        {currentCategoryObj?.brands?.map((brand, idx) => (
                          <div key={idx} className="icon-box" onClick={() => { setQuery(brand.name); handleSearch(null, brand.name); }}>
                            <div className="emoji-wrapper">{brand.icon}</div>
                            <span>{brand.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="icons-container" style={{ margin: '0' }}>
                      {CATEGORIES.map((cat, idx) => (
                        <div key={idx} className="icon-box" onClick={() => { setSelectedCategory(cat.id); }}>
                          <div className="emoji-wrapper">{cat.icon}</div>
                          <span>{cat.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Results View - NOW INSIDE THE LEFT CONTENT FOR SPLIT VIEW SUPPORT */}
            {hasSearched && (
              <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      Natijalar: "{query}"
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                        Siz uchun eng yaxshi narxlar tanlandi.
                      </p>
                      <div style={{ height: '12px', width: '1px', background: 'hsl(var(--border))' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#22c55e', fontSize: '0.7rem', fontWeight: 600 }}>
                        <Activity size={12} />
                        Agent: Faol ({lastCheckTime})
                      </div>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => { setSelectedCategory(null); setHasSearched(false); setQuery(''); }}
                    style={{ height: 'fit-content' }}
                  >
                    Orqaga
                  </button>
                </div>

                {metadata && (
                  <div style={{ 
                    display: 'flex', gap: '1rem', marginBottom: '1.5rem', 
                    fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))',
                    background: 'hsl(var(--muted)/0.2)', padding: '0.4rem 1rem',
                    borderRadius: '8px', width: 'fit-content'
                  }}>
                    <span>🖥️ Node: {metadata.node}</span>
                    <span>🌐 UA: {metadata.ua.substring(0, 30)}...</span>
                    <span>🔍 AI Normalization: Active</span>
                  </div>
                )}

                {error && (
                  <div style={{ padding: '1rem', border: '1px solid hsl(var(--destructive))', borderRadius: 'var(--radius)', color: 'hsl(var(--destructive))', textAlign: 'center', marginBottom: '2rem' }}>
                    Xatolik yuz berdi: {error}
                  </div>
                )}

                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: 'hsl(var(--muted-foreground))' }}>
                      <Loader2 className="animate-spin" size={40} style={{ marginBottom: '1rem' }} />
                      <p>Ma'lumotlar kelmoqda...</p>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                  <>
                    <section className="bento-grid" style={{ marginBottom: '3rem' }}>
                      {results.map((device, idx) => (
                        <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                          {device.status && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, zIndex: 10 }}>
                              {device.status}
                            </div>
                          )}
                          <div className="card-header">
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                              {(() => {
                                switch(device.icon) {
                                  case 'laptop': return <Laptop size={40} strokeWidth={1.5} />;
                                  case 'tv': return <Tv size={40} strokeWidth={1.5} />;
                                  case 'headphones': return <Headphones size={40} strokeWidth={1.5} />;
                                  case 'buds': return <Headset size={40} strokeWidth={1.5} />;
                                  case 'watch': return <Watch size={40} strokeWidth={1.5} />;
                                  case 'powerbank': return <Zap size={40} strokeWidth={1.5} color="#f59e0b" />;
                                  default: return <Smartphone size={40} strokeWidth={1.5} />;
                                }
                              })()}
                            </div>
                            <h3 className="card-title">{device.model}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted)/0.3)', padding: '1px 6px', borderRadius: '4px' }}>{device.capacity}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: device.condition?.includes('Yangi') ? '#22c55e' : '#f59e0b', background: 'hsl(var(--muted)/0.3)', padding: '1px 6px', borderRadius: '4px' }}>{device.condition || 'Yangi'}</span>
                            </div>
                          </div>
                          <div className="card-content">
                            <div className={`price-item ${device.winner === 'asaxiy' ? 'winner' : ''}`}>
                              <span className="store-name">Asaxiy</span>
                              <span className="price-val">{device.asaxiyPrice}</span>
                            </div>
                            <div className={`price-item ${device.winner === 'uzum' ? 'winner' : ''}`}>
                              <span className="store-name">Uzum</span>
                              <span className="price-val">{device.uzumPrice}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </section>

                    {features.length > 0 && (
                      <section className="animate-in" style={{ animationDelay: '0.2s' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity size={20} />
                          Xizmatlar Solishtiruvi
                        </h3>
                        <div className="comparison-table-wrapper" style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                              <tr style={{ background: 'hsl(var(--muted)/0.5)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>Xususiyat</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>Asaxiy</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>Uzum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {features.map((f, idx) => (
                                <tr key={idx} style={{ borderBottom: idx === features.length - 1 ? 'none' : '1px solid hsl(var(--border))' }}>
                                  <td style={{ padding: '1rem', fontWeight: 600 }}>{f.feature}</td>
                                  <td style={{ padding: '1rem' }}>{f.asaxiy}</td>
                                  <td style={{ padding: '1rem' }}>{f.uzum}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Side Graph (Always rendering its container for transition) */}
          <div className="side-graph-container">
            <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '2rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedCategory ? selectedCategory : "Bozor"} Trendi</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>
                     <Activity size={12} className="animate-pulse" />
                     Monitoring: Faol ({lastCheckTime})
                  </div>
                </div>
                <button className="btn btn-outline" style={{ padding: '0.3rem' }} onClick={() => setShowGraph(false)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '0.5rem', background: 'hsl(var(--muted)/0.2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <svg width="100%" height="180" viewBox="0 0 600 250" preserveAspectRatio="none">
                  {[0, 1, 2, 3, 4].map(v => (
                    <line key={v} x1="0" y1={v * 50} x2="600" y2={v * 50} stroke="hsl(var(--border))" strokeWidth="0.5" />
                  ))}
                  <path 
                    d={currentCategoryObj.trend.area}
                    fill="hsl(var(--primary) / 0.05)"
                  />
                  <path 
                    className="graph-path"
                    d={currentCategoryObj.trend.points}
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="3" 
                  />
                </svg>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                 <div style={{ flex: 1, padding: '0.75rem', background: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>O'rtacha Narx</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>{currentCategoryObj.trend.avg}</p>
                </div>
                <div style={{ flex: 1, padding: '0.75rem', background: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>Holat</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: currentCategoryObj.trend.diff.includes('-') ? '#22c55e' : '#ef4444' }}>{currentCategoryObj.trend.diff}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {agentNotification && (
        <div className="animate-in" style={{ 
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', 
          padding: '1rem 1.5rem', borderRadius: 'var(--radius)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 600
        }}>
          <Activity size={18} className="animate-pulse" />
          {agentNotification}
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </>
  );
}
