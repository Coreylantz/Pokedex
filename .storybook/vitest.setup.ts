import { beforeAll } from 'vitest'
import { setProjectAnnotations } from '@storybook/react-vite'
import preview from './preview'

/**
 * Applies the same decorators, globals and a11y configuration the Storybook UI
 * uses, so a story tested here renders exactly as it does when reviewed by
 * hand. Without this the device wrapper would be missing and every component
 * would be tested without its palette.
 */
const annotations = setProjectAnnotations([preview])

beforeAll(annotations.beforeAll)
