import { useState, useMemo } from 'react';
import { Send, CheckCircle, AlertCircle, FileJson, Copy } from 'lucide-react';
import { usePublishTopic } from '@/features/api/hooks';

interface TopicPublisherProps {
  /**
   * The ID of the component to publish to
   */
  componentId: string;
  /**
   * The name of the topic to publish to
   */
  topicName: string;
  /**
   * Optional message type for template suggestions
   */
  messageType?: string;
}

/**
 * Message templates for common ROS2 message types
 */
const MESSAGE_TEMPLATES: Record<string, unknown> = {
  'geometry_msgs/Twist': {
    linear: { x: 0.0, y: 0.0, z: 0.0 },
    angular: { x: 0.0, y: 0.0, z: 0.0 },
  },
  'std_msgs/String': {
    data: '',
  },
  'std_msgs/Int32': {
    data: 0,
  },
  'std_msgs/Float64': {
    data: 0.0,
  },
  'std_msgs/Bool': {
    data: false,
  },
  'sensor_msgs/JointState': {
    header: {
      stamp: { sec: 0, nanosec: 0 },
      frame_id: '',
    },
    name: [],
    position: [],
    velocity: [],
    effort: [],
  },
  'nav_msgs/Odometry': {
    header: {
      stamp: { sec: 0, nanosec: 0 },
      frame_id: 'odom',
    },
    child_frame_id: 'base_link',
    pose: {
      pose: {
        position: { x: 0.0, y: 0.0, z: 0.0 },
        orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
      },
      covariance: Array(36).fill(0),
    },
    twist: {
      twist: {
        linear: { x: 0.0, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.0 },
      },
      covariance: Array(36).fill(0),
    },
  },
};

/**
 * TopicPublisher - Interface for publishing messages to ROS2 topics
 * 
 * Features:
 * - JSON message editor with syntax validation
 * - Publish button with validation state
 * - Success/error notifications
 * - Message templates for common types
 * - Copy template functionality
 */
export function TopicPublisher({
  componentId,
  topicName,
  messageType,
}: TopicPublisherProps) {
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const publishTopic = usePublishTopic();

  // Validate JSON syntax
  const validationResult = useMemo(() => {
    if (!message.trim()) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    try {
      JSON.parse(message);
      return { isValid: true, error: null };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  }, [message]);

  // Get template for current message type
  const template = useMemo(() => {
    if (!messageType) return null;
    return MESSAGE_TEMPLATES[messageType] || null;
  }, [messageType]);

  // Handle message change
  const handleMessageChange = (value: string) => {
    setMessage(value);
    setShowSuccess(false);
    setShowError(false);
  };

  // Handle template copy
  const handleCopyTemplate = () => {
    if (template) {
      setMessage(JSON.stringify(template, null, 2));
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!validationResult.isValid) {
      return;
    }

    try {
      const parsedMessage = JSON.parse(message);
      await publishTopic.mutateAsync({
        componentId,
        topicName,
        message: parsedMessage,
      });

      // Show success notification
      setShowSuccess(true);
      setShowError(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      // Show error notification
      setShowError(true);
      setShowSuccess(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to publish message'
      );
      setTimeout(() => setShowError(false), 5000);
    }
  };

  // Handle key press (Ctrl+Enter to publish)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (validationResult.isValid) {
        handlePublish();
      }
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileJson className="h-5 w-5" aria-hidden="true" />
              Publish Message
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Compose and publish a message to {topicName}
            </p>
          </div>

          {/* Template Button */}
          {template && (
            <button
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Copy message template"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Use Template
            </button>
          )}
        </div>
      </div>

      {/* Message Editor */}
      <div className="p-4 space-y-4">
        {/* Template Info */}
        {template && (
          <div className="p-3 bg-muted/50 border border-border rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Template available:
              </span>{' '}
              {messageType}
            </p>
          </div>
        )}

        {/* JSON Editor */}
        <div className="space-y-2">
          <label
            htmlFor="message-editor"
            className="block text-sm font-medium text-foreground"
          >
            Message (JSON)
          </label>
          <textarea
            id="message-editor"
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='{\n  "data": "your message here"\n}'
            className={`w-full h-64 px-3 py-2 font-mono text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y ${
              message && !validationResult.isValid
                ? 'border-destructive focus:ring-destructive'
                : 'border-input'
            }`}
            aria-invalid={message ? !validationResult.isValid : undefined}
            aria-describedby={
              message && !validationResult.isValid
                ? 'validation-error'
                : undefined
            }
          />
          <p className="text-xs text-muted-foreground">
            Tip: Press Ctrl+Enter to publish
          </p>
        </div>

        {/* Validation Error */}
        {message && !validationResult.isValid && (
          <div
            id="validation-error"
            className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
            role="alert"
          >
            <AlertCircle
              className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Invalid JSON
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {validationResult.error}
              </p>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {showSuccess && (
          <div
            className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md"
            role="status"
          >
            <CheckCircle
              className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Message published successfully
              </p>
              <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                Your message has been sent to {topicName}
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {showError && (
          <div
            className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
            role="alert"
          >
            <AlertCircle
              className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Failed to publish message
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Publish Button */}
        <div className="flex justify-end">
          <button
            onClick={handlePublish}
            disabled={!validationResult.isValid || publishTopic.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            aria-label="Publish message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {publishTopic.isPending ? 'Publishing...' : 'Publish Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
