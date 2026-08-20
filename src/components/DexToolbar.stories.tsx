import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DexToolbar } from './DexToolbar'
import { ALL_TYPES } from '../lib/filter'

/**
 * The search panel. Its defining rule is that typing does nothing until you
 * submit — a name should not re-sort the list from under you letter by letter.
 */
const meta = {
  title: 'Components/DexToolbar',
  component: DexToolbar,
  args: {
    id: 'finder-panel',
    query: '',
    onQuery: fn(),
    activeTypes: [],
    onToggleType: fn(),
    onClearTypes: fn(),
    shiny: false,
    onShiny: fn(),
  },
} satisfies Meta<typeof DexToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithFilters: Story = {
  args: { query: 'bidoof', activeTypes: ['normal', 'water'] },
}

/** Nothing to clear yet, so the Clear button is disabled rather than a no-op. */
export const ClearIsDisabledWhenUnfiltered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('button', { name: 'Clear' })).toBeDisabled()
  },
}

export const TypingDoesNotSearchUntilSubmitted: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox')

    await userEvent.type(input, 'bido')
    // Four keystrokes, no searches.
    expect(args.onQuery).not.toHaveBeenCalled()

    await userEvent.keyboard('{Enter}')
    expect(args.onQuery).toHaveBeenCalledWith('bido')
  },
}

export const SubmitButtonAlsoSearches: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), '025')
    await userEvent.click(canvas.getByRole('button', { name: 'Search' }))
    expect(args.onQuery).toHaveBeenCalledWith('025')
  },
}

/** Type chips are toggle buttons, so their state is in `aria-pressed`. */
export const TypeChipsArePressableToggles: Story = {
  args: { activeTypes: ['fire'] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const fire = canvas.getByRole('button', { name: 'Fire', pressed: true })
    const water = canvas.getByRole('button', { name: 'Water', pressed: false })
    expect(fire).toBeInTheDocument()

    await userEvent.click(water)
    expect(args.onToggleType).toHaveBeenCalledWith('water')
  },
}

/**
 * The field carries a real label rather than placeholder text, which vanishes
 * as soon as you type and is not an accessible name at all.
 */
export const SearchFieldIsProperlyLabelled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox')

    expect(input).toHaveAccessibleName('Name or number')
    expect(input).not.toHaveAttribute('placeholder')
  },
}

/**
 * The chips are the fixed set of eighteen types, not the types of whichever
 * species have loaded. Deriving them from arrived data meant the panel gained
 * chips and reflowed mid-load, which was the app's largest layout shift; this
 * asserts the count so that cannot come back by accident.
 */
export const TypeChipsAreTheWholeFixedDomain: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = canvas.getByRole('group', { name: 'Type' })
    expect(within(group).getAllByRole('button')).toHaveLength(ALL_TYPES.length)
    expect(ALL_TYPES).toHaveLength(18)
  },
}
