import type { ApiReferenceMember, ApiReferenceSection } from '../api-reference'
import { highlightTypeScript } from './code-block'
import { AnchorHeading } from './markdown'
import { renderInlineMarkdownHtml, slugify } from './text'

export function ApiReference({ sections }: { sections: ApiReferenceSection[] }) {
  return (
    <>
      {sections.map((section) => {
        const sectionSlug = slugify(section.title)

        return (
          <section class='section api-reference'>
            <div class='section-intro'>
              <AnchorHeading level={2} id={sectionSlug}>
                {section.title}
              </AnchorHeading>
              <p dangerouslySetInnerHTML={renderInlineMarkdownHtml(section.description)} />
            </div>
            {section.functions.length > 0 && (
              <ApiReferenceGroup
                id={`functions-${sectionSlug}`}
                title='Functions'
                items={section.functions}
              />
            )}
            {section.types.length > 0 && (
              <ApiReferenceGroup id={`types-${sectionSlug}`} title='Types' items={section.types} />
            )}
          </section>
        )
      })}
    </>
  )
}

function ApiReferenceGroup({
  id,
  title,
  items,
}: {
  id: string
  title: string
  items: ApiReferenceMember[]
}) {
  return (
    <div class='api-reference-group'>
      <div class='api-reference-group-heading'>
        <AnchorHeading level={3} id={id}>
          {title}
        </AnchorHeading>
      </div>
      <div class='api-reference-list'>
        {items.map((item) => (
          <ApiReferenceItem item={item} />
        ))}
      </div>
    </div>
  )
}

function ApiReferenceItem({ item }: { item: ApiReferenceMember }) {
  const headingId = `${item.kind}-${slugify(item.name)}`

  return (
    <article class={`api-reference-item ${item.kind}`}>
      <div class='api-reference-heading'>
        <div>
          <AnchorHeading level={3} id={headingId}>
            {item.name}
          </AnchorHeading>
          <span class={`api-kind ${item.kind}`}>
            <span class='api-kind-icon' aria-hidden='true'>
              {item.kind === 'function' ? 'fn' : 'T'}
            </span>
            {item.kind === 'function' ? 'Function' : 'Type'}
          </span>
        </div>
      </div>
      {item.signature && (
        <pre class='signature'>
          <code dangerouslySetInnerHTML={{ __html: highlightTypeScript(item.signature) }} />
        </pre>
      )}
      {item.summary && <p dangerouslySetInnerHTML={renderInlineMarkdownHtml(item.summary)} />}
      {item.members && item.members.length > 0 && (
        <div class='api-member-list'>
          {item.members.map((member) => (
            <div class='api-member'>
              <code>{member.signature ?? member.name}</code>
              {member.summary && (
                <span dangerouslySetInnerHTML={renderInlineMarkdownHtml(member.summary)} />
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
