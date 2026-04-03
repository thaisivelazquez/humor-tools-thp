'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import PromptChainTool from './components/PromptChainTool'
import './styling.css'

type NavGroup = 'dashboard' | 'images' | 'captions' | 'humor' | 'llm'
type Tab =
  | 'prompt_chain_tool'
  | 'images'
  | 'captions' | 'caption_examples' | 'caption_requests'
  | 'humor_flavors' | 'humor_flavor_steps' | 'humor_flavor_mix'
  | 'llm_models' | 'llm_providers' | 'llm_responses' | 'llm_prompt_chains'

const ITEMS_PER_PAGE = 10

const NAV_GROUPS: { group: NavGroup; label: string; tabs?: { tab: Tab; label: string }[] }[] = [
  {
    group: 'dashboard',
    label: 'Prompt Tool',
    tabs: [
      { tab: 'prompt_chain_tool', label: 'Prompt Chain Tool' },
    ],
  },
  { group: 'images', label: 'Images' },
  {
    group: 'captions', label: 'Captions',
    tabs: [
      { tab: 'captions', label: 'Captions' },
      { tab: 'caption_examples', label: 'Caption Examples' },
      { tab: 'caption_requests', label: 'Caption Requests' },
    ],
  },
  {
    group: 'humor', label: 'Humor',
    tabs: [
      { tab: 'humor_flavors', label: 'Humor Flavors' },
      { tab: 'humor_flavor_steps', label: 'Flavor Steps' },
      { tab: 'humor_flavor_mix', label: 'Flavor Mix' },
    ],
  },
  {
    group: 'llm', label: 'LLM Info',
    tabs: [
      { tab: 'llm_models', label: 'LLM Models' },
      { tab: 'llm_providers', label: 'LLM Providers' },
      { tab: 'llm_responses', label: 'LLM Responses' },
      { tab: 'llm_prompt_chains', label: 'Prompt Chains' },
    ],
  },
]

function usePage() {
  const [page, setPage] = useState(1)
  return { page, setPage }
}

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('adminActiveTab') as Tab) ?? 'prompt_chain_tool'
    }
    return 'dashboard'
  })
  const [openGroup, setOpenGroup] = useState<NavGroup | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
 const [steps, setSteps] = useState<any[]>([])
 const [flavors, setFlavors] = useState<any[]>([])

 const [selectedFlavor, setSelectedFlavor] = useState<any>(null)


 // Load all flavors on mount
 useEffect(() => {
   loadFlavors()
 }, [])

 // Load steps whenever a flavor is selected
 useEffect(() => {
   if (selectedFlavor?.id) {
     loadSteps(selectedFlavor.id)
   } else {
     setSteps([])
   }
 }, [selectedFlavor])

 const loadFlavors = async () => {
   const { data, error } = await supabase
     .from('humor_flavors')
     .select('*')
     .order('slug', { ascending: true })

   if (!error && data) {
     setFlavors(data)
   }
 }

 const loadSteps = async (flavorId: number) => {
   const { data, error } = await supabase
     .from('humor_flavor_steps')
     .select('*')
     .eq('humor_flavor_id', flavorId)
     .order('order_by', { ascending: true })

   if (!error && data) {
     setSteps(data)
   }
 }



