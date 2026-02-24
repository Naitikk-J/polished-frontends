// src/lib/api.ts
// Centralized API client for all backend communication.
// All requests go through the Vite proxy (/api → localhost:5050).

const API_BASE = "/api";

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    details?: { field: string; message: string }[];
}

class ApiClient {
    private token: string | null = null;

    constructor() {
        // Load token from localStorage on init
        this.token = localStorage.getItem("digipass_token");
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem("digipass_token", token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem("digipass_token");
    }

    getToken() {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();
            return data;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Network error",
            };
        }
    }

    // ─── Health ─────────────────────────────────────────────────

    async health() {
        return this.request<{
            status: string;
            timestamp: string;
            uptime: number;
        }>("/health");
    }

    // ─── Identity / Wallet ──────────────────────────────────────

    async getNonce(address: string) {
        return this.request<{
            message: string;
            nonce: string;
            expiresIn: number;
        }>(`/identity/wallet/nonce/${address}`);
    }

    async connectWallet(address: string, signature: string, message: string) {
        return this.request<{
            did: string;
            address: string;
            role: string;
            isNewIdentity: boolean;
            didDocument: Record<string, unknown>;
            token: string;
        }>("/identity/wallet/connect", {
            method: "POST",
            body: JSON.stringify({ address, signature, message }),
        });
    }

    async createDID(role?: string) {
        return this.request<{
            did: string;
            address: string;
            publicKey: string;
            privateKey: string;
            token: string;
        }>("/identity/create", {
            method: "POST",
            body: JSON.stringify({ role }),
        });
    }

    async resolveDID(did: string) {
        return this.request<{
            did: string;
            address: string;
            role: string;
            metadata: Record<string, unknown>;
        }>(`/identity/resolve/${did}`);
    }

    // ─── Credentials ────────────────────────────────────────────

    async issueCredential(data: {
        subjectDID: string;
        credentialType: string;
        claims: {
            name: string;
            passType?: string;
            accessLevel?: string;
            organizationId?: string;
        };
        expiryDate: string;
    }) {
        return this.request<{
            credentialId: string;
            credential: Record<string, unknown>;
            credentialJWT: string;
            onChainTxHash: string;
            anchoredHash: string;
            issuanceDate: string;
            expirationDate: string;
        }>("/credentials/issue", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async verifyCredential(credential: unknown) {
        return this.request<{
            isValid: boolean;
            checks: {
                signatureValid: boolean;
                notExpired: boolean;
                notRevoked: boolean;
                hashMatches: boolean;
                issuerTrusted: boolean;
            };
            credentialData: Record<string, unknown>;
            errors: string[];
        }>("/credentials/verify", {
            method: "POST",
            body: JSON.stringify({ credential }),
        });
    }

    async getCredential(id: string) {
        return this.request("/credentials/" + id);
    }

    async listCredentials(params?: {
        issuerDID?: string;
        subjectDID?: string;
        status?: string;
    }) {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) searchParams.set(key, value);
            });
        }
        const query = searchParams.toString();
        return this.request(`/credentials${query ? "?" + query : ""}`);
    }

    async revokeCredential(id: string, reason?: string) {
        return this.request(`/credentials/${id}/revoke`, {
            method: "DELETE",
            body: JSON.stringify({ reason }),
        });
    }

    // ─── Presentation / QR Verification ─────────────────────────

    async generateChallenge(
        verifierDID: string,
        requestedCredentialTypes?: string[]
    ) {
        return this.request<{
            id: string;
            nonce: string;
            verifierDID: string;
            expiresAt: number;
            requestedCredentialTypes: string[];
        }>("/presentation/challenge", {
            method: "POST",
            body: JSON.stringify({ verifierDID, requestedCredentialTypes }),
        });
    }

    async checkChallenge(id: string) {
        return this.request<{
            id: string;
            expiresAt: number;
            isExpired: boolean;
            timeRemaining: number;
        }>(`/presentation/challenge/${id}`);
    }

    async createPresentation(data: {
        holderDID: string;
        credentials: unknown[];
        challengeId: string;
        nonce: string;
        holderSignature: string;
    }) {
        return this.request("/presentation/create", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async verifyPresentation(presentation: unknown, challengeId: string) {
        return this.request<{
            presentationValid: boolean;
            holderDID: string;
            grantAccess: boolean;
            accessDecision: string;
            credentialResults: Array<{
                isValid: boolean;
                checks: Record<string, boolean>;
                errors: string[];
            }>;
            errors: string[];
        }>("/presentation/verify", {
            method: "POST",
            body: JSON.stringify({ presentation, challengeId }),
        });
    }

    // ─── Issuer Dashboard ───────────────────────────────────────

    async issuerDashboard() {
        return this.request<{
            stats: { total: number; active: number; revoked: number; expired: number };
            recentCredentials: Array<Record<string, unknown>>;
            typeBreakdown: Record<string, number>;
        }>("/issuer/dashboard");
    }
}

// Export singleton
const api = new ApiClient();
export default api;
