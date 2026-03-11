const lancedb = require('vectordb');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/lancedb');
const TABLE_NAME = 'cv_embeddings';

async function insertRecords(records) {
    const db = await lancedb.connect(DB_PATH);
    
    const tableNames = await db.tableNames();
    
    if (tableNames.includes(TABLE_NAME)) {
        const table = await db.openTable(TABLE_NAME);
        await table.add(records);
        console.log(`✅ ${records.length} embeddings ajoutés à la table existante '${TABLE_NAME}'.`);
    } else {
        await db.createTable(TABLE_NAME, records);
        console.log(`✅ Table '${TABLE_NAME}' créée avec ${records.length} embeddings.`);
    }
}

module.exports = { insertRecords };