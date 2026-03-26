'use client'

import { useState } from 'react'

export default function CopyButton({
  url,
  label,
  isActive,
}: {
  url: string
  label: string
  isActive: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 14, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', fontFamily: 'system-ui, sans-serif' }}>
        {label}
      </span>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        color: copied ? '#4ade80' : 'rgba(255,255,255,0.3)',
        marginLeft: 12,
        minWidth: 46,
        textAlign: 'right',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {copied ? 'COPIED' : 'COPY'}
      </span>
    </button>
  )
}
