// src/hooks/useWallet.ts
// React hook for MetaMask wallet connection + DIGIPASS backend authentication.
// Handles the full SIWE (Sign-In with Ethereum) flow.

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface WalletState {
    address: string | null;
    did: string | null;
    role: string;
    isConnected: boolean;
    isConnecting: boolean;
    isNewIdentity: boolean;
    error: string | null;
    chainId: string | null;
}

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

export function useWallet() {
    const [state, setState] = useState<WalletState>({
        address: null,
        did: localStorage.getItem("digipass_did"),
        role: localStorage.getItem("digipass_role") || "holder",
        isConnected: !!localStorage.getItem("digipass_token"),
        isConnecting: false,
        isNewIdentity: false,
        error: null,
        chainId: null,
    });

    // Restore address from localStorage on mount
    useEffect(() => {
        const savedAddress = localStorage.getItem("digipass_address");
        if (savedAddress) {
            setState((prev) => ({ ...prev, address: savedAddress }));
        }
    }, []);

    // Listen for account/chain changes in MetaMask
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: unknown) => {
            const accts = accounts as string[];
            if (accts.length === 0) {
                disconnect();
            } else if (accts[0] !== state.address) {
                // Account changed — re-authenticate
                disconnect();
            }
        };

        const handleChainChanged = (chainId: unknown) => {
            setState((prev) => ({ ...prev, chainId: chainId as string }));
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum?.removeListener("chainChanged", handleChainChanged);
        };
    }, [state.address]);

    /**
     * CONNECT WALLET — full SIWE flow:
     * 1. Request MetaMask accounts
     * 2. Get nonce from backend
     * 3. Sign the nonce in MetaMask
     * 4. Send signature to backend
     * 5. Receive DID + JWT
     */
    const connect = useCallback(async () => {
        if (!window.ethereum) {
            setState((prev) => ({
                ...prev,
                error: "MetaMask not detected — please install MetaMask extension",
            }));
            return;
        }

        setState((prev) => ({ ...prev, isConnecting: true, error: null }));

        try {
            // Step 1: Request wallet access
            const accounts = (await window.ethereum.request({
                method: "eth_requestAccounts",
            })) as string[];

            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found — please unlock MetaMask");
            }

            const address = accounts[0];

            // Step 2: Get nonce from backend
            const nonceResponse = await api.getNonce(address);
            if (!nonceResponse.success || !nonceResponse.data) {
                throw new Error(nonceResponse.error || "Failed to get sign-in challenge");
            }

            const { message } = nonceResponse.data;

            // Step 3: Sign the message in MetaMask
            const signature = (await window.ethereum.request({
                method: "personal_sign",
                params: [message, address],
            })) as string;

            // Step 4: Send to backend for verification
            const connectResponse = await api.connectWallet(address, signature, message);
            if (!connectResponse.success || !connectResponse.data) {
                throw new Error(connectResponse.error || "Wallet connection failed");
            }

            const { did, role, isNewIdentity, token } = connectResponse.data;

            // Step 5: Store session
            api.setToken(token);
            localStorage.setItem("digipass_address", address);
            localStorage.setItem("digipass_did", did);
            localStorage.setItem("digipass_role", role);

            setState({
                address,
                did,
                role,
                isConnected: true,
                isConnecting: false,
                isNewIdentity,
                error: null,
                chainId: null,
            });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Connection failed";
            // Handle MetaMask user rejection
            const userRejected = message.includes("User denied") || message.includes("rejected");
            setState((prev) => ({
                ...prev,
                isConnecting: false,
                error: userRejected ? "Connection cancelled by user" : message,
            }));
        }
    }, []);

    /**
     * DISCONNECT — clear all local session data.
     */
    const disconnect = useCallback(() => {
        api.clearToken();
        localStorage.removeItem("digipass_address");
        localStorage.removeItem("digipass_did");
        localStorage.removeItem("digipass_role");

        setState({
            address: null,
            did: null,
            role: "holder",
            isConnected: false,
            isConnecting: false,
            isNewIdentity: false,
            error: null,
            chainId: null,
        });
    }, []);

    /**
     * Check if MetaMask is installed.
     */
    const hasMetaMask = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

    /**
     * Shortened address for display (0xAbCd...1234)
     */
    const shortAddress = state.address
        ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
        : null;

    /**
     * Shortened DID for display
     */
    const shortDID = state.did
        ? `${state.did.slice(0, 20)}...${state.did.slice(-6)}`
        : null;

    return {
        ...state,
        connect,
        disconnect,
        hasMetaMask,
        shortAddress,
        shortDID,
    };
}
