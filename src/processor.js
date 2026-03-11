import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "text-embedding-3-small",
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost",
            "X-Title": "cv-vector-db",
        },
    },
});

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
});

export async function processTextToRecords(text, sourceName, consultantId) {
    console.log(`\n⏳ Vectorisation des données...`);
    const chunks = await splitter.createDocuments([text]);
    const records = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i].pageContent;
        
        const vector = await embeddings.embedQuery(chunkText);
        
        records.push({
            consultant_id: consultantId,
            vector: vector,
            text: chunkText,
            source: sourceName
        });
    }
    
    return records;
}