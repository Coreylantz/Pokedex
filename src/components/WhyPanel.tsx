import { speciesName, titleCase } from '../lib/format'
import type { Criterion, CriterionInfo, DexEntry, Rationale, Region } from '../lib/types'

interface WhyPanelProps {
  entry: DexEntry
  region: Region
  criteria: Record<Criterion, CriterionInfo>
  /** Undefined until the lazily-loaded /explained payload arrives. */
  rationale: Rationale | undefined
  variantNote: string | undefined
}

/**
 * The /explained view: why this evolution line earns a place in this region,
 * and which of the four criteria it meets.
 *
 * Its own component because it is a whole second reading of an entry, shown on
 * a route nothing links to, and inlining it made PokemonPage score 21 on
 * cognitive complexity against a limit of 15.
 *
 * The heading names the line rather than the species when they differ: the
 * reasoning was written once for the line, so claiming it explains Bayleef
 * specifically would misrepresent where the decision was made.
 */
export function WhyPanel({ entry, region, criteria, rationale, variantNote }: WhyPanelProps) {
  const heading =
    entry.lineHead === entry.slug
      ? `Why it is in ${region.name}`
      : `Why the ${titleCase(speciesName(entry.lineHead))} line is in ${region.name}`

  const met = (key: string) => rationale?.tags.includes(key as Criterion) ?? false

  return (
    <section className="why" aria-labelledby="why-head">
      <h2 id="why-head" className="why__head">
        {heading}
      </h2>
      <p className="why__text">{rationale?.why ?? 'Loading the field notes…'}</p>

      {/* The criteria this line earns its place on. One is the floor, two is
          the target, and the score is simply the count. */}
      <div className="why__score">
        <p className="why__score-head">
          Meets {rationale?.tags.length ?? 0} of {Object.keys(criteria).length} criteria
        </p>
        <ul className="why__tags">
          {Object.entries(criteria).map(([key, criterion]) => (
            <li key={key}>
              <span className="why__tag" data-met={met(key)} title={criterion.blurb}>
                <span aria-hidden="true">{met(key) ? '●' : '○'}</span> {criterion.label}
                {/* The filled and hollow circles are decoration; this is what
                    carries the state to anyone not looking at them. */}
                <span className="visually-hidden">{met(key) ? ': met' : ': not met'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Only shown where a form was actually chosen over its alternatives. */}
      {variantNote && (
        <p className="why__variant">
          <span className="why__variant-label">On this form</span> {variantNote}
        </p>
      )}
    </section>
  )
}
