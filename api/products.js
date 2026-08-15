/**
 * Catalogo de produtos da Loja VIP
 * TODOS os precos sao definidos aqui (server-side)
 * O cliente envia apenas productId e quantity - o preco vem daqui
 */

const PRODUCTS = {
  // ========== VIPs ==========
  'vip_bronze': { name: 'VIP Bronze', price: 29.90, type: 'vip', productType: 'vip' },
  'vip_prata': { name: 'VIP Prata', price: 49.90, type: 'vip', productType: 'vip' },
  'vip_ouro': { name: 'VIP Ouro', price: 79.90, type: 'vip', productType: 'vip' },
  'vip_platinum': { name: 'VIP Platinum', price: 129.90, type: 'vip', productType: 'vip' },
  'vip_black': { name: 'VIP Black', price: 199.90, type: 'vip', productType: 'vip' },
  'vip_policia': { name: 'VIP Policia', price: 99.90, type: 'vip', productType: 'vip' },
  'vip_pvp': { name: 'VIP PVP', price: 59.90, type: 'vip', productType: 'vip' },
  
  // ========== VIPs Faccao ==========
  'vip_faccao_prata': { name: 'VIP Faccao Prata', price: 69.90, type: 'vip', productType: 'vip_faccao' },
  'vip_faccao_ouro': { name: 'VIP Faccao Ouro', price: 99.90, type: 'vip', productType: 'vip_faccao' },
  'vip_faccao_premium': { name: 'VIP Faccao Premium', price: 149.90, type: 'vip', productType: 'vip_faccao' },
  
  // ========== Promocoes (precos = vips-temporadas.html) ==========
  // Ano Novo
  'promo_oferta_ano_novo': { name: 'Oferta Ano Novo', price: 32.51, type: 'promo', productType: 'promo' },
  'promo_vip_ano_novo': { name: 'VIP Ano Novo', price: 48.59, type: 'promo', productType: 'vip' },
  'promo_super_combo_ano_novo': { name: 'Super Combo Ano Novo', price: 95.71, type: 'promo', productType: 'combo' },
  'promo_medellin_ano_novo': { name: 'Medellin Edition Ano Novo', price: 149.90, type: 'promo', productType: 'combo' },
  // Black Friday
  'promo_oferta_blackfriday': { name: 'Oferta Black Friday', price: 30.00, type: 'promo', productType: 'promo' },
  'promo_vip_blackfriday': { name: 'VIP Black Friday', price: 50.00, type: 'promo', productType: 'vip' },
  'promo_super_combo_blackfriday': { name: 'Super Combo Black Friday', price: 95.00, type: 'promo', productType: 'combo' },
  'promo_medellin_blackfriday': { name: 'Medellin Edition Black Friday', price: 139.90, type: 'promo', productType: 'combo' },
  // Carnaval
  'promo_oferta_carnaval': { name: 'Oferta Carnaval', price: 48.86, type: 'promo', productType: 'promo' },
  'promo_vip_carnaval': { name: 'VIP Carnaval', price: 73.04, type: 'promo', productType: 'vip' },
  'promo_super_combo_carnaval': { name: 'Super Combo Carnaval', price: 143.86, type: 'promo', productType: 'combo' },
  'promo_medellin_carnaval': { name: 'Medellin Edition Carnaval', price: 199.90, type: 'promo', productType: 'combo' },
  // Ferias
  'promo_oferta_ferias': { name: 'Oferta Férias', price: 35.00, type: 'promo', productType: 'promo' },
  'promo_vip_ferias': { name: 'VIP Férias', price: 55.00, type: 'promo', productType: 'vip' },
  'promo_super_combo_ferias': { name: 'Super Combo Férias', price: 100.00, type: 'promo', productType: 'combo' },
  'promo_medellin_ferias': { name: 'Medellin Edition Férias', price: 149.90, type: 'promo', productType: 'combo' },
  // Halloween
  'promo_oferta_halloween': { name: 'Oferta Halloween', price: 35.00, type: 'promo', productType: 'promo' },
  'promo_vip_halloween': { name: 'VIP Halloween', price: 55.00, type: 'promo', productType: 'vip' },
  'promo_super_combo_halloween': { name: 'Super Combo Halloween', price: 100.00, type: 'promo', productType: 'combo' },
  'promo_medellin_halloween': { name: 'Medellin Edition Halloween', price: 149.90, type: 'promo', productType: 'combo' },
  // Natal
  'promo_oferta_natal': { name: 'Oferta Natal', price: 35.00, type: 'promo', productType: 'promo' },
  'promo_vip_natal': { name: 'VIP Natal', price: 55.00, type: 'promo', productType: 'vip' },
  'promo_super_combo_natal': { name: 'Super Combo Natal', price: 100.00, type: 'promo', productType: 'combo' },
  'promo_medellin_natal': { name: 'Medellin Edition Natal', price: 149.90, type: 'promo', productType: 'combo' },
  // Pascoa
  'promo_oferta_pascoa': { name: 'Oferta Páscoa', price: 35.00, type: 'promo', productType: 'promo' },
  'promo_vip_pascoa': { name: 'VIP Páscoa', price: 55.00, type: 'promo', productType: 'vip' },
  'promo_super_combo_pascoa': { name: 'Super Combo Páscoa', price: 100.00, type: 'promo', productType: 'combo' },
  'promo_medellin_pascoa': { name: 'Medellin Edition Páscoa', price: 149.90, type: 'promo', productType: 'combo' },
  
  // ========== Mochilas ==========
  'mochila_10kg': { name: 'Mochila 10kg', price: 9.90, type: 'mochila', productType: 'mochila' },
  'mochila_20kg': { name: 'Mochila 20kg', price: 14.90, type: 'mochila', productType: 'mochila' },
  'mochila_80kg': { name: 'Mochila 80kg', price: 29.90, type: 'mochila', productType: 'mochila' },
  'mochila_120kg': { name: 'Mochila 120kg', price: 39.90, type: 'mochila', productType: 'mochila' },
  'mochila_150kg': { name: 'Mochila 150kg', price: 49.90, type: 'mochila', productType: 'mochila' },
  'mochila_200kg': { name: 'Mochila 200kg', price: 59.90, type: 'mochila', productType: 'mochila' },
  'mochila_400kg': { name: 'Mochila 400kg', price: 99.90, type: 'mochila', productType: 'mochila' },
  
  // ========== Rolygram ==========
  'rolygram_500': { name: 'Rolygram 500', price: 5.00, type: 'rolygram', productType: 'rolygram' },
  'rolygram_1000': { name: 'Rolygram 1000', price: 9.90, type: 'rolygram', productType: 'rolygram' },
  'rolygram_2000': { name: 'Rolygram 2000', price: 19.90, type: 'rolygram', productType: 'rolygram' },
  'rolygram_verificado': { name: 'Rolygram Verificado', price: 29.90, type: 'rolygram', productType: 'rolygram' },
  
  // ========== Outros ==========
  'outros_troca_nome': { name: 'Troca de Nome', price: 9.90, type: 'outros', productType: 'outros' },
  'outros_slot_personagem': { name: 'Slot de Personagem', price: 19.90, type: 'outros', productType: 'outros' },
  'outros_reset_aparencia': { name: 'Reset Aparencia', price: 9.90, type: 'outros', productType: 'outros' },
  'outros_placa_personalizada': { name: 'Placa Personalizada', price: 14.90, type: 'outros', productType: 'outros' },
  
  // ========== Armas Exclusivas ==========
  'arma_minigun_raio_500': { name: 'Minigun Raio (500)', price: 180.00, type: 'arma', productType: 'arma' },
  'arma_minigun_500': { name: 'Minigun (500)', price: 180.00, type: 'arma', productType: 'arma' },
  'arma_rpg_50': { name: 'RPG (50)', price: 160.00, type: 'arma', productType: 'arma' },
  'arma_rpg_teleguiado_50': { name: 'RPG Teleguiado (50)', price: 200.00, type: 'arma', productType: 'arma' },
  'arma_lancador_granadas_50': { name: 'Lancador de Granadas (50)', price: 150.00, type: 'arma', productType: 'arma' },
  'arma_fogo_artificio_50': { name: 'Fogo de Artificio (50)', price: 90.00, type: 'arma', productType: 'arma' },
  'arma_railgun': { name: 'Railgun', price: 130.00, type: 'arma', productType: 'arma' },
  'arma_railgun_xm3': { name: 'Railgun XM3', price: 160.00, type: 'arma', productType: 'arma' },

  // ========== Armas Raras (arma + munição inclusa) ==========
  'arma_raras_appistol_100': { name: 'Pistola AP + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_revolver_pesado_100': { name: 'Revolver Pesado + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_pumpshotgun_mk2_100': { name: 'Pump Shotgun Mk II + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_gusenberg_150': { name: 'Gusenberg Sweeper + 150 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_musket_100': { name: 'Musket + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_pistol50_100': { name: 'Pistola .50 + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_heavypistol_100': { name: 'Heavy Pistol + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_navyrevolver_100': { name: 'Navy Revolver + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_vintagepistol_100': { name: 'Vintage Pistol + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_tec9_150': { name: 'Tec-9 (Machine Pistol) + 150 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_smg_mk2_100': { name: 'SMG Mk II + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },
  'arma_raras_marksmanpistol_100': { name: 'Marksman Pistol + 100 Munições', price: 145.52, type: 'arma', productType: 'arma' },

  // ========== Municao Especial ==========
  'municao_minigun_500': { name: 'Municao Minigun (500)', price: 35.00, type: 'municao', productType: 'municao' },
  'municao_minigun_200': { name: 'Municao Minigun (200)', price: 20.00, type: 'municao', productType: 'municao' },
  'municao_rpg_50': { name: 'Municao RPG (50)', price: 30.00, type: 'municao', productType: 'municao' },
  'municao_rpg_20': { name: 'Municao RPG (20)', price: 15.00, type: 'municao', productType: 'municao' },
  'municao_stinger_50': { name: 'Municao Stinger (50)', price: 35.00, type: 'municao', productType: 'municao' },
  'municao_grenadelauncher_50': { name: 'Municao Lançador Granadas (50)', price: 30.00, type: 'municao', productType: 'municao' },
  'municao_grenadelauncher_20': { name: 'Municao Lançador Granadas (20)', price: 15.00, type: 'municao', productType: 'municao' },

  // ========== Vouchers (Vale Casa) ==========
  'vouchers_vale_casa_emerald': { name: 'Vale Casa Emerald', price: 19.25, type: 'voucher', productType: 'voucher' },
  'vouchers_vale_casa_diamond': { name: 'Vale Casa Diamond', price: 24.05, type: 'voucher', productType: 'voucher' },
  'vouchers_vale_casa_ruby': { name: 'Vale Casa Ruby', price: 26.45, type: 'voucher', productType: 'voucher' },
  'vouchers_vale_casa_sapphire': { name: 'Vale Casa Sapphire', price: 33.68, type: 'voucher', productType: 'voucher' },
  'vouchers_vale_casa_amethyst': { name: 'Vale Casa Amethyst', price: 38.48, type: 'voucher', productType: 'voucher' },
  'vouchers_vale_casa_amber': { name: 'Vale Casa Amber', price: 48.10, type: 'voucher', productType: 'voucher' },

  // ========== Salários ==========
  'salario_iniciante': { name: 'Salário Iniciante', price: 23.48, type: 'salario', productType: 'salario' },
  'salario_herdeiro': { name: 'Salário Herdeiro', price: 46.96, type: 'salario', productType: 'salario' },
  'salario_veio_da_lancha': { name: 'Salário Veio da lancha', price: 70.44, type: 'salario', productType: 'salario' },
  'salario_patrao': { name: 'Salário Patrão', price: 114.78, type: 'salario', productType: 'salario' },
  'salario_venci_na_vida': { name: 'Salário Venci na vida', price: 161.74, type: 'salario', productType: 'salario' },
  'salario_deuses': { name: 'Salário dos Deuses', price: 232.18, type: 'salario', productType: 'salario' },

  // ========== Penthouse (entrega Vale Casa correspondente) ==========
  'penthouse_nivel_1': { name: 'Penthouse Nivel 1', price: 966.60, type: 'penthouse', productType: 'penthouse' },
  'penthouse_nivel_2': { name: 'Penthouse Nivel 2', price: 1449.90, type: 'penthouse', productType: 'penthouse' },
  'penthouse_nivel_3': { name: 'Penthouse Nivel 3', price: 1928.01, type: 'penthouse', productType: 'penthouse' },
  'penthouse_nivel_4': { name: 'Penthouse Nivel 4', price: 2894.61, type: 'penthouse', productType: 'penthouse' },
  'penthouse_nivel_5': { name: 'Penthouse Nivel 5', price: 3856.02, type: 'penthouse', productType: 'penthouse' },

  // ========== Farm ==========
  'farm_ativo': { name: 'Farm Ativo', price: 675.74, type: 'farm', productType: 'farm' },
  'farm_afk': { name: 'Farm AFK', price: 675.74, type: 'farm', productType: 'farm' },
  'farm_tecla': { name: 'Farm Tecla', price: 675.74, type: 'farm', productType: 'farm' },
  'farm_plantio': { name: 'Farm Plantio', price: 675.74, type: 'farm', productType: 'farm' },

  // ========== Scripts FiveM (venda para outros servidores) ==========
  'script_anticheat': { name: 'Anti-Cheat System', price: 79.90, type: 'script', productType: 'script' },
  'script_warsystem': { name: 'War System', price: 99.90, type: 'script', productType: 'script' },
  'script_minigames': { name: 'Mini Jogos', price: 49.90, type: 'script', productType: 'script' },
  'script_fishing': { name: 'Sistema de Pesca', price: 89.90, type: 'script', productType: 'script' },
  'script_faccoes': { name: 'Sistema de Facções', price: 129.90, type: 'script', productType: 'script' },
  'script_races': { name: 'Sistema de Corridas', price: 69.90, type: 'script', productType: 'script' },
  'script_empregos': { name: 'Sistema de Empregos', price: 89.90, type: 'script', productType: 'script' },
  'script_eventos': { name: 'Sistema de Eventos', price: 69.90, type: 'script', productType: 'script' },
  'script_spawn': { name: 'Sistema de Spawn', price: 49.90, type: 'script', productType: 'script' },
  'script_rewards': { name: 'Sistema de Rewards', price: 39.90, type: 'script', productType: 'script' },
};

// Skins (lendárias, épicas, padrão) – mesmo catálogo do frontend
try {
  const skinsCatalog = require('./skins-catalog-server.js');
  if (Array.isArray(skinsCatalog)) {
    skinsCatalog.forEach(s => {
      PRODUCTS[s.id] = { name: s.label, price: s.preco, type: 'skin', productType: 'skin' };
    });
  }
} catch (e) { /* skins opcional */ }

let getGrandesBauProduct = () => null;
try {
  getGrandesBauProduct = require('./grandes-baus-products.js').getGrandesBauProduct;
} catch (e) { /* Grandes Baús opcional */ }

let getPetProduct = () => null;
try {
  getPetProduct = require('./pets-products.js').getPetProduct;
} catch (e) { /* Pets opcional */ }

let getVehicleProduct = () => null;
try {
  getVehicleProduct = require('./vehicles-products.js').getVehicleProduct;
} catch (e) { /* Veículos/Blindados opcional */ }

/**
 * Busca produto pelo ID (catálogo fixo + Grandes Baús + Pets + Veículos/Blindados)
 * @param {string} productId 
 * @returns {object|null} Produto ou null se nao encontrado
 */
function getProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  if (PRODUCTS[productId]) return PRODUCTS[productId];
  const gb = getGrandesBauProduct(productId);
  if (gb) return { name: gb.name, price: gb.price, type: gb.type, productType: gb.productType, vehicleModel: gb.vehicleModel };
  const pet = getPetProduct(productId);
  if (pet) return pet;
  const veh = getVehicleProduct(productId);
  if (veh) return veh;
  return null;
}

/**
 * Valida e calcula total dos items do carrinho
 * @param {Array} items Array de { productId, quantity }
 * @returns {{ valid: boolean, items: Array, total: number, error?: string }}
 */
function validateAndCalculateCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, items: [], total: 0, error: 'Carrinho vazio' };
  }
  
  const validatedItems = [];
  let total = 0;
  
  for (const rawItem of items) {
    const productId = rawItem.productId || rawItem.product_id || rawItem.id;
    if (!productId) {
      return { valid: false, items: [], total: 0, error: 'Item sem productId' };
    }
    
    const product = getProduct(productId);
    if (!product) {
      return { valid: false, items: [], total: 0, error: `Produto nao encontrado: ${productId}` };
    }
    
    const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
    const itemTotal = product.price * qty;
    total += itemTotal;
    
    const validatedItem = {
      productId,
      name: product.name,
      price: product.price,
      quantity: qty,
      productType: product.productType,
      itemTotal
    };
    if (product.vehicleModel) validatedItem.vehicleModel = product.vehicleModel;
    validatedItems.push(validatedItem);
  }
  
  return { valid: true, items: validatedItems, total: Math.round(total * 100) / 100 };
}

module.exports = {
  PRODUCTS,
  getProduct,
  validateAndCalculateCart
};
