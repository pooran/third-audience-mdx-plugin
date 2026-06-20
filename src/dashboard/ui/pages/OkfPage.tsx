'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '../components/Card.js'
import { HeroCard } from '../components/HeroCard.js'

interface GraphNode { id: string; title: string; type: string; url: string }
interface GraphEdge { source: string; target: string }
interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }
interface OkfData {
  graph: GraphData
  stats: { pages: number; nodes: number; edges: number }
  indexUrl: string
}

function OkfGraph({ data }: { data: GraphData }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !data.nodes.length) return
    const NS = 'http://www.w3.org/2000/svg'
    svg.innerHTML = ''

    const rect = svg.getBoundingClientRect()
    const W = Math.max(320, Math.round(rect.width)) || 900
    const H = Math.max(360, Math.round(rect.height)) || 560
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)

    const showLabels = data.nodes.length <= 40
    const spread = Math.min(W, H) * 0.42

    type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number; deg: number; fixed: boolean; moved: boolean; g?: SVGGElement; c?: SVGCircleElement; t?: SVGTextElement }
    const nodes: SimNode[] = data.nodes.map((n, i) => {
      const ang = (i / data.nodes.length) * Math.PI * 2
      return { ...n, x: W / 2 + Math.cos(ang) * spread, y: H / 2 + Math.sin(ang) * spread, vx: 0, vy: 0, deg: 0, fixed: false, moved: false }
    })

    const byId: Record<string, SimNode> = {}
    nodes.forEach(n => { byId[n.id] = n })

    const edges = data.edges.filter(e => byId[e.source] && byId[e.target] && e.source !== e.target)
    edges.forEach(e => { byId[e.source].deg++; byId[e.target].deg++ })

    const radius = (n: SimNode) => 6 + Math.min(10, n.deg * 1.7)

    function tick() {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2)
          const f = 9000 / d2, fx = f * dx / d, fy = f * dy / d
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
        }
        a.vx += (W / 2 - a.x) * 0.005
        a.vy += (H / 2 - a.y) * 0.005
      }
      for (const e of edges) {
        const a = byId[e.source], b = byId[e.target]
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        const f = (d - 150) * 0.012, fx = f * dx / d, fy = f * dy / d
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
      }
      for (const a of nodes) {
        if (a.fixed) { a.vx = 0; a.vy = 0; continue }
        a.vx *= 0.86; a.vy *= 0.86
        a.x += Math.max(-12, Math.min(12, a.vx))
        a.y += Math.max(-12, Math.min(12, a.vy))
      }
    }

    const view = document.createElementNS(NS, 'g')
    svg.appendChild(view)
    const gE = document.createElementNS(NS, 'g')
    const gN = document.createElementNS(NS, 'g')
    view.appendChild(gE); view.appendChild(gN)

    let tx = 0, ty = 0, sc = 1
    const applyView = () => view.setAttribute('transform', `translate(${tx},${ty}) scale(${sc})`)

    const edgeEls = edges.map(() => {
      const ln = document.createElementNS(NS, 'line')
      ln.setAttribute('stroke', 'rgba(130,175,230,0.10)')
      ln.setAttribute('stroke-width', '0.7')
      gE.appendChild(ln); return ln
    })

    nodes.forEach(n => {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('cursor', n.url ? 'pointer' : 'grab')
      const c = document.createElementNS(NS, 'circle')
      c.setAttribute('r', String(radius(n)))
      c.setAttribute('fill', n.type === 'WebPage' || n.type === 'Page' ? '#8ab4e8' : '#5291d7')
      c.setAttribute('stroke', '#0f1115'); c.setAttribute('stroke-width', '1.5')
      const t = document.createElementNS(NS, 'text')
      t.textContent = n.title.length > 26 ? n.title.slice(0, 24) + '…' : n.title
      t.setAttribute('fill', '#c9d4e0'); t.setAttribute('font-size', '11')
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('pointer-events', 'none')
      t.setAttribute('opacity', showLabels ? '1' : '0')
      const ti = document.createElementNS(NS, 'title'); ti.textContent = n.title
      g.appendChild(c); g.appendChild(t); g.appendChild(ti)
      g.addEventListener('mouseenter', () => highlight(n))
      g.addEventListener('mouseleave', clearHi)
      if (n.url) {
        g.addEventListener('click', () => { if (n.moved) { n.moved = false; return } window.open(n.url, '_blank', 'noopener') })
      }
      gN.appendChild(g); n.g = g; n.c = c; n.t = t
    })

    function highlight(node: SimNode) {
      const on: Record<string, boolean> = { [node.id]: true }
      edges.forEach((e, i) => {
        const hit = e.source === node.id || e.target === node.id
        edgeEls[i].setAttribute('stroke', hit ? 'rgba(146,190,240,0.95)' : 'rgba(130,175,230,0.07)')
        if (hit) { on[e.source] = true; on[e.target] = true }
      })
      nodes.forEach(m => {
        m.g!.setAttribute('opacity', on[m.id] ? '1' : '0.22')
        m.t!.setAttribute('opacity', on[m.id] ? '1' : showLabels ? '1' : '0')
      })
    }

    function clearHi() {
      edgeEls.forEach(el => el.setAttribute('stroke', 'rgba(130,175,230,0.10)'))
      nodes.forEach(m => {
        m.g!.setAttribute('opacity', '1')
        if (!showLabels) m.t!.setAttribute('opacity', '0')
      })
    }

    function paint() {
      edges.forEach((e, i) => {
        const a = byId[e.source], b = byId[e.target]
        edgeEls[i].setAttribute('x1', String(a.x)); edgeEls[i].setAttribute('y1', String(a.y))
        edgeEls[i].setAttribute('x2', String(b.x)); edgeEls[i].setAttribute('y2', String(b.y))
      })
      nodes.forEach(n => {
        n.c!.setAttribute('cx', String(n.x)); n.c!.setAttribute('cy', String(n.y))
        n.t!.setAttribute('x', String(n.x)); n.t!.setAttribute('y', String(n.y - radius(n) - 5))
      })
    }

    function pt(el: SVGGraphicsElement, ev: MouseEvent) {
      const m = el.getScreenCTM(); if (!m) return { x: ev.clientX, y: ev.clientY }
      const inv = m.inverse()
      return { x: inv.a * ev.clientX + inv.c * ev.clientY + inv.e, y: inv.b * ev.clientX + inv.d * ev.clientY + inv.f }
    }

    const state: { drag: SimNode | null; pan: { x: number; y: number; tx: number; ty: number } | null } = { drag: null, pan: null }

    svg.addEventListener('mousedown', ev => {
      const p = pt(view as SVGGraphicsElement, ev)
      let best = 900
      let hit: SimNode | null = null
      nodes.forEach(n => { const dx = n.x - p.x, dy = n.y - p.y, dd = dx * dx + dy * dy; if (dd < best) { best = dd; hit = n } })
      if (hit !== null) { state.drag = hit; (state.drag as SimNode).fixed = true; (state.drag as SimNode).moved = false }
      else { const r = pt(svg as SVGGraphicsElement, ev); state.pan = { x: r.x, y: r.y, tx, ty }; svg.style.cursor = 'grabbing' }
    })
    const onMouseMove = (ev: MouseEvent) => {
      if (state.drag !== null) { const p = pt(view as SVGGraphicsElement, ev); state.drag.x = p.x; state.drag.y = p.y; state.drag.moved = true; tick(); state.drag.x = p.x; state.drag.y = p.y; paint() }
      else if (state.pan !== null) { const r = pt(svg as SVGGraphicsElement, ev); tx = state.pan.tx + (r.x - state.pan.x); ty = state.pan.ty + (r.y - state.pan.y); applyView() }
    }
    const onMouseUp = () => {
      if (state.drag !== null) {
        state.drag.fixed = false; state.drag = null
        let f = 0;(function r() { tick(); paint(); if (f++ < 60) requestAnimationFrame(r) })()
      }
      if (state.pan !== null) { state.pan = null; svg.style.cursor = '' }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    svg.addEventListener('wheel', ev => {
      ev.preventDefault()
      const r = pt(svg as SVGGraphicsElement, ev), lx = (r.x - tx) / sc, ly = (r.y - ty) / sc
      sc = Math.max(0.15, Math.min(4, sc * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)))
      tx = r.x - lx * sc; ty = r.y - ly * sc; applyView()
    }, { passive: false })

    function fitView() {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      nodes.forEach(n => {
        const r = radius(n) + 24
        if (n.x - r < minX) minX = n.x - r; if (n.y - r < minY) minY = n.y - r
        if (n.x + r > maxX) maxX = n.x + r; if (n.y + r > maxY) maxY = n.y + r
      })
      const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY), pad = 30
      sc = Math.max(0.15, Math.min(2, Math.min((W - pad * 2) / bw, (H - pad * 2) / bh)))
      tx = (W - bw * sc) / 2 - minX * sc; ty = (H - bh * sc) / 2 - minY * sc; applyView()
    }

    for (let k = 0; k < 500; k++) tick()
    paint(); fitView()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [data])

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '72vh', minHeight: 560, display: 'block', background: '#0f1115', borderRadius: 8, cursor: 'grab', touchAction: 'none' }}
      role="img"
      aria-label="Knowledge graph of your content"
    />
  )
}

