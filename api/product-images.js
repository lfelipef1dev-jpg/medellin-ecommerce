/**
 * Mapeamento de productId → URL da imagem para Mercado Pago
 * URLs devem ser públicas e acessíveis (HTTPS)
 */

const FRONT_URL = (process.env.FRONT_URL || 'https://roleplaymedellin.com.br').replace(/\/+$/, '');

/**
 * Retorna a URL da imagem do produto para usar no Mercado Pago
 * @param {string} productId - ID do produto
 * @param {string} productType - Tipo do produto (vip, skin, pet, etc.)
 * @returns {string|null} URL da imagem ou null se não houver
 */
function getProductImageUrl(productId, productType) {
  if (!productId || typeof productId !== 'string') return null;
  
  const id = productId.toLowerCase().trim();
  
  // Skins de armas
  if (productType === 'skin' || id.startsWith('weapon_')) {
    // Usar imagem genérica de skin ou logo
    return `${FRONT_URL}/assets/logo.webp`;
  }
  
  // VIPs
  if (id.startsWith('vip_')) {
    if (id.includes('bronze')) return `${FRONT_URL}/assets/vips/vip-bronze.webp`;
    if (id.includes('prata')) return `${FRONT_URL}/assets/vips/vip-prata.webp`;
    if (id.includes('ouro')) return `${FRONT_URL}/assets/vips/vip-ouro-permanente.webp`;
    if (id.includes('platinum')) return `${FRONT_URL}/assets/vips/vip-platinum.webp`;
    if (id.includes('black')) return `${FRONT_URL}/assets/vips/vip-black.webp`;
    if (id.includes('policia')) return `${FRONT_URL}/assets/vips/vip-policia.webp`;
    if (id.includes('pvp')) return `${FRONT_URL}/assets/vips/vip-pvp.webp`;
    if (id.includes('faccao')) {
      if (id.includes('prata')) return `${FRONT_URL}/assets/vips/vip-faccao-prata.webp`;
      if (id.includes('ouro')) return `${FRONT_URL}/assets/vips/vip-faccao-ouro.webp`;
      if (id.includes('premium')) return `${FRONT_URL}/assets/vips/vip-faccao-premium.webp`;
    }
    return `${FRONT_URL}/assets/vips/vip-bronze.webp`; // fallback
  }
  
  // Pets
  if (id.startsWith('pets_')) {
    const petName = id.replace('pets_', '').replace(/_/g, '-');
    return `${FRONT_URL}/assets/pets/${petName}.png`;
  }
  
  // Mochilas
  if (id.startsWith('mochila_')) {
    return `${FRONT_URL}/assets/mochilas/mochila.webp`;
  }
  
  // Veículos (se tiver)
  if (productType === 'veiculo' || productType === 'blindado') {
    return `${FRONT_URL}/assets/veiculos/${id}.webp`;
  }
  
  // Outros
  if (id.startsWith('outros_')) {
    return `${FRONT_URL}/assets/logo.webp`;
  }
  
  // Fallback: logo da loja
  return `${FRONT_URL}/assets/logo.webp`;
}

module.exports = {
  getProductImageUrl
};
