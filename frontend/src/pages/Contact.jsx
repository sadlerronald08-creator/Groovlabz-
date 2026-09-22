import { useState } from "react";
import { Mail, Send, MapPin, MessageCircle } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent — we'll respond within 24 hours");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16" data-testid="contact-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mono-label mb-3">Contact</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Say hello. <span className="text-cyan-300">We're listening.</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Product feedback, partnership inquiries, or just wanting to nerd out
            about signal chains? Drop us a line — we reply within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 metal-border rounded-2xl p-6 sm:p-8">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
                  data-testid="contact-name-input"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-12 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
                  data-testid="contact-email-input"
                />
              </div>
              <input
                required
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full h-12 px-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100"
                data-testid="contact-subject-input"
              />
              <textarea
                required
                rows={6}
                placeholder="Your message…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-4 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-cyan-400 focus:outline-none text-slate-100 resize-none"
                data-testid="contact-message-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold glow-cyan transition-all"
                data-testid="contact-submit-button"
              >
                <Send className="w-4 h-4" />
                {loading ? "Sending…" : "Send message"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="metal-border rounded-2xl p-5">
              <Mail className="w-5 h-5 text-cyan-300 mb-3" />
              <p className="mono-label mb-1">Email</p>
              <p className="text-slate-200 text-sm">hello@groovlabz.com</p>
            </div>
            <div className="metal-border rounded-2xl p-5">
              <MessageCircle className="w-5 h-5 text-cyan-300 mb-3" />
              <p className="mono-label mb-1">Support</p>
              <p className="text-slate-200 text-sm">support@groovlabz.com</p>
            </div>
            <div className="metal-border rounded-2xl p-5">
              <MapPin className="w-5 h-5 text-cyan-300 mb-3" />
              <p className="mono-label mb-1">Studio HQ</p>
              <p className="text-slate-200 text-sm">
                812 Signal Ave, Nashville TN 37201
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