export function OkfPage() {
  const [state, setState] = useState<{ data: OkfData | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null })

  useEffect(() => {
    fetch('/api/third-audience/okf-graph')
      .then(r => r.ok ? r.json() : r.json().then((e: { error?: string }) => Promise.reject(e.error ?? 'Failed')))
      .then((data: OkfData) => setState({ data, loading: false, error: null }))
      .catch((e: unknown) => setState({ data: null, loading: false, error: String(e) }))
  }, [])

  if (state.loading) return <div style={{ padding: 48, color: 'var(--ta-gray-500)', textAlign: 'center' }}>Loading knowledge graph…</div>
  if (state.error) return <div style={{ padding: 48, color: 'var(--ta-red)', textAlign: 'center' }}>{state.error}</div>
  if (!state.data) return null

  const { data } = state

  return (
    <div>
      <h1 className="ta-page-title">OKF Bundle</h1>
      <p className="ta-page-subtitle">Open Knowledge Format — your content as clean Markdown for AI crawlers</p>

      <div className="ta-hero-grid">
        <HeroCard
          label="Total Pages"
          value={data.stats.pages}
          meta="in content directory"
          color="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <HeroCard
          label="Graph Nodes"
          value={data.stats.nodes}
          meta="top connected pages"
          color="teal"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><circle cx="3" cy="6" r="2"/><circle cx="21" cy="6" r="2"/><circle cx="3" cy="18" r="2"/><circle cx="21" cy="18" r="2"/><line x1="5" y1="6" x2="10" y2="11"/><line x1="19" y1="6" x2="14" y2="11"/><line x1="5" y1="18" x2="10" y2="13"/><line x1="19" y1="18" x2="14" y2="13"/></svg>}
        />
        <HeroCard
          label="Internal Links"
          value={data.stats.edges}
          meta="edges in graph"
          color="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
        />
        <HeroCard
          label="Bundle Index"
          value="View"
          meta={data.indexUrl.replace(/^https?:\/\/[^/]+/, '')}
          color="orange"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Card title="Knowledge Graph">
          <p style={{ fontSize: 13, color: 'var(--ta-gray-500)', marginBottom: 16 }}>
            Drag nodes · scroll to zoom · drag background to pan · click a node to open the page
            {data.graph.nodes.length > 40 && ' · hover a node to reveal its labels'}
          </p>
          <OkfGraph data={data.graph} />
        </Card>
      </div>

      <div className="ta-grid-2">
        <Card title="Bundle URLs">
          <table className="ta-table">
            <thead><tr><th>Resource</th><th>URL</th></tr></thead>
            <tbody>
              <tr>
                <td>Index</td>
                <td><a href="/okf" target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--ta-font-mono)', fontSize: 12 }}>/okf</a></td>
              </tr>
              <tr>
                <td>AI Sitemap</td>
                <td><a href="/sitemap-ai.xml" target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--ta-font-mono)', fontSize: 12 }}>/sitemap-ai.xml</a></td>
              </tr>
              <tr>
                <td>LLMs.txt</td>
                <td><a href="/llms.txt" target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--ta-font-mono)', fontSize: 12 }}>/llms.txt</a></td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card title="How AI Crawlers Use OKF">
          <div style={{ fontSize: 13, color: 'var(--ta-gray-600)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 10 }}>Each page on your site is available as clean Markdown at <code style={{ fontFamily: 'var(--ta-font-mono)', background: 'var(--ta-gray-100)', padding: '1px 5px', borderRadius: 4 }}>/okf/slug.md</code></p>
            <p style={{ marginBottom: 10 }}>Internal links are rewritten to point to sibling <code style={{ fontFamily: 'var(--ta-font-mono)', background: 'var(--ta-gray-100)', padding: '1px 5px', borderRadius: 4 }}>.md</code> files so crawlers can follow the full knowledge graph.</p>
            <p>The index at <code style={{ fontFamily: 'var(--ta-font-mono)', background: 'var(--ta-gray-100)', padding: '1px 5px', borderRadius: 4 }}>/okf</code> lists every page with title and description — a complete sitemap in natural language.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
