import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Main entry (barrel export - backward compatibility)
    index: 'src/index.ts',
    // Individual component entries (tree-shaking optimization)
    'components/Button/index': 'src/components/Button/index.ts',
    'components/Input/index': 'src/components/Input/index.ts',
    'components/Label/index': 'src/components/Label/index.ts',
    'components/LabeledInput/index': 'src/components/LabeledInput/index.ts',
    'components/Textarea/index': 'src/components/Textarea/index.ts',
    'components/LabeledTextarea/index': 'src/components/LabeledTextarea/index.ts',
    'components/Select/index': 'src/components/Select/index.ts',
    'components/Avatar/index': 'src/components/Avatar/index.ts',
    'components/Skeleton/index': 'src/components/Skeleton/index.ts',
    'components/CharacterCard/index': 'src/components/CharacterCard/index.ts',
    'components/SessionCard/index': 'src/components/SessionCard/index.ts',
    'components/TabBar/index': 'src/components/TabBar/index.ts',
    'components/Accordion/index': 'src/components/Accordion/index.ts',
    'lib/utils': 'src/lib/utils.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  sourcemap: false,
  minify: false, // Keep readable for debugging
  external: ['react', 'react-dom'],
});
