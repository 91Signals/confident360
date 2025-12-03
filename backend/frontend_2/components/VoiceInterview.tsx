'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { Mic, MicOff, Power, BarChart2, Loader2, Volume2, User, Sparkles } from 'lucide-react';

interface Props {
  mode: 'intro' | 'walkthrough' | 'critique';
  onScore?: (score: number) => void;
}

// --- Audio Helper Functions ---
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const VoiceInterview: React.FC<Props> = ({ mode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [isMicOn, setIsMicOn] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for Audio
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback scheduling
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const getSystemInstruction = () => {
    switch (mode) {
      case 'intro':
        return "You are a professional Design Hiring Manager. Your goal is to screen a candidate. Ask them to introduce themselves and explain why they are a good fit for a Product Design role. Keep your responses concise. After they answer, give brief feedback on their confidence and clarity.";
      case 'walkthrough':
        return "You are a Senior Product Designer conducting a portfolio review. Ask the candidate to walk you through their most recent case study. Focus your follow-up questions on their problem definition and outcome metrics. Be professional but friendly.";
      case 'critique':
        return "You are a Design Lead. I want to test the candidate's product thinking. Describe a simple UI component (like a Date Picker or a Checkout Form) that has a usability issue, and ask the candidate how they would fix it. Challenge their assumptions gently.";
      default:
        return "You are a helpful interviewer.";
    }
  };

  const startSession = async () => {
    setError(null);
    try {
      // 1. Check API Key
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
         // @ts-ignore
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
         }
      }

      // 2. Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      // 3. Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 4. Connect to Gemini Live
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: getSystemInstruction(),
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            // Setup Input Pipeline
            if (!inputContextRef.current) return;
            
            const source = inputContextRef.current.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            // Using ScriptProcessor for demo simplicity (AudioWorklet is better for prod)
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (!isMicOn) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume visualization for mic
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              const rms = Math.sqrt(sum/inputData.length);
              setVolumeLevel(Math.min(rms * 10, 1)); // Scale for UI

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
               setIsSpeaking(true);
               const ctx = outputContextRef.current;
               
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
               const source = ctx.createBufferSource();
               source.buffer = buffer;
               source.connect(ctx.destination);
               
               source.onended = () => {
                 audioSourcesRef.current.delete(source);
                 if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
               };
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += buffer.duration;
               audioSourcesRef.current.add(source);
            }

            // Handle Turn Complete (optional hook for transcriptions)
            if (msg.serverContent?.turnComplete) {
               setIsSpeaking(false);
            }
          },
          onclose: () => {
            setIsConnected(false);
            cleanup();
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection failed. Please try again.");
            setIsConnected(false);
            cleanup();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setError("Could not access microphone or API key.");
    }
  };

  const cleanup = () => {
    // Stop mic tracks
    streamRef.current?.getTracks().forEach(t => t.stop());
    // Disconnect audio nodes
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    // Close contexts
    inputContextRef.current?.close();
    outputContextRef.current?.close();
    // Stop audio sources
    audioSourcesRef.current.forEach(s => s.stop());
    audioSourcesRef.current.clear();
    
    setIsConnected(false);
    setIsSpeaking(false);
    setVolumeLevel(0);
  };

  const stopSession = () => {
    // We can't explicitly close the session object easily from here without the resolved promise
    // but cleaning up the audio context effectively stops the interaction locally.
    cleanup();
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-sm font-medium text-slate-400">
               {isConnected ? 'Live Connection Active' : 'Ready to Connect'}
            </span>
         </div>
         {error && <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-900/50">{error}</span>}
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl mb-8">
         {/* Background Effects */}
         <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
         
         {isConnected ? (
            <div className="relative z-10 flex flex-col items-center">
                {/* AI Avatar / Visualizer */}
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 mb-8 ${isSpeaking ? 'bg-blue-500/20 scale-110 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'bg-slate-800'}`}>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-slate-950 border border-slate-700 ${isSpeaking ? 'border-blue-400' : ''}`}>
                        <Sparkles className={`w-10 h-10 ${isSpeaking ? 'text-blue-400' : 'text-slate-500'}`} />
                    </div>
                    {/* Ripple Rings */}
                    {isSpeaking && (
                        <>
                           <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping"></div>
                           <div className="absolute -inset-4 rounded-full border border-blue-500/10 animate-[ping_2s_infinite]"></div>
                        </>
                    )}
                </div>
                
                <div className="h-12 flex items-end justify-center gap-1 mb-4">
                   {/* Mic Visualizer Bars */}
                   {[1,2,3,4,5].map(i => (
                      <div 
                        key={i} 
                        className="w-2 bg-slate-700 rounded-full transition-all duration-75"
                        style={{ 
                           height: isConnected && !isSpeaking ? `${Math.max(8, volumeLevel * 40 * (Math.random() + 0.5))}px` : '8px',
                           backgroundColor: isConnected && !isSpeaking && volumeLevel > 0.05 ? '#34d399' : '#334155'
                        }}
                      ></div>
                   ))}
                </div>
                
                <p className="text-slate-400 text-sm font-medium animate-pulse">
                   {isSpeaking ? "Agent is speaking..." : "Listening..."}
                </p>
            </div>
         ) : (
            <div className="text-center z-10">
               <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl border border-slate-700">
                  <Mic className="w-10 h-10 text-slate-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Start your Mock Interview</h3>
               <p className="text-slate-400 max-w-sm mx-auto">
                  Enable your microphone to begin the {mode} session. AI will provide real-time feedback.
               </p>
            </div>
         )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-6">
         {!isConnected ? (
            <button 
               onClick={startSession}
               className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-1"
            >
               <Power className="w-5 h-5" />
               Start Session
            </button>
         ) : (
            <>
               <button 
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-4 rounded-xl border transition-all ${isMicOn ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}
               >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
               </button>
               
               <button 
                  onClick={stopSession}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all"
               >
                  <Power className="w-5 h-5" />
                  End Interview
               </button>
            </>
         )}
      </div>
    </div>
  );
};