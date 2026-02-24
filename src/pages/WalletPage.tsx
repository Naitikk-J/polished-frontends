import { motion, AnimatePresence } from "framer-motion";
import {
    Key, CreditCard, QrCode, Plus, Shield, Clock, CheckCircle2,
    Wallet, LogOut, Loader2, AlertCircle, ExternalLink, Copy, Check, RefreshCw, XCircle, Hash
} from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import api from "@/lib/api";
import QRCode from "react-qr-code";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Credential {
    credentialId: string;
    credentialType: string;
    issuerDID: string;
    subjectDID: string;
    claims: {
        name: string;
        passType?: string;
        accessLevel?: string;
    };
    issuanceDate: string;
    expirationDate: string;
    status: string;
    onChain?: {
        txHash?: string;
    };
    credentialJWT?: string;
}

function CredentialCard({
    credential,
    onPresent
}: {
    credential: Credential;
    onPresent: (cred: Credential) => void;
}) {
    const [flipped, setFlipped] = useState(false);
    const isExpired = credential.status === "expired" ||
        (credential.expirationDate && new Date(credential.expirationDate) < new Date());

    const typeLabels: Record<string, string> = {
        DigitalPassCredential: "Digital Pass",
        EmploymentCredential: "Employment",
        EducationCredential: "Education",
        EventPassCredential: "Event Pass",
        AccessCredential: "Access",
    };

    return (
        <div
            className="cursor-pointer perspective-1000"
            onClick={() => setFlipped(!flipped)}
            style={{ perspective: "1000px" }}
        >
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-64"
            >
                {/* Front */}
                <div
                    className="absolute inset-0 card-gradient rounded-xl border border-border p-6 flex flex-col justify-between"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-mono text-muted-foreground">
                                {typeLabels[credential.credentialType] || credential.credentialType}
                            </p>
                            <h3 className="text-lg font-bold mt-1">
                                {credential.claims?.passType || credential.credentialType}
                            </h3>
                        </div>
                        <span className={`text - xs font - semibold px - 2 py - 1 rounded - full ${isExpired
                            ? "bg-destructive/20 text-destructive"
                            : credential.status === "revoked"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-success/20 text-success"
                            } `}>
                            {isExpired ? "Expired" : credential.status === "revoked" ? "Revoked" : "Valid"}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Holder</span>
                            <span className="font-medium">{credential.claims?.name || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Access</span>
                            <span className="font-medium">{credential.claims?.accessLevel || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Issuer</span>
                            <span className="font-medium font-mono text-xs">
                                {credential.issuerDID?.slice(0, 20)}...
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Expires {new Date(credential.expirationDate).toLocaleDateString()}</span>
                        <span className="font-mono">Tap to flip</span>
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 card-gradient rounded-xl border border-border p-6 flex flex-col justify-between"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Credential ID</p>
                        <p className="font-mono text-sm text-primary truncate">{credential.credentialId}</p>
                        <p className="text-xs text-muted-foreground mt-3 mb-1">Issuer DID</p>
                        <p className="font-mono text-xs break-all">{credential.issuerDID}</p>
                        <p className="text-xs text-muted-foreground mt-3 mb-1">Issued</p>
                        <p className="text-sm">{new Date(credential.issuanceDate).toLocaleDateString()}</p>
                        {credential.onChain?.txHash && (
                            <>
                                <p className="text-xs text-muted-foreground mt-3 mb-1">TX Hash</p>
                                <p className="font-mono text-xs text-primary truncate">{credential.onChain.txHash}</p>
                            </>
                        )}
                    </div>

                    {!isExpired && credential.status === "active" && (
                        <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPresent(credential);
                            }}
                        >
                            <QrCode className="w-4 h-4 mr-2" /> Present This Credential
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function WalletPage() {
    const wallet = useWallet();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Presentation State
    const [presentingCredential, setPresentingCredential] = useState<Credential | null>(null);
    const [challengeId, setChallengeId] = useState("");
    const [nonce, setNonce] = useState("");
    const [presentationResult, setPresentationResult] = useState<any>(null);
    const [signing, setSigning] = useState(false);
    const [presentationError, setPresentationError] = useState("");

    // Fetch credentials when wallet is connected
    useEffect(() => {
        if (wallet.isConnected && wallet.did) {
            fetchCredentials();
        }
    }, [wallet.isConnected, wallet.did]);

    const fetchCredentials = async () => {
        setLoading(true);
        try {
            const res = await api.listCredentials({ subjectDID: wallet.did || undefined });
            if (res.success && res.data) {
                setCredentials((res.data as { credentials: Credential[] }).credentials || []);
            }
        } catch {
            // Credentials endpoint may need auth — we'll show empty
        } finally {
            setLoading(false);
        }
    };

    const handlePresent = (cred: Credential) => {
        setPresentingCredential(cred);
        setChallengeId("");
        setNonce("");
        setPresentationResult(null);
        setPresentationError("");
    };

    const generatePresentation = async () => {
        if (!challengeId || !nonce) {
            setPresentationError("Please enter Challenge ID and Nonce from the Verifier");
            return;
        }

        if (!window.ethereum || !wallet.address) {
            setPresentationError("Wallet not connected");
            return;
        }

        setSigning(true);
        setPresentationError("");

        try {
            // 1. Prepare the payload to sign
            const signedPayload = JSON.stringify({
                holder: wallet.did,
                challenge: nonce,
                domain: challengeId,
            });

            // 2. Request signature from MetaMask
            const signature = (await window.ethereum.request({
                method: "personal_sign",
                params: [signedPayload, wallet.address],
            })) as string;

            // 3. Call backend to create official Verifiable Presentation
            const res = await api.createPresentation({
                holderDID: wallet.did!,
                credentials: [presentingCredential?.credentialJWT || presentingCredential],
                challengeId,
                nonce,
                holderSignature: signature,
            });

            if (res.success && res.data) {
                setPresentationResult(res.data);
            } else {
                throw new Error(res.error || "Failed to create presentation");
            }
        } catch (err) {
            setPresentationError(err instanceof Error ? err.message : "Signing failed");
        } finally {
            setSigning(false);
        }
    };

    const copyDID = () => {
        if (wallet.did) {
            navigator.clipboard.writeText(wallet.did);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const validCount = credentials.filter(
        (c) => c.status === "active" && new Date(c.expirationDate) > new Date()
    ).length;
    const expiredCount = credentials.filter(
        (c) => c.status === "expired" || new Date(c.expirationDate) < new Date()
    ).length;

    return (
        <Layout>
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div>
                            <h1 className="text-3xl font-bold">My Wallet</h1>
                            <p className="text-muted-foreground mt-1">
                                {wallet.isConnected
                                    ? "Manage your verifiable credentials"
                                    : "Connect your wallet to get started"}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {wallet.isConnected ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border-border text-foreground hover:bg-secondary"
                                        onClick={copyDID}
                                    >
                                        {copied ? (
                                            <><Check className="w-4 h-4 mr-2 text-success" /> Copied!</>
                                        ) : (
                                            <><Key className="w-4 h-4 mr-2" /> My DID</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                        onClick={wallet.disconnect}
                                    >
                                        <LogOut className="w-4 h-4 mr-2" /> Disconnect
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                                    onClick={wallet.connect}
                                    disabled={wallet.isConnecting}
                                >
                                    {wallet.isConnecting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                                    ) : (
                                        <><Wallet className="w-4 h-4 mr-2" /> Connect Wallet</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {wallet.error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                                <p className="text-sm text-destructive">{wallet.error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Not connected state */}
                    {!wallet.isConnected && !wallet.isConnecting && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-xl p-12 text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <Wallet className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                Sign in with your Ethereum wallet to create your decentralized identity
                                and manage verifiable credentials. No passwords needed — just a signature.
                            </p>
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-10 glow"
                                onClick={wallet.connect}
                                disabled={wallet.isConnecting}
                            >
                                {!wallet.hasMetaMask ? (
                                    <>Install MetaMask</>
                                ) : (
                                    <><Wallet className="w-5 h-5 mr-2" /> Connect MetaMask</>
                                )}
                            </Button>
                            {!wallet.hasMetaMask && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    <a
                                        href="https://metamask.io/download/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Download MetaMask <ExternalLink className="w-3 h-3" />
                                    </a>
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* Connecting state */}
                    {wallet.isConnecting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass rounded-xl p-12 text-center"
                        >
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                            <h2 className="text-xl font-bold mb-2">Connecting Wallet</h2>
                            <p className="text-muted-foreground">
                                Please approve the connection and sign the message in MetaMask...
                            </p>
                        </motion.div>
                    )}

                    {/* Connected state */}
                    {wallet.isConnected && (
                        <>
                            {/* New identity toast */}
                            <AnimatePresence>
                                {wallet.isNewIdentity && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 flex items-center gap-3"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                                        <p className="text-sm">
                                            <strong>Welcome to DIGIPASS!</strong> Your decentralized identity has been created.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* DID card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-xl p-6 mb-8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground">Your Decentralized Identity</p>
                                        <p className="font-mono text-sm text-primary mt-0.5 truncate">
                                            {wallet.did}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={copyDID}>
                                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{credentials.length}</p>
                                        <p className="text-xs text-muted-foreground">Credentials</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-success">{validCount}</p>
                                        <p className="text-xs text-muted-foreground">Valid</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
                                        <p className="text-xs text-muted-foreground">Expired</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                    Connected: {wallet.shortAddress}
                                </div>
                            </motion.div>

                            {/* Presentation Modal */}
                            <Dialog open={!!presentingCredential} onOpenChange={(open) => !open && setPresentingCredential(null)}>
                                <DialogContent className="sm:max-w-md bg-card border-border">
                                    <DialogHeader>
                                        <DialogTitle>Present Credential</DialogTitle>
                                        <DialogDescription>
                                            Sign a challenge from the verifier to prove ownership.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        {!presentationResult ? (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="challengeId" className="text-xs uppercase tracking-wider text-muted-foreground">Challenge ID (from Verifier)</Label>
                                                    <Input
                                                        id="challengeId"
                                                        placeholder="uuid-..."
                                                        value={challengeId}
                                                        onChange={(e) => setChallengeId(e.target.value)}
                                                        className="bg-secondary border-border font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="nonce" className="text-xs uppercase tracking-wider text-muted-foreground">Challenge Nonce</Label>
                                                    <Input
                                                        id="nonce"
                                                        placeholder="uuid-..."
                                                        value={nonce}
                                                        onChange={(e) => setNonce(e.target.value)}
                                                        className="bg-secondary border-border font-mono text-xs"
                                                    />
                                                </div>

                                                {presentationError && (
                                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-xs text-destructive">
                                                        <AlertCircle className="w-4 h-4" /> {presentationError}
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full bg-primary text-primary-foreground font-semibold"
                                                    onClick={generatePresentation}
                                                    disabled={signing}
                                                >
                                                    {signing ? (
                                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Signing...</>
                                                    ) : (
                                                        <><Shield className="w-4 h-4 mr-2" /> Generate Proof</>
                                                    )}
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-6 py-4">
                                                <div className="w-56 h-56 bg-white p-4 rounded-xl shadow-inner flex items-center justify-center">
                                                    <QRCode
                                                        size={200}
                                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                        value={JSON.stringify({
                                                            type: 'VerifiablePresentation',
                                                            presentation: presentationResult,
                                                            challengeId: challengeId
                                                        })}
                                                        viewBox={`0 0 256 256`}
                                                    />
                                                </div>
                                                <p className="text-xs text-center text-muted-foreground">
                                                    Present this QR code to the verifier's scanner to complete verification.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-border text-foreground"
                                                    onClick={() => setPresentingCredential(null)}
                                                >
                                                    Done
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Credentials grid */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                                    <p className="text-muted-foreground">Loading credentials...</p>
                                </div>
                            ) : credentials.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {credentials.map((cred, i) => (
                                        <motion.div
                                            key={cred.credentialId}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <CredentialCard credential={cred} onPresent={handlePresent} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="card-gradient rounded-xl border border-border p-12 text-center"
                                >
                                    <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Credentials Yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        Your wallet is ready! Ask an issuer to send you a credential, or
                                        share your DID with them:
                                    </p>
                                    <div className="mt-4 p-3 rounded-lg bg-secondary/50 inline-block">
                                        <p className="font-mono text-xs text-primary break-all">{wallet.did}</p>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </Layout>
    );
}
