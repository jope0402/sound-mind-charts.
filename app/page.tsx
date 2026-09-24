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

type ArtistRow = {
  rank:number;
  artist_name:string;
  spotify_artist_id:string | null;
  artwork_url:string | null;
  metric_value:number;
  monitored_tracks:number;
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

async function getArtists(category:string, period:string, limit=15):Promise<ArtistRow[]> {
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_pilot_artists", {
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
  if (!res.ok) throw new Error("Unable to load artists");
  return res.json();
}

function fmt(n:number){ return new Intl.NumberFormat("en-US").format(Number(n||0)); }

export default function Home(){
  const [category,setCategory] = useState("global");
  const [period,setPeriod] = useState("daily");
  const [rows,setRows] = useState<Row[]>([]);
  const [artists,setArtists] = useState<ArtistRow[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(()=>{
    let active=true;
    async function run(){
      setLoading(true); setError("");
      try{
        const [current,currentArtists] = await Promise.all([
          getChart(category,period,28),
          getArtists(category,period,15)
        ]);
        if(!active) return;
        setRows(current);
        setArtists(currentArtists);
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
          </main>

          <aside className="side">
            <div className="banner">
              <h2>Better sound.<br/>A brighter tomorrow.</h2>
              <p>Music · Science · People · Planet</p>
            </div>

            <div className="panel">
              <h3>Top Artists</h3>
              <p className="artist-caption">{category==="global" ? "Across all monitored tracks" : "Within the selected category"} · {period==="daily" ? "Daily" : period==="7d" ? "7 Days" : "30 Days"}</p>
              {artists.map((a)=>(
                <div className="artist-row" key={a.artist_name}>
                  <b>{a.rank}</b>
                  <div className="artist-img">{a.artwork_url && <img src={a.artwork_url} alt="" />}</div>
                  <div>
                    {a.spotify_artist_id ? (
                      <a className="artist-name" href={"https://open.spotify.com/artist/"+a.spotify_artist_id} target="_blank" rel="noopener noreferrer">{a.artist_name}</a>
                    ) : (
                      <strong>{a.artist_name}</strong>
                    )}
                    <span>{fmt(a.metric_value)} streams · {a.monitored_tracks} monitored tracks</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <h3>Method</h3>
              <p className="method">Search broadly → measure candidates → quality-check obvious mismatches/anomalies → rank strictly by Spotify streams. No category quotas decide Global Top.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
