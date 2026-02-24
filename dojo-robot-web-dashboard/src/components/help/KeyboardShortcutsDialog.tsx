import { X, Keyboard } from 'lucide-react';
import { getKeyboardShortcuts } from '@/hooks/useKeyboardNavigation';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  if (!isOpen) return null;

  const shortcuts = getKeyboardShortcuts();
  const categories = {
    navigation: shortcuts.filter((s) => s.category === 'navigation'),
    view: shortcuts.filter((s) => s.category === 'view'),
    action: shortcuts.filter((s) => s.category === 'action'),
    general: shortcuts.filter((s) => s.category === 'general'),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div
        className="bg-background border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2
              id="keyboard-shortcuts-title"
              className="text-lg font-semibold text-foreground"
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close keyboard shortcuts dialog"
            data-keyboard-shortcut="close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Navigation */}
          {categories.navigation.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Navigation
              </h3>
              <div className="space-y-2">
                {categories.navigation.map((shortcut, index) => (
                  <ShortcutRow
                    key={index}
                    shortcut={shortcut.key}
                    description={shortcut.description}
                  />
                ))}
              </div>
            </section>
          )}

          {/* View */}
          {categories.view.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                View
              </h3>
              <div className="space-y-2">
                {categories.view.map((shortcut, index) => (
                  <ShortcutRow
                    key={index}
                    shortcut={shortcut.key}
                    description={shortcut.description}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          {categories.action.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                {categories.action.map((shortcut, index) => (
                  <ShortcutRow
                    key={index}
                    shortcut={shortcut.key}
                    description={shortcut.description}
                  />
                ))}
              </div>
            </section>
          )}

          {/* General */}
          {categories.general.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                General
              </h3>
              <div className="space-y-2">
                {categories.general.map((shortcut, index) => (
                  <ShortcutRow
                    key={index}
                    shortcut={shortcut.key}
                    description={shortcut.description}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

interface ShortcutRowProps {
  shortcut: string;
  description: string;
}

function ShortcutRow({ shortcut, description }: ShortcutRowProps) {
  const keys = shortcut.split('+');

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-muted-foreground">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
