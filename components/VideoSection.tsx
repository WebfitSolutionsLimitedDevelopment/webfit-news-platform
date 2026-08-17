import type { VideoStory } from '@/lib/news';

export function VideoSection({videos}:{videos:VideoStory[]}){
  if(!videos.length)return null;
  const feature=videos[0];
  const rest=videos.slice(1);
  const featureEmbed=feature.youtube_id?`https://www.youtube-nocookie.com/embed/${feature.youtube_id}`:null;
  return <section className="premium-section video-section">
    <div className="section-heading-premium"><div><span>Watch</span><h2>Webfit News Video</h2></div><a href="https://www.youtube.com/@webfitnews" target="_blank" rel="noopener noreferrer">YouTube channel</a></div>
    <div className="video-feature-layout">
      <article className="video-feature-card">
        <div className="video-player-wrap">{featureEmbed?<iframe src={featureEmbed} title={feature.display_title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<a href={feature.video_url} target="_blank" rel="noopener noreferrer">Watch video</a>}</div>
        <div className="video-copy"><span>Featured video</span><h3>{feature.display_title}</h3></div>
      </article>
      <div className="video-grid">{rest.map(v=><a className="video-card" key={v.id} href={v.video_url} target="_blank" rel="noopener noreferrer">
        <div className="video-thumb">{v.youtube_id?<img src={`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt=""/>:null}<span className="video-play">▶</span></div>
        <h3>{v.display_title}</h3>
      </a>)}</div>
    </div>
  </section>;
}
