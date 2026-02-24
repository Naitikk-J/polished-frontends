import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, AlertCircle, Wallet, Shield } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/hooks/useWallet";
import api from "@/lib/api";

type TxState = "idle" | "signing" | "broadcasting" | "confirming" | "success" | "error";

const stateLabels: Record<TxState, string> = {
    idle: "",
    signing: "Signing credential...",
    broadcasting: "Broadcasting to network...",
    confirming: "Anchoring on Polygon blockchain...",
    success: "Credential issued successfully!",
    error: "Transaction failed.",
};

interface IssuanceResult {
    credentialId: string;
    onChainTxHash: string;
    anchoredHash: string;
}

interface RecentIssuance {
    id: string;
    type: string;
    subject: string;
    date: string;
    tx: string;
}

export default function IssuerPage() {
    const wallet = useWallet();
    const [txState, setTxState] = useState<TxState>("idle");
    const [txResult, setTxResult] = useState<IssuanceResult | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [recentIssuances, setRecentIssuances] = useState<RecentIssuance[]>([]);

    // Form state
    const [subjectDID, setSubjectDID] = useState("");
    const [credentialType, setCredentialType] = useState("");
    const [holderName, setHolderName] = useState("");
    const [passType, setPassType] = useState("");
    const [accessLevel, setAccessLevel] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const handleIssue = async () => {
        if (!wallet.isConnected) {
            setErrorMsg("Connect your issuer wallet first");
            setTxState("error");
            return;
        }

        if (!subjectDID || !credentialType || !holderName || !expiryDate) {
            setErrorMsg("Please fill all required fields");
            setTxState("error");
            return;
        }

        setTxState("signing");
        setErrorMsg("");
        setTxResult(null);

        try {
            // Phase 1: Sign
            await new Promise((r) => setTimeout(r, 600));
            setTxState("broadcasting");

            // Phase 2: Call backend
            const response = await api.issueCredential({
                subjectDID,
                credentialType,
                claims: {
                    name: holderName,
                    passType: passType || undefined,
                    accessLevel: accessLevel || undefined,
                },
                expiryDate: new Date(expiryDate).toISOString(),
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || "Issuance failed");
            }

            setTxState("confirming");
            await new Promise((r) => setTimeout(r, 1000));

            setTxResult({
                credentialId: response.data.credentialId,
                onChainTxHash: response.data.onChainTxHash,
                anchoredHash: response.data.anchoredHash,
            });

            // Add to recent issuances
            setRecentIssuances((prev) => [
                {
                    id: response.data!.credentialId,
                    type: credentialType,
                    subject: holderName,
                    date: new Date().toLocaleDateString(),
                    tx: response.data!.onChainTxHash?.slice(0, 10) + "..." || "pending",
                },
                ...prev,
            ]);

            setTxState("success");

            // Reset form
            setSubjectDID("");
            setCredentialType("");
            setHolderName("");
            setPassType("");
            setAccessLevel("");
            setExpiryDate("");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Issuance failed");
            setTxState("error");
        }
    };

    // Not connected — show connect prompt
    if (!wallet.isConnected) {
        return (
            <Layout>
                <section className="py-12">
                    <div className="container mx-auto px-4 max-w-2xl">
                        <div className="mb-10">
                            <h1 className="text-3xl font-bold">Issuer Portal</h1>
                            <p className="text-muted-foreground mt-1">
                                Connect your issuer wallet to issue verifiable credentials
                            </p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-xl p-12 text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Issuer Authentication Required</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                Connect your authorized issuer wallet to sign and issue
                                verifiable credentials anchored on Polygon.
                            </p>
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-10 glow"
                                onClick={wallet.connect}
                                disabled={wallet.isConnecting}
                            >
                                {wallet.isConnecting ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
                                ) : (
                                    <><Wallet className="w-5 h-5 mr-2" /> Connect Issuer Wallet</>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </section>
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold">Issuer Portal</h1>
                            <p className="text-muted-foreground mt-1">
                                Issue verifiable credentials anchored on Polygon
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-muted-foreground font-mono">{wallet.shortAddress}</span>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-gradient rounded-xl border border-border p-8"
                    >
                        <h2 className="text-xl font-semibold mb-6">Issue New Credential</h2>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Subject DID *</Label>
                                <Input
                                    value={subjectDID}
                                    onChange={(e) => setSubjectDID(e.target.value)}
                                    placeholder="did:ethr:maticmum:0x..."
                                    className="bg-secondary border-border font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Credential Type *</Label>
                                <Select value={credentialType} onValueChange={setCredentialType}>
                                    <SelectTrigger className="bg-secondary border-border">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DigitalPassCredential">Digital Pass</SelectItem>
                                        <SelectItem value="EmploymentCredential">Employment</SelectItem>
                                        <SelectItem value="EducationCredential">Education</SelectItem>
                                        <SelectItem value="EventPassCredential">Event Pass</SelectItem>
                                        <SelectItem value="AccessCredential">Access Pass</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Holder Name *</Label>
                                    <Input
                                        value={holderName}
                                        onChange={(e) => setHolderName(e.target.value)}
                                        placeholder="Alice Johnson"
                                        className="bg-secondary border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Pass Type</Label>
                                    <Input
                                        value={passType}
                                        onChange={(e) => setPassType(e.target.value)}
                                        placeholder="e.g. Premium, Standard"
                                        className="bg-secondary border-border"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Access Level</Label>
                                    <Select value={accessLevel} onValueChange={setAccessLevel}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic</SelectItem>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="premium">Premium</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Expiry Date *</Label>
                                    <Input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]}
                                        className="bg-secondary border-border"
                                    />
                                </div>
                            </div>

                            {/* Transaction state feedback */}
                            {txState !== "idle" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className={`rounded-lg p-4 flex items-start gap-3 ${txState === "success"
                                            ? "bg-success/10 border border-success/30"
                                            : txState === "error"
                                                ? "bg-destructive/10 border border-destructive/30"
                                                : "bg-primary/10 border border-primary/30"
                                        }`}
                                >
                                    {txState === "success" ? (
                                        <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                    ) : txState === "error" ? (
                                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">{stateLabels[txState]}</p>
                                        {txState === "error" && errorMsg && (
                                            <p className="text-xs text-destructive mt-1">{errorMsg}</p>
                                        )}
                                        {txState === "confirming" && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                This typically takes 5-15 seconds. Do not close this window.
                                            </p>
                                        )}
                                        {txState === "success" && txResult && (
                                            <div className="mt-2 space-y-1">
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    ID: {txResult.credentialId}
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    TX: {txResult.onChainTxHash}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <Button
                                onClick={handleIssue}
                                disabled={
                                    txState !== "idle" && txState !== "success" && txState !== "error"
                                }
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 text-base"
                            >
                                {txState === "idle" || txState === "success" || txState === "error" ? (
                                    <>
                                        <Send className="w-4 h-4 mr-2" /> Issue Credential
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Recent issuances */}
                    {recentIssuances.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card-gradient rounded-xl border border-border p-8 mt-8"
                        >
                            <h2 className="text-xl font-semibold mb-4">Recent Issuances</h2>
                            <div className="space-y-3">
                                {recentIssuances.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{item.subject}</p>
                                            <p className="text-xs text-muted-foreground">{item.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{item.date}</p>
                                            <p className="text-xs font-mono text-primary">{item.tx}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>
        </Layout>
    );
}
