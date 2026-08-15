/**
 * Catálogo server-side de veículos (blindados + especial/aeronaves) para validação de preço.
 * productId blindado_* ou full_* → entrega com product_id completo (hub extrai model).
 * productId especial_<model> → entrega com product_id = model (vehicleModel).
 */
const path = require('path');
const fs = require('fs');

// Especial: carrega JSON (mesmo conteúdo do front)
let ESPECIAL_MAP = {};
try {
  const jsonPath = path.join(__dirname, '..', 'data', 'veiculos-especial.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const arr = JSON.parse(raw);
  if (Array.isArray(arr)) {
    arr.forEach((v) => {
      const model = (v.model || '').toLowerCase();
      if (model) ESPECIAL_MAP[model] = { name: v.nome || v.name || model, price: Number(v.preco) || 0 };
    });
  }
} catch (e) {
  // fallback vazio
}

// Blindados 16 tiros (model -> { name, price }). Preço pneu full = price + 15
const BLINDADOS_16 = {
  baller5: { name: 'Baller LE (Armored)', price: 140 }, baller6: { name: 'Baller LE LWB (Armored)', price: 150 },
  schafter5: { name: 'Schafter 5', price: 130 }, xls2: { name: 'XLS 2', price: 125 }, kuruma2: { name: 'Kuruma Armored', price: 145 },
  wrarmoredg63: { name: 'G63 Blindado', price: 180 }, wrarmoredconada: { name: 'Conada Blindado', price: 180 },
  wrarmoredurus: { name: 'Urus Blindada', price: 185 }, wrarmoredct: { name: 'CT Blindado', price: 175 },
  wrarmoredcayenne: { name: 'Cayenne GT Blindado', price: 195 }, wrarmoredgle: { name: 'GLE63 Blindado', price: 190 },
  wrarmoredjettagli: { name: 'Jetta GLI Blindado', price: 170 }, wrarmoredm3g80c: { name: 'M3 G80C Blindado', price: 195 },
  wrarmoredm5: { name: 'M5 SL Blindado', price: 195 }, wrarmoredmacan: { name: 'Macan Blindado', price: 185 },
  wrarmoredrs7: { name: 'RS7 Blindado', price: 195 }, wrarmoredvelar: { name: 'Velar Blindado', price: 190 },
  wrarmoredx7m60i: { name: 'X7 M60i Blindado', price: 200 }, wrarmoredx6: { name: 'X6 F96 Blindado', price: 195 },
  armored18velar: { name: 'Velar Blindada', price: 185 }, armoredx7m60i: { name: 'X7 2024 Blindada', price: 195 },
  wrarmoredgls600: { name: 'GLS 600 Blindado', price: 195 }, wrarmoredpurosangue: { name: 'Purosangue Blindado', price: 200 },
  wrarmoredvenatus: { name: 'Venatus Blindado', price: 195 }, wrarmoredescalade: { name: 'Armored Escalade', price: 190 },
};
const BLINDADOS_32 = {
  nightshark: { name: 'Nightshark', price: 230 }, insurgent: { name: 'Insurgent Pick-Up', price: 260 },
  insurgent2: { name: 'Insurgent', price: 260 }, insurgent3: { name: 'Insurgent Custom', price: 270 },
  menacer: { name: 'Menacer', price: 250 }, barrage: { name: 'Barrage', price: 240 }, technical3: { name: 'Technical Custom', price: 240 },
};
const FULL_BLINDADOS = {
  rhino: { name: 'Rhino', price: 240 }, khanjali: { name: 'Khanjali', price: 240 }, apc: { name: 'APC', price: 260 },
  chernobog: { name: 'Chernobog', price: 280 }, halftrack: { name: 'Half-Track', price: 250 },
};
const FULL_VOADORES = {
  wrarmoredconada: { name: 'Conada Blindado', price: 320 }, savage: { name: 'Savage', price: 220 },
  hunter: { name: 'FH-1 Hunter', price: 250 }, akula: { name: 'Akula', price: 240 }, buzzard: { name: 'Buzzard Attack Chopper', price: 220 },
  valkyrie: { name: 'Valkyrie', price: 230 }, annihilator: { name: 'Annihilator', price: 210 },
};

function getVehicleProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const pid = productId.trim().toLowerCase();
  if (pid.startsWith('especial_')) {
    const model = pid.replace(/^especial_/, '');
    const entry = ESPECIAL_MAP[model];
    if (!entry) return null;
    return { name: entry.name, price: entry.price, type: 'veiculo', productType: 'veiculo', vehicleModel: model };
  }
  if (pid.startsWith('blindado_16_pneu_full_')) {
    const model = pid.replace('blindado_16_pneu_full_', '');
    const entry = BLINDADOS_16[model];
    if (!entry) return null;
    return { name: entry.name + ' (Pneus Full)', price: entry.price + 15, type: 'veiculo', productType: 'veiculo' };
  }
  if (pid.startsWith('blindado_16_')) {
    const model = pid.replace('blindado_16_', '');
    const entry = BLINDADOS_16[model];
    if (!entry) return null;
    return { name: entry.name, price: entry.price, type: 'veiculo', productType: 'veiculo' };
  }
  if (pid.startsWith('blindado_32_')) {
    const model = pid.replace('blindado_32_', '');
    const entry = BLINDADOS_32[model];
    if (!entry) return null;
    return { name: entry.name, price: entry.price, type: 'veiculo', productType: 'veiculo' };
  }
  if (pid.startsWith('full_blindado_voador_')) {
    const model = pid.replace('full_blindado_voador_', '');
    const entry = FULL_VOADORES[model];
    if (!entry) return null;
    return { name: entry.name, price: entry.price, type: 'veiculo', productType: 'veiculo' };
  }
  if (pid.startsWith('full_blindado_')) {
    const model = pid.replace('full_blindado_', '');
    const entry = FULL_BLINDADOS[model] || FULL_VOADORES[model];
    if (!entry) return null;
    return { name: entry.name, price: entry.price, type: 'veiculo', productType: 'veiculo' };
  }
  return null;
}

module.exports = {
  getVehicleProduct,
};
