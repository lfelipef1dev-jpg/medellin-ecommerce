# Como o fluxo de pagamento foi feito (checkout → API → Mercado Pago → entrega)

## 1. O que o código espera

### Checkout (site em produção – HTTPS)
- **Arquivo:** `checkout.html` (script no início).
- Quando você está em **https://roleplaymedellin.com.br/checkout**:
  - O site usa: **https://api.roleplaymedellin.com.br**
  - Ao clicar em "Pagar com Mercado Pago", o navegador faz:
    - `POST https://api.roleplaymedellin.com.br/api/create-preference`
    - Com: carrinho (itens), ID do painel (account_id), etc.
- Se você passar `?api_url=URL` na URL do checkout, o site usa essa URL em vez da acima.

### API (Node – porta 3000)
- **Pasta:** `vip-store-web/api/`
- **Arquivo:** `server.js`
- **Variáveis do `.env`:**
  - `MP_ACCESS_TOKEN` – token do Mercado Pago
  - `FRONT_URL=https://roleplaymedellin.com.br` – para onde o MP redireciona após pagar
  - `WEBHOOK_URL=https://api.roleplaymedellin.com.br/api/webhook/mp` – URL que o MP chama quando o pagamento é aprovado
  - `DB_*` – MySQL (medellin_loja_orders, medellin_loja_pending)
- **Rotas usadas no fluxo:**
  1. **POST /api/create-preference** – recebe o carrinho do checkout, cria preferência no MP, grava pedido em `medellin_loja_orders`, devolve o link do MP para o usuário pagar.
  2. **POST /api/webhook/mp** – recebe a notificação do Mercado Pago (pagamento aprovado), grava em `medellin_loja_pending` para o FiveM entregar no jogo.

### Mercado Pago
- Ao criar a preferência, a API envia:
  - `back_urls` = FRONT_URL (roleplaymedellin.com.br/checkout?success=1 ou 0)
  - `notification_url` = WEBHOOK_URL (api.roleplaymedellin.com.br/api/webhook/mp)
- O MP só aceita webhook em **HTTPS**. A URL do webhook tem que ser acessível na internet.

### FiveM (entrega)
- Recurso lê a tabela `medellin_loja_pending`.
- Para skins/armas, entrega no inventário do jogador (account_id/license).

---

## 2. Fluxo completo (como foi desenhado)

```
[Cliente] Abre roleplaymedellin.com.br/checkout (HTTPS)
    ↓
[Checkout] POST https://api.roleplaymedellin.com.br/api/create-preference
    ↓
[API no seu PC] Porta 3000
  - Valida carrinho (products.js)
  - Grava medellin_loja_orders
  - Cria preferência no Mercado Pago (com WEBHOOK_URL e FRONT_URL)
  - Devolve link do MP
    ↓
[Checkout] Redireciona o cliente para o Mercado Pago
    ↓
[Cliente] Paga no MP (PIX/cartão/boleto)
    ↓
[Mercado Pago] Chama WEBHOOK_URL: POST https://api.roleplaymedellin.com.br/api/webhook/mp
    ↓
[API no seu PC] Recebe webhook
  - Busca pagamento no MP, confere status approved
  - Grava medellin_loja_pending (license/account_id, product_type, product_id)
  - Atualiza medellin_loja_orders para paid
    ↓
[FiveM] medellin-loja-entregas lê medellin_loja_pending e entrega no jogo
```

Para esse fluxo funcionar em produção, **api.roleplaymedellin.com.br** precisa apontar para a sua API (porta 3000) e ser **HTTPS**. Isso é feito com:
- **Cloudflare Tunnel** (api.roleplaymedellin.com.br → localhost:3000), ou
- **ngrok** + usar no checkout `?api_url=https://xxx.ngrok-free.app` (e no MP cadastrar essa URL como webhook).

---

## 3. O que precisa estar ligado para funcionar

| O quê | Onde | Observação |
|-------|------|------------|
| API rodando | PC, porta 3000 | `node server.js` na pasta `vip-store-web/api` |
| .env | vip-store-web/api/.env | MP_ACCESS_TOKEN, FRONT_URL, WEBHOOK_URL, DB_* |
| api.roleplaymedellin.com.br em HTTPS | Túnel ou servidor | Cloudflare Tunnel ou ngrok apontando para localhost:3000 |
| Webhook no Mercado Pago | Painel MP | URL = mesma do WEBHOOK_URL (https://api.roleplaymedellin.com.br/api/webhook/mp ou a URL do ngrok) |

Quando a venda da M4 Dragon funcionou, esses pontos estavam ok: o checkout conseguia chamar a API e o MP conseguia chamar o webhook na API.
