import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle2, XCircle, Clock, Shield, Hash, RefreshCw, AlertCircle, Wallet, Copy, Camera } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import api from "@/lib/api";
import { Link } from "react-router-dom";

type VerifyState = "idle" | "generating" | "scanning" | "verifying" | "granted" | "denied";

interface Challenge {
    id: string;
    nonce: string;
    verifierDID: string;
    expiresAt: number;
}

interface VerificationResult {
    presentationValid: boolean;
    holderDID: string;
    grantAccess: boolean;
    accessDecision: string;
    credentialResults: Array<{
        isValid: boolean;
        checks: {
            signatureValid: boolean;
            notExpired: boolean;
            notRevoked: boolean;
            hashMatches: boolean;
            issuerTrusted: boolean;
        };
        errors: string[];
    }>;
    errors: string[];
}

export default function VerifierPage() {
    const wallet = useWallet();
    const [state, setState] = useState<VerifyState>("idle");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");

    // Timer for challenge expiry
    useEffect(() => {
        if (!challenge || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (state === "scanning") setState("idle");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [challenge, timeLeft, state]);

    const generateChallenge = async () => {
        if (!wallet.isConnected || !wallet.did) {
            setErrorMsg("Please connect your verifier wallet first");
            return;
        }

        setState("generating");
        setErrorMsg("");

        try {
            const res = await api.generateChallenge(wallet.did, ["DigitalPassCredential"]);
            if (res.success && res.data) {
                setChallenge(res.data);
                setTimeLeft(300); // 5 minutes
                setState("scanning");
            } else {
                throw new Error(res.error || "Failed to generate challenge");
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to generate challenge");
            setState("idle");
        }
    };

    /**
     * SIMULATE SCAN
     * In a real flow, the verifier app scans a QR code from the holder.
     * That QR code contains a Verifiable Presentation.
     * We then call the backend to verify it.
     */
    const handleSimulateScan = async () => {
        if (!challenge) return;

        setState("verifying");
        setErrorMsg("");

        try {
            // Create a mock presentation response that would normally come from the holder
            // In a real app, this data comes from scanning the holder's phone
            const mockPresentation = {
                holder: "did:ethr:maticmum:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                verifiableCredential: [
                    {
                        id: "urn:uuid:mock-credential",
                        type: ["VerifiableCredential", "DigitalPassCredential"],
                        issuer: "did:ethr:maticmum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                    }
                ],
                proof: {
                    type: "EcdsaSecp256k1RecoverySignature2020",
                    created: new Date().toISOString(),
                    proofPurpose: "authentication",
                    verificationMethod: "did:ethr:maticmum:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266#controller",
                    challenge: challenge.nonce,
                    domain: challenge.id,
                    signature: "0x" // The backend bypasses signature check if it's 0x for demo/mock purposes or we'd need a real one
                }
            };

            const res = await api.verifyPresentation(mockPresentation, challenge.id);

            if (res.success && res.data) {
                setResult(res.data as VerificationResult);
                setState((res.data as VerificationResult).grantAccess ? "granted" : "denied");
            } else {
                throw new Error(res.error || "Verification failed");
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Verification failed");
            setState("denied");
        }
    };

    const reset = () => {
        setState("idle");
        setChallenge(null);
        setResult(null);
        setTimeLeft(0);
        setErrorMsg("");
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // Check results mapping
    const getChecks = () => {
        if (!result || !result.credentialResults[0]) {
            return [
                { label: "Signature Valid", icon: Shield, status: "pending" },
                { label: "Not Expired", icon: Clock, status: "pending" },
                { label: "Not Revoked", icon: XCircle, status: "pending" },
                { label: "Hash Matches", icon: Hash, status: "pending" },
                { label: "Issuer Trusted", icon: Shield, status: "pending" },
            ];
        }

        const checks = result.credentialResults[0].checks;
        return [
            { label: "Signature Valid", icon: Shield, status: checks.signatureValid ? "passed" : "failed" },
            { label: "Not Expired", icon: Clock, status: checks.notExpired ? "passed" : "failed" },
            { label: "Not Revoked", icon: XCircle, status: checks.notRevoked ? "passed" : "failed" },
            { label: "Hash Matches", icon: Hash, status: checks.hashMatches ? "passed" : "failed" },
            { label: "Issuer Trusted", icon: Shield, status: checks.issuerTrusted ? "passed" : "failed" },
        ];
    };

    return (
        <Layout>
            <section className="py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <div>
                                <h1 className="text-3xl font-bold">Verifier Dashboard</h1>
                                <p className="text-muted-foreground mt-1">Scan and verify credentials using challenge-response protocol</p>
                                <div className="mt-4">
                                    <Link to="/mobverifier">
                                        <Button variant="outline" size="sm" className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/5">
                                            <Camera className="w-3 h-3 mr-2" /> Switch to Mobile Verifier
                                        </Button>
                                    </Link>
                                </div>
                            </div>            </div>
                        {wallet.isConnected && (
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <span className="text-muted-foreground font-mono">{wallet.shortAddress}</span>
                            </div>
                        )}
                    </div>

                    {!wallet.isConnected ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-xl p-12 text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <QrCode className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Verifier Account Required</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                Connect your account to generate verification challenges and verify incoming presentations.
                            </p>
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-10 glow"
                                onClick={wallet.connect}
                            >
                                <Wallet className="w-5 h-5 mr-2" /> Connect Wallet
                            </Button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* QR Scanner / Challenge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card-gradient rounded-xl border border-border p-8 flex flex-col items-center"
                            >
                                <h2 className="text-lg font-semibold mb-6 self-start">Challenge QR</h2>

                                {(state === "idle" || state === "generating") && (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-48 h-48 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                                            <QrCode className="w-16 h-16 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm text-muted-foreground text-center">
                                            Generate a challenge QR code for the credential holder to scan.
                                        </p>
                                        {errorMsg && (
                                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-xs text-destructive">
                                                <AlertCircle className="w-3 h-3" /> {errorMsg}
                                            </div>
                                        )}
                                        <Button
                                            onClick={generateChallenge}
                                            disabled={state === "generating"}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full"
                                        >
                                            {state === "generating" ? (
                                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                            ) : (
                                                <><QrCode className="w-4 h-4 mr-2" /> Generate Challenge</>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {state === "scanning" && challenge && (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <div className="w-48 h-48 rounded-xl bg-white p-4 flex items-center justify-center shadow-lg animate-pulse-glow">
                                            {/* Real-time QR generation using a public API for demo */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
                                                    type: 'VerificationChallenge',
                                                    id: challenge.id,
                                                    nonce: challenge.nonce
                                                }))}`}
                                                alt="Challenge QR"
                                                className="w-full h-full"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-primary">SCAN THIS CODE</p>
                                            <p className="text-xs text-muted-foreground mt-1">Waiting for presentation...</p>
                                        </div>
                                        <div className="text-xs font-mono text-muted-foreground flex items-center gap-1 bg-secondary/50 px-3 py-1 rounded-full">
                                            <Clock className="w-3 h-3" /> Expires in {formatTime(timeLeft)}
                                        </div>

                                        <div className="w-full pt-4 space-y-3">
                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Challenge ID</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-mono truncate text-primary pr-2">{challenge.id}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => navigator.clipboard.writeText(challenge.id)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Challenge Nonce</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-mono truncate text-primary pr-2">{challenge.nonce}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => navigator.clipboard.writeText(challenge.nonce)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={handleSimulateScan}
                                                variant="secondary"
                                                className="w-full text-xs"
                                            >
                                                Simulate Scan (Demo Flow)
                                            </Button>

                                            <Button variant="ghost" onClick={reset} className="w-full text-xs text-muted-foreground">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {(state === "verifying" || state === "granted" || state === "denied") && (
                                    <div className="flex flex-col items-center gap-4 w-full py-8">
                                        {state === "verifying" && (
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                            </div>
                                        )}
                                        {state === "granted" && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center glow"
                                            >
                                                <CheckCircle2 className="w-10 h-10 text-success" />
                                            </motion.div>
                                        )}
                                        {state === "denied" && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center"
                                            >
                                                <XCircle className="w-10 h-10 text-destructive" />
                                            </motion.div>
                                        )}

                                        <div className="text-center mt-2">
                                            <p className="text-xl font-bold">
                                                {state === "verifying" && "Verifying Cryptography..."}
                                                {state === "granted" && "ACCESS GRANTED"}
                                                {state === "denied" && "ACCESS DENIED"}
                                            </p>
                                            {state === "denied" && errorMsg && (
                                                <p className="text-sm text-destructive mt-1">{errorMsg}</p>
                                            )}
                                        </div>

                                        {(state === "granted" || state === "denied") && (
                                            <Button variant="outline" onClick={reset} className="border-border text-foreground hover:bg-secondary mt-6">
                                                New Verification
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </motion.div>

                            {/* Verification details */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="card-gradient rounded-xl border border-border p-8"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold">Verification Checks</h2>
                                    {result && (
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${result.grantAccess ? "border-success/30 text-success" : "border-destructive/30 text-destructive"
                                            }`}>
                                            {result.grantAccess ? "TRUSTED" : "FLAGGED"}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {getChecks().map((check, i) => (
                                        <motion.div
                                            key={check.label}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${check.status === "passed" ? "bg-success/5 border-success/20" :
                                                check.status === "failed" ? "bg-destructive/5 border-destructive/20" :
                                                    "bg-secondary/30 border-border"
                                                }`}
                                        >
                                            {check.status === "passed" ? (
                                                <CheckCircle2 className="w-4 h-4 text-success" />
                                            ) : check.status === "failed" ? (
                                                <XCircle className="w-4 h-4 text-destructive" />
                                            ) : state === "verifying" ? (
                                                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-muted" />
                                            )}
                                            <span className={`text-sm font-medium ${check.status === "pending" ? "text-muted-foreground" : ""
                                                }`}>{check.label}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {state === "granted" && result && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="mt-8 p-5 rounded-xl bg-secondary/50 border border-border space-y-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Holder Data</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-mono">Decentralized ID</p>
                                                <p className="font-mono text-xs text-primary truncate">{result.holderDID}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Credential Type</p>
                                                    <p className="text-xs font-medium">DigitalPassCredential</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Decision</p>
                                                    <p className="text-xs font-bold text-success">TRUSTED_GRANT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
}
