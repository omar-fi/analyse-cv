import PDFParser from 'pdf2json';

export async function extractTextFromPDF(filePath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(this, 1); 

        pdfParser.on("pdfParser_dataError", errData => {
            console.error(`Erreur de parsing PDF:`, errData.parserError);
            reject(errData.parserError);
        });

        pdfParser.on("pdfParser_dataReady", () => {
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText.replace(/\s+/g, ' ').trim());
        });

        pdfParser.loadPDF(filePath);
    });
}