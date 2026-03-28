import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Star } from 'lucide-react';
import { ActivityFeed } from '../ActivityFeed';

interface ActivityWidgetProps {
    activities: any[];
}

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({ activities }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ActivityFeed activities={activities} maxItems={5} />
            </CardContent>
        </Card>
    );
};
