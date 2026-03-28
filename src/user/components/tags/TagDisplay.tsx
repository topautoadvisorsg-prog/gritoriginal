import React from 'react';

interface TagDisplayProps {
    tagName: string;
    value: number; // 1-10
    color: string; // hex color
    description?: string;
}

/**
 * Visual tag block showing tag name + colored indicator bar.
 * Designed as a visual scouting summary element.
 */
export const TagDisplay: React.FC<TagDisplayProps> = ({ tagName, value, color, description }) => {
    const percentage = (value / 10) * 100;

    return (
        <div className="group relative" title={description || tagName}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                    {tagName}
                </span>
                <span className="text-xs font-bold" style={{ color }}>
                    {value}/10
                </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
        </div>
    );
};

export default TagDisplay;
