'use client';

import { useState, useRef, useEffect } from 'react';

interface PinDialogProps {
  isOpen: boolean;
  title: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

export function PinDialog({ isOpen, title, onConfirm, onCancel }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm panel-glow">
        <h3 className="font-mono text-lg font-bold text-foreground mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 font-mono text-foreground mb-6 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
          />
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 font-mono text-sm font-bold text-muted hover:text-foreground transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-mono text-sm font-bold bg-neon-blue text-background rounded hover:bg-blue-400 transition-colors"
            >
              CONFIRM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

