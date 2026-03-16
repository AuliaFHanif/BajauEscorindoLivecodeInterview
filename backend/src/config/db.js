const path = require("path");
const { Sequelize } = require("sequelize");

const storage = process.env.SQLITE_STORAGE || "./data/feedback.sqlite";
const storagePath = path.isAbsolute(storage)
  ? storage
  : path.resolve(process.cwd(), storage);

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false,
});

module.exports = sequelize;
