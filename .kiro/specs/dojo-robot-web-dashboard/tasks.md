# Implementation Plan: Dojo Robot Web Dashboard

## Overview

This implementation plan breaks down the Dojo Robot Web Dashboard into logical, incremental tasks. The dashboard is a sophisticated React + TypeScript single-page application that provides real-time monitoring, control, and visualization for autonomous robot systems via the ros2_medkit REST API Gateway.

The implementation follows a foundation-first approach: establishing core infrastructure, then building features layer by layer, and finally adding polish and optimizations. Each task builds on previous work, ensuring no orphaned code and continuous integration.

## Tasks

- [x] 1. Project setup and core infrastructure
  - [x] 1.1 Initialize Vite + React + TypeScript project
    - Create project with `npm create vite@latest dojo-robot-web-dashboard -- --template react-ts`
    - Configure tsconfig.json with strict type checking
    - Set up path aliases for clean imports (@/ for src/)
    - _Requirements: 1.1, 1.2, 28.1, 28.3_

  - [x] 1.2 Configure build tools and code quality
    - Set up Tailwind CSS with shadcn/ui configuration
    - Configure ESLint with React and TypeScript rules
    - Configure Prettier for consistent formatting
    - Add development scripts (dev, build, preview, lint, format)
    - _Requirements: 1.3, 28.2, 28.4, 28.5_

  - [x] 1.3 Set up project structure and base files
    - Create directory structure (components/, features/, pages/, types/, __tests__/)
    - Create .gitignore excluding node_modules, dist, .env files
    - Create .env.example with VITE_API_URL variable
    - Create README.md with setup and development instructions
    - _Requirements: 28.6, 28.7, 28.9_


- [ ] 2. Core API client and state management
  - [x] 2.1 Create API client with Axios
    - Implement configured Axios instance with base URL and timeout
    - Add request interceptor for request ID generation and logging
    - Add response interceptor for error handling and transformation
    - Create custom error classes (ApiError, NetworkError, ValidationError)
    - _Requirements: 1.5, 12.4, 12.5, 12.6_

  - [x] 2.2 Write property tests for API client
    - **Property 53: Reconnection exponential backoff timing**
    - **Validates: Requirements 12.3**

  - [x] 2.3 Set up React Query for server state management
    - Install and configure @tanstack/react-query
    - Create QueryClient with caching and retry configuration
    - Set up QueryClientProvider in App root
    - Configure devtools for development
    - _Requirements: 1.4, 13.5_

  - [x] 2.4 Set up Zustand stores for UI state
    - Create uiStore for theme, layout, and preferences
    - Create connectionStore for API Gateway connection status
    - Create filterStore for search and filter state
    - Create navigationStore for breadcrumbs and history
    - _Requirements: 1.4, 11.4, 15.7_

  - [x] 2.5 Write property tests for state management
    - **Property 51: Theme persistence round-trip**
    - **Property 71: Filter persistence round-trip**
    - **Validates: Requirements 11.4, 15.7**mkdir ros2-medkit-dashboard
cd ros2-medkit-dashboard
git init


- [ ] 3. Layout and navigation foundation
  - [x] 3.1 Create base layout components
    - Implement AppShell with header, sidebar, main content area, and footer
    - Create Header component with logo, navigation, and status indicators
    - Create Sidebar component with collapsible navigation menu
    - Create StatusBar footer showing connection status
    - _Requirements: 10.4, 12.1_

  - [x] 3.2 Set up React Router navigation
    - Install and configure react-router-dom
    - Define route structure for all major pages
    - Implement route-based code splitting with lazy loading
    - Create navigation links in Sidebar
    - _Requirements: 13.4_

  - [x] 3.3 Implement theme system
    - Create ThemeToggle component with light/dark mode switch
    - Implement theme persistence to localStorage
    - Apply theme CSS variables throughout application
    - Add smooth theme transition animations
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8_

  - [x] 3.4 Write property tests for theme system
    - **Property 51: Theme persistence round-trip**
    - **Property 52: Text contrast ratio validation**
    - **Validates: Requirements 11.4, 11.6, 11.9**

  - [x] 3.5 Create common UI components
    - Implement LoadingState with skeleton screens
    - Create ErrorBoundary for error catching
    - Implement AnimatedStatus indicator component
    - Create empty state components
    - _Requirements: 10.7, 10.10, 26.1, 26.2, 26.3, 26.4, 26.5_

  - [x] 3.6 Write property tests for responsive layout
    - **Property 46: Responsive layout adaptation**
    - **Validates: Requirements 10.3**


