import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranscriptionSessionSchema, insertAiAnalysisSchema } from "@shared/schema";
import { analyzeTranscriptionContent, generateSummary, detectLanguageFromText, enhanceTranscriptionText } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all transcription sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllTranscriptionSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar sessões" });
    }
  });

  // Create new transcription session
  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertTranscriptionSessionSchema.parse(req.body);
      const session = await storage.createTranscriptionSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação da sessão" });
    }
  });

  // Get specific session
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getTranscriptionSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar sessão" });
    }
  });

  // Update session
  app.patch("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateTranscriptionSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Falha ao atualizar sessão" });
    }
  });

  // Delete session
  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTranscriptionSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      res.json({ message: "Sessão deletada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Falha ao deletar sessão" });
    }
  });

  // Analyze transcription with AI
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { transcription, question } = req.body;
      
      if (!transcription || !question) {
        return res.status(400).json({ message: "Transcrição e pergunta são obrigatórias" });
      }

      const analysis = await analyzeTranscriptionContent(transcription, question);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: error.message || "Falha na análise de IA" });
    }
  });

  // Generate summary
  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { transcription } = req.body;
      
      if (!transcription) {
        return res.status(400).json({ message: "Transcrição é obrigatória" });
      }

      const summary = await generateSummary(transcription);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: error.message || "Falha ao gerar resumo" });
    }
  });

  // Detect language
  app.post("/api/ai/detect-language", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Texto é obrigatório" });
      }

      const detection = await detectLanguageFromText(text);
      res.json(detection);
    } catch (error) {
      res.status(500).json({ message: "Falha na detecção de idioma" });
    }
  });

  // Enhance transcription text with AI
  app.post("/api/ai/enhance", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Texto é obrigatório" });
      }

      const enhancement = await enhanceTranscriptionText(text, targetLanguage);
      res.json(enhancement);
    } catch (error) {
      res.status(500).json({ message: error.message || "Falha no aprimoramento do texto" });
    }
  });

  // Save AI analysis
  app.post("/api/analyses", async (req, res) => {
    try {
      const validatedData = insertAiAnalysisSchema.parse(req.body);
      const analysis = await storage.createAiAnalysis(validatedData);
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para análise" });
    }
  });

  // Get analyses for session
  app.get("/api/sessions/:id/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAiAnalysesBySession(req.params.id);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar análises" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
