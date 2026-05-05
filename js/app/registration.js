import { signUpWithEmail } from './auth.js';
import { getSupabaseBrowserClientAsync } from './supabase-browser.js';

function initRegistrationModal() {
    const modal = document.getElementById('signup-modal');
    if (!modal) return;

    const form = document.getElementById('signup-form');
    const successPanel = document.getElementById('signup-success');
    const openers = document.querySelectorAll('[data-open-signup]');
    const closers = modal.querySelectorAll('[data-close-signup]');

    function openModal() {
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('auth-modal-open');
        const emailInput = form?.querySelector('input[name="email"]');
        if (emailInput) emailInput.focus();
    }

    function closeModal() {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('auth-modal-open');
    }

    function resetModal() {
        form?.reset();
        if (form) form.hidden = false;
        if (successPanel) successPanel.hidden = true;
    }

    openers.forEach((btn) => {
        btn.addEventListener('click', () => {
            resetModal();
            openModal();
        });
    });

    closers.forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
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
            const result = await signUpWithEmail(email, password);
            if (result.ok && form && successPanel) {
                form.hidden = true;
                successPanel.hidden = false;
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    document.querySelectorAll('[data-hero-cta]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const supabase = await getSupabaseBrowserClientAsync();
            let session = null;
            if (supabase) {
                const { data } = await supabase.auth.getSession();
                session = data.session;
            }

            if (session) {
                document
                    .getElementById('explore-sections')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            resetModal();
            openModal();
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegistrationModal);
} else {
    initRegistrationModal();
}
