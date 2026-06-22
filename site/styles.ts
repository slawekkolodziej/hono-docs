export const styles = String.raw`
:root {
  color-scheme: light;
  --bg: #fbfaf7;
  --surface: #ffffff;
  --text: #171717;
  --muted: #66645f;
  --line: #e7e2d8;
  --soft: #f2eee6;
  --accent: #f97316;
  --accent-soft: #fff1e6;
  --code: #111111;
  --code-muted: #a7a7a7;
  --max: 1120px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 84px;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

code,
pre,
.brand,
.eyebrow,
nav,
.sidebar,
.button,
.links,
.api-table {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
}

.topbar {
  position: sticky;
  z-index: 10;
  top: 0;
  height: 64px;
  border-bottom: 1px solid var(--line);
  background: rgba(251, 250, 247, 0.86);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 max(24px, calc((100vw - var(--max)) / 2));
}

.brand {
  font-size: 15px;
  font-weight: 700;
}

nav {
  display: flex;
  gap: 20px;
  color: var(--muted);
  font-size: 13px;
}

nav a:hover,
.sidebar a:hover,
.links a:hover {
  color: var(--accent);
}

.page {
  width: min(var(--max), calc(100% - 40px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr);
  gap: 64px;
}

.page.single {
  grid-template-columns: minmax(0, 1fr);
  max-width: 840px;
}

.sidebar {
  position: sticky;
  top: 96px;
  align-self: start;
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 120px);
  overflow: auto;
  padding-top: 88px;
  color: var(--muted);
  font-size: 13px;
  scroll-target-group: auto;
}

.nav-group {
  display: grid;
  gap: 8px;
}

.nav-group-label {
  color: var(--text);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.nav-group a {
  display: block;
  border-left: 2px solid transparent;
  padding: 2px 0 2px 10px;
  line-height: 1.45;
}

.nav-group a:target-current {
  border-left-color: var(--accent);
  color: var(--text);
  font-weight: 700;
}

.content {
  min-width: 0;
}

.hero {
  padding: 92px 0 72px;
  border-bottom: 1px solid var(--line);
}

.hero.compact {
  padding-top: 80px;
}

.eyebrow {
  margin: 0 0 18px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  max-width: 780px;
  font-size: clamp(44px, 7vw, 86px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.lead {
  max-width: 700px;
  margin-top: 24px;
  color: var(--muted);
  font-size: 19px;
  line-height: 1.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid var(--text);
  border-radius: 6px;
  padding: 0 14px;
  background: var(--text);
  color: var(--surface);
  font-size: 13px;
}

.button.secondary {
  background: transparent;
  color: var(--text);
}

.section {
  padding: 52px 0;
  border-bottom: 1px solid var(--line);
}

.section h2 {
  margin-bottom: 16px;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.section p {
  max-width: 700px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.75;
}

.section p + pre,
.section h2 + pre {
  margin-top: 18px;
}

.two-up {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(360px, 1fr);
  gap: 32px;
  align-items: start;
}

.code-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

pre {
  margin: 0;
  overflow-x: auto;
  border: 1px solid #242424;
  border-radius: 8px;
  background: var(--code);
  color: #f6f6f6;
  padding: 18px;
  font-size: 13px;
  line-height: 1.65;
}

code {
  font-size: 0.92em;
}

.token-keyword {
  color: #8ab4ff;
}

.token-string {
  color: #a7f3d0;
}

.token-comment {
  color: #777f8a;
}

.token-number {
  color: #fbbf24;
}

p code {
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--soft);
  padding: 1px 5px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 28px;
  margin-bottom: 10px;
}

.section-intro {
  display: grid;
  gap: 12px;
  margin-bottom: 10px;
}

.setup-step {
  padding: 26px 0 0;
}

.setup-step + .setup-step {
  margin-top: 26px;
  border-top: 1px solid var(--line);
}

.setup-step h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.example-list {
  display: grid;
  gap: 0;
  margin-top: 18px;
  border-top: 1px solid var(--line);
}

.example-row {
  display: grid;
  grid-template-columns: minmax(240px, 0.72fr) minmax(360px, 1fr);
  gap: 32px;
  align-items: start;
  padding: 28px;
  border-bottom: 1px solid var(--line);
}

.example-row:nth-child(even) {
  background: #f5f1e9;
}

.example-row h3 {
  font-size: 18px;
}

.example-row p {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

.markdown {
  max-width: 720px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.65;
}

.markdown p + p,
.markdown p + ul,
.markdown ul + p {
  margin-top: 10px;
}

.markdown ul {
  margin: 10px 0 0;
  padding-left: 18px;
}

.markdown li + li {
  margin-top: 4px;
}

.markdown code {
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--soft);
  padding: 1px 5px;
}

.markdown strong {
  color: var(--text);
  font-weight: 600;
}

.example-copy {
  display: grid;
  gap: 14px;
}

.example-source {
  min-width: 0;
}

.source-heading {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: var(--muted);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
}

.example-source pre {
  max-height: 560px;
  overflow-x: auto;
  white-space: pre;
}

.example-source code {
  display: block;
  max-width: 100%;
  white-space: inherit;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  color: var(--accent);
  font-size: 12px;
}

.links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
}

.icon {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
}

.api-table {
  display: grid;
  grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr);
  border-top: 1px solid var(--line);
  font-size: 13px;
}

.api-table > div {
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  line-height: 1.65;
}

.api-table > div:nth-child(odd) {
  padding-right: 18px;
  color: var(--text);
}

.api-reference-list {
  display: grid;
  gap: 18px;
  margin-top: 22px;
}

.api-reference-group {
  padding-top: 26px;
}

.api-reference-group-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-reference-group-heading h3 {
  font-size: 14px;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text);
}

.api-reference-item {
  display: grid;
  gap: 14px;
  padding: 22px 0;
  border-top: 1px solid var(--line);
}

.api-reference-item:last-child {
  border-bottom: 1px solid var(--line);
}

.api-reference-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}

.api-reference-heading h3 {
  font-size: 20px;
  line-height: 1.2;
}

.api-kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin-top: 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 8px;
  background: var(--surface);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
}

.api-kind.function {
  color: #0f766e;
  border-color: #99f6e4;
  background: #f0fdfa;
}

.api-kind.type {
  color: #7c2d12;
  border-color: #fed7aa;
  background: #fff7ed;
}

.signature {
  border-color: var(--line);
  background: #171717;
  white-space: pre-wrap;
  word-break: break-word;
}

.api-member-list {
  display: grid;
  gap: 0;
  border-top: 1px solid var(--line);
}

.api-member {
  display: grid;
  grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr);
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.api-member code {
  color: var(--text);
  overflow-wrap: anywhere;
}

.plain-list {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.8;
}

footer {
  width: min(var(--max), calc(100% - 40px));
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 34px 0 48px;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 820px) {
  .topbar {
    padding: 0 20px;
  }

  nav {
    display: none;
  }

  .page {
    width: min(100% - 32px, var(--max));
    grid-template-columns: 1fr;
    gap: 0;
  }

  .sidebar {
    display: none;
  }

  .hero {
    padding: 64px 0 48px;
  }

  h1 {
    font-size: 48px;
  }

  .lead {
    font-size: 17px;
  }

  .two-up,
  .code-grid,
  .api-table,
  .api-member,
  .example-row,
  .section-heading {
    grid-template-columns: 1fr;
    display: grid;
  }

  .api-table > div:nth-child(odd) {
    padding-bottom: 4px;
    border-bottom: 0;
  }

  .api-table > div:nth-child(even) {
    padding-top: 0;
  }

  .two-up {
    gap: 18px;
  }

  pre {
    font-size: 12px;
  }

  footer {
    display: grid;
  }
}
`
