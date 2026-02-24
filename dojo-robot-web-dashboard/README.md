# Dojo Robot Web Dashboard

A sophisticated, real-time monitoring and control interface for autonomous robot systems built with React, TypeScript, and Vite. This dashboard provides comprehensive visibility into robot operations through an elegant, responsive interface that handles high-frequency data streams, complex visualizations, and real-time fault monitoring.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [API Integration](#api-integration)
- [Real-time Features](#real-time-features)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Dojo Robot Web Dashboard serves as a mission control center for autonomous robot systems, providing operators, developers, and researchers with comprehensive visibility into robot operations. The dashboard combines modern web technologies with creative visualization techniques to deliver an exceptional user experience.

### Design Philosophy

1. **Performance First**: Optimized for real-time data streaming with minimal latency
2. **Progressive Enhancement**: Core functionality works everywhere, advanced features enhance capable browsers
3. **Resilient Architecture**: Graceful degradation when connections fail or data is unavailable
4. **Developer Experience**: Clean abstractions, type safety, and comprehensive testing
5. **Visual Excellence**: Stunning UI that makes complex data comprehensible at a glance

### What Makes This Dashboard Special

- **Real-time Everything**: Live data streaming via Server-Sent Events (SSE) and WebSocket with automatic fallback to HTTP polling
- **Intelligent Caching**: React Query-powered caching with configurable TTL for optimal performance
- **Type-Safe**: Full TypeScript coverage with strict type checking
- **Property-Based Testing**: Comprehensive test suite with 80+ property-based tests ensuring correctness across all inputs
- **Accessible**: WCAG AA compliant with full keyboard navigation and screen reader support
- **Responsive**: Adapts seamlessly from mobile to desktop with intelligent layout adjustments

## Key Features

### Component Management
- **Hierarchical Organization**: Browse robot components organized by functional areas (Powertrain, Chassis, Perception, etc.)
- **Real-time Status**: Live component status updates with visual indicators
- **Search & Filter**: Powerful search with instant filtering by name, identifier, area, and status
- **Detailed Views**: Comprehensive component details with topics, operations, and parameters

### Topic Monitoring
- **Live Data Streaming**: Real-time ROS2 topic data visualization with auto-refresh
- **Interactive Charts**: Time-series visualization for numeric data with 60-second history
- **JSON Inspector**: Syntax-highlighted JSON viewer with search, copy, and expand/collapse
- **Topic Publishing**: Publish messages to topics with JSON validation and error handling
- **Pause/Resume**: Control data streaming to inspect specific messages

### Operations Control
- **Service Execution**: Execute ROS2 services with parameter validation
- **Action Monitoring**: Track long-running actions with progress feedback
- **Parameter Forms**: Dynamic form generation based on operation schemas
- **Execution History**: View past executions with status, results, and errors
- **Cancel Actions**: Abort running actions with confirmation

### Parameter Configuration
- **Inline Editing**: Edit parameters directly in the table with type-appropriate controls
- **Type Validation**: Automatic validation based on parameter types and constraints
- **Namespace Grouping**: Parameters organized by namespace for easy navigation
- **Reset to Default**: Restore parameters to default values
- **Bulk Operations**: Export/import parameter configurations

### Fault Diagnostics
- **Real-time Monitoring**: Live fault stream via SSE with automatic reconnection
- **Severity Filtering**: Filter by error, warning, or info severity levels
- **Historical Snapshots**: Access system state captured at fault occurrence
- **Rosbag Download**: Download rosbag files for offline analysis
- **Timeline View**: Visualize fault history over time

### Visualizations
- **2D Navigation Map**: Interactive occupancy grid with semantic objects and robot pose
- **Point Cloud Viewer**: 3D point cloud visualization with color modes (RGB, intensity, semantic)
- **Gaussian Splatting**: Advanced 3D reconstruction visualization
- **Robot Orientation**: Real-time 3D robot orientation display
- **Component Topology**: Visual representation of component relationships

### Performance Metrics
- **System Health**: CPU, memory, and network usage monitoring
- **Component Metrics**: Per-component performance statistics
- **Historical Trends**: Time-series charts for performance analysis
- **Resource Alerts**: Visual indicators for resource constraints

### User Experience
- **Dark Mode**: Built-in theme switching with system preference detection
- **Responsive Layout**: Adapts to any screen size from mobile to desktop
- **Keyboard Shortcuts**: Efficient navigation with keyboard commands
- **Loading States**: Skeleton screens and spinners for better perceived performance
- **Error Boundaries**: Graceful error handling with recovery options
- **Empty States**: Helpful messages when data is unavailable

## Architecture

### High-Level System Architecture

The dashboard follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │ Visualizations│  │  3D Viewers  │      │
│  │  Components  │  │   (Charts)    │  │  (Three.js)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zustand    │  │  React Query │  │   Local      │      │
│  │    Stores    │  │    Cache     │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Client  │  │  SSE Manager │  │   WebSocket  │      │
│  │   (Axios)    │  │  (EventSrc)  │  │    Client    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   ros2_medkit Gateway    │
              │   http://localhost:8080  │
              └──────────────────────────┘
```

### State Management Strategy

The application uses a hybrid state management approach:

**Server State (React Query)**
- Manages all data fetched from the API Gateway
- Automatic caching with configurable TTL
- Background refetching for stale data
- Optimistic updates for mutations
- Request deduplication

**UI State (Zustand)**
- Theme preferences (dark/light mode)
- Layout configuration
- Filter and search state
- Panel visibility and arrangement
- User preferences

**Real-time State (Custom Managers)**
- SSE connection state and message buffer
- WebSocket connection state and subscriptions
- Topic data streams with circular buffers
- Fault event stream

## Technology Stack

### Core Framework
- **React 18** - UI framework with concurrent features for smooth updates during high-frequency data streams
- **TypeScript 5.9** - Type-safe development with strict type checking
- **Vite 8** - Lightning-fast build tool with HMR and optimized production builds

### Styling & UI Components
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - Accessible, customizable component library built on Radix UI
- **Lucide React** - Beautiful, consistent icon library

### State Management
- **Zustand 5** - Lightweight state management for global UI state
- **React Query 5** - Server state management with automatic caching and background refetching
- **React Router 7** - Declarative routing with nested routes

### Data Visualization
- **Recharts 3** - Composable charting library for 2D data visualization
- **Three.js** (planned) - 3D visualizations for point clouds and Gaussian splats
- **React Three Fiber** (planned) - React renderer for Three.js

### HTTP & Real-time Communication
- **Axios 1.13** - Promise-based HTTP client with interceptors
- **EventSource API** - Server-Sent Events for real-time fault streaming
- **WebSocket API** - Bidirectional real-time communication

### Development Tools
- **Vitest 4** - Fast unit testing framework with Vite integration
- **Testing Library** - Component testing with user-centric queries
- **fast-check 4** - Property-based testing for universal behavior verification
- **ESLint 9** - Code linting with TypeScript support
- **Prettier 3** - Code formatting with Tailwind plugin

### Why These Technologies?

**React 18**: Concurrent features enable smooth UI updates even during high-frequency data streams. Automatic batching reduces re-renders.

**TypeScript**: Compile-time safety for complex data structures and API contracts. Catches errors before runtime.

**Vite**: 10-100x faster than webpack for development. Native ESM support reduces bundle size. Built-in TypeScript support.

**Tailwind CSS**: Utility-first approach enables rapid UI development. Consistent design system with minimal CSS overhead. Built-in dark mode support.

**Zustand**: Minimal boilerplate compared to Redux. No context providers needed. Excellent TypeScript support.

**React Query**: Automatic caching eliminates redundant API calls. Background refetching keeps data fresh. Built-in loading and error states.

**Axios**: Interceptors for cross-cutting concerns (auth, logging, error handling). Request/response transformation. Automatic JSON parsing.

**Vitest**: Native Vite integration means no configuration needed. Same config as production build. Fast test execution.

**fast-check**: Property-based testing ensures correctness across all possible inputs, not just hand-picked examples. Finds edge cases automatically.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Memory**: Minimum 4GB RAM (8GB recommended for development)
- **Disk Space**: 500MB for dependencies

### Backend Requirements
- **ros2_medkit API Gateway**: Must be running and accessible
  - Default URL: `http://localhost:8080`
  - API version: v1
  - Endpoints: REST API, SSE, WebSocket

### Browser Requirements
- **Chrome/Edge**: Version 90 or higher
- **Firefox**: Version 88 or higher
- **Safari**: Version 14 or higher
- Modern browsers with ES2020 support required

### Development Tools (Optional)
- **Git**: For version control
- **VS Code**: Recommended editor with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dojo-robot-web-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- TypeScript and type definitions
- Vite and build tools
- Tailwind CSS and PostCSS
- Testing libraries
- All other dependencies listed in `package.json`

### 3. Verify Installation

Check that everything is installed correctly:

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Verify TypeScript compilation
npm run build   # Should complete without errors
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and configure your API Gateway URL:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

### 5. Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Troubleshooting Installation

**Node version too old**:
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 18
nvm install 18
nvm use 18
```

**npm install fails**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Port 5173 already in use**:
```bash
# Use a different port
npm run dev -- --port 3000
```

## Configuration

### Environment Variables

The dashboard uses environment variables for configuration. Create a `.env` file in the project root:

```env
# API Gateway Configuration
VITE_API_URL=http://localhost:8080/api/v1

# Optional: Enable debug logging
VITE_DEBUG=false

# Optional: Custom WebSocket URL (defaults to API_URL with ws:// protocol)
VITE_WS_URL=ws://localhost:8080/ws
```

**Important**: All environment variables must be prefixed with `VITE_` to be accessible in the application.

### API Gateway Endpoints

The dashboard expects the following endpoints to be available:

**REST API** (default: `http://localhost:8080/api/v1`)
- `GET /areas` - List all areas
- `GET /areas/{area_id}/components` - List components in an area
- `GET /components/{component_id}/data` - Get component topic data
- `GET /components/{component_id}/operations` - List component operations
- `POST /components/{component_id}/operations/{operation_id}/executions` - Execute operation
- `GET /components/{component_id}/configurations` - Get component parameters
- `PUT /components/{component_id}/configurations/{param}` - Update parameter
- `GET /faults` - List faults
- `GET /faults/{fault_code}/snapshots` - Get fault snapshots

**Server-Sent Events** (default: `http://localhost:8080/api/v1/faults/stream`)
- Real-time fault streaming

**WebSocket** (default: `ws://localhost:8080/ws`)
- Bidirectional real-time communication
- Topic subscriptions
- Component status updates

### CORS Configuration

If the API Gateway is running on a different domain, ensure CORS is properly configured:

```javascript
// API Gateway CORS configuration example
{
  "origin": ["http://localhost:5173", "http://localhost:3000"],
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["Content-Type", "X-Request-ID"],
  "credentials": true
}
```

### Customizing the Dashboard

#### Theme Configuration

The dashboard supports light and dark themes. The default theme can be set in `src/components/ThemeProvider.tsx`:

```typescript
const defaultTheme = 'dark'; // or 'light'
```

#### Cache Configuration

Adjust React Query cache settings in `src/App.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes for static data
      gcTime: 10 * 60 * 1000,     // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});
```

#### Real-time Configuration

Configure SSE and WebSocket reconnection in `src/features/realtime/`:

```typescript
// SSE Manager configuration
const maxReconnectAttempts = 10;
const baseDelay = 1000; // 1 second
const maxDelay = 30000; // 30 seconds

// WebSocket Manager configuration
const heartbeatInterval = 30000; // 30 seconds
const reconnectAttempts = 3;
```

## Development

### Starting the Development Server

```bash
npm run dev
```

The development server will start at `http://localhost:5173` with:
- Hot Module Replacement (HMR) for instant updates
- Fast refresh for React components
- Source maps for debugging
- TypeScript type checking

### Available Scripts

```bash
# Development
npm run dev              # Start development server with HMR
npm run dev -- --port 3000  # Start on custom port

# Building
npm run build            # Build for production (output: dist/)
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix ESLint issues
npm run format           # Format code with Prettier

# Testing
npm run test             # Run all tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report

# Type Checking
npx tsc --noEmit         # Check TypeScript types without building
```

### Development Workflow

1. **Start the development server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **See changes instantly**: HMR updates the browser automatically
4. **Check types**: TypeScript errors appear in the terminal
5. **Run tests**: `npm run test:watch` for continuous testing
6. **Format code**: `npm run format` before committing
7. **Lint code**: `npm run lint` to catch issues

### Project Structure

```
dojo-robot-web-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   │   ├── common/         # Reusable UI components
│   │   ├── components/     # Component browser features
│   │   ├── topics/         # Topic monitoring features
│   │   ├── operations/     # Operations control features
│   │   ├── parameters/     # Parameter configuration features
│   │   ├── faults/         # Fault diagnostics features
│   │   └── visualizations/ # 3D/2D visualization components
│   ├── features/           # Feature modules
│   │   ├── api/           # API client and hooks
│   │   ├── stores/        # Zustand state stores
│   │   └── utils/         # Utility functions
│   ├── pages/             # Page components (route targets)
│   ├── types/             # TypeScript type definitions
│   ├── __tests__/         # Test files
│   │   ├── unit/          # Unit tests
│   │   ├── property/      # Property-based tests
│   │   └── integration/   # Integration tests
│   ├── App.tsx            # Root application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

### Key Directories Explained

**`src/components/`**: All React components organized by feature. Each feature has its own directory with related components.

**`src/features/api/`**: API client, React Query hooks, and API-related utilities. See `src/features/api/README.md` for detailed documentation.

**`src/features/stores/`**: Zustand stores for global UI state (theme, filters, navigation, etc.).

**`src/pages/`**: Top-level page components that correspond to routes. These compose smaller components from `src/components/`.

**`src/types/`**: Shared TypeScript type definitions for domain models, API responses, and UI state.

**`src/__tests__/`**: All test files organized by test type (unit, property-based, integration).

### Adding New Features

1. **Create component**: Add to appropriate directory in `src/components/`
2. **Add types**: Define TypeScript interfaces in `src/types/`
3. **Create API hook**: Add React Query hook in `src/features/api/hooks.ts`
4. **Add tests**: Create unit tests and property-based tests
5. **Update routes**: Add route in `src/App.tsx` if needed
6. **Document**: Add JSDoc comments and update README if needed

## Core Concepts

### State Management

The dashboard uses a hybrid approach to state management, separating concerns between server state and UI state.

#### Server State (React Query)

React Query manages all data fetched from the API Gateway with automatic caching and background refetching.

```typescript
// Example: Fetching areas with automatic caching
import { useAreas } from '@/features/api/hooks';

function ComponentBrowser() {
  const { data: areas, isLoading, error } = useAreas();
  
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return <AreaList areas={areas} />;
}
```

**Key Features**:
- Automatic caching with configurable TTL
- Background refetching for stale data
- Request deduplication
- Optimistic updates for mutations
- Built-in loading and error states

#### UI State (Zustand)

Zustand manages global UI state like theme preferences, filters, and layout configuration.

```typescript
// Example: Using the UI store
import { useUIStore } from '@/features/stores/uiStore';

function ThemeToggle() {
  const { theme, setTheme } = useUIStore();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

**Key Features**:
- Minimal boilerplate
- No context providers needed
- Excellent TypeScript support
- Persistent state via localStorage

### API Client Architecture

The API client is built on Axios with interceptors for cross-cutting concerns.

#### Request Interceptor

Adds request IDs for tracing and logs requests in development:

```typescript
apiClient.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = generateRequestId();
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});
```

#### Response Interceptor

Handles errors and transforms responses:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      throw new ApiError(error.response.status, error.response.data.message);
    } else if (error.request) {
      // Request made but no response received
      throw new NetworkError('Unable to reach API Gateway');
    }
    throw error;
  }
);
```

#### Custom Error Types

```typescript
// API error with status code
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

