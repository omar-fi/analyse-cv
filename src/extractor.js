const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
require('dotenv').config();

const parser = StructuredOutputParser.fromZodSchema(
    z.object({
        competences: z.array(z.string()).describe("Liste des compétences techniques et soft skills, en français ou anglais."),
        formation: z.array(z.string()).describe("Liste des diplômes, écoles et formations."),
        experience: z.array(z.string()).describe("Liste des expériences professionnelles, stages et projets avec les dates si disponibles.")
    })
);

const model = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
    modelName: 'mistralai/mixtral-8x7b-instruct',
    temperature: 0, 
});

async function extractStructuredData(rawText) {
    const formatInstructions = parser.getFormatInstructions();

    const prompt = new PromptTemplate({
        template: `Tu es un assistant RH expert en analyse de CV.
Extrais les compétences, les formations et les expériences professionnelles du texte suivant. 
Le CV peut être en français ou en anglais. 
Si une information est absente, renvoie un tableau vide pour cette catégorie.

Texte du CV :
{texte}

Instructions de formatage :
{format_instructions}
`,
        inputVariables: ["texte"],
        partialVariables: { format_instructions: formatInstructions },
    });

    try {
        const chain = prompt.pipe(model).pipe(parser);
        
        const structuredData = await chain.invoke({ texte: rawText });
        return structuredData;

    } catch (error) {
        console.error("Erreur lors de l'extraction par le LLM :", error);
        throw error;
    }
}

module.exports = { extractStructuredData };