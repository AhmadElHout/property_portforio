import React from 'react';
import './Loading.css';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    message?: string;
}

const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    fullScreen = false,
    message
}) => {
    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                <div className={`loading-spinner loading-${size}`}>
                    <div className="spinner"></div>
                </div>
                {message && <p className="loading-message">{message}</p>}
            </div>
        );
    }

    return (
        <div className="loading-container">
            <div className={`loading-spinner loading-${size}`}>
                <div className="spinner"></div>
            </div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
};

export default Loading;
