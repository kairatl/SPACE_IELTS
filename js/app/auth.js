/**
 * Supabase auth: sign in, sign up, sign out, and route protection.
 * Uses credentials from supabase.config.js via supabase-browser.js.
 */
import { getSupabaseBrowserClientAsync } from './supabase-browser.js';
import { validatePassword } from './password-validation.js';

/** Lessons / dashboard entry (post-login redirect). */
export const LESSONS_DASHBOARD_URL = 'writing-grammar';

export function reportAuthError(error) {
    const msg = error && error.message ? String(error.message) : '';
    if (
        /already been registered|already registered|User already|already exists|duplicate/i.test(
            msg
        ) ||
        error?.code === 'user_already_exists'
    ) {
        alert(
            'This email is already registered. Try logging in instead.'
        );
        return;
    }
    if (
        /invalid login|invalid credentials|email not confirmed|Email not confirmed/i.test(msg)
    ) {
        alert(
            msg.includes('confirm') || msg.includes('confirmed')
                ? 'Please verify your email before signing in. Check your inbox.'
                : 'Invalid email or password. Try again.'
        );
        return;
    }
    if (
        !navigator.onLine ||
        /network|fetch|Failed to fetch|Load failed|ECONNREFUSED/i.test(msg) ||
        error?.name === 'AuthRetryableFetchError'
    ) {
        alert('Network error. Check your connection and try again.');
        return;
    }
    alert(msg || 'Something went wrong. Please try again.');
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function signUpWithEmail(email, password) {
    const pw = validatePassword(password);
    if (!pw.ok) {
        alert(pw.message);
        return { ok: false };
    }

    const supabase = await getSupabaseBrowserClientAsync();
    if (!supabase) {
        alert(
            'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Environment Variables.'
        );
        return { ok: false };
    }

    const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
    });

    if (error) {
        reportAuthError(error);
        return { ok: false };
    }

    return { ok: true };
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function signInWithEmail(email, password) {
    const supabase = await getSupabaseBrowserClientAsync();
    if (!supabase) {
        alert(
            'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Environment Variables.'
        );
        return { ok: false };
    }

    if (!email || !password) {
        alert('Enter your email and password.');
        return { ok: false };
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: String(email).trim(),
        password: String(password),
    });

    if (error) {
        reportAuthError(error);
        return { ok: false };
    }

    return { ok: true };
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function signOutUser() {
    const supabase = await getSupabaseBrowserClientAsync();
    if (!supabase) {
        return { ok: false };
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
        reportAuthError(error);
        return { ok: false };
    }
    return { ok: true };
}

/** Alias for `signOutUser` (log out). */
export const logout = signOutUser;

/**
 * Redirects to `redirectUrl` if there is no active session (protected routes).
 */
export async function assertAuthenticatedOrRedirect(redirectUrl = 'index') {
    const supabase = await getSupabaseBrowserClientAsync();
    if (!supabase) {
        window.location.replace(redirectUrl);
        return;
    }

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error || !session) {
        window.location.replace(redirectUrl);
    }
}

/**
 * On the lessons page, send the user home if they sign out (e.g. another tab).
 */
export function watchAuthAndRedirectOnSignOut(redirectUrl = 'index') {
    (async () => {
        const supabase = await getSupabaseBrowserClientAsync();
        if (!supabase) return;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                window.location.replace(redirectUrl);
            }
        });

        window.addEventListener('beforeunload', () => {
            subscription.unsubscribe();
        });
    })();
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-modal-open');
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-modal-open');
    const emailInput = modal.querySelector('input[name="email"]');
    if (emailInput) emailInput.focus();
}

function initLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;

    const form = document.getElementById('login-form');
    const openers = document.querySelectorAll('[data-open-login]');
    const closers = modal.querySelectorAll('[data-close-login]');

    openers.forEach((btn) => {
        btn.addEventListener('click', () => {
            form?.reset();
            openLoginModal();
        });
    });

    closers.forEach((el) => {
        el.addEventListener('click', closeLoginModal);
    });

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLoginModal();
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const email = fd.get('email');
        const password = fd.get('password');
        if (typeof email !== 'string' || typeof password !== 'string') return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const result = await signInWithEmail(email, password);
            if (result.ok) {
                closeLoginModal();
                window.location.href = LESSONS_DASHBOARD_URL;
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

function initLogoutButtons() {
    document.querySelectorAll('[data-logout]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            await signOutUser();
            const onLessons = /\/writing-grammar(?:\.html)?$/i.test(
                window.location.pathname || ''
            );
            if (onLessons) {
                window.location.href = 'index';
            }
        });
    });
}

/**
 * Toggle index nav: guest (Login / Sign up) vs signed-in (Lessons / profile menu).
 * Supports pages with only `[data-auth-user]` (no guest block).
 */
async function initNavAuthState() {
    const guest = document.querySelector('[data-auth-guest]');
    const user = document.querySelector('[data-auth-user]');
    if (!user) return;

    const supabase = await getSupabaseBrowserClientAsync();
    if (!supabase) {
        if (guest) {
            guest.hidden = false;
            user.hidden = true;
        }
        return;
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const label = document.querySelector('[data-profile-label]');
    const avatar = document.querySelector('[data-profile-avatar]');
    if (session?.user?.email) {
        const email = session.user.email;
        const short = email.split('@')[0] || email;
        if (label) label.textContent = short;
        if (avatar) avatar.textContent = (short.charAt(0) || '?').toUpperCase();
    }

    if (session) {
        if (guest) guest.hidden = true;
        user.hidden = false;
    } else {
        if (guest) {
            guest.hidden = false;
            user.hidden = true;
        } else {
            user.hidden = true;
        }
    }
}

function initProfileDropdown() {
    const triggers = document.querySelectorAll('[data-profile-trigger]');
    if (!triggers.length) return;

    function closeAll() {
        document.querySelectorAll('[data-profile-dropdown]').forEach((menu) => {
            menu.hidden = true;
        });
        triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    }

    triggers.forEach((trigger) => {
        const wrap = trigger.closest('[data-nav-profile]');
        const dropdown = wrap?.querySelector('[data-profile-dropdown]');
        if (!dropdown) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = dropdown.hidden;
            closeAll();
            if (willOpen) {
                dropdown.hidden = false;
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
}

function initAuthUi() {
    initLoginModal();
    initLogoutButtons();
    initNavAuthState();
    initProfileDropdown();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUi);
} else {
    initAuthUi();
}