// Network connectivity error
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
  }
}
```

See `src/features/api/README.md` for complete API client documentation.

### Real-time Communication

The dashboard supports three methods of real-time communication with automatic fallback.

#### Server-Sent Events (SSE)

Used for real-time fault streaming with automatic reconnection:

```typescript
// SSE Manager handles connection and reconnection
sseManager.connect('http://localhost:8080/api/v1/faults/stream');

// Subscribe to fault events
const unsubscribe = sseManager.subscribe('fault', (fault) => {
  console.log('New fault:', fault);
});
```

**Features**:
- Automatic reconnection with exponential backoff
- Event-based subscriptions
- Connection state management

#### WebSocket

Used for bidirectional real-time communication:

```typescript
// WebSocket Manager handles connection and subscriptions
wsManager.connect('ws://localhost:8080/ws');

// Subscribe to topic updates
const unsubscribe = wsManager.subscribe('topic_update', (data) => {
  console.log('Topic update:', data);
});

// Send messages
wsManager.send({ type: 'subscribe', topic: '/odom' });
```

**Features**:
- Heartbeat for connection health
- Message queuing when disconnected
- Automatic reconnection (3 attempts)
- Subscription management

#### HTTP Polling (Fallback)

When WebSocket fails, the dashboard automatically falls back to HTTP polling:

```typescript
// Polling Manager starts polling when WebSocket fails
pollingManager.startPolling(
  'topic-data',
  () => apiClient.get('/components/comp-1/data/odom'),
  (data) => updateTopicData(data),
  2000 // Poll every 2 seconds
);
```

### Caching Strategy

Different data types have different caching strategies:

**Static Data** (5 minute TTL)
- Areas list
- Component metadata
- Operation definitions
- Parameter schemas

**Dynamic Data** (30 second TTL)
- Component status
- System health metrics
- Performance statistics

**Real-time Data** (No caching)
- Topic data streams
- Fault events
- Action execution status
- Live visualizations

**User Data** (Persistent)
- Theme preferences
- Layout configurations
- Robot instances
- Filter state

## Testing

The dashboard employs a comprehensive dual testing approach combining unit tests for specific scenarios and property-based tests for universal behaviors.

### Testing Framework

- **Vitest**: Fast unit testing with Vite integration
- **React Testing Library**: Component testing with user-centric queries
- **fast-check**: Property-based testing for universal behavior verification
- **@testing-library/user-event**: User interaction simulation

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Organization

```
src/__tests__/
├── unit/              # Unit tests for specific scenarios
│   ├── components/    # Component tests
│   ├── utils/         # Utility function tests
│   ├── stores/        # State store tests
│   └── features/      # Feature module tests
├── property/          # Property-based tests
│   ├── apiHooks.property.test.tsx
│   ├── searchFiltering.property.test.tsx
│   ├── stateManagement.property.test.ts
│   └── ...
└── integration/       # Integration tests
    ├── apiIntegration.test.ts
    └── realtimeStreaming.test.ts
