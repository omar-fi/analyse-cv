const path = require('path');
const { extractTextFromPDF } = require('./parser');
const { extractStructuredData } = require('./extractor');
const { processTextToRecords } = require('./processor');
const { insertRecords } = require('./database');

async function main() {
    const cvFileName = "CV_omar.pdf";
    const cvPath = path.join(__dirname, '../data/raw_cvs', cvFileName);
    // Extraire l'ID du consultant du nom du fichier (ex: CV_omar.pdf -> omar)
    const consultantId = cvFileName.replace('CV_', '').replace('.pdf', '').toLowerCase();

    console.log(`🚀 Démarrage du pipeline pour : ${cvFileName} (Consultant ID: ${consultantId})`);

    try {
        console.log('1️⃣ Lecture du PDF...');
        const rawText = await extractTextFromPDF(cvPath);

        console.log('2️⃣ Extraction intelligente (LLM) des mots-clés, formations et expériences...');
        const structuredData = await extractStructuredData(rawText);
        console.log('Données extraites :', JSON.stringify(structuredData, null, 2));

        console.log('3️⃣ Split du texte complet et génération des embeddings (3072 dimensions)...');
        let records = await processTextToRecords(rawText, cvFileName, consultantId);

        // ⚠️ CORRECTION ICI : On utilise les nouveaux noms de variables et on sécurise avec || []
        records = records.map(record => ({
            ...record,
            mots_cles_profil_str: (structuredData.mots_cles_profil || []).join(', '),
            mots_cles_experience_str: (structuredData.mots_cles_experience || []).join(', '),
            competences_generales_str: (structuredData.competences_generales || []).join(', '),
            formation_str: (structuredData.formation || []).join(' | '),
        }));

        console.log(`4️⃣ Insertion de ${records.length} chunks enrichis dans LanceDB...`);
        await insertRecords(records);

        console.log('✅ Pipeline terminé avec succès !');
    } catch (error) {
        console.error('❌ Une erreur est survenue :', error);
    }
}

main();