import { useEffect, useState } from 'react'
import { PROVIDERS, getActiveProvider, setActiveProvider, type TurnProvider } from '@/turn/client'

export function TurnSwitcher() {
  const [value, setValue] = useState<TurnProvider>('cloudflare')

  useEffect(() => {
    setValue(getActiveProvider())
  }, [])

  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
      Relay
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value as TurnProvider
          setActiveProvider(next)
          setValue(next)
        }}
      >
        {PROVIDERS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </label>
  )
}