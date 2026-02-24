import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Shield, CheckCircle2, XCircle, RefreshCw, AlertCircle, Camera, ChevronLeft, Wallet } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import api from "@/lib/api";
import { Link } from "react-router-dom";

type Step = "setup" | "scanning" | "verifying" | "result";

/**
 * SEPARATE COMPONENT FOR SCANNER
 * This ensures the HTML element #reader is mounted before the scanner starts.
 */
const QRScanner = ({ onScan, onError, onCancel }: {
    onScan: (text: string) => void,
    onError: (err: string) => void,
    onCancel: () => void
}) => {
    const scannerContainerRef = useRef<Html5Qrcode | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    useEffect(() => {
        let isMounted = true;

        const initScanner = async () => {
            if (!isMounted) return;

            try {
                // If already scanning, stop it first
                if (scannerContainerRef.current?.isScanning) {
                    await scannerContainerRef.current.stop();
                }

                const html5QrCode = scannerContainerRef.current || new Html5Qrcode("reader");
                scannerContainerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: facingMode },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (text) => {
                        if (isMounted) onScan(text);
                    },
                    () => { } // silence failure noise
                );
            } catch (err: any) {
                console.error("Scanner error:", err);
                // Don't show error if it's just "Camera already in use" during a quick toggle
                if (isMounted && !err?.toString()?.includes("already in use")) {
                    onError(`Camera error: ${err}`);
                }
            }
        };

        const initTimer = setTimeout(initScanner, 500);

        return () => {
            isMounted = false;
            clearTimeout(initTimer);
        };
    }, [facingMode]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (scannerContainerRef.current && scannerContainerRef.current.isScanning) {
                scannerContainerRef.current.stop().catch(e => console.error("Stop error", e));
            }
        };
    }, []);

    const toggleCamera = () => {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
        >
            <div className="w-full aspect-square bg-black rounded-3xl overflow-hidden mb-6 border-2 border-primary/30 relative shadow-2xl">
                <div id="reader" className="w-full h-full"></div>
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-primary animate-pulse" />
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    className="text-xs h-9 border-primary/20 bg-primary/5 rounded-xl hover:bg-primary/10"
                    onClick={toggleCamera}
                >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Invert Camera
                </Button>

                <Button
                    variant="ghost"
                    className="text-xs h-9 text-muted-foreground hover:bg-secondary rounded-xl px-6"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>

            <p className="mt-6 text-[10px] font-medium animate-pulse text-primary flex items-center gap-2 uppercase tracking-widest">
                ALIGN QR CODE
            </p>
        </motion.div>
    );
};

export default function MobileVerifier() {
    const wallet = useWallet();
    const [step, setStep] = useState<Step>("setup");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const handleScan = async (decodedText: string) => {
        try {
            setStep("verifying");
            const data = JSON.parse(decodedText);

            if (data.type !== "VerifiablePresentation" || !data.presentation || !data.challengeId) {
                throw new Error("Invalid QR Code format. Please scan a DIGIPASS proof.");
            }

            const res = await api.verifyPresentation(data.presentation, data.challengeId);

            if (res.success && res.data) {
                setResult(res.data);
                setStep("result");
            } else {
                throw new Error(res.error || "Verification failed");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Scanning failed");
            setStep("result");
        }
    };

    const handleScannerError = (err: string) => {
        setError(err);
        setStep("result");
    };

    const reset = () => {
        setStep("setup");
        setResult(null);
        setError("");
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col p-4 font-sans max-w-lg mx-auto overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-secondary">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-bold tracking-tight">DIGIPASS</span>
                </div>
                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    {step === "setup" && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center w-full flex flex-col"
                        >
                            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <Camera className="w-12 h-12 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mb-3 px-4">Mobile Verifier</h1>
                            <p className="text-muted-foreground mb-8 px-8">
                                Scan a holder's generated pass and verify its authenticity instantly.
                            </p>

                            <div className="space-y-4 px-4">
                                {!wallet.isConnected ? (
                                    <Button
                                        size="lg"
                                        className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl glow shadow-lg"
                                        onClick={wallet.connect}
                                    >
                                        <Wallet className="w-6 h-6 mr-2" /> Connect Verifier
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg rounded-2xl glow shadow-lg"
                                        onClick={() => setStep("scanning")}
                                    >
                                        <Camera className="w-6 h-6 mr-2" /> Start Scanning
                                    </Button>
                                )}
                            </div>

                            <p className="mt-6 text-xs text-muted-foreground">
                                Account: <span className="font-mono text-primary">{wallet.shortAddress || "Not connected"}</span>
                            </p>
                        </motion.div>
                    )}

                    {step === "scanning" && (
                        <QRScanner
                            key="scanner"
                            onScan={handleScan}
                            onError={handleScannerError}
                            onCancel={() => setStep("setup")}
                        />
                    )}

                    {step === "verifying" && (
                        <motion.div
                            key="verifying"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Verifying Proof</h2>
                            <p className="text-muted-foreground">Checking signatures & anchors...</p>
                        </motion.div>
                    )}

                    {step === "result" && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full text-center px-4"
                        >
                            {error ? (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-8 shadow-xl">
                                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-destructive mb-2 uppercase">Failed</h2>
                                    <p className="text-xs text-muted-foreground mb-6 break-words font-mono">{error}</p>
                                    <Button onClick={reset} className="w-full h-12 bg-destructive text-white rounded-xl font-bold">
                                        Try Again
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-success/10 border border-success/20 rounded-3xl p-8 shadow-xl">
                                    <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4 glow" />
                                    <h2 className="text-2xl font-bold text-success mb-2">ACCESS GRANTED</h2>
                                    <div className="my-6 p-4 bg-background/50 rounded-xl text-left space-y-3 border border-border">
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-mono text-muted-foreground">Holder DID</p>
                                            <p className="text-xs font-mono truncate text-primary">{result?.holderDID}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-mono text-muted-foreground">Decision</p>
                                            <p className="text-xs font-bold text-success">VERIFIED_VP_TOKEN</p>
                                        </div>
                                    </div>
                                    <Button onClick={reset} className="w-full h-12 bg-success text-white rounded-xl shadow-lg font-bold">
                                        Next Scan
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-8 text-center pb-8 text-muted-foreground">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em]">
                    SYSTEM: DIGIPASS SCANNER v1.0
                </p>
            </div>
        </div>
    );
}
