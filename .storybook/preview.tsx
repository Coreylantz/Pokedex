import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/styles/index.css'

/**
 * Colours are declared on `.app[data-skin]` and consumed further down, so a
 * bare story would leave every custom property unresolved and the component
 * invisible. Each is wrapped in the same `.app` and `.screen` the app provides,
 * with the skin as a toolbar control.
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
    // Storybook's backgrounds would sit under the device and misrepresent contrast.
    backgrounds: { disable: true },
    controls: { expanded: true },

    /**
     * The same rule set the e2e suite gates on. A component that passed here
     * and failed there would make both checks untrustworthy.
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
