# Lu Wolcher Estética Avançada · Agendamento e Gestão

Sistema da Astrovia Solutions feito para a **Lu Wolcher Estética Avançada**: site de agendamento para as clientes, com painel para a proprietária e para cada profissional.

- **Sem `.env`**, o sistema abre em **modo demonstração**: os dados de exemplo ficam salvos no navegador. PIN da proprietária **1234** e das profissionais **1111 a 4444**.
- **Com `.env`** (dados do Supabase), o sistema funciona **online de verdade**: a dona, a equipe e as clientes usam o mesmo sistema, cada uma com o seu login.

---

## O que o sistema faz

| Área | Recursos |
|---|---|
| **Site de agendamento** | Busca e categorias de procedimentos, vários serviços de uma vez, profissional que faz cada serviço, horário de almoço de cada uma, "Meus horários", lembrete no celular (1 dia, 1 hora e 15 min antes) e botão "Salvar na agenda" |
| **Agenda** | Dia, semana, mês e período. Encaixe fora do horário (a cliente não vê), bloqueios editáveis, busca, lista de espera, sala compartilhada, aviso de conflito com sugestão de horário |
| **Atendimento** | Editar agendamento, observações, dividir serviços entre profissionais com valor, link de confirmação ✅, lembrete no WhatsApp e notificação no celular |
| **Caixa** | Pix, cartão e dinheiro, desconto e adicional, comissão automática. Pode ficar só com a dona (Ajustes → Privacidade) |
| **Clientes** | Ficha com anamnese e alertas, portfólio antes/depois, histórico com busca, edição de nome e WhatsApp |
| **Equipe** | Serviços que cada uma faz, tempo e comissão por procedimento, almoço, sala, acesso por e-mail criado pelo painel |
| **Gestão** | Relatórios e extratos em PDF, lucro real, clube de assinatura, fidelidade, aniversariantes, avaliações, avisos para a equipe, modo TV |
| **Notificações push** | Novo agendamento, cancelamento, alteração, confirmação, venda, avaliação, lista de espera, estoque baixo e resumo do dia |

---

## Colocar no ar para o período de teste

São três contas: **Supabase** (banco e login), **GitHub** (guarda o código) e **Vercel** (publica o site). As três têm plano gratuito.

### 1. Supabase (banco de dados)

1. Em supabase.com → **New project**. Nome: `lu-wolcher`. Região: **South America (São Paulo)**. Guarde a senha do banco.
2. Menu **SQL Editor** → **New query** → cole o arquivo `supabase/schema.sql` inteiro → **Run**. Deve aparecer "Success".
3. Menu **Authentication → Users → Add user → Create new user**: e-mail e senha da **proprietária**, com **Auto Confirm User** marcado.
4. Volte ao **SQL Editor** e rode a linha abaixo, trocando o e-mail:
   ```sql
   insert into staff(user_id, role, name, email)
   select id, 'admin', 'Gestão Lu Wolcher', email from auth.users where email = 'EMAIL-DA-DONA';
   ```
5. Menu **Authentication → Sign In / Providers**: deixe **Email** ligado e desligue "Allow new users to sign up" (só a gestão cria os logins).
6. Menu **Project Settings → API**: copie a **Project URL** e a chave **anon public**. Elas vão para a Vercel no passo 3.

### 2. GitHub (código)

1. Crie um repositório **privado** chamado `lu-wolcher`.
2. Envie o conteúdo desta pasta (`Sistema Lu Wolcher`). Pode ser pelo GitHub Desktop ou arrastando os arquivos em "Add file → Upload files".
   - **Não envie** a pasta `node_modules` nem um arquivo `.env` com chaves (o `.gitignore` já ignora os dois).

### 3. Vercel (site)

1. Em vercel.com → **Add New → Project** → importe o repositório `lu-wolcher`.
2. Framework: **Vite**. Build Command: `npm run build`. Output Directory: `dist`.
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = Project URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = chave anon public
4. **Deploy**. O link fica no formato `lu-wolcher.vercel.app`.

> Atenção: pelos termos da Vercel, o plano Hobby (gratuito) é para uso não comercial. Se preferir outra opção gratuita, o Netlify e o Cloudflare Pages permitem uso comercial e as configurações são as mesmas: build `npm run build`, pasta `dist` e as mesmas duas variáveis.

### 4. Primeiro acesso da proprietária

