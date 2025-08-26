import { Mic, MicOff, Trash2, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RecordingControlsProps {
  isRecording: boolean;
  detectedLanguage: string;
  confidence: number;
  audioLevel: number;
  currentLanguage: string;
  enhancedMode: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearTranscript: () => void;
  onSwitchLanguage: (langCode: string) => void;
  onToggleEnhancedMode: () => void;
}

export default function RecordingControls({
  isRecording,
  detectedLanguage,
  confidence,
  audioLevel,
  currentLanguage,
  enhancedMode,
  onStartRecording,
  onStopRecording,
  onClearTranscript,
  onSwitchLanguage,
  onToggleEnhancedMode
}: RecordingControlsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg">Controles de Gravação</h2>
      
      <div className="space-y-6">
        {/* Recording Button */}
        <div className="text-center">
          <button
            data-testid="button-toggle-recording"
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`w-28 h-28 rounded-full flex items-center justify-center shadow-large hover:shadow-glow hover:scale-110 transition-all duration-500 group animate-glow ${
              isRecording 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-accent'
            }`}
          >
            {isRecording ? (
              <MicOff className="text-white text-2xl group-hover:scale-110 transition-transform duration-200" />
            ) : (
              <Mic className="text-white text-2xl group-hover:scale-110 transition-transform duration-200" />
            )}
          </button>
          <p className="text-sm text-white/80 mt-4 font-medium">
            {isRecording ? 'Clique para parar' : 'Clique para iniciar'}
          </p>
          <div className="mt-2">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium shadow-medium ${
              isRecording 
                ? 'bg-red-500/20 text-red-200 border border-red-400/30' 
                : 'bg-white/20 text-white border border-white/30'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                isRecording ? 'bg-red-400 animate-pulse-soft' : 'bg-gray-400'
              }`}></span>
              {isRecording ? 'Gravando...' : 'Pronto para gravar'}
            </span>
          </div>
        </div>

        {/* Language Detection */}
        <div className="glass-card rounded-2xl p-5 border-white/20">
          <h3 className="text-sm font-semibold text-white mb-4">Detecção de Idioma</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Idioma Detectado:</span>
              <span data-testid="text-detected-language" className="text-sm font-medium text-white bg-white/20 px-3 py-1 rounded-full">
                {detectedLanguage}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Confiança:</span>
              <span data-testid="text-confidence" className="text-sm font-medium text-white bg-green-500/30 px-3 py-1 rounded-full">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Audio Levels */}
        <div className="glass-card rounded-2xl p-5 border-white/20">
          <h3 className="text-sm font-semibold text-white mb-4">Nível de Áudio</h3>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-white/20 rounded-full h-3">
              <div 
                data-testid="audio-level-bar"
                className="bg-gradient-accent h-full rounded-full transition-all duration-150 shadow-glow" 
                style={{ width: `${audioLevel}%` }}
              ></div>
            </div>
            <span className="text-xs text-white font-medium bg-white/20 px-2 py-1 rounded">{Math.round(audioLevel)}%</span>
          </div>
        </div>

        {/* Language Selection */}
        <div className="glass-card rounded-2xl p-5 border-white/20">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Idioma da Transcrição
          </h3>
          <Select value={currentLanguage} onValueChange={onSwitchLanguage}>
            <SelectTrigger className="bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              <SelectItem value="en-US">English (United States)</SelectItem>
              <SelectItem value="es-ES">Español (España)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enhanced Mode Toggle */}
        <div className="glass-card rounded-2xl p-5 border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-white" />
              <Label htmlFor="enhanced-mode" className="text-sm font-semibold text-white">
                Modo Avançado IA
              </Label>
            </div>
            <Switch
              id="enhanced-mode"
              checked={enhancedMode}
              onCheckedChange={onToggleEnhancedMode}
              disabled={isRecording}
            />
          </div>
          <p className="text-xs text-white/70 mt-2">
            {enhancedMode ? "Usando Gemini para melhorar a transcrição" : "Usando apenas reconhecimento básico"}
          </p>
        </div>

        {/* Clear Button */}
        <Button
          data-testid="button-clear-transcript"
          onClick={onClearTranscript}
          variant="outline"
          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
          disabled={isRecording}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Transcrição
        </Button>
      </div>
    </div>
  );
}
