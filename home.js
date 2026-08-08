/* ============================================================
   CHÁCARA ORMELEZ — comportamento da página inicial
   ============================================================ */

/* ---------- Partículas flutuantes no hero ---------- */
(function criarParticulas(){
  const box = document.getElementById("hero-particulas");
  if(!box) return;
  const n = window.innerWidth < 700 ? 14 : 26;
  for(let i=0;i<n;i++){
    const p = document.createElement("span");
    p.className = "particula";
    p.style.left = Math.random()*100 + "%";
    p.style.top = 40 + Math.random()*55 + "%";
    p.style.animationDelay = (Math.random()*9) + "s";
    p.style.animationDuration = (7 + Math.random()*6) + "s";
    box.appendChild(p);
  }
})();

/* ---------- Paralaxe suave do fundo do hero ---------- */
const heroBg = document.getElementById("hero-bg");
if(heroBg && window.matchMedia("(pointer: fine)").matches){
  window.addEventListener("mousemove", (e)=>{
    const x = (e.clientX / window.innerWidth - .5) * 22;
    const y = (e.clientY / window.innerHeight - .5) * 22;
    heroBg.style.transform = `translate(${x}px, ${y}px) scale(1.08)`;
  });
}
window.addEventListener("scroll", ()=>{
  if(!heroBg) return;
  const y = window.scrollY * .32;
  heroBg.style.setProperty("--scrollY", y + "px");
}, { passive:true });

/* ---------- Contadores animados ---------- */
function animarContador(el){
  const alvo = parseFloat(el.dataset.contador);
  const decimais = el.dataset.contador.includes(".") ? 1 : 0;
  const dur = 1400;
  const inicio = performance.now();
  function passo(agora){
    const p = Math.min((agora - inicio) / dur, 1);
    const facil = 1 - Math.pow(1-p, 3);
    el.textContent = (alvo * facil).toFixed(decimais).replace(".", ",");
    if(p < 1) requestAnimationFrame(passo);
    else el.textContent = alvo.toString().replace(".", ",");
  }
  requestAnimationFrame(passo);
}
if("IntersectionObserver" in window){
  const ioNum = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ animarContador(entry.target); ioNum.unobserve(entry.target); }
    });
  }, { threshold:.6 });
  document.querySelectorAll("[data-contador]").forEach(el=> ioNum.observe(el));
}

/* ---------- Galeria: fotos padrão + fotos do Supabase ---------- */
const galeriaPadrao = [
  { url:"img/piscinas.jpg",            titulo:"Piscinas adulto e infantil", big:true },
  { url:"img/capela-interno.jpg",      titulo:"Capela para cultos" },
  { url:"img/refeitorio-externo.jpg",  titulo:"Refeitório" },
  { url:"img/tirolesa.jpg",            titulo:"Tirolesa de 150m" },
  { url:"img/skibunda.jpg",            titulo:"Eskibunda de 45m" },
  { url:"img/lual.jpg",                titulo:"Lual e fogueira" },
  { url:"img/dormitorios.jpg",         titulo:"Dormitórios p/ 206 pessoas" },
  { url:"img/capela-externo.jpg",      titulo:"Capela — vista externa" },
];

let galeriaAtual = [];

function renderGaleria(items){
  galeriaAtual = items;
  const grid = document.getElementById("grid-galeria");
  if(!grid) return;
  grid.innerHTML = "";
  items.forEach((item, i)=>{
    const tile = document.createElement("div");
    tile.className = "tile" + (item.big ? " big" : "") + " reveal";
    tile.innerHTML = `<img src="${item.url}" alt="${item.titulo || ''}" loading="lazy">
      <span class="lupa">⤢</span>
      <div class="cap">${item.titulo || ''}</div>`;
    tile.addEventListener("click", ()=> abrirLightbox(i));
    grid.appendChild(tile);
    tile.classList.add("on");
  });
}

async function carregarGaleria(){
  renderGaleria(galeriaPadrao);
  if(!supabaseClient) return;
  try{
    const { data, error } = await supabaseClient.from("galeria").select("*").order("ordem", { ascending:true });
    if(error) throw error;
    if(data && data.length){
      const extras = data.map((d)=>({ url:d.url, titulo:d.titulo }));
      renderGaleria([...galeriaPadrao, ...extras]);
    }
  }catch(e){
    console.warn("Galeria: usando apenas fotos padrão.", e.message);
  }
}
carregarGaleria();

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
let lightboxIndex = 0;
function abrirLightbox(i){
  lightboxIndex = i;
  lightboxImg.src = galeriaAtual[i].url;
  lightbox.classList.add("open");
  document.body.classList.add("no-scroll");
}
function fecharLightbox(){
  lightbox.classList.remove("open");
  document.body.classList.remove("no-scroll");
}
function navegarLightbox(delta){
  lightboxIndex = (lightboxIndex + delta + galeriaAtual.length) % galeriaAtual.length;
  lightboxImg.src = galeriaAtual[lightboxIndex].url;
}
document.getElementById("lightbox-close")?.addEventListener("click", fecharLightbox);
document.getElementById("lightbox-prev")?.addEventListener("click", ()=> navegarLightbox(-1));
document.getElementById("lightbox-next")?.addEventListener("click", ()=> navegarLightbox(1));
lightbox?.addEventListener("click", (e)=>{ if(e.target === lightbox) fecharLightbox(); });
document.addEventListener("keydown", (e)=>{
  if(!lightbox?.classList.contains("open")) return;
  if(e.key === "Escape") fecharLightbox();
  if(e.key === "ArrowRight") navegarLightbox(1);
  if(e.key === "ArrowLeft") navegarLightbox(-1);
});

/* ---------- Estatística ao vivo: datas livres neste ano ---------- */
async function carregarEstatisticaDatas(){
  const el = document.getElementById("stat-datas-livres");
  if(!el) return;
  if(!supabaseClient){
    el.textContent = "consulte";
    return;
  }
  try{
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const inicio = `${ano}-01-01`;
    const fim = `${ano}-12-31`;
    const { data, error } = await supabaseClient
      .from("reservas").select("data").gte("data", inicio).lte("data", fim);
    if(error) throw error;
    const totalDiasAno = ((new Date(ano,11,31) - new Date(ano,0,1)) / 86400000) + 1;
    const diasRestantesAno = Math.round((new Date(ano,11,31) - hoje) / 86400000);
    const ocupados = (data || []).length;
    const livres = Math.max(diasRestantesAno - ocupados, 0);
    el.textContent = livres;
  }catch(e){
    console.warn("Estatística: não foi possível calcular.", e.message);
    el.textContent = "consulte";
  }
}
carregarEstatisticaDatas();
