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

/* ---------- Galeria: fotos padrão (com categoria) + fotos do Supabase ---------- */
const CATEGORIAS_LABEL = {
  piscina:"🏊 Piscina", capela:"⛪ Capela", refeitorio:"🍽️ Refeitório", tirolesa:"🌲 Tirolesa",
  skibunda:"💦 Eskibunda", lual:"🔥 Lual", dormitorios:"🛏️ Dormitórios",
};

const galeriaPadrao = [
  { url:"img/piscinas.jpg",            titulo:"Piscinas adulto e infantil", categoria:"piscina", big:true },
  { url:"img/capela-interno.jpg",      titulo:"Capela para cultos", categoria:"capela" },
  { url:"img/refeitorio-externo.jpg",  titulo:"Refeitório", categoria:"refeitorio" },
  { url:"img/tirolesa.jpg",            titulo:"Tirolesa de 150m", categoria:"tirolesa" },
  { url:"img/skibunda.jpg",            titulo:"Eskibunda de 45m", categoria:"skibunda" },
  { url:"img/lual.jpg",                titulo:"Lual e fogueira", categoria:"lual" },
  { url:"img/dormitorios.jpg",         titulo:"Dormitórios p/ 206 pessoas", categoria:"dormitorios" },
  { url:"img/capela-externo.jpg",      titulo:"Capela — vista externa", categoria:"capela" },
];

let galeriaCompleta = [];
let galeriaAtual = [];
let filtroAtivo = "todas";

function renderChips(){
  const box = document.getElementById("filtro-chips");
  if(!box) return;
  const categorias = ["todas", ...new Set(galeriaCompleta.map(i=> i.categoria).filter(Boolean))];
  box.innerHTML = "";
  categorias.forEach(cat=>{
    const chip = document.createElement("button");
    chip.className = "filtro-chip" + (cat === filtroAtivo ? " ativo" : "");
    chip.textContent = cat === "todas" ? "Todas" : (CATEGORIAS_LABEL[cat] || cat);
    chip.dataset.cat = cat;
    chip.addEventListener("click", ()=> aplicarFiltro(cat));
    box.appendChild(chip);
  });
}

function aplicarFiltro(cat){
  filtroAtivo = cat;
  renderChips();
  const filtradas = cat === "todas" ? galeriaCompleta : galeriaCompleta.filter(i=> i.categoria === cat);
  renderGaleria(filtradas);
}

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
  galeriaCompleta = galeriaPadrao;
  renderChips();
  renderGaleria(galeriaCompleta);
  if(!supabaseClient) return;
  try{
    const { data, error } = await supabaseClient.from("galeria").select("*").order("ordem", { ascending:true });
    if(error) throw error;
    if(data && data.length){
      const extras = data.map((d)=>({ url:d.url, titulo:d.titulo, categoria:d.categoria || null }));
      galeriaCompleta = [...galeriaPadrao, ...extras];
      renderChips();
      renderGaleria(galeriaCompleta);
    }
  }catch(e){
    console.warn("Galeria: usando apenas fotos padrão.", e.message);
  }
}
carregarGaleria();

/* ---------- Clicar num item da Estrutura filtra a galeria pela categoria ---------- */
document.querySelectorAll(".amenity[data-categoria]").forEach(el=>{
  el.style.cursor = "pointer";
  el.addEventListener("click", ()=>{
    const cat = el.dataset.categoria;
    document.getElementById("galeria")?.scrollIntoView({ behavior:"smooth", block:"start" });
    setTimeout(()=> aplicarFiltro(cat), 350);
  });
});

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

/* ---------- Mini-chat do WhatsApp: assunto → detalhe → redireciona ---------- */
const waBody = document.getElementById("wa-card-body");

function formatarDataBR(iso){
  if(!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const PASSOS_WA = {
  inicio: ()=> `
    <div class="wa-msg">Como podemos te ajudar hoje?</div>
    <button class="wa-quick" data-passo="consulta">📅 Consultar uma data</button>
    <button class="wa-quick" data-passo="valores">💰 Valores e o que está incluso</button>
    <button class="wa-quick" data-passo="duvida">💬 Outra dúvida</button>
  `,
  consulta: ()=> `
    <div class="wa-msg">Você tem uma data em mente? (se não tiver, pode deixar em branco)</div>
    <input type="date" id="wa-input-data" class="wa-input">
    <button class="wa-quick wa-quick-primaria" data-enviar="consulta">Enviar no WhatsApp →</button>
    <button class="wa-voltar" data-passo="inicio">← Voltar</button>
  `,
  valores: ()=> `
    <div class="wa-msg">O valor varia com número de pessoas, dias e o que for usar da estrutura (piscina, tirolesa, refeitório etc). Bora conversar pra te passar certinho?</div>
    <button class="wa-quick wa-quick-primaria" data-enviar="valores">Continuar no WhatsApp →</button>
    <button class="wa-voltar" data-passo="inicio">← Voltar</button>
  `,
  duvida: ()=> `
    <div class="wa-msg">Pode escrever sua dúvida aqui, ela já vai preenchida pro WhatsApp:</div>
    <textarea id="wa-input-duvida" class="wa-input" rows="3" placeholder="Ex: vocês alugam para eventos não religiosos?"></textarea>
    <button class="wa-quick wa-quick-primaria" data-enviar="duvida">Enviar no WhatsApp →</button>
    <button class="wa-voltar" data-passo="inicio">← Voltar</button>
  `,
};

window.mostrarPassoWa = function(passo){
  if(!waBody || !PASSOS_WA[passo]) return;
  waBody.innerHTML = PASSOS_WA[passo]();
};

waBody?.addEventListener("click", (e)=>{
  const irPara = e.target.closest("[data-passo]");
  if(irPara){ window.mostrarPassoWa(irPara.dataset.passo); return; }

  const enviar = e.target.closest("[data-enviar]");
  if(enviar){
    let msg = "Olá! 🐴 Vim pelo site da Chácara Ormelez";
    const tipo = enviar.dataset.enviar;
    if(tipo === "consulta"){
      const data = document.getElementById("wa-input-data")?.value;
      msg = data
        ? `Olá! 🐴 Gostaria de saber se o dia ${formatarDataBR(data)} está disponível para o retiro da minha igreja.`
        : `Olá! 🐴 Gostaria de saber quais datas estão disponíveis para o retiro da minha igreja.`;
    } else if(tipo === "valores"){
      msg = `Olá! 🐴 Gostaria de saber mais sobre valores e o que está incluso na Chácara Ormelez.`;
    } else if(tipo === "duvida"){
      const texto = document.getElementById("wa-input-duvida")?.value?.trim();
      msg = texto
        ? `Olá! 🐴 Vim pelo site da Chácara Ormelez e queria saber: ${texto}`
        : `Olá! 🐴 Vim pelo site e queria tirar algumas dúvidas sobre a Chácara Ormelez.`;
    }
    window.open(whatsLink(msg), "_blank", "noopener");
    window.fecharWaCard();
  }
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
