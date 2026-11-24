// Service worker de Soins critiques Trousseau.
// VERSION est mise à jour automatiquement par outils/maj_protocoles.py.
// Les protocoles sont chiffrés : le cache ne contient que des fichiers illisibles sans le mot de passe.
const VERSION = "sct-shell-2026-11-24-1224";
const PDF_CACHE = "sct-pdf";
const FILES = [
  "./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png",
  "./vendor/pdfjs/pdf.min.mjs", "./vendor/pdfjs/pdf.worker.min.mjs",
  "./protocoles/donnees.enc.json", "./scores.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // Ne supprime que les anciens caches de CETTE application (les autres applis du même site ont les leurs)
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("sct-shell-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Réseau d'abord (pour récupérer les mises à jour mensuelles), cache si hors ligne.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL("./", location.href).pathname)) return;
  if (url.pathname.includes("/protocoles/pdf/")) {
    // PDF : stockés dans leur propre cache par l'application (ouverture ou « Tout télécharger »)
    e.respondWith(fetch(req).catch(() => caches.open(PDF_CACHE).then(c => c.match(req, {ignoreSearch: true}))));
    return;
  }
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, {ignoreSearch: true}))
  );
});
