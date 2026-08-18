import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { RegionTabs } from './RegionTabs'
import { regions } from '../lib/router'

/**
 * The region switcher is an ARIA tablist, and the interesting part is the
 * keyboard contract: arrows move and activate, Home and End jump to the ends,
 * and only the selected tab is in the tab order.
 *
 * These play in a real browser because roving tabindex is about what actually
 * receives focus — `document.activeElement` after a real key press — which is
 * exactly the thing jsdom approximates rather than implements.
 */
const meta = {
  title: 'Components/RegionTabs',
  component: RegionTabs,
  args: {
    regions,
    activeId: 'kanata',
    onChange: fn(),
  },
} satisfies Meta<typeof RegionTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Kanata: Story = {}

export const Anahua: Story = {
  args: { activeId: 'anahua' },
}

export const OnlyTheSelectedTabIsTabbable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tabs = canvas.getAllByRole('tab')

    expect(tabs[0]).toHaveAttribute('tabindex', '0')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')

    // One Tab press reaches the tablist, not each tab in turn.
    await userEvent.tab()
    expect(tabs[0]).toHaveFocus()
    await userEvent.tab()
    expect(tabs[1]).not.toHaveFocus()
  },
}

export const ArrowKeysMoveAndActivate: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const tabs = canvas.getAllByRole('tab')

    tabs[0]?.focus()
    await userEvent.keyboard('{ArrowRight}')

    // Auto-activating: the arrow both moves focus and selects.
    expect(tabs[1]).toHaveFocus()
    expect(args.onChange).toHaveBeenCalledWith('anahua')
  },
}

export const WrapsAtTheEnds: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const tabs = canvas.getAllByRole('tab')

    tabs[0]?.focus()
    // Left from the first tab wraps to the last rather than stopping.
    await userEvent.keyboard('{ArrowLeft}')
    expect(tabs.at(-1)).toHaveFocus()
    expect(args.onChange).toHaveBeenCalledWith('anahua')
  },
}

export const HomeAndEnd: Story = {
  args: { activeId: 'anahua' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const tabs = canvas.getAllByRole('tab')

    tabs.at(-1)?.focus()
    await userEvent.keyboard('{Home}')
    expect(tabs[0]).toHaveFocus()
    expect(args.onChange).toHaveBeenCalledWith('kanata')

    await userEvent.keyboard('{End}')
    expect(tabs.at(-1)).toHaveFocus()
  },
}
