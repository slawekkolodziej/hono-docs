export type IconName = 'swagger' | 'scalar' | 'json' | 'api'

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      class='icon'
      viewBox='0 0 24 24'
      aria-hidden='true'
      fill='none'
      stroke='currentColor'
      stroke-width='1.8'
      stroke-linecap='round'
      stroke-linejoin='round'
    >
      {name === 'swagger' && (
        <>
          <path d='M5 5h14v14H5z' />
          <path d='M9 9h6M9 13h6M9 17h3' />
        </>
      )}
      {name === 'scalar' && (
        <>
          <path d='M4 7h16M4 12h16M4 17h16' />
          <path d='M8 4v16M16 4v16' />
        </>
      )}
      {name === 'json' && (
        <>
          <path d='M8 8 5 12l3 4M16 8l3 4-3 4' />
          <path d='m14 6-4 12' />
        </>
      )}
      {name === 'api' && (
        <>
          <path d='M6 8h12M6 12h12M6 16h7' />
          <path d='M4 4h16v16H4z' />
        </>
      )}
    </svg>
  )
}
