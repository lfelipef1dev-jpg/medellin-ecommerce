/**
 * Catálogo de pets para validação de preço na API (alinhado ao pet-detalhe.html e medellin-pets Config.LojaProductIdToItem).
 */
const PETS_CATALOG = {
  pets_lobo_sirius: { name: 'Lobo Sirius', price: 975.59 },
  pets_chimp: { name: 'Chimp', price: 975.59 },
  pets_rhesus: { name: 'Rhesus', price: 975.59 },
  pets_tigor: { name: 'Tigor', price: 975.59 },
  pets_rajah: { name: 'Rajah', price: 975.59 },
  pets_gato_gris: { name: 'Gato Gris', price: 383.44 },
  pets_pastor_alemao: { name: 'Pastor Alemão', price: 350.17 },
  pets_rottweiler: { name: 'Rottweiler', price: 390.25 },
  pets_husky_siberiana: { name: 'Husky Siberiana', price: 390.25 },
  pets_poodle: { name: 'Poodle', price: 350.17 },
  pets_pug: { name: 'Pug', price: 350.17 },
  pets_golden_retriever: { name: 'Golden Retriever', price: 350.17 },
  pets_westy: { name: 'Westy', price: 350.17 },
  pets_boar: { name: 'Javali', price: 350.17 },
  pets_chickenhawk: { name: 'Falcão', price: 350.17 },
  pets_cormorant: { name: 'Cormorão', price: 350.17 },
  pets_cow: { name: 'Vaca', price: 350.17 },
  pets_crow: { name: 'Corvo', price: 350.17 },
  pets_deer: { name: 'Veado', price: 350.17 },
  pets_hen: { name: 'Galinha', price: 350.17 },
  pets_pig: { name: 'Porco', price: 350.17 },
  pets_rabbit_01: { name: 'Coelho', price: 350.17 },
  pets_ursa: { name: 'Urso', price: 350.17 },
  pets_crocodilo: { name: 'Crocodilo', price: 350.17 },
  pets_greyhound: { name: 'Greyhound', price: 350.17 },
  pets_yorkshire: { name: 'Yorkshire', price: 350.17 },
  pets_bulldog: { name: 'Bulldog', price: 350.17 },
};

function getPetProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const id = productId.trim().toLowerCase();
  const entry = PETS_CATALOG[id];
  if (!entry) return null;
  return {
    name: entry.name,
    price: Number(entry.price) || 0,
    type: 'pet',
    productType: 'pet',
  };
}

module.exports = {
  PETS_CATALOG,
  getPetProduct,
};
