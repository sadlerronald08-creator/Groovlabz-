import { Link } from "react-router-dom";
import { Zap, Github, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="mt-24 border-t border-slate-800/80 bg-slate-950/60 relative"
      data-testid="site-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-lg metal-border flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </span>
            <span className="display font-extrabold text-lg">
              GROOV<span className="text-cyan-400">LABZ</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Studio-grade music tools for creators, producers, and touring
            musicians. Five apps. One frequency.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="signal-dot" />
            <span className="mono text-[11px] text-emerald-400 uppercase tracking-widest">
              Live · Signal locked
            </span>
          </div>
        </div>

        <div>
          <p className="mono-label mb-4">Product</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/apps" className="text-slate-300 hover:text-cyan-300">
                Apps
              </Link>
            </li>
            <li>
              <Link
                to="/instruments"
                className="text-slate-300 hover:text-cyan-300"
              >
                Instruments Playground
              </Link>
            </li>
            <li>
              <Link to="/shop" className="text-slate-300 hover:text-cyan-300">
                Shop Hardware
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4">Company</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-slate-300 hover:text-cyan-300">
                About
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-slate-300 hover:text-cyan-300"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="text-slate-300 hover:text-cyan-300"
                data-testid="footer-privacy-link"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-slate-300 hover:text-cyan-300"
                data-testid="footer-terms-link"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mono-label mb-4">Follow</p>
          <div className="flex gap-3">
            {[Twitter, Instagram, Youtube, Github].map((I, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 rounded-md metal-border flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
                aria-label="social link"
              >
                <I className="w-4 h-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-6 mono">
            © {new Date().getFullYear()} GroovLabz — All frequencies reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
