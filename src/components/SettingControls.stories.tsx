import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Choice, Toggle } from './SettingControls'

/**
 * The switch had a real accessibility bug once: the visible label and the
 * `label` element both fed the accessible name, so it announced as
 * "High contrast Off" — the state baked into the name, changing every time you
 * toggled it. The name assertion below is there to stop that returning.
 */
const meta = {
  title: 'Components/SettingControls',
  component: Toggle,
  args: {
    label: 'High contrast',
    hint: 'Darkens muted text to full strength and drops the screen texture.',
    checked: false,
    onChange: fn(),
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}
export const On: Story = { args: { checked: true } }

export const LongHint: Story = {
  args: {
    label: 'Device frame',
    hint: 'Turn this off to show the screen alone, with no shell around it — so the device in your hand becomes the Pokédex. The D-pad goes with it; the arrow keys still work.',
  },
}

/** The name is the label alone. State is the checkbox's job, not the name's. */
export const NameExcludesState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('checkbox')

    expect(input).toHaveAccessibleName('High contrast')
    expect(input).not.toBeChecked()
    // The hint is reachable from the control, not merely sitting beside it.
    expect(input).toHaveAccessibleDescription(/Darkens muted text/)
  },
}

export const ClickingTheLabelToggles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // The switch reads "Off" while unchecked — clicking that visible control is
    // what a reader actually does. The hidden input is not a click target, and
    // going for it is precisely what made the vitals harness record no
    // interaction at all.
    const label = canvas.getByText('Off').closest('label')
    expect(label).not.toBeNull()

    await userEvent.click(label!)
    expect(args.onChange).toHaveBeenCalledWith(true)
  },
}

export const KeyboardToggles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('checkbox').focus()
    await userEvent.keyboard(' ')
    expect(args.onChange).toHaveBeenCalledWith(true)
  },
}

/** The select variant, which carries its own label and description wiring. */
export const ChoiceControl: StoryObj<typeof Choice> = {
  render: () => (
    <Choice
      label="Text size"
      hint="Scales everything on the screen together, so the layout keeps its proportions."
      value="normal"
      options={[
        { value: 'normal', label: 'Normal' },
        { value: 'large', label: 'Large' },
        { value: 'largest', label: 'Largest' },
      ]}
      onChange={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const select = canvas.getByRole('combobox')
    expect(select).toHaveAccessibleName('Text size')
    expect(select).toHaveAccessibleDescription(/Scales everything/)
  },
}
