import { useState } from "react";
import { Copy, Download, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TranscriptionEntry {
  id: string;
  timestamp: string;
  language: string;
  languageCode: string;
  text: string;
}

interface TranscriptionDisplayProps {
  transcript: string;
  isRecording: boolean;
  currentSessionId: string | null;
}

export default function TranscriptionDisplay({
  transcript,
  isRecording,
  currentSessionId
}: TranscriptionDisplayProps) {
  const { toast } = useToast();
  const [transcriptionEntries, setTranscriptionEntries] = useState<TranscriptionEntry[]>([]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({
        title: "Sucesso",
        description: "Transcrição copiada para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar transcrição",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Sucesso",
      description: "Transcrição baixada com sucesso",
    });
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white drop-shadow-lg">Transcrição em Tempo Real</h2>
        <div className="flex items-center space-x-3">
          <Button
            data-testid="button-copy-transcript"
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            disabled={!transcript}
            className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-download-transcript"
            onClick={handleDownload}
            variant="ghost"
            size="sm"
            disabled={!transcript}
            className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            data-testid="button-expand-transcript"
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 h-80 overflow-y-auto border-2 border-dashed border-white/30 shadow-large">
        {transcript ? (
          <div className="space-y-4">
            <div className="animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 animate-pulse-soft"></div>
                <div>
                  <p className="text-white/70 text-sm mb-1">
                    <span className="text-white font-medium bg-white/20 px-2 py-1 rounded">
                      [PT-BR {formatTimestamp(new Date())}]
                    </span>
                  </p>
                  <p data-testid="text-transcript-content" className="text-white leading-relaxed text-lg">
                    {transcript}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/60">
            <div className="text-center">
              <i className="fas fa-microphone-slash text-5xl mb-4 opacity-50"></i>
              <p className="text-lg">Inicie a gravação para ver a transcrição aqui</p>
            </div>
          </div>
        )}

        {/* Real-time typing indicator */}
        {isRecording && (
          <div className="flex items-center space-x-2 mt-4 opacity-75">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-1 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span data-testid="text-transcribing-indicator" className="text-xs text-white/70 font-medium">Transcrevendo...</span>
          </div>
        )}
      </div>
    </div>
  );
}
