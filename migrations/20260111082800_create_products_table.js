/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');

  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.text('name').notNullable();
    table.text('description');
    table.specificType('bounding_polygon', 'geometry');
    table.text('consumption_link');
    table.text('type');
    table.text('consumption_protocol');
    table.float('resolution_best');
    table.integer('min_zoom');
    table.integer('max_zoom');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('products');
};
