import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFighters } from '@/shared/hooks/useFighters';
import { FighterProfile } from '@/user/components/fighter/FighterProfile';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import SEO from '@/shared/components/SEO';
import { generateFighterSchema, injectJSONLD } from '@/shared/utils/SEOHelper';
import { useEffect } from 'react';

const FighterProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fighterMap, isLoaded } = useFighters();

    const fighter = id ? fighterMap.get(id) : undefined;

    useEffect(() => {
        if (fighter) {
            const schema = generateFighterSchema(fighter);
            injectJSONLD(schema);
        }
    }, [fighter]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
        );
    }

    if (!fighter) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-[#E8A020]/10 border border-[#E8A020]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(232,160,32,0.1)]">
                    <User className="w-10 h-10 text-[#E8A020]" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase display-font italic tracking-tight">Fighter Not Found</h3>
                <p className="text-white/40 mb-8 text-sm leading-relaxed">The fighter you are looking for has left the arena or been reassigned.</p>
                <Button 
                    onClick={() => navigate('/fighter/index')}
                    className="gold-btn button-press-scale px-8 py-3"
                >
                    RETURN TO INDEX
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title={`${fighter.firstName} "${fighter.nickname}" ${fighter.lastName}`}
                description={`View MMA statistics, performance metrics, and fight history for ${fighter.firstName} ${fighter.lastName} on GRIT.`}
                keywords={`${fighter.firstName} ${fighter.lastName}, MMA stats, fighter record, ${fighter.weightClass}, ${fighter.style}`}
            />
            <Button
                variant="ghost"
                onClick={() => navigate('/fighter/index')}
                className="gap-2 text-zinc-400 hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Fighter Index
            </Button>
            <FighterProfile fighter={fighter} />
        </div>
    );
};

export default FighterProfilePage;
