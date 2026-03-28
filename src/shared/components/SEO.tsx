import React, { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
}

/**
 * SEO Component
 * Manages document title and meta tags for SPA navigation.
 */
const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => {
    useEffect(() => {
        const baseTitle = 'GRIT | Global MMA Fantasy League';
        document.title = title ? `${title} | ${baseTitle}` : baseTitle;

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }
        }

        if (keywords) {
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords) {
                metaKeywords.setAttribute('content', keywords);
            }
        }
    }, [title, description, keywords]);

    return null;
};

export default SEO;
