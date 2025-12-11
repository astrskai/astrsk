import React from 'react';
import { useDesignSystem, type ImageComponentProps } from '../provider';
import { cn } from '../lib/utils';

export interface UseImageRendererOptions {
  /**
   * Custom image renderer that takes precedence over Provider's imageComponent.
   */
  renderImage?: (props: ImageComponentProps) => React.ReactNode;
}

/**
 * Hook that returns a render function for images with framework-specific optimization support.
 *
 * Priority:
 * 1. renderImage option (per-component override)
 * 2. DesignSystemProvider's imageComponent (global setting)
 * 3. Default native <img> tag (fallback)
 *
 * @example
 * ```tsx
 * const renderImage = useImageRenderer({ renderImage: props.renderImage });
 *
 * return renderImage({
 *   src: imageUrl,
 *   alt: name,
 *   className: 'my-image-class',
 *   fill: true,
 * });
 * ```
 */
export function useImageRenderer(options: UseImageRendererOptions = {}) {
  const designSystem = useDesignSystem();
  const CustomImageComponent = designSystem?.imageComponent;

  return (imageProps: ImageComponentProps): React.ReactNode => {
    // 1. renderImage option takes precedence
    if (options.renderImage) {
      return options.renderImage(imageProps);
    }

    // 2. Provider's imageComponent
    if (CustomImageComponent) {
      return <CustomImageComponent {...imageProps} />;
    }

    // 3. Default: native img tag
    return (
      <img
        src={imageProps.src}
        alt={imageProps.alt}
        sizes={imageProps.sizes}
        className={cn(
          imageProps.className,
          imageProps.fill && 'absolute inset-0 h-full w-full object-cover'
        )}
        loading={imageProps.loading}
        onError={imageProps.onError}
      />
    );
  };
}