- [ ] 4. API discovery and component hierarchy
  - [x] 4.1 Create API hooks for areas and components
    - Implement useAreas hook with React Query
    - Implement useComponents hook with React Query
    - Implement useAreaComponents hook with area filtering
    - Configure appropriate cache times (5 minutes for static data)
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 4.2 Write property tests for API hooks
    - **Property 1: Area selection API call correctness**
    - **Property 5: Topic data fetch on component view**
    - **Validates: Requirements 2.4, 3.1**

  - [x] 4.3 Implement ComponentTree hierarchical view
    - Create ComponentTree component displaying areas and components
    - Implement expand/collapse functionality for areas
    - Add component count badges on areas
    - Style with proper indentation and icons
    - _Requirements: 2.3_

  - [x] 4.4 Implement component search and filtering
    - Create ComponentSearch input with debouncing
    - Implement filterComponents utility function
    - Add search highlighting in results
    - Display filtered result count
    - _Requirements: 2.5, 15.1, 15.3, 15.9_

  - [x] 4.5 Write property tests for search and filtering
    - **Property 2: Component search filtering accuracy**
    - **Property 57: Search input debouncing timing**
    - **Property 67: Component filter accuracy**
    - **Validates: Requirements 2.5, 13.3, 15.3**

  - [x] 4.6 Create ComponentDetail view
    - Implement component detail page with tabs (Topics, Operations, Parameters)
    - Display component metadata (name, identifier, area)
    - Add navigation from component list to detail view
    - Implement breadcrumb navigation
    - _Requirements: 2.6, 2.7_

  - [x] 4.7 Write property tests for component display
    - **Property 3: Component metadata completeness**
    - **Property 4: Component navigation**
    - **Validates: Requirements 2.6, 2.7**


- [ ] 5. Real-time topic data monitoring
  - [x] 5.1 Create topic data API hooks
    - Implement useTopicData hook with auto-refresh
    - Implement useTopicList hook for component topics
    - Configure refetch intervals (default 1 second)
    - Add pause/resume functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 5.2 Write property tests for topic data fetching
    - **Property 6: Topic display completeness**
    - **Property 7: Topic selection API call**
    - **Property 8: Topic auto-refresh timing**
    - **Validates: Requirements 3.2, 3.3, 3.4**

  - [x] 5.3 Implement JsonInspector component
    - Create JSON viewer with syntax highlighting
    - Add expand/collapse for nested objects and arrays
    - Implement search within JSON functionality
    - Add copy to clipboard button
    - Display data types and byte size
    - _Requirements: 3.5, 27.1, 27.2, 27.3, 27.4, 27.5, 27.7, 27.8, 27.9_

  - [x] 5.4 Write property tests for JSON inspector
    - **Property 9: Topic message JSON formatting**
    - **Validates: Requirements 3.5**

  - [x] 5.5 Create TopicViewer component
    - Implement topic list display with message types
    - Add topic selection and detail view
    - Display timestamps for messages
    - Add refresh rate controls
    - Implement error handling with retry logic
    - _Requirements: 3.2, 3.3, 3.7, 3.9_

  - [x] 5.6 Write property tests for topic viewer
    - **Property 10: Topic timestamp display**
    - **Property 12: Topic fetch error handling**
    - **Validates: Requirements 3.7, 3.9**

  - [x] 5.7 Implement TopicChart for numeric data
    - Create real-time chart component using Recharts
    - Implement circular buffer for 60-second history
    - Add zoom and pan controls
    - Display only numeric topic data
    - _Requirements: 3.8, 13.7_

  - [x] 5.8 Write property tests for topic charts
    - **Property 11: Numeric topic chart history window**
    - **Property 60: Chart data time window**
    - **Validates: Requirements 3.8, 13.7**


- [x] 6. Topic publishing interface
  - [x] 6.1 Create topic publishing API mutation
    - Implement usePublishTopic mutation hook
    - Add optimistic updates for immediate feedback
    - Handle success and error responses
    - _Requirements: 4.4, 4.5, 4.6_

  - [x] 6.2 Write property tests for topic publishing
    - **Property 15: Topic publication API call**
    - **Validates: Requirements 4.4**

  - [x] 6.3 Implement TopicPublisher component
    - Create message editor with JSON validation
    - Add publish button with validation state
    - Display success/error notifications
    - Provide message templates for common types
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [x] 6.4 Write property tests for message validation
    - **Property 14: JSON validation before publication**
    - **Validates: Requirements 4.3**


