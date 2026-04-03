'use client'

import './PromptChainTool.css'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type ColorMode = 'light' | 'dark' | 'system'

interface HumorFlavor {
  id: number
  slug: string
  description?: string
}

interface FlavorStep {
  id: number
  humor_flavor_id: number
  order_by: number
  description?: string
  llm_system_prompt?: string
  llm_user_prompt?: string
}

type ToastType = 'success' | 'error' | 'info'

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_TEMPLATES = [
  {
    label: '1 · Describe image',
    description: 'Describe the image in plain text',
    llm_system_prompt: 'You are a neutral, precise visual analyst. Describe what you see in the image clearly and concisely.',
    llm_user_prompt: 'Describe the image provided in 2–4 sentences.',
  },
  {
    label: '2 · Find the funny',
    description: 'Find something funny about the description',
    llm_system_prompt: 'You are a sharp, witty comedian. Given a description of an image, identify the funniest or most absurd aspect of it.',
    llm_user_prompt: 'Given this image description: {{prev_output}}\n\nWhat is the funniest or most absurd angle? Give one or two sharp observations.',
  },
  {
    label: '3 · Write 5 captions',
    description: 'Output 5 short, funny captions',
    llm_system_prompt: 'You are a world-class meme caption writer. You write short, punchy, internet-ready captions.',
    llm_user_prompt: 'Using this observation: {{prev_output}}\n\nWrite exactly 5 short, funny captions. Each under 15 words. Number them 1–5.',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromptChainTool() {
  const [colorMode, setColorMode] = useState<ColorMode>('system')
  const [flavors, setFlavors] = useState<HumorFlavor[]>([])
  const [steps, setSteps] = useState<FlavorStep[]>([])
  const [selectedFlavor, setSelectedFlavor] = useState<HumorFlavor | null>(null)
  const [loadingFlavors, setLoadingFlavors] = useState(false)
  const [loadingSteps, setLoadingSteps] = useState(false)

  // Flavor modal
  const [flavorModal, setFlavorModal] = useState<{ open: boolean; editing?: HumorFlavor }>({ open: false })
  const [flavorSlug, setFlavorSlug] = useState('')
  const [flavorDesc, setFlavorDesc] = useState('')
  const [savingFlavor, setSavingFlavor] = useState(false)

  // Step modal
  const [stepModal, setStepModal] = useState<{ open: boolean; editing?: FlavorStep }>({ open: false })
  const [stepDesc, setStepDesc] = useState('')
  const [stepSystem, setStepSystem] = useState('')
  const [stepUser, setStepUser] = useState('')
  const [stepOrder, setStepOrder] = useState('1')
  const [savingStep, setSavingStep] = useState(false)

  // Image upload
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Test runner
  const [testRunning, setTestRunning] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [testError, setTestError] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'flavor' | 'step'; id: number; label: string } | null>(null)

  // ── Color mode ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pct-colorMode') as ColorMode | null
      if (saved) setColorMode(saved)
    } catch {}
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => root.setAttribute('data-theme', dark ? 'dark' : 'light')
    if (colorMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      apply(colorMode === 'dark')
    }
    try { localStorage.setItem('pct-colorMode', colorMode) } catch {}
  }, [colorMode])

  // ── Toast ──
  const showToast = (msg: string, type: ToastType = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── Image upload via almostcrackd pipeline ──
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(10)
    setUploadedImageUrl(null)
    setUploadedImageId(null)
    setTestResults([])
    setTestError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      // Step 1 — get presigned S3 URL
      const presignRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type })
      })
      if (!presignRes.ok) throw new Error('Failed to get presigned URL')
      const { presignedUrl, cdnUrl } = await presignRes.json()
      setUploadProgress(35)

      // Step 2 — upload file directly to S3
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!uploadRes.ok) throw new Error('Failed to upload to S3')
      setUploadProgress(65)

      // Step 3 — register image in DB
      const registerRes = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
      })
      if (!registerRes.ok) throw new Error('Failed to register image')
      const { imageId } = await registerRes.json()
      setUploadProgress(100)

      setUploadedImageUrl(cdnUrl)
      setUploadedImageId(imageId)
      showToast('Image uploaded!', 'success')
    } catch (err: any) {
      showToast('Upload failed: ' + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleImageUpload(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    await handleImageUpload(file)
  }

  // ── Data ──
  const loadFlavors = async () => {
    setLoadingFlavors(true)
    const { data, error } = await supabase.from('humor_flavors').select('*').order('slug')
    setLoadingFlavors(false)
    if (error) { showToast('Failed to load flavors', 'error'); return }
    setFlavors(data || [])
  }

  const loadSteps = async (flavorId: number) => {
    setLoadingSteps(true)
    const { data, error } = await supabase
      .from('humor_flavor_steps').select('*')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true })
    setLoadingSteps(false)
    if (error) { showToast('Failed to load steps', 'error'); return }
    setSteps(data || [])
  }

  useEffect(() => { loadFlavors() }, [])

  useEffect(() => {
    if (selectedFlavor?.id) {
      loadSteps(selectedFlavor.id)
      setTestResults([])
      setTestError(null)
    } else {
      setSteps([])
    }
  }, [selectedFlavor])

  // ── Flavor CRUD ──
  const openCreateFlavor = () => {
    setFlavorSlug(''); setFlavorDesc('')
    setFlavorModal({ open: true })
  }
  const openEditFlavor = (f: HumorFlavor) => {
    setFlavorSlug(f.slug); setFlavorDesc(f.description || '')
    setFlavorModal({ open: true, editing: f })
  }
  const saveFlavor = async () => {
    if (!flavorSlug.trim()) { showToast('Slug is required', 'error'); return }
    setSavingFlavor(true)
    const payload = { slug: flavorSlug.trim(), description: flavorDesc.trim() || null }
    const isEdit = !!flavorModal.editing
    const res = isEdit
      ? await supabase.from('humor_flavors').update(payload).eq('id', flavorModal.editing!.id)
      : await supabase.from('humor_flavors').insert(payload)
    setSavingFlavor(false)
    if (res.error) { showToast('Save failed: ' + res.error.message, 'error'); return }
    showToast(isEdit ? 'Flavor updated!' : 'Flavor created!', 'success')
    setFlavorModal({ open: false })
    await loadFlavors()
    if (isEdit && selectedFlavor?.id === flavorModal.editing!.id) {
      setSelectedFlavor(prev => prev ? { ...prev, ...payload } : prev)
    }
  }
  const confirmDeleteFlavor = (f: HumorFlavor) => setDeleteConfirm({ type: 'flavor', id: f.id, label: f.slug })
  const deleteFlavor = async (id: number) => {
    const { error } = await supabase.from('humor_flavors').delete().eq('id', id)
    if (error) { showToast('Delete failed', 'error'); return }
    showToast('Flavor deleted', 'success')
    if (selectedFlavor?.id === id) setSelectedFlavor(null)
    setDeleteConfirm(null)
    await loadFlavors()
  }

  // ── Step CRUD ──
  const openCreateStep = () => {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order_by)) + 1 : 1
    const tmpl = STEP_TEMPLATES[Math.min(steps.length, STEP_TEMPLATES.length - 1)]
    setStepDesc(tmpl?.description || '')
    setStepSystem(tmpl?.llm_system_prompt || '')
    setStepUser(tmpl?.llm_user_prompt || '')
    setStepOrder(String(nextOrder))
    setStepModal({ open: true })
  }
  const openEditStep = (s: FlavorStep) => {
    setStepDesc(s.description || '')
    setStepSystem(s.llm_system_prompt || '')
    setStepUser(s.llm_user_prompt || '')
    setStepOrder(String(s.order_by))
    setStepModal({ open: true, editing: s })
  }
  const applyTemplate = (t: typeof STEP_TEMPLATES[0]) => {
    setStepDesc(t.description)
    setStepSystem(t.llm_system_prompt)
    setStepUser(t.llm_user_prompt)
  }
  const saveStep = async () => {
    if (!selectedFlavor) return
    if (!stepSystem.trim() && !stepUser.trim()) { showToast('Add at least one prompt', 'error'); return }
    setSavingStep(true)
    const payload: any = {
      humor_flavor_id: selectedFlavor.id,
      order_by: parseInt(stepOrder) || 1,
      description: stepDesc.trim() || null,
      llm_system_prompt: stepSystem.trim() || null,
      llm_user_prompt: stepUser.trim() || null,
    }
    const isEdit = !!stepModal.editing
    const res = isEdit
      ? await supabase.from('humor_flavor_steps').update(payload).eq('id', stepModal.editing!.id)
      : await supabase.from('humor_flavor_steps').insert(payload)
    setSavingStep(false)
    if (res.error) { showToast('Save failed: ' + res.error.message, 'error'); return }
    showToast(isEdit ? 'Step updated!' : 'Step added!', 'success')
    setStepModal({ open: false })
    await loadSteps(selectedFlavor.id)
  }
  const confirmDeleteStep = (s: FlavorStep, i: number) => setDeleteConfirm({ type: 'step', id: s.id, label: s.description || `Step ${i + 1}` })
  const deleteStep = async (id: number) => {
    if (!selectedFlavor) return
    const { error } = await supabase.from('humor_flavor_steps').delete().eq('id', id)
    if (error) { showToast('Delete failed', 'error'); return }
    showToast('Step deleted', 'success')
    setDeleteConfirm(null)
    await loadSteps(selectedFlavor.id)
  }
  const moveStep = async (s: FlavorStep, dir: 'up' | 'down') => {
    if (!selectedFlavor) return
    const sorted = [...steps].sort((a, b) => a.order_by - b.order_by)
    const idx = sorted.findIndex(x => x.id === s.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const other = sorted[swapIdx]
    await Promise.all([
      supabase.from('humor_flavor_steps').update({ order_by: other.order_by }).eq('id', s.id),
      supabase.from('humor_flavor_steps').update({ order_by: s.order_by }).eq('id', other.id),
    ])
    await loadSteps(selectedFlavor.id)
  }

  // ── Run chain ──
  const runChain = async () => {
    if (!selectedFlavor) return
    if (!uploadedImageId) { showToast('Upload an image first', 'error'); return }
    if (steps.length === 0) { showToast('Add steps first', 'error'); return }
    setTestRunning(true); setTestResults([]); setTestError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: uploadedImageId, humorFlavorId: selectedFlavor.id })
      })
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
      const json = await res.json()

      const captions: string[] = Array.isArray(json)
        ? json.map((c: any) => c.caption || c.content || c.text || String(c))
        : Array.isArray(json.captions)
          ? json.captions.map((c: any) => typeof c === 'string' ? c : c.caption || c.content || c.text || String(c))
          : Array.isArray(json.results)
            ? json.results.map((c: any) => typeof c === 'string' ? c : c.caption || c.content || String(c))
            : [JSON.stringify(json, null, 2)]

      setTestResults(captions)
      showToast(`${captions.length} caption${captions.length !== 1 ? 's' : ''} generated!`, 'success')
    } catch (err: any) {
      setTestError(err.message)
      showToast('Generation failed', 'error')
    } finally {
      setTestRunning(false)
    }
  }

  const sortedSteps = [...steps].sort((a, b) => a.order_by - b.order_by)

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`pct-toast pct-toast-${toast.type}`} onClick={() => setToast(null)}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="pct-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="pct-dialog" onClick={e => e.stopPropagation()}>
            <div className="pct-dialog-icon">🗑️</div>
            <h3 className="pct-dialog-title">Delete {deleteConfirm.type === 'flavor' ? 'Flavor' : 'Step'}?</h3>
            <p className="pct-dialog-body">
              <strong>{deleteConfirm.label}</strong> will be permanently removed.
            </p>
            <div className="pct-dialog-actions">
              <button className="pct-btn pct-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="pct-btn pct-danger" onClick={() => {
                if (deleteConfirm.type === 'flavor') deleteFlavor(deleteConfirm.id)
                else deleteStep(deleteConfirm.id)
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Flavor Modal */}
      {flavorModal.open && (
        <div className="pct-overlay" onClick={() => setFlavorModal({ open: false })}>
          <div className="pct-dialog pct-dialog-md" onClick={e => e.stopPropagation()}>
            <h3 className="pct-dialog-title">{flavorModal.editing ? 'Edit Flavor' : 'New Humor Flavor'}</h3>
            <div className="pct-field">
              <label className="pct-label">Slug *</label>
              <input className="pct-input" placeholder="e.g. dry-wit, dad-jokes" value={flavorSlug}
                onChange={e => setFlavorSlug(e.target.value)} autoFocus />
              <span className="pct-hint">Lowercase, hyphenated identifier</span>
            </div>
            <div className="pct-field">
              <label className="pct-label">Description</label>
              <textarea className="pct-input pct-ta" rows={3} placeholder="What makes this flavor unique…"
                value={flavorDesc} onChange={e => setFlavorDesc(e.target.value)} />
            </div>
            <div className="pct-dialog-actions">
              <button className="pct-btn pct-ghost" onClick={() => setFlavorModal({ open: false })}>Cancel</button>
              <button className="pct-btn pct-primary" onClick={saveFlavor} disabled={savingFlavor}>
                {savingFlavor ? 'Saving…' : flavorModal.editing ? 'Save Changes' : 'Create Flavor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {stepModal.open && (
        <div className="pct-overlay" onClick={() => setStepModal({ open: false })}>
          <div className="pct-dialog pct-dialog-lg" onClick={e => e.stopPropagation()}>
            <h3 className="pct-dialog-title">{stepModal.editing ? 'Edit Step' : 'Add Step'}</h3>

            {!stepModal.editing && (
              <div className="pct-field">
                <label className="pct-label">Quick Templates</label>
                <div className="pct-templates">
                  {STEP_TEMPLATES.map(t => (
                    <button key={t.label} className="pct-tpl-btn" onClick={() => applyTemplate(t)}>{t.label}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="pct-row">
              <div className="pct-field" style={{ width: 80 }}>
                <label className="pct-label">Order</label>
                <input className="pct-input" type="number" min={1} value={stepOrder}
                  onChange={e => setStepOrder(e.target.value)} />
              </div>
              <div className="pct-field" style={{ flex: 1 }}>
                <label className="pct-label">Description</label>
                <input className="pct-input" placeholder="What does this step do?"
                  value={stepDesc} onChange={e => setStepDesc(e.target.value)} />
              </div>
            </div>

            <div className="pct-field">
              <label className="pct-label">System Prompt</label>
              <textarea className="pct-input pct-ta pct-ta-md" rows={4}
                placeholder="You are a… (sets AI role/behavior)"
                value={stepSystem} onChange={e => setStepSystem(e.target.value)} />
            </div>

            <div className="pct-field">
              <label className="pct-label">User Prompt</label>
              <textarea className="pct-input pct-ta pct-ta-md" rows={4}
                placeholder="Use {{prev_output}} to chain from the previous step"
                value={stepUser} onChange={e => setStepUser(e.target.value)} />
              <span className="pct-hint">Use <code className="pct-code">{`{{prev_output}}`}</code> to pass the previous step's result</span>
            </div>

            <div className="pct-dialog-actions">
              <button className="pct-btn pct-ghost" onClick={() => setStepModal({ open: false })}>Cancel</button>
              <button className="pct-btn pct-primary" onClick={saveStep} disabled={savingStep}>
                {savingStep ? 'Saving…' : stepModal.editing ? 'Save Changes' : 'Add Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="pct-root">
        <header className="pct-header">
          <div className="pct-header-left">
            <div>
              <div className="pct-title">Prompt Chain Tool</div>

            </div>
          </div>

        </header>

        <div className="pct-body">
          {/* Sidebar */}
          <aside className="pct-sidebar">
            <div className="pct-panel">
              <div className="pct-panel-hd">
                <span className="pct-panel-title">Flavors</span>
                <button className="pct-btn pct-primary pct-sm" onClick={openCreateFlavor}>+ New</button>
              </div>
              {loadingFlavors ? (
                <div className="pct-sk-list">
                  {[1,2,3].map(i => <div key={i} className="pct-sk pct-sk-row" />)}
                </div>
              ) : flavors.length === 0 ? (
                <div className="pct-empty">
                  <div className="pct-empty-icon">🧂</div>
                  <div className="pct-empty-title">No flavors yet</div>
                  <div className="pct-empty-desc">Create your first humor flavor</div>
                  <button className="pct-btn pct-primary pct-sm" onClick={openCreateFlavor}>Create</button>
                </div>
              ) : (
                <ul className="pct-flavor-list">
                  {flavors.map(f => (
                    <li key={f.id}
                      className={`pct-flavor-item${selectedFlavor?.id === f.id ? ' active' : ''}`}
                      onClick={() => setSelectedFlavor(f)}>
                      <div className="pct-flavor-main">
                        <span className="pct-flavor-slug">{f.slug}</span>
                        {f.description && <span className="pct-flavor-desc">{f.description}</span>}
                      </div>
                      <div className="pct-flavor-btns" onClick={e => e.stopPropagation()}>
                        <button className="pct-ibtn" onClick={() => openEditFlavor(f)} title="Edit">✏️</button>
                        <button className="pct-ibtn pct-ibtn-del" onClick={() => confirmDeleteFlavor(f)} title="Delete">🗑️</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Main */}
          <main className="pct-main">
            {!selectedFlavor ? (
              <div className="pct-panel pct-panel-center">
                <div className="pct-empty">

                  <div className="pct-empty-title">Select a flavor</div>
                  <div className="pct-empty-desc">Choose a humor flavor to view and edit its steps</div>
                  <button className="pct-btn pct-primary" onClick={openCreateFlavor}>+ Create New Flavor</button>
                </div>
              </div>
            ) : (
              <div className="pct-stack">
                {/* Steps */}
                <div className="pct-panel">
                  <div className="pct-panel-hd">
                    <span className="pct-panel-title">Steps <span className="pct-panel-sub">— {selectedFlavor.slug}</span></span>
                    <button className="pct-btn pct-primary pct-sm" onClick={openCreateStep}>+ Add Step</button>
                  </div>
                  {loadingSteps ? (
                    <div className="pct-sk-list">
                      {[1,2,3].map(i => <div key={i} className="pct-sk pct-sk-step" />)}
                    </div>
                  ) : sortedSteps.length === 0 ? (
                    <div className="pct-empty" style={{ padding: '40px 20px' }}>
                      <div className="pct-empty-icon">📋</div>
                      <div className="pct-empty-title">No steps yet</div>
                      <div className="pct-empty-desc">Add steps to define how captions are generated</div>
                      <button className="pct-btn pct-primary pct-sm" onClick={openCreateStep}>+ Add First Step</button>
                    </div>
                  ) : (
                    <div className="pct-steps">
                      {sortedSteps.map((s, i) => (
                        <div key={s.id} className="pct-step-wrap">
                          <div className="pct-step">
                            <div className="pct-step-num">{i + 1}</div>
                            <div className="pct-step-body">
                              <div className="pct-step-desc">
                                {s.description || <em className="pct-faint">Untitled step</em>}
                              </div>
                              {s.llm_system_prompt && (
                                <div className="pct-prompt-row">
                                  <span className="pct-prompt-tag">System</span>
                                  <span className="pct-prompt-text">{s.llm_system_prompt}</span>
                                </div>
                              )}
                              {s.llm_user_prompt && (
                                <div className="pct-prompt-row">
                                  <span className="pct-prompt-tag pct-prompt-tag-user">User</span>
                                  <span className="pct-prompt-text">{s.llm_user_prompt}</span>
                                </div>
                              )}
                            </div>
                            <div className="pct-step-actions">
                              <button className="pct-ibtn" disabled={i === 0} onClick={() => moveStep(s, 'up')} title="Move up">↑</button>
                              <button className="pct-ibtn" disabled={i === sortedSteps.length - 1} onClick={() => moveStep(s, 'down')} title="Move down">↓</button>
                              <button className="pct-ibtn" onClick={() => openEditStep(s)} title="Edit">✏️</button>
                              <button className="pct-ibtn pct-ibtn-del" onClick={() => confirmDeleteStep(s, i)} title="Delete">🗑️</button>
                            </div>
                          </div>
                          {i < sortedSteps.length - 1 && (
                            <div className="pct-connector">
                              <div className="pct-connector-line" />
                              <div className="pct-connector-arrow">▼</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Test Runner */}
                <div className="pct-panel">
                  <div className="pct-panel-hd">
                    <span className="pct-panel-title">🧪 Test This Flavor</span>
                    {testRunning && <span className="pct-spinner" />}
                  </div>
                  <div className="pct-test-grid">

                    {/* Left — upload */}
                    <div className="pct-test-left">
                      <div className="pct-field">
                        <label className="pct-label">Test Image</label>

                        {/* Drop zone */}
                        <div
                          className={`pct-dropzone${uploading ? ' uploading' : ''}`}
                          onClick={() => !uploading && fileInputRef.current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={handleDrop}
                        >
                          {uploading ? (
                            <div className="pct-dropzone-inner">
                              <span className="pct-spinner" />
                              <span>Uploading…</span>
                            </div>
                          ) : uploadedImageUrl ? (
                            <div className="pct-dropzone-preview">
                              <img src={uploadedImageUrl} alt="Uploaded" className="pct-dropzone-img" />
                              <div className="pct-dropzone-overlay">
                                <span>Click or drop to replace</span>
                              </div>
                            </div>
                          ) : (
                            <div className="pct-dropzone-inner">
                              <div className="pct-dropzone-icon">🖼️</div>
                              <div className="pct-dropzone-text">Click to upload or drag & drop</div>
                              <div className="pct-dropzone-hint">PNG, JPG, GIF, WEBP</div>
                            </div>
                          )}
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />

                        {uploadedImageUrl && (
                          <button
                            className="pct-btn pct-ghost pct-sm"
                            style={{ alignSelf: 'flex-start', marginTop: 4 }}
                            onClick={() => { setUploadedImageUrl(null); setTestResults([]); setTestError(null) }}
                          >
                            ✕ Remove image
                          </button>
                        )}
                      </div>

                      <button
                        className="pct-btn pct-primary pct-run-btn"
                        onClick={runChain}
                        disabled={testRunning || sortedSteps.length === 0 || !uploadedImageId}
                      >
                        {testRunning
                          ? <><span className="pct-spinner-sm" /> Generating…</>
                          : `▶ Run ${sortedSteps.length} step${sortedSteps.length !== 1 ? 's' : ''}`}
                      </button>

                      {sortedSteps.length === 0 && (
                        <p className="pct-hint pct-hint-warn">Add steps above first.</p>
                      )}
                      {sortedSteps.length > 0 && !uploadedImageId && (
                        <p className="pct-hint pct-hint-warn">Upload an image to run.</p>
                      )}
                    </div>

                    {/* Right — results */}
                    <div className="pct-test-right">
                      <label className="pct-label" style={{ marginBottom: 8 }}>Generated Captions</label>
                      {testError && (
                        <div className="pct-error-box"><strong>Error:</strong> {testError}</div>
                      )}
                      {!testError && !testRunning && testResults.length === 0 && (
                        <div className="pct-captions-empty">
                          <div style={{ fontSize: 28 }}>💬</div>
                          <div>Captions will appear here after running.</div>
                        </div>
                      )}
                      {testRunning && testResults.length === 0 && (
                        <div className="pct-sk-list">
                          {[1,2,3,4,5].map(i => <div key={i} className="pct-sk pct-sk-caption" />)}
                        </div>
                      )}
                      {testResults.length > 0 && (
                        <ol className="pct-captions">
                          {testResults.map((cap, i) => (
                            <li key={i} className="pct-caption">
                              <span className="pct-cap-num">{i + 1}</span>
                              <span className="pct-cap-text">{cap}</span>
                              <button className="pct-ibtn" title="Copy"
                                onClick={() => { navigator.clipboard.writeText(cap); showToast('Copied!', 'success') }}>
                                📋
                              </button>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}