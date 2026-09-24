"use client";

import { useEffect, useState } from "react";

const SUPABASE_URL = "https://lqgetuphktyczzjcdgep.supabase.co";
const SUPABASE_KEY = "sb_publishable_kTloHtBbreb2TC12XVMMkw_B_wyeyIa";

const CHARTS = [
  ["global","Global Top"],
  ["sleep","Sleep"],
  ["binaural","Binaural"],
  ["focus","Focus"],
  ["meditation","Meditation"],
  ["relaxation","Relaxation"],
  ["noise","Noise"],
  ["nature","Nature"],
  ["frequencies","Frequencies"],
] as const;

const PERIODS = [
  ["daily","Daily"],
  ["7d","7 Days"],
  ["30d","30 Days"],
] as const;

type Row = {
  rank:number;
  title:string;
  artist_name:string;
  spotify_track_id:string;
  artwork_url:string | null;
  categories:string[];
  metric_value:number;
  latest_count:number;
  latest_at:string;
};

type ArtistIntel = {
  reach_rank:number;
  artist_name:string;
  spotify_artist_id:string | null;
  image_url:string | null;
  monthly_listeners:number | null;
  monthly_listeners_as_of:string | null;
  main_catalog_count:number | null;
  measured_catalog_tracks:number;
  catalog_coverage_pct:number | null;
  measured_streams_1d:number;
  measured_streams_7d:number;
  measured_streams_30d:number;
  status:string;
};

async function getChart(category:string, period:string, limit=28):Promise<Row[]> {
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_pilot_chart", {
    method:"POST",
    headers:{
      apikey:SUPABASE_KEY,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      p_category:category,
      p_period:period,
      p_limit:limit
    }),
    cache:"no-store"
  });
  if (!res.ok) throw new Error("Unable to load chart");
  return res.json();
}

async function getArtistIntel(limit=20):Promise<ArtistIntel[]> {
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_artist_intelligence", {
    method:"POST",
    headers:{
      apikey:SUPABASE_KEY,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({ p_limit:limit }),
    cache:"no-store"
  });
  if (!res.ok) throw new Error("Unable to load artist intelligence");
  return res.json();
}

function fmt(n:number){ return new Intl.NumberFormat("en-US").format(Number(n||0)); }

function artistStreams(a:ArtistIntel, period:string){
  if(period==="7d") return Number(a.measured_streams_7d||0);
  if(period==="30d") return Number(a.measured_streams_30d||0);
  return Number(a.measured_streams_1d||0);
}

