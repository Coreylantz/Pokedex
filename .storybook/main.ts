import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook runs against the real Vite config so components behave the way
 * they do in the app — same icon compilation, same CSS layers, same aliases.
 *
 * The PWA plugin is stripped in `viteFinal`. A service worker inside Storybook
 * would precache the story iframe and then serve stale components after every
 * edit, which is the opposite of what a component workbench is for.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  async viteFinal(config) {
    return {
      ...config,
      plugins: (config.plugins ?? []).filter((plugin) => {
        const name = plugin && 'name' in plugin ? plugin.name : ''
        return !String(name).includes('pwa') && !String(name).includes('workbox')
      }),
    }
  },
}

export default config
