    (async function () {
      const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdma2hqYnp0YXlqeW9qc2dkcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTYyNjQsImV4cCI6MjA3NTY3MjI2NH0.WUb2yDAwCeokdpWCPeH13FE8NhWF6G8e6ivTsgu6b2s';
      const STORAGE_KEY = 'zo2y-auth-v1';
      const statusText = document.getElementById('statusText');
      const errorText = document.getElementById('errorText');
      const debugConsole = document.getElementById('debugConsole');

      function safeGetAuthStorage(key) {
        try {
          const sessionValue = window.sessionStorage ? window.sessionStorage.getItem(key) : null;
          if (sessionValue !== null && sessionValue !== undefined && sessionValue !== '') return sessionValue;
        } catch (_err) {}
        try {
          return window.localStorage ? window.localStorage.getItem(key) : null;
        } catch (_err) {
          return null;
        }
      }

      function safeRemoveAuthStorage(key) {
        try {
          if (window.sessionStorage) window.sessionStorage.removeItem(key);
        } catch (_err) {}
        try {
          if (window.localStorage) window.localStorage.removeItem(key);
        } catch (_err) {}
      }

      function safeSetAuthStorage(key, value) {
        try {
          if (window.sessionStorage) {
            window.sessionStorage.setItem(key, value);
          }
        } catch (_err) {}
        try {
          if (window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch (_err) {}
      }

      function persistSessionSnapshot(session) {
        if (!session || typeof session !== 'object') return false;
        try {
          const payload = JSON.stringify({ currentSession: session });
          safeSetAuthStorage(STORAGE_KEY, payload);
          return true;
        } catch (_err) {
          return false;
        }
      }

      const params = new URLSearchParams(window.location.search);
      const storedNext = safeGetAuthStorage('postAuthRedirect');
      const next = sanitizeNextPath(params.get('next') || storedNext || 'index.html');
      const flowParam = String(params.get('flow') || '').trim().toLowerCase();
      const referralUtils = window.ZO2Y_REFERRALS || null;
      const activeReferral = referralUtils ? referralUtils.captureReferralFromLocation(window.location.search) : '';
      const debugEnabled = window.location.search.includes('debug=true');
      if (debugEnabled) debugConsole.classList.add('show');

      function log(msg, isError = false) {
        console.log(msg);
        if (debugEnabled) {
          const line = document.createElement('div');
          line.className = isError ? 'debug-line debug-error' : 'debug-line';
          line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
          debugConsole.appendChild(line);
          debugConsole.scrollTop = debugConsole.scrollHeight;
        }
      }

      function sendAnalyticsEvent(eventName, properties = {}) {
        const payload = {
          event: String(eventName || '').trim().toLowerCase(),
          properties,
          context: {
            page_url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer || '',
            user_agent: navigator.userAgent || ''
          }
        };
        if (!payload.event) return;
        try {
          const body = JSON.stringify(payload);
          if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            if (navigator.sendBeacon('/api/analytics/track', blob)) return;
          }
          void fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true
          }).catch(() => {});
        } catch (_err) {}
      }

      function sanitizeNextPath(raw) {
        const value = String(raw || '').trim();
        if (!value) return 'index.html';
        if (/^https?:\/\//i.test(value) || value.startsWith('//')) return 'index.html';
        if (value.startsWith('/')) return value.slice(1) || 'index.html';
        return value;
      }

      function getHashParams() {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
        return new URLSearchParams(hash);
      }

      function decodeJwtPayload(token) {
        try {
          const parts = String(token || '').split('.');
          if (parts.length < 2) return null;
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
          return JSON.parse(atob(padded));
        } catch (_err) {
          return null;
        }
      }

      async function waitForTokenClockSkew(accessToken) {
        const payload = decodeJwtPayload(accessToken);
        const issuedAt = Number(payload?.iat || 0);
        if (!issuedAt) return;
        const now = Math.floor(Date.now() / 1000);
        const skewSeconds = issuedAt - now;
        if (skewSeconds <= 1) return;
        const waitMs = Math.min(6000, (skewSeconds + 1) * 1000);
        log(`Token clock skew detected (${skewSeconds}s). Waiting ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      function buildSessionFromHashTokens(accessToken, refreshToken, hashParams) {
        const payload = decodeJwtPayload(accessToken);
        if (!payload?.sub || !accessToken || !refreshToken) return null;
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: String(hashParams?.get('token_type') || 'bearer').trim() || 'bearer',
          expires_at: Number(hashParams?.get('expires_at') || payload?.exp || 0) || null,
          expires_in: Number(hashParams?.get('expires_in') || 0) || null,
          user: {
            id: String(payload.sub || '').trim(),
            aud: payload.aud,
            role: payload.role,
            email: payload.email || '',
            phone: payload.phone || '',
            app_metadata: payload.app_metadata || {},
            user_metadata: payload.user_metadata || {},
            session_id: payload.session_id || '',
            is_anonymous: payload.is_anonymous === true
          }
        };
      }

      const RESERVED_USERNAMES = new Set([
        'admin', 'api', 'app', 'auth', 'authcallback', 'blog', 'book', 'books',
        'country', 'edit', 'explore', 'game', 'games', 'help', 'home', 'index',
        'login', 'movie', 'movies', 'music', 'new', 'privacy', 'profile',
        'resetpassword', 'reviews', 'search', 'settings', 'signup', 'support',
        'terms', 'travel', 'tv', 'tvshow', 'tvshows', 'updatepassword', 'user',
        'users', 'zo2y'
      ]);

      function cleanUsername(value) {
        const base = String(value || '')
          .trim()
          .replace(/^@+/, '')
          .toLowerCase()
          .replace(/[\u0027\u2019]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 30);
        if (!base) return 'user';
        if (base.length < 3) return cleanUsername(`user_${base}`);
        if (RESERVED_USERNAMES.has(base.replace(/_/g, ''))) return `${base.slice(0, 24)}_user`.slice(0, 30);
        return base;
      }

      function usernameWithSuffix(base, suffix) {
        const normalizedSuffix = cleanUsername(suffix).slice(0, 8) || 'user';
        const limit = Math.max(3, 30 - normalizedSuffix.length - 1);
        return `${base.slice(0, limit)}_${normalizedSuffix}`;
      }

      async function waitForVerifiedUser(client, accessTokenHint = '') {
        let refreshAttempted = false;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const { data: sessionData } = await client.auth.getSession();
          const session = sessionData?.session || null;
          if (!session) {
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 300));
              continue;
            }
            return null;
          }

          const { data: userData, error: userError } = await client.auth.getUser();
          if (!userError && userData?.user) return userData.user;

          const errorMessage = String(userError?.message || '').toLowerCase();
          const invalidSession =
            userError?.status === 401 ||
            errorMessage.includes('jwt') ||
            errorMessage.includes('token') ||
            errorMessage.includes('session') ||
            errorMessage.includes('unauthorized');
          const futureIssued =
            errorMessage.includes('issued in the future') ||
            errorMessage.includes('clock for skew') ||
            errorMessage.includes('clock skew');

          if (futureIssued) {
            await waitForTokenClockSkew(accessTokenHint || session?.access_token || '');
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 350));
              continue;
            }
          }

          if (invalidSession) {
            if (!refreshAttempted) {
              refreshAttempted = true;
              const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
              if (!refreshError && refreshed?.session?.user) return refreshed.session.user;
            }
          }

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
        return null;
      }

      async function ensureSessionStored(client, timeoutMs = 8000) {
        const startedAt = Date.now();
        while ((Date.now() - startedAt) < timeoutMs) {
          const { data: sessionData } = await client.auth.getSession();
          const session = sessionData?.session || null;
          if (session?.access_token && session?.refresh_token) return session;
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        return null;
      }

      function getOnboardingPendingKey(userId) {
        return `zo2y_onboarding_pending_v1_${String(userId || '').trim()}`;
      }

      async function ensureUserProfile(client, user) {
        try {
          log('Checking if profile exists...');
          const { data: existingProfile, error: checkError } = await client
            .from('user_profiles')
            .select('id, username, full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (existingProfile) {
            log(`Profile found: ${existingProfile.username || '(no username)'}`);
            const existingUsername = cleanUsername(existingProfile.username || '');
            const needsUsernameRepair = !existingProfile.username || existingUsername !== existingProfile.username;
            const existingDisplayName = String(existingProfile.full_name || '').trim();
            if (!needsUsernameRepair && existingDisplayName) {
              return { ok: true, created: false };
            }

            const userData = user.user_metadata || {};
            const emailPrefix = String(user.email || '').split('@')[0] || 'user';
            const repairedUsername = cleanUsername(
              existingProfile.username ||
              userData.preferred_username ||
              userData.user_name ||
              userData.full_name ||
              userData.name ||
              emailPrefix
            );
            const repairedDisplayName = String(existingProfile.full_name || userData.full_name || userData.name || emailPrefix || repairedUsername).slice(0, 80);
            const { error: repairError } = await client
              .from('user_profiles')
              .update({
                username: repairedUsername,
                full_name: repairedDisplayName || repairedUsername,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (repairError) {
              log(`Profile repair warning: ${repairError.message}`, true);
            } else {
              log(`Profile normalized: ${repairedUsername}`);
            }
            return { ok: true, created: false };
          }

          if (checkError) {
            log(`Profile lookup warning: ${checkError.message}`, true);
          }

          const userData = user.user_metadata || {};
          const emailPrefix = String(user.email || '').split('@')[0] || 'user';
          const baseUsername = cleanUsername(
            userData.preferred_username ||
            userData.user_name ||
            userData.full_name ||
            userData.name ||
            emailPrefix
          );
          const displayName = String(userData.full_name || userData.name || emailPrefix || baseUsername).slice(0, 80);
          const idSuffix = String(user.id || '').replace(/-/g, '').slice(0, 6) || 'user';
          const usernameCandidates = [
            baseUsername,
            usernameWithSuffix(baseUsername, idSuffix),
            usernameWithSuffix(baseUsername, `${idSuffix}${Date.now().toString().slice(-2)}`)
          ];

          for (const username of usernameCandidates) {
            const profileData = {
              id: user.id,
              username,
              full_name: displayName || username
            };

            const { error: createError } = await client
              .from('user_profiles')
              .insert([profileData]);

            if (!createError) {
              log(`Profile created with username: ${username}`);
              return { ok: true, created: true };
            }

            const createMessage = String(createError.message || '').toLowerCase();
            const maybeDuplicate = createMessage.includes('duplicate') || createMessage.includes('unique');
            if (!maybeDuplicate) {
              log(`Profile creation error: ${createError.message}`, true);
              return { ok: false, created: false };
            }

            const { data: raceProfile } = await client
              .from('user_profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();

            if (raceProfile?.id) {
              log('Profile already created by another request.');
              return { ok: true, created: false };
            }
          }

          log('Could not create a unique username for profile.', true);
          return { ok: false, created: false };
        } catch (error) {
          log(`Profile setup error: ${error.message}`, true);
          return { ok: false, created: false };
        }
      }

      async function triggerWelcomeEmail(session, flow, logFn) {
        const accessToken = String(session?.access_token || '').trim();
        if (!accessToken) {
          logFn('Skipping welcome email trigger: missing session access token.', true);
          return;
        }

        try {
          const response = await fetch('/api/emails/welcome/trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              appUrl: window.location.origin,
              flow: flow || null
            })
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            logFn(`Welcome email trigger failed: ${payload?.message || response.status}`, true);
            return;
          }

          if (payload?.status === 'sent') {
            logFn('Welcome email sent.');
          } else {
            logFn('Welcome email already sent earlier.');
          }
        } catch (error) {
          logFn(`Welcome email trigger error: ${error.message}`, true);
        }
      }

      async function persistReferralMetadata(client, user, flow, logFn) {
        const referral = activeReferral || (referralUtils ? referralUtils.getStoredReferral() : '');
        const safeReferral = String(referral || '').trim().toLowerCase();
        if (!safeReferral || !user?.id) return;
        if (String(user?.user_metadata?.referred_by_username || '').trim().toLowerCase() === safeReferral) {
          if (referralUtils) referralUtils.markReferralConsumed(user.id, safeReferral);
          return;
        }
        if (referralUtils && referralUtils.getConsumedReferral(user.id) === safeReferral) return;
        try {
          const { error } = await client.auth.updateUser({
            data: {
              referred_by_username: safeReferral
            }
          });
          if (error) {
            logFn(`Referral metadata sync skipped: ${error.message}`, true);
            return;
          }
          if (referralUtils) referralUtils.markReferralConsumed(user.id, safeReferral);
          sendAnalyticsEvent('referral_captured', {
            flow: flow || 'unknown',
            referral_username: safeReferral
          }, true);
          logFn(`Referral saved from @${safeReferral}.`);
        } catch (error) {
          logFn(`Referral metadata sync failed: ${error.message}`, true);
        }
      }

      try {
        log('Initializing auth callback...');
        if (!window.supabase || !window.supabase.createClient) {
          throw new Error('Auth library unavailable');
        }

        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            storageKey: STORAGE_KEY,
            persistSession: true,
            autoRefreshToken: true,
            // Handle callback tokens manually so we can tolerate small mobile clock skew.
            detectSessionInUrl: false
          }
        });

        const oauthFlow = flowParam || String(safeGetAuthStorage('oauthFlow') || '').trim().toLowerCase();
        const oauthError = params.get('error_description') || params.get('error');
        if (oauthError) {
          sendAnalyticsEvent('oauth_callback_error', {
            flow: oauthFlow || 'unknown',
            message: String(oauthError).slice(0, 180)
          });
          throw new Error(oauthError);
        }

        const code = params.get('code');
        const hashParams = getHashParams();
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        let exchangeError = null;
        let resolvedSession = null;
        const manualHashSession = buildSessionFromHashTokens(accessToken, refreshToken, hashParams);

        if (code) {
          statusText.textContent = 'Finalizing secure sign-in...';
          log('Auth code found, exchanging for session...');
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (data?.session?.access_token && data?.session?.refresh_token) {
            resolvedSession = data.session;
            persistSessionSnapshot(data.session);
            await client.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            }).catch(() => {});
          }
          if (error) {
            exchangeError = error;
            log(`Exchange warning: ${error.message}`, true);
          }
        } else if (accessToken && refreshToken) {
          statusText.textContent = 'Finalizing secure sign-in...';
          log('Token hash found, setting session...');
          await waitForTokenClockSkew(accessToken);
          const { data, error } = await client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (error) throw error;
          if (data?.session?.access_token && data?.session?.refresh_token) {
            resolvedSession = data.session;
            persistSessionSnapshot(data.session);
          }
        } else {
          log('No code/hash provided, verifying existing session...');
        }

        const storedSession = resolvedSession || await ensureSessionStored(client);
        const finalSession = storedSession || manualHashSession;
        if (!finalSession) {
          if (exchangeError) throw exchangeError;
          throw new Error('Authentication was not completed. Please sign in again.');
        }
        persistSessionSnapshot(finalSession);

        await waitForTokenClockSkew(finalSession?.access_token || accessToken || '');
        const user = await waitForVerifiedUser(client, finalSession?.access_token || accessToken || '');
        if (!user) {
          if (oauthFlow === 'login' && finalSession?.user?.id) {
            log('Verified user fetch still pending. Continuing with manual session bootstrap for login.');
            statusText.textContent = 'Success! Redirecting...';
            safeRemoveAuthStorage('postAuthRedirect');
            safeRemoveAuthStorage('oauthFlow');
            setTimeout(() => {
              window.location.replace(next);
            }, 500);
            return;
          }
          throw new Error('Authentication was not completed. Please sign in again.');
        }

        log(`Authenticated user: ${user.id}`);
        statusText.textContent = 'Setting up your profile...';
        const profileResult = await ensureUserProfile(client, user);
        if (profileResult?.created) {
          localStorage.setItem(getOnboardingPendingKey(user.id), '1');
        }

        statusText.textContent = 'Finishing setup...';
        await persistReferralMetadata(client, user, oauthFlow, log);
        await triggerWelcomeEmail(finalSession, oauthFlow, log);

        sendAnalyticsEvent('oauth_callback_success', {
          flow: oauthFlow || 'unknown',
          created_profile: !!profileResult?.created,
          next
        });
        if (oauthFlow === 'signup') {
          sendAnalyticsEvent('signup_success', {
            method: 'google',
            created_profile: !!profileResult?.created
          });
        } else if (oauthFlow === 'login') {
          sendAnalyticsEvent('login_success', {
            method: 'google'
          });
        }

        statusText.textContent = 'Success! Redirecting...';
        safeRemoveAuthStorage('postAuthRedirect');
        safeRemoveAuthStorage('oauthFlow');
        log(`Redirecting to: ${next}`);
        setTimeout(() => {
          window.location.replace(next);
        }, 800);
      } catch (err) {
        const msg = (err && err.message) ? err.message : 'Authentication failed';
        const oauthFlow = flowParam || String(safeGetAuthStorage('oauthFlow') || '').trim().toLowerCase();
        sendAnalyticsEvent('oauth_callback_error', {
          flow: oauthFlow || 'unknown',
          message: String(msg).slice(0, 180)
        });
        log(`Fatal error: ${msg}`, true);
        statusText.textContent = 'Could not complete authentication.';
        errorText.textContent = msg;
        errorText.style.display = 'block';
        setTimeout(() => {
          window.location.replace('login.html');
        }, 2500);
      }
    })();
