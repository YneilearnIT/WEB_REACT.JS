exports.up = function (knex) {
  return Promise.all([
    // BẢNG KẾT BẠN
    knex.schema.createTable("friends", (table) => {
      table.increments("id").primary();
      table
        .integer("user_id_1")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("user_id_2")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.timestamps(true, true);
    }),

    // BẢNG TIN NHẮN
    knex.schema.createTable("messages", (table) => {
      table.increments("id").primary();
      table
        .integer("sender_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("receiver_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("content").notNullable();
      table.timestamps(true, true);
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("messages"),
    knex.schema.dropTableIfExists("friends"),
  ]);
};
