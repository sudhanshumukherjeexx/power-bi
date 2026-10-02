/* A small JSON Schema (2020-12 subset) validator, so the schemas in content/schema/ work in editors and in CI
   without dependencies. Supports: type, enum, const, required, properties, additionalProperties, items,
   minItems, maxItems, minLength, pattern, minimum, maximum, anyOf, oneOf, $ref (#/$defs/...). */
'use strict';
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;
const matches = (t, v) => t === 'number' ? typeof v === 'number' : t === typeOf(v);

function validate(schema, data, at = '$', root = schema, errors = []) {
  if (schema.$ref) {
    const name = schema.$ref.replace('#/$defs/', '');
    if (!root.$defs || !root.$defs[name]) { errors.push(`${at}: unknown $ref ${schema.$ref}`); return errors; }
    return validate(root.$defs[name], data, at, root, errors);
  }
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some(t => matches(t, data))) { errors.push(`${at}: expected ${types.join('|')}, got ${typeOf(data)}`); return errors; }
  }
  if (schema.const !== undefined && data !== schema.const) errors.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(data)) errors.push(`${at}: ${JSON.stringify(data)} is not one of ${schema.enum.join(', ')}`);
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) errors.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) errors.push(`${at}: "${data.slice(0, 60)}" does not match ${schema.pattern}`);
  }
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push(`${at}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && data > schema.maximum) errors.push(`${at}: above ${schema.maximum}`);
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push(`${at}: needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems !== undefined && data.length > schema.maxItems) errors.push(`${at}: at most ${schema.maxItems} item(s)`);
    if (schema.items) data.forEach((v, i) => validate(schema.items, v, `${at}[${i}]`, root, errors));
  }
  if (typeOf(data) === 'object') {
    for (const k of schema.required || []) if (!(k in data)) errors.push(`${at}: missing "${k}"`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(data)) {
      if (props[k]) validate(props[k], v, `${at}.${k}`, root, errors);
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected property "${k}"`);
      else if (typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, v, `${at}.${k}`, root, errors);
    }
  }
  for (const key of ['anyOf', 'oneOf']) if (schema[key]) {
    const ok = schema[key].map(s => validate(s, data, at, root, []).length === 0).filter(Boolean).length;
    if (key === 'anyOf' ? ok === 0 : ok !== 1) errors.push(`${at}: does not match ${key === 'anyOf' ? 'any' : 'exactly one'} of the allowed shapes`);
  }
  return errors;
}
module.exports = { validate };