export default function Home(){
  const [category,setCategory] = useState("global");
  const [period,setPeriod] = useState("daily");
  const [rows,setRows] = useState<Row[]>([]);
  const [artistIntel,setArtistIntel] = useState<ArtistIntel[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(()=>{
    let active=true;
    async function run(){
      setLoading(true); setError("");
      try{
        const [current,intel] = await Promise.all([
          getChart(category,period,28),
          getArtistIntel(20)
        ]);
        if(!active) return;
        setRows(current);
        setArtistIntel(intel);
      }catch(e){
        if(!active) return;
        setError(e instanceof Error ? e.message : "Unable to load chart");
      }finally{
        if(active) setLoading(false);
      }
    }
    run();
    return ()=>{active=false};
  },[category,period]);

  const metricTitle = period==="daily" ? "Daily streams" : period==="7d" ? "7-day streams" : "30-day streams";
  const artistStreamLeaders = [...artistIntel].sort((a,b)=>artistStreams(b,period)-artistStreams(a,period));
  const lastDate = rows[0]?.latest_at ? new Date(rows[0].latest_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>Private edition</span>
          <span>7-day pilot · live tracked Spotify data</span>
          <span>Future: Binaural News / Charts</span>
        </div>
      </div>

      <header>
        <div className="wrap">
          <div className="mast">
            <div className="brand">
              <div className="logo">◐</div>
              <div>
                <div className="brand-name">SOUND &amp; MIND CHARTS</div>
                <div className="brand-sub">The charts for sleep, focus, relaxation and sound.</div>
              </div>
            </div>
          </div>
          <nav className="nav">
            <span className="active">Charts</span><span>Research</span><span>Sleep</span><span>Focus</span>
            <span>Relaxation</span><span>Binaural</span><span>Noise</span><span>Nature</span>
          </nav>
        </div>
      </header>

      <div className="page">
        <div className="wrap layout">
          <main>
            <section className="hero">
              <div>
                <div className="kicker">Private chart pilot</div>
                <h1>Music for a brighter you</h1>
                <p className="lead">A live ranking of the most-streamed sounds currently monitored across sleep, focus, relaxation, binaural, noise, nature and frequency-based audio.</p>
              </div>
              <div className="meta">
                <strong>331+ measured tracks</strong><br/>
                30-day historical baseline<br/>
                <span>{error ? "Feed unavailable" : "Live feed connected"}</span><br/>
                Last data: <strong>{lastDate}</strong>
              </div>
            </section>

            <div className="tabs">
              {CHARTS.map(([slug,label])=>(
                <button key={slug} className={"tab "+(category===slug?"active":"")} onClick={()=>setCategory(slug)}>{label}</button>
              ))}
            </div>

            <div className="filters">
              <div className="periods">
                {PERIODS.map(([slug,label])=>(
                  <button key={slug} className={"period "+(period===slug?"active":"")} onClick={()=>setPeriod(slug)}>{label}</button>
                ))}
              </div>
              <div className="platform">● Spotify · tracked data</div>
            </div>

            <div className="tablebox">
              <table>
                <thead>
                  <tr><th>#</th><th>Track / Artist</th><th>Category</th><th>{metricTitle}</th><th>Listen</th></tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={5} className="loading">Loading chart…</td></tr>}
                  {!loading && error && <tr><td colSpan={5} className="loading">{error}</td></tr>}
                  {!loading && !error && rows.map(r=>(
                    <tr key={r.spotify_track_id}>
                      <td className="rank">{r.rank}</td>
                      <td>
                        <div className="track">
                          <a className="cover" href={"https://open.spotify.com/track/"+r.spotify_track_id} target="_blank" rel="noopener noreferrer">
                            {r.artwork_url && <img src={r.artwork_url} alt="" />}
                          </a>
                          <div>
                            <a className="track-title" href={"https://open.spotify.com/track/"+r.spotify_track_id} target="_blank" rel="noopener noreferrer">{r.title}</a>
                            <span>{r.artist_name}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="pill">{(r.categories||[]).join(" · ")}</span></td>
                      <td className="metric">{fmt(r.metric_value)}</td>
                      <td><a className="spotify-btn" href={"https://open.spotify.com/track/"+r.spotify_track_id} target="_blank" rel="noopener noreferrer">Spotify ↗</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="note"><span className="chip">Private pilot</span> Rankings use real Soundcharts Spotify stream history. The monitored universe is being expanded during this seven-day test. Obvious identifier jumps and exact duplicate recordings are filtered before ranking.</p>

            <section className="artist-intel">
              <div className="artist-intel-head">
                <div>
                  <div className="kicker">Artist intelligence</div>
                  <h2>Reach + catalog coverage</h2>
                  <p>Whole-profile Spotify reach beside the part of each catalog currently represented in our stream measurement.</p>
                </div>
              </div>
              <div className="tablebox intel-tablebox">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Artist</th><th>Monthly listeners</th><th>Main catalog</th><th>Measured</th><th>Coverage</th><th>Measured streams/day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artistStreamLeaders.slice(0,20).map((a,index)=>(
                      <tr key={a.artist_name}>
                        <td className="intel-rank">{index+1}</td>
                        <td>
                          <div className="artist-cell">
                            <div className="artist-img">{a.image_url && <img src={a.image_url} alt="" />}</div>
                            <div>
                              {a.spotify_artist_id ? (
                                <a className="artist-name intel-name" href={"https://open.spotify.com/artist/"+a.spotify_artist_id} target="_blank" rel="noopener noreferrer">{a.artist_name}</a>
                              ) : <strong>{a.artist_name}</strong>}
                              <span className={"status "+(a.status==="synced"?"ok":"partial")}>{a.status==="synced"?"catalog synced":a.status==="catalog_partial"?"catalog sampled":"awaiting catalog sync"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="metric">{a.monthly_listeners!=null ? fmt(a.monthly_listeners) : "Not synced"}</td>
                        <td>{a.main_catalog_count!=null ? fmt(a.main_catalog_count) : "—"}</td>
                        <td>{fmt(a.measured_catalog_tracks || 0)}</td>
                        <td>{a.catalog_coverage_pct!=null ? Number(a.catalog_coverage_pct).toFixed(1)+"%" : "—"}</td>
                        <td className="metric">{fmt(artistStreams(a,period))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="note">Artists are ranked here by measured Spotify streams for the selected period. Monthly listeners stay visible as context only. Catalog coverage is shown because stream totals remain incomplete until more of each artist's catalog is measured.</p>
            </section>
          </main>

          <aside className="side">
            <div className="banner">
              <h2>Better sound.<br/>A brighter tomorrow.</h2>
              <p>Music · Science · People · Planet</p>
            </div>

            <div className="panel">
              <h3>Top Artists · Streams</h3>
              <p className="artist-caption">{period==="daily" ? "Measured Spotify streams · Daily" : period==="7d" ? "Measured Spotify streams · 7 Days" : "Measured Spotify streams · 30 Days"}</p>
              {artistStreamLeaders.slice(0,10).map((a,index)=>(
                <div className="artist-row" key={a.artist_name}>
                  <b>{index+1}</b>
                  <div className="artist-img">{a.image_url && <img src={a.image_url} alt="" />}</div>
                  <div>
                    {a.spotify_artist_id ? (
                      <a className="artist-name" href={"https://open.spotify.com/artist/"+a.spotify_artist_id} target="_blank" rel="noopener noreferrer">{a.artist_name}</a>
                    ) : (
                      <strong>{a.artist_name}</strong>
                    )}
                    <span>{fmt(artistStreams(a,period))} streams · {a.catalog_coverage_pct!=null ? Number(a.catalog_coverage_pct).toFixed(1)+"% coverage" : "coverage pending"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <h3>Method</h3>
              <p className="method">Both track charts and the artist ranking are ordered by Spotify streams for the selected period. Monthly listeners are shown only as supporting context. Artist totals are coverage-aware because we have not yet measured every track in every catalog.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