```

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopicViewer } from '@/components/topics/TopicViewer';

describe('TopicViewer', () => {
  it('should display topic data in JSON format', () => {
    const topicData = { position: { x: 1, y: 2, z: 3 } };
    
    render(<TopicViewer data={topicData} />);
    
    expect(screen.getByText(/position/i)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });
});
```

### Property-Based Test Example

Property-based tests verify that behaviors hold for all possible inputs:

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterComponents } from '@/utils/filterComponents';

describe('Component Search Filtering', () => {
  it('should only return components matching the search term', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary),
        fc.string(),
        (components, searchTerm) => {
          const filtered = filterComponents(components, searchTerm);
          
          // All filtered results must match the search term
          filtered.forEach(component => {
            const matches = 
              component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              component.identifier.toLowerCase().includes(searchTerm.toLowerCase());
            expect(matches).toBe(true);
          });
        }
      ),
      { numRuns: 100 } // Test with 100 random inputs
    );
  });
});
```

### Test Coverage

The project maintains high test coverage:

- **Unit Tests**: 80+ tests covering components, utilities, and stores
- **Property-Based Tests**: 80+ properties ensuring correctness across all inputs
- **Integration Tests**: API integration and real-time communication

### Writing Tests

**For Components**:
1. Test user interactions, not implementation details
2. Use accessible queries (getByRole, getByLabelText)
3. Test loading and error states
4. Verify accessibility (ARIA labels, keyboard navigation)

**For Utilities**:
1. Test edge cases (empty arrays, null values, etc.)
2. Test error handling
3. Verify type safety

**For Property-Based Tests**:
1. Define the property (universal behavior)
2. Create generators for test data
3. Run with minimum 100 iterations
4. Verify the property holds for all inputs

### Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests (GitHub Actions)
- Before deployment (CI/CD pipeline)

## Building for Production

### Creating a Production Build

```bash
npm run build
```

This command:
1. Runs TypeScript type checking
2. Compiles TypeScript to JavaScript
3. Bundles code with Vite
4. Minifies JavaScript and CSS
5. Optimizes assets
6. Generates source maps
7. Outputs to `dist/` directory

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js      # Main application bundle
│   ├── vendor-[hash].js     # Third-party dependencies
│   ├── index-[hash].css     # Compiled styles
│   └── ...                  # Other chunks and assets
├── index.html               # Entry HTML file
└── favicon.ico              # Favicon
```

