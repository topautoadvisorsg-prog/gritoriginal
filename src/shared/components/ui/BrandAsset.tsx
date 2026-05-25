import { useState } from 'react';

/**
 * BrandAsset — renders a brand SVG from /public/brand/ or a grey-box placeholder.
 *
 * Drop real SVGs into /public/brand/<name>.svg and they replace placeholders automatically.
 * See /public/brand/README.md for the expected filename list.
 *
 * Usage:
 *   <BrandAsset name="ninja" size={64} />
 *   <BrandAsset name="grit-wordmark" size={{ width: 200, height: 48 }} />
 */
export type BrandAssetName =
  | 'grit-wordmark'
  | 'grit-icon'
  | 'founder-1'
  | 'founder-2'
  | 'founder-3'
  | 'founder-4'
  | 'ninja'
  | 'samurai'
  | 'master'
  | 'grandmaster'
  | 'goat'
  | 'gold-key';

interface BrandAssetProps {
  name: BrandAssetName;
  /** Pixel size for square assets, or { width, height } for wordmark-style assets */
  size?: number | { width: number; height: number };
  /** Optional label override for the placeholder (defaults to humanized `name`) */
  placeholderLabel?: string;
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

const humanize = (name: string): string =>
  name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

export function BrandAsset({
  name,
  size = 48,
  placeholderLabel,
  className,
  alt,
}: BrandAssetProps) {
  const [failed, setFailed] = useState(false);

  const dims =
    typeof size === 'number' ? { width: size, height: size } : size;

  const label = placeholderLabel ?? humanize(name);
  const altText = alt ?? label;

  if (failed) {
    // Grey-box placeholder — swap-ready. Replaced 1:1 when SVG drops in /public/brand/.
    return (
      <div
        role="img"
        aria-label={altText}
        className={className}
        style={{
          width: dims.width,
          height: dims.height,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.55)',
          fontFamily: 'monospace',
          fontSize: Math.max(9, Math.min(dims.width, dims.height) / 8),
          letterSpacing: 1,
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: 4,
          userSelect: 'none',
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <img
      src={`/brand/${name}.svg`}
      alt={altText}
      width={dims.width}
      height={dims.height}
      className={className}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

export default BrandAsset;
