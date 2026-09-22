import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../lib/cart";

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState(null);
  const [tries, setTries] = useState(0);
  const { clear } = useCart();

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (cancelled) return;
        setStatus(data);
        if (data.payment_status === "paid") {
          clear();
          return;
        }
        if (tries < 10) {
          setTries((t) => t + 1);
          setTimeout(tick, 2000);
        }
      } catch {
        if (!cancelled) setStatus({ error: true });
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [sessionId]);

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center" data-testid="payment-success-page">
      <div className="max-w-md w-full mx-auto px-4 text-center metal-border rounded-2xl p-10">
        {!status ? (
          <>
            <Loader2 className="w-12 h-12 text-cyan-300 mx-auto mb-4 animate-spin" />
            <h1 className="display text-2xl font-black mb-2">Confirming…</h1>
            <p className="text-slate-400 text-sm">
              Talking to Stripe. Hang tight.
            </p>
          </>
        ) : status.payment_status === "paid" ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h1 className="display text-3xl font-black mb-2">Signal received.</h1>
            <p className="text-slate-300 mb-2">
              Payment confirmed — <span className="mono text-cyan-300">${status.amount?.toFixed(2)}</span>
            </p>
            <p className="text-slate-500 text-xs mono mb-6">
              Session {sessionId?.slice(0, 20)}…
            </p>
            <Link
              to="/account"
              className="inline-flex h-11 px-5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold glow-cyan items-center"
              data-testid="success-view-orders-link"
            >
              View your orders
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-amber-300 mx-auto mb-4 animate-spin" />
            <h1 className="display text-2xl font-black mb-2">Still processing…</h1>
            <p className="text-slate-400 text-sm">
              Your payment is being finalised. Check back in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center" data-testid="payment-cancel-page">
      <div className="max-w-md w-full mx-auto px-4 text-center metal-border rounded-2xl p-10">
        <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
        <h1 className="display text-3xl font-black mb-2">Payment cancelled</h1>
        <p className="text-slate-400 mb-6">
          No charge was made. Your cart is still ready when you are.
        </p>
        <Link
          to="/shop"
          className="inline-flex h-11 px-5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold glow-cyan items-center"
          data-testid="cancel-back-to-shop"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
