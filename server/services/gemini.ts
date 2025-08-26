import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AnalysisResult {
  answer: string;
  confidence: number;
  relatedTopics: string[];
}

export async function analyzeTranscriptionContent(
  transcription: string,
  question: string
): Promise<AnalysisResult> {
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            confidence: { type: "number" },
            relatedTopics: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["answer", "confidence", "relatedTopics"]
        }
      },
      systemInstruction: `Você é um assistente de IA especializado em analisar conteúdo transcrito. 
Você receberá uma transcrição e uma pergunta sobre ela. Forneça respostas precisas e úteis baseadas 
estritamente no conteúdo fornecido.`
    });

    const prompt = `Transcrição: "${transcription}"\n\nPergunta: "${question}"\n\nResponda em JSON com answer, confidence (0-1), e relatedTopics.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawJson = response.text();

    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        answer: data.answer || "Não foi possível gerar uma resposta baseada no conteúdo transcrito.",
        confidence: Math.max(0, Math.min(1, data.confidence || 0.5)),
        relatedTopics: Array.isArray(data.relatedTopics) ? data.relatedTopics : []
      };
    } else {
      throw new Error("Resposta vazia do modelo");
    }
  } catch (error) {
    throw new Error(`Falha ao analisar conteúdo: ${error}`);
  }
}

export async function generateSummary(transcription: string): Promise<string> {
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      systemInstruction: "Você é um assistente especializado em criar resumos concisos e informativos. Crie um resumo dos pontos principais do texto fornecido, mantendo as informações mais importantes."
    });

    const result = await model.generateContent(`Por favor, crie um resumo conciso do seguinte texto transcrito:\n\n${transcription}`);
    const response = await result.response;
    
    return response.text() || "Não foi possível gerar um resumo.";
  } catch (error) {
    throw new Error(`Falha ao gerar resumo: ${error}`);
  }
}

export async function detectLanguageFromText(text: string): Promise<{
  language: string;
  confidence: number;
  languageCode: string;
}> {
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            language: { type: "string" },
            confidence: { type: "number" },
            languageCode: { type: "string" }
          },
          required: ["language", "confidence", "languageCode"]
        }
      },
      systemInstruction: `Detecte o idioma do texto fornecido. Responda com JSON neste formato: 
{
  "language": "nome do idioma em português", 
  "confidence": número entre 0 e 1, 
  "languageCode": "código ISO como pt-BR, en-US, es-ES"
}`
    });

    const result = await model.generateContent(text);
    const response = await result.response;
    const rawJson = response.text();

    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        language: data.language || "Não identificado",
        confidence: Math.max(0, Math.min(1, data.confidence || 0.5)),
        languageCode: data.languageCode || "unknown"
      };
    } else {
      throw new Error("Resposta vazia do modelo");
    }
  } catch (error) {
    console.error('Language detection error:', error);
    return {
      language: "Erro na detecção",
      confidence: 0,
      languageCode: "unknown"
    };
  }
}

export async function enhanceTranscriptionText(
  text: string,
  targetLanguage: string = "pt-BR"
): Promise<{
  enhancedText: string;
  corrections: string[];
  confidence: number;
}> {
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            enhancedText: { type: "string" },
            corrections: {
              type: "array",
              items: { type: "string" }
            },
            confidence: { type: "number" }
          },
          required: ["enhancedText", "corrections", "confidence"]
        }
      },
      systemInstruction: `Você é uma IA de aprimoramento de transcrição. Seu trabalho é:
1. Corrigir erros de gramática e ortografia em texto transcrito
2. Adicionar pontuação adequada
3. Manter o significado e estilo original
4. Responder em ${targetLanguage}`
    });

    const result = await model.generateContent(`Por favor, aprimore este texto transcrito: "${text}"`);
    const response = await result.response;
    const rawJson = response.text();

    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        enhancedText: data.enhancedText || text,
        corrections: Array.isArray(data.corrections) ? data.corrections : [],
        confidence: Math.max(0, Math.min(1, data.confidence || 0.8))
      };
    } else {
      throw new Error("Resposta vazia do modelo");
    }
  } catch (error) {
    console.error('Enhancement error:', error);
    return {
      enhancedText: text,
      corrections: [],
      confidence: 0.5
    };
  }
}

export async function analyzeSentiment(text: string): Promise<{
  rating: number;
  confidence: number;
  sentiment: string;
}> {
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            rating: { type: "number" },
            confidence: { type: "number" },
            sentiment: { type: "string" }
          },
          required: ["rating", "confidence", "sentiment"]
        }
      },
      systemInstruction: `Você é um especialista em análise de sentimento. 
Analise o sentimento do texto e forneça uma avaliação de 1 a 5 estrelas e uma pontuação de confiança entre 0 e 1.
Sentimentos possíveis: "positivo", "negativo", "neutro"`
    });

    const result = await model.generateContent(`Analise o sentimento deste texto: "${text}"`);
    const response = await result.response;
    const rawJson = response.text();

    if (rawJson) {
      const data = JSON.parse(rawJson);
      return {
        rating: Math.max(1, Math.min(5, Math.round(data.rating || 3))),
        confidence: Math.max(0, Math.min(1, data.confidence || 0.5)),
        sentiment: data.sentiment || "neutro"
      };
    } else {
      throw new Error("Resposta vazia do modelo");
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      rating: 3,
      confidence: 0.5,
      sentiment: "neutro"
    };
  }
}