/* ============================================================
   CHÁCARA ORMELEZ — comportamento compartilhado
   (preloader, cursor, topo, progresso, revelações, widget WhatsApp)
   ============================================================ */

/* ---------- Preloader ---------- */
window.addEventListener("load", ()=>{
  const pre = document.getElementById("preloader");
  if(pre) setTimeout(()=> pre.classList.add("hide"), 420);
});

/* ---------- Cursor com brilho (desktop apenas) ---------- */
if(window.matchMedia("(pointer: fine)").matches){
  const cur = document.createElement("div");
  cur.className = "cursor-glow";
  document.body.appendChild(cur);
  window.addEventListener("mousemove", (e)=>{
    cur.classList.add("active");
    cur.style.left = e.clientX + "px";
    cur.style.top = e.clientY + "px";
  });
  document.querySelectorAll("a, button").forEach(el=>{
    el.addEventListener("mouseenter", ()=> cur.classList.add("big"));
    el.addEventListener("mouseleave", ()=> cur.classList.remove("big"));
  });
}

/* ---------- Topbar + barra de progresso (estrada) ---------- */
const topbar = document.getElementById("topbar");
const progresso = document.getElementById("progresso-estrada");
window.addEventListener("scroll", ()=>{
  if(topbar) topbar.classList.toggle("scrolled", window.scrollY > 40);
  if(progresso){
    const h = document.documentElement;
    const pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    progresso.style.transform = `scaleX(${Math.min(pct,1)})`;
  }
}, { passive:true });

/* ---------- Revelação ao rolar ---------- */
const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
if("IntersectionObserver" in window){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("on");
        io.unobserve(entry.target);
      }
    });
  }, { threshold:.15, rootMargin:"0px 0px -60px 0px" });
  revealEls.forEach(el=> io.observe(el));
} else {
  revealEls.forEach(el=> el.classList.add("on"));
}

/* ---------- Botões magnéticos ---------- */
document.querySelectorAll("[data-magnetico]").forEach(btn=>{
  btn.addEventListener("mousemove", (e)=>{
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    btn.style.transform = `translate(${x*.18}px, ${y*.28}px)`;
  });
  btn.addEventListener("mouseleave", ()=>{ btn.style.transform = "translate(0,0)"; });
});

/* ---------- Links de WhatsApp (mensagem padrão) ---------- */
const genericMsg = `Olá! 🐴 Vim pelo site e queria saber mais sobre a Chácara Ormelez para o retiro da minha igreja.`;
document.querySelectorAll("[data-whats-generico]").forEach(el=>{
  el.href = whatsLink(genericMsg);
});

/* ---------- Widget flutuante de WhatsApp ---------- */
const waBolha = document.getElementById("wa-bolha");
const waCard = document.getElementById("wa-card");
const waClose = document.getElementById("wa-card-close");
if(waBolha && waCard){
  const abrir = ()=> waCard.classList.add("open");
  const fechar = ()=> waCard.classList.remove("open");
  waBolha.addEventListener("click", ()=> waCard.classList.toggle("open"));
  if(waClose) waClose.addEventListener("click", fechar);
  // abre sozinho uma vez, depois de um tempinho, se ainda não foi visto
  if(!sessionStorage.getItem("wa-visto")){
    setTimeout(()=>{ abrir(); sessionStorage.setItem("wa-visto","1"); }, 4200);
  }
  document.querySelectorAll(".wa-quick").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      window.open(whatsLink(btn.dataset.msg), "_blank", "noopener");
    });
  });
}