- [x] 7. Service and action operations
  - [x] 7.1 Create operations API hooks
    - Implement useOperations hook for fetching operations
    - Implement useExecuteOperation mutation hook
    - Implement useExecutionStatus hook with polling
    - Implement useCancelExecution mutation hook
    - _Requirements: 5.1, 5.6, 5.7, 5.9_

  - [x] 7.2 Write property tests for operations API
    - **Property 16: Operations fetch on component view**
    - **Property 21: Operation execution API call**
    - **Property 24: Action cancel button availability**
    - **Validates: Requirements 5.1, 5.6, 5.9**

  - [x] 7.3 Implement OperationList component
    - Display services and actions with type indicators
    - Show operation parameters and descriptions
    - Distinguish services from actions visually
    - Add operation selection functionality
    - _Requirements: 5.2, 5.3_

  - [x] 7.4 Write property tests for operation display
    - **Property 17: Operation display completeness**
    - **Property 18: Service vs action visual distinction**
    - **Validates: Requirements 5.2, 5.3**

  - [x] 7.5 Create OperationExecutor component
    - Generate parameter form from operation definition
    - Implement parameter validation (types, required fields)
    - Add execute button with validation state
    - Display execution results and errors
    - _Requirements: 5.4, 5.5, 5.10_

  - [-] 7.6 Write property tests for parameter validation
    - **Property 19: Operation parameter form display**
    - **Property 20: Operation parameter validation**
    - **Validates: Requirements 5.4, 5.5**

  - [x] 7.7 Implement ExecutionMonitor for actions
    - Display action status (pending, running, succeeded, failed)
    - Show progress bar and feedback data
    - Add cancel button for active actions
    - Poll execution status at regular intervals
    - _Requirements: 5.7, 5.8, 5.9_

  - [-] 7.8 Write property tests for action monitoring
    - **Property 22: Action status polling**
    - **Property 23: Action progress display**
    - **Validates: Requirements 5.7, 5.8**


- [ ] 8. Parameter configuration management
  - [ ] 8.1 Create parameter API hooks
    - Implement useParameters hook for fetching parameters
    - Implement useParameterDetail hook for detailed info
    - Implement useUpdateParameter mutation with optimistic updates
    - Implement useResetParameter mutation
    - _Requirements: 6.1, 6.4, 6.7, 6.8_

  - [ ] 8.2 Write property tests for parameter API
    - **Property 25: Parameters fetch on component view**
    - **Property 28: Parameter detail fetch**
    - **Property 31: Parameter modification API call**
    - **Property 32: Parameter reset API call**
    - **Validates: Requirements 6.1, 6.4, 6.7, 6.8**

  - [ ] 8.3 Implement ParameterTable component
    - Display parameters in table with name, value, type, description
    - Group parameters by namespace/category
    - Add inline editing with type-appropriate inputs
    - Show validation errors
    - _Requirements: 6.2, 6.3, 6.5_

  - [ ] 8.4 Write property tests for parameter display
    - **Property 26: Parameter display completeness**
    - **Property 27: Parameter grouping**
    - **Property 29: Parameter input type matching**
    - **Validates: Requirements 6.2, 6.3, 6.5**

  - [ ] 8.5 Create ParameterEditor component
    - Implement detailed parameter editing form
    - Add constraint validation (min, max, enum values)
    - Display validation errors clearly
    - Add reset to default button
    - Show success/error notifications
    - _Requirements: 6.6, 6.8, 6.9, 6.10_

  - [ ] 8.6 Write property tests for parameter validation
    - **Property 30: Parameter value validation**
    - **Validates: Requirements 6.6**


