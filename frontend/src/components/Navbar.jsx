import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  X,
  ShoppingBag,
  UserCircle2,
  LogIn,
  Zap,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

const links = [
  { to: "/", label: "Home" },
  { to: "/apps", label: "Apps" },
  { to: "/instruments", label: "Instruments" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user } = useAuth();
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 glass border-b border-cyan-500/10"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2"
          data-testid="brand-link"
        >
          <span className="w-9 h-9 rounded-lg metal-border flex items-center justify-center glow-cyan">
            <Zap className="w-5 h-5 text-cyan-400" />
          </span>
          <span className="display text-xl font-extrabold tracking-tight">
            GROOV<span className="text-cyan-400">LABZ</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `mono-label px-3 py-2 rounded-md transition-all ${
                  isActive
                    ? "text-cyan-300 bg-cyan-500/10"
                    : "text-slate-400 hover:text-cyan-300 hover:bg-white/[0.02]"
                }`
              }
              data-testid={`nav-link-${l.label.toLowerCase()}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="relative w-10 h-10 rounded-full metal-border flex items-center justify-center hover:border-cyan-400/50 transition-all"
            data-testid="open-cart-button"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-300" />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold flex items-center justify-center"
                data-testid="cart-count-badge"
              >
                {count}
              </span>
            )}
          </button>

          {user && user.id ? (
            <Link
              to="/account"
              className="hidden sm:inline-flex items-center gap-2 px-3 h-10 rounded-full metal-border text-cyan-200 hover:border-cyan-400 transition-all"
              data-testid="nav-account-link"
            >
              <UserCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm glow-cyan transition-all"
              data-testid="nav-login-link"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 rounded-md metal-border flex items-center justify-center"
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-4 h-4 text-cyan-300" />
            ) : (
              <Menu className="w-4 h-4 text-cyan-300" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/10">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `mono-label py-3 px-2 rounded-md ${
                    isActive
                      ? "text-cyan-300 bg-cyan-500/10"
                      : "text-slate-400"
                  }`
                }
                data-testid={`mobile-nav-${l.label.toLowerCase()}`}
              >
                {l.label}
              </NavLink>
            ))}
            {user && user.id ? (
              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-2 text-cyan-300"
                data-testid="mobile-nav-account"
              >
                Account
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-2 text-cyan-300"
                data-testid="mobile-nav-login"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
