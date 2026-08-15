/**
 * Grandes Baús – catálogo server-side para validação de preço e setagem.
 * productId = grandes_bau_caminhao_XXX ou grandes_bau_veiculo_XXX → entrega veículo modelo XXX.
 */
const PREFIX_CAMINHAO = 'grandes_bau_caminhao_';
const PREFIX_VEICULO = 'grandes_bau_veiculo_';

// model -> { name, price } (preços alinhados ao veiculos-data.js / grandes-baus-data.js)
const MODEL_CATALOG = {
  mule: { name: 'Mule', price: 93 }, mule2: { name: 'Mule', price: 93 }, mule3: { name: 'Mule', price: 93 }, mule4: { name: 'Mule Custom', price: 93 },
  pounder: { name: 'Pounder', price: 97 }, pounder2: { name: 'Pounder Custom', price: 97 },
  benson: { name: 'Benson', price: 97 }, phantom: { name: 'Phantom', price: 112 }, phantom2: { name: 'Phantom Wedge', price: 112 }, phantom3: { name: 'Phantom Custom', price: 115 },
  hauler: { name: 'Hauler', price: 112 }, hauler2: { name: 'Hauler Custom', price: 112 },
  stockade: { name: 'Stockade', price: 112 }, stockade3: { name: 'Stockade 3', price: 177 },
  tiptruck: { name: 'Tipper', price: 89 }, tiptruck2: { name: 'Tipper II', price: 89 },
  mixer: { name: 'Mixer', price: 89 }, mixer2: { name: 'Mixer II', price: 89 },
  dump: { name: 'Dump Truck', price: 89 }, flatbed: { name: 'Flatbed Truck', price: 89 }, flatbed2: { name: 'Flatbed 2', price: 89 }, flatbed3: { name: 'Flatbed 3', price: 89 },
  bulldozer: { name: 'Dozer', price: 89 }, towtruck: { name: 'Tow Truck (Large)', price: 89 }, towtruck2: { name: 'Tow Truck (Small)', price: 89 },
  tractor: { name: 'Tractor', price: 89 }, tractor2: { name: 'Fieldmaster', price: 89 },
  rubble: { name: 'Rubble', price: 89 }, biff: { name: 'Biff', price: 89 }, packer: { name: 'Packer', price: 89 },
  freight: { name: 'Freight', price: 89 }, freighttrailer: { name: 'Freight Trailer', price: 92 }, freightcont1: { name: 'Freight Container 1', price: 110 }, freightcont2: { name: 'Freight Container 2', price: 112 }, freightgrain: { name: 'Freight Grain', price: 102 }, freightcar: { name: 'Freight Car', price: 105 },
  utillitruck: { name: 'Utility Truck (Cherry Picker)', price: 89 }, utillitruck2: { name: 'Utility Truck (Van)', price: 89 }, utillitruck3: { name: 'Utility Truck (Contender)', price: 89 },
  handler: { name: 'Handler', price: 89 }, docktug: { name: 'Docktug', price: 89 }, ripley: { name: 'Ripley', price: 89 }, airtug: { name: 'Airtug', price: 89 }, mower: { name: 'Lawn Mower', price: 89 }, forklift: { name: 'Forklift', price: 89 },
  trash: { name: 'Trash', price: 89 }, trash2: { name: 'Trash 2', price: 89 },
  speedo: { name: 'Speedo', price: 83 }, speedo2: { name: 'Speedo 2', price: 94 }, speedo4: { name: 'Speedo Custom', price: 84 },
  burrito: { name: 'Burrito', price: 88 }, burrito2: { name: 'Burrito 2', price: 88 }, burrito3: { name: 'Burrito', price: 81 }, burrito4: { name: 'Burrito 4', price: 89 }, burrito5: { name: 'Burrito 5', price: 89 },
  youga: { name: 'Youga', price: 82 }, youga2: { name: 'Youga Classic', price: 84 },
  rumpo: { name: 'Rumpo', price: 82 }, rumpo2: { name: 'Rumpo 2', price: 93 },
  boxville: { name: 'Boxville LSDWP', price: 94 }, boxville2: { name: 'Boxville Go Postal', price: 94 }, boxville3: { name: 'Boxville Humane Labs', price: 94 }, boxville4: { name: 'Boxville Post OP', price: 94 }, boxville5: { name: 'Armored Boxville', price: 94 },
  bison: { name: 'Bison', price: 85 }, bison2: { name: 'Bison 2', price: 89 }, bison3: { name: 'Bison 3', price: 89 },
  guardian: { name: 'Guardian', price: 89 }, pony: { name: 'Pony', price: 94 }, pony2: { name: 'Pony (Smoke on the water)', price: 94 },
  journey: { name: 'Journey', price: 82 }, moonbeam: { name: 'Moonbeam', price: 84 }, moonbeam2: { name: 'Moonbeam Custom', price: 84 },
  gburrito: { name: 'Gang Burrito', price: 89 }, gburrito2: { name: 'Burrito Custom', price: 83 },
  sadler: { name: 'Sadler', price: 85 }, sadler2: { name: 'Sadler 2', price: 88 },
  minivan: { name: 'Minivan', price: 89 }, minivan2: { name: 'Minivan 2', price: 89 }, surfer: { name: 'Surfer', price: 82 }, surfer2: { name: 'Surfer 2', price: 89 },
  granger: { name: 'Granger', price: 89 }, patriot: { name: 'Patriot', price: 89 }, patriot2: { name: 'Patriot Stretch', price: 89 },
  landstalker: { name: 'Landstalker', price: 85 }, landstalker2: { name: 'Landstalker XL', price: 91 },
  baller: { name: 'Baller', price: 89 }, baller2: { name: 'Baller II', price: 86 }, baller3: { name: 'Baller LE', price: 86 }, baller4: { name: 'Baller LE LWB', price: 93 },
  dubsta: { name: 'Dubsta', price: 88 }, dubsta2: { name: 'Dubsta Luxury', price: 88 }, dubsta3: { name: 'Dubsta 6x6', price: 92 },
  cavalcade: { name: 'Cavalcade', price: 86 }, cavalcade2: { name: 'Cavalcade II', price: 87 },
  huntley: { name: 'Huntley S', price: 91 }, rocoto: { name: 'Rocoto', price: 85 }, fq2: { name: 'FQ2', price: 88 }, bjxl: { name: 'BeeJay XL', price: 88 },
  rebel: { name: 'Rebel', price: 93 }, rebel2: { name: 'Rebel', price: 85 }, rancherxl: { name: 'Rancher XL', price: 86 }, rancherxl2: { name: 'Rancher XL 2', price: 93 },
  kamacho: { name: 'Kamacho', price: 92 }, freecrawler: { name: 'Freecrawler', price: 89 }, everon: { name: 'Everon', price: 95 }, hellion: { name: 'Hellion', price: 94 },
  bobcatxl: { name: 'Bobcat XL Open', price: 84 }, ratloader: { name: 'Ratloader', price: 88 }, ratloader2: { name: 'Ratloader 2', price: 89 },
  bodhi2: { name: 'Bodhi 2', price: 95 }, dloader: { name: 'D Loader', price: 95 }, mesa: { name: 'Mesa', price: 84 }
};

function getVehicleModelFromProductId(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const id = productId.trim().toLowerCase();
  if (id.startsWith(PREFIX_CAMINHAO)) return id.slice(PREFIX_CAMINHAO.length);
  if (id.startsWith(PREFIX_VEICULO)) return id.slice(PREFIX_VEICULO.length);
  return null;
}

function getGrandesBauProduct(productId) {
  const model = getVehicleModelFromProductId(productId);
  if (!model) return null;
  const entry = MODEL_CATALOG[model];
  if (!entry) return null;
  return {
    name: entry.name,
    price: Number(entry.price) || 0,
    type: 'veiculo',
    productType: 'veiculo',
    vehicleModel: model
  };
}

module.exports = {
  getGrandesBauProduct,
  getVehicleModelFromProductId
};