- [ ] 9. Fault monitoring and diagnostics
  - [ ] 9.1 Create fault API hooks
    - Implement useFaults hook for fetching current faults
    - Implement useFaultSnapshots hook for fault details
    - Configure appropriate polling intervals
    - _Requirements: 7.1, 7.7_

  - [ ] 9.2 Write property tests for fault API
    - **Property 36: Fault snapshot fetch**
    - **Validates: Requirements 7.7**

  - [ ] 9.3 Implement SSE manager for real-time faults
    - Create SSEManager class with connection management
    - Implement automatic reconnection with exponential backoff
    - Add event subscription and notification system
    - Handle connection errors gracefully
    - _Requirements: 7.2, 7.11_

  - [ ] 9.4 Write property tests for SSE reconnection
    - **Property 39: SSE reconnection with exponential backoff**
    - **Validates: Requirements 7.11**

  - [ ] 9.5 Create FaultMonitor component
    - Display faults with severity indicators (error, warning, info)
    - Sort by severity and timestamp
    - Show fault code, message, component, timestamp
    - Connect to SSE stream for real-time updates
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ] 9.6 Write property tests for fault display
    - **Property 33: Fault display completeness**
    - **Property 34: Fault sorting**
    - **Validates: Requirements 7.5, 7.4**

  - [ ] 9.7 Implement fault filtering
    - Create FaultFilter component with severity, component, time range filters
    - Apply filters to fault list
    - Display filtered result count
    - _Requirements: 7.6_

  - [ ] 9.8 Write property tests for fault filtering
    - **Property 35: Fault filtering accuracy**
    - **Property 69: Fault filter accuracy**
    - **Validates: Requirements 7.6, 15.5**

  - [ ] 9.9 Create FaultDetail component
    - Display fault snapshot data
    - Show system state at fault occurrence
    - Add rosbag download button
    - Implement file download with progress indication
    - _Requirements: 7.7, 7.8, 7.9_

  - [ ] 9.10 Write property tests for fault snapshots
    - **Property 37: Fault snapshot display**
    - **Property 38: Rosbag download availability**
    - **Validates: Requirements 7.8, 7.9**

  - [ ] 9.11 Implement FaultTimeline component
    - Create timeline visualization of fault events
    - Show fault history over time
    - Add time range selection
    - _Requirements: 7.10_


- [ ] 10. System health overview dashboard
  - [ ] 10.1 Create system health API hooks
    - Implement useSystemHealth hook aggregating multiple data sources
    - Configure 2-second auto-refresh interval
    - Fetch areas, components, topics, faults data
    - _Requirements: 8.10_

  - [ ] 10.2 Write property tests for system metrics
    - **Property 40: System metrics count accuracy**
    - **Property 41: Fault count accuracy**
    - **Property 42: Overview metrics auto-update timing**
    - **Validates: Requirements 8.3, 8.4, 8.10**

  - [ ] 10.3 Implement SystemHealthOverview component
    - Display overall system status indicator
    - Show counts of active components, areas, topics
    - Display fault counts by severity
    - Add visual health indicator (healthy, degraded, critical)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 10.4 Create MetricsPanel component
    - Display CPU usage, memory usage, network activity
    - Show robot position and orientation if available
    - Display exploration progress and mapping statistics
    - Show semantic object detection counts
    - _Requirements: 8.5, 8.6, 8.7, 8.8_

  - [ ] 10.5 Implement QuickAccessCards component
    - Create cards linking to major subsystems
    - Add navigation, perception, safety quick access
    - Display key metrics on each card
    - _Requirements: 8.9_


- [ ] 11. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Interactive 2D visualizations
  - [ ] 12.1 Create Map2D component foundation
    - Set up canvas-based 2D map renderer
    - Implement viewport controls (pan, zoom)
    - Add coordinate transformation utilities
    - _Requirements: 9.1, 9.9_

  - [ ] 12.2 Implement occupancy grid rendering
    - Render occupancy grid data on canvas
    - Apply appropriate color mapping
    - Handle grid updates efficiently
    - _Requirements: 9.1_

  - [ ] 12.3 Add robot pose visualization
    - Draw robot position and orientation on map
    - Update robot pose in real-time
    - Add robot trail showing recent path
    - _Requirements: 8.6_

  - [ ] 12.4 Implement semantic object visualization
    - Display detected objects on map with labels
    - Use distinct colors and icons for object classes
    - Add object selection and detail display
    - _Requirements: 9.3, 16.4, 16.5_

  - [ ] 12.5 Write property tests for semantic objects
    - **Property 43: Semantic object map display**
    - **Validates: Requirements 9.3**

  - [ ] 12.6 Add frontier exploration visualization
    - Display exploration frontiers on map
    - Show frontier clustering results
    - Visualize current navigation goal and path
    - _Requirements: 9.2, 17.3, 17.4_

  - [ ] 12.7 Implement visualization controls
    - Add layer toggle controls
    - Implement tooltip display on hover
    - Add legend for map elements
    - _Requirements: 9.8, 9.10_

  - [ ] 12.8 Write property tests for visualization controls
    - **Property 44: Visualization tooltip display**
    - **Property 45: Visualization layer toggle**
    - **Validates: Requirements 9.8, 9.10**


