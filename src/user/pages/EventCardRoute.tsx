import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { EventCardPage } from '@/user/components/event/EventCardPage';
import { useEventData } from '@/user/hooks/useEventData';

const EventCardRoute = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  // Logic cleanly extracted to custom hook utilizing the new Zod-typed API client
  const { event, picks, isLoading, isError } = useEventData(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 bg-black min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8A020] mr-3" />
        <span className="text-white/50 uppercase tracking-widest text-xs font-bold">Loading event...</span>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-black min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Event Not Found</h2>
        <p className="text-white/50 text-sm mb-6">This event doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/event')}
          className="px-6 py-2 bg-[#E8A020]/20 text-[#E8A020] border border-[#E8A020]/40 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#E8A020]/30 transition-colors"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <EventCardPage
      event={event}
      picks={picks}
      onViewFightDetails={(fightId) => navigate(`/event/fight/${fightId}`)}
    />
  );
};

export default EventCardRoute;
