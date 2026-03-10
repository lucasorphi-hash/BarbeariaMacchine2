# Barbearia Macchine - Sistema de Agendamento Online

Este é o sistema de agendamento online da **Barbearia Macchine**, localizada em Boituva, SP. O aplicativo permite que os clientes escolham serviços, selecionem datas e horários disponíveis, e confirmem o agendamento via WhatsApp.

## 🚀 Funcionalidades

- **Agendamento Intuitivo:** Passo a passo para escolha de serviço, data e hora.
- **Validação de Horários:** Impede agendamentos duplicados e respeita o horário de funcionamento (Terça a Sábado).
- **Integração com WhatsApp:** Envio automático de mensagem de confirmação para o barbeiro.
- **Painel Administrativo:** Acesso restrito para o barbeiro visualizar e gerenciar os agendamentos do dia.
- **Design Moderno:** Interface responsiva com tema escuro e detalhes em dourado, focada na experiência do usuário.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS, Motion (animações), Lucide React (ícones).
- **Backend:** Express (Node.js).
- **Banco de Dados:** SQLite / LibSQL (Turso).
- **Build Tool:** Vite.

## 📦 Como Rodar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone <url-do-seu-repositorio>
   cd barbearia-macchine
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` baseado no `.env.example`.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`.

## 🛡️ Painel Administrativo

Para acessar o painel de agendamentos:
1. Role até o rodapé da página.
2. Clique em "Acesso Restrito".
3. Digite a senha configurada.

---

Desenvolvido para a **Barbearia Macchine**.
