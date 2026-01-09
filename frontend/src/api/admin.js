// src/api/admin.js
export async function fetchSummary(storeHash) {
    const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/summary?store_hash=${storeHash}`
    );
    return res.json();
}

export async function fetchSubscribers(storeHash) {
    const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/subscribers?store_hash=${storeHash}`
    );
    return res.json();
}
