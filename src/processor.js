const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
});

async function processTextToRecords(text, sourceName) {
    console.log(`\n⏳ Vectorisation des données (Vecteurs de 3072 dimensions)...`);
    const chunks = await splitter.createDocuments([text]);
    const records = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i].pageContent;
        
        const result = await model.embedContent(chunkText);
        const vector = result.embedding.values;
        
        records.push({
            id: `${sourceName}-chunk-${i}`,
            vector: vector,
            text: chunkText,
            source: sourceName
        });
    }
    
    return records;
}

module.exports = { processTextToRecords };