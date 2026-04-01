exports.up = function (knex) {
  return knex.schema.table("friends", (table) => {
    // Thêm cột status, mặc định khi vừa gửi là 'pending' (chờ duyệt)
    table.string("status").defaultTo("pending");
  });
};

exports.down = function (knex) {
  return knex.schema.table("friends", (table) => {
    table.dropColumn("status");
  });
};
