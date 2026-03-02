/**
 * Topic Explorer Page
 *
 * Browse and inspect any ROS topic on the connected robot.
 * Features:
 * - Connection bar with URL input and status
 * - Searchable topic list with type information
 * - Live message inspector with JSON tree view
 * - Auto-detection of common message types with quick viz suggestions
 */

import { useState, useMemo, useCallback } from 'react';
import {
    Wifi,
    WifiOff,
    Search,
    Radio,
    RefreshCw,
    Loader2,
    Map,
    Box,
    LineChart,
    FileJson,
    Plug,
    Unplug,
    Filter,
} from 'lucide-react';
import { useRosbridgeStore } from '../features/stores/rosbridgeStore';
import { useRosbridgeTopic } from '../hooks/useRosbridgeTopic';
import { JsonTreeViewer } from '../components/common/JsonTreeViewer';
import type { TopicInfo } from '../features/realtime/rosbridgeClient';

// ─── Message Type Detection ────────────────────────────────────────────────

interface QuickVizOption {
    label: string;
    icon: React.ReactElement;
    type: 'map' | '3d' | 'plot' | 'raw';
}

function getQuickVizOptions(msgType: string): QuickVizOption[] {
    const options: QuickVizOption[] = [];

    if (msgType.includes('OccupancyGrid')) {
        options.push({ label: 'View as Map', icon: <Map className="w-3.5 h-3.5" />, type: 'map' });
    }
    if (msgType.includes('PointCloud') || msgType.includes('LaserScan')) {
        options.push({ label: 'View as 3D', icon: <Box className="w-3.5 h-3.5" />, type: '3d' });
    }
    if (
        msgType.includes('Pose') ||
        msgType.includes('Odometry') ||
        msgType.includes('Transform')
    ) {
        options.push({ label: 'View on Map', icon: <Map className="w-3.5 h-3.5" />, type: 'map' });
    }
    if (
        msgType.includes('Float') ||
        msgType.includes('Int') ||
        msgType.includes('Bool') ||
        msgType.includes('Twist') ||
        msgType.includes('Imu') ||
        msgType.includes('Battery')
    ) {
        options.push({ label: 'Plot', icon: <LineChart className="w-3.5 h-3.5" />, type: 'plot' });
    }

    // Always offer raw view
    options.push({ label: 'Raw', icon: <FileJson className="w-3.5 h-3.5" />, type: 'raw' });

    return options;
}

