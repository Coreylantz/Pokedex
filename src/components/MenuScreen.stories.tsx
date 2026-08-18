import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { MenuScreen } from './MenuScreen'
import { regions } from '../lib/router'

const [kanata, anahua] = regions

const meta = {
  title: 'Screens/MenuScreen',
  component: MenuScreen,
  args: { region: kanata!, onOpen: fn() },
} satisfies Meta<typeof MenuScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Kanata: Story = {}

export const Anahua: Story = {
  args: { region: anahua! },
  globals: { skin: 'gen2' },
}

/** The landing screen carries the page's only h1, and the tiles are a nav list. */
export const Structure: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Kanata')
    expect(canvas.getByRole('navigation', { name: 'Main menu' })).toBeInTheDocument()

    const items = canvas.getAllByRole('button')
    expect(items).toHaveLength(3)
    expect(items.map((b) => b.textContent)).toEqual(['Pokémon', 'Region', 'Settings'])
  },
}

export const TilesOpenTheirPage: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Pokémon' }))
    expect(args.onOpen).toHaveBeenCalledWith('dex')

    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }))
    expect(args.onOpen).toHaveBeenCalledWith('settings')
  },
}

/**
 * Every tile is reachable by keyboard in reading order. Real browser only:
 * jsdom does not implement sequential focus navigation.
 */
export const KeyboardReachesEveryTile: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tiles = canvas.getAllByRole('button')

    for (const tile of tiles) {
      await userEvent.tab()
      expect(tile).toHaveFocus()
    }
  },
}
