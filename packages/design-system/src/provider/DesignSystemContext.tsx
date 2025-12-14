import React, { createContext, useContext, useMemo } from 'react';

/**
 * Props passed to custom image components.
 * Use these props to render framework-specific optimized images.
 */
export interface ImageComponentProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** CSS class names for styling */
  className?: string;
  /** Responsive image sizes hint */
  sizes?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Error handler when image fails to load */
  onError?: () => void;
  /** Fill mode - image should fill its container */
  fill?: boolean;
  /**
   * Priority loading hint for LCP optimization.
   * When true, the image will be preloaded with high priority.
   * Use for above-the-fold images (e.g., first visible card in a list).
   * @see https://nextjs.org/docs/app/api-reference/components/image#priority
   */
  priority?: boolean;
}

/**
 * Design System configuration options.
 */
export interface DesignSystemConfig {
  /**
   * Custom image component for framework-specific optimization.
   * Applied globally to all image-rendering components (CharacterCard, SessionCard, etc.).
   *
   * @example Next.js Image
   * ```tsx
   * import Image from 'next/image';
   *
   * <DesignSystemProvider
   *   imageComponent={({ src, alt, className, sizes, onError, fill }) => (
   *     <Image
   *       src={src}
   *       alt={alt}
   *       className={className}
   *       sizes={sizes}
   *       onError={onError}
   *       fill={fill}
   *       style={{ objectFit: 'cover' }}
   *     />
   *   )}
   * >
   * ```
   *
   * @example Remix/React Router with custom loader
   * ```tsx
   * <DesignSystemProvider
   *   imageComponent={({ src, alt, className, loading, onError }) => (
   *     <img
   *       src={`/image-proxy?url=${encodeURIComponent(src)}`}
   *       alt={alt}
   *       className={className}
   *       loading={loading}
   *       onError={onError}
   *     />
   *   )}
   * >
   * ```
   */
  imageComponent?: React.ComponentType<ImageComponentProps>;
}

const DesignSystemContext = createContext<DesignSystemConfig | null>(null);

export interface DesignSystemProviderProps extends DesignSystemConfig {
  children: React.ReactNode;
}

/**
 * DesignSystemProvider
 *
 * Provides global configuration for design system components.
 * Wrap your app with this provider to customize behavior across all components.
 *
 * @example Basic setup with Next.js Image optimization
 * ```tsx
 * import { DesignSystemProvider } from '@astrsk/design-system';
 * import Image from 'next/image';
 *
 * function App({ children }) {
 *   return (
 *     <DesignSystemProvider
 *       imageComponent={({ src, alt, className, sizes, onError, fill }) => (
 *         <Image
 *           src={src}
 *           alt={alt}
 *           className={className}
 *           sizes={sizes}
 *           onError={onError}
 *           fill={fill}
 *           style={{ objectFit: 'cover' }}
 *         />
 *       )}
 *     >
 *       {children}
 *     </DesignSystemProvider>
 *   );
 * }
 * ```
 */
export function DesignSystemProvider({
  children,
  imageComponent,
}: DesignSystemProviderProps) {
  const config = useMemo<DesignSystemConfig>(
    () => ({ imageComponent }),
    [imageComponent]
  );

  return (
    <DesignSystemContext.Provider value={config}>
      {children}
    </DesignSystemContext.Provider>
  );
}

/**
 * Hook to access design system configuration.
 * Returns null if used outside of DesignSystemProvider (graceful fallback).
 */
export function useDesignSystem(): DesignSystemConfig | null {
  return useContext(DesignSystemContext);
}
