# Deserve ✨

**Conquiste o que você merece.** App gamificado de tarefas para a família: os pais criam missões, os filhos cumprem com evidências (check, foto ou áudio), os pais aprovam e os pontos viram recompensas reais — mesada, compras e desejos desenhados juntos.

PWA mobile-first, offline-first, sem dependências externas (HTML + CSS + JS puro). Branding inspirado na Luma: tema escuro, gradientes aurora e a **orbe Deserve** — logo viva (estilo Siri) animada em canvas presente no onboarding, headers e celebrações.

## Como rodar

```bash
python3 -m http.server 4173
# abra http://localhost:4173
```

Para testar no celular na mesma rede: `http://<ip-do-mac>:4173`. Para instalar como app (Add to Home Screen) e usar câmera/microfone fora do localhost é preciso HTTPS — ex: `npx serve` + túnel (ngrok/cloudflared) ou hospedar em Vercel/Netlify/GitHub Pages.

> Dica: no onboarding, "Explorar com dados de exemplo" cria a Família Demo (PIN dos pais: **1234**) com histórico de 7 dias para ver as análises.

## Funcionalidades

| Área | O que faz |
|---|---|
| Perfis | Seleção estilo Netflix: Pais (protegido por PIN) e cada filho |
| Missões | Recorrência diária/semanal/única, pontos, multi-filho, evidência exigida (check, 📷 foto, 🎤 áudio até 30s) |
| Aprovações | Filtro por dia ou últimos 7 dias; aprovar entrega pontos, "refazer" devolve com recado |
| Recompensas | Tipos mesada/compra/desejo, custo em pontos, resgate reserva pontos até os pais concederem |
| Análises | Por filho e período (7/30 dias): taxa de conclusão, pontos, streak 🔥, gráfico diário e insight |
| Hoje (filho) | Carrossel vertical de missões em tela cheia (swipe ↑↓); por card: pontos, evidência (📷/🎤/✓) e recusar; relógio de lembrete (5/15/30/1h) com pop-up na tela |
| Gamificação | Confetti, orbe pulsando, vibração, streaks e progresso visual |
| Tema | Claro, escuro ou automático (segue o sistema) — em Ajustes ⚙️ |

## Estrutura

```
index.html            shell do app
css/styles.css        design system (tokens Luma-like, componentes)
js/orb.js             a orbe Deserve (logo animada em canvas)
js/store.js           estado + regras de negócio (localStorage)
js/db.js              IndexedDB para evidências (fotos/áudios)
js/app.js             router + todas as telas
sw.js                 service worker (app shell offline)
manifest.webmanifest  manifesto PWA
icons/                PNGs exportados do próprio renderizador (renderOrbFrame em orb.js)
```

Os dados ficam no dispositivo (localStorage + IndexedDB). Próximo passo natural: backend de sincronização (ex. Supabase/Firebase) para pais e filhos usarem aparelhos diferentes, e push notifications para avisar de aprovações pendentes.
