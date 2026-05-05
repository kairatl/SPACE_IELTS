/**
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validatePassword(password) {
    if (typeof password !== 'string') {
        return { ok: false, message: 'Password is required.' };
    }
    if (password.length < 8) {
        return {
            ok: false,
            message: 'Password must be at least 8 characters long.',
        };
    }
    if (!/\d/.test(password)) {
        return {
            ok: false,
            message: 'Password must contain at least one number.',
        };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return {
            ok: false,
            message: 'Password must contain at least one special character.',
        };
    }
    return { ok: true };
}
