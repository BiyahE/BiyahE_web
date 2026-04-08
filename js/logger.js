// ============================================
// BIYAHE SITE-WIDE CONSOLE LOGGER
// Include this script on ALL pages
// ============================================

(function() {
    'use strict';

    const LOGGER_CONFIG = {
        channelName: 'biyahe_dev_logs',
        maxStoredLogs: 500,
        enabled: true
    };

    // Storage keys
    const STORAGE_KEY = 'biyahe_logs';
    const LAST_CLEANUP_KEY = 'biyahe_logs_last_cleanup';

    // Broadcast Channel for real-time communication
    let broadcastChannel = null;
    
    // Initialize broadcast channel if supported
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            broadcastChannel = new BroadcastChannel(LOGGER_CONFIG.channelName);
        } catch (e) {
            console.warn('BroadcastChannel not available:', e);
        }
    }

    // Original console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        trace: console.trace
    };

    // Utility: Get current timestamp
    function getTimestamp() {
        return new Date().toISOString();
    }

    // Utility: Get page source identifier
    function getSource() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index';
        return page.replace('.html', '');
    }

    // Utility: Serialize arguments
    function serializeArgs(args) {
        return args.map(arg => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (arg instanceof Error) {
                return {
                    type: 'Error',
                    name: arg.name,
                    message: arg.message,
                    stack: arg.stack
                };
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.parse(JSON.stringify(arg, null, 2));
                } catch (e) {
                    return '[Circular/Object]';
                }
            }
            return arg;
        });
    }

    // Utility: Format message for display
    function formatMessage(args) {
        return args.map(arg => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}`;
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return '[Object]';
                }
            }
            return String(arg);
        }).join(' ');
    }

    // Core: Add log entry
    function addLogEntry(level, args, source) {
        if (!LOGGER_CONFIG.enabled) return;

        const logEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: getTimestamp(),
            level: level,
            message: formatMessage(args),
            rawArgs: serializeArgs(args),
            source: source || getSource(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Store in localStorage
        storeLog(logEntry);

        // Broadcast to other tabs (including Developer Logs page)
        broadcastLog(logEntry);
    }

    // Store log in localStorage with cleanup
    function storeLog(logEntry) {
        try {
            let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            logs.unshift(logEntry);
            
            // Trim to max size
            if (logs.length > LOGGER_CONFIG.maxStoredLogs) {
                logs = logs.slice(0, LOGGER_CONFIG.maxStoredLogs);
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
            
            // Cleanup old logs every hour
            cleanupOldLogs();
        } catch (e) {
            // If storage is full, clear and start fresh
            if (e.name === 'QuotaExceededError') {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.setItem(STORAGE_KEY, JSON.stringify([logEntry]));
            }
        }
    }

    // Cleanup logs older than 24 hours
    function cleanupOldLogs() {
        const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
        const now = Date.now();
        
        if (!lastCleanup || (now - parseInt(lastCleanup)) > 3600000) { // 1 hour
            try {
                let logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours
                logs = logs.filter(log => new Date(log.timestamp).getTime() > cutoff);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
                localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
            } catch (e) {
                console.warn('Log cleanup failed:', e);
            }
        }
    }

    // Broadcast log to other tabs
    function broadcastLog(logEntry) {
        if (broadcastChannel) {
            try {
                broadcastChannel.postMessage({
                    type: 'NEW_LOG',
                    data: logEntry
                });
            } catch (e) {
                // Fallback to storage event
                localStorage.setItem('biyahe_log_broadcast', JSON.stringify({
                    timestamp: Date.now(),
                    log: logEntry
                }));
            }
        } else {
            // Fallback for older browsers
            localStorage.setItem('biyahe_log_broadcast', JSON.stringify({
                timestamp: Date.now(),
                log: logEntry
            }));
        }
    }

    // Override console methods
    function overrideConsole() {
        console.log = function(...args) {
            addLogEntry('info', args);
            originalConsole.log.apply(console, args);
        };

        console.error = function(...args) {
            addLogEntry('error', args);
            originalConsole.error.apply(console, args);
        };

        console.warn = function(...args) {
            addLogEntry('warn', args);
            originalConsole.warn.apply(console, args);
        };

        console.info = function(...args) {
            addLogEntry('info', args);
            originalConsole.info.apply(console, args);
        };

        console.debug = function(...args) {
            addLogEntry('debug', args);
            originalConsole.debug.apply(console, args);
        };

        console.trace = function(...args) {
            addLogEntry('debug', args, 'Trace');
            originalConsole.trace.apply(console, args);
        };
    }

    // Capture global errors
    function captureGlobalErrors() {
        window.addEventListener('error', (event) => {
            addLogEntry('error', [
                `Uncaught ${event.error?.name || 'Error'}: ${event.message}`,
                `at ${event.filename}:${event.lineno}:${event.colno}`
            ], 'GlobalError');
        });

        window.addEventListener('unhandledrejection', (event) => {
            addLogEntry('error', [
                `Unhandled Promise Rejection: ${event.reason}`
            ], 'UnhandledRejection');
        });
    }

    // API for external use
    window.BiyaheLogger = {
        // Manual log with custom source
        log: function(level, message, source) {
            addLogEntry(level, [message], source);
        },

        // Get all stored logs
        getLogs: function() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            } catch (e) {
                return [];
            }
        },

        // Clear all logs
        clearLogs: function() {
            localStorage.removeItem(STORAGE_KEY);
            if (broadcastChannel) {
                broadcastChannel.postMessage({ type: 'CLEAR_LOGS' });
            }
        },

        // Enable/disable logging
        setEnabled: function(enabled) {
            LOGGER_CONFIG.enabled = enabled;
        },

        // Get logs by level
        getLogsByLevel: function(level) {
            return this.getLogs().filter(log => log.level === level);
        },

        // Get logs by source
        getLogsBySource: function(source) {
            return this.getLogs().filter(log => log.source === source);
        },

        // Subscribe to new logs (for Developer Logs page)
        onNewLog: function(callback) {
            if (broadcastChannel) {
                broadcastChannel.onmessage = (event) => {
                    if (event.data.type === 'NEW_LOG') {
                        callback(event.data.data);
                    } else if (event.data.type === 'CLEAR_LOGS') {
                        callback({ type: 'CLEAR' });
                    }
                };
            } else {
                // Fallback to storage events
                window.addEventListener('storage', (e) => {
                    if (e.key === 'biyahe_log_broadcast') {
                        try {
                            const data = JSON.parse(e.newValue);
                            if (data && data.log) {
                                callback(data.log);
                            }
                        } catch (err) {}
                    }
                });
            }
        }
    };

    // Initialize
    overrideConsole();
    captureGlobalErrors();

    // Log initialization
    originalConsole.log('[BiyaheLogger] Console capture initialized on:', getSource());

})();