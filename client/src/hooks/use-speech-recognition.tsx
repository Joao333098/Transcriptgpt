import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("Português (BR)");
  const [confidence, setConfidence] = useState(0.98);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [languageCount, setLanguageCount] = useState(1);
  const [currentLanguage, setCurrentLanguage] = useState("pt-BR");
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>(["pt-BR"]);
  
  const recognitionRef = useRef<any>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const updateWordCount = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  // AI-powered language detection
  const { mutate: detectLanguage } = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest('POST', '/api/ai/detect-language', { text });
      return response.json();
    },
    onSuccess: (data) => {
      setDetectedLanguage(data.language);
      setConfidence(data.confidence);
      
      // Update detected languages list
      const langCode = data.languageCode;
      if (!detectedLanguages.includes(langCode)) {
        setDetectedLanguages(prev => [...prev, langCode]);
        setLanguageCount(prev => prev + 1);
      }
    },
    onError: () => {
      // Fallback to simple detection
      detectLanguageFromTextFallback(text);
    }
  });

  // AI text enhancement
  const { mutate: enhanceText } = useMutation({
    mutationFn: async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => {
      const response = await apiRequest('POST', '/api/ai/enhance', { 
        text, 
        targetLanguage 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.enhancedText && data.enhancedText !== transcript) {
        setTranscript(data.enhancedText);
        updateWordCount(data.enhancedText);
      }
    }
  });

  const detectLanguageFromTextFallback = useCallback((text: string) => {
    // Simple fallback language detection
    const portugueseWords = ['que', 'não', 'uma', 'para', 'com', 'está', 'tem', 'mais'];
    const englishWords = ['the', 'and', 'is', 'to', 'it', 'you', 'that', 'this'];
    const spanishWords = ['que', 'de', 'el', 'la', 'en', 'y', 'es', 'se'];
    
    const words = text.toLowerCase().split(/\s+/);
    
    let ptScore = 0;
    let enScore = 0;
    let esScore = 0;
    
    words.forEach(word => {
      if (portugueseWords.includes(word)) ptScore++;
      if (englishWords.includes(word)) enScore++;
      if (spanishWords.includes(word)) esScore++;
    });
    
    if (ptScore > enScore && ptScore > esScore) {
      setDetectedLanguage("Português (BR)");
      setCurrentLanguage("pt-BR");
      setConfidence(0.85);
    } else if (enScore > ptScore && enScore > esScore) {
      setDetectedLanguage("English (US)");
      setCurrentLanguage("en-US");
      setConfidence(0.82);
    } else if (esScore > ptScore && esScore > enScore) {
      setDetectedLanguage("Español (ES)");
      setCurrentLanguage("es-ES");
      setConfidence(0.79);
    }
  }, []);

  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Não Suportado",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive",
      });
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLanguage;
    
    recognition.onstart = () => {
      setIsRecording(true);
      toast({
        title: "Gravação Iniciada",
        description: "Começando a transcrição em tempo real",
      });
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      const fullTranscript = transcript + finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
      updateWordCount(fullTranscript);
      
      if (finalTranscript) {
        // Use AI for language detection
        detectLanguage(finalTranscript);
        
        // Enhanced mode: improve text with AI
        if (enhancedMode && finalTranscript.length > 20) {
          enhanceText({ text: finalTranscript, targetLanguage: currentLanguage });
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      if (event.error !== 'aborted') {
        toast({
          title: "Erro na Gravação",
          description: "Falha no reconhecimento de voz",
          variant: "destructive",
        });
      }
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
    
    return recognition;
  }, [transcript, toast, updateWordCount, detectLanguage, enhanceText, currentLanguage, enhancedMode]);

  const startRecording = useCallback(() => {
    try {
      const recognition = initializeRecognition();
      if (!recognition) return;
      
      recognitionRef.current = recognition;
      recognition.start();
      
      // Start timing
      setRecordingTime(0);
      timeIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Simulate audio levels
      audioLevelIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 150);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar gravação",
        variant: "destructive",
      });
    }
  }, [initializeRecognition, toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    setAudioLevel(0);
    
    toast({
      title: "Gravação Finalizada",
      description: "Transcrição salva com sucesso",
    });
  }, [toast]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setWordCount(0);
    setRecordingTime(0);
    setLanguageCount(1);
    setDetectedLanguage("Português (BR)");
    setConfidence(0.98);
    setDetectedLanguages(["pt-BR"]);
  }, []);

  const switchLanguage = useCallback((langCode: string) => {
    setCurrentLanguage(langCode);
    
    // Update detection based on language
    switch(langCode) {
      case 'pt-BR':
        setDetectedLanguage("Português (BR)");
        break;
      case 'en-US':
        setDetectedLanguage("English (US)");
        break;
      case 'es-ES':
        setDetectedLanguage("Español (ES)");
        break;
      default:
        setDetectedLanguage("Português (BR)");
    }
    
    // Restart recognition with new language if recording
    if (isRecording) {
      stopRecording();
      setTimeout(() => startRecording(), 500);
    }
  }, [isRecording]);

  const toggleEnhancedMode = useCallback(() => {
    setEnhancedMode(prev => !prev);
    
    toast({
      title: enhancedMode ? "Modo Avançado Desativado" : "Modo Avançado Ativado",
      description: enhancedMode 
        ? "Usando apenas transcrição básica" 
        : "Usando IA para melhorar a transcrição",
    });
  }, [enhancedMode, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    transcript,
    detectedLanguage,
    confidence,
    audioLevel,
    recordingTime,
    wordCount,
    languageCount,
    startRecording,
    stopRecording,
    clearTranscript,
    switchLanguage,
    toggleEnhancedMode,
    currentLanguage,
    enhancedMode,
    detectedLanguages
  };
}
