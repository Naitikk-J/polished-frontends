import { motion } from "framer-motion";
import { Key, CreditCard, QrCode, Plus, Shield, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const mockCredentials = [
  {
    id: "cred-001",
    type: "DigitalPassCredential",
    issuer: "did:ethr:maticmum:0xUniv...3fa2",
    issuerName: "State University",
    subject: { name: "Alice Johnson", passType: "Student ID", accessLevel: "Full Campus" },
    issuedAt: "2025-01-15",
    expiresAt: "2027-01-15",
    status: "valid" as const,
  },
  {
    id: "cred-002",
    type: "EmploymentCredential",
    issuer: "did:ethr:maticmum:0xCorp...8b1c",
    issuerName: "TechCorp Inc.",
    subject: { name: "Alice Johnson", passType: "Employee Badge", accessLevel: "Building A" },
    issuedAt: "2025-03-01",
    expiresAt: "2026-03-01",
    status: "valid" as const,
  },
  {
    id: "cred-003",
    type: "EventPassCredential",
    issuer: "did:ethr:maticmum:0xEvnt...4d9e",
    issuerName: "DevCon 2025",
    subject: { name: "Alice Johnson", passType: "VIP Pass", accessLevel: "All Areas" },
    issuedAt: "2024-11-01",
    expiresAt: "2024-11-05",
    status: "expired" as const,
  },
];

function CredentialCard({ credential }: { credential: typeof mockCredentials[0] }) {
  const [flipped, setFlipped] = useState(false);
  const isExpired = credential.status === "expired";

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
              <p className="text-xs font-mono text-muted-foreground">{credential.type}</p>
              <h3 className="text-lg font-bold mt-1">{credential.subject.passType}</h3>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isExpired ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
            }`}>
              {isExpired ? "Expired" : "Valid"}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Holder</span>
              <span className="font-medium">{credential.subject.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Access</span>
              <span className="font-medium">{credential.subject.accessLevel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issuer</span>
              <span className="font-medium">{credential.issuerName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Expires {credential.expiresAt}</span>
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
            <p className="font-mono text-sm text-primary">{credential.id}</p>
            <p className="text-xs text-muted-foreground mt-3 mb-1">Issuer DID</p>
            <p className="font-mono text-xs break-all">{credential.issuer}</p>
            <p className="text-xs text-muted-foreground mt-3 mb-1">Issued</p>
            <p className="text-sm">{credential.issuedAt}</p>
          </div>

          {!isExpired && (
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={(e) => e.stopPropagation()}>
              <QrCode className="w-4 h-4 mr-2" /> Present This Credential
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Wallet header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold">My Wallet</h1>
              <p className="text-muted-foreground mt-1">Manage your verifiable credentials</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                <Key className="w-4 h-4 mr-2" /> My DID
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                <Plus className="w-4 h-4 mr-2" /> Add Credential
              </Button>
            </div>
          </div>

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
              <div>
                <p className="text-xs text-muted-foreground">Your Decentralized Identity</p>
                <p className="font-mono text-sm text-primary mt-0.5">did:ethr:maticmum:0xA1c3...7bF9</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{mockCredentials.length}</p>
                <p className="text-xs text-muted-foreground">Credentials</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{mockCredentials.filter(c => c.status === "valid").length}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{mockCredentials.filter(c => c.status === "expired").length}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </motion.div>

          {/* Credentials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCredentials.map((cred, i) => (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <CredentialCard credential={cred} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
