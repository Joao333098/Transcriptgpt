import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Enhanced AI transcription with audio support
export async function transcribeAudioWithAI(
  audioBlob: Buffer,
  language?: string
): Promise<{
  text: string;
  language: string;
  confidence: number;
  duration?: number;
}> {
  try {
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBlob], "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
      language: language || undefined,
      response_format: "verbose_json",
      temperature: 0.1
    });

    // Detect language if not provided
    const detectedLang = response.language || language || "pt";
    
    return {
      text: response.text,
      language: detectedLang,
      confidence: 0.95, // Whisper generally has high confidence
      duration: response.duration
    };
  } catch (error) {
    throw new Error(`Falha na transcrição por IA: ${error.message}`);
  }
}

// Real-time text enhancement using AI
export async function enhanceTranscriptionText(
  text: string,
  targetLanguage: string = "pt-BR"
): Promise<{
  enhancedText: string;
  corrections: string[];
  confidence: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a transcription enhancement AI. Your job is to:
          1. Correct grammar and spelling errors in transcribed text
          2. Add proper punctuation
          3. Maintain the original meaning and style
          4. Respond in ${targetLanguage}
          
          Format your response as JSON: {
            "enhancedText": "corrected text",
            "corrections": ["list of corrections made"],
            "confidence": number between 0 and 1
          }`
        },
        {
          role: "user",
          content: `Please enhance this transcribed text: "${text}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      enhancedText: result.enhancedText || text,
      corrections: Array.isArray(result.corrections) ? result.corrections : [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8))
    };
  } catch (error) {
    console.error('Enhancement error:', error);
    return {
      enhancedText: text,
      corrections: [],
      confidence: 0.5
    };
  }
}

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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in analyzing transcribed content. You will receive a transcription and a question about it. Provide accurate, helpful answers based strictly on the content provided. Respond with JSON in this format: { "answer": "your detailed answer", "confidence": number between 0 and 1, "relatedTopics": ["topic1", "topic2"] }`
        },
        {
          role: "user",
          content: `Transcription: "${transcription}"\n\nQuestion: "${question}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      answer: result.answer || "Não foi possível gerar uma resposta baseada no conteúdo transcrito.",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      relatedTopics: Array.isArray(result.relatedTopics) ? result.relatedTopics : []
    };
  } catch (error) {
    throw new Error(`Falha ao analisar conteúdo: ${error.message}`);
  }
}

export async function generateSummary(transcription: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em criar resumos concisos e informativos. Crie um resumo dos pontos principais do texto fornecido, mantendo as informações mais importantes."
        },
        {
          role: "user",
          content: `Por favor, crie um resumo conciso do seguinte texto transcrito:\n\n${transcription}`
        }
      ],
    });

    return response.choices[0].message.content || "Não foi possível gerar um resumo.";
  } catch (error) {
    throw new Error(`Falha ao gerar resumo: ${error.message}`);
  }
}

export async function detectLanguageFromText(text: string): Promise<{
  language: string;
  confidence: number;
  languageCode: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Detect the language of the provided text. Respond with JSON in this format: { "language": "language name in Portuguese", "confidence": number between 0 and 1, "languageCode": "ISO code like pt-BR, en-US, es-ES" }`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      language: result.language || "Não identificado",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      languageCode: result.languageCode || "unknown"
    };
  } catch (error) {
    return {
      language: "Erro na detecção",
      confidence: 0,
      languageCode: "unknown"
    };
  }
}