- [ ] 13. 3D visualizations with Three.js
  - [ ] 13.1 Set up React Three Fiber
    - Install @react-three/fiber and @react-three/drei
    - Create base 3D canvas component with camera and controls
    - Add lighting and grid helpers
    - _Requirements: 1.7_

  - [ ] 13.2 Implement PointCloudViewer component
    - Create point cloud geometry from data
    - Implement color modes (RGB, intensity, semantic)
    - Add orbit controls for navigation
    - Optimize rendering for large point clouds
    - _Requirements: 9.5, 9.9_

  - [ ] 13.3 Create RobotOrientation3D component
    - Display 3D robot model or coordinate frame
    - Show roll, pitch, yaw orientation
    - Update orientation in real-time
    - _Requirements: 9.4_

  - [ ] 13.4 Implement GaussianSplatViewer component
    - Create custom shader for Gaussian rendering
    - Render splats with position, color, covariance
    - Add rendering mode toggles (points, ellipsoids, full)
    - Display reconstruction statistics
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

  - [ ] 13.5 Add 3D visualization controls
    - Implement camera controls (orbit, pan, zoom)
    - Add color mapping options
    - Provide export functionality for 3D data
    - _Requirements: 9.9, 23.7, 23.8_


- [ ] 14. Advanced search and filtering
  - [ ] 14.1 Implement global search functionality
    - Create GlobalSearch component with search bar
    - Search across components, topics, operations
    - Display categorized search results
    - Highlight matching text in results
    - _Requirements: 15.1, 15.2, 15.10_

  - [ ] 14.2 Write property tests for global search
    - **Property 65: Global search comprehensiveness**
    - **Property 66: Search match highlighting**
    - **Property 73: Real-time search updates**
    - **Validates: Requirements 15.1, 15.2, 15.10**

  - [ ] 14.3 Create comprehensive filter components
    - Implement ComponentFilter with area, status, name pattern
    - Implement TopicFilter with message type, update frequency
    - Implement OperationFilter with type and availability
    - Add clear filters button
    - _Requirements: 15.3, 15.4, 15.6, 15.8_

  - [ ] 14.4 Write property tests for filtering
    - **Property 68: Topic filter accuracy**
    - **Property 70: Operation filter accuracy**
    - **Property 72: Filtered results count accuracy**
    - **Validates: Requirements 15.4, 15.6, 15.9**


- [ ] 15. Data export and logging
  - [ ] 15.1 Implement data export utilities
    - Create exportToJSON utility for topic data
    - Create exportToCSV utility for fault history
    - Create exportToYAML utility for parameters
    - Add timestamp and metadata to exports
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 15.2 Write property tests for data export
    - **Property 61: Topic data export JSON validity**
    - **Property 62: Fault history export CSV validity**
    - **Property 63: Parameter export YAML validity**
    - **Property 64: Export file metadata**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

  - [ ] 15.3 Create SessionLog component
    - Display all API requests and responses
    - Add filtering by request type and status
    - Implement log download functionality
    - _Requirements: 14.5, 14.6_

  - [ ] 15.4 Add screenshot capture functionality
    - Implement screenshot capture for visualization panels
    - Add download button for screenshots
    - _Requirements: 14.7_


- [ ] 16. Configuration management
  - [ ] 16.1 Create configuration parser and serializer
    - Implement parseConfiguration function with schema validation
    - Implement serializeConfiguration function
    - Add validation error messages
    - Support partial configuration parsing
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.6, 30.7, 30.8_

  - [ ] 16.2 Write property tests for configuration
    - **Property 74: Configuration parsing**
    - **Property 75: Configuration application**
    - **Property 76: Invalid configuration error messages**
    - **Property 77: Configuration serialization**
    - **Property 78: Configuration round-trip**
    - **Property 79: Configuration schema validation**
    - **Property 80: Partial configuration application**
    - **Property 81: Configuration version inclusion**
    - **Validates: Requirements 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7, 30.8**

  - [ ] 16.2 Implement ConfigurationProfile component
    - Create save configuration profile functionality
    - Display list of saved profiles
    - Implement load profile functionality
    - Add profile diff view
    - Provide import/export for profiles
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10_


