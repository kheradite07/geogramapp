export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const getApiUrl = (path: string) => {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};
