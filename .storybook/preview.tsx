import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/styles/index.css'

/**
 * Every component in this app inherits its colours from the device shell:
 * `--scr-ink`, `--scr-bg` and the rest are declared on `.app[data-skin]` and
 * consumed further down. Rendering a story bare would leave every custom
 * property unresolved and the component invisible.
 *
 * So each story is wrapped in the same two elements the app provides — the
 * skinned `.app` and the `.screen` that owns the screen palette — and the skin
 * is a toolbar control, because "does this work on both hardware generations"
 * is the question worth asking of every component here.
 */
const withDevice: Decorator = (Story, context) => {
  const { skin, typeface, textSize, contrast } = context.globals

  return (
    <div
      className="app"
      data-skin={skin}
      data-typeface={typeface}
      data-text-size={textSize}
      data-contrast={contrast}
      data-scanlines="false"
      data-glow="false"
      data-shell="true"
      style={{ display: 'block', minBlockSize: 'auto' }}
    >
      <div className="screen" style={{ padding: '0.75rem', maxInlineSize: '26rem' }}>
        <Story />
      </div>
    </div>
  )
}

const preview: Preview = {
  decorators: [withDevice],

  globalTypes: {
    skin: {
      description: 'Pokedex hardware generation',
      toolbar: {
        title: 'Skin',
        icon: 'contrast',
        items: [
          { value: 'gen1', title: 'Gen 1 — red shell, mono screen' },
          { value: 'gen2', title: 'Gen 2 — gold shell, colour screen' },
        ],
        dynamicTitle: true,
      },
    },
    typeface: {
      toolbar: {
        title: 'Typeface',
        items: [
          { value: 'digital', title: 'Digital' },
          { value: 'readable', title: 'Readable' },
        ],
      },
    },
    textSize: {
      toolbar: {
        title: 'Text size',
        items: [
          { value: 'normal', title: 'Normal' },
          { value: 'large', title: 'Large' },
          { value: 'largest', title: 'Largest' },
        ],
      },
    },
    contrast: {
      toolbar: {
        title: 'Contrast',
        items: [
          { value: 'false', title: 'Normal contrast' },
          { value: 'true', title: 'High contrast' },
        ],
      },
    },
  },

  initialGlobals: {
    skin: 'gen1',
    typeface: 'digital',
    textSize: 'normal',
    contrast: 'false',
  },

  parameters: {
    layout: 'centered',
    // The app paints its own ground; Storybook's backgrounds would sit under
    // the device and misrepresent the contrast.
    backgrounds: { disable: true },
    controls: { expanded: true },

    /**
     * The same rule set the e2e suite gates on — WCAG 2.0/2.1 A, AA and AAA,
     * WCAG 2.2 AA, plus axe's best-practice tags. Keeping the two in step
     * matters: a component that passes here and fails in e2e would make both
     * checks untrustworthy.
     */
    a11y: {
      config: {},
      options: {
        runOnly: {
          type: 'tag',
          values: [
            'wcag2a',
            'wcag2aa',
            'wcag2aaa',
            'wcag21a',
            'wcag21aa',
            'wcag21aaa',
            'wcag22aa',
            'best-practice',
          ],
        },
      },
      // Fails the test run rather than only colouring a panel nobody opens.
      test: 'error',
    },
  },
}

export default preview
