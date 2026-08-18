import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ErrorScreen } from './ErrorScreen'

/**
 * Every failure the app can show. Deliberately screens rather than toasts —
 * a failure that disappears on a timer is one a reader can miss entirely, and
 * these all have an action attached.
 */
const meta = {
  title: 'Screens/ErrorScreen',
  component: ErrorScreen,
  args: {
    title: 'No answer',
    detail:
      'The species archive did not respond, so no entries could be read. It is usually back within a minute.',
    code: 'Kanata · 0 of 158 read',
    onRetry: fn(),
    onBack: fn(),
  },
} satisfies Meta<typeof ErrorScreen>

export default meta
type Story = StoryObj<typeof meta>

/** The API is reachable but did not answer. */
export const ApiUnreachable: Story = {}

/** No network, and this region was never saved for offline use. */
export const Offline: Story = {
  args: {
    title: 'Offline',
    detail:
      'There is no connection, and this dex has not been saved for offline use yet. Entries you have already opened are still available.',
    code: 'Kanata · 0 of 158 read',
  },
}

/** One species failed while the rest of the dex loaded fine. */
export const SingleEntryFailed: Story = {
  args: {
    title: 'Entry unreadable',
    detail:
      'Bidoof could not be read from the species archive. The rest of the dex is unaffected.',
    code: 'Nº 042 · bidoof',
    onRetry: undefined,
  },
}

/** A render fault caught by the error boundary. */
export const RenderFault: Story = {
  args: {
    title: 'Dex fault',
    detail:
      'This screen stopped working. Going back usually clears it; if it keeps happening, the entry may be malformed.',
    code: "Cannot read properties of undefined (reading 'types')",
    retryLabel: 'Reload',
  },
}

/** Nothing to retry and nowhere to go back to — both actions are optional. */
export const NoActions: Story = {
  args: { onRetry: undefined, onBack: undefined, code: undefined },
}

/**
 * An error has to announce itself. `role="alert"` is what makes a screen
 * reader speak it on arrival rather than leaving it to be discovered.
 */
export const AnnouncesItself: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = canvas.getByRole('alert')
    expect(alert).toBeInTheDocument()
    // Named by its heading, so the announcement leads with what went wrong.
    expect(alert).toHaveAccessibleName('No answer')
  },
}

export const ActionsWork: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    expect(args.onRetry).toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: 'Back' }))
    expect(args.onBack).toHaveBeenCalled()
  },
}