function getCategoryColor(msgType: string): string {
    if (msgType.includes('sensor_msgs')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (msgType.includes('geometry_msgs')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (msgType.includes('nav_msgs')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (msgType.includes('std_msgs')) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (msgType.includes('diagnostic_msgs')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (msgType.includes('visualization_msgs')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (msgType.includes('tf2_msgs')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function getShortType(msgType: string): string {
    const parts = msgType.split('/');
    return parts[parts.length - 1] || msgType;
}

// ─── Connection Bar ────────────────────────────────────────────────────────

function ConnectionBar() {
    const { url, status, connect, disconnect, setUrl } = useRosbridgeStore();
    const [inputUrl, setInputUrl] = useState(url);

    const handleConnect = useCallback(() => {
        setUrl(inputUrl);
        connect();
    }, [inputUrl, setUrl, connect]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleConnect();
            }
        },
        [handleConnect]
    );

    const statusConfig = {
        disconnected: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Disconnected' },
        connecting: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Connecting...' },
        connected: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Connected' },
        reconnecting: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Reconnecting...' },
        failed: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Failed' },
    };

    const cfg = statusConfig[status];

    return (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card shadow-sm">
            <div className="flex items-center gap-2 flex-1">
                {status === 'connected' ? (
                    <Wifi className="w-5 h-5 text-emerald-400" />
                ) : (
                    <WifiOff className="w-5 h-5 text-gray-400" />
                )}
                <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ws://robot-ip:9090"
                    className="flex-1 px-3 py-2 rounded-md border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={status === 'connected' || status === 'connecting'}
                />
            </div>

            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                {(status === 'connecting' || status === 'reconnecting') && (
                    <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                )}
                {cfg.label}
            </div>

            {status === 'connected' ? (
                <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-sm font-medium transition-colors"
                >
                    <Unplug className="w-4 h-4" />
                    Disconnect
                </button>
            ) : (
                <button
                    onClick={handleConnect}
                    disabled={status === 'connecting' || status === 'reconnecting'}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium transition-colors disabled:opacity-40"
                >
                    <Plug className="w-4 h-4" />
                    Connect
                </button>
            )}
        </div>
    );
}

// ─── Topic Inspector ───────────────────────────────────────────────────────

function TopicInspector({ topic }: { topic: TopicInfo }) {
    const { data, isConnected, lastUpdate, messageCount } = useRosbridgeTopic(
        topic.name,
        { type: topic.type, throttleRate: 100 }
    );

    const quickVizOptions = getQuickVizOptions(topic.type);

    return (
        <div className="flex flex-col h-full">
            {/* Inspector Header */}
            <div className="flex-none p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold font-mono">{topic.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getCategoryColor(topic.type)}`}>
                        {getShortType(topic.type)}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Full type: <span className="font-mono">{topic.type}</span></span>
                    <span>Messages: {messageCount}</span>
                    {lastUpdate && (
                        <span>Last: {new Date(lastUpdate).toLocaleTimeString()}</span>
                    )}
                </div>

                {/* Quick Viz Buttons */}
                <div className="flex gap-2 mt-3">
                    {quickVizOptions.map((option) => (
                        <button
                            key={option.type}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-accent text-xs font-medium transition-colors"
                            title={option.label}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-auto bg-gray-950 rounded-b-lg">
                {!isConnected && (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Not connected to rosbridge
                    </div>
                )}
                {isConnected && !data && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Waiting for messages on {topic.name}...
                    </div>
                )}
                {isConnected && data && (
                    <JsonTreeViewer data={data} className="text-xs" />
                )}
            </div>
        </div>
    );
}

// ─── Topic Explorer Page ───────────────────────────────────────────────────

export function TopicExplorer() {
    const { topics, status, isDiscovering, discoverTopics } = useRosbridgeStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<TopicInfo | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>('');

    const isConnected = status === 'connected';

    // Get unique type categories for filtering
    const typeCategories = useMemo(() => {
        const cats = new Set<string>();
        topics.forEach((t) => {
            const pkg = t.type.split('/')[0];
            if (pkg) cats.add(pkg);
        });
        return Array.from(cats).sort();
    }, [topics]);

    // Filter topics
    const filteredTopics = useMemo(() => {
        return topics.filter((t) => {
            const matchesSearch =
                !searchQuery ||
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.type.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = !typeFilter || t.type.startsWith(typeFilter);
            return matchesSearch && matchesType;
        });
    }, [topics, searchQuery, typeFilter]);

    return (
        <div className="flex h-[calc(100vh-10rem)] flex-col gap-4 overflow-hidden">
            {/* Page Header */}
            <div className="flex-none">
                <h1 className="text-3xl font-bold">Topic Explorer</h1>
                <p className="mt-2 text-muted-foreground">
                    Connect to any ROS2 robot and browse topics in real-time
                </p>
            </div>

            {/* Connection Bar */}
            <div className="flex-none">
                <ConnectionBar />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex gap-4">
                {/* Topic List (Left Panel) */}
                <div className="w-96 flex-shrink-0 flex flex-col rounded-lg border bg-card shadow-sm overflow-hidden">
                    {/* Search + Filter */}
                    <div className="flex-none p-3 border-b space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search topics..."
                                className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="flex-1 px-2 py-1 rounded border bg-background text-xs"
                            >
                                <option value="">All types</option>
                                {typeCategories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {isConnected && (
                                <button
                                    onClick={() => discoverTopics()}
                                    disabled={isDiscovering}
                                    className="p-1.5 rounded hover:bg-accent transition-colors"
                                    title="Refresh topics"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
                            {searchQuery && ` matching "${searchQuery}"`}
                        </div>
                    </div>

                    {/* Topic List */}
                    <div className="flex-1 overflow-y-auto">
                        {!isConnected && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-muted-foreground p-4 text-center">
                                <WifiOff className="w-10 h-10 opacity-30" />
                                <p>Connect to a robot to browse its topics</p>
                            </div>
                        )}

                        {isConnected && isDiscovering && (
                            <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Discovering topics...
                            </div>
                        )}

                        {isConnected && !isDiscovering && filteredTopics.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground p-4 text-center">
                                <Radio className="w-8 h-8 opacity-30" />
                                <p>No topics found</p>
                                {searchQuery && <p className="text-xs">Try a different search</p>}
                            </div>
                        )}

                        {isConnected && !isDiscovering && filteredTopics.map((topic) => (
                            <button
                                key={topic.name}
                                onClick={() => setSelectedTopic(topic)}
                                className={`w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-accent/50 transition-colors ${selectedTopic?.name === topic.name ? 'bg-accent' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm truncate flex-1">{topic.name}</span>
                                    <Radio className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-2" />
                                </div>
                                <div className="mt-1">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${getCategoryColor(topic.type)}`}>
                                        {getShortType(topic.type)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topic Inspector (Right Panel) */}
                <div className="flex-1 rounded-lg border bg-card shadow-sm overflow-hidden">
                    {!selectedTopic && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <Radio className="w-12 h-12 opacity-20" />
                            <p className="text-sm">Select a topic to inspect its messages</p>
                        </div>
                    )}

                    {selectedTopic && (
                        <TopicInspector key={selectedTopic.name} topic={selectedTopic} />
                    )}
                </div>
            </div>
        </div>
    );
}
