import { Shield, Github, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold gradient-text">ChainID</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Blockchain-backed digital identity. Own your credentials. Verify without trust.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/wallet" className="hover:text-primary transition-colors">Wallet</Link></li>
              <li><Link to="/issuer" className="hover:text-primary transition-colors">Issuer Portal</Link></li>
              <li><Link to="/verifier" className="hover:text-primary transition-colors">Verifier</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Smart Contracts</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Community</h4>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          © 2025 ChainID — Blockchain-Backed Digital Pass & Identity System
        </div>
      </div>
    </footer>
  );
}
