import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DexCard } from './DexCard'
import type { DexEntry, Pokemon } from '../lib/types'

const entry: DexEntry = {
  regionalNo: 1,
  nationalNo: 387,
  slug: 'turtwig',
  lineHead: 'turtwig',
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
  args: { entry, mon: turtwig, shiny: false, explained: false, onSelect: fn() },
  // A grid parent, because the card is `block-size: 100%` and looks wrong
  // measured on its own.
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
    entry: { regionalNo: 3, nationalNo: 389, slug: 'torterra', lineHead: 'turtwig' },
    mon: { ...turtwig, displayName: 'Torterra', types: ['grass', 'ground'] },
  },
}

/** On /explained the card offers a reason rather than an entry. */
export const Explained: Story = {
  args: { explained: true },
}

export const LongName: Story = {
  args: {
    entry: { regionalNo: 88, nationalNo: 289, slug: 'crabominable', lineHead: 'crabrawler' },
    mon: { ...turtwig, displayName: 'Crabominable', types: ['fighting', 'ice'] },
  },
}

/**
 * The accessible name has to contain the visible text, in order, for speech
 * control to reach the card by what is written on it. Asserted in a browser
 * because it depends on how the text actually renders.
 */
export const AccessibleNameMatchesVisibleText: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    const label = button.getAttribute('aria-label') ?? ''

    expect(label).toContain('001')
    expect(label).toContain('Turtwig')
    expect(label).toContain('Grass')
    // Case is allowed to differ — the card uppercases in CSS, and WCAG 2.5.3
    // compares case-insensitively.
    expect(label.toLowerCase()).toContain('turtwig grass')
  },
}

export const SelectingCallsBack: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    expect(args.onSelect).toHaveBeenCalledWith('turtwig')
  },
}

/**
 * The focus ring is drawn with an inverted fill plus a transparent outline, so
 * that Windows High Contrast Mode — which discards backgrounds but keeps
 * outlines — still shows something. jsdom has no computed styles worth reading;
 * this only means anything in a real engine.
 */
export const FocusIsVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    const resting = getComputedStyle(button).backgroundColor
    button.focus()
    // :focus-visible needs a keyboard-ish focus; a programmatic focus after a
    // real key press qualifies.
    await userEvent.keyboard('{Tab}')
    button.focus()

    const focused = getComputedStyle(button)
    expect(focused.outlineStyle).not.toBe('none')
    expect(focused.outlineWidth).toBe('3px')
    // Transparent outline, visible fill: the inversion is what you see.
    expect(focused.backgroundColor).not.toBe(resting)
  },
}
