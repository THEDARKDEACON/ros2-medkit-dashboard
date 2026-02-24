# Help System Usage Guide

This directory contains the help and documentation system for the Dojo Robot Dashboard.

## Components

### HelpSystem

The main help modal that displays documentation and contextual help.

**Features:**
- Multiple documentation sections (Quick Start, API Reference, Keyboard Shortcuts, Troubleshooting)
- Contextual help that changes based on current page
- Markdown rendering for documentation
- Keyboard shortcut support (press `?` to open)

**Usage:**
```tsx
import { HelpSystem } from '@/components/help/HelpSystem';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Help</button>
      <HelpSystem isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

### Tooltip

A reusable tooltip component for providing contextual information on hover.

**Props:**
- `content` (string): The tooltip text to display
- `children` (ReactNode): The element to attach the tooltip to
- `position` ('top' | 'bottom' | 'left' | 'right'): Tooltip position (default: 'top')
- `delay` (number): Delay in milliseconds before showing tooltip (default: 500)

**Usage:**
```tsx
import { Tooltip } from '@/components/help/Tooltip';

function MyComponent() {
  return (
    <Tooltip content="Click to refresh data" position="bottom">
      <button>Refresh</button>
    </Tooltip>
  );
}
```

### FeedbackButton

A button that opens a feedback form for users to submit bug reports, feature requests, and other feedback.

**Features:**
- Multiple feedback types (Bug Report, Feature Request, Improvement, Other)
- Form validation
- Success confirmation
- Optional email field for follow-up

**Usage:**
```tsx
import { FeedbackButton } from '@/components/help/FeedbackButton';

function MyComponent() {
  return <FeedbackButton />;
}
```

## Documentation Files

Documentation content is stored in `src/docs/`:

- `quick-start.md`: Getting started guide for new users
- `api-reference.md`: API endpoint documentation with examples
- `keyboard-shortcuts.md`: Complete keyboard shortcut reference
- `troubleshooting.md`: Common issues and solutions

## Keyboard Shortcuts

- Press `?` anywhere in the app to open the help system
- Press `Esc` to close the help modal

## Contextual Help

The help system automatically provides context-specific help based on the current page:

- **Dashboard**: System health overview help
- **Components**: Component browser help
- **Topics**: Topic monitoring help
- **Operations**: Operations execution help
- **Parameters**: Parameter configuration help
- **Faults**: Fault monitoring help
- **Visualizations**: Visualization controls help
- **Performance**: Performance monitoring help
- **Settings**: Settings and customization help

## Integration

The help system is integrated into the Header component and is available throughout the application. The Tooltip component can be used anywhere to provide contextual help for UI elements.

## Customization

To add new documentation sections:

1. Create a new markdown file in `src/docs/`
2. Import it in `HelpSystem.tsx`
3. Add it to the `sections` array with an appropriate icon

To add contextual help for a new page:

1. Add a new case in the `getContextualHelp()` function in `HelpSystem.tsx`
2. Provide the title and markdown content for that page

## Requirements Satisfied

This implementation satisfies the following requirements:

- **25.1**: Help button in application header
- **25.2**: Tooltips on major UI elements
- **25.3**: Quick start guide
- **25.4**: API endpoint documentation
- **25.5**: Keyboard shortcut reference
- **25.6**: Troubleshooting guide
- **25.7**: Contextual help based on current view
- **25.8**: Feedback mechanism for users
