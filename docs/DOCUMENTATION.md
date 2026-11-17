# Bingo online — Backlog

Projeto: sala de bingo em tempo real. O **admin** sorteia, os **participantes** escolhem cartela e marcam os números na tela, a **tela do público** mostra os números no projetor/TV.

Como usar este arquivo: cada task vira uma **issue** e um **PR** (um PR por task, pequeno). Tamanhos: `S` ≈ meio dia, `M` ≈ 1 dia, `L` ≈ 2+ dias (referência relativa, ajuste ao seu ritmo).

---

## 1. Requisitos acordados

**Funcionais**

- RF1. O admin cria uma sala e recebe um **código curto** e um **QR code** (link `...?sala=XXXXXX`).
- RF2. Antes de cada sorteio (rodada) o admin define: tamanho (**50 ou 100 números**) e responde **"Haverá cartelas no papel neste sorteio?"**. Se **sim**, seleciona quais cartelas (pelo número) estão no papel; elas ficam indisponíveis para os participantes.
- RF3. Participantes entram por código ou QR e escolhem uma cartela entre as **disponíveis** (tempo real, sem duplicidade). A **troca de cartela é permitida até o início de cada sorteio**; ao iniciar, as cartelas travam.
- RF4. O sorteio acontece no **servidor**; cada número sorteado chega a todos em tempo real.
- RF5. **Marcação manual:** o participante toca no número para marcar e toca de novo para desmarcar. Só é possível marcar um número que **já foi sorteado**. Nada é marcado automaticamente.
- RF6. **Não existe botão BINGO.** Quando a cartela do participante estiver completa (24 números marcados + espaço livre), ele recebe um **alerta na tela** dizendo BINGO e avisa em voz alta.
- RF7. **Conferência (admin):** pesquisa o número da cartela e vê a cartela com os números sorteados marcados e o veredito. Fica disponível só depois de **24 números sorteados** (mínimo para existir bingo). A tela de sorteio **não confere cartelas nem anuncia bingo**.
- RF8. **Tela do público:** mostra apenas o número atual e os números já sorteados.
- RF9. A mesma sala pode ter **várias rodadas**; cada rodada zera os sorteados e as marcações.

**Não funcionais**

- RNF1. Sem login e sem dados pessoais. Nada vai para banco de dados: estado da sala só em **memória** do servidor.
- RNF2. Funciona bem em celular, tablet e PC. Meta: 60 participantes simultâneos.
- RNF3. Front estático no GitHub Pages (HTTPS) falando com o back por `wss://` e HTTP. O servidor aceita só a origem do seu site.
- RNF4. Cartelas **determinísticas**: a cartela nº N é sempre a mesma (as do PDF atual continuam valendo).

---

## 2. Modelo mental (estados)

```
Sala
 └─ Rodada (várias, uma de cada vez)
     CONFIGURANDO  → admin escolhe tamanho e papel (sim/não → quais cartelas)
     ESCOLHENDO    → participantes reservam/trocam cartela (lobby)
     EM_ANDAMENTO  → cartelas travadas, admin sorteia, participantes marcam
     ENCERRADA     → admin inicia nova rodada (volta para ESCOLHENDO) ou fecha a sala
```

Papéis: `host` (token próprio), `player` (uma cartela), `display` (tela do público, somente leitura).

---

## 3. Decisões em aberto (você decide, anote a resposta no README)

| # | Pergunta | Sugestão inicial |
|---|----------|------------------|
| D1 | Quem detecta o bingo para o alerta (RF6)? | **No aparelho do participante**, pelas marcações dele. A conferência do admin é a fonte da verdade. Alternativa: o cliente envia as marcações ao servidor. |
| D2 | Quantas cartelas por sala? | 30 (as do PDF), configurável até 300. |
| D3 | Uma pessoa pode ter mais de uma cartela? | Não, uma por pessoa. |
| D4 | "Desfazer último número" existe online? | Não. Com marcação manual ele quebra as marcações já feitas. |
| D5 | Guardar no aparelho do participante (sessionStorage) as marcações e um token anônimo para reconexão? | Sim, só no aparelho dele, nada no servidor. Confira se isso respeita seu "sem armazenar dados". |
| D6 | O que acontece se o admin cair? | Sala espera alguns minutos; o admin volta com o token da sala. |
| D7 | Participante informa nome? | Não. Identificação é só "Cartela N". |
| D8 | Onde hospedar o back? | Pesquisar na task T25. |

Resolva **D1, D2, D3 e D4 antes de T04** (mudam o modelo de dados e o protocolo).

---

## 4. Tasks

### Marco 0 — Fundamentos

**T01 — Estrutura do repositório** `S`
- **Objetivo:** organizar pastas (`/docs` para o front, `/server`, `/e2e`, `/shared`), README com requisitos e como rodar.
- **Pesquisar:** de onde o GitHub Pages pode publicar (raiz ou `/docs`); workspaces do npm.
- **Pronto quando:** o site atual continua abrindo no Pages e um comando sobe o servidor local vazio.

