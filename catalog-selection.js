(function (root, factory) {
  const selection = factory();
  if (typeof module === 'object' && module.exports) module.exports = selection;
  root.BiteoraCatalog = selection;
}(typeof self !== 'undefined' ? self : this, function () {
  function isEligibleRecord(record) {
    if (!record || record.id === undefined || !String(record.name || '').trim()) return false;
    const status = String(record.availability_status || '').toLowerCase();
    return !['inactive', 'unavailable', 'sold-out'].includes(status);
  }

  function isOrderableRecord(record) {
    return isEligibleRecord(record)
      && Boolean(Number(record.orderable))
      && String(record.availability_status || '').toLowerCase() !== 'educational-only';
  }

  function selectRandomRecord(records, previousId, random = Math.random) {
    const eligibleRecords = Array.isArray(records) ? records.filter(isEligibleRecord) : [];
    if (!eligibleRecords.length) return null;
    const candidates = eligibleRecords.length > 1
      ? eligibleRecords.filter((record) => String(record.id) !== String(previousId))
      : eligibleRecords;
    return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
  }

  return { isEligibleRecord, isOrderableRecord, selectRandomRecord };
}));
