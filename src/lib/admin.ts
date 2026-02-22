
/**
 * Admin utility to check for authorized administrative e-mails.
 * Add ADMIN_EMAILS to your .env file as a comma-separated list.
 * Example: ADMIN_EMAILS=mustafa_snl@hotmail.com,admin@example.com
 */

const getAdminEmails = () => {
    return (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
};

export function isAdmin(email?: string | null): boolean {
    if (!email) return false;
    const adminEmails = getAdminEmails();

    // Also allow a fallback if the env is not set (you might want to remove this for strict production)
    if (adminEmails.length === 0 || (adminEmails.length === 1 && adminEmails[0] === "")) {
        // If no admin emails defined, we default to false for safety 
        // or you can hardcode your primary email here temporarily.
        return false;
    }

    return adminEmails.includes(email.toLowerCase());
}