- [ ] 17. Real-time communication enhancements
  - [ ] 17.1 Implement WebSocket manager
    - Create WebSocketManager class with connection management
    - Add subscription management for events
    - Implement automatic reconnection with exponential backoff
    - Add fallback to HTTP polling on failure
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

  - [ ] 17.2 Write property tests for WebSocket
    - **Property 53: Reconnection exponential backoff**
    - **Validates: Requirements 12.3, 21.5**

  - [ ] 17.3 Create connection status indicators
    - Display SSE connection status
    - Display WebSocket connection status
    - Show fallback mode indicator
    - Add manual reconnect button
    - _Requirements: 12.1, 12.2, 12.8, 21.7_

  - [ ] 17.4 Implement polling fallback manager
    - Create PollingManager for HTTP polling fallback
    - Configure appropriate polling intervals
    - Switch to polling when WebSocket fails
    - _Requirements: 21.6_


- [ ] 18. Multi-robot support
  - [ ] 18.1 Create robot instance management
    - Implement robotStore for managing multiple robots
    - Add robot instance configuration (name, API URL)
    - Store robot instances in localStorage
    - _Requirements: 22.2, 22.3_

  - [ ] 18.2 Implement RobotSelector component
    - Create robot selector dropdown in header
    - Add robot instance form
    - Implement robot switching functionality
    - Display current robot name and status
    - Add remove robot button
    - _Requirements: 22.1, 22.4, 22.5, 22.7, 22.8_

  - [ ] 18.3 Handle robot-specific state
    - Maintain separate state per robot instance
    - Clear state when switching robots
    - Disconnect from previous robot API
    - _Requirements: 22.6_


- [ ] 19. Semantic SLAM and object detection
  - [ ] 19.1 Create semantic object API hooks
    - Implement useSemanticObjects hook
    - Add filtering by class and confidence
    - Fetch object detection data
    - _Requirements: 16.1, 16.3_

  - [ ] 19.2 Implement SemanticObjectList component
    - Display detected objects with class, confidence, coordinates
    - Show detection timestamps
    - Add filtering controls
    - Display object persistence information
    - _Requirements: 16.2, 16.6_

  - [ ] 19.3 Create SemanticObjectDetail component
    - Display detailed object information
    - Show annotated camera images with bounding boxes
    - Add object timeline view
    - _Requirements: 16.7, 16.8, 16.9_

  - [ ] 19.4 Integrate semantic objects with Map2D
    - Display objects on 2D map (already implemented in task 12.4)
    - Ensure proper integration
    - _Requirements: 16.4, 16.5_


- [ ] 20. Navigation and exploration monitoring
  - [ ] 20.1 Create navigation API hooks
    - Implement useNavigationStatus hook
    - Implement useExplorationStats hook
    - Fetch navigation goal and path data
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ] 20.2 Implement NavigationMonitor component
    - Display exploration status (exploring, planning, idle)
    - Show exploration statistics
    - Display current goal and planned path
    - Show frontier clusters
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [ ] 20.3 Create NavigationControls component
    - Add pause, resume, cancel exploration controls
    - Display localization quality
    - Show path planning state
    - Display obstacle detection info
    - _Requirements: 17.5, 17.6, 17.7_

  - [ ] 20.4 Implement velocity and battery display
    - Show current robot velocity (linear, angular)
    - Display battery level if available
    - Show estimated remaining exploration time
    - _Requirements: 17.8, 17.9_


- [ ] 21. Safety system monitoring
  - [ ] 21.1 Create safety system API hooks
    - Implement useSafetyStatus hook
    - Implement useBehaviorTree hook
    - Fetch safety events and metrics
    - _Requirements: 18.1, 18.2_

  - [ ] 21.2 Implement SafetyMonitor component
    - Display behavior tree state
    - Show active safety behaviors and status
    - Display emergency stop status prominently
    - Show collision detection status
    - Display safety zone violations
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 21.3 Create EmergencyStopButton component
    - Implement prominent emergency stop button
    - Trigger safety system on activation
    - Display confirmation dialog
    - _Requirements: 18.6_

  - [ ] 21.4 Implement safety event logging
    - Display safety event log with timestamps
    - Show safety system health metrics
    - Add alert notifications for safety events
    - _Requirements: 18.7, 18.8, 18.9_


- [ ] 22. Performance metrics dashboard
  - [ ] 22.1 Create performance metrics API hooks
    - Implement usePerformanceMetrics hook
    - Fetch CPU, memory, network usage data
    - Get message rates and latency data
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ] 22.2 Implement PerformanceMetrics component
    - Display CPU usage per component with trends
    - Show memory usage per component with trends
    - Display network bandwidth usage
    - Show message publication rates
    - Display node processing latency
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ] 22.3 Create ResourceUsageChart component
    - Visualize performance metrics with time-series charts
    - Add zoom and pan capabilities
    - Display tf update rates and latency
    - Show disk I/O statistics
    - _Requirements: 19.6, 19.7, 19.10_

  - [ ] 22.4 Implement performance alerts
    - Add configurable threshold alerts
    - Display alert notifications
    - Provide export functionality for performance data
    - _Requirements: 19.8, 19.9_


