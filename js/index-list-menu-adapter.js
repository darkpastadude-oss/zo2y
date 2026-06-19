// ===================== SHARED CORE =====================
// Defines window.ListKit once — used by this adapter and potentially profile.js etc.
(function () {
  if (window.ListKit) return;

  const STYLE_ID = 'zo2yIndexListMenuStyle';
  const STATE = {
    currentCard: null, currentItem: null, quickRows: [], quickStatus: {},
    pendingQuickKeys: new Set(), quickMutationVersions: {},
    customLists: [], selectedCustomLists: new Set(),
    pendingCustomListIds: new Set(), customMutationVersion: 0
  };
  const CACHE = {
    quickStatusByItem: new Map(), customListsByScope: new Map(),
    customMembershipByItem: new Map(), primingScopes: new Set()
  };
  const DOM = { quickContainer: null, quickNodesByKey: new Map() };

  let _bridge = null;
  let _authClient = null;
  let _authClientPromise = null;
  let _cachedUser = null;
  let _lastFocusedTrigger = null;

  const QUICK_ROWS_BY_TYPE = {
    movie: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
    ],
    tv: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
    ],
    anime: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Watched', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Watchlist', icon: 'fas fa-bookmark' }
    ],
    game: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'watched', label: 'Played', icon: 'fas fa-eye' },
      { key: 'watchlist', label: 'Backlog', icon: 'fas fa-bookmark' }
    ],
    book: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'read', label: 'Read', icon: 'fas fa-eye' },
      { key: 'readlist', label: 'Readlist', icon: 'fas fa-bookmark' }
    ],
    music: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'listened', label: 'Listened', icon: 'fas fa-eye' },
      { key: 'listenlist', label: 'Listenlist', icon: 'fas fa-bookmark' }
    ],
    travel: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'visited', label: 'Visited', icon: 'fas fa-check' },
      { key: 'bucketlist', label: 'Bucket List', icon: 'fas fa-bookmark' }
    ],
    fashion: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'owned', label: 'Owned', icon: 'fas fa-check' },
      { key: 'wishlist', label: 'Wishlist', icon: 'fas fa-bookmark' }
    ],
    food: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'tried', label: 'Tried', icon: 'fas fa-check' },
      { key: 'want_to_try', label: 'Want to Try', icon: 'fas fa-bookmark' }
    ],
    car: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' },
      { key: 'owned', label: 'Owned', icon: 'fas fa-check' },
      { key: 'wishlist', label: 'Wishlist', icon: 'fas fa-bookmark' }
    ],
    sports: [
      { key: 'favorites', label: 'Favorites', icon: 'fas fa-heart' }
    ]
  };

  const DEFAULT_TABLE_BY_MEDIA = {
    movie: { table: 'movie_list_items', itemField: 'movie_id' },
    tv: { table: 'tv_list_items', itemField: 'tv_id' },
    anime: { table: 'anime_list_items', itemField: 'anime_id' },
    game: { table: 'game_list_items', itemField: 'game_id' },
    book: { table: 'book_list_items', itemField: 'book_id' },
    music: { table: 'music_list_items', itemField: 'track_id' },
    travel: { table: 'travel_list_items', itemField: 'country_code' },
    fashion: { table: 'fashion_list_items', itemField: 'brand_id' },
    food: { table: 'food_list_items', itemField: 'brand_id' },
    car: { table: 'car_list_items', itemField: 'brand_id' },
    sports: { table: 'sports_list_items', itemField: 'team_id' },
    restaurant: { table: 'lists_restraunts', itemField: 'restraunt_id' }
  };

  const MEDIA_LIST_ICONS = {
    movie:'fas fa-film', tv:'fas fa-tv', anime:'fas fa-dragon',
    game:'fas fa-gamepad', book:'fas fa-book', music:'fas fa-music',
    travel:'fas fa-earth-americas', fashion:'fas fa-shirt',
    food:'fas fa-burger', car:'fas fa-car', sports:'fas fa-futbol',
    restaurant:'fas fa-clapperboard'
  };
  function getMediaListFallbackIcon() { return MEDIA_LIST_ICONS[getMediaType()] || 'fas fa-list'; }
  function escapeHtml(v) {
    return String(v || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function getMediaType() {
    if (STATE.currentItem && STATE.currentItem.mediaType) return String(STATE.currentItem.mediaType).toLowerCase();
    return String(_bridge?.mediaType || '').toLowerCase();
  }
  function getCurrentUser() {
    const bu = _bridge && typeof _bridge.getCurrentUser === 'function' ? (() => { try { return _bridge.getCurrentUser(); } catch(e) {} })() : null;
    if (bu?.id) return bu;
    if (_bridge?.__zo2yResolvedUser?.id) return _bridge.__zo2yResolvedUser;
    return _cachedUser;
  }
  function getQuickRowsForMenu() { return QUICK_ROWS_BY_TYPE[getMediaType()] || []; }
  function getScopeKey() {
    const uid = String(getCurrentUser()?.id || '').trim();
    const mt = getMediaType();
    return uid && mt ? `${uid}:${mt}` : '';
  }
  function getScopeItemKey(id) { const k = getScopeKey(); return k ? `${k}:${_normIdKey(id)}` : ''; }
  function normalizeItemIdValue(id) {
    const mt = getMediaType();
    return window.ListUtils ? ListUtils.coerceItemId(mt, id) : id;
  }
  function normalizeQueryableItemIdValue(id) {
    const mt = getMediaType();
    if (window.ListUtils && typeof ListUtils.normalizeQueryableItemId === 'function') return ListUtils.normalizeQueryableItemId(mt, id);
    if (mt === 'movie' || mt === 'tv' || mt === 'game') { const n = Number(id); return Number.isFinite(n) ? n : null; }
    const s = String(id || '').trim(); return s || null;
  }
  function _normIdKey(id) { return String(normalizeItemIdValue(id)); }
  function buildBlankQuickStatus(keys) { const s = {}; (keys||[]).forEach(k=>s[k]=false); return s; }
  function cloneQuickStatus(s, keys) { const c = buildBlankQuickStatus(keys); if (s&&typeof s==='object') Object.keys(c).forEach(k=>c[k]=!!s[k]); return c; }
  function readBridgeQuickStatus(id, keys) {
    if (!_bridge || typeof _bridge.getQuickStatusForItem !== 'function') return null;
    try { const r = _bridge.getQuickStatusForItem(normalizeItemIdValue(id), keys); return r && typeof r === 'object' ? cloneQuickStatus(r, keys) : null; } catch(e) { return null; }
  }
  function readCachedQuickStatus(id, keys) {
    const fb = readBridgeQuickStatus(id, keys); if (fb) return fb;
    const k = getScopeItemKey(id); return k && CACHE.quickStatusByItem.has(k) ? cloneQuickStatus(CACHE.quickStatusByItem.get(k), keys) : buildBlankQuickStatus(keys);
  }
  function writeCachedQuickStatus(id, s, keys) { const k = getScopeItemKey(id); if (k) CACHE.quickStatusByItem.set(k, cloneQuickStatus(s, keys)); }
  function readCachedCustomLists() { const k = getScopeKey(); return k && CACHE.customListsByScope.has(k) ? [...CACHE.customListsByScope.get(k)] : []; }
  function writeCachedCustomLists(l) { const k = getScopeKey(); if (k) CACHE.customListsByScope.set(k, Array.isArray(l)?[...l]:[]); }
  function readCachedMembership(id) { const k = getScopeItemKey(id); return k && CACHE.customMembershipByItem.has(k) ? new Set(CACHE.customMembershipByItem.get(k)) : new Set(); }
  function writeCachedMembership(id, m) { const k = getScopeItemKey(id); if (k) CACHE.customMembershipByItem.set(k, Array.from(m||[]).filter(Boolean)); }
  function syncBridgeCurrentUser(u) {
    _cachedUser = u?.id ? u : null;
    if (!_bridge) return;
    try { _bridge.__zo2yResolvedUser = _cachedUser; } catch(e) {}
    if (typeof _bridge.setCurrentUser === 'function') { try { _bridge.setCurrentUser(_cachedUser); } catch(e) {} }
  }
  function _bridgeCanUseResolvedUser() {
    const bu = _bridge&&typeof _bridge.getCurrentUser==='function'?(()=>{try{return _bridge.getCurrentUser()}catch(e){}})():null;
    return !!(bu?.id || typeof _bridge?.setCurrentUser === 'function');
  }

  async function ensureClient() {
    try { if (_bridge && typeof _bridge.ensureClient === 'function') { const c = await _bridge.ensureClient(); if (c?.auth) { if (c.__zo2yAuthListenersBound||(typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT!=='function'&&!(window.ZO2Y_AUTH&&typeof window.ZO2Y_AUTH.ensureClient==='function'))) return c; } } } catch(e) {}
    if (_authClient?.auth) return _authClient;
    if (_authClientPromise) return _authClientPromise;
    _authClientPromise = (async () => {
      try { const r=window.ZO2Y_AUTH||null; if(r&&typeof r.waitForSupabase==='function') await r.waitForSupabase(8000); else { const s=Date.now(); while(!window.supabase&&(Date.now()-s)<8000) await new Promise(r=>setTimeout(r,40)); } } catch(e) {}
      try { if(typeof window.__ZO2Y_ENSURE_SUPABASE_CLIENT==='function'){const c=window.__ZO2Y_ENSURE_SUPABASE_CLIENT();if(c?.auth)return c} }catch(e){}
      try { const r=window.ZO2Y_AUTH||null; if(r&&typeof r.ensureClient==='function'){const c=r.ensureClient();if(c?.auth)return c} }catch(e){}
      return null;
    })();
    _authClient = await _authClientPromise; _authClientPromise = null;
    if (_authClient?.auth) {
      try { if(typeof window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE==='function') window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE();
        if(typeof window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT==='function'){await window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT(_authClient);await new Promise(r=>setTimeout(r,80));} } catch(e) {}
    }
    return _authClient;
  }
  function showSignInPrompt() { if(window.ZO2Y_CUSTOM_LIST_MODAL&&typeof window.ZO2Y_CUSTOM_LIST_MODAL.showSignInPrompt==='function'){window.ZO2Y_CUSTOM_LIST_MODAL.showSignInPrompt();return true} return false; }
  function redirectToLogin() {
    if (showSignInPrompt()) return;
    if (!_bridge) { window.location.href = 'login.html'; return; }
    try { const n=`${window.location.pathname||''}${window.location.search||''}${window.location.hash||''}`||'index.html'; localStorage.setItem('postAuthRedirect',n); } catch(e) {}
    window.location.href = 'login.html';
  }
  function isConflictLikeError(e) { const s=Number(e?.status||e?.statusCode||e?.code||0); const m=String(e?.message||e?.details||'').toLowerCase(); return s===409||m.includes('duplicate')||m.includes('already exists')||m.includes('unique')||m.includes('conflict'); }
  function authBootstrapReady() { try { return !!(window.__AUTH_READY===true||window.__ZO2Y_AUTH_STATE===true||window.__ZO2Y_AUTH_STATE===false); } catch(e){} return false; }
  async function waitForAuthBootstrap(t) { if(authBootstrapReady()) return true; const w=Math.max(50,Number(t)||1200); return new Promise(r=>{let s=false;const d=v=>{if(s)return;s=true;try{window.removeEventListener('zo2y-auth-ready',o)}catch(e){}r(!!v)};const o=()=>d(true);try{window.addEventListener('zo2y-auth-ready',o,{once:true})}catch(e){}setTimeout(()=>d(false),w);}); }
  async function attemptSessionRecovery(c) { if(!c?.auth) return; try { if(typeof window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE==='function') window.__ZO2Y_HYDRATE_AUTH_STORAGE_FROM_DURABLE(); } catch(e){} try { if(typeof window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT==='function') await window.__ZO2Y_RESTORE_SESSION_FROM_SNAPSHOT(c); } catch(e){} await new Promise(r=>setTimeout(r,100)); }
  async function resolveAuthenticatedUser() {
    const eu=getCurrentUser(); if(eu?.id) { syncBridgeCurrentUser(eu); return eu; }
    const c=await ensureClient(); if(!c?.auth) return null;
    const r=window.ZO2Y_AUTH||null;
    const tr=async()=>{ try{if(r&&typeof r.getVerifiedUser==='function'){const u=await r.getVerifiedUser(c);if(u?.id) return u}}catch(e){} try{const s=await c.auth.getSession();const u=s?.data?.session?.user;if(u?.id) return u}catch(e){} try{const u=typeof c.auth.getUser==='function'?(await c.auth.getUser())?.data?.user:null;if(u?.id) return u}catch(e){} return null; };
    let u=await tr(); if(u?.id){syncBridgeCurrentUser(u);return u}
    if(!authBootstrapReady()) await waitForAuthBootstrap(1200); await attemptSessionRecovery(c); u=await tr(); if(u?.id){syncBridgeCurrentUser(u);return u} return null;
  }
  function customListsEnabled() {
    const mt=getMediaType(); if(!mt) return false;
    if(!window.ListUtils||typeof ListUtils.getListConfig!=='function') return true;
    const cfg=ListUtils.getListConfig(mt); if(!cfg) return false; if(cfg.disableCustomLists) return false; if(!cfg.listTable||!cfg.itemsTable) return false;
    return true;
  }
  function getCardItem(card) {
    if(!card) return null;
    if(_bridge&&typeof _bridge.getItemFromCard==='function') return _bridge.getItemFromCard(card);
    const mt=String(card.getAttribute('data-media-type')||getMediaType()).toLowerCase();
    const attr=_bridge?.itemIdAttr||'data-item-id'; const raw=card.getAttribute(attr); if(!raw) return null;
    const cid=normalizeQueryableItemIdValue(raw); if(cid===null||cid===undefined||String(cid).trim()==='') return null;
    const t=card.querySelector('.card-title, .card-name')?.textContent||'';
    const sub=card.querySelector('.card-meta, .card-sub')?.textContent||'';
    const li=card.getAttribute('data-list-image')||'';
    const img=li||card.querySelector('img')?.getAttribute('src')||'';
    return {mediaType:mt,itemId:cid,title:String(t).trim(),subtitle:String(sub).trim(),image:String(img).trim()};
  }
  async function toggleDefaultListWithFallback(user, item, listType, nextSaved) {
    if(!user?.id||!item?.itemId) return {ok:false,saved:false};
    const mt=getMediaType(); const tbl=DEFAULT_TABLE_BY_MEDIA[mt]; syncBridgeCurrentUser(user);
    try { if(_bridge&&typeof _bridge.toggleDefaultList==='function'&&(!tbl?.table||!tbl?.itemField||_bridgeCanUseResolvedUser())){const r=await _bridge.toggleDefaultList({itemId:item.itemId,listType,card:STATE.currentCard,nextSaved,user});if(r&&typeof r.ok==='boolean'){if(r.ok)return r;if(isConflictLikeError(r?.error))return{ok:true,saved:!!nextSaved};return r}} }catch(e){}
    if(!tbl?.table||!tbl?.itemField) return {ok:false,saved:false};
    const c=await ensureClient(); if(!c) return {ok:false,saved:false};
    const p={user_id:user.id,list_type:listType}; p[tbl.itemField]=item.itemId;
    if(nextSaved){const{error}=await c.from(tbl.table).insert(p); if(error){const m=String(error.message||'').toLowerCase();if(m.includes('duplicate')||m.includes('already exists')||m.includes('unique'))return{ok:true,saved:true};return{ok:false,saved:false,error}} return{ok:true,saved:true}}
    const{error}=await c.from(tbl.table).delete().eq('user_id',user.id).eq(tbl.itemField,item.itemId).eq('list_type',listType);
    if(error) return{ok:false,saved:true,error}; return{ok:true,saved:false};
  }
  async function getDefaultListStatusMap(id, keys) {
    const s={}; (keys||[]).forEach(k=>s[k]=false);
    const u=await resolveAuthenticatedUser(); if(!u?.id||!keys?.length) return s;
    const c=await ensureClient(); if(!c) return s;
    const mt=getMediaType(); const tc=DEFAULT_TABLE_BY_MEDIA[mt];
    const bs=readBridgeQuickStatus(id,keys); if(bs) return bs;
    if(_bridge&&typeof _bridge.getDefaultListStatusMap==='function'){try{const r=await _bridge.getDefaultListStatusMap(normalizeItemIdValue(id),keys); if(r&&typeof r==='object') return cloneQuickStatus(r,keys)}catch(e){}}
    if(!tc) return s;
    try { const nid=normalizeQueryableItemIdValue(id); if(nid===null||nid===undefined) return s;
      const{data}=await c.from(tc.table).select('list_type').eq('user_id',u.id).eq(tc.itemField,nid).in('list_type',keys);
      (data||[]).forEach(r=>{const k=String(r.list_type||'');if(k in s)s[k]=true});
    }catch(e){}
    return s;
  }
  function maybeVibrate(d) { try{if(!d)return;if(!window.matchMedia||!window.matchMedia('(pointer:coarse)').matches)return;if(navigator&&typeof navigator.vibrate==='function')navigator.vibrate(Math.max(1,Number(d)||0))}catch(e){} }
  function animateQuickNode(key, kind) {
    const n=DOM.quickNodesByKey.get(String(key||'').trim()); if(!n) return;
    const sn=n.querySelector('.menu-quick-state'); n.classList.remove('zo2y-anim-saved','zo2y-anim-removed','zo2y-anim-error'); if(sn) sn.classList.remove('zo2y-anim-state'); void n.offsetWidth;
    const cn=kind==='saved'?'zo2y-anim-saved':(kind==='removed'?'zo2y-anim-removed':'zo2y-anim-error'); n.classList.add(cn);
    if(sn){void sn.offsetWidth;sn.classList.add('zo2y-anim-state')}
    if(kind==='saved') maybeVibrate(12); else if(kind==='removed') maybeVibrate(8); else maybeVibrate(18);
  }
  function notify(m, e) { if(_bridge&&typeof _bridge.notify==='function'){_bridge.notify(m,!!e);return} if(typeof console!=='undefined'){if(e)console.error(m);else console.log(m)} }

  function buildCustomListPayload() {
    const it=STATE.currentItem; if(!it) return null;
    const mt=getMediaType();
    if(mt==='book') return{id:it.itemId,title:it.title||'',authors:it.subtitle||'',thumbnail:it.image||''};
    if(mt==='music') return{id:it.itemId,name:it.title||'',artists:it.subtitle||'',image:it.image||''};
    return null;
  }

  function ensureStyles() {
    if(typeof document==='undefined'||document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style'); s.id=STYLE_ID; s.textContent=`
      .menu-modal{display:none;position:absolute;z-index:10000;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,.75);backdrop-filter:blur(5px);padding:0;align-items:center;justify-content:center}
      .menu-modal.active{display:flex}
      .menu-modal-content{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card,#132347);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:20px;width:100%;max-width:380px;max-height:80vh;overflow-y:auto;box-shadow:0 12px 34px rgba(0,0,0,.28)}
      @keyframes menuModalFlyUp{from{opacity:0;transform:translate(-50%,calc(-50% + 24px)) scale(.98)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      .menu-modal-content.menu-modal-fly-up{animation:menuModalFlyUp .28s cubic-bezier(.22,1,.36,1)}
      .menu-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,rgba(255,255,255,.12))}
      .menu-modal-header h3{font-size:18px;font-weight:600;color:var(--white,#fff);margin:0}
      .menu-modal-close{background:transparent;border:none;color:var(--muted,#8ca3c7);font-size:24px;cursor:pointer;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;transition:all .2s}
      .menu-modal-close:hover{background:rgba(255,255,255,.1);color:var(--white,#fff)}
      .menu-modal-body{padding:16px 20px}
      .menu-quick-lists{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
      .menu-quick-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 16px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;color:var(--text,#fff);cursor:pointer;font:inherit;text-align:left;appearance:none;-webkit-appearance:none;min-height:48px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;position:relative;overflow:hidden;transition:background-color .18s,border-color .18s,transform .12s,box-shadow .18s,opacity .18s;will-change:transform}
      .menu-quick-item::after{content:"";position:absolute;inset:-35%;pointer-events:none;opacity:0;transform:scale(.4);background:radial-gradient(circle at 30% 30%,rgba(245,158,11,.35),rgba(245,158,11,0) 55%),radial-gradient(circle at 70% 40%,rgba(255,184,77,.28),rgba(255,184,77,0) 60%),radial-gradient(circle at 50% 80%,rgba(255,255,255,.12),rgba(255,255,255,0) 55%);filter:blur(0)}
      .menu-quick-item:hover{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.1)}
      .menu-quick-item:active{transform:scale(.985)}
      .menu-quick-item:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.22)}
      @keyframes zo2yQuickSaved{0%{transform:scale(.985);box-shadow:0 0 0 rgba(245,158,11,0)}45%{transform:scale(1.02);box-shadow:0 0 0 6px rgba(245,158,11,.18)}100%{transform:scale(1);box-shadow:0 0 0 rgba(245,158,11,0)}}
      @keyframes zo2yQuickSparkle{0%{opacity:0;transform:scale(.35)}30%{opacity:1;transform:scale(1.02)}100%{opacity:0;transform:scale(1.25)}}
      @keyframes zo2yQuickRemoved{0%{transform:scale(.99);box-shadow:0 0 0 rgba(140,163,199,0)}55%{transform:scale(1.012);box-shadow:0 0 0 6px rgba(140,163,199,.12)}100%{transform:scale(1);box-shadow:0 0 0 rgba(140,163,199,0)}}
      @keyframes zo2yQuickError{0%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}100%{transform:translateX(0)}}
      @keyframes zo2yStatePop{0%{transform:scale(.92);opacity:.75}60%{transform:scale(1.06);opacity:1}100%{transform:scale(1);opacity:1}}
      .menu-quick-item.zo2y-anim-saved{animation:zo2yQuickSaved 420ms cubic-bezier(.2,.9,.2,1)}
      .menu-quick-item.zo2y-anim-saved::after{animation:zo2yQuickSparkle 520ms cubic-bezier(.2,.9,.2,1)}
      .menu-quick-item.zo2y-anim-removed{animation:zo2yQuickRemoved 360ms cubic-bezier(.2,.9,.2,1)}
      .menu-quick-item.zo2y-anim-error{animation:zo2yQuickError 360ms ease-in-out}
      .menu-quick-state.zo2y-anim-state{animation:zo2yStatePop 280ms cubic-bezier(.2,.9,.2,1)}
      .menu-quick-item.active{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.15)}
      .menu-quick-item[aria-busy=true]{opacity:.72;pointer-events:none}
      .menu-quick-left{display:flex;align-items:center;gap:12px}
      .menu-quick-left i{width:20px;color:var(--accent,#f59e0b)}
      .menu-quick-left span{font-weight:500;color:var(--white,#fff)}
      .menu-quick-state{color:var(--accent,#f59e0b);font-size:13px;font-weight:600;transition:transform .18s,opacity .18s}
      .menu-quick-item.active .menu-quick-state{transform:translateY(-.5px)}
      .menu-custom-section{border-top:1px solid var(--border,rgba(255,255,255,.12));padding-top:16px}
      .menu-custom-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;color:var(--muted,#8ca3c7);font-size:14px}
      .menu-custom-lists{display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto}
      .menu-custom-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:10px;cursor:pointer;transition:all .2s}
      .menu-custom-item:hover{border-color:var(--accent,#f59e0b)}
      .menu-custom-item.active{border-color:var(--accent,#f59e0b);background:rgba(245,158,11,.1)}
      .menu-custom-item[aria-busy=true]{opacity:.82}
      .menu-custom-left{display:flex;align-items:center;gap:10px}
      .menu-custom-left i{width:18px;color:var(--accent,#f59e0b);font-size:14px}
      .menu-custom-left span{font-size:14px;color:var(--white,#fff)}
      .menu-custom-state{color:var(--accent,#f59e0b);font-size:12px;font-weight:600}
      .menu-input{width:100%;padding:12px 16px;background:var(--card-2,#172b58);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;color:var(--white,#fff);font-size:14px;margin-bottom:16px}
      .menu-input:focus{outline:none;border-color:var(--accent,#f59e0b)}
      .menu-modal-actions{display:flex;gap:10px;justify-content:flex-end}
      .menu-modal-actions .menu-btn{padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid var(--border,rgba(255,255,255,.12));transition:all .2s}
      .menu-modal-actions .menu-btn-primary{background:var(--gradient,linear-gradient(135deg,#f59e0b,#ffb84d));color:#0b1633;border:none}
      .menu-modal-actions .menu-btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
      .menu-modal-actions .menu-btn-secondary{background:transparent;color:var(--white,#fff)}
      .menu-modal-actions .menu-btn-secondary:hover{background:rgba(255,255,255,.1)}
      .menu-empty{text-align:center;padding:20px;color:var(--muted,#8ca3c7);font-size:14px;background:var(--card-2,#172b58);border-radius:12px;border:1px dashed var(--border,rgba(255,255,255,.12))}
      @media(max-width:768px){.menu-modal{align-items:center;justify-content:center;background:rgba(3,10,28,.8);backdrop-filter:blur(8px)}.menu-modal-content{position:absolute;top:50%;left:50%;width:calc(100vw - 14px);max-width:100vw;max-height:min(80dvh,740px);border-radius:18px;transform:translate(-50%,-50%)}.menu-modal-header{padding:14px 16px}.menu-modal-header h3{font-size:17px}.menu-modal-close{width:40px;height:40px;font-size:26px}.menu-modal-body{padding:12px 14px 16px}.menu-quick-lists,.menu-custom-lists{gap:10px}.menu-custom-lists{max-height:min(38dvh,340px)}.menu-quick-item,.menu-custom-item{min-height:48px;padding:12px 14px;border-radius:13px}.menu-quick-left span,.menu-custom-left span{font-size:15px}.menu-create-list-btn{min-height:40px;padding:8px 12px;font-size:13px;border-radius:999px}.menu-input{min-height:46px;font-size:15px;padding:12px 14px}.menu-modal-actions{position:sticky;bottom:0;background:linear-gradient(180deg,rgba(19,35,71,.92),rgba(19,35,71,1));margin:12px -14px -16px;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0));border-top:1px solid var(--border,rgba(255,255,255,.12));flex-direction:column-reverse;gap:8px}.menu-modal-actions .menu-btn{width:100%;min-height:44px;font-size:15px;border-radius:12px}}
      @media(pointer:coarse){.menu-quick-item,.menu-custom-item{min-height:56px}.menu-modal-close{width:44px;height:44px}}
      @media(prefers-reduced-motion:reduce){.menu-quick-item,.menu-custom-item{transition:none!important;animation:none!important}.menu-quick-state,.menu-custom-state{transition:none!important;animation:none!important}}
    `; document.head.appendChild(s);
  }
  function ensureMarkup() {
    if (window.ZO2Y_CUSTOM_LIST_MODAL && typeof window.ZO2Y_CUSTOM_LIST_MODAL.ensureModals === 'function') { window.ZO2Y_CUSTOM_LIST_MODAL.ensureModals(); return; }
    let m = document.getElementById('itemMenuModal');
    if (!m) { m = document.createElement('div'); m.id = 'itemMenuModal'; m.className = 'menu-modal authenticated-only'; m.setAttribute('aria-hidden','true');
      m.innerHTML = `<div class="menu-modal-content"><div class="menu-modal-header"><h3 id="menuModalTitle">Add to List</h3><button class="menu-modal-close" id="closeMenuModalBtn" aria-label="Close">&times;</button></div><div class="menu-modal-body" id="menuModalBody"><div class="menu-quick-lists" id="menuQuickLists"></div><div class="menu-custom-section"><div class="menu-custom-header"><span>Your Custom Lists</span></div><div class="menu-custom-lists" id="menuCustomLists"></div></div></div></div>`; document.body.appendChild(m); }
  }
  function syncMenuModalViewport(m) {
    if (!m || !m.classList.contains('active')) return;
    const v = window.visualViewport;
    m.style.top = ((v?.offsetTop||0)+window.scrollY)+'px'; m.style.left = ((v?.offsetLeft||0)+window.scrollX)+'px';
    m.style.width = Math.max(0, Math.ceil(v?.width||window.innerWidth||document.documentElement.clientWidth||0))+'px';
    m.style.height = Math.max(0, Math.ceil(v?.height||window.innerHeight||document.documentElement.clientHeight||0))+'px';
  }
  function syncActiveMenuModalViewports() { syncMenuModalViewport(document.getElementById('itemMenuModal')); }
  function syncMenuModalBodyLock() {
    const m = document.getElementById('itemMenuModal'); const a = !!(m?.classList.contains('active'));
    if (a) { syncActiveMenuModalViewports(); document.body.style.overflow='hidden'; document.documentElement.style.overflow='hidden'; }
    else { document.body.style.overflow=''; document.documentElement.style.overflow=''; }
  }
  function closeItemMenuModal() {
    const m = document.getElementById('itemMenuModal'); const ae = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (m && ae && m.contains(ae)) try { ae.blur(); } catch(e) {}
    if (m) { m.classList.remove('active'); m.setAttribute('aria-hidden','true'); }
    STATE.pendingQuickKeys = new Set(); STATE.quickMutationVersions = {}; STATE.pendingCustomListIds = new Set(); STATE.customMutationVersion = 0;
    syncMenuModalBodyLock();
    if (_lastFocusedTrigger && typeof _lastFocusedTrigger.focus === 'function' && document.contains(_lastFocusedTrigger)) { setTimeout(()=>{ try{_lastFocusedTrigger.focus({preventScroll:true})}catch(e){try{_lastFocusedTrigger.focus()}catch(e2){}} }, 0); }
  }
  function closeAllItemMenuModals() { closeItemMenuModal(); }

  function renderItemMenuQuickLists() {
    const qc = document.getElementById('menuQuickLists'); if (!qc) return;
    if (!STATE.quickRows.length) { qc.innerHTML = '<div class="menu-empty">Lists are not available for this item.</div>'; DOM.quickContainer = qc; DOM.quickNodesByKey.clear(); return; }
    const nk = STATE.quickRows.map(r=>String(r?.key||'')).filter(Boolean);
    const same = DOM.quickContainer === qc && DOM.quickNodesByKey.size === nk.length && nk.every(k=>DOM.quickNodesByKey.has(k));
    if (!same) {
      DOM.quickContainer = qc; DOM.quickNodesByKey.clear();
      qc.innerHTML = STATE.quickRows.map(r=>`<button type="button" class="menu-quick-item" data-quick-key="${r.key}" aria-busy="false"><div class="menu-quick-left"><i class="${r.icon}"></i><span>${escapeHtml(r.label)}</span></div><span class="menu-quick-state"></span></button>`).join('');
      qc.querySelectorAll('.menu-quick-item').forEach(n=>{
        const key=String(n.getAttribute('data-quick-key')||'').trim(); if(!key) return;
        DOM.quickNodesByKey.set(key,n);
        const run=async()=>{
          if(STATE.pendingQuickKeys.has(key))return; STATE.pendingQuickKeys.add(key); renderItemMenuQuickLists();
          const u=await resolveAuthenticatedUser(); if(!u?.id){STATE.pendingQuickKeys.delete(key);renderItemMenuQuickLists();redirectToLogin();return;}
          const it=STATE.currentItem; if(!it){STATE.pendingQuickKeys.delete(key);renderItemMenuQuickLists();return;}
          const prev=!!STATE.quickStatus[key]; const next=!prev; animateQuickNode(key,next?'saved':'removed');
          const lk=STATE.quickRows.map(r=>r.key).filter(Boolean); const nv=Number(STATE.quickMutationVersions[key]||0)+1;
          STATE.quickMutationVersions[key]=nv; STATE.quickStatus[key]=next; writeCachedQuickStatus(it.itemId,STATE.quickStatus,lk); renderItemMenuQuickLists();
          void(async()=>{let sr=null;try{sr=await toggleDefaultListWithFallback(u,it,key,next)}catch(e){}
            if(Number(STATE.quickMutationVersions[key]||0)!==nv)return;
            if(!sr?.ok){STATE.quickStatus[key]=prev;animateQuickNode(key,'error')}else if(typeof sr.saved==='boolean'){STATE.quickStatus[key]=sr.saved}
            writeCachedQuickStatus(it.itemId,STATE.quickStatus,lk); STATE.pendingQuickKeys.delete(key); renderItemMenuQuickLists();
          })();
        };
        n.addEventListener('click',()=>void run()); n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();void run()}});
      });
    }
    STATE.quickRows.forEach(r=>{const k=String(r?.key||'').trim();const n=DOM.quickNodesByKey.get(k);if(!n)return;const a=!!STATE.quickStatus[k];const b=STATE.pendingQuickKeys.has(k);n.classList.toggle('active',a);n.setAttribute('aria-busy',b?'true':'false');if('disabled'in n)n.disabled=b;const sn=n.querySelector('.menu-quick-state');if(sn)sn.textContent=a?'Saved':'Add'});
  }
  function renderItemMenuCustomLists() {
    const cc=document.getElementById('menuCustomLists');const cs=cc?.closest('.menu-custom-section');if(!cc)return;
    if(!customListsEnabled()){if(cs)cs.style.display='none';cc.innerHTML='';return}
    if(cs)cs.style.display='';if(!getCurrentUser()?.id){cc.innerHTML='<div class="menu-empty">Sign in to use custom lists.</div>';return}
    if(!STATE.customLists.length){cc.innerHTML='<div class="menu-empty">No custom lists yet. Create one.</div>';return}
    const fb=getMediaListFallbackIcon();cc.innerHTML=STATE.customLists.map(l=>{const a=STATE.selectedCustomLists.has(l.id);const b=STATE.pendingCustomListIds.has(String(l.id||'').trim());return `<div class="menu-custom-item ${a?'active':''}" data-list-id="${l.id}" aria-busy="${b?'true':'false'}"><div class="menu-custom-left">${window.ListUtils?ListUtils.renderListIcon(l.icon,fb):'<i class="'+fb+'"></i>'}<span>${escapeHtml(l.title||'Custom List')}</span></div><span class="menu-custom-state">${b?'Syncing':(a?'Saved':'Add')}</span></div>`}).join('');
    cc.querySelectorAll('.menu-custom-item').forEach(n=>n.addEventListener('click',async()=>{const id=n.getAttribute('data-list-id');if(id)await toggleMenuCustomList(id)}));
  }
  async function refreshItemMenuQuickStatus() { const it=STATE.currentItem; if(!it) return; const lk=STATE.quickRows.map(r=>r.key).filter(Boolean); STATE.quickStatus=await getDefaultListStatusMap(it.itemId,lk); writeCachedQuickStatus(it.itemId,STATE.quickStatus,lk); }

  async function loadItemMenuData() {
    const it=STATE.currentItem; if(!it) return;
    STATE.quickRows=getQuickRowsForMenu(); STATE.pendingQuickKeys=new Set(); STATE.quickMutationVersions={}; STATE.pendingCustomListIds=new Set(); STATE.customMutationVersion=0;
    const lk=STATE.quickRows.map(r=>r.key).filter(Boolean); STATE.quickStatus=readCachedQuickStatus(it.itemId,lk);
    if(!STATE.customLists.length){STATE.customLists=readCachedCustomLists();STATE.selectedCustomLists=readCachedMembership(it.itemId)}
    renderItemMenuQuickLists(); renderItemMenuCustomLists();
    const u=await resolveAuthenticatedUser(); const mt=getMediaType();
    if(!customListsEnabled()){STATE.customLists=[];STATE.selectedCustomLists=new Set();renderItemMenuQuickLists();renderItemMenuCustomLists();return}
    if(!u?.id||!window.ListUtils){STATE.customLists=[];STATE.selectedCustomLists=new Set();renderItemMenuQuickLists();renderItemMenuCustomLists();return}
    const c=await ensureClient(); if(!c){STATE.customLists=[];STATE.selectedCustomLists=new Set();renderItemMenuQuickLists();renderItemMenuCustomLists();return}
    const[qs,ll]=await Promise.all([getDefaultListStatusMap(it.itemId,lk),customListsEnabled()?ListUtils.loadCustomLists(c,u.id,mt):[]]);
    STATE.quickStatus=qs; writeCachedQuickStatus(it.itemId,STATE.quickStatus,lk);
    STATE.customLists=Array.isArray(ll)?ll:[]; writeCachedCustomLists(STATE.customLists);
    const lids=STATE.customLists.map(l=>l.id).filter(Boolean);
    STATE.selectedCustomLists=customListsEnabled()?await ListUtils.loadCustomListMembership(c,u.id,mt,it.itemId,lids):new Set();
    writeCachedMembership(it.itemId,STATE.selectedCustomLists); renderItemMenuQuickLists(); renderItemMenuCustomLists();
  }

  async function toggleMenuCustomList(listId) {
    const it=STATE.currentItem;const u=await resolveAuthenticatedUser();if(!it||!u?.id||!window.ListUtils){redirectToLogin();return}
    const c=await ensureClient();if(!c)return;
    const nxt=new Set(STATE.selectedCustomLists);if(nxt.has(listId))nxt.delete(listId);else nxt.add(listId);
    const prv=new Set(STATE.selectedCustomLists);const sv=Number(STATE.customMutationVersion||0)+1;STATE.customMutationVersion=sv;
    STATE.pendingCustomListIds.add(String(listId||'').trim());STATE.selectedCustomLists=nxt;writeCachedMembership(it.itemId,STATE.selectedCustomLists);renderItemMenuCustomLists();
    void(async()=>{let ok=true;try{if(nxt.has(listId)){const p=buildCustomListPayload();const r=await ListUtils.addItemToList(c,u.id,getMediaType(),it.itemId,listId,p||undefined);if(!r)ok=false}else{await ListUtils.removeItemFromList(c,u.id,getMediaType(),it.itemId,listId)}}catch(e){ok=false}
      if(Number(STATE.customMutationVersion||0)!==sv)return;if(!ok){STATE.selectedCustomLists=prv;writeCachedMembership(it.itemId,STATE.selectedCustomLists)}
      STATE.pendingCustomListIds.delete(String(listId||'').trim());renderItemMenuCustomLists();
    })();
  }

  async function primeScopeCaches() {
    const sk=getScopeKey();const mt=getMediaType();const u=await resolveAuthenticatedUser();if(!sk||!mt||!u?.id)return;if(CACHE.primingScopes.has(sk))return;CACHE.primingScopes.add(sk);
    try{const c=await ensureClient();if(!c)return;const qr=getQuickRowsForMenu();const lk=qr.map(r=>r.key).filter(Boolean);
      const rv=_bridge&&typeof _bridge.getVisibleItemIds==='function'?_bridge.getVisibleItemIds():[];
      const vs=[...new Set((Array.isArray(rv)?rv:[]).map(id=>normalizeQueryableItemIdValue(id)).filter(id=>id!==null&&id!==undefined&&String(id??'').trim()))];
      const vks=new Set(vs.map(id=>String(id)));const dt=DEFAULT_TABLE_BY_MEDIA[mt];
      if(dt&&lk.length&&vs.length){const{data}=await c.from(dt.table).select(`${dt.itemField},list_type`).eq('user_id',u.id).in(dt.itemField,vs).in('list_type',lk);
        const sb=new Map();vs.forEach(id=>sb.set(String(id),buildBlankQuickStatus(lk))); (data||[]).forEach(r=>{const ik=String(r?.[dt.itemField]??'');const lt=String(r?.list_type||'');const cur=sb.get(ik);if(cur&&!(lt in cur))cur[lt]=true});
        sb.forEach((s,ik)=>writeCachedQuickStatus(ik,s,lk));}
      if(!window.ListUtils||!customListsEnabled())return;let cl=readCachedCustomLists();if(!cl.length){cl=await ListUtils.loadCustomLists(c,u.id,mt);writeCachedCustomLists(cl)}
      const cfg=ListUtils.getListConfig(mt);const lids=cl.map(l=>l.id).filter(Boolean);if(!cfg||!lids.length||!vs.length)return;
      const{data}=await c.from(cfg.itemsTable).select(`list_id,${cfg.itemIdField}`).in('list_id',lids).in(cfg.itemIdField,vs);
      const mb=new Map();vs.forEach(id=>mb.set(String(id),new Set()));(data||[]).forEach(r=>{const ik=String(r?.[cfg.itemIdField]??'');if(!vks.has(ik))return;if(!mb.has(ik))mb.set(ik,new Set());mb.get(ik).add(r.list_id)});
      mb.forEach((m,ik)=>writeCachedMembership(ik,m));
    }catch(e){}finally{CACHE.primingScopes.delete(sk)}
  }

  async function openItemMenuFromCard(card) {
    ensureStyles(); ensureMarkup();
    if (!_bridge || !card) return;
    _lastFocusedTrigger = card.querySelector('.menu-btn') || card;
    const item = getCardItem(card);
    if (!item || item.itemId === undefined || item.itemId === null || item.itemId === '') return;
    STATE.currentCard = card; STATE.currentItem = item;
    const mt = getMediaType(); if (!mt) return;
    STATE.quickRows = getQuickRowsForMenu(); const lk = STATE.quickRows.map(r=>r.key).filter(Boolean);
    STATE.quickStatus = readCachedQuickStatus(item.itemId, lk);
    STATE.pendingQuickKeys = new Set(); STATE.quickMutationVersions = {};
    STATE.customLists = readCachedCustomLists(); STATE.selectedCustomLists = readCachedMembership(item.itemId);
    STATE.pendingCustomListIds = new Set(); STATE.customMutationVersion = 0;
    const te = document.getElementById('menuModalTitle'); if (te) te.textContent = item.title || 'Add to List';
    renderItemMenuQuickLists(); renderItemMenuCustomLists();
    const im = document.getElementById('itemMenuModal');
    if (im) { 
      im.classList.add('active'); 
      im.setAttribute('aria-hidden','false');
      positionMenuModalNearTrigger(card);
      const c=im.querySelector('.menu-modal-content'); 
      if(c){c.classList.remove('menu-modal-fly-up');void c.offsetWidth;c.classList.add('menu-modal-fly-up')} 
    }
    syncMenuModalBodyLock(); void primeScopeCaches(); void loadItemMenuData();
  }

  function positionMenuModalNearTrigger(trigger) {
    const im = document.getElementById('itemMenuModal');
    const content = im?.querySelector('.menu-modal-content');
    if (content) {
      content.style.position = '';
      content.style.left = '';
      content.style.top = '';
      content.style.transform = '';
    }
    syncMenuModalViewport(im);
  }

  window.ListKit = {
    STATE, CACHE, DOM,
    setBridge: b => { _bridge = b; },
    getBridge: () => _bridge,
    QUICK_ROWS_BY_TYPE,
    DEFAULT_TABLE_BY_MEDIA,
    escapeHtml, getMediaType, getCurrentUser, getQuickRowsForMenu,
    getScopeKey, getScopeItemKey,
    normalizeItemIdValue, normalizeQueryableItemIdValue,
    buildBlankQuickStatus, cloneQuickStatus,
    readBridgeQuickStatus, readCachedQuickStatus, writeCachedQuickStatus,
    readCachedCustomLists, writeCachedCustomLists,
    readCachedMembership, writeCachedMembership,
    syncBridgeCurrentUser,
    ensureClient, resolveAuthenticatedUser, redirectToLogin, showSignInPrompt,
    customListsEnabled, getCardItem,
    toggleDefaultListWithFallback, getDefaultListStatusMap,
    maybeVibrate, animateQuickNode, notify,
    buildCustomListPayload,
    ensureStyles, ensureMarkup,
    syncMenuModalViewport, syncActiveMenuModalViewports, syncMenuModalBodyLock,
    closeItemMenuModal, closeAllItemMenuModals,
    renderItemMenuQuickLists, renderItemMenuCustomLists,
    refreshItemMenuQuickStatus, loadItemMenuData,
    toggleMenuCustomList, primeScopeCaches,
    openItemMenuFromCard
  };

  // ===================== ADAPTER-SPECIFIC =====================
  let _listenersBound = false;

  function delegate(conf) {
    if (window.ListKit) {
      window.ListKit.setBridge(conf);
    }
  }

  function init(config) {
    delegate(config);
    window.ListKit && window.ListKit.ensureStyles();
    window.ListKit && window.ListKit.ensureMarkup();
    _bindListeners();
    if (window.ListKit) {
      window.ListKit.primeScopeCaches();
    }
  }

  function _bindListeners() {
    if (_listenersBound) return;
    _listenersBound = true;
    document.getElementById('closeMenuModalBtn')?.addEventListener('click', () => window.ListKit && window.ListKit.closeAllItemMenuModals());
    const itemModal = document.getElementById('itemMenuModal');
    if (itemModal) {
      itemModal.addEventListener('click', (e) => { if (e.target === itemModal) window.ListKit && window.ListKit.closeAllItemMenuModals(); });
    }
    const body = document.body;
    if (body) {
      body.addEventListener('touchmove', (e) => {
        const im = document.getElementById('itemMenuModal');
        if (im && im.classList.contains('active') && im.contains(e.target)) e.preventDefault();
      }, { passive: false });
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.ListKit && window.ListKit.closeAllItemMenuModals(); });
  }

  window.initIndexStyleListMenu = init;
  window.openIndexStyleListMenu = (card) => { if (window.ListKit) window.ListKit.openItemMenuFromCard(card); };
  window.openItemMenuFromCard = (card) => { if (window.ListKit) window.ListKit.openItemMenuFromCard(card); };
})();