### Build Optimization

The build is optimized with:

**Code Splitting**: Automatic route-based code splitting reduces initial bundle size

**Tree Shaking**: Unused code is eliminated from the bundle

**Minification**: JavaScript and CSS are minified with Terser

**Compression**: Assets are optimized for size

**Caching**: File names include content hashes for cache busting

### Bundle Analysis

Analyze bundle size:

```bash
npm run build -- --mode analyze
```

This generates a visual report of bundle composition.

### Preview Production Build

Test the production build locally:

```bash
npm run preview
```

This starts a local server serving the `dist/` directory at `http://localhost:4173`.

### Deployment

#### Static Hosting (Netlify, Vercel, GitHub Pages)

1. Build the project: `npm run build`
2. Deploy the `dist/` directory
3. Configure environment variables in hosting platform
4. Set up redirects for client-side routing:

**Netlify** (`netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://api-gateway:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Build and run:

```bash
docker build -t dojo-dashboard .
docker run -p 80:80 -e VITE_API_URL=http://api-gateway:8080/api/v1 dojo-dashboard
```

#### Environment Variables in Production

Set environment variables in your hosting platform:

- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment Variables
- **Docker**: Use `-e` flag or `.env` file
- **Kubernetes**: ConfigMap or Secret

### Performance Checklist

Before deploying to production:

- [ ] Run `npm run build` successfully
- [ ] Test with `npm run preview`
- [ ] Verify all environment variables are set
- [ ] Check bundle size (should be < 500KB gzipped)
- [ ] Test on target browsers
- [ ] Verify API Gateway connectivity
- [ ] Test real-time features (SSE, WebSocket)
- [ ] Check error handling and fallbacks
- [ ] Verify accessibility (WCAG AA)
- [ ] Test responsive layout on mobile
- [ ] Run Lighthouse audit (score > 90)

## API Integration

### Overview

The dashboard integrates with the ros2_medkit API Gateway, which provides a REST API for robot component management and real-time data streaming.

### API Gateway Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dojo Robot Dashboard                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  REST API    │  │     SSE      │  │  WebSocket   │      │
│  │   (Axios)    │  │ (EventSource)│  │   (Native)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              ros2_medkit API Gateway                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API (Port 8080)                                 │  │
│  │  - Component management                               │  │
│  │  - Topic data access                                  │  │
│  │  - Operation execution                                │  │
│  │  - Parameter configuration                            │  │
│  │  - Fault management                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SSE Endpoint (/api/v1/faults/stream)                │  │
│  │  - Real-time fault streaming                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Endpoint (ws://localhost:8080/ws)         │  │
│  │  - Bidirectional real-time communication             │  │
│  │  - Topic subscriptions                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### REST API Endpoints

#### Areas and Components

```typescript
// Get all areas
GET /api/v1/areas
Response: Area[]

// Get components in an area
GET /api/v1/areas/{area_id}/components
Response: Component[]

// Get component details
GET /api/v1/components/{component_id}
Response: Component
```

#### Topics

```typescript
// Get all topics for a component
GET /api/v1/components/{component_id}/data
Response: { topics: Topic[] }

// Get specific topic data
GET /api/v1/components/{component_id}/data/{topic_name}
Response: TopicData

// Publish to a topic
PUT /api/v1/components/{component_id}/data/{topic_name}
Body: { message: any }
Response: { success: boolean }
```

#### Operations

```typescript
// Get component operations
GET /api/v1/components/{component_id}/operations
Response: Operation[]

// Execute an operation
POST /api/v1/components/{component_id}/operations/{operation_id}/executions
Body: { parameters: Record<string, any> }
Response: Execution

// Get execution status
GET /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}
Response: Execution

// Cancel an execution
DELETE /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}
Response: { success: boolean }
```

#### Parameters

```typescript
// Get component parameters
GET /api/v1/components/{component_id}/configurations
Response: Parameter[]

// Get specific parameter
GET /api/v1/components/{component_id}/configurations/{param_name}
Response: Parameter

// Update parameter
PUT /api/v1/components/{component_id}/configurations/{param_name}
Body: { value: any }
Response: Parameter

// Reset parameter to default
DELETE /api/v1/components/{component_id}/configurations/{param_name}
Response: { success: boolean }
```

#### Faults

```typescript
// Get all faults
GET /api/v1/faults
Query: ?severity=error&component_id=comp-1&start_time=...&end_time=...
Response: Fault[]

