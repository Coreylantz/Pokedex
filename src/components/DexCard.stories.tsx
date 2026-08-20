import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DexCard } from './DexCard'
import type { DexEntry, Pokemon } from '../lib/types'

const entry: DexEntry = {
  regionalNo: 1,
  nationalNo: 387,
  slug: 'turtwig',
}

const turtwig: Pokemon = {
  displayName: 'Turtwig',
  genus: 'Tiny Leaf Pokémon',
  flavourText: 'Made of soil, the shell on its back hardens when it drinks water.',
  types: ['grass'],
  heightM: 0.4,
  weightKg: 10.2,
  heightImperial: `1'04"`,
  weightImperial: '22.5 lb',
  stats: [
    { name: 'HP', value: 55 },
    { name: 'Attack', value: 68 },
  ],
  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/387.png',
  spriteShiny:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/387.png',
  cry: null,
}

const meta = {
  title: 'Components/DexCard',
  component: DexCard,
  args: { entry, mon: turtwig, shiny: false, href: '/kanata/pokemon/turtwig', onSelect: fn() },
  // The card is `block-size: 100%` and looks wrong measured outside a grid.
  decorators: [
    (Story) => (
      <ul className="dex-grid" style={{ inlineSize: '20rem' }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof DexCard>

export default meta
type Story = StoryObj<typeof meta>

export const Loaded: Story = {}

/** Before the species record arrives: name from the slug, skeleton, no types. */
export const AwaitingData: Story = {
  args: { mon: undefined },
}

export const Shiny: Story = {
  args: { shiny: true },
}

export const DualType: Story = {
  args: {
    entry: { regionalNo: 3, nationalNo: 389, slug: 'torterra' },
    mon: { ...turtwig, displayName: 'Torterra', types: ['grass', 'ground'] },
  },
}

export const LongName: Story = {
  args: {
    entry: { regionalNo: 88, nationalNo: 289, slug: 'crabominable' },
    mon: { ...turtwig, displayName: 'Crabominable', types: ['fighting', 'ice'] },
  },
}

/**
 * Speech control reaches the card by what is written on it, so the accessible
 * name must contain the visible text in order. Browser-only: it depends on
 * how the text actually renders.
 */
export const NameIsBuiltFromContentInReadingOrder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link')
    const spoken = (link.textContent ?? '').toLowerCase()

    // An aria-label would replace this content rather than add to it.
    expect(link).not.toHaveAttribute('aria-label')

    // Reading order is name, number, typing; the visual order still puts the
    // number on top, which grid areas allow.
    expect(spoken.indexOf('turtwig')).toBeGreaterThanOrEqual(0)
    expect(spoken.indexOf('turtwig')).toBeLessThan(spoken.indexOf('001'))
    expect(spoken.indexOf('001')).toBeLessThan(spoken.indexOf('grass'))
  },
}

/** Decorative sprite: the name is already in the link. */
export const SpriteIsDecorative: Story = {
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('alt', '')
  },
}

export const SelectingCallsBack: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link'))
    expect(args.onSelect).toHaveBeenCalledWith('turtwig')
  },
}

/**
 * An inverted fill plus a transparent outline, so Windows High Contrast Mode —
 * which discards backgrounds but keeps outlines — still shows something.
 * Browser-only: jsdom has no computed styles worth reading.
 */
export const FocusIsVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('link')

    const resting = getComputedStyle(button).backgroundColor
    button.focus()
    // :focus-visible needs a keyboard-ish focus; this qualifies.
    await userEvent.keyboard('{Tab}')
    button.focus()

    const focused = getComputedStyle(button)
    expect(focused.outlineStyle).not.toBe('none')
    expect(focused.outlineWidth).toBe('3px')
    // Transparent outline, visible fill: the inversion is what you see.
    expect(focused.backgroundColor).not.toBe(resting)
  },
}
