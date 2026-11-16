const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../data/db.json");

function readDB() {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeDB(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };