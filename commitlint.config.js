/**
 * Conventional Commits, enforced at commit time.
 *
 * This is not style policing: semantic-release derives the next version number
 * and the changelog from these prefixes, so a commit written as "fixed stuff"
 * is a release that silently does not happen. Enforcing the format now means
 * the history is already usable when the release automation goes in.
 *
 *   fix:      -> patch release
 *   feat:     -> minor release
 *   feat!:    -> major release (or a BREAKING CHANGE: footer)
 *   chore:, docs:, ci:, test:, refactor:, perf:, style:, build:, revert:
 *             -> no release, but still readable history
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The default is 100. These commits carry real reasoning in the body, and
    // wrapping prose at 100 is fine while a hard limit on the body is not.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    // A subject long enough to say what changed, short enough to read in a log.
    'header-max-length': [2, 'always', 88],
  },
}
