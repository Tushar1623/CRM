/**
 * Generates formatted business identifiers for CRM records.
 */

function generateLeadNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LD-${year}-${rand}`;
}

function generateDealNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DL-${year}-${rand}`;
}

function generateStockId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `STK-${rand}`;
}

module.exports = {
  generateLeadNumber,
  generateDealNumber,
  generateStockId
};
