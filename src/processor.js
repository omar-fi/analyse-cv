const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { OpenAIEmbeddings } = require('@langchain/openai');
require('dotenv').config();

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100,
});

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENROUTER_API_KEY, 
    modelName: "openai/text-embedding-3-small", 
    configuration: {
        baseURL: "https://openrouter.ai/api/v1" 
    }
});

async function processTextToRecords(text, sourceName) {
    const chunks = await splitter.createDocuments([text]);
    const records = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i].pageContent;
        const vector = await embeddings.embedQuery(chunkText);
        
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