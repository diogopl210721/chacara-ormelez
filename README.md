# Chácara Ormelez — Site

Site completo, moderno e animado, pronto para publicar no GitHub Pages e sincronizar com o Supabase.

## Estrutura dos arquivos

```
index.html        → página inicial (hero, estrutura, galeria, propósito, contato)
calendario.html    → página do calendário do ano inteiro, com reserva interativa
style.css          → todo o visual do site (as duas páginas usam este arquivo)
config.js          → ⭐ único lugar onde você cola a URL/chave do Supabase e o WhatsApp
app.js             → comportamento comum às duas páginas (menu, animações, widget de WhatsApp)
home.js            → comportamento só da página inicial (galeria, contadores, paralaxe)
calendar.js        → comportamento só do calendário (reservas, tempo real)
supabase-setup.sql → script para criar as tabelas e regras de segurança no Supabase
img/               → fotos e logo já incluídas
```

## Como funciona o calendário (o coração do site)

1. O cliente abre `calendario.html`, vê o ano inteiro e clica num dia **livre** (verde).
2. Aparece um cartão perguntando se ele quer **pré-reservar** aquele dia.
3. Ao confirmar, a data vira **âmbar** ("pré-reservado") na hora — para ele e para qualquer
   outra pessoa olhando o calendário naquele momento — e abre o WhatsApp com uma mensagem
   já pronta, citando a data escolhida.
4. Você conversa com o cliente e confirma a reserva. Para isso, no Supabase:
   **Table Editor → reservas → ache a linha da data → troque `status` de `pre-reservado`
   para `reservado`.** A partir daí, a data fica **vermelha** e indisponível para sempre.
5. **Se ninguém confirmar em 48 horas, a data libera sozinha** — sem cron job, sem robô,
   sem você precisar fazer nada. É só uma regra de segurança no próprio banco de dados.

Cores do calendário:
- 🟢 **Verde** — disponível, pode clicar
- 🟡 **Âmbar** — pré-reservado, aguardando sua confirmação (expira em 48h)
- 🔴 **Vermelho** — reservado e confirmado por você
- ⚪ **Cinza** — bloqueado manualmente por você (ex: manutenção)

Por segurança, o site (visitante comum) **só consegue criar pré-reservas** — nunca confirmar
uma reserva de verdade nem bloquear datas. Isso só você faz, logado no painel do Supabase.

## Passo 1 — Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (se ainda não tiver um).
2. Abra **SQL Editor** → cole o conteúdo de `supabase-setup.sql` → **Run**.
   Isso cria as tabelas, as regras de segurança e ativa o tempo real do calendário.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## Passo 2 — Configure o site (um lugar só)

Abra `config.js` e cole os seus dados:

```js
const CONFIG = {
  SUPABASE_URL: "https://xxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
  WHATSAPP_NUMBER: "5541999249827",
  NOME_EXIBICAO: "Chácara Ormelez",
};
```

Esse arquivo é lido tanto por `index.html` quanto por `calendario.html` — edite uma vez só.

> Enquanto `SUPABASE_URL` continuar com o valor de exemplo, o site funciona normalmente
> em modo "demonstração" (todas as datas aparecem livres), então dá pra publicar e
> testar o visual antes mesmo de configurar o Supabase.

## Passo 3 — Publique no GitHub Pages

1. Crie um repositório no GitHub e envie **todos os arquivos** (incluindo a pasta `img/`)
   mantendo essa mesma estrutura de pastas.
2. No repositório: **Settings → Pages → Branch: main → Save**.
3. Em alguns minutos seu site estará em `https://seu-usuario.github.io/nome-do-repo/`.

## Uso no dia a dia

- **Confirmar uma reserva**: Table Editor → `reservas` → troque `status` para `reservado`.
- **Recusar/cancelar uma pré-reserva antes das 48h**: troque `status` para `cancelado`,
  ou apague a linha.
- **Bloquear uma data por conta própria**: Insert row → `data` + `status` = `bloqueado`.
- **Adicionar fotos na galeria**: suba a imagem em **Storage** (crie um bucket público)
  ou use qualquer link público de imagem, depois vá em **Table Editor → galeria →
  Insert row** e cole o link em `url`.
- **Trocar o WhatsApp ou reconectar o Supabase**: tudo em `config.js`.

## Fotos e logo já incluídas

As fotos em `img/` foram extraídas do material que você já tinha (piscina, capela,
refeitório, tirolesa, skibunda, lual, dormitórios) e a logo em `img/logo.png` é a sua
ferradura oficial. Quer trocar alguma? Basta substituir o arquivo em `img/` mantendo o
mesmo nome, ou adicionar novas pela tabela `galeria` no Supabase.
