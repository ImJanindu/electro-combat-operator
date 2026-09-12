'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmColor?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'CONFIRM',
  confirmColor = 'bg-neon-red hover:bg-red-500 text-background'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm panel-glow">
        <h3 className="font-mono text-lg font-bold text-foreground mb-4">{title}</h3>
        
        <p className="font-mono text-sm text-muted mb-6">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 font-mono text-sm font-bold text-muted hover:text-foreground transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 font-mono text-sm font-bold rounded transition-colors ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
