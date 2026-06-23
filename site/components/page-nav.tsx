export type NavGroup = {
  label: string
  links: [string, string][]
}

export function ScrollSpyMenu({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <div class='nav-group'>
          <div class='nav-group-label'>{group.label}</div>
          {group.links.map(([label, href]) => (
            <a href={href}>{label}</a>
          ))}
        </div>
      ))}
    </>
  )
}
