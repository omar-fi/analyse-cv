const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const parser = StructuredOutputParser.fromZodSchema(
    z.object({
        mots_cles_profil: z.array(z.string()).describe("Liste des mots-clés importants (rôles, technologies, soft skills) trouvés dans la section Profil ou Résumé"),
        mots_cles_experience: z.array(z.string()).describe("Liste des mots-clés techniques (langages, frameworks, outils, cloud, bases de données) extraits des descriptions d'expérience"),
        competences_generales: z.array(z.string()).describe("Liste générale des compétences"),
        formation: z.array(z.string()).describe("Liste des diplômes et écoles"),
        experience_texte: z.array(z.string()).describe("Les phrases de description des expériences professionnelles")
    })
);
const model = new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4-turbo-preview",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0,
    maxTokens: Number(process.env.OPENROUTER_MAX_TOKENS || 2048),
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost", 
            "X-Title": "cv-vector-db",
        },
    },
});


async function extractStructuredData(rawText) {
    const formatInstructions = parser.getFormatInstructions();

    const prompt = new PromptTemplate({
        template: `Tu es un expert en recrutement IT. Analyse le CV suivant.
Ta mission est d'extraire les informations demandées, en insistant particulièrement sur l'extraction de mots-clés précis et isolés (ex: "React", "Python", "Gestion de projet", "Docker") pour le profil et les expériences.
Si une section n'existe pas, renvoie un tableau vide [].

Texte du CV : {texte}

Instructions de formatage strict : {format_instructions}`,
        inputVariables: ["texte"],
        partialVariables: { format_instructions: formatInstructions },
    });

    try {
        const chain = prompt.pipe(model).pipe(parser);
        return await chain.invoke({ texte: rawText });
    } catch (error) {
        if (error.status === 401) {
            console.error("❌ Erreur 401 OpenRouter : Clé non reconnue.");
        }
        throw error;
    }
}

module.exports = { extractStructuredData };