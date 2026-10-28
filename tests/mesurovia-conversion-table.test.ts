import assert from 'node:assert/strict';
import {
  buildPlacement, canConvert, convertTableValue, getConversionFamily, readPlacementCells, unitAnchor
} from '../src/lib/games/mesurovia/conversion-table';

const length = getConversionFamily('length');
const lengthPlacement = buildPlacement('2,4', length, 'm', 'cm', true);
assert.equal(lengthPlacement.cells[unitAnchor(length, 'm')].value, '2');
assert.equal(lengthPlacement.cells[unitAnchor(length, 'dm')].value, '4');
assert.equal(lengthPlacement.cells[unitAnchor(length, 'cm')].value, '0');
assert.equal(convertTableValue(2.4, length, 'm', 'cm'), 240);

const manual24 = Array(length.units.length).fill('');
manual24[unitAnchor(length, 'm')] = '2';
manual24[unitAnchor(length, 'dm')] = '4';
assert.equal(readPlacementCells(manual24, length, 'cm'), '240');

const manual35 = Array(length.units.length).fill('');
manual35[unitAnchor(length, 'dm')] = '3';
manual35[unitAnchor(length, 'cm')] = '5';
assert.equal(readPlacementCells(manual35, length, 'm'), '0,35');

const reverseLength = buildPlacement('240', length, 'cm', 'm', true);
assert.equal(reverseLength.cells[unitAnchor(length, 'm')].value, '2');
assert.equal(reverseLength.cells[unitAnchor(length, 'dm')].value, '4');
assert.equal(reverseLength.cells[unitAnchor(length, 'cm')].value, '0');
assert.equal(convertTableValue(240, length, 'cm', 'm'), 2.4);

const area = getConversionFamily('area');
assert.deepEqual(area.units.map((unit) => unit.key), ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²']);
assert.equal(unitAnchor(area, 'ha'), unitAnchor(area, 'hm²'));
assert.equal(convertTableValue(1, area, 'ha', 'm²'), 10_000);
const areaPlacement = buildPlacement('2,4', area, 'm²', 'cm²', true);
assert.equal(areaPlacement.cells[unitAnchor(area, 'm²')].value, '2');
assert.equal(areaPlacement.cells[unitAnchor(area, 'm²') + 1].value, '4');
assert.equal(areaPlacement.cells[unitAnchor(area, 'cm²')].value, '0');
assert.equal(convertTableValue(2.4, area, 'm²', 'cm²'), 24_000);

const mass = getConversionFamily('mass');
assert.deepEqual(mass.units.map((unit) => unit.key), ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg']);
const massPlacement = buildPlacement('2,4', mass, 'kg', 'g', true);
assert.equal(massPlacement.cells[unitAnchor(mass, 'kg')].value, '2');
assert.equal(massPlacement.cells[unitAnchor(mass, 'hg')].value, '4');
assert.equal(massPlacement.cells[unitAnchor(mass, 'dag')].value, '0');
assert.equal(massPlacement.cells[unitAnchor(mass, 'g')].value, '0');
assert.equal(convertTableValue(2.4, mass, 'kg', 'g'), 2400);

const volume = getConversionFamily('volume');
assert.equal(convertTableValue(1.5, volume, 'm³', 'dm³'), 1500);
assert.equal(volume.units.find((unit) => unit.key === 'dm³')?.alias, 'L');

const duration = getConversionFamily('duration');
assert.equal(convertTableValue(2.5, duration, 'h', 'min'), 150);
assert.equal(canConvert(duration, 'mois', 'j'), false);
assert.equal(canConvert(duration, 'an', 'mois'), true);

console.log('Mesurovia conversion table: placements, aliases, powers and duration rules OK.');
