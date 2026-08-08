/* ============================================================
   CHÁCARA ORMELEZ — calendário do ano (página dedicada)
   Fluxo:
   1) Cliente clica num dia livre → confirma no modal
   2) Grava status "pre-reservado" no Supabase (fica âmbar por até 48h)
   3) Abre o WhatsApp com a data já preenchida
   4) Você confirma pelo WhatsApp e muda o status para "reservado"
      no Table Editor do Supabase → dia fica vermelho, indisponível
   5) Se ninguém confirmar em 48h, o dia libera sozinho
   ============================================================ */

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS_EXPIRACAO = 2; // horas * 24 = 48h

let anoAtual = new Date().getFullYear();
let reservasMap = new Map(); // "YYYY-MM-DD" -> { status, created_at }
let diaSelecionado = null;   // { iso, el, y, m, d }

const elAno = document.getElementById("ano-titulo");
const elMeses = document.getElementById("meses-container");
const elStatus = document.getElementById("cal-status-geral");

function toISO(y,m,d){ return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

function estaExpirada(row){
  if(row.status !== "pre-reservado") return false;
  const criada = new Date(row.created_at);
  const horas = (Date.now() - criada.getTime()) / 36e5;
  return horas > DIAS_EXPIRACAO * 24;
}

/* ---------- Carrega reservas do ano do Supabase ---------- */
async function carregarReservas(){
  if(!supabaseClient){
    elStatus.textContent = "Configure o Supabase em config.js para sincronizar o calendário.";
    renderAno();
    return;
  }
  try{
    const inicio = `${anoAtual}-01-01`;
    const fim = `${anoAtual}-12-31`;
    const { data, error } = await supabaseClient
      .from("ormelez_reservas").select("data,status,created_at")
      .gte("data", inicio).lte("data", fim);
    if(error) throw error;
    reservasMap.clear();
    (data || []).forEach(r => reservasMap.set(r.data, { status:r.status, created_at:r.created_at }));
    elStatus.textContent = "";
  }catch(e){
    console.warn("Reservas: não foi possível carregar.", e.message);
    elStatus.textContent = "Não foi possível carregar as reservas agora. Tente atualizar a página.";
  }
  renderAno();
}

/* ---------- Tempo real: outros visitantes veem mudanças na hora ---------- */
if(supabaseClient){
  supabaseClient
    .channel("reservas-ao-vivo")
    .on("postgres_changes", { event:"*", schema:"public", table:"ormelez_reservas" }, (payload)=>{
      const row = payload.new && payload.new.data ? payload.new : payload.old;
      if(!row || !row.data) return;
      const iso = row.data;
      const ano = parseInt(iso.slice(0,4), 10);
      if(payload.eventType === "DELETE"){
        reservasMap.delete(iso);
      } else {
        reservasMap.set(iso, { status: payload.new.status, created_at: payload.new.created_at });
      }
      if(ano === anoAtual) atualizarCelula(iso);
    })
    .subscribe();
}

/* ---------- Renderização ---------- */
function statusVisual(iso){
  const row = reservasMap.get(iso);
  if(!row) return "livre";
  if(row.status === "reservado") return "reservado";
  if(row.status === "bloqueado") return "bloqueado";
  if(row.status === "pre-reservado") return estaExpirada(row) ? "livre" : "pre-reservado";
  return "livre"; // cancelado ou outro
}

function renderAno(){
  elAno.textContent = anoAtual;
  elMeses.innerHTML = "";
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  for(let m=0; m<12; m++){
    const card = document.createElement("div");
    card.className = "mes-card reveal";

    const titulo = document.createElement("div");
    titulo.className = "mes-titulo";
    titulo.textContent = `${MESES[m]} de ${anoAtual}`;
    card.appendChild(titulo);

    const weekdays = document.createElement("div");
    weekdays.className = "mes-weekdays";
    ["D","S","T","Q","Q","S","S"].forEach(d=>{
      const s = document.createElement("span"); s.textContent = d; weekdays.appendChild(s);
    });
    card.appendChild(weekdays);

    const grid = document.createElement("div");
    grid.className = "mes-dias";

    const firstDow = new Date(anoAtual,m,1).getDay();
    const daysInMonth = new Date(anoAtual,m+1,0).getDate();

    for(let i=0;i<firstDow;i++){
      const off = document.createElement("div"); off.className = "dia off"; grid.appendChild(off);
    }

    for(let d=1; d<=daysInMonth; d++){
      const iso = toISO(anoAtual,m,d);
      const btn = document.createElement("button");
      btn.className = "dia";
      btn.textContent = d;
      btn.dataset.iso = iso;
      grid.appendChild(btn);
      atualizarCelula(iso, btn, new Date(anoAtual,m,d), hoje);
    }

    card.appendChild(grid);
    elMeses.appendChild(card);
  }

  document.querySelectorAll(".reveal").forEach(el=> el.classList.add("on"));
}

function atualizarCelula(iso, btnDireto, dataCel, hojeCel){
  const btn = btnDireto || document.querySelector(`.dia[data-iso="${iso}"]`);
  if(!btn) return;
  const cellDate = dataCel || (()=>{ const [y,m,d]=iso.split("-").map(Number); return new Date(y,m-1,d); })();
  const hoje = hojeCel || (()=>{ const h=new Date(); h.setHours(0,0,0,0); return h; })();

  btn.classList.remove("past","reservado","pre-reservado","bloqueado","hoje");
  btn.disabled = false;
  btn.onclick = null;

  if(cellDate.getTime() === hoje.getTime()) btn.classList.add("hoje");

  if(cellDate < hoje){
    btn.classList.add("past");
    btn.disabled = true;
    return;
  }

  const status = statusVisual(iso);
  if(status === "reservado"){
    btn.classList.add("reservado"); btn.disabled = true;
    btn.setAttribute("aria-label", `${iso} — reservado`);
  } else if(status === "bloqueado"){
    btn.classList.add("bloqueado"); btn.disabled = true;
    btn.setAttribute("aria-label", `${iso} — indisponível`);
  } else if(status === "pre-reservado"){
    btn.classList.add("pre-reservado"); btn.disabled = true;
    btn.setAttribute("aria-label", `${iso} — pré-reservado, aguardando confirmação`);
  } else {
    btn.setAttribute("aria-label", `${iso} — disponível`);
    btn.addEventListener("click", ()=> abrirModal(iso, btn, cellDate));
  }
}

/* ---------- Navegação de ano ---------- */
document.getElementById("ano-prev")?.addEventListener("click", ()=>{ anoAtual--; carregarReservas(); });
document.getElementById("ano-next")?.addEventListener("click", ()=>{ anoAtual++; carregarReservas(); });

/* ---------- Modal de confirmação ---------- */
const modal = document.getElementById("modal-reserva");
const modalData = document.getElementById("modal-data");
const modalErro = document.getElementById("modal-erro");
const modalConfirmar = document.getElementById("modal-confirmar");
const modalCancelar = document.getElementById("modal-cancelar");
const modalCard = modal?.querySelector(".modal-card");

function abrirModal(iso, btn, cellDate){
  diaSelecionado = { iso, el:btn, data:cellDate };
  const [y,m,d] = iso.split("-").map(Number);
  modalData.textContent = `${String(d).padStart(2,"0")} de ${MESES[m-1]} de ${y}`;
  modalErro.classList.remove("show");
  modal.classList.add("open");
  document.body.classList.add("no-scroll");
}
function fecharModal(){
  modal.classList.remove("open");
  document.body.classList.remove("no-scroll");
  modalCard?.classList.remove("modal-carregando");
}
modalCancelar?.addEventListener("click", fecharModal);
modal?.addEventListener("click", (e)=>{ if(e.target === modal) fecharModal(); });

modalConfirmar?.addEventListener("click", async ()=>{
  if(!diaSelecionado) return;
  const { iso } = diaSelecionado;

  if(!supabaseClient){
    modalErro.textContent = "O calendário ainda não está conectado ao Supabase — fale direto pelo WhatsApp.";
    modalErro.classList.add("show");
    return;
  }

  modalCard.classList.add("modal-carregando");
  modalErro.classList.remove("show");

  try{
    // limpa uma pré-reserva vencida da mesma data, se existir (auto-liberação após 48h)
    await supabaseClient.from("ormelez_reservas").delete()
      .eq("data", iso).eq("status", "pre-reservado")
      .lt("created_at", new Date(Date.now() - DIAS_EXPIRACAO*24*36e5).toISOString());

    const { error } = await supabaseClient.from("ormelez_reservas")
      .insert({ data: iso, status: "pre-reservado" });

    if(error){
      if(error.code === "23505"){ // violação de unicidade — já foi pega por outra pessoa
        modalErro.textContent = "Ops! Essa data acabou de ser reservada por outra pessoa. Escolha outra 🙏";
      } else {
        modalErro.textContent = "Não consegui registrar a pré-reserva agora. Tente novamente ou fale direto no WhatsApp.";
        console.error(error);
      }
      modalErro.classList.add("show");
      modalCard.classList.remove("modal-carregando");
      carregarReservas();
      return;
    }

    reservasMap.set(iso, { status:"pre-reservado", created_at:new Date().toISOString() });
    atualizarCelula(iso);
    if(diaSelecionado.el) diaSelecionado.el.classList.add("pop");

    const [y,m,d] = iso.split("-").map(Number);
    const dataFormatada = `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
    const msg = `Olá! 🐴 Encontrei a Chácara Ormelez pelo site e fiz uma pré-reserva para o dia ${dataFormatada} — ela fica garantida por 48h. Podemos conversar para confirmar? 🙏`;
    window.open(whatsLink(msg), "_blank", "noopener");

    fecharModal();
  }catch(e){
    console.error(e);
    modalErro.textContent = "Algo deu errado. Tente novamente em instantes.";
    modalErro.classList.add("show");
    modalCard.classList.remove("modal-carregando");
  }
});

carregarReservas();