// Load all flavors on mount




  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState<{ title: string; content: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [sortAsc, setSortAsc] = useState(false)
  const [allowedDomains, setAllowedDomains] = useState<any[]>([])
  const domainP = usePage()


  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const changeTab = (tab: Tab) => {
    localStorage.setItem('adminActiveTab', tab)
    setActiveTab(tab)
  }

  const [profiles, setProfiles] = useState<any[]>([])
  const [images, setImages] = useState<any[]>([])
  const [captions, setCaptions] = useState<any[]>([])
  const [captionExamples, setCaptionExamples] = useState<any[]>([])
  const [captionRequests, setCaptionRequests] = useState<any[]>([])
  const [humorFlavors, setHumorFlavors] = useState<any[]>([])
  const [humorFlavorSteps, setHumorFlavorSteps] = useState<any[]>([])
  const [humorFlavorMix, setHumorFlavorMix] = useState<any[]>([])
  const [llmModels, setLlmModels] = useState<any[]>([])
  const [llmProviders, setLlmProviders] = useState<any[]>([])
  const [llmResponses, setLlmResponses] = useState<any[]>([])
  const [llmPromptChains, setLlmPromptChains] = useState<any[]>([])
  const [whitelistedEmails, setWhitelistedEmails] = useState<any[]>([])
  const [topCaption, setTopCaption] = useState<any>(null)
  const [avgLikes, setAvgLikes] = useState<number | null>(null)
  const [topFlavor, setTopFlavor] = useState<any>(null)

  const profileP = usePage()
  const imageP = usePage()
  const captionP = usePage()
  const captionExP = usePage()
  const captionReqP = usePage()
  const humorFlavorP = usePage()
  const humorFlavorStepP = usePage()
  const humorFlavorMixP = usePage()
  const llmModelP = usePage()
  const llmProviderP = usePage()
  const llmRespP = usePage()
  const llmChainP = usePage()
  const emailP = usePage()

  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null)
  const [formData, setFormData] = useState<any>({})

  const openModal = (type: string, data?: any) => { setFormData(data ?? {}); setModal({ type, data }) }
  const closeModal = () => { setModal(null); setFormData({}) }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchTable = async (table: string, setter: (d: any[]) => void, page: number, select = '*', orderCol = 'created_datetime_utc') => {
    const from = (page - 1) * ITEMS_PER_PAGE
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order(orderCol, { ascending: sortAsc })
      .range(from, from + ITEMS_PER_PAGE - 1)
    if (!error && data) setter(data)
  }

  const fetchHumorFlavorMix = async (page: number) => {
    const from = (page - 1) * ITEMS_PER_PAGE
    const { data, error } = await supabase
      .from('humor_flavor_mix')
      .select('*, humor_flavors(slug, description)')
      .order('created_datetime_utc', { ascending: sortAsc })
      .range(from, from + ITEMS_PER_PAGE - 1)
    if (!error && data) setHumorFlavorMix(data)
  }

  const fetchCaptionRequests = async (page: number) => {
    const from = (page - 1) * ITEMS_PER_PAGE
    const { data, error } = await supabase
      .from('caption_requests')
      .select('*')
      .order('created_datetime_utc', { ascending: sortAsc })
      .range(from, from + ITEMS_PER_PAGE - 1)
    if (error || !data) return
    const enriched = await Promise.all(
      data.map(async (req) => {
        if (!req.image_id) return { ...req, image: null }
        const { data: imgData } = await supabase
          .from('images')
          .select('url, image_description')
          .eq('id', req.image_id)
          .single()
        return { ...req, image: imgData ?? null }
      })
    )
    setCaptionRequests(enriched)
  }

  const fetchDashboardStats = async () => {
    const { data: topData } = await supabase
      .from('captions').select('*, images(url, image_description)')
      .order('like_count', { ascending: false }).limit(1).single()
    if (topData) setTopCaption(topData)

    const { data: avgData } = await supabase.from('captions').select('like_count')
    if (avgData?.length) {
      const total = avgData.reduce((s: number, c: any) => s + (c.like_count ?? 0), 0)
      setAvgLikes(Math.round(total / avgData.length))
    }

    const { data: topFlavorData } = await supabase
      .from('humor_flavor_mix')
      .select('caption_count, humor_flavors(slug, description)')
      .order('caption_count', { ascending: false })
      .limit(1)
      .single()
    if (topFlavorData) setTopFlavor(topFlavorData)
  }

  const fetchAll = async () => {
    await Promise.all([
      fetchTable('profiles', setProfiles, profileP.page),
      fetchTable('images', setImages, imageP.page),
      fetchTable('captions', setCaptions, captionP.page, '*, images(url, image_description)'),
      fetchTable('caption_examples', setCaptionExamples, captionExP.page),
      fetchCaptionRequests(captionReqP.page),
      fetchTable('humor_flavors', setHumorFlavors, humorFlavorP.page),
      fetchTable('humor_flavor_steps', setHumorFlavorSteps, humorFlavorStepP.page),
      fetchHumorFlavorMix(humorFlavorMixP.page),
      fetchTable('llm_models', setLlmModels, llmModelP.page),
      fetchTable('llm_providers', setLlmProviders, llmProviderP.page),
      fetchTable('llm_model_responses', setLlmResponses, llmRespP.page),
      fetchTable('llm_prompt_chains', setLlmPromptChains, llmChainP.page),
      fetchTable('whitelist_email_addresses', setWhitelistedEmails, emailP.page),
      fetchTable('allowed_signup_domains', setAllowedDomains, domainP.page),
    ])
  }

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const { data, error } = await supabase.from('profiles').select('is_superadmin').eq('id', u.id).single()
        if (!error) {
          const admin = data?.is_superadmin ?? false
          setIsAdmin(admin)
          if (admin) { await fetchAll(); await fetchDashboardStats() }
        } else { setIsAdmin(false) }
      }
    }
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    fetchAll()
  }, [
       profileP.page, imageP.page, captionP.page, captionExP.page, captionReqP.page,
       humorFlavorP.page, humorFlavorStepP.page, humorFlavorMixP.page,
       llmModelP.page, llmProviderP.page, llmRespP.page, llmChainP.page, emailP.page,
       domainP.page,
       sortAsc,
  ])

  const handleDelete = async (table: string, id: any, label: string, refresh: () => void) => {
    if (!confirm(`Are you sure you want to delete this ${label}?`)) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      showToast(`❌ Delete failed: ${error.message}`, 'error')
    } else {
      showToast(`✅ ${label} deleted successfully`, 'success')
      refresh()
    }
  }

  const handleSave = async (table: string, fields: string[], refresh: () => void) => {
    const payload: any = {}
    fields.forEach(f => { if (formData[f] !== undefined && formData[f] !== '') payload[f] = formData[f] })
    let error: any = null
    const isEdit = !!modal?.data?.id
    if (isEdit) {
      const res = await supabase.from(table).update(payload).eq('id', modal.data.id)
      error = res.error
    } else {
      const res = await supabase.from(table).insert(payload)
      error = res.error
    }
    if (error) {
      showToast(`❌ Save failed: ${error.message}`, 'error')
    } else {
      showToast(isEdit ? `✅ Updated successfully` : `✅ Added successfully`, 'success')
      closeModal()
      refresh()
    }
  }

  const handleImageUpload = async (file: File) => {
    const ext = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(fileName, file)
    if (error) { showToast(`❌ Upload failed: ${error.message}`, 'error'); return }
    showToast('✅ Image uploaded!', 'success')
    return supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl
  }

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null); setIsAdmin(null)
    setProfiles([]); setImages([]); setCaptions([])
    setCaptionExamples([]); setCaptionRequests([])
    setHumorFlavors([]); setHumorFlavorSteps([]); setHumorFlavorMix([])
    setLlmModels([]); setLlmProviders([]); setLlmResponses([])
    setLlmPromptChains([])
    setAllowedDomains([])
    setWhitelistedEmails([]); setTopCaption(null); setAvgLikes(null); setTopFlavor(null)
  }

  const SortToggle = () => (
    <button
      className="btn-secondary"
      style={{ fontSize: '12px', padding: '5px 12px' }}
      onClick={() => setSortAsc(p => !p)}
    >
      {sortAsc ? '⬆ Oldest First' : '⬇ Latest First'}
    </button>
  )

  const Pagination = ({ pager, data }: { pager: ReturnType<typeof usePage>; data: any[] }) => (
    <div className="pagination">
      <button className="page-btn" disabled={pager.page === 1} onClick={() => pager.setPage(p => Math.max(p - 1, 1))}>&#8592;</button>
      <span className="page-label">Page {pager.page}</span>
      <button className="page-btn" disabled={data.length < ITEMS_PER_PAGE} onClick={() => pager.setPage(p => p + 1)}>&#8594;</button>
    </div>
  )

  const FormModal = ({ title, fields, table, refresh }: {
    title: string
    fields: { key: string; label: string; type?: string }[]
    table: string
    refresh: () => void
  }) => (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        {fields.map(f => (
          <div className="modal-field" key={f.key}>
            <label className="modal-label">{f.label}</label>
            <input className="modal-input" type={f.type ?? 'text'}
              value={formData[f.key] ?? ''}
              onChange={e => setFormData((prev: any) => ({ ...prev, [f.key]: e.target.value }))} />
          </div>
        ))}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" onClick={() => handleSave(table, fields.map(f => f.key), refresh)}>Save</button>
        </div>
      </div>
    </div>
  )

  const TextCell = ({ value, title }: { value: string | null | undefined; title: string }) => (
    <td className="td-truncate td-clickable" onClick={() => value && setPreviewText({ title, content: value })} title={value ?? ''}>
      {value ?? '—'}
    </td>
  )

  const ImgCell = ({ url }: { url: string | null | undefined }) => (
    <td className="td">
      {url ? <img src={url} alt="" width={80} className="table-img img-clickable" onClick={() => setPreviewImg(url)} /> : '—'}
    </td>
  )

  const activeGroup: NavGroup =
    ['profiles', 'whitelisted_emails', 'allowed_signup_domains'].includes(activeTab) ? 'profiles' :
    ['captions', 'caption_examples', 'caption_requests'].includes(activeTab) ? 'captions' :
    ['humor_flavors', 'humor_flavor_steps', 'humor_flavor_mix'].includes(activeTab) ? 'humor' :
    ['llm_models', 'llm_providers', 'llm_responses', 'llm_prompt_chains'].includes(activeTab) ? 'llm' :
    activeTab as NavGroup

  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-logo-wrapper">
            <div className="login-logo-tile">HA</div>
            <div>
              <div className="login-brand-label">Humor Project</div>
              <h1 className="login-title">Login to Admin Dashboard<br /><span className="login-title-accent">for the Humor Project</span></h1>
            </div>
          </div>
          <div className="login-divider" />
          <p className="login-description">Sign in with your Google account to access the admin panel. Only authorized administrators can proceed.</p>
          <button onClick={loginWithGoogle} className="login-google-btn">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7.2l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.6 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Sign in with Google
          </button>
          <p className="login-footer-note">Access is restricted to verified admins only.</p>
        </div>
      </div>
    )
  }

  if (isAdmin === null) return <p className="loading">Loading...</p>

  if (isAdmin === false) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-logo-wrapper">
            <div className="login-logo-tile">HA</div>
            <div>
              <div className="login-brand-label">Humor Project</div>
              <h1 className="login-title">Access Denied</h1>
            </div>
          </div>
          <div className="login-divider" />
          <p className="login-description">Your account <strong>{user.email}</strong> does not have admin access.</p>
          <button onClick={logout} className="login-google-btn">Sign Out</button>
          <p className="login-footer-note">Access is restricted to verified admins only.</p>
        </div>
      </div>
    )
  }

  const initials = user.email?.slice(0, 1).toUpperCase()

  return (
    <div className="wrapper">

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {previewImg && (
        <div className="modal-overlay" onClick={() => setPreviewImg(null)}>
          <div className="img-preview-modal" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={() => setPreviewImg(null)}>✕</button>
            <img src={previewImg} alt="" className="img-preview-full" />
            <div className="preview-img-actions">
              <a href={previewImg} target="_blank" rel="noopener noreferrer" className="preview-open-link">Open in new tab ↗</a>
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={() => { navigator.clipboard.writeText(previewImg); showToast('Image URL copied!', 'success') }}>
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      {previewText && (
        <div className="modal-overlay" onClick={() => setPreviewText(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">{previewText.title}</h3>
              <button className="preview-close" style={{ position: 'static' }} onClick={() => setPreviewText(null)}>✕</button>
            </div>
            <div className="preview-text-body">{previewText.content}</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(previewText.content); showToast('Copied to clipboard!', 'success') }}>Copy</button>
              <button className="btn-primary" onClick={() => setPreviewText(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <nav className="nav" ref={navRef}>
        <div className="nav-left">
          <div className="nav-logo">HA</div>
          <div>
            <div className="nav-brand-label">Humor Project</div>
            <div className="nav-brand-name">Admin</div>
          </div>
        </div>
        <div className="nav-tabs">
          {NAV_GROUPS.map(({ group, label, tabs }) =>
            !tabs ? (
              <button key={group} className={`nav-tab-btn${activeGroup === group ? ' active' : ''}`}
                onClick={() => { changeTab(group as Tab); setOpenGroup(null) }}>
                {label}
              </button>
            ) : (
              <div key={group} className="nav-tab-group">
                <button className={`nav-tab-btn${activeGroup === group ? ' active' : ''}`}
                  onClick={() => setOpenGroup(prev => prev === group ? null : group)}>
                  {label} {openGroup === group ? '▴' : '▾'}
                </button>
                {openGroup === group && (
                  <div className="dropdown">
                    {tabs.map(({ tab, label: tabLabel }) => (
                      <button key={tab} className={`dropdown-item${activeTab === tab ? ' active' : ''}`}
                        onClick={() => { changeTab(tab); setOpenGroup(null) }}>
                        {tabLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div className="nav-right">
          <div className="nav-avatar">{initials}</div>
          <div className="nav-user-info">
            <div className="nav-user-name">{user.user_metadata?.full_name ?? 'User'}</div>
            <div className="nav-user-email">{user.email}</div>
          </div>
          <button className="sign-out-btn" onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="content">

        {activeTab === 'prompt_chain_tool' && (
            <PromptChainTool />
          )}



        {activeTab === 'profiles' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Profiles</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'First Name', 'Last Name', 'Email', 'Superadmin', 'In Study', 'Matrix Admin', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id}>
                      <TextCell value={p.id} title="Profile ID" />
                      <td className="td">{p.first_name ?? '—'}</td>
                      <td className="td">{p.last_name ?? '—'}</td>
                      <td className="td">{p.email ?? '—'}</td>
                      <td className="td">{p.is_superadmin ? 'Yes' : 'No'}</td>
                      <td className="td">{p.is_in_study ? 'Yes' : 'No'}</td>
                      <td className="td">{p.is_matrix_admin ? 'Yes' : 'No'}</td>
                      <td className="td">{p.created_datetime_utc ? new Date(p.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{p.modified_datetime_utc ? new Date(p.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={profileP} data={profiles} />
          </div>
        )}

        {activeTab === 'whitelisted_emails' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Whitelisted Emails</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('whitelisted_emails')}>+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Email', 'Created By', 'Modified By', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {whitelistedEmails.map(e => (
                    <tr key={e.id}>
                      <td className="td">{e.id}</td>
                      <TextCell value={e.email_address} title="Email Address" />
                      <TextCell value={e.created_by_user_id} title="Created By User ID" />
                      <TextCell value={e.modified_by_user_id} title="Modified By User ID" />
                      <td className="td">{e.created_datetime_utc ? new Date(e.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{e.modified_datetime_utc ? new Date(e.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('whitelisted_emails', e)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('whitelist_email_addresses', e.id, 'email', () => fetchTable('whitelist_email_addresses', setWhitelistedEmails, emailP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={emailP} data={whitelistedEmails} />
          </div>
        )}

        {activeTab === 'allowed_signup_domains' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Allowed Signup Domains</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('allowed_signup_domains')}>+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>{['ID', 'Domain', 'Created By', 'Modified By', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {allowedDomains.map(d => (
                    <tr key={d.id}>
                      <td className="td">{d.id}</td>
                      <td className="td">{d.apex_domain ?? '—'}</td>
                      <TextCell value={d.created_by_user_id} title="Created By User ID" />
                      <TextCell value={d.modified_by_user_id} title="Modified By User ID" />
                      <td className="td">{d.created_datetime_utc ? new Date(d.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{d.modified_datetime_utc ? new Date(d.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('allowed_signup_domains', d)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('allowed_signup_domains', d.id, 'domain', () => fetchTable('allowed_signup_domains', setAllowedDomains, domainP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={domainP} data={allowedDomains} />
          </div>
        )}


        {activeTab === 'images' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Images</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('image_new')}>+ Add Image</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['Preview', 'ID', 'URL', 'Public', 'Description', 'Additional Context', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {images.map(img => (
                    <tr key={img.id}>
                      <ImgCell url={img.url} />
                      <TextCell value={img.id} title="Image ID" />
                      <TextCell value={img.url} title="Image URL" />
                      <td className="td">{img.is_public ? 'Yes' : 'No'}</td>
                      <TextCell value={img.image_description} title="Image Description" />
                      <TextCell value={img.additional_context} title="Additional Context" />
                      <td className="td">{img.created_datetime_utc ? new Date(img.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{img.modified_datetime_utc ? new Date(img.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('image_edit', img)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('images', img.id, 'image', () => fetchTable('images', setImages, imageP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={imageP} data={images} />
          </div>
        )}

        {activeTab === 'captions' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Captions</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Image', 'Caption', 'Public', 'Featured', 'Likes', 'Profile ID', 'Caption Request ID', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {captions.map(c => (
                    <tr key={c.id}>
                      <TextCell value={c.id} title="Caption ID" />
                      <ImgCell url={c.images?.url} />
                      <TextCell value={c.content} title="Caption" />
                      <td className="td"><span className={c.is_public ? 'visibility-public' : 'visibility-private'}>{c.is_public ? 'Public' : 'Private'}</span></td>
                      <td className="td">{c.is_featured ? 'Yes' : 'No'}</td>
                      <td className="td">{c.like_count ?? 0}</td>
                      <TextCell value={c.profile_id} title="Profile ID" />
                      <td className="td">{c.caption_request_id ?? '—'}</td>
                      <td className="td">{c.created_datetime_utc ? new Date(c.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{c.modified_datetime_utc ? new Date(c.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={captionP} data={captions} />
          </div>
        )}

        {activeTab === 'caption_examples' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Caption Examples</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('caption_examples')}>+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Caption', 'Explanation', 'Priority', 'Image Desc', 'Created By', 'Modified By', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {captionExamples.map(ex => (
                    <tr key={ex.id}>
                      <td className="td">{ex.id}</td>
                      <TextCell value={ex.caption} title="Caption" />
                      <TextCell value={ex.explanation} title="Explanation" />
                      <td className="td">{ex.priority ?? '—'}</td>
                      <TextCell value={ex.image_description} title="Image Description" />
                      <TextCell value={ex.created_by_user_id} title="Created By" />
                      <TextCell value={ex.modified_by_user_id} title="Modified By" />
                      <td className="td">{ex.created_datetime_utc ? new Date(ex.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{ex.modified_datetime_utc ? new Date(ex.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('caption_examples', ex)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('caption_examples', ex.id, 'caption example', () => fetchTable('caption_examples', setCaptionExamples, captionExP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={captionExP} data={captionExamples} />
          </div>
        )}

        {activeTab === 'caption_requests' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Caption Requests</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>{['ID', 'Image', 'Image Desc', 'Profile ID', 'Created By', 'Modified By', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {captionRequests.map(r => (
                    <tr key={r.id}>
                      <td className="td">{r.id}</td>
                      <ImgCell url={r.image?.url} />
                      <TextCell value={r.image?.image_description} title="Image Description" />
                      <TextCell value={r.profile_id} title="Profile ID" />
                      <TextCell value={r.created_by_user_id} title="Created By User ID" />
                      <TextCell value={r.modified_by_user_id} title="Modified By User ID" />
                      <td className="td">{r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{r.modified_datetime_utc ? new Date(r.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={captionReqP} data={captionRequests} />
          </div>
        )}

        {activeTab === 'humor_flavors' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Humor Flavors</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Slug', 'Description', 'Created By', 'Modified By', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {humorFlavors.map(hf => (
                    <tr key={hf.id}>
                      <td className="td">{hf.id}</td>
                      <td className="td">{hf.slug ?? '—'}</td>
                      <TextCell value={hf.description} title="Description" />
                      <TextCell value={hf.created_by_user_id} title="Created By" />
                      <TextCell value={hf.modified_by_user_id} title="Modified By" />
                      <td className="td">{hf.created_datetime_utc ? new Date(hf.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{hf.modified_datetime_utc ? new Date(hf.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={humorFlavorP} data={humorFlavors} />
          </div>
        )}

        {activeTab === 'humor_flavor_steps' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Humor Flavor Steps</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Flavor ID', 'Order', 'LLM Model', 'System Prompt', 'User Prompt', 'Description', 'Created By', 'Modified By', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {humorFlavorSteps.map(s => (
                    <tr key={s.id}>
                      <td className="td">{s.id}</td>
                      <td className="td">{s.humor_flavor_id ?? '—'}</td>
                      <td className="td">{s.order_by ?? '—'}</td>
                      <td className="td">{s.llm_model_id ?? '—'}</td>
                      <TextCell value={s.llm_system_prompt} title="System Prompt" />
                      <TextCell value={s.llm_user_prompt} title="User Prompt" />
                      <TextCell value={s.description} title="Description" />
                      <TextCell value={s.created_by_user_id} title="Created By" />
                      <TextCell value={s.modified_by_user_id} title="Modified By" />
                      <td className="td">{s.created_datetime_utc ? new Date(s.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{s.modified_datetime_utc ? new Date(s.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={humorFlavorStepP} data={humorFlavorSteps} />
          </div>
        )}

        {activeTab === 'humor_flavor_mix' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>Humor Flavor Mix</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('humor_flavor_mix')}>+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>{['ID', 'Humor Flavor ID', 'Flavor Slug', 'Flavor Description', 'Caption Count', 'Created By', 'Modified By', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {humorFlavorMix.map(m => (
                    <tr key={m.id}>
                      <td className="td">{m.id}</td>
                      <td className="td">{m.humor_flavor_id ?? '—'}</td>
                      <td className="td">{m.humor_flavors?.slug ?? '—'}</td>
                      <TextCell value={m.humor_flavors?.description} title="Flavor Description" />
                      <td className="td">{m.caption_count ?? '—'}</td>
                      <TextCell value={m.created_by_user_id} title="Created By User ID" />
                      <TextCell value={m.modified_by_user_id} title="Modified By User ID" />
                      <td className="td">{m.created_datetime_utc ? new Date(m.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{m.modified_datetime_utc ? new Date(m.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('humor_flavor_mix', m)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('humor_flavor_mix', m.id, 'humor flavor mix', () => fetchHumorFlavorMix(humorFlavorMixP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={humorFlavorMixP} data={humorFlavorMix} />
          </div>
        )}

        {activeTab === 'llm_models' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>LLM Models</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('llm_models')}>+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Name', 'Provider ID', 'Created By', 'Modified By', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {llmModels.map(m => (
                    <tr key={m.id}>
                      <td className="td">{m.id}</td>
                      <td className="td">{m.name ?? '—'}</td>
                      <td className="td">{m.llm_provider_id ?? '—'}</td>
                      <TextCell value={m.created_by_user_id} title="Created By" />
                      <TextCell value={m.modified_by_user_id} title="Modified By" />
                      <td className="td">{m.created_datetime_utc ? new Date(m.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{m.modified_datetime_utc ? new Date(m.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('llm_models', m)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('llm_models', m.id, 'LLM model', () => fetchTable('llm_models', setLlmModels, llmModelP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={llmModelP} data={llmModels} />
          </div>
        )}

        {activeTab === 'llm_providers' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>LLM Providers</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <SortToggle />
                <button className="btn-add" onClick={() => openModal('llm_providers')}>+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr>{['ID', 'Name', 'Created By', 'Modified By', 'Created', 'Modified', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {llmProviders.map(p => (
                    <tr key={p.id}>
                      <td className="td">{p.id}</td>
                      <td className="td">{p.name ?? '—'}</td>
                      <TextCell value={p.created_by_user_id} title="Created By" />
                      <TextCell value={p.modified_by_user_id} title="Modified By" />
                      <td className="td">{p.created_datetime_utc ? new Date(p.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{p.modified_datetime_utc ? new Date(p.modified_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">
                        <button className="btn-edit" onClick={() => openModal('llm_providers', p)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete('llm_providers', p.id, 'LLM provider', () => fetchTable('llm_providers', setLlmProviders, llmProviderP.page))}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={llmProviderP} data={llmProviders} />
          </div>
        )}

        {activeTab === 'llm_responses' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>LLM Model Responses</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>{['ID', 'Response', 'Model ID', 'Processing (s)', 'System Prompt', 'User Prompt', 'Temperature', 'Humor Flavor', 'Profile ID', 'Caption Request', 'Prompt Chain', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {llmResponses.map(r => (
                    <tr key={r.id}>
                      <TextCell value={r.id} title="Response ID" />
                      <TextCell value={r.llm_model_response} title="LLM Response" />
                      <td className="td">{r.llm_model_id ?? '—'}</td>
                      <td className="td">{r.processing_time_seconds ?? '—'}</td>
                      <TextCell value={r.llm_system_prompt} title="System Prompt" />
                      <TextCell value={r.llm_user_prompt} title="User Prompt" />
                      <td className="td">{r.llm_temperature ?? '—'}</td>
                      <td className="td">{r.humor_flavor_id ?? '—'}</td>
                      <TextCell value={r.profile_id} title="Profile ID" />
                      <td className="td">{r.caption_request_id ?? '—'}</td>
                      <td className="td">{r.llm_prompt_chain_id ?? '—'}</td>
                      <td className="td">{r.created_datetime_utc ? new Date(r.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{r.modified_datetime_utc ? new Date(r.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={llmRespP} data={llmResponses} />
          </div>
        )}

        {activeTab === 'llm_prompt_chains' && (
          <div className="card">
            <div className="section-header">
              <h2 className="section-title" style={{ margin: 0 }}>LLM Prompt Chains</h2>
              <SortToggle />
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>{['ID', 'Caption Request ID', 'Created By', 'Modified By', 'Created', 'Modified'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {llmPromptChains.map(c => (
                    <tr key={c.id}>
                      <td className="td">{c.id}</td>
                      <td className="td">{c.caption_request_id ?? '—'}</td>
                      <TextCell value={c.created_by_user_id} title="Created By User ID" />
                      <TextCell value={c.modified_by_user_id} title="Modified By User ID" />
                      <td className="td">{c.created_datetime_utc ? new Date(c.created_datetime_utc).toLocaleString() : '—'}</td>
                      <td className="td">{c.modified_datetime_utc ? new Date(c.modified_datetime_utc).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={llmChainP} data={llmPromptChains} />
          </div>
        )}

      </div>

      {modal?.type === 'image_new' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Add Image</h3>
            <div className="modal-field">
              <label className="modal-label">Upload File</label>
              <input className="modal-input" type="file" accept="image/*"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = await handleImageUpload(file)
                  if (url) setFormData((prev: any) => ({ ...prev, url }))
                }} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Or Paste URL</label>
              <input className="modal-input" type="text" value={formData.url ?? ''}
                onChange={e => setFormData((prev: any) => ({ ...prev, url: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Image Description</label>
              <input className="modal-input" type="text" value={formData.image_description ?? ''}
                onChange={e => setFormData((prev: any) => ({ ...prev, image_description: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={() => handleSave('images', ['url', 'image_description'], () => fetchTable('images', setImages, imageP.page))}>Save</button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'image_edit' && (
        <FormModal title="Edit Image" table="images"
          fields={[
            { key: 'url', label: 'URL' },
            { key: 'image_description', label: 'Image Description' },
            { key: 'additional_context', label: 'Additional Context' },
          ]}
          refresh={() => fetchTable('images', setImages, imageP.page)} />
      )}

      {modal?.type === 'caption_examples' && (
        <FormModal title={modal.data?.id ? 'Edit Caption Example' : 'Add Caption Example'} table="caption_examples"
          fields={[
            { key: 'caption', label: 'Caption' },
            { key: 'explanation', label: 'Explanation' },
            { key: 'image_description', label: 'Image Description' },
            { key: 'priority', label: 'Priority', type: 'number' },
          ]}
          refresh={() => fetchTable('caption_examples', setCaptionExamples, captionExP.page)} />
      )}

      {modal?.type === 'llm_models' && (
        <FormModal title={modal.data?.id ? 'Edit LLM Model' : 'Add LLM Model'} table="llm_models"
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'llm_provider_id', label: 'Provider ID', type: 'number' },
          ]}
          refresh={() => fetchTable('llm_models', setLlmModels, llmModelP.page)} />
      )}

      {modal?.type === 'llm_providers' && (
        <FormModal title={modal.data?.id ? 'Edit LLM Provider' : 'Add LLM Provider'} table="llm_providers"
          fields={[{ key: 'name', label: 'Name' }]}
          refresh={() => fetchTable('llm_providers', setLlmProviders, llmProviderP.page)} />
      )}

      {modal?.type === 'whitelisted_emails' && (
        <FormModal title={modal.data?.id ? 'Edit Email' : 'Add Email'} table="whitelist_email_addresses"
          fields={[{ key: 'email_address', label: 'Email Address', type: 'email' }]}
          refresh={() => fetchTable('whitelist_email_addresses', setWhitelistedEmails, emailP.page)} />
      )}

    {modal?.type === 'allowed_signup_domains' && (
      <FormModal title={modal.data?.id ? 'Edit Domain' : 'Add Domain'} table="allowed_signup_domains"
        fields={[{ key: 'apex_domain', label: 'Domain (e.g. example.com)' }]}
        refresh={() => fetchTable('allowed_signup_domains', setAllowedDomains, domainP.page)} />
    )}


      {modal?.type === 'humor_flavor_mix' && (
        <FormModal title={modal.data?.id ? 'Edit Humor Flavor Mix' : 'Add Humor Flavor Mix'} table="humor_flavor_mix"
          fields={[
            { key: 'humor_flavor_id', label: 'Humor Flavor ID', type: 'number' },
            { key: 'caption_count', label: 'Caption Count', type: 'number' },
          ]}
          refresh={() => fetchHumorFlavorMix(humorFlavorMixP.page)} />
      )}
    </div>
  )
}
