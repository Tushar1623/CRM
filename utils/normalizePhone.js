/**
 * Normalizes a phone number to a consistent 10-digit format (or clean digits).
 * Handles inputs like "+91 98765 43210", "98765-43210", "+919876543210".
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If Indian number prefixed with country code 91 and length 12, take last 10 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // If prefixed with leading 0 and length 11, take last 10 digits
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  
  return digits;
}

module.exports = { normalizePhone };
