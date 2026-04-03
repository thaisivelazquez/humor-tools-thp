'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase/client'

export default function PromptChainTool() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  const [flavors, setFlavors] = useState<any[]>([])
  const [steps, setSteps] = useState<any[]>([])
  const [selectedFlavor, setSelectedFlavor] = useState<any>(null)

  useEffect(() => {
    loadFlavors()

    // Load saved theme
    const saved = localStorage.getItem('theme')
    if (saved) setTheme(saved as any)
  }, [])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (mode: 'light' | 'dark') => {
      if (mode === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    }

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark ? 'dark' : 'light')
    } else {
      applyTheme(theme)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const loadFlavors = async () => {
    const { data } = await supabase.from('humor_flavors').select('*')
    setFlavors(data || [])
  }

  const loadSteps = async (flavorId: number) => {
    const { data } = await supabase
      .from('humor_flavor_steps')
      .select('*')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true })

    setSteps(data || [])
  }

  const createFlavor = async () => {
    await supabase.from('humor_flavors').insert({
      slug: 'new-flavor'
    })
    loadFlavors()
  }

  const createStep = async () => {
    if (!selectedFlavor) return

    await supabase.from('humor_flavor_steps').insert({
      humor_flavor_id: selectedFlavor.id,
      order_by: steps.length + 1
    })

    loadSteps(selectedFlavor.id)
  }

  const runPromptChain = async () => {
    if (!selectedFlavor) return

    const res = await fetch('https://api.almostcrackd.ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        humor_flavor_id: selectedFlavor.id,
        image_url: 'TEST_IMAGE_URL'
      })
    })

    const data = await res.json()
    alert(JSON.stringify(data, null, 2))
  }

  return (
    <div className="content">
      <h2>Prompt Chain Tool</h2>

      {/* Theme Toggle */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <button className="btn-secondary" onClick={() => setTheme('light')}>
          ☀️ Light
        </button>
        <button className="btn-secondary" onClick={() => setTheme('dark')}>
          🌙 Dark
        </button>
        <button className="btn-secondary" onClick={() => setTheme('system')}>
          💻 System
        </button>
      </div>

      {/* Flavors */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn-primary" onClick={createFlavor}>
          + Create Flavor
        </button>

        <ul>
          {flavors.map(f => (
            <li
              key={f.id}
              style={{
                cursor: 'pointer',
                fontWeight: selectedFlavor?.id === f.id ? 'bold' : 'normal'
              }}
              onClick={() => {
                setSelectedFlavor(f)
                loadSteps(f.id)
              }}
            >
              {f.slug}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      {selectedFlavor && (
        <div>
          <h3>Steps for: {selectedFlavor.slug}</h3>

          <button className="btn-primary" onClick={createStep}>
            + Add Step
          </button>

          <ul>
            {steps.map((s, i) => (
              <li key={s.id}>
                Step {i + 1} (order: {s.order_by})
              </li>
            ))}
          </ul>

          <button className="btn-primary" onClick={runPromptChain} style={{ marginTop: 20 }}>
            ▶ Run Prompt Chain
          </button>
        </div>
      )}
    </div>
  )
}