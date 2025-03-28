export function json(body, options) {
    return new Response(JSON.stringify(body), {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
}
