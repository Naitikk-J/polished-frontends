import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TxState = "idle" | "signing" | "broadcasting" | "confirming" | "success" | "error";

const stateLabels: Record<TxState, string> = {
  idle: "",
  signing: "Signing credential...",
  broadcasting: "Broadcasting to network...",
  confirming: "Anchoring on Polygon blockchain...",
  success: "Credential issued successfully!",
  error: "Transaction failed. Please try again.",
};

export default function IssuerPage() {
  const [txState, setTxState] = useState<TxState>("idle");

  const simulateIssuance = () => {
    setTxState("signing");
    setTimeout(() => setTxState("broadcasting"), 1200);
    setTimeout(() => setTxState("confirming"), 2400);
    setTimeout(() => setTxState("success"), 5000);
  };

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Issuer Portal</h1>
            <p className="text-muted-foreground mt-1">Issue verifiable credentials anchored on Polygon</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-gradient rounded-xl border border-border p-8"
          >
            <h2 className="text-xl font-semibold mb-6">Issue New Credential</h2>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Subject DID</Label>
                <Input
                  placeholder="did:ethr:maticmum:0x..."
                  className="bg-secondary border-border font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Credential Type</Label>
                <Select>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DigitalPassCredential">Digital Pass</SelectItem>
                    <SelectItem value="EmploymentCredential">Employment</SelectItem>
                    <SelectItem value="EducationCredential">Education</SelectItem>
                    <SelectItem value="EventPassCredential">Event Pass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Subject Name</Label>
                  <Input placeholder="Alice Johnson" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Pass Type</Label>
                  <Input placeholder="e.g. Premium, Standard" className="bg-secondary border-border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Access Level</Label>
                  <Input placeholder="e.g. Full Access" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Expiry Date</Label>
                  <Input type="date" className="bg-secondary border-border" />
                </div>
              </div>

              {/* Transaction state feedback */}
              {txState !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`rounded-lg p-4 flex items-center gap-3 ${
                    txState === "success" ? "bg-success/10 border border-success/30" :
                    txState === "error" ? "bg-destructive/10 border border-destructive/30" :
                    "bg-primary/10 border border-primary/30"
                  }`}
                >
                  {txState === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : txState === "error" ? (
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{stateLabels[txState]}</p>
                    {(txState === "confirming") && (
                      <p className="text-xs text-muted-foreground mt-1">This typically takes 5-15 seconds. Do not close this window.</p>
                    )}
                    {txState === "success" && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">TX: 0xa8f3c2...e91b4d</p>
                    )}
                  </div>
                </motion.div>
              )}

              <Button
                onClick={simulateIssuance}
                disabled={txState !== "idle" && txState !== "success" && txState !== "error"}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-gradient rounded-xl border border-border p-8 mt-8"
          >
            <h2 className="text-xl font-semibold mb-4">Recent Issuances</h2>
            <div className="space-y-3">
              {[
                { id: "cred-001", type: "DigitalPassCredential", subject: "Alice Johnson", date: "2025-01-15", tx: "0xa8f3...e91b" },
                { id: "cred-002", type: "EmploymentCredential", subject: "Bob Smith", date: "2025-02-20", tx: "0x7c2d...3fa8" },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
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
        </div>
      </section>
    </Layout>
  );
}