// Get fault snapshots
GET /api/v1/faults/{fault_code}/snapshots
Response: FaultSnapshot[]

// Download rosbag
GET /api/v1/faults/{fault_code}/snapshots/bag
Response: Binary rosbag file
```

### Server-Sent Events (SSE)

Real-time fault streaming:

```typescript
// Connect to SSE endpoint
const eventSource = new EventSource('http://localhost:8080/api/v1/faults/stream');

// Listen for fault events
eventSource.onmessage = (event) => {
  const fault = JSON.parse(event.data);
  console.log('New fault:', fault);
};

// Handle errors
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Automatic reconnection with exponential backoff
};
```

### WebSocket Communication

Bidirectional real-time communication:

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws');

// Subscribe to topic updates
ws.send(JSON.stringify({
  type: 'subscribe',
  topic: '/odom'
}));

// Receive updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.event === 'topic_update') {
    console.log('Topic update:', message.payload);
  }
};

// Heartbeat
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

### Error Handling

The API client handles errors gracefully:

```typescript
try {
  const response = await apiClient.get('/areas');
  console.log(response.data);
} catch (error) {
  if (error instanceof ApiError) {
    // Server responded with error status
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof NetworkError) {
    // Network connectivity issue
    console.error('Network error:', error.message);
  } else {
    // Unknown error
    console.error('Unexpected error:', error);
  }
}
```

### Request Tracing

All requests include a unique request ID for tracing:

```typescript
// Request ID is automatically added to headers
X-Request-ID: req_1234567890_abc123

// Use for debugging and log correlation
console.log(`[${requestId}] Fetching areas...`);
```

### Rate Limiting

The dashboard implements client-side rate limiting:

- **Search/Filter**: Debounced by 300ms
- **Topic Updates**: Limited to 30 FPS
- **API Calls**: Automatic deduplication via React Query

### Authentication (Future)

The API client is prepared for authentication:

```typescript
// Add authentication token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Real-time Features

### Overview

The dashboard provides three methods of real-time communication with automatic fallback for maximum reliability.

### Server-Sent Events (SSE)

SSE is used for real-time fault streaming from the API Gateway.

#### Features

- **Unidirectional**: Server pushes updates to client
- **Automatic Reconnection**: Exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- **Event-Based**: Subscribe to specific event types
- **Connection State**: Track connection status (connected, disconnected, reconnecting)

#### Implementation

```typescript
// SSE Manager handles connection lifecycle
class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  connect(url: string) {
    this.eventSource = new EventSource(url);
    
    this.eventSource.onopen = () => {
      console.log('[SSE] Connected');
      this.reconnectAttempts = 0;
    };
    
    this.eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.notifyListeners(message.type, message.data);
    };
    
    this.eventSource.onerror = () => {
      console.error('[SSE] Connection error');
      this.reconnect(url);
    };
  }
  
  subscribe(eventType: string, callback: (data: any) => void) {
    // Add listener and return unsubscribe function
  }
}
```

#### Usage

```typescript
import { sseManager } from '@/features/realtime/sseManager';

// Connect to fault stream
sseManager.connect('http://localhost:8080/api/v1/faults/stream');

// Subscribe to fault events
const unsubscribe = sseManager.subscribe('fault', (fault) => {
  console.log('New fault:', fault);
  // Update UI with new fault
});

// Cleanup
unsubscribe();
```

### WebSocket Communication

WebSocket provides bidirectional real-time communication for topic subscriptions and component updates.

#### Features

- **Bidirectional**: Client and server can both send messages
- **Subscription Management**: Subscribe/unsubscribe to specific topics
- **Heartbeat**: Periodic ping/pong to detect connection health
- **Message Queue**: Queue messages when disconnected
- **Automatic Reconnection**: 3 attempts before falling back to polling

#### Implementation

```typescript
// WebSocket Manager handles connection and subscriptions
class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<Function>> = new Map();
  private messageQueue: any[] = [];
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.startHeartbeat();
      this.flushMessageQueue();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.notifySubscribers(message.event, message.payload);
    };
    
    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.stopHeartbeat();
      this.reconnect(url);
    };
  }
  
  subscribe(event: string, callback: (data: any) => void) {
    // Add subscription and send subscribe message to server
  }
  
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }
}
```

#### Usage

```typescript
import { wsManager } from '@/features/realtime/websocketManager';

// Connect to WebSocket
wsManager.connect('ws://localhost:8080/ws');

// Subscribe to topic updates
const unsubscribe = wsManager.subscribe('topic_update', (data) => {
  console.log('Topic update:', data);
  // Update UI with new topic data
});

// Send message
wsManager.send({
  type: 'subscribe',
  topic: '/odom'
});

// Cleanup
unsubscribe();
```

### HTTP Polling Fallback

When WebSocket connection fails after 3 attempts, the dashboard automatically falls back to HTTP polling.

#### Features

- **Automatic Activation**: Triggered when WebSocket fails
- **Configurable Interval**: Default 2 seconds
- **Multiple Endpoints**: Poll different endpoints independently
- **Graceful Degradation**: Continues to function with reduced real-time capability

#### Implementation

```typescript
// Polling Manager handles HTTP polling
class PollingManager {
  private intervals: Map<string, number> = new Map();
  
  startPolling(
    key: string,
    fetchFn: () => Promise<any>,
    callback: (data: any) => void,
    interval: number = 2000
  ) {
    const poll = async () => {
      try {
        const data = await fetchFn();
        callback(data);
      } catch (error) {
        console.error(`[Polling] Error for ${key}:`, error);
      }
    };
    
    poll(); // Initial fetch
    const intervalId = setInterval(poll, interval);
    this.intervals.set(key, intervalId);
  }
  
  stopPolling(key: string) {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }
}
```

#### Usage

```typescript
import { pollingManager } from '@/features/realtime/pollingFallback';

// Start polling when WebSocket fails
pollingManager.startPolling(
  'topic-data',
  () => apiClient.get('/components/comp-1/data/odom'),
  (data) => updateTopicData(data),
  2000 // Poll every 2 seconds
);

// Stop polling when WebSocket reconnects
pollingManager.stopPolling('topic-data');
```

### Connection State Management

The dashboard tracks connection state for all real-time features:

```typescript
interface ConnectionState {
  sse: 'connected' | 'disconnected' | 'reconnecting';
  ws: 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  polling: boolean;
}

// Connection store
const useConnectionStore = create<ConnectionState>((set) => ({
  sse: 'disconnected',
  ws: 'disconnected',
  polling: false,
  
  setSSEStatus: (status) => set({ sse: status }),
  setWSStatus: (status) => set({ ws: status }),
  enablePollingFallback: () => set({ polling: true }),
}));
```

### Circular Buffer for Topic Data

High-frequency topic data is stored in circular buffers to maintain recent history without memory growth:

```typescript
class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private size = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  push(item: T) {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
  }
  
  toArray(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }
}

// Topic data manager with 60-second history
const topicDataManager = new TopicDataManager(60); // 60 data points
```

### Performance Considerations

- **Frame Rate Limiting**: Visualizations limited to 30 FPS to prevent excessive re-renders
- **Debouncing**: Search and filter inputs debounced by 300ms
- **Throttling**: Scroll and resize handlers throttled
- **Memory Management**: Circular buffers prevent memory growth
- **Connection Pooling**: Reuse connections when possible

## Performance Optimization

### Overview

The dashboard is optimized for performance with multiple strategies to ensure smooth operation even with high-frequency data streams.

### Caching Strategy

#### React Query Caching

Different data types have different caching strategies:

```typescript
// Static data - 5 minute TTL
const { data: areas } = useQuery({
  queryKey: ['areas'],
  queryFn: fetchAreas,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
});

// Dynamic data - 30 second TTL
const { data: status } = useQuery({
  queryKey: ['component', id, 'status'],
  queryFn: () => fetchComponentStatus(id),
  staleTime: 30 * 1000,       // 30 seconds
  refetchInterval: 30 * 1000, // Auto-refresh
});

// Real-time data - No caching
const { data: topicData } = useQuery({
  queryKey: ['topic', topicName],
  queryFn: () => fetchTopicData(topicName),
  staleTime: 0,               // Always stale
  refetchInterval: 1000,      // Refresh every second
});
```

#### Request Deduplication

React Query automatically deduplicates identical requests made within a short time window:

```typescript
// Multiple components requesting the same data
// Only one API call is made
function ComponentA() {
  const { data } = useAreas(); // API call
}

function ComponentB() {
  const { data } = useAreas(); // Uses cached result
}

function ComponentC() {
  const { data } = useAreas(); // Uses cached result
}
```

### Code Splitting

#### Route-Based Splitting

Heavy components are lazy-loaded to reduce initial bundle size:

```typescript
import { lazy, Suspense } from 'react';

// Lazy load visualization components
const PointCloudViewer = lazy(() => import('./components/visualizations/PointCloudViewer'));
const GaussianSplatViewer = lazy(() => import('./components/visualizations/GaussianSplatViewer'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <PointCloudViewer />
</Suspense>
```

#### Manual Chunks

Vite configuration for optimal code splitting:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          'chart-vendor': ['recharts'],
          'visualizations': [
            './src/components/visualizations/PointCloudViewer',
            './src/components/visualizations/GaussianSplatViewer',
          ],
        },
      },
    },
  },
});
```

### React Optimization

#### Memoization

Prevent unnecessary re-renders with React.memo:

```typescript
import { memo } from 'react';

// Memoize component
const TopicListItem = memo<TopicListItemProps>(
  ({ topic, onSelect }) => {
    return (
      <div onClick={() => onSelect(topic)}>
        <div>{topic.name}</div>
        <div>{topic.messageType}</div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return (
      prevProps.topic.name === nextProps.topic.name &&
      prevProps.topic.lastUpdate === nextProps.topic.lastUpdate
    );
  }
);
```

#### useMemo and useCallback

Memoize expensive computations and callbacks:

```typescript
import { useMemo, useCallback } from 'react';

function ComponentList({ components, onSelect }) {
  // Memoize filtered results
  const filteredComponents = useMemo(() => {
    return components.filter(c => c.status === 'active');
  }, [components]);
  
  // Memoize callback
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);
  
  return (
    <div>
      {filteredComponents.map(c => (
        <ComponentItem key={c.id} component={c} onSelect={handleSelect} />
      ))}
    </div>
  );
}
```

### Debouncing and Throttling

#### Debounce Search Input

```typescript
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    // Only search after 300ms of no typing
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  
  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
}
```

#### Throttle Scroll Handler

```typescript
import { useCallback, useRef } from 'react';

function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  ) as T;
}

// Usage
function ScrollableList() {
  const handleScroll = useThrottle((e) => {
    console.log('Scroll position:', e.target.scrollTop);
  }, 100);
  
  return <div onScroll={handleScroll}>...</div>;
}
```

### Frame Rate Limiting

Limit visualization updates to 30 FPS:

```typescript
class FrameRateLimiter {
  private lastFrame = 0;
  private targetFPS = 30;
  private frameInterval = 1000 / this.targetFPS;
  
  shouldRender(timestamp: number): boolean {
    if (timestamp - this.lastFrame >= this.frameInterval) {
      this.lastFrame = timestamp;
      return true;
    }
    return false;
  }
}

// Usage in visualization component
const limiter = new FrameRateLimiter();

function animate(timestamp: number) {
  if (limiter.shouldRender(timestamp)) {
    // Update visualization
    updateVisualization();
  }
  requestAnimationFrame(animate);
}
```

### Virtualization

For large lists, use virtualization to render only visible items:

```typescript
import { FixedSizeList as List } from 'react-window';

function VirtualizedComponentList({ components }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ComponentItem component={components[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={components.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Web Workers

Offload heavy computation to web workers:

```typescript
// worker.ts
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  if (type === 'PARSE_POINT_CLOUD') {
    const parsed = parsePointCloudData(data);
    self.postMessage({ type: 'POINT_CLOUD_PARSED', data: parsed });
  }
});

// Component
function PointCloudViewer({ rawData }) {
  const [parsedData, setParsedData] = useState(null);
  
  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url));
    
    worker.postMessage({ type: 'PARSE_POINT_CLOUD', data: rawData });
    
    worker.onmessage = (event) => {
      if (event.data.type === 'POINT_CLOUD_PARSED') {
        setParsedData(event.data.data);
      }
    };
    
    return () => worker.terminate();
  }, [rawData]);
  
  return <PointCloud data={parsedData} />;
}
```

### Bundle Size Optimization

#### Tree Shaking

Import only what you need:

```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only needed function
import debounce from 'lodash/debounce';
```

#### Dynamic Imports

Load code only when needed:

```typescript
// Load heavy library only when needed
async function exportToExcel(data) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  // ... export logic
}
```

### Performance Monitoring

Monitor performance in production:

```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Performance Checklist

- [ ] React Query caching configured appropriately
- [ ] Heavy components lazy-loaded
- [ ] Lists virtualized when > 100 items
- [ ] Search/filter inputs debounced
- [ ] Scroll/resize handlers throttled
- [ ] Visualizations frame-rate limited
- [ ] Components memoized where appropriate
- [ ] Bundle size < 500KB gzipped
- [ ] Lighthouse score > 90
- [ ] No memory leaks (check with DevTools)

## Troubleshooting

### Common Issues and Solutions

#### Cannot Connect to API Gateway

**Symptoms**:
- Dashboard shows "Disconnected" status
- API requests fail with network errors
- Console shows CORS errors

**Solutions**:

1. **Verify API Gateway is running**:
   ```bash
   curl http://localhost:8080/api/v1/areas
   ```
   If this fails, start the API Gateway.

2. **Check API URL configuration**:
   ```bash
   # Verify .env file
   cat .env
   # Should show: VITE_API_URL=http://localhost:8080/api/v1
   ```

3. **Fix CORS issues**:
   - API Gateway must allow requests from dashboard origin
   - Add dashboard URL to API Gateway CORS configuration
   - Check browser console for specific CORS errors

4. **Check network connectivity**:
   ```bash
   # Test connectivity
   ping localhost
   
   # Check if port is open
   netstat -an | grep 8080
   ```

#### Real-time Updates Not Working

**Symptoms**:
- Fault monitor not showing new faults
- Topic data not updating
- Connection status shows "Reconnecting"

**Solutions**:

1. **Check SSE connection**:
   ```bash
   # Test SSE endpoint
   curl -N http://localhost:8080/api/v1/faults/stream
   ```

2. **Check WebSocket connection**:
   - Open browser DevTools → Network → WS
   - Look for WebSocket connection
   - Check for connection errors

3. **Verify fallback to polling**:
   - Dashboard automatically falls back to HTTP polling
   - Check console for "[Polling]" messages
   - Polling provides reduced real-time capability but continues to function

4. **Check browser compatibility**:
   - Ensure browser supports EventSource and WebSocket
   - Update to latest browser version
   - Try different browser

#### Build Errors

**Symptoms**:
- `npm run build` fails
- TypeScript compilation errors
- Vite build errors

**Solutions**:

1. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. **Check Node.js version**:
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```
   If too old, install Node 18+:
   ```bash
   nvm install 18
   nvm use 18
   ```

3. **Fix TypeScript errors**:
   ```bash
   # Check for type errors
   npx tsc --noEmit
   
   # Fix common issues
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

4. **Check for dependency conflicts**:
   ```bash
   npm ls
   # Look for UNMET PEER DEPENDENCY warnings
   ```

#### Performance Issues

**Symptoms**:
- Dashboard feels slow or laggy
- High CPU usage
- Memory leaks
- Slow rendering

**Solutions**:

1. **Check browser DevTools Performance tab**:
   - Record performance profile
   - Look for long tasks (> 50ms)
   - Identify bottlenecks

2. **Reduce data refresh rate**:
   ```typescript
   // In component
   const { data } = useQuery({
     queryKey: ['topic', topicName],
     refetchInterval: 2000, // Increase from 1000ms to 2000ms
   });
   ```

3. **Enable frame rate limiting**:
   - Visualizations are limited to 30 FPS by default
   - Check console for frame rate warnings

4. **Check for memory leaks**:
   - Open DevTools → Memory → Take heap snapshot
   - Look for detached DOM nodes
   - Ensure cleanup in useEffect hooks

5. **Disable unnecessary features**:
   - Pause topic auto-refresh when not viewing
   - Disable visualizations when not needed
   - Close unused tabs

#### Dark Mode Not Working

**Symptoms**:
- Theme toggle doesn't work
- Theme not persisting
- Colors not changing

**Solutions**:

1. **Check localStorage**:
   ```javascript
   // In browser console
   localStorage.getItem('theme')
   // Should return 'light' or 'dark'
   ```

2. **Clear localStorage**:
   ```javascript
   localStorage.removeItem('theme')
   // Refresh page
   ```

3. **Check ThemeProvider**:
   - Ensure ThemeProvider wraps entire app
   - Check for console errors

#### Tests Failing

**Symptoms**:
- `npm run test` fails
- Property-based tests timeout
- Component tests fail

**Solutions**:

1. **Update test dependencies**:
   ```bash
   npm install --save-dev @testing-library/react@latest @testing-library/jest-dom@latest vitest@latest
   ```

2. **Clear test cache**:
   ```bash
   npx vitest --clearCache
   ```

3. **Run tests in UI mode for debugging**:
   ```bash
   npm run test:ui
   ```

4. **Check for async issues**:
   ```typescript
   // Use waitFor for async updates
   await waitFor(() => {
     expect(screen.getByText('Expected text')).toBeInTheDocument();
   });
   ```

#### Port Already in Use

**Symptoms**:
- `npm run dev` fails with "Port 5173 is already in use"

**Solutions**:

1. **Use different port**:
   ```bash
   npm run dev -- --port 3000
   ```

2. **Kill process using port**:
   ```bash
   # Find process
   lsof -i :5173
   
   # Kill process
   kill -9 <PID>
   ```

3. **Change default port in vite.config.ts**:
   ```typescript
   export default defineConfig({
     server: {
       port: 3000,
     },
   });
   ```

### Getting Help

If you're still experiencing issues:

1. **Check browser console** for error messages
2. **Check terminal** for build/runtime errors
3. **Review logs** from API Gateway
4. **Search issues** in project repository
5. **Create new issue** with:
   - Description of problem
   - Steps to reproduce
   - Error messages
   - Environment details (OS, Node version, browser)
   - Screenshots if applicable

### Debug Mode

Enable debug logging:

```env
# .env
VITE_DEBUG=true
```

This enables:
- Detailed API request/response logging
- Connection state logging
- Performance metrics logging
- React Query DevTools

## Browser Support

### Supported Browsers

The dashboard is tested and supported on the following browsers:

| Browser | Minimum Version | Recommended Version |
|---------|----------------|---------------------|
| Chrome | 90+ | Latest |
| Edge | 90+ | Latest |
| Firefox | 88+ | Latest |
| Safari | 14+ | Latest |
| Opera | 76+ | Latest |

### Required Browser Features

The dashboard requires modern browser features:

- **ES2020 Support**: Modern JavaScript features (optional chaining, nullish coalescing, etc.)
- **CSS Grid & Flexbox**: Layout system
- **CSS Custom Properties**: Theme system
- **EventSource API**: Server-Sent Events for real-time updates
- **WebSocket API**: Bidirectional real-time communication
- **LocalStorage**: Persistent user preferences
- **Fetch API**: HTTP requests (via Axios)

### Feature Detection

The dashboard includes feature detection for graceful degradation:

```typescript
// Check for EventSource support
if (typeof EventSource !== 'undefined') {
  // Use SSE for real-time updates
  sseManager.connect(sseUrl);
} else {
  // Fall back to HTTP polling
  pollingManager.startPolling('faults', fetchFaults, updateFaults, 2000);
}

// Check for WebSocket support
if (typeof WebSocket !== 'undefined') {
  // Use WebSocket for real-time communication
  wsManager.connect(wsUrl);
} else {
  // Fall back to HTTP polling
  pollingManager.startPolling('topics', fetchTopics, updateTopics, 1000);
}

// Check for LocalStorage support
if (typeof localStorage !== 'undefined') {
  // Persist theme preference
  localStorage.setItem('theme', theme);
} else {
  // Use session-only state
  console.warn('LocalStorage not available, preferences will not persist');
}
```

### Mobile Browser Support

The dashboard is responsive and works on mobile browsers:

- **iOS Safari**: 14+
- **Chrome Mobile**: 90+
- **Firefox Mobile**: 88+
- **Samsung Internet**: 14+

**Note**: Some features may have reduced functionality on mobile:
- 3D visualizations may have lower performance
- Touch gestures replace mouse interactions
- Smaller screen size affects layout

### Browser-Specific Issues

#### Safari

**Issue**: EventSource may not reconnect automatically after network interruption

**Solution**: Dashboard implements custom reconnection logic with exponential backoff

**Issue**: WebSocket connections may be throttled in background tabs

**Solution**: Dashboard detects tab visibility and adjusts polling strategy

#### Firefox

**Issue**: CSS Grid may render differently in older versions

**Solution**: Dashboard uses autoprefixer for cross-browser compatibility

#### Edge

**Issue**: Some CSS custom properties may not work in older versions

**Solution**: Dashboard provides fallback values for critical properties

### Testing Browser Compatibility

Test the dashboard in different browsers:

1. **Chrome DevTools Device Mode**: Test responsive layout
2. **BrowserStack**: Test on real devices and browsers
3. **Can I Use**: Check feature support (https://caniuse.com)

### Accessibility

The dashboard follows WCAG 2.1 Level AA guidelines:

- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus states for all interactive elements
- **Alternative Text**: Images and icons have descriptive alt text

Test accessibility:

```bash
# Install axe-core
npm install --save-dev @axe-core/react

# Run accessibility tests
npm run test:a11y
```

### Progressive Enhancement

The dashboard follows progressive enhancement principles:

1. **Core Functionality**: Works in all supported browsers
2. **Enhanced Features**: Advanced features for capable browsers
3. **Graceful Degradation**: Fallbacks when features unavailable

Example:

```typescript
// Core: HTTP polling (works everywhere)
function fetchData() {
  return apiClient.get('/data');
}

// Enhanced: WebSocket (better performance)
if (typeof WebSocket !== 'undefined') {
  wsManager.connect(wsUrl);
  wsManager.subscribe('data', updateData);
}

// Fallback: HTTP polling when WebSocket unavailable
else {
  pollingManager.startPolling('data', fetchData, updateData, 2000);
}
```

## Contributing

We welcome contributions to the Dojo Robot Web Dashboard! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/dojo-robot-web-dashboard.git
   cd dojo-robot-web-dashboard
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

#### Code Style

- **TypeScript**: Use strict type checking
- **ESLint**: Follow ESLint rules (`npm run lint`)
- **Prettier**: Format code before committing (`npm run format`)
- **Naming**: Use descriptive names (camelCase for variables, PascalCase for components)

#### Component Guidelines

- **Functional Components**: Use function components with hooks
- **TypeScript**: Define prop types with interfaces
- **Accessibility**: Include ARIA labels and semantic HTML
- **Documentation**: Add JSDoc comments for complex components

Example:

```typescript
/**
 * Displays a list of robot components with search and filter capabilities.
 * 
 * @param components - Array of components to display
 * @param onSelect - Callback when a component is selected
 */
interface ComponentListProps {
  components: Component[];
  onSelect: (id: string) => void;
}

export function ComponentList({ components, onSelect }: ComponentListProps) {
  // Implementation
}
```

#### Testing Guidelines

- **Unit Tests**: Test individual functions and components
- **Property-Based Tests**: Test universal behaviors with fast-check
- **Coverage**: Aim for > 80% code coverage
- **Accessibility**: Test with screen readers and keyboard navigation

#### Commit Guidelines

Follow conventional commits:

```
feat: add topic chart visualization
fix: resolve SSE reconnection issue
docs: update API integration guide
test: add property tests for search filtering
refactor: simplify component tree rendering
style: format code with prettier
chore: update dependencies
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Run tests**: `npm run test`
4. **Run linter**: `npm run lint`
5. **Format code**: `npm run format`
6. **Create pull request** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Test results

### Code Review

All pull requests require:
- [ ] Passing tests
- [ ] Passing linter
- [ ] Code review approval
- [ ] Documentation updates
- [ ] No merge conflicts

### Areas for Contribution

- **Bug Fixes**: Check open issues
- **Features**: See roadmap in project board
- **Documentation**: Improve README, add examples
- **Tests**: Increase test coverage
- **Performance**: Optimize rendering, reduce bundle size
- **Accessibility**: Improve WCAG compliance
- **Internationalization**: Add translations

### Questions?

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Report bugs via GitHub Issues
- **Email**: Contact maintainers for security issues

## License

[Your License Here]

---

**Built with ❤️ for the robotics community**

For more information, see:
- [API Client Documentation](src/features/api/README.md)
- [API Hooks Usage Guide](src/features/api/HOOKS_USAGE.md)
- [Design Document](.kiro/specs/dojo-robot-web-dashboard/design.md)
- [Task List](.kiro/specs/dojo-robot-web-dashboard/tasks.md)
