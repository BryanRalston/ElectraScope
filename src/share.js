export function encodeProject(project) {
  const clean = JSON.parse(JSON.stringify(project));
  (clean.rooms || []).forEach(r => {
    delete r.photo;
  });
  const json = JSON.stringify(clean);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeProject(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function makeShareUrl(project) {
  return window.location.origin + window.location.pathname + '#share/' + encodeProject(project);
}

export function getSharedProject() {
  const hash = window.location.hash;
  if (!hash.startsWith('#share/')) return null;
  return decodeProject(hash.slice(7));
}
