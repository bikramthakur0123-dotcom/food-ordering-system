const assert = require('node:assert/strict');
const test = require('node:test');
const {
  getEligibleRecords,
  isOrderableRecord,
  selectRandomRecord
} = require('../frontend/catalog-selection.js');

const orderable = (id) => ({
  id,
  name: `Food ${id}`,
  availability_status: 'regional-specialty',
  orderable: 1
});
const educational = {
  id: 90,
  name: 'Field note',
  availability_status: 'educational-only',
  orderable: 0
};

test('selects from valid active catalogue records, including educational records', () => {
  const records = [orderable(1), educational, { id: 3, name: '', availability_status: 'regional-specialty' }];
  assert.deepEqual(getEligibleRecords(records).map((record) => record.id), [1, 90]);
  assert.equal(selectRandomRecord(records, null, () => 0.9).id, 90);
});

test('does not immediately repeat when multiple records exist', () => {
  const records = [orderable(1), orderable(2), { id: 3, name: 'Unavailable', availability_status: 'unavailable' }];
  assert.equal(selectRandomRecord(records, 1, () => 0).id, 2);
});

test('handles empty and single-record catalogues', () => {
  assert.equal(selectRandomRecord([], null, () => 0), null);
  assert.equal(selectRandomRecord([orderable(1)], 1, () => 0).id, 1);
});

test('only explicit orderable records can be purchased', () => {
  assert.equal(isOrderableRecord(orderable(1)), true);
  assert.equal(isOrderableRecord(educational), false);
  assert.equal(isOrderableRecord({ ...orderable(2), availability_status: 'unavailable' }), false);
});
