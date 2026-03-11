const path = require('path');
const { extractTextFromPDF } = require('./parser');
const { extractStructuredData } = require('./extractor');
const { processTextToRecords } = require('./processor');
const { insertRecords } = require('./database');

async function main() {
    const cvFileName = "CV_omar.pdf";
    const cvPath = path.join(__dirname, '../data/raw_cvs', cvFileName);

    console.log(`🚀 Démarrage du pipeline pour : ${cvFileName}`);

    try {
        console.log('1️⃣ Lecture du PDF...');
        const rawText = await extractTextFromPDF(cvPath);

        console.log('2️⃣ Extraction intelligente (LLM) des compétences, formations et expériences...');
        const structuredData = await extractStructuredData(rawText);
        console.log('Données extraites :', JSON.stringify(structuredData, null, 2));

        console.log('3️⃣ Split du texte complet et génération des embeddings...');
        let records = await processTextToRecords(rawText, cvFileName);

        records = records.map(record => ({
            ...record,
            competences_str: structuredData.competences.join(', '),
            formation_str: structuredData.formation.join(' | '),
        }));

        console.log(`5️⃣ Insertion de ${records.length} chunks enrichis dans LanceDB...`);
        await insertRecords(records);

        console.log('✅ Pipeline terminé avec succès !');
    } catch (error) {
        console.error('❌ Une erreur est survenue :', error);
    }
}

main();