**T02 — Módulo de cartelas compartilhado** `M` · depende: T01
- **Objetivo:** extrair o gerador de cartelas (hoje dentro do `index.html`) para um módulo em TypeScript usado por front e servidor.
- **Pesquisar:** teste de "golden master"; Vitest ou `node:test`; como compartilhar código entre pacotes.
- **Pronto quando:** testes provam que as cartelas 1 a 30 (50 números) são idênticas às do PDF atual, que as de 100 respeitam as faixas por coluna e que não há cartelas repetidas.

### Marco 1 — Servidor

**T03 — Servidor base** `S` · depende: T01
- **Objetivo:** Node + TypeScript, rota `/health`, porta e origem permitida por variável de ambiente, logs.
- **Pesquisar:** `http` nativo vs Fastify/Express; verificação de `Origin`; CORS.
- **Pronto quando:** `/health` responde e uma origem não permitida é recusada.

**T04 — Domínio em memória (máquina de estados)** `L` · depende: T02, decisões D1–D4
- **Objetivo:** modelar Sala, Rodada e Participante e as transições da seção 2 como código puro, sem rede.
- **Pesquisar:** máquina de estados finita; tipos discriminados em TypeScript; testes de transição inválida.
- **Pronto quando:** testes cobrem todas as transições válidas e rejeitam as inválidas (ex.: trocar cartela com a rodada em andamento).

**T05 — Criar sala e códigos** `M` · depende: T04
- **Objetivo:** criar sala, gerar código curto sem caracteres ambíguos (0/O, 1/I) e o token do host.
- **Pesquisar:** `crypto.randomInt`; colisão de códigos; por que não usar `Math.random`.
- **Pronto quando:** `POST /rooms` devolve código e token, e `GET /rooms/:code` diz se a sala existe sem revelar o token.

**T06 — WebSocket e protocolo** `L` · depende: T03, T04
- **Objetivo:** conexões, mensagens versionadas e validadas, **snapshot completo** ao conectar/reconectar, heartbeat.
- **Pesquisar:** biblioteca `ws`; validação de payload (zod); ping/pong; por que o snapshot simplifica a reconexão.
- **Sugestão de mensagens:** cliente→servidor: `join`, `claim_card`, `release_card`, `host_configure_round`, `host_start_round`, `host_draw`, `host_check_card`, `host_end_round`. Servidor→cliente: `snapshot`, `card_claimed`, `card_released`, `number_drawn`, `round_started`, `round_ended`, `error`.
- **Pronto quando:** um cliente de teste conecta, recebe o snapshot, cai, reconecta e recebe o estado atual.

**T07 — Configuração da rodada (papel sim/não)** `M` · depende: T05, T06
- **Objetivo:** implementar RF2 no servidor: tamanho, pergunta do papel, cartelas do papel bloqueadas.
- **Pronto quando:** cartelas marcadas como "no papel" aparecem como indisponíveis no snapshot e não podem ser reservadas.

**T08 — Reserva e troca de cartela** `L` · depende: T07
- **Objetivo:** RF3 sem duplicidade e com troca livre só antes do início da rodada.
- **Pesquisar:** por que, em Node, "checar e atribuir" sem `await` no meio já é atômico e quando deixaria de ser (múltiplas instâncias do servidor, `await` entre a checagem e a escrita).
- **Pronto quando:** um teste dispara 20 `claim_card` simultâneos na mesma cartela e só um vence.

**T09 — Sorteio no servidor** `M` · depende: T08
- **Objetivo:** `host_draw` sorteia sem repetir (`crypto`), transmite a todos, trava no fim do universo (50/100), só aceita o token do host.
- **Pronto quando:** testes mostram que nenhum número repete, que não-host não sorteia e que o sorteio não ocorre antes de `host_start_round`.

**T10 — Conferência no servidor** `M` · depende: T09
- **Objetivo:** RF7: dado o número da cartela, responder com a cartela, os números sorteados e o veredito; recusar antes de 24 números.
- **Pronto quando:** só o host consegue conferir e o resultado bate com o cálculo manual em 3 cenários de teste.

**T11 — Limpeza e proteção** `M` · depende: T06
- **Objetivo:** expirar salas inativas, limitar salas e participantes, limitar taxa de mensagens, tratar o admin desconectado (D6).
- **Pesquisar:** rate limiting simples por conexão; limpeza com timers; vazamento de memória em conexões mortas.
- **Pronto quando:** uma sala parada expira e um cliente que manda mensagens demais é desconectado.

### Marco 2 — Front do admin

**T12 — Criar sala, código e QR** `M` · depende: T05
- **Pesquisar:** biblioteca pequena de QR (ou gerar em canvas); link com `?sala=`.
- **Pronto quando:** o admin cria a sala e vê código e QR; ler o QR no celular abre a página do participante já com o código.

**T13 — Pré-sorteio: tamanho, papel e lobby** `L` · depende: T07, T12
- **Objetivo:** tela com a pergunta "Haverá cartelas no papel?", seleção das cartelas de papel e lista em tempo real de quem reservou o quê; botão de iniciar a rodada.
- **Pronto quando:** o fluxo sim/não funciona de ponta a ponta com o servidor real.

**T14 — Sorteio e conferência conectados** `L` · depende: T09, T10, T13
- **Objetivo:** trocar o estado local do `index.html` atual pelo do servidor, mantendo as regras (sem conferência na tela de sorteio, conferência liberada após 24 números).
- **Pronto quando:** o fluxo completo funciona e o `index.html` antigo continua disponível como modo offline, se você decidir mantê-lo.

**T15 — Tela do público como papel da sala** `M` · depende: T06
- **Objetivo:** substituir o `BroadcastChannel` atual por conexão `display` na sala (funciona em qualquer aparelho).
- **Pronto quando:** abrir `?sala=XXXXXX&publico` em outro aparelho mostra só o número atual e os sorteados.

### Marco 3 — Front do participante

**T16 — Entrada por código ou QR** `S` · depende: T05
- **Pronto quando:** `?sala=` preenche o código; código inválido mostra erro claro; sala em andamento informa o estado.

**T17 — Escolha e troca de cartela** `L` · depende: T08, T16
- **Objetivo:** grade de cartelas livres/ocupadas ao vivo, reservar, trocar até o início.
- **Pronto quando:** duas pessoas disputando a mesma cartela veem o resultado correto e a ocupada é bloqueada na hora.

**T18 — Cartela do jogo com marcação manual** `M` · depende: T17
- **Objetivo:** RF5: toque marca/desmarca, só números sorteados, feedback ao tocar em número não sorteado.
- **Pronto quando:** não existe jeito de marcar número não sorteado e o toggle funciona nos dois sentidos.

**T19 — Alerta de BINGO** `S` · depende: T18
- **Objetivo:** RF6: alerta visível (e vibração, se disponível) quando as 24 marcações estiverem completas.
- **Pesquisar:** `navigator.vibrate`; limitações de áudio e notificação em navegadores móveis.
- **Pronto quando:** completar a cartela dispara o alerta uma única vez por rodada.

**T20 — Reconexão e persistência local** `M` · depende: T06, T18, D5
- **Pronto quando:** recarregar a página ou perder o sinal volta à mesma cartela com as marcações preservadas.

**T21 — Fim de rodada e próxima rodada** `M` · depende: T18
- **Pronto quando:** ao encerrar, marcações zeram e a pessoa volta à escolha de cartela da rodada seguinte (RF9).

### Marco 4 — Qualidade

**T22 — Testes e2e com Playwright** `L` · depende: T14, T18
- **Objetivo:** vários contextos de navegador na mesma sala: 1 admin, 3 participantes, 1 tela do público.
- **Cenários mínimos:** corrida pela mesma cartela; troca bloqueada após início; não marca número não sorteado; alerta de bingo; reconexão; conferência recusada antes de 24 números.
- **Pronto quando:** a suíte roda no CI do GitHub Actions.

**T23 — Carga leve** `M` · depende: T09
- **Objetivo:** script que simula 60 conexões entrando, reservando e recebendo 50 sorteios.
- **Pronto quando:** sem perda de mensagens e com memória estável.

**T24 — Mobile e acessibilidade** `M` · depende: T18
- **Pesquisar:** tamanho mínimo de alvo de toque, contraste, leitura em projetor.
- **Pronto quando:** teste manual em celular pequeno, tablet e PC sem elementos cortados ou rolagem horizontal.

### Marco 5 — Entrega

**T25 — Hospedagem do back** `M` · depende: T11
- **Pesquisar:** opções de hospedagem com WebSocket e o comportamento do plano grátis (dormir por inatividade, reinícios que derrubam conexões); variáveis de ambiente; `wss`.
- **Pronto quando:** back no ar, front do Pages conectando nele e a origem restrita ao seu domínio.

**T26 — Configuração por ambiente** `S` · depende: T25
- **Pronto quando:** o front usa a URL do back local em desenvolvimento e a de produção no Pages, sem editar código.

**T27 — Ensaio geral e guia do evento** `S` · depende: T22, T25
- **Objetivo:** checklist do dia (acordar o servidor com antecedência, testar QR no projetor, plano B offline com o `index.html` atual).
- **Pronto quando:** um ensaio com 5 a 10 pessoas passa sem intervenção no código.

**T28 — Documentação final** `S`
- **Pronto quando:** o README tem arquitetura (diagrama), protocolo, decisões D1–D8 e como rodar testes.

---

## 5. Ordem sugerida

Caminho crítico: **T01 → T02 → T04 → T06 → T08 → T09 → T17 → T18 → T19 → T22**.
Em paralelo: T03 e T05 com o servidor; T12, T15 e T16 assim que T05/T06 existirem.
Primeiro marco com algo para mostrar: T01 a T09 (servidor sorteando via cliente de teste).

## 6. Regras de trabalho

- 1 task = 1 branch = 1 PR pequeno, com descrição: o que mudou, como testar, riscos.
- Todo PR precisa de testes que provem os critérios de "Pronto quando".
- Antes de começar uma task, escreva em 3 linhas o que você pretende fazer e o que ainda não sabe; essas lacunas são a sua lista de pesquisa.
- Decisões novas entram no README (seção de decisões), não só na conversa.
