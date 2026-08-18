import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { PokemonPage } from './PokemonPage'
import { criteria, regions } from '../lib/router'
import type { DexEntry, Pokemon } from '../lib/types'

const region = regions[0]!

const entry: DexEntry = {
  regionalNo: 42,
  nationalNo: 399,
  slug: 'bidoof',
  lineHead: 'bidoof',
}

const bidoof: Pokemon = {
  displayName: 'Bidoof',
  genus: 'Plump Mouse Pokémon',
  flavourText:
    'With nerves of steel, nothing can perturb it. It is more agile and active than it appears.',
  types: ['normal'],
  heightM: 0.5,
  weightKg: 20,
  heightImperial: `1'08"`,
  weightImperial: '44.1 lb',
  stats: [
    { name: 'HP', value: 59 },
    { name: 'Attack', value: 45 },
    { name: 'Defense', value: 40 },
    { name: 'Sp. Attack', value: 35 },
    { name: 'Sp. Defense', value: 40 },
    { name: 'Speed', value: 31 },
  ],
  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/399.png',
  spriteShiny:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/399.png',
  cry: null,
}

const meta = {
  title: 'Screens/PokemonPage',
  component: PokemonPage,
  args: {
    entry,
    mon: bidoof,
    region,
    area: 'Karonto City & the Ravines',
    shiny: false,
    explained: false,
    criteria,
    onBack: fn(),
    onStep: fn(),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PokemonPage>

export default meta
type Story = StoryObj<typeof meta>

export const Entry: Story = {}

export const Gen2: Story = { globals: { skin: 'gen2' } }

/** Before the species record arrives. */
export const Loading: Story = {
  args: { mon: undefined },
}

export const WithACry: Story = {
  args: { mon: { ...bidoof, cry: 'https://example.invalid/cry.ogg' } },
}

/** The /explained view swaps the stat block for the reasoning. */
export const Explained: Story = {
  args: {
    explained: true,
    rationale: {
      why: 'THE FLOODPLAIN. A beaver that dams rivers, the animal on the nickel and the reason half the country was mapped at all — the fur trade followed the beaver, and the beaver followed the water.',
      tags: ['thematic', 'fauna'],
    },
  },
}

export const ExplainedWithVariantNote: Story = {
  args: {
    ...Explained.args,
    variantNote: 'The Alolan form is the one carried here: bone-keeper, not desert lizard.',
  },
}

/**
 * Base stats are exposed as meters, not decorative bars. A `meter` role with
 * real min/max/now is the difference between a screen reader reading "59 of
 * 255" and reading nothing at all.
 */
export const StatsAreMeters: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const meters = canvas.getAllByRole('meter')

    expect(meters).toHaveLength(6)
    for (const meter of meters) {
      expect(meter).toHaveAttribute('aria-valuemax', '255')
      expect(meter).toHaveAccessibleName()
      expect(meter).not.toHaveAttribute('aria-hidden')
    }
  },
}

/**
 * Arriving at an entry moves focus to the heading, which is what makes it read
 * as a navigation instead of content silently swapping underneath.
 */
export const FocusMovesToTheHeading: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { level: 1 })).toHaveFocus()
  },
}
