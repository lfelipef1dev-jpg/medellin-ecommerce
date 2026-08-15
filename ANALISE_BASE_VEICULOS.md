# Análise da base de veículos – Medellin

## Onde está a base

| Onde | O quê |
|------|--------|
| **qb-city/resources/qb-core/shared/vehicles.lua** | Lista principal: **~1975 veículos** com `model`, `name`, `brand`, `price`, `category`, `type`, `shop` |
| **qb-city/resources/medellin-assets-vehicles/vehicles/** | Imagens: arquivos `<model>.png` ou `.webp` (quem tem foto) |
| **RELATORIO_VEICULOS_VIP_IMAGEM_SPAWN.csv** | Relatório: cada veículo + coluna `hasImage` (True/False) |
| **LEIA-ME_VEICULOS_VIP.txt** | Resumo: 1262 veículos no relatório, 741 com imagem, 379 “OK para Loja VIP” |

Ou seja: você tem **mais de 1900 veículos** na base (vehicles.lua); o número exato depende de quantas linhas são entradas de veículo (model/name/price/category).

---

## Estrutura de cada veículo (vehicles.lua)

- **model** – código de spawn (ex.: `fugitive`, `dubsta`, `issi3`)
- **name** – nome que aparece na loja (ex.: Fugitive, Dubsta, Issi Classic) → **é esse o “nome dos veículos” do modelo Start que você mandou**
- **brand** – marca (Dinka, Benefactor, etc.)
- **price** – preço em dólar do jogo (ex.: 32000, 34200)
- **category** – categoria na base (veja abaixo)
- **type** – automobile, bike, plane, heli, boat, etc.
- **shop** – pdm, luxury, etc.

---

## Categorias que já existem na base

São as **categorias GTA / FiveM** usadas no `vehicles.lua`. Exemplos (conforme seu LISTA_COMPLETA_VEICULOS e vehicles.lua):

- compacts, sedans, suvs, coupes, muscle, sports, super  
- sportsclassics, offroad, motorcycles, cycles  
- vans, commercial, utility, industrial, service  
- emergency, military  
- planes, helicopters, boats  
- trailers, trains, openwheel  

Ou seja: a base já está **toda categorizada** por tipo (esportivo, muscle, SUV, militar, avião, barco, etc.). Dá para usar essas mesmas categorias na loja ou mapear para nomes “amigáveis”.

---

## Como encaixar no modelo “Start” e nas categorias da outra base

Na imagem de exemplo (categoria Start) aparecem nomes como: **Monros, PC Cross, Pigalle, 190 WB, Buffalo STX, Yosemite, Infernus Classic, Neon, Buffalo S, Reaper, Dubsta, Felon, Fugitive, Khamellian**.

No seu projeto, o equivalente a “nome do veículo” é o campo **name** do `vehicles.lua` (ex.: Fugitive, Dubsta, Felon). Ou seja: **para a loja, use `name` como título do card** (e, se quiser, `brand` como subtítulo ou filtro).

A outra base (Santa) usa subcategorias sob “VEÍCULOS”, por exemplo:

- Veículos de Combate  
- Veículos Esportivos  
- Veículos de Coleção  
- Veículos Musculo  
- Veículos Clássicos  
- Veículos Militares  
- Veículos de Trabalho / Lazer / Serviço  
- Motocicletas, Bicicletas  
- Aéreos, Marítimos  

No Medellin dá para fazer um **mapeamento direto** da sua base para esse estilo:

| Categoria “Santa” | Na sua base (vehicles.lua) |
|-------------------|----------------------------|
| Esportivos        | `category = 'sports'` ou `'super'` |
| Musculo           | `category = 'muscle'` |
| Clássicos         | `category = 'sportsclassics'` ou similares |
| Militares         | `category = 'military'` |
| Motocicletas      | `category = 'motorcycles'` |
| Aéreos            | `type = 'plane'` ou `'heli'` |
| Marítimos         | `type = 'boat'` |
| Trabalho / Serviço| `category = 'commercial'`, `'utility'`, `'service'` |
| Combate           | pode ser military + parte de offroad/armored |

Não é obrigatório criar novas categorias na base: você pode **só mudar o rótulo** na loja (ex.: “sports” → “Veículos Esportivos”).

---

## Imagens: quantos “dá pra vender” hoje

- **Com imagem no servidor (medellin-assets-vehicles):** ~741 (pelo relatório em LEIA-ME_VEICULOS_VIP.txt).  
- **“OK para Loja VIP” (têm imagem + categoria VIP):** 379.  
- **Na loja web (vip-store-web) hoje:** só **32** em `assets/especial/` (veículos especiais) + 45 no `veiculos-data.js` (32 com foto + 13 variantes com imagem do irmão).

Para **trazer todos os veículos que der para vender** na loja:

1. **Quem pode aparecer:** qualquer um que tenha **imagem** em `medellin-assets-vehicles/vehicles/` (ou que você passe a ter em algum lugar que a loja use).  
2. **Fonte de dados:** usar a lista do **vehicles.lua** (ou o CSV que já tem `hasImage`) para montar o JSON/JS da loja.  
3. **Preço na loja:** hoje a loja usa preços em R$ (ex.: 120–280). A base usa preço em “dólar do jogo”. É preciso definir regra (tabela de conversão ou preço por categoria/faixa) para exibir R$ na web.  
4. **Fotos na web:** a loja hoje usa `vip-store-web/assets/especial/`. Para os 379 (ou 741) seria preciso **copiar/sincronizar** as imagens de `medellin-assets-vehicles/vehicles/` para a pasta da loja (ou servir de um mesmo CDN com o mesmo nome `model.png`).

Resumo: **dá para vender todos que tiverem imagem**; hoje “todos” seria até **~741** (ou 379 se restringir às categorias VIP); o limite prático é ter essas imagens disponíveis para a loja e uma lista (ex.: exportada do vehicles.lua + hasImage) com **name**, **model**, **price** (e categoria) para cada um.

---

## Próximos passos sugeridos

1. **Rodar de novo o script**  
   `scripts\VERIFICAR_VEICULOS_IMAGEM_SPAWN.ps1`  
   para atualizar o CSV e as listas (LISTA_OK_PARA_VIP.txt, etc.) com a base atual (~1975 veículos).

2. **Definir categorias na loja**  
   - Ou usar as mesmas da base (compacts, sedans, sports, muscle, motorcycles, planes, boats, etc.) e só trocar o rótulo (ex.: “Veículos Esportivos”).  
   - Ou mapear para o modelo Santa (Combate, Esportivos, Coleção, Musculo, Clássicos, Militares, Trabalho, Lazer, Serviço, Motocicletas, Bicicletas, Aéreos, Marítimos).

3. **Para a categoria Start (e outras)**  
   - Fonte: `vehicles.lua` (ou CSV com hasImage).  
   - Nome no card: campo **name** (ex.: Fugitive, Dubsta, Felon).  
   - Filtro por categoria/tier: por `category` + faixa de `price` (ex.: Start = entrada, preço até X).

4. **Exportar lista “para vender”**  
   - Gerar um JSON/CSV a partir do vehicles.lua + relatório de imagens (só `hasImage = True`), com: model, name, brand, category, price (e, se quiser, preço em R$ já convertido). Esse arquivo pode alimentar a página de veículos da loja (como o modelo Start que você mandou).

Se quiser, no próximo passo podemos: (a) mapear cada categoria da base para um rótulo “Santa”; (b) desenhar a regra de preço Start/Elite/Colecionáveis/Lendários em cima do `price` do jogo; ou (c) esboçar o formato do JSON da loja com todos os veículos que têm imagem.