1. Abra o link → **Área da equipe** → entre com o e-mail e a senha da proprietária.
2. **Ajustes**: nome, WhatsApp, endereço, Instagram, horários, mensagens e notificações. Clique em **Salvar**.
3. **Catálogo**: cadastre os serviços, os preços, a duração e a comissão padrão. Se tiver uma planilha, use Ajustes → Importar planilha.
4. **Equipe**: cadastre cada profissional, com folgas, cor, e tempo e comissão por procedimento se precisar.
5. **Logins das profissionais**: Equipe → Editar → **Acesso da profissional** → e-mail e senha → **Criar acesso** (precisa da função `send-push` publicada, passo 5). Depois é só enviar o acesso pelo WhatsApp.
6. Copie o link de agendamento (Ajustes → Link de agendamento) e coloque na bio do Instagram e no WhatsApp.

### 5. Notificações no celular (push)

Elas chegam mesmo com o site fechado: novo agendamento (para a gestão e para a profissional), aviso da gestão e lembrete antes do atendimento.

1. **Supabase → SQL Editor**: rode de novo o `supabase/schema.sql` (pode rodar por cima, não apaga dados). Depois abra o `ATIVAR-PUSH.sql` (fica na pasta Lu Wolcher, fora do GitHub), troque `SEU-PROJETO` pelo código do projeto (o que aparece na Project URL) e rode.
2. **Supabase → Edge Functions → Deploy a new function → Via Editor**: nome `send-push`. Cole o conteúdo de `supabase/functions/send-push/index.ts` e clique em **Deploy**. Depois, nos detalhes da função, **desligue "Verify JWT"** (Enforce JWT verification) e salve.
3. **Supabase → Edge Functions → Secrets**: adicione os 4 segredos do arquivo `CHAVES-PUSH.txt`.
4. **Vercel → Environment Variables**: adicione `VITE_VAPID_PUBLIC_KEY` do tipo **Config**, com o valor do `CHAVES-PUSH.txt`, e faça o Redeploy.
5. **No celular**: abra o site, entre na Área da equipe e toque em **Ativar** no aviso. Também dá em Ajustes → Notificações → Ativar neste aparelho. Para testar, use **Enviar teste**.
   - **Android**: pelo Chrome já funciona. Também dá para instalar pelo menu ⋮ → "Adicionar à tela inicial".
   - **iPhone (iOS 16.4 ou mais novo)**: primeiro toque em Compartilhar → **Adicionar à Tela de Início**. Depois abra pelo ícone da Lu Wolcher e ative ali. No Safari comum, a Apple não entrega push.

### Dicas para o teste

- **Notificações**: cada aparelho precisa tocar em "Ativar" no aviso do painel, ou em Ajustes → Notificações → Permitir aqui. Os pop-ups aparecem com o painel aberto, e a agenda atualiza sozinha a cada minuto.
- **No celular**: abra o site e use "Adicionar à tela inicial". Ele passa a abrir como um aplicativo.
- **Pausa do Supabase**: no plano gratuito, projetos sem nenhum acesso por 7 dias são pausados. Com uso diário, isso não acontece.
- **Fotos**: o portfólio usa o bucket `portfolio` do Supabase Storage, que o `schema.sql` já cria. As fotos da ficha só aparecem no site se "Mostrar no site" for marcado.

---

## Para desenvolver

```bash
npm install
npm run dev          # http://localhost:5173 (modo demonstração sem .env)
npm run build        # versão de produção em dist/
npm run build:demo   # demonstração em um único arquivo: dist-demo/index.html
```

```
src/
  config/brand.js        ← nome, logo e textos da marca
  lib/messages.js        ← modelos das mensagens de WhatsApp (editáveis em Ajustes)
  lib/pdf.js             ← relatórios em PDF
  lib/commission.js      ← regras de comissão e tempo por profissional
  components/Notifier.jsx← pop-ups e notificações da equipe
  data/demo.js | supabase.js ← modo demonstração | banco real
  pages/Booking.jsx      ← site da cliente
  pages/staff/*          ← painel da gestão e das profissionais
supabase/schema.sql      ← tabelas, regras de acesso (RLS) e funções
```

### Segurança

- As clientes só veem serviços, profissionais (sem telefone) e horários ocupados, sem nomes.
- O agendamento passa pela função `book_appointment`: o preço e a duração saem do banco (com o tempo próprio de cada profissional), e ela impede que duas clientes marquem o mesmo horário.
- As profissionais **não acessam** as tabelas de clientes e agendamentos direto. Elas usam as funções `pro_*`, que entregam só a agenda dela, sem contato das clientes quando a privacidade está ligada.
- Vendas, estoque e conclusão do atendimento acontecem juntos, em uma única operação (`create_sale`). Cada profissional só lança vendas dela e só a gestão pode estornar.
