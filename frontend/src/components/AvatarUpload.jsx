import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import api, { mediaUrl, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function AvatarUpload() {
  const { user, updateUser } = useAuth();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser({ picture: data.picture });
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const initial = (user.name || user.email || "?").trim()[0]?.toUpperCase();

  return (
    <div className="flex flex-col items-center" data-testid="avatar-upload">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative w-20 h-20 rounded-full overflow-hidden metal-border group disabled:opacity-60"
        aria-label="Change profile photo"
        data-testid="avatar-button"
      >
        {user.picture ? (
          <img src={mediaUrl(user.picture)} alt="Profile" className="w-full h-full object-cover" data-testid="avatar-image" />
        ) : (
          <span className="w-full h-full flex items-center justify-center display text-2xl font-black text-cyan-300 bg-slate-900" data-testid="avatar-initial">
            {initial}
          </span>
        )}
        <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-cyan-200" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
        data-testid="avatar-input"
      />
      <p className="mono text-[9px] text-slate-500 mt-2 uppercase tracking-widest">{busy ? "Uploading…" : "Change photo"}</p>
    </div>
  );
}
