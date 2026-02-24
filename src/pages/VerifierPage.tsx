import { motion } from "framer-motion";
import { QrCode, CheckCircle2, XCircle, Clock, Shield, Hash, RefreshCw } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

type VerifyState = "idle" | "scanning" | "verifying" | "granted" | "denied";

export default function VerifierPage() {
  const [state, setState] = useState<VerifyState>("idle");
  const [timeLeft, setTimeLeft] = useState(300);

  const simulateVerification = () => {
    setState("scanning");
    setTimeout(() => setState("verifying"), 2000);
    setTimeout(() => setState("granted"), 3500);
  };

  const reset = () => {
    setState("idle");
    setTimeLeft(300);
  };

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Verifier Dashboard</h1>
            <p className="text-muted-foreground mt-1">Scan and verify credentials using challenge-response protocol</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QR Scanner / Challenge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-gradient rounded-xl border border-border p-8 flex flex-col items-center"
            >
              <h2 className="text-lg font-semibold mb-6 self-start">Challenge QR</h2>

              {state === "idle" && (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-48 h-48 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Generate a challenge QR code for the credential holder to scan.
                  </p>
                  <Button
                    onClick={simulateVerification}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" /> Generate Challenge
                  </Button>
                </div>
              )}

              {state === "scanning" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 rounded-xl bg-primary/5 border border-primary/30 flex items-center justify-center animate-pulse-glow">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="text-xs font-mono text-primary">SCANNING...</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Waiting for credential presentation...</p>
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                </div>
              )}

              {(state === "verifying" || state === "granted" || state === "denied") && (
                <div className="flex flex-col items-center gap-4 w-full">
                  {state === "verifying" && (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                  {state === "granted" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
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
                  <p className="text-lg font-bold">
                    {state === "verifying" && "Verifying..."}
                    {state === "granted" && "ACCESS GRANTED"}
                    {state === "denied" && "ACCESS DENIED"}
                  </p>
                  {(state === "granted" || state === "denied") && (
                    <Button variant="outline" onClick={reset} className="border-border text-foreground hover:bg-secondary mt-2">
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
              <h2 className="text-lg font-semibold mb-6">Verification Checks</h2>

              {state === "idle" || state === "scanning" ? (
                <div className="space-y-4 text-muted-foreground">
                  {["Signature Valid", "Not Expired", "Not Revoked", "Hash Matches"].map((check) => (
                    <div key={check} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="w-5 h-5 rounded-full bg-muted" />
                      <span className="text-sm">{check}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {[
                    { label: "Signature Valid", icon: Shield, passed: true },
                    { label: "Not Expired", icon: Clock, passed: true },
                    { label: "Not Revoked", icon: XCircle, passed: true },
                    { label: "Hash Matches", icon: Hash, passed: true },
                  ].map((check, i) => (
                    <motion.div
                      key={check.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 + 0.5 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        state === "verifying" ? "bg-primary/5 border border-primary/20" :
                        check.passed ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"
                      }`}
                    >
                      {state === "verifying" ? (
                        <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                      ) : check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">{check.label}</span>
                    </motion.div>
                  ))}

                  {state === "granted" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="mt-6 p-4 rounded-lg bg-secondary/50 space-y-2"
                    >
                      <p className="text-xs text-muted-foreground">Holder DID</p>
                      <p className="font-mono text-xs text-primary">did:ethr:maticmum:0xA1c3...7bF9</p>
                      <p className="text-xs text-muted-foreground mt-2">Credential Type</p>
                      <p className="text-sm font-medium">DigitalPassCredential</p>
                      <p className="text-xs text-muted-foreground mt-2">Access Level</p>
                      <p className="text-sm font-medium">Full Campus</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
