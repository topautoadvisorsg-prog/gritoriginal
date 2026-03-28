/**
 * SEOHelper Utility
 * Generates JSON-LD structured data for fighters and events to improve search discovery.
 */

export const generateFighterSchema = (fighter: any) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": `${fighter.firstName} ${fighter.lastName}`,
        "nickname": fighter.nickname,
        "image": fighter.imageUrl,
        "jobTitle": "Mixed Martial Artist",
        "nationality": {
            "@type": "Country",
            "name": fighter.nationality
        },
        "description": fighter.bio || `Professional MMA fighter competing in ${fighter.organization}.`,
        "description_extended": `${fighter.firstName} "${fighter.nickname}" ${fighter.lastName} has a record of ${fighter.wins}-${fighter.losses}-${fighter.draws}.`,
        "knowsAbout": ["Mixed Martial Arts", fighter.weightClass, fighter.style],
        "memberOf": {
            "@type": "Organization",
            "name": fighter.organization
        }
    };

    return JSON.stringify(schema);
};

export const generateEventSchema = (event: any) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": event.name,
        "description": event.description || "Global MMA Championship Event",
        "startDate": event.startDate,
        "location": {
            "@type": "Place",
            "name": event.location || "Global Arena",
            "address": event.venue || "TBA"
        },
        "organizer": {
            "@type": "Organization",
            "name": "GRIT"
        },
        "competitor": event.fightCard?.map((fight: any) => ({
            "@type": "SportsTeam",
            "name": `${fight.fighter1Name} vs ${fight.fighter2Name}`
        }))
    };

    return JSON.stringify(schema);
};

export const injectJSONLD = (jsonLD: string) => {
    const existingScript = document.getElementById('json-ld');
    if (existingScript) {
        existingScript.innerHTML = jsonLD;
    } else {
        const script = document.createElement('script');
        script.id = 'json-ld';
        script.type = 'application/ld+json';
        script.innerHTML = jsonLD;
        document.head.appendChild(script);
    }
};
