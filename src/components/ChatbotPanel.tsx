import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CalculationResult, CalculatorState } from '../types';
import { Send, User, Bot, Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { formatEngineering, ENERGY_UNITS, POWER_UNITS, PEAK_POWER_UNITS, TIME_UNITS, FREQUENCY_UNITS } from '../utils/units';

interface ChatbotPanelProps {
  context: {
    inputs: CalculatorState;
    result: CalculationResult | null;
  };
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

type Status = 'Connected' | 'Connecting' | 'Offline explanation mode' | 'Configuration error';

const LOCAL_EXPLANATIONS: Record<string, (result: CalculationResult) => string> = {
  "pulse energy": (r) => `**Pulse Energy ($E_{pulse}$)**\n\nPulse energy represents the total energy contained in a single laser pulse. It is calculated as $E_{pulse} = \\frac{P_{avg}}{f_{rep}}$.\n\nFor your parameters, concentrating ${formatEngineering(r.averagePower, POWER_UNITS).value.toPrecision(3)} ${formatEngineering(r.averagePower, POWER_UNITS).unit} of average power into a train of pulses separated by ${formatEngineering(r.repetitionPeriod, TIME_UNITS).value.toPrecision(3)} ${formatEngineering(r.repetitionPeriod, TIME_UNITS).unit} (at ${formatEngineering(r.repetitionRate, FREQUENCY_UNITS).value.toPrecision(3)} ${formatEngineering(r.repetitionRate, FREQUENCY_UNITS).unit}) means each pulse contains ${formatEngineering(r.pulseEnergy, ENERGY_UNITS).value.toPrecision(3)} ${formatEngineering(r.pulseEnergy, ENERGY_UNITS).unit}.`,
  "peak power": (r) => `**Peak Power ($P_{peak}$)**\n\nPeak power is the maximum optical power achieved during the pulse. It is calculated by dividing the pulse energy by the pulse duration, and multiplying by a pulse-shape factor.\n\nFor a ${r.pulseShape} pulse, the peak power is approximately ${formatEngineering(r.peakPower, PEAK_POWER_UNITS).value.toPrecision(3)} ${formatEngineering(r.peakPower, PEAK_POWER_UNITS).unit}.`,
  "average power": (r) => `**Average Power ($P_{avg}$)**\n\nAverage power is the total energy emitted per second. It is the product of the energy per pulse and the number of pulses per second (repetition rate): $P_{avg} = E_{pulse} \\times f_{rep}$.`,
  "pulse duration": (r) => `**Pulse Duration ($\\tau$)**\n\nPulse duration, often measured as the Full Width at Half Maximum (FWHM), indicates how long the optical pulse lasts in time. Your calculated pulse duration is ${formatEngineering(r.pulseDuration, TIME_UNITS).value.toPrecision(3)} ${formatEngineering(r.pulseDuration, TIME_UNITS).unit}.`,
  "repetition rate": (r) => `**Repetition Rate ($f_{rep}$)**\n\nThe repetition rate specifies how many pulses the laser emits per second. A rate of ${formatEngineering(r.repetitionRate, FREQUENCY_UNITS).value.toPrecision(3)} ${formatEngineering(r.repetitionRate, FREQUENCY_UNITS).unit} means the time between pulses is ${formatEngineering(r.repetitionPeriod, TIME_UNITS).value.toPrecision(3)} ${formatEngineering(r.repetitionPeriod, TIME_UNITS).unit}.`,
  "duty cycle": (r) => `**Duty Cycle**\n\nThe duty cycle represents the fraction of time the laser is actively emitting light. With a duty cycle of ${(r.dutyCycle * 100).toExponential(3)}%, the pulse is approximately ${(r.repetitionPeriod / r.pulseDuration).toPrecision(3)} times shorter than the interval between pulses.`,
  "pulse shape": (r) => `**Pulse-Shape Correction**\n\nThe temporal shape of the pulse affects how energy translates into peak power. For a ${r.pulseShape} shape, a correction factor is applied. Rectangular pulses use a factor of 1, Gaussian uses ~0.94, and Sech² uses ~0.88.`,
  "difference between average and peak power": (r) => `**Average vs. Peak Power**\n\nAverage power is the power averaged over the entire repetition period, including the "off" time. Peak power is the power during the very brief "on" time of the pulse.\n\nBy concentrating ${formatEngineering(r.pulseEnergy, ENERGY_UNITS).value.toPrecision(3)} ${formatEngineering(r.pulseEnergy, ENERGY_UNITS).unit} into a short ${formatEngineering(r.pulseDuration, TIME_UNITS).value.toPrecision(3)} ${formatEngineering(r.pulseDuration, TIME_UNITS).unit} duration, the peak power reaches ${formatEngineering(r.peakPower, PEAK_POWER_UNITS).value.toPrecision(3)} ${formatEngineering(r.peakPower, PEAK_POWER_UNITS).unit}, while the average power remains ${formatEngineering(r.averagePower, POWER_UNITS).value.toPrecision(3)} ${formatEngineering(r.averagePower, POWER_UNITS).unit}.`
};

export function ChatbotPanel({ context }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hello! I am the Pulse Physics Assistant. I can help explain your calculations, ultrafast laser physics, or how changing parameters affects the outcome. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>('Connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLocalFallback = (query: string): string => {
    const q = query.toLowerCase();
    let bestMatch = '';
    
    if (q.includes('difference') || (q.includes('why') && q.includes('larger') && q.includes('average'))) bestMatch = "difference between average and peak power";
    else if (q.includes('shape') || q.includes('gaussian') || q.includes('sech')) bestMatch = "pulse shape";
    else if (q.includes('energy')) bestMatch = "pulse energy";
    else if (q.includes('duration') || q.includes('width') || q.includes('long')) bestMatch = "pulse duration";
    else if (q.includes('rate') || q.includes('frequency')) bestMatch = "repetition rate";
    else if (q.includes('duty cycle') || q.includes('duty')) bestMatch = "duty cycle";
    else if (q.includes('peak power') || q.includes('peak')) bestMatch = "peak power";
    else if (q.includes('average power') || q.includes('average')) bestMatch = "average power";

    if (bestMatch && context.result) {
      return LOCAL_EXPLANATIONS[bestMatch](context.result);
    }
    return "I am currently in Offline Explanation Mode. Please ask about pulse energy, peak power, average power, pulse duration, repetition rate, duty cycle, pulse shape, or the difference between average and peak power to receive a local explanation.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setStatus('Connecting');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }].map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          })),
          context: context.result ? {
            ...context.result,
            pulseShape: context.inputs.pulseShape,
            mode: context.inputs.mode
          } : { status: 'No calculations performed yet', inputs: context.inputs }
        })
      });

      if (!response.ok) {
        if (response.status === 500 || response.status === 503) {
           throw new Error('Offline');
        }
        throw new Error('API Error');
      }
      
      setStatus('Connected');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              assistantMsg += data.text;
              
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = assistantMsg;
                return newMsgs;
              });
            } catch (e) {
              console.error("Error parsing JSON chunk:", e, dataStr);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      if (error.message === 'Offline' || error.message.includes('fetch')) {
         setStatus('Offline explanation mode');
         setMessages(prev => [...prev, { role: 'model', content: getLocalFallback(userMsg) }]);
      } else {
         setStatus('Configuration error');
         setMessages(prev => [...prev, { role: 'model', content: "There is a configuration error with the AI service. " + getLocalFallback(userMsg) }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const presetQuestions = [
    "How was this result calculated?",
    "Why is peak power much larger than average power?",
    "What is the difference between average and peak power?",
    "Why does pulse shape affect peak power?",
    "Is this result reasonable for a fiber laser?"
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex-1">Pulse Physics Assistant</h2>
        </div>
        <div className="flex items-center space-x-1.5">
          {status === 'Connected' && <Wifi className="w-3 h-3 text-green-600" />}
          {status === 'Connecting' && <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />}
          {status === 'Offline explanation mode' && <WifiOff className="w-3 h-3 text-orange-500" />}
          {status === 'Configuration error' && <AlertTriangle className="w-3 h-3 text-red-500" />}
          <span className={`text-[9px] uppercase tracking-wider ${
            status === 'Connected' ? 'text-green-600' :
            status === 'Connecting' ? 'text-blue-600' :
            status === 'Offline explanation mode' ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {status}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end space-y-1' : 'space-y-1'}`}>
            <div className={`p-3 text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-50 border border-blue-200 rounded-lg rounded-tr-none text-blue-900 text-right' 
                : 'bg-slate-100 border border-slate-200 rounded-lg rounded-tl-none text-slate-800'
            }`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2 prose-headings:mt-4 prose-math:text-blue-600">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === 'model' && <span className="text-[9px] text-slate-500 ml-1">Assistant</span>}
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col space-y-1">
             <div className="bg-slate-100 border border-slate-200 p-3 rounded-lg rounded-tl-none text-xs text-slate-500 flex items-center">
               <Loader2 className="w-3 h-3 animate-spin mr-2 text-blue-600" /> Thinking...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex flex-wrap gap-2 mb-3">
          {presetQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="text-[10px] py-1 px-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors whitespace-nowrap shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about pulse physics..."
            className="w-full bg-slate-50 border border-slate-200 shadow-inner rounded-full px-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-2 text-blue-600 disabled:opacity-50 transition-opacity hover:text-blue-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
