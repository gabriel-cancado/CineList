# CLAUDE.md

Contexto para agentes de IA trabalhando neste repositório. Responda e escreva em **português**
(código, nomes de variáveis e mensagens de commit em inglês).

## O projeto

**CineList** — aplicativo web para registrar, avaliar e compartilhar filmes assistidos (diário,
notas, resenhas, listas e feed de quem o usuário segue). Trabalho prático 1 (TP1) da disciplina
de Engenharia de Software (UFMG, 2026/2, Prof. Marco Tulio Valente). Time de 3 membros, todos
fullstack. O `README.md` é a fonte oficial de membros, tecnologias e histórias de usuário.

## Stack (decidida no README)

- **Backend:** Node.js + Express.js (API REST)
- **Banco:** MongoDB
- **Frontend:** React (web)
- **IA:** Claude Code e Gemini

Arquitetura obrigatória: backend (API + BD) e frontend web separados.

## Histórias de usuário

1. Cadastro e login com e-mail e senha
2. Busca de filmes por título, diretor ou ano
3. Página do filme: sinopse, elenco, duração e nota média da comunidade
4. Avaliação com nota de 0 a 5 estrelas (alimenta a média)
5. Resenhas em texto
6. Diário: marcar filme como assistido com data (histórico cronológico)
7. Lista "quero assistir"
8. Seguir usuários e feed com avaliações recentes de quem sigo

Ordem sugerida de implementação (por dependência): 1 → 2/3 → 4 → 5 → 6 → 7 → 8.

## Estrutura proposta (ainda não existe código)

```
CineList/
├── server/          # Express + Mongoose
│   └── src/
│       ├── models/       # User, Movie, Rating/Review, DiaryEntry, Watchlist, Follow
│       ├── routes/
│       ├── controllers/
│       ├── middleware/   # auth (JWT), tratamento de erros
│       └── index.js
├── client/          # React (Vite)
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/          # chamadas HTTP ao backend
└── README.md
```

Padrões sugeridos (confirmar com o usuário antes de assumir):
- Mongoose para modelagem; `.env` com `MONGODB_URI`, `JWT_SECRET`, `TMDB_API_KEY`, `PORT` (nunca commitar `.env`;
  manter um `.env.example`).
- Autenticação com bcrypt + JWT.
- React com Vite e React Router.

### Decisões tomadas

- **Filmes vêm da API pública do TMDB** (themoviedb.org) — sem cadastro manual. O backend faz
  proxy das chamadas (a chave `TMDB_API_KEY` fica só no `.env` do servidor) e busca por título,
  ano (`/search/movie`) e diretor (`/search/person` + `/discover/movie?with_crew=`). Ao abrir,
  avaliar ou listar um filme, ele é salvo/atualizado no MongoDB (`Movie` com `tmdbId`), para que
  avaliações, diário e listas referenciem documentos locais e a média seja calculada localmente.
- **Design livre:** o agente escolhe a estilização e cria a identidade visual. A UI precisa
  ficar bonita e consistente, porque vale nota e aparece na demo. Mantenha a escolha simples de
  entender e registre aqui a abordagem adotada (ex.: CSS Modules, Tailwind).
- **Nota de 0 a 5 com meias estrelas** (passos de 0.5). Uma avaliação por usuário por filme;
  avaliar de novo atualiza a nota. A média da comunidade é calculada a partir dessas avaliações.

- **Banco em MongoDB Atlas** (cluster gratuito compartilhado pelo time); a URI vai no `.env`.
- **Monorepo** com `server/` e `client/` como acima.

## Regras obrigatórias do TP (enunciado)

- **Commits de no máximo 100 LOC.** Exceções precisam ser justificadas na mensagem do commit
  (ex.: `package-lock.json`, arquivos gerados). Divida o trabalho em passos pequenos e coerentes.
- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `perf:`,
  `build:`, `chore:`, `revert:`. Ex.: `feat: add login endpoint`.
- **Todo membro precisa ter ≥15% dos commits.** Cada membro usa seu próprio agente; o agente
  commita com a identidade git de quem está conversando com ele (nunca faça `push` sem pedido).
- Todo código gerado deve ser **revisado e entendido** por pelo menos um membro — os membros
  precisam dominar código, arquitetura, BD e UI. Prefira código simples e legível a abstrações
  elaboradas; explique brevemente decisões não óbvias ao entregar.
- **Documentação UML no README:** pelo menos dois tipos de diagrama, de preferência em Mermaid
  (ex.: diagrama de classes dos modelos + diagrama de sequência de um fluxo, ou de componentes).
  Manter atualizado conforme o sistema evolui.
- **Testes automatizados não contam no TP1** (são foco do TP2). Não gaste esforço neles agora,
  a menos que pedido.
- Avaliação: implementação das histórias + qualidade da UI (7 pts), relato sobre uso de IA (6 pts),
  documentação (1 pt), retrospectiva (1 pt). A UI precisa ficar apresentável para a demo.

## Relato de uso de IA

O relato sobre IA vale quase metade da nota. Ao concluir uma tarefa relevante, mencione em uma
linha algo que valha registrar (o que funcionou, o que precisou ser corrigido, prompts úteis),
para que o time possa anotar. Pontos cobrados: positivos/negativos, dicas e anti-padrões,
trabalho em equipe com agentes e % de código gerado por IA.

## Fluxo de trabalho

- Uma história (ou parte dela) por vez: backend (modelo → rota → controller) e depois frontend.
- Ao final de cada passo, informe como rodar/verificar (comandos, rota, tela).
- Atualize este arquivo quando comandos, estrutura ou decisões forem definidos.

## Comandos

_(A definir quando o projeto for inicializado — ex.: `npm run dev` em `server/` e `client/`.)_
