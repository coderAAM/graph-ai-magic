import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onGraphCommand: (command: string) => void;
  isProcessing: boolean;
}

const EXAMPLE_PROMPTS = [
  "Create a binary tree with 7 nodes",
  "Show me a mutex graph",
  "Generate a random graph with 5 nodes",
  "Create a linked list of 4 elements",
];

export const ChatPanel = ({ onGraphCommand, isProcessing }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your graph assistant. Describe what kind of graph you'd like to create, and I'll generate it for you. Try saying \"Create a binary tree\" or \"Show me a mutex graph\".",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    onGraphCommand(input.trim());
    setInput('');
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const addAssistantMessage = (content: string) => {
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  // Expose method to parent
  useEffect(() => {
    (window as any).addAssistantMessage = addAssistantMessage;
    return () => {
      delete (window as any).addAssistantMessage;
    };
  }, []);

  return (
    <div className="h-full flex flex-col glass-panel-strong overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Graph Assistant</h2>
            <p className="text-xs text-muted-foreground">AI-powered graph generation</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 animate-slide-up',
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                message.role === 'user'
                  ? 'bg-primary/20'
                  : 'bg-accent/20'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-primary" />
              ) : (
                <Bot className="w-4 h-4 text-accent" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-2',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              )}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            </div>
            <div className="bg-secondary rounded-xl px-4 py-2">
              <p className="text-sm text-muted-foreground">Generating graph...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleExampleClick(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors border border-border/30"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your graph..."
            disabled={isProcessing}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          <Button
            type="submit"
            size="icon"
            variant="glow"
            disabled={!input.trim() || isProcessing}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
