import React from 'react';
import { EventCountdown } from '../EventCountdown';

interface CountdownWidgetProps {
    upcomingEvent: any;
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({ upcomingEvent }) => {
    if (!upcomingEvent) return null;

    return (
        <EventCountdown
            eventId={upcomingEvent.id}
            eventName={upcomingEvent.name}
            eventDate={new Date(upcomingEvent.date)}
            picksComplete={upcomingEvent.picksComplete}
            totalPicks={upcomingEvent.totalFights}
        />
    );
};