- [ ] 23. Custom dashboard layouts
  - [ ] 23.1 Create layout management system
    - Implement layoutStore for custom layouts
    - Store layouts in localStorage
    - Support multiple named layouts
    - _Requirements: 24.5, 24.7_

  - [ ] 23.2 Implement LayoutCustomizer component
    - Create layout customization mode
    - Provide panel library
    - Add drag-and-drop panel arrangement
    - Implement panel resizing
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

  - [ ] 23.3 Create preset layouts
    - Define operator preset layout
    - Define developer preset layout
    - Define researcher preset layout
    - Add reset to default button
    - _Requirements: 24.6, 24.8_

  - [ ] 23.4 Add layout switching
    - Implement layout selector
    - Add smooth transition animations
    - _Requirements: 24.9_


- [ ] 24. Documentation and help system
  - [ ] 24.1 Create documentation content
    - Write quick start guide
    - Document API endpoints with examples
    - Create keyboard shortcut reference
    - Write troubleshooting guide
    - _Requirements: 25.3, 25.4, 25.5, 25.6_

  - [ ] 24.2 Implement HelpSystem component
    - Create help button in header
    - Display documentation in modal or sidebar
    - Add contextual help based on current view
    - Implement tooltip system for UI elements
    - _Requirements: 25.1, 25.2, 25.7_

  - [ ] 24.3 Add feedback mechanism
    - Create feedback button
    - Implement feedback form
    - _Requirements: 25.8_


- [ ] 25. Checkpoint - Feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Performance optimization
  - [ ] 26.1 Implement virtualization for large lists
    - Add react-window for component lists
    - Add virtualization for topic lists
    - Optimize rendering performance
    - _Requirements: 13.2_

  - [ ] 26.2 Write property tests for performance
    - **Property 56: Frame rate limiting**
    - **Property 58: Lazy loading**
    - **Property 59: Static data caching**
    - **Validates: Requirements 13.1, 13.4, 13.5**

  - [ ] 26.3 Add debouncing and throttling
    - Implement useDebounce hook
    - Implement useThrottle hook
    - Apply to search inputs and scroll handlers
    - _Requirements: 13.3_

  - [ ] 26.4 Implement web workers for heavy computation
    - Create data processing web worker
    - Offload point cloud parsing to worker
    - Add statistics computation worker
    - _Requirements: 13.8_

  - [ ] 26.5 Optimize bundle size
    - Configure code splitting in Vite
    - Implement lazy loading for routes
    - Optimize vendor chunks
    - Configure tree shaking
    - _Requirements: 13.9_

  - [ ] 26.6 Add React optimization
    - Apply React.memo to frequently re-rendering components
    - Use useMemo for expensive computations
    - Use useCallback for event handlers
    - _Requirements: 13.6_


- [ ] 27. Accessibility and UX polish
  - [ ] 27.1 Implement keyboard navigation
    - Add keyboard shortcuts for common actions
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators
    - _Requirements: 10.6, 10.9_

  - [ ] 27.2 Write property tests for keyboard shortcuts
    - **Property 47: Keyboard shortcut execution**
    - **Validates: Requirements 10.6**

  - [ ] 27.3 Add ARIA labels and accessibility
    - Add ARIA labels to all interactive elements
    - Ensure proper heading hierarchy
    - Add screen reader announcements for dynamic content
    - _Requirements: 10.9_

  - [ ] 27.4 Write property tests for accessibility
    - **Property 49: ARIA label presence**
    - **Validates: Requirements 10.9**

  - [ ] 27.5 Implement loading and empty states
    - Add skeleton screens for loading states
    - Create empty state components
    - Add loading spinners where appropriate
    - _Requirements: 10.7, 10.10_

  - [ ] 27.6 Write property tests for loading states
    - **Property 48: Loading state display**
    - **Property 50: Empty state display**
    - **Validates: Requirements 10.7, 10.10**

  - [ ] 27.7 Add visual feedback for interactions
    - Implement hover states
    - Add click feedback
    - Ensure focus states are visible
    - _Requirements: 10.8_

  - [ ] 27.8 Implement animation controls
    - Add animation disable option in settings
    - Ensure animations don't degrade performance
    - _Requirements: 26.8, 26.9_


