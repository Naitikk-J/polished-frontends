import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, Wallet, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

const navItems = [
    { label: "Home", path: "/" },
    { label: "Wallet", path: "/wallet" },
    { label: "Issuer Portal", path: "/issuer" },
    { label: "Verifier", path: "/verifier" },
];

export default function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const wallet = useWallet();

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 glass"
        >
            <div className="container mx-auto flex items-center justify-between h-16 px-4">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                        <span className="gradient-text">DIGIPASS</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    {wallet.isConnected ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-xs font-mono font-medium text-primary">
                                {wallet.shortAddress}
                            </span>
                            <button
                                onClick={wallet.disconnect}
                                className="ml-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                title="Disconnect"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                            onClick={wallet.connect}
                            disabled={wallet.isConnecting}
                        >
                            {wallet.isConnecting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> ...</>
                            ) : (
                                <><Wallet className="w-4 h-4 mr-2" /> Connect</>
                            )}
                        </Button>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    className="md:hidden text-foreground"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-border overflow-hidden"
                    >
                        <div className="flex flex-col p-4 gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${location.pathname === item.path
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="mt-4 pt-4 border-t border-border">
                                {wallet.isConnected ? (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                            <span className="text-xs font-mono font-medium text-primary">
                                                {wallet.shortAddress}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive h-8"
                                            onClick={() => {
                                                wallet.disconnect();
                                                setMobileOpen(false);
                                            }}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> Logout
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full bg-primary text-primary-foreground font-semibold"
                                        onClick={() => {
                                            wallet.connect();
                                            setMobileOpen(false);
                                        }}
                                    >
                                        <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
