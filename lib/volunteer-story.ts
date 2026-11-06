export function volunteerStorySlug(title: string) {
  const base = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base.slice(0, 90).replace(/-$/, '') || 'volunteer-story'}-${crypto.randomUUID().slice(0, 8)}`;
}

export function volunteerStoryHtml(text: string) {
  return text.trim().replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]!)
    .replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(part => `<p>${part.replaceAll('\n', '<br>')}</p>`).join('');
}
