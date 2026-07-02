import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Normalise a status string → { label, color } for the badge.
function statusStyle(raw) {
  const s = String(raw || 'recorded').toLowerCase()
  if (['approved', 'match', 'verified'].includes(s))          return { label: 'Verified',        color: '#34d399' }
  if (['blocked', 'not_found', 'denied', 'rejected'].includes(s)) return { label: s === 'not_found' ? 'Not found' : 'Blocked', color: '#f87171' }
  if (['partial', 'needs_review', 'review'].includes(s))      return { label: 'Needs review',    color: '#fbbf24' }
  return { label: raw ? String(raw) : 'Recorded', color: '#a78bfa' }
}

function fmtTime(iso) {
  if (!iso) return null
  try { return new Date(iso).toLocaleString('en-IN') } catch { return iso }
}

/**
 * Order Status page — shown when a barcode already scanned in the session is
 * re-scanned. Renders the item's transaction number + status. Initial data is
 * passed via router state on navigation; a ?txn= number is fetched live and the
 * "Refresh" button re-queries GET /api/checkout/order-status/:txn.
 */
export default function OrderStatusPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params   = new URLSearchParams(location.search)

  const initial  = location.state || {}
  const initialTxn = initial.transactionId || params.get('txn') || null

  const [txn]      = useState(initialTxn)
  const [order, setOrder] = useState(initial.transactionId ? {
    transaction_id: initial.transactionId,
    status:         initial.status,
    product_name:   initial.productName,
    price:          initial.price,
    barcode:        initial.barcode,
    mk_id:          initial.mkId,
    scanned_at:     initial.scannedAt,
  } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchStatus = useCallback(async () => {
    if (!txn) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/checkout/order-status/${encodeURIComponent(txn)}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setOrder(o => ({ ...o, ...data, status: data.status || data.order_status || data.decision || (o && o.status) }))
      } else {
        setError(data.message || `Could not load status (HTTP ${res.status}).`)
      }
    } catch (e) {
      setError('Network error while loading order status.')
    } finally {
      setLoading(false)
    }
  }, [txn])

  // Fetch live if we arrived with only a txn number (no passed-in details).
  useEffect(() => { if (txn && !initial.transactionId) fetchStatus() }, [txn]) // eslint-disable-line react-hooks/exhaustive-deps

  const st = statusStyle(order?.status)
  const scannedAt = fmtTime(order?.scanned_at)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes popIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .os-btn{font-family:'Sora',sans-serif;font-size:13px;font-weight:600;border-radius:12px;padding:12px 18px;cursor:pointer;transition:transform .15s,background .2s;border:1px solid transparent}
        .os-btn:active{transform:scale(.97)}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#000', fontFamily:"'Sora',sans-serif", position:'relative', overflow:'hidden' }}>
        <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 75% 55% at 50% -5%, rgba(109,40,217,.18) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:560, margin:'0 auto', padding:'48px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <span style={{ fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'#7c5cc4' }}>Order Status</span>
            <button className="os-btn" onClick={() => navigate(-1)}
              style={{ background:'rgba(109,40,217,.08)', border:'1px solid rgba(109,40,217,.3)', color:'#c4b5fd', padding:'8px 14px', fontSize:12 }}>
              ← Back to checkout
            </button>
          </div>

          <div style={{ background:'rgba(12,8,22,.9)', border:'1px solid rgba(109,40,217,.25)', borderRadius:18, padding:'28px 26px', animation:'popIn .4s cubic-bezier(.22,1,.36,1) both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <span style={{ fontSize:26 }}>🧾</span>
              <div>
                <div style={{ fontSize:12, color:'#8b7bb8' }}>Already scanned in this session</div>
                <div style={{ fontSize:17, fontWeight:700, color:'#e9d5ff' }}>{order?.product_name || 'Scanned item'}</div>
              </div>
            </div>

            {/* Transaction number */}
            <div style={{ background:'rgba(0,0,0,.35)', border:'1px solid rgba(109,40,217,.2)', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
              <div style={{ fontSize:10, letterSpacing:'1.2px', textTransform:'uppercase', color:'#7c5cc4', marginBottom:5 }}>Transaction Number</div>
              <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:700, color:'#a78bfa', letterSpacing:'1px', wordBreak:'break-all' }}>
                {order?.transaction_id || '—'}
              </div>
            </div>

            {/* Status badge */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#8b7bb8' }}>Status</span>
              <span style={{ fontSize:13, fontWeight:700, padding:'5px 14px', borderRadius:20, color:st.color, border:`1px solid ${st.color}55`, background:`${st.color}14` }}>
                {loading ? 'Loading…' : st.label}
              </span>
            </div>

            {/* Details */}
            <div style={{ display:'flex', flexDirection:'column', gap:9, fontSize:13 }}>
              {order?.barcode && <Row label="Barcode"  value={order.barcode} mono />}
              {order?.mk_id   && <Row label="MK ID"    value={order.mk_id}   mono />}
              {order?.price != null && <Row label="Price" value={`₹${order.price}`} />}
              {scannedAt      && <Row label="Scanned"  value={scannedAt} />}
            </div>

            {error && <div style={{ marginTop:14, fontSize:12, color:'#fca5a5' }}>{error}</div>}

            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button className="os-btn" onClick={fetchStatus} disabled={!txn || loading}
                style={{ flex:1, background:'#7c3aed', color:'#fff', opacity:(!txn||loading)?.6:1 }}>
                {loading ? 'Refreshing…' : '↻ Refresh status'}
              </button>
              <button className="os-btn" onClick={() => navigate(-1)}
                style={{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(109,40,217,.3)', color:'#c4b5fd' }}>
                Continue scanning
              </button>
            </div>
          </div>

          <p style={{ marginTop:16, fontSize:11, color:'#4c1d95', lineHeight:1.6, textAlign:'center' }}>
            This item is already in the current session. To add another physical unit of the same product,
            scan it with its unique MK&nbsp;ID (serial number).
          </p>
        </div>
      </div>
    </>
  )
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
      <span style={{ color:'#8b7bb8' }}>{label}</span>
      <span style={{ color:'#e9d5ff', fontFamily: mono ? 'monospace' : 'inherit', textAlign:'right', wordBreak:'break-all' }}>{value}</span>
    </div>
  )
}
