# Implanta SaaS — contexto do projeto

SaaS de gestão de implantação B2B, multi-tenant, pra vender pra empresas de ramos diferentes (não travado a um setor). Wendel é dev frontend (React/TS) na Dinabox, onde constrói um sistema interno parecido — este projeto é inspirado nesse fluxo, mas é código, schema e naming escritos do zero.

## Regra inegociável
**Nunca** reaproveitar código, schema ou naming literal dos repositórios `dinabox-workspace-api`/`dinabox-workspace-ui`. Autorização da Dinabox cobre "inspiração de arquitetura", não cópia. Se em algum momento parecer necessário olhar aquele código de novo, perguntar antes de usar qualquer trecho dele.

## Diferencial de produto (por quê estamos construindo isso)
- Portal público de status por link (`/status/:token`), sem exigir login do cliente final
- Notificação nativa via WhatsApp (Evolution API) quando uma etapa avança
- Mais simples e mais barato que os concorrentes diretos, não tenta competir feature-a-feature

## Concorrência mapeada (não redesenhar do zero, consultar antes de decidir feature nova)
- **ImplantaWeb** (implantaweb.com.br): concorrente BR direto, maduro — cronograma, checklist, dashboard, IA de insights, NPS integrado, portal do cliente com aprovação de etapa + upload de arquivo, modo TV. Sem WhatsApp nativo.
- **GuideCx / Rocketlane / Dock / OnRamp**: categoria "client onboarding software" internacional, enterprise, US$ 16k–48k/ano, em inglês.
- Estratégia: não copiar essas features de cara. Diferenciar por WhatsApp + preço + simplicidade pra implementadoras pequenas.

## Stack
React + TypeScript + Vite + Tailwind + Supabase (Postgres + Auth + RLS) + Evolution API (WhatsApp)

## Comandos
- `npm install`
- `npm run dev`
- `npm run build` (roda `tsc -b` antes — trata erro de tipo como blocker, não ignorar)

## Decisões de arquitetura (seguir, não redecidir)
- Multi-tenant via RLS: toda tabela de domínio tem `organization_id` (direto ou via join até a dona), isolada comparando com `((auth.jwt() -> 'app_metadata') ->> 'org_id')::uuid`
- **org_id fica em `app_metadata` do usuário, não em custom claim de Auth Hook** — Supabase já inclui `app_metadata` no JWT por padrão, então não precisa configurar hook nem passo manual no Dashboard. É setado pela function `onboard_user_to_org(auth_user_id, organization_id, name, email, role)` quando um usuário novo é vinculado. Reavaliar pra Auth Hook só quando existir signup self-service de verdade (hoje o onboarding é manual, feito por você).
- `custom_fields` (JSONB) em `clients` e `form_schema` (JSONB) em `briefings`: permite vender pra ramos diferentes sem migração de banco por vertical
- Portal público via RPC (`get_implementation_status`, security definer), nunca via policy de tabela pública — a tabela `implementations` não tem policy de leitura anônima
- Criação de implantação a partir de template via RPC (`create_implementation_from_template`) que copia módulos/tarefas em loop (não por nome) — nunca reintroduzir a lógica de cópia no client
- `services/*.ts` é a única camada que fala com o Supabase — nunca chamar `supabase.from(...)` direto dentro de componente

## Como criar seu primeiro usuário de teste
1. Sign up normal pelo `/login` (ou crie o usuário no Dashboard do Supabase)
2. Pegue o `id` desse usuário em Authentication > Users no Dashboard
3. Rode no SQL editor: `select onboard_user_to_org('<auth_user_id>', '22d72402-2c9b-4661-b0bf-439f8100eab7', 'Seu Nome', 'seu@email.com', 'owner');` (esse é o org_id da organização de teste já seedada, "Oficina Digital Implantações")
4. Faça login de novo (o JWT antigo não tem o claim — precisa emitir um token novo)

## Projeto Supabase
Nome `implanta-saas`, região `sa-east-1`. Credenciais em `.env` (nunca commitar — ver `.env.example`).

## Estado atual
**Funcional:** login, listagem de implantações, portal público de status (testado com dado real), CRUD completo de templates, criação de implantação a partir de template via RPC, isolamento multi-tenant por RLS (testado com JWT simulado: org certa vê tudo, org errada e anon veem zero).
**Falta pra testar no navegador com usuário de verdade:** criar seu primeiro usuário real e rodar `onboard_user_to_org` (ver seção abaixo) — depois disso, tudo que já está construído deve funcionar de ponta a ponta.
**Só a base existe:** CRUD de clientes (função de banco pronta, sem tela), gatilho de WhatsApp (função pronta, não conectada a nenhuma ação), reuniões/comentários/reclamações/briefings (só tabela), RBAC granular (hoje só 4 papéis fixos).

## Roadmap de validação
1. 8–10 conversas fora da Dinabox (implementadoras de ERP, consultorias de TI, instaladoras de equipamento B2B) via LinkedIn, confirmando a dor e quanto pagariam
2. Protótipo manual com 1 empresa real antes de aprofundar código
3. Fechar CRUD de template, cópia template→implantação, gatilho de WhatsApp — pra ter um loop demonstrável completo
4. Piloto pago com 3–5 clientes

## Mentalidade (o principal a não perder)
Preferir enxuto e validado a "feature completa" — não tentar competir em IA/NPS com o ImplantaWeb agora. Toda decisão de schema já pensa em multi-vertical (JSONB pra campos variáveis), mas o produto lança focado, não genérico demais. Validar com gente de fora da Dinabox antes de aprofundar qualquer feature nova.
