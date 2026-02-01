export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-zinc-950 px-4 py-6 text-center">
      <p className="text-sm text-zinc-500">
        © {year} — Made with{' '}
        <span className="text-rose-400" aria-hidden="true">
          ♥
        </span>{' '}
        by{' '}
        <a
          href="https://bymax.one"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-400 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Bymax One
        </a>
      </p>
    </footer>
  )
}
