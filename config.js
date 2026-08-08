/* ============================================================
   CHÁCARA ORMELEZ — Configuração
   Edite este arquivo uma única vez: index.html e calendario.html
   os dois leem daqui. Não precisa mexer em mais nada.
   ============================================================ */
const CONFIG = {
  // Cole a URL e a chave "anon public" do seu projeto em Supabase → Project Settings → API
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA-CHAVE-ANON-AQUI",

  // Número de WhatsApp no formato DDI+DDD+numero, sem espaços, +, ou símbolos
  WHATSAPP_NUMBER: "5541999249827",

  // Nome exibido no widget flutuante de WhatsApp
  NOME_EXIBICAO: "Chácara Ormelez",
};

// -- não precisa editar daqui pra baixo --
const supabaseConfigured =
  CONFIG.SUPABASE_URL.includes("supabase.co") &&
  !CONFIG.SUPABASE_URL.includes("SEU-PROJETO");

const supabaseClient = (supabaseConfigured && window.supabase)
  ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : null;

function whatsLink(msg){
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
