export type ErrorCategory = 'auth' | 'network' | 'validation' | 'data' | 'system' | 'unknown';

export interface ErrorDetails {
    title: string;
    message: string;
    action?: string;
    icon?: string;
}

export const ERROR_REGISTRY: Record<ErrorCategory, ErrorDetails> = {
    auth: {
        title: 'Authentication Required',
        message: 'Your session has expired or you do not have permission to view this content.',
        action: 'Sign In Again',
        icon: 'ShieldOff',
    },
    network: {
        title: 'Connection Issue',
        message: 'We are unable to reach our services. Please check your internet connection.',
        action: 'Retry Connection',
        icon: 'WifiOff',
    },
    validation: {
        title: 'Invalid Input',
        message: 'Some of the data provided is incorrect. Please check the form and try again.',
        action: 'Review Input',
        icon: 'Edit3',
    },
    data: {
        title: 'Data Unavailable',
        message: 'We could not retrieve the requested information. It might have been deleted or moved.',
        action: 'Go Back',
        icon: 'Database',
    },
    system: {
        title: 'System Malfunction',
        message: 'An internal error occurred. Our team has been notified.',
        action: 'Reload Dashboard',
        icon: 'Settings',
    },
    unknown: {
        title: 'Unexpected Error',
        message: 'Something went wrong. We are looking into it.',
        action: 'Refresh Page',
        icon: 'AlertTriangle',
    },
};

export function getErrorDetails(error: any): ErrorDetails {
    const category = categorizeError(error);
    const base = ERROR_REGISTRY[category];

    // Extract specific messages if available
    let dynamicMessage = base.message;

    if (error?.message && error.message !== 'An error occurred') {
        dynamicMessage = error.message;
    }

    // Handle tRPC structured errors
    if (error?.shape?.message) {
        dynamicMessage = error.shape.message;
    }

    return {
        ...base,
        message: dynamicMessage
    };
}

export function categorizeError(error: any): ErrorCategory {
    if (!error) return 'unknown';

    // tRPC errors
    if (error.data?.code) {
        const code = error.data.code;
        if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') return 'auth';
        if (code === 'BAD_REQUEST') return 'validation';
        if (code === 'NOT_FOUND') return 'data';
        if (code === 'INTERNAL_SERVER_ERROR' || code === 'TIMEOUT') return 'system';
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) return 'network';
    if (error.message.includes('NetworkError')) return 'network';

    // Default to system for other errors
    return 'system';
}
