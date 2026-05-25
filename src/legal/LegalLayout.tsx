/**
 * Shared layout for all legal pages (ToS, Privacy, Cookie, Creator Agreement, AUP).
 * Centered prose column. Clear "attorney review required" disclaimer at top.
 *
 * These pages are SKELETONS per blueprint §32. Final language requires attorney
 * review before production launch — base language modeled after Rithmm and
 * Action Network. GRIT-specific clauses (refund policy, AI token rules, creator
 * terms) are inline and locked per blueprint hard rules.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, effectiveDate, children }: LegalLayoutProps) {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/" style={backLinkStyle}>
          <ArrowLeft size={16} /> Back to GRIT
        </Link>

        <div style={disclaimerStyle}>
          <AlertTriangle size={16} />
          <span>
            This document is a pre-launch skeleton. Final language requires attorney review
            before production. Hard rules (refund policy, founder badge permanence, etc.) match
            the master blueprint and are not subject to change without founder approval.
          </span>
        </div>

        <h1 style={titleStyle}>{title}</h1>
        <p style={metaStyle}>Effective: {effectiveDate} · Governing law: State of Delaware</p>

        <div style={contentStyle}>{children}</div>

        <hr style={hrStyle} />
        <p style={footerStyle}>
          Questions? Contact <a href="mailto:support@gritmma.com" style={linkStyle}>support@gritmma.com</a>
          <br />
          Other policies:{' '}
          <Link to="/tos" style={linkStyle}>Terms</Link> ·{' '}
          <Link to="/privacy" style={linkStyle}>Privacy</Link> ·{' '}
          <Link to="/cookie" style={linkStyle}>Cookies</Link> ·{' '}
          <Link to="/creator-agreement" style={linkStyle}>Creator Agreement</Link> ·{' '}
          <Link to="/aup" style={linkStyle}>Acceptable Use</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'hsl(220 25% 6%)',
  color: 'hsl(0 0% 92%)',
  padding: '40px 20px',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 760, margin: '0 auto',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  color: 'rgba(255,255,255,0.6)',
  textDecoration: 'none', fontSize: 13,
  marginBottom: 24,
};

const disclaimerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  padding: '12px 14px',
  background: 'hsl(40 80% 50% / 0.08)',
  border: '1px solid hsl(40 80% 50% / 0.25)',
  borderRadius: 6,
  color: 'hsl(40 80% 75%)',
  fontSize: 13, lineHeight: 1.5,
  marginBottom: 32,
};

const titleStyle: React.CSSProperties = {
  fontSize: 32, fontWeight: 700,
  margin: 0,
};

const metaStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.5)',
  fontFamily: 'monospace',
  marginTop: 8, marginBottom: 32,
};

const contentStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.75,
  color: 'rgba(255,255,255,0.85)',
};

const hrStyle: React.CSSProperties = {
  margin: '48px 0 24px',
  border: 'none',
  borderTop: '1px solid hsl(210 25% 14%)',
};

const footerStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.45)',
  textAlign: 'center',
};

const linkStyle: React.CSSProperties = {
  color: 'hsl(190 90% 60%)',
  textDecoration: 'none',
};