- [ ] 28. Error handling and resilience
  - [ ] 28.1 Implement comprehensive error boundaries
    - Add error boundaries at route level
    - Create fallback UI for errors
    - Add error logging
    - _Requirements: 12.7_

  - [ ] 28.2 Write property tests for error handling
    - **Property 54: Error logging**
    - **Property 55: Graceful degradation**
    - **Validates: Requirements 12.7, 12.10**

  - [ ] 28.2 Add connection error handling
    - Display connection error banner
    - Implement manual reconnect button
    - Show timeout errors
    - _Requirements: 12.2, 12.8, 12.9_

  - [ ] 28.3 Implement graceful degradation
    - Handle unavailable endpoints gracefully
    - Continue functioning with partial API availability
    - Display appropriate messages for unavailable features
    - _Requirements: 12.10_


- [ ] 29. Testing infrastructure
  - [ ] 29.1 Set up testing framework
    - Install and configure Vitest
    - Install React Testing Library
    - Set up test utilities and helpers
    - Configure test coverage reporting
    - _Requirements: 29.1, 29.2, 29.5_

  - [ ] 29.2 Create mock API handlers
    - Set up MSW (Mock Service Worker)
    - Create mock responses for all API endpoints
    - Add mock data generators
    - _Requirements: 29.6_

  - [ ] 29.3 Write unit tests
    - Test utility functions (validation, formatting, transformation)
    - Test data processing functions
    - Test state management stores
    - _Requirements: 29.1_

  - [ ] 29.4 Write component tests
    - Test key React components
    - Test user interactions
    - Test error states
    - _Requirements: 29.2_

  - [ ] 29.5 Write integration tests
    - Test API client integration
    - Test real-time streaming
    - Test state management integration
    - _Requirements: 29.3_

  - [ ] 29.6 Set up E2E testing
    - Install and configure Playwright
    - Write E2E tests for critical workflows
    - Test dashboard navigation
    - Test component browsing
    - Test fault monitoring
    - _Requirements: 29.4_

  - [ ] 29.7 Configure CI/CD
    - Create GitHub Actions workflow
    - Run tests on pull requests
    - Generate coverage reports
    - _Requirements: 29.9_


- [ ] 30. Build and deployment
  - [ ] 30.1 Optimize production build
    - Configure Vite for production optimization
    - Enable minification and compression
    - Configure asset optimization
    - Set up environment variable handling
    - _Requirements: 28.2, 28.9_

  - [ ] 30.2 Set up development proxy
    - Configure Vite proxy for CORS handling
    - Add proxy configuration for API Gateway
    - _Requirements: 28.10_

  - [ ] 30.3 Create deployment documentation
    - Document build process
    - Document deployment steps
    - Document environment configuration
    - Add production deployment checklist
    - _Requirements: 28.7, 28.8_

  - [ ] 30.4 Verify Lighthouse performance
    - Run Lighthouse audit
    - Ensure performance score ≥ 80
    - Optimize based on audit results
    - _Requirements: 13.9_

  - [ ] 30.5 Test initial load time
    - Verify initial view loads within 2 seconds
    - Optimize critical rendering path
    - _Requirements: 13.10_


- [ ] 31. Final integration and polish
  - [ ] 31.1 Integration testing
    - Test all features end-to-end
    - Verify all API integrations work correctly
    - Test real-time data streaming
    - Verify error handling across all features
    - _Requirements: All_

  - [ ] 31.2 Visual polish and consistency
    - Review and ensure consistent styling
    - Verify responsive design on all screen sizes
    - Check dark mode appearance
    - Ensure smooth animations and transitions
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [ ] 31.3 Performance validation
    - Profile application performance
    - Verify frame rates for visualizations
    - Check memory usage
    - Validate bundle sizes
    - _Requirements: 13.1, 13.9, 13.10_

  - [ ] 31.4 Documentation review
    - Review and update README
    - Verify all inline documentation
    - Check help system content
    - Update API documentation
    - _Requirements: 28.7_

  - [ ] 31.5 Final checkpoint - Production ready
    - Ensure all tests pass
    - Verify all requirements are met
    - Confirm deployment readiness
    - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- The implementation follows a foundation-first approach: infrastructure → core features → advanced features → polish
- All code should be production-ready with proper error handling, loading states, and user feedback
- Focus on incremental progress with each task building on previous work
- No orphaned code - everything is integrated as it's built

