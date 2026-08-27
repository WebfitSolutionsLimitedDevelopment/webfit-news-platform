export function getPublicStoryTitle(title:string){
  if(title==='NZ Tech Expo 2026 gears up for 3,000 attendees as Australian investor join Auckland event'){
    return 'NZ Tech Expo 2026 gears up for 3,000 attendees as Australian investor joins Auckland event';
  }
  return title;
}

export function getPublicStoryTypeLabel(articleType:string,title?:string,override?:string){
  if(override)return override;

  const normalized=(articleType||'news').trim().toLowerCase();
  const publicTitle=(title||'').trim().toLowerCase();

  if(publicTitle.startsWith('opinion |')||publicTitle.startsWith('opinion:'))return 'Opinion';
  if(publicTitle.startsWith('editorial |')||publicTitle.startsWith('editorial:'))return 'Editorial';
  if(publicTitle.startsWith('analysis |')||publicTitle.startsWith('analysis:'))return 'Analysis';

  const labels:Record<string,string>={
    news:'News',
    breaking_news:'Breaking News',
    analysis:'Analysis',
    opinion:'Opinion',
    editorial:'Editorial',
    explainer:'Explainer',
    feature:'Feature',
    interview:'Interview',
    community:'Community',
    press_release:'Press Release'
  };

  return labels[normalized]||normalized.replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
}
