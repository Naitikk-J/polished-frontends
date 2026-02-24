import { motion } from "framer-motion";
import { Shield, Key, QrCode, ArrowRight, Lock, Fingerprint, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  }),
};

const features = [
  {
    icon: Fingerprint,
    title: "Self-Sovereign Identity",
    description: "Users own their credentials. No central authority holds your data — your private key, your identity.",
  },
  {
    icon: LinkIcon,
    title: "Blockchain Anchored",
    description: "Every credential hash is immutably recorded on Polygon. Tamper-proof, transparent, and verifiable.",
  },
  {
    icon: QrCode,
    title: "QR Verification",
    description: "Present credentials via time-limited QR codes. Challenge-response protocol prevents replay attacks.",
  },
  {
    icon: Lock,
    title: "Cryptographic Security",
    description: "AES-encrypted key storage, JWT-signed credentials, and three-layer verification ensure trust.",
  },
];

const actors = [
  {
    role: "User (Holder)",
    description: "Install the wallet, generate your DID, receive credentials, and present them via QR code. Your private key never leaves your device.",
    icon: Key,
    link: "/wallet",
    cta: "Open Wallet",
  },
  {
    role: "Issuer",
    description: "Trusted organizations sign credentials and anchor hashes on-chain. Universities, employers, and government agencies vouch for user attributes.",
    icon: Shield,
    link: "/issuer",
    cta: "Issuer Portal",
  },
  {
    role: "Verifier",
    description: "Scan QR codes and cryptographically verify credentials in real-time. No phone-home required — verification is trustless.",
    icon: CheckCircle2,
    link: "/verifier",
    cta: "Verify Now",
  },
];

const flowSteps = [
  { step: "01", title: "Create DID", description: "Wallet generates a secp256k1 key pair and derives a decentralized identifier." },
  { step: "02", title: "Issue Credential", description: "Issuer signs a Verifiable Credential (JWT) and anchors the hash on Polygon." },
  { step: "03", title: "Present via QR", description: "User signs a challenge nonce and encodes the Verifiable Presentation as a QR code." },
  { step: "04", title: "Verify On-Chain", description: "Verifier checks signature, expiry, revocation status, and hash integrity — all cryptographically." },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-mono text-primary mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Powered by Polygon Blockchain
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            >
              Your Identity,{" "}
              <span className="gradient-text">On-Chain</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              A blockchain-backed digital pass system where users hold their own signed credentials.
              Verify without trust. No central authority required.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-8 glow">
                <Link to="/wallet">
                  Launch Wallet <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary font-semibold text-base px-8">
                <Link to="/issuer">
                  Issue Credentials
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for <span className="gradient-text">Trustless</span> Verification</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every architectural decision serves one goal: eliminating the need for a central authority in identity verification.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-gradient rounded-xl p-6 border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">End-to-End <span className="gradient-text">Data Flow</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From DID creation to cryptographic verification — every step is designed for security and user sovereignty.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {flowSteps.map((step, i) => (
              <motion.div
                key={step.step}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative"
              >
                <div className="card-gradient rounded-xl p-6 border border-border h-full">
                  <span className="text-4xl font-bold text-primary/20 font-mono">{step.step}</span>
                  <h3 className="font-semibold text-lg mt-2 mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {i < flowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Actors */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Three <span className="gradient-text">Actors</span>, One System</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every action is performed by one of three actors. Understanding their roles is the key to understanding the architecture.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {actors.map((actor, i) => (
              <motion.div
                key={actor.role}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-gradient rounded-xl p-8 border border-border hover:border-primary/30 transition-all group flex flex-col"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:animate-pulse-glow transition-all">
                  <actor.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3">{actor.role}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{actor.description}</p>
                <Button asChild variant="outline" className="mt-6 border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 w-full font-semibold">
                  <Link to={actor.link}>
                    {actor.cta} <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
              Ready to Own Your <span className="gradient-text">Identity</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto relative z-10">
              Start by creating your decentralized identity. No email required. No central authority. Just cryptography.
            </p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-10 glow relative z-10">
              <Link to="/wallet">
                Create Your DID <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
