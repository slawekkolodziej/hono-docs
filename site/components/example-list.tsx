import { openApiPath, scalarPath, swaggerPath } from '../examples'
import type { Example } from '../examples'
import { CodeBlock } from './code-block'
import { Icon } from './icon'
import { AnchorHeading, Markdown } from './markdown'

export function ExampleList({
  examples,
  appSources,
}: {
  examples: Example[]
  appSources: Record<string, string>
}) {
  return (
    <div class='example-list'>
      {examples.map((example) => (
        <article class='example-row'>
          <div class='example-copy'>
            <AnchorHeading level={3} id={`example-${example.slug}`}>
              {example.name}
            </AnchorHeading>
            <Markdown>{example.description}</Markdown>
            <div class='links example-links'>
              <a href={swaggerPath(example)}>
                <Icon name='swagger' /> Open Swagger
              </a>
              <a href={scalarPath(example)}>
                <Icon name='scalar' /> Open Scalar
              </a>
              <a href={openApiPath(example)}>
                <Icon name='json' /> openapi.json
              </a>
            </div>
          </div>
          <div class='example-source'>
            <div class='source-heading'>
              <Icon name='api' /> app.ts
            </div>
            <CodeBlock>
              {appSources[example.slug] ?? 'Unable to load integration app source.'}
            </CodeBlock>
          </div>
        </article>
      ))}
    </div>
  )
}
