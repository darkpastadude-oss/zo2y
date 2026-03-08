(function () {
  if (window.ZO2Y_REVIEW_INTERACTIONS) return;

  const STYLE_ID = 'zo2y-review-thread-style';
  const PROFILE_CACHE = new Map();

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(raw) {
    const date = new Date(raw || '');
    if (!Number.isFinite(date.getTime())) return 'unknown date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function unique(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
  }

  function notifyUser(notify, message, level) {
    if (typeof notify === 'function') {
      notify(message, level || 'info');
      return;
    }
    console[level === 'error' ? 'error' : 'log'](message);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .zo2y-review-thread {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .zo2y-review-thread-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .zo2y-review-thread-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        color: inherit;
        cursor: pointer;
        font: inherit;
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
      }
      .zo2y-review-thread-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 176, 32, 0.55);
        background: rgba(255, 176, 32, 0.09);
      }
      .zo2y-review-thread-btn.is-active {
        border-color: rgba(255, 176, 32, 0.85);
        background: rgba(255, 176, 32, 0.18);
        color: #ffd27a;
      }
      .zo2y-review-thread-form {
        display: none;
        margin-top: 12px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .zo2y-review-thread-form.is-open {
        display: block;
      }
      .zo2y-review-thread-form-meta {
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 0.86rem;
      }
      .zo2y-review-thread-textarea {
        width: 100%;
        min-height: 88px;
        resize: vertical;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(2, 8, 30, 0.55);
        color: inherit;
        padding: 12px 13px;
        font: inherit;
      }
      .zo2y-review-thread-textarea:focus {
        outline: none;
        border-color: rgba(255, 176, 32, 0.75);
        box-shadow: 0 0 0 3px rgba(255, 176, 32, 0.12);
      }
      .zo2y-review-thread-form-actions {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        margin-top: 10px;
      }
      .zo2y-review-thread-help {
        color: rgba(255, 255, 255, 0.62);
        font-size: 0.8rem;
      }
      .zo2y-review-thread-list {
        margin-top: 14px;
        display: grid;
        gap: 12px;
      }
      .zo2y-review-thread-list.is-empty {
        display: none;
      }
      .zo2y-review-reply {
        padding: 12px 13px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .zo2y-review-reply.is-depth-1,
      .zo2y-review-reply.is-depth-2,
      .zo2y-review-reply.is-depth-3,
      .zo2y-review-reply.is-depth-4,
      .zo2y-review-reply.is-depth-5 {
        margin-left: 18px;
      }
      .zo2y-review-reply-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .zo2y-review-reply-user {
        font-weight: 700;
      }
      .zo2y-review-reply-user a {
        color: inherit;
        text-decoration: none;
      }
      .zo2y-review-reply-user a:hover {
        text-decoration: underline;
      }
      .zo2y-review-reply-date {
        color: rgba(255, 255, 255, 0.62);
        font-size: 0.8rem;
        white-space: nowrap;
      }
      .zo2y-review-reply-body {
        margin: 0;
        color: inherit;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .zo2y-review-reply-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .zo2y-review-reply-children {
        margin-top: 12px;
        display: grid;
        gap: 10px;
      }
      @media (max-width: 760px) {
        .zo2y-review-thread-btn {
          min-height: 34px;
          padding: 7px 11px;
        }
        .zo2y-review-reply.is-depth-1,
        .zo2y-review-reply.is-depth-2,
        .zo2y-review-reply.is-depth-3,
        .zo2y-review-reply.is-depth-4,
        .zo2y-review-reply.is-depth-5 {
          margin-left: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function loadProfiles(supabaseClient, userIds) {
    const ids = unique(userIds).filter((id) => !PROFILE_CACHE.has(String(id).trim()));
    if (!supabaseClient || !ids.length) return;
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('id, username, full_name')
      .in('id', ids);
    if (error || !Array.isArray(data)) return;
    data.forEach((row) => {
      const id = String(row?.id || '').trim();
      if (!id) return;
      PROFILE_CACHE.set(id, {
        username: String(row?.username || '').trim(),
        fullName: String(row?.full_name || '').trim()
      });
    });
  }

  function resolveProfile(userId) {
    const key = String(userId || '').trim();
    const profile = PROFILE_CACHE.get(key);
    const username = String(profile?.username || '').trim();
    const fullName = String(profile?.fullName || '').trim();
    const displayName = username ? `@${username}` : (fullName || 'User');
    return {
      displayName,
      href: `profile.html?id=${encodeURIComponent(key)}`
    };
  }

  async function fetchThreadData(state) {
    const reviewIds = unique((state.reviews || []).map((review) => String(review?.id || '').trim()));
    if (!state.supabaseClient || !reviewIds.length) {
      return { reactions: [], replies: [] };
    }
    const [reactionResult, replyResult] = await Promise.all([
      state.supabaseClient
        .from('review_reactions')
        .select('id, review_source, review_id, target_type, target_id, user_id, reaction_type, created_at')
        .eq('review_source', state.reviewSource)
        .in('review_id', reviewIds),
      state.supabaseClient
        .from('review_replies')
        .select('id, review_source, review_id, parent_reply_id, user_id, body, created_at, updated_at')
        .eq('review_source', state.reviewSource)
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true })
    ]);

    return {
      reactions: Array.isArray(reactionResult?.data) ? reactionResult.data : [],
      replies: Array.isArray(replyResult?.data) ? replyResult.data : []
    };
  }

  function summarizeReactions(reactions, currentUserId, targetType, targetId) {
    const rows = (Array.isArray(reactions) ? reactions : []).filter((row) => (
      String(row?.target_type || '') === String(targetType || '')
      && String(row?.target_id || '') === String(targetId || '')
    ));
    return {
      likeCount: rows.filter((row) => row.reaction_type === 'like').length,
      dislikeCount: rows.filter((row) => row.reaction_type === 'dislike').length,
      myReaction: rows.find((row) => String(row?.user_id || '') === String(currentUserId || ''))?.reaction_type || ''
    };
  }

  function buildReplyChildren(replies) {
    const map = new Map();
    (Array.isArray(replies) ? replies : []).forEach((reply) => {
      const parentKey = String(reply?.parent_reply_id || '').trim() || 'root';
      if (!map.has(parentKey)) map.set(parentKey, []);
      map.get(parentKey).push(reply);
    });
    return map;
  }

  function getReviewIdFromCard(card, state) {
    if (!card) return '';
    const attr = String(state.reviewIdAttribute || 'data-review-id').trim();
    return String(card.getAttribute(attr) || card.dataset.reviewId || card.dataset.id || '').trim();
  }

  function renderActionButton(options) {
    const hasCount = options?.count !== '' && options?.count !== null && options?.count !== undefined;
    const count = hasCount ? Number(options?.count || 0) : 0;
    const active = !!options?.active;
    const icon = options?.icon || 'fa-message';
    const label = String(options?.label || '').trim();
    const buttonType = String(options?.type || 'button').trim() || 'button';
    const extraAttrs = Object.entries(options?.attrs || {})
      .map(([key, value]) => ` ${escapeHtml(key)}="${escapeHtml(value)}"`)
      .join('');
    return `
      <button class="zo2y-review-thread-btn${active ? ' is-active' : ''}" type="${escapeHtml(buttonType)}"${extraAttrs}>
        <i class="fas ${escapeHtml(icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(label)}</span>
        ${hasCount && Number.isFinite(count) ? `<span>${count}</span>` : ''}
      </button>
    `;
  }

  function renderReplyBranch(reviewId, parentReplyId, childrenMap, reactions, currentUserId, depth) {
    const parentKey = String(parentReplyId || '').trim() || 'root';
    const rows = childrenMap.get(parentKey) || [];
    if (!rows.length) return '';
    return rows.map((reply) => {
      const profile = resolveProfile(reply.user_id);
      const summary = summarizeReactions(reactions, currentUserId, 'reply', reply.id);
      const mine = String(reply?.user_id || '') === String(currentUserId || '');
      const childHtml = renderReplyBranch(reviewId, reply.id, childrenMap, reactions, currentUserId, depth + 1);
      return `
        <article class="zo2y-review-reply is-depth-${Math.min(depth, 5)}" data-reply-id="${escapeHtml(reply.id)}">
          <div class="zo2y-review-reply-head">
            <div class="zo2y-review-reply-user"><a href="${escapeHtml(profile.href)}">${escapeHtml(profile.displayName)}</a></div>
            <div class="zo2y-review-reply-date">${escapeHtml(formatDate(reply.created_at))}</div>
          </div>
          <p class="zo2y-review-reply-body">${escapeHtml(reply.body || '')}</p>
          <div class="zo2y-review-reply-actions">
            ${renderActionButton({
              icon: 'fa-thumbs-up',
              label: 'like',
              count: summary.likeCount,
              active: summary.myReaction === 'like',
              attrs: {
                'data-review-thread-action': 'react',
                'data-reaction-type': 'like',
                'data-target-type': 'reply',
                'data-target-id': reply.id,
                'data-review-id': reviewId
              }
            })}
            ${renderActionButton({
              icon: 'fa-thumbs-down',
              label: 'dislike',
              count: summary.dislikeCount,
              active: summary.myReaction === 'dislike',
              attrs: {
                'data-review-thread-action': 'react',
                'data-reaction-type': 'dislike',
                'data-target-type': 'reply',
                'data-target-id': reply.id,
                'data-review-id': reviewId
              }
            })}
            ${renderActionButton({
              icon: 'fa-reply',
              label: 'reply',
              count: '',
              attrs: {
                'data-review-thread-action': 'open-reply',
                'data-review-id': reviewId,
                'data-parent-reply-id': reply.id,
                'data-parent-display-name': profile.displayName
              }
            })}
            ${mine ? renderActionButton({
              icon: 'fa-trash',
              label: 'delete',
              count: '',
              attrs: {
                'data-review-thread-action': 'delete-reply',
                'data-reply-id': reply.id
              }
            }) : ''}
          </div>
          ${childHtml ? `<div class="zo2y-review-reply-children">${childHtml}</div>` : ''}
        </article>
      `;
    }).join('');
  }

  function buildThreadMarkup(review, state) {
    const summary = summarizeReactions(state.threadData.reactions, state.currentUserId, 'review', review.id);
    const childrenMap = buildReplyChildren(state.threadData.replies.filter((reply) => String(reply?.review_id || '') === String(review?.id || '')));
    const repliesHtml = renderReplyBranch(review.id, '', childrenMap, state.threadData.reactions, state.currentUserId, 0);
    return `
      <div class="zo2y-review-thread" data-review-id="${escapeHtml(review.id)}">
        <div class="zo2y-review-thread-actions">
          ${renderActionButton({
            icon: 'fa-thumbs-up',
            label: 'like',
            count: summary.likeCount,
            active: summary.myReaction === 'like',
            attrs: {
              'data-review-thread-action': 'react',
              'data-reaction-type': 'like',
              'data-target-type': 'review',
              'data-target-id': review.id,
              'data-review-id': review.id
            }
          })}
          ${renderActionButton({
            icon: 'fa-thumbs-down',
            label: 'dislike',
            count: summary.dislikeCount,
            active: summary.myReaction === 'dislike',
            attrs: {
              'data-review-thread-action': 'react',
              'data-reaction-type': 'dislike',
              'data-target-type': 'review',
              'data-target-id': review.id,
              'data-review-id': review.id
            }
          })}
          ${renderActionButton({
            icon: 'fa-reply',
            label: 'reply',
            count: unique(state.threadData.replies.filter((reply) => String(reply?.review_id || '') === String(review?.id || '')).map((reply) => reply.id)).length,
            attrs: {
              'data-review-thread-action': 'open-reply',
              'data-review-id': review.id,
              'data-parent-reply-id': '',
              'data-parent-display-name': ''
            }
          })}
        </div>
        <form class="zo2y-review-thread-form" data-review-reply-form data-review-id="${escapeHtml(review.id)}">
          <div class="zo2y-review-thread-form-meta" data-reply-target-label>replying to this review</div>
          <input type="hidden" name="review_id" value="${escapeHtml(review.id)}" />
          <input type="hidden" name="parent_reply_id" value="" />
          <textarea class="zo2y-review-thread-textarea" name="body" maxlength="1200" placeholder="write a reply..." required></textarea>
          <div class="zo2y-review-thread-form-actions">
            <span class="zo2y-review-thread-help">up to 1200 characters</span>
            <div class="zo2y-review-thread-actions">
              ${renderActionButton({
                icon: 'fa-paper-plane',
                label: 'post reply',
                count: '',
                type: 'submit',
                attrs: { 'data-review-thread-submit': '1' }
              })}
              ${renderActionButton({
                icon: 'fa-xmark',
                label: 'cancel',
                count: '',
                attrs: { 'data-review-thread-action': 'cancel-reply' }
              })}
            </div>
          </div>
        </form>
        <div class="zo2y-review-thread-list${repliesHtml ? '' : ' is-empty'}">${repliesHtml}</div>
      </div>
    `;
  }

  function renderThreads(state) {
    const cards = state.container.querySelectorAll(state.cardSelector || '.review-card');
    const reviewMap = new Map((state.reviews || []).map((review) => [String(review?.id || '').trim(), review]));
    cards.forEach((card) => {
      const reviewId = getReviewIdFromCard(card, state);
      if (!reviewId || !reviewMap.has(reviewId)) return;
      const existing = card.querySelector('.zo2y-review-thread');
      if (existing) existing.remove();
      const host = document.createElement('div');
      host.innerHTML = buildThreadMarkup(reviewMap.get(reviewId), state);
      const node = host.firstElementChild;
      if (node) card.appendChild(node);
    });
  }

  async function refreshState(state) {
    state.threadData = await fetchThreadData(state);
    await loadProfiles(
      state.supabaseClient,
      state.threadData.replies.map((reply) => String(reply?.user_id || '').trim())
    );
    renderThreads(state);
  }

  async function toggleReaction(state, payload) {
    if (!state.currentUserId) {
      notifyUser(state.notify, 'please sign in to react', 'info');
      return;
    }
    const existing = (state.threadData.reactions || []).find((row) => (
      String(row?.user_id || '') === String(state.currentUserId || '')
      && String(row?.target_type || '') === String(payload.targetType || '')
      && String(row?.target_id || '') === String(payload.targetId || '')
    ));
    let error = null;
    if (existing && existing.reaction_type === payload.reactionType) {
      ({ error } = await state.supabaseClient
        .from('review_reactions')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', state.currentUserId));
    } else if (existing) {
      ({ error } = await state.supabaseClient
        .from('review_reactions')
        .update({ reaction_type: payload.reactionType, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', state.currentUserId));
    } else {
      ({ error } = await state.supabaseClient
        .from('review_reactions')
        .insert({
          review_source: state.reviewSource,
          media_type: state.mediaType || null,
          review_id: payload.reviewId,
          target_type: payload.targetType,
          target_id: payload.targetId,
          user_id: state.currentUserId,
          reaction_type: payload.reactionType
        }));
    }
    if (error) {
      notifyUser(state.notify, 'could not update reaction', 'error');
      return;
    }
    await refreshState(state);
  }

  function openReplyForm(button, state) {
    if (!state.currentUserId) {
      notifyUser(state.notify, 'please sign in to reply', 'info');
      return;
    }
    const thread = button.closest('.zo2y-review-thread');
    const form = thread?.querySelector('[data-review-reply-form]');
    if (!thread || !form) return;
    form.classList.add('is-open');
    const reviewId = String(button.getAttribute('data-review-id') || '').trim();
    const parentReplyId = String(button.getAttribute('data-parent-reply-id') || '').trim();
    const displayName = String(button.getAttribute('data-parent-display-name') || '').trim();
    const reviewInput = form.querySelector('input[name="review_id"]');
    const parentInput = form.querySelector('input[name="parent_reply_id"]');
    const label = form.querySelector('[data-reply-target-label]');
    const textarea = form.querySelector('textarea[name="body"]');
    if (reviewInput) reviewInput.value = reviewId;
    if (parentInput) parentInput.value = parentReplyId;
    if (label) {
      label.textContent = parentReplyId && displayName
        ? `replying to ${displayName}`
        : 'replying to this review';
    }
    if (textarea) textarea.focus();
  }

  function closeReplyForm(trigger) {
    const thread = trigger.closest('.zo2y-review-thread');
    const form = thread?.querySelector('[data-review-reply-form]');
    if (!form) return;
    form.reset();
    form.classList.remove('is-open');
    const parentInput = form.querySelector('input[name="parent_reply_id"]');
    if (parentInput) parentInput.value = '';
    const label = form.querySelector('[data-reply-target-label]');
    if (label) label.textContent = 'replying to this review';
  }

  async function submitReply(form, state) {
    if (!state.currentUserId) {
      notifyUser(state.notify, 'please sign in to reply', 'info');
      return;
    }
    const reviewId = String(form.querySelector('input[name="review_id"]')?.value || '').trim();
    const parentReplyId = String(form.querySelector('input[name="parent_reply_id"]')?.value || '').trim();
    const body = String(form.querySelector('textarea[name="body"]')?.value || '').trim();
    if (!reviewId || !body) {
      notifyUser(state.notify, 'write a reply first', 'info');
      return;
    }
    const { error } = await state.supabaseClient
      .from('review_replies')
      .insert({
        review_source: state.reviewSource,
        media_type: state.mediaType || null,
        review_id: reviewId,
        parent_reply_id: parentReplyId || null,
        user_id: state.currentUserId,
        body
      });
    if (error) {
      notifyUser(state.notify, 'could not post reply', 'error');
      return;
    }
    form.reset();
    form.classList.remove('is-open');
    notifyUser(state.notify, 'reply posted', 'success');
    await refreshState(state);
  }

  async function deleteReply(replyId, state) {
    if (!state.currentUserId) {
      notifyUser(state.notify, 'please sign in', 'info');
      return;
    }
    if (!window.confirm('delete this reply?')) return;
    const { error } = await state.supabaseClient
      .from('review_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', state.currentUserId);
    if (error) {
      notifyUser(state.notify, 'could not delete reply', 'error');
      return;
    }
    notifyUser(state.notify, 'reply deleted', 'success');
    await refreshState(state);
  }

  function bindEvents(container) {
    if (container.dataset.reviewThreadBound === '1') return;
    container.dataset.reviewThreadBound = '1';

    container.addEventListener('click', async (event) => {
      const state = container.__zo2yReviewThreadState;
      if (!state) return;
      const button = event.target.closest('[data-review-thread-action]');
      if (!button || !container.contains(button)) return;
      const action = String(button.getAttribute('data-review-thread-action') || '').trim();
      if (action === 'react') {
        event.preventDefault();
        await toggleReaction(state, {
          reactionType: String(button.getAttribute('data-reaction-type') || '').trim(),
          targetType: String(button.getAttribute('data-target-type') || '').trim(),
          targetId: String(button.getAttribute('data-target-id') || '').trim(),
          reviewId: String(button.getAttribute('data-review-id') || '').trim()
        });
        return;
      }
      if (action === 'open-reply') {
        event.preventDefault();
        openReplyForm(button, state);
        return;
      }
      if (action === 'cancel-reply') {
        event.preventDefault();
        closeReplyForm(button);
        return;
      }
      if (action === 'delete-reply') {
        event.preventDefault();
        await deleteReply(String(button.getAttribute('data-reply-id') || '').trim(), state);
      }
    });

    container.addEventListener('submit', async (event) => {
      const state = container.__zo2yReviewThreadState;
      const form = event.target.closest('[data-review-reply-form]');
      if (!state || !form) return;
      event.preventDefault();
      await submitReply(form, state);
    });
  }

  async function mount(config) {
    ensureStyles();
    const state = {
      container: config?.container || null,
      reviews: Array.isArray(config?.reviews) ? config.reviews : [],
      reviewSource: String(config?.reviewSource || '').trim(),
      mediaType: String(config?.mediaType || '').trim(),
      currentUserId: String(config?.currentUser?.id || config?.currentUserId || '').trim(),
      supabaseClient: config?.supabaseClient || null,
      notify: config?.notify || null,
      cardSelector: String(config?.cardSelector || '.review-card').trim(),
      reviewIdAttribute: String(config?.reviewIdAttribute || 'data-review-id').trim(),
      threadData: { reactions: [], replies: [] }
    };

    if (!state.container || !state.reviewSource || !state.supabaseClient) return;
    state.threadData = await fetchThreadData(state);
    await loadProfiles(
      state.supabaseClient,
      state.threadData.replies.map((reply) => String(reply?.user_id || '').trim())
    );
    state.container.__zo2yReviewThreadState = state;
    bindEvents(state.container);
    renderThreads(state);
  }

  window.ZO2Y_REVIEW_INTERACTIONS = { mount };
})();
