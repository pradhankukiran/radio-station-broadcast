import React, { useState, useCallback } from 'react';
import { Upload, Music, FileText, Play, Download, Loader2 } from 'lucide-react';

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  url?: string;
}

interface TranscriptData {
  segments?: Array<{
    text: string;
    speaker?: string;
    timestamp?: string;
  }>;
  text?: string;
}

type ProcessingStep = 'idle' | 'parsing' | 'generating' | 'combining' | 'complete' | 'error';

function App() {
  const [jsonFile, setJsonFile] = useState<UploadedFile | null>(null);
  const [introFile, setIntroFile] = useState<UploadedFile | null>(null);
  const [outroFile, setOutroFile] = useState<UploadedFile | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [finalAudioUrl, setFinalAudioUrl] = useState<string | null>(null);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = useCallback((
    file: File,
    type: 'json' | 'intro' | 'outro',
    setter: React.Dispatch<React.SetStateAction<UploadedFile | null>>
  ) => {
    const uploadedFile: UploadedFile = {
      file,
      name: file.name,
      size: formatFileSize(file.size),
      url: type !== 'json' ? URL.createObjectURL(file) : undefined
    };
    
    setter(uploadedFile);
    
    if (type === 'json') {
      parseJsonFile(file);
    }
  }, []);

  const parseJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as TranscriptData;
      setTranscript(data);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setProcessingStep('error');
    }
  };

  const getTranscriptText = (): string => {
    if (!transcript) return '';
    
    if (transcript.text) {
      return transcript.text;
    }
    
    if (transcript.segments) {
      return transcript.segments.map(segment => segment.text).join(' ');
    }
    
    return '';
  };

  const processAudio = async () => {
    if (!jsonFile || !introFile || !outroFile) {
      alert('Please upload all required files');
      return;
    }

    try {
      setProcessingStep('parsing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate parsing

      setProcessingStep('generating');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate voice generation

      setProcessingStep('combining');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate audio combining
      
      // For demo purposes, we'll use the intro file as the final output
      const finalUrl = URL.createObjectURL(introFile.file);
      setFinalAudioUrl(finalUrl);
      setProcessingStep('complete');
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStep('error');
    }
  };

  const FileUploadCard = ({ 
    title, 
    description, 
    icon: Icon, 
    file, 
    onFileSelect, 
    acceptedTypes,
    color = 'blue'
  }: {
    title: string;
    description: string;
    icon: any;
    file: UploadedFile | null;
    onFileSelect: (file: File) => void;
    acceptedTypes: string;
    color?: 'blue' | 'green' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300',
      green: 'from-green-50 to-emerald-50 border-green-200 hover:border-green-300',
      purple: 'from-purple-50 to-violet-50 border-purple-200 hover:border-purple-300'
    };

    const iconColorClasses = {
      blue: 'text-blue-500',
      green: 'text-green-500', 
      purple: 'text-purple-500'
    };

    return (
      <div className={`relative p-6 rounded-xl border-2 border-dashed bg-gradient-to-br ${colorClasses[color]} transition-all duration-200 hover:shadow-lg group cursor-pointer`}
           onClick={() => document.getElementById(`file-${title}`)?.click()}>
        <input
          id={`file-${title}`}
          type="file"
          accept={acceptedTypes}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow ${iconColorClasses[color]}`}>
            <Icon size={24} />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          
          {file ? (
            <div className="w-full p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 truncate">{file.name}</span>
                <span className="text-sm text-gray-500 ml-2">{file.size}</span>
              </div>
              {file.url && (
                <audio controls className="w-full mt-2" preload="metadata">
                  <source src={file.url} />
                </audio>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Click to browse or drag & drop
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProcessingIndicator = () => {
    const steps = [
      { key: 'parsing', label: 'Parsing transcript', icon: FileText },
      { key: 'generating', label: 'Generating voice', icon: Upload },
      { key: 'combining', label: 'Combining audio', icon: Music },
      { key: 'complete', label: 'Complete', icon: Download }
    ];

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Processing Status</h3>
        <div className="space-y-3">
          {steps.map(({ key, label, icon: Icon }) => {
            const isActive = processingStep === key;
            const isComplete = steps.findIndex(s => s.key === processingStep) > steps.findIndex(s => s.key === key);
            
            return (
              <div key={key} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 
                isComplete ? 'bg-green-50 text-green-700' : 
                'text-gray-400'
              }`}>
                {isActive ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Icon size={20} />
                )}
                <span className="font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Radio Station Voice Generator
          </h1>
        </div>

        {/* File Upload Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <FileUploadCard
            title="JSON Data"
            description="Upload your FB events in JSON format"
            icon={FileText}
            file={jsonFile}
            onFileSelect={(file) => handleFileUpload(file, 'json', setJsonFile)}
            acceptedTypes=".json"
            color="blue"
          />
          
          <FileUploadCard
            title="Intro Music"
            description="Upload intro music file (MP3, WAV)"
            icon={Music}
            file={introFile}
            onFileSelect={(file) => handleFileUpload(file, 'intro', setIntroFile)}
            acceptedTypes=".mp3,.wav,.m4a"
            color="green"
          />
          
          <FileUploadCard
            title="Outro Music"
            description="Upload outro music file (MP3, WAV)"
            icon={Music}
            file={outroFile}
            onFileSelect={(file) => handleFileUpload(file, 'outro', setOutroFile)}
            acceptedTypes=".mp3,.wav,.m4a"
            color="purple"
          />
        </div>

        {/* Transcript Preview */}
        {transcript && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="font-semibold text-lg mb-4">Transcript Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">
                {getTranscriptText().substring(0, 500)}
                {getTranscriptText().length > 500 && '...'}
              </p>
            </div>
          </div>
        )}

        {/* Processing Section */}
        {processingStep !== 'idle' && (
          <ProcessingIndicator />
        )}

        {/* Generate Button */}
        <div className="text-center mb-8">
          <button
            onClick={processAudio}
            disabled={!jsonFile || !introFile || !outroFile || processingStep === 'generating'}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
          >
            {processingStep === 'generating' ? (
              <span className="flex items-center space-x-2">
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Play size={20} />
                <span>Generate Voice & Combine</span>
              </span>
            )}
          </button>
        </div>

        {/* Final Audio Section */}
        {finalAudioUrl && processingStep === 'complete' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Final Audio</h3>
            <div className="space-y-4">
              <audio controls className="w-full">
                <source src={finalAudioUrl} />
              </audio>
              <div className="text-center">
                <a
                  href={finalAudioUrl}
                  download="radio-show.mp3"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={20} />
                  <span>Download Final Audio</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {processingStep === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">
              An error occurred during processing. Please check your files and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;