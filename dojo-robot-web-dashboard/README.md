# Dojo Robot Web Dashboard

A sophisticated, real-time monitoring and control interface for autonomous robot systems built with React, TypeScript, and Vite. This dashboard provides comprehensive visibility into robot operations through an elegant, responsive interface that handles high-frequency data streams, complex 3D visualizations, and real-time fault monitoring.

## Features

- **Real-time Monitoring**: Live data streaming via Server-Sent Events (SSE) and WebSocket
- **Component Management**: Hierarchical view of robot areas and components
- **Topic Monitoring**: Real-time ROS2 topic data visualization and publishing
- **Operations Control**: Execute services and monitor action progress
- **Parameter Configuration**: Dynamic parameter editing with validation
- **Fault Diagnostics**: Real-time fault monitoring with historical snapshots
- **3D Visualizations**: Point clouds, Gaussian splats, and robot orientation
- **2D Mapping**: Interactive occupancy grid and semantic object visualization
- **Performance Metrics**: CPU, memory, and network usage monitoring
- **Multi-Robot Support**: Manage multiple robot instances
- **Dark Mode**: Built-in theme switching with persistence

## Prerequisites

- Node.js 18+ and npm
- ros2_medkit API Gateway running (default: http://localhost:8080)

## Setup

1. Clone the repository and navigate to the project directory:

```bash
cd dojo-robot-web-dashboard
```

2. Install dependencies:

```bash
npm install
```

3. Configure the API Gateway URL:

```bash
cp .env.example .env
```

Edit `.env` and set your API Gateway URL:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The dashboard will be available at http://localhost:5173

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── layout/      # Layout components (Header, Sidebar, etc.)
│   ├── dashboard/   # Dashboard-specific components
│   ├── common/      # Common UI elements
│   └── ...          # Feature-specific component folders
├── features/        # Feature modules
│   ├── api/         # API client and hooks
│   ├── realtime/    # SSE and WebSocket managers
│   ├── stores/      # Zustand state stores
│   └── utils/       # Utility functions
├── pages/           # Page components (route targets)
├── types/           # TypeScript type definitions
└── __tests__/       # Test files
```

## Technology Stack

- **React 18** - UI framework with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Zustand** - Lightweight state management
- **React Query** - Server state management with caching
- **Recharts** - 2D data visualization
- **Three.js** - 3D visualizations
- **Axios** - HTTP client

## Configuration

### Environment Variables

- `VITE_API_URL` - ros2_medkit API Gateway base URL (required)

### API Gateway

The dashboard connects to the ros2_medkit REST API Gateway. Ensure the gateway is running and accessible at the configured URL.

Default endpoints:
- REST API: `http://localhost:8080/api/v1`
- SSE (faults): `http://localhost:8080/api/v1/faults/stream`
- WebSocket: `ws://localhost:8080/ws`

## Building for Production

Build the optimized production bundle:

```bash
npm run build
```

The output will be in the `dist/` directory. Serve it with any static file server:

```bash
npm run preview
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Modern browsers with ES2020 support are required.

## Troubleshooting

### Cannot connect to API Gateway

- Verify the API Gateway is running at the configured URL
- Check CORS settings on the API Gateway
- Ensure `VITE_API_URL` in `.env` is correct

### Real-time updates not working

- Check browser console for SSE/WebSocket connection errors
- Verify network connectivity to the API Gateway
- The dashboard will automatically fall back to HTTP polling if WebSocket fails

### Build errors

- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Ensure Node.js version is 18 or higher: `node --version`

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
