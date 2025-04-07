const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.json');

const loadDatabase = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
function saveDatabase(db) {fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));}

module.exports = {
    loadDatabase,
    saveDatabase
}; 