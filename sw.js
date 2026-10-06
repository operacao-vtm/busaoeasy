/* BusaoEasy · VTM Mídia — guarda o sistema no celular.
   ---------------------------------------------------------------
   Fica no GitHub, na MESMA PASTA do BusaoEasy (index.html).
   Depois da primeira vez que o sistema abre com internet, o celular
   guarda uma cópia dele. Sem sinal, abre essa cópia, e o técnico
   continua registrando: o que ele salva fica no aparelho e sobe
   sozinho quando a internet voltar.
   Com internet, sempre busca a versão nova do GitHub primeiro —
   publicar um build novo continua funcionando como antes.
   Só cuida da página do sistema. A base (Google) e o resto passam
   direto, sem cópia.
   --------------------------------------------------------------- */
const COPIA = "busaoeasy-pagina";
const ESPERA_MS = 6000;   // sinal fraco: depois disso abre a cópia guardada

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", ev => ev.waitUntil(self.clients.claim()));

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if(req.method !== "GET" || req.mode !== "navigate") return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  ev.respondWith(abrirPagina(ev, url));
});

/* A chave da cópia é o endereço sem # e sem ?, para o link da diretoria
   (#painel) e o link normal usarem a mesma cópia. */
function chave(url){ return url.origin + url.pathname; }

async function abrirPagina(ev, url){
  const cache = await caches.open(COPIA);
  const guardada = await cache.match(chave(url));

  /* no-cache: pergunta ao GitHub se há versão nova (se não houver, a
     resposta é curtinha). Assim um build publicado chega na hora. */
  const daRede = fetch(url.origin + url.pathname, {cache:"no-cache", credentials:"same-origin"}).then(resp => {
    if(resp && resp.ok) return cache.put(chave(url), resp.clone()).then(() => resp);
    return resp;
  });
  // a cópia continua sendo atualizada mesmo se a página já abriu da cópia
  ev.waitUntil(daRede.catch(() => {}));

  if(!guardada) return daRede;              // primeira vez: precisa da rede

  try{
    return await Promise.race([
      daRede,
      new Promise((_, nao) => setTimeout(() => nao(new Error("lento")), ESPERA_MS))
    ]);
  }catch(e){
    return guardada;                        // sem sinal ou sinal fraco
  }
}
