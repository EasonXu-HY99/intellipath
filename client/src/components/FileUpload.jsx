import { useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { fieldCls, PrimaryButton } from "./ui.jsx";
import { SourceIcon } from "./SourceBadge.jsx";

export default function FileUpload({ sites = [], onClose, onUploaded }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null),
    [description, setDescription] = useState(""),
    [level, setLevel] = useState(user.cyber_level),
    [site, setSite] = useState("Workspace"),
    [destination, setDestination] = useState("local"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Choose a file first.");
    if (file.size === 0 || file.size > 5 * 1024 * 1024)
      return setError("Choose a non-empty file up to 5 MB.");
    setBusy(true);
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Unable to read the file."));
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const result = await api.uploadFile({
        filename: file.name,
        data,
        description,
        required_level: level,
        site,
        destination,
      });
      onUploaded(result.file);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="workspace-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-title"
    >
      <div className="workspace-modal-panel max-w-xl">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="eyebrow">CONTRIBUTE KNOWLEDGE</p>
            <h2 id="upload-title" className="text-xl font-semibold mt-1">
              Upload a file
            </h2>
          </div>
          <button aria-label="Close upload" disabled={busy} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="upload-drop">
            <UploadCloud size={30} />
            <strong>{file ? file.name : "Choose an engineering file"}</strong>
            <span>
              PDF, Office files, TXT, MD, CSV, JSON, PNG or JPG · up to 5 MB
            </span>
            <input
              aria-label="File to upload"
              type="file"
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="setting-field">
            Description
            <textarea
              maxLength={2000}
              className={fieldCls}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add project, vessel, device IDs or keywords to help others find this file."
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="setting-field">
              Site
              <select
                className={fieldCls}
                value={site}
                onChange={(e) => setSite(e.target.value)}
              >
                <option>Workspace</option>
                {sites.map((s) => (
                  <option key={s.name}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="setting-field">
              Required clearance
              <select
                className={fieldCls}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              >
                {Array.from({ length: user.cyber_level }, (_, i) => i + 1).map(
                  (l) => (
                    <option key={l} value={l}>
                      L{l} and above
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <label className="setting-field">
            Storage target
            <select
              className={fieldCls}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="local">IntelliPath — local storage</option>
              <option value="onedrive_demo">
                OneDrive — demo target (stored in IntelliPath)
              </option>
            </select>
          </label>
          <div className="file-storage-note">
            <SourceIcon
              source={destination === "local" ? "intellipath" : "onedrive"}
            />
            <p>
              {destination === "local"
                ? "The file is saved to this platform and becomes searchable immediately."
                : "This records OneDrive as a demo target. Your file stays in IntelliPath; no Microsoft account or synchronization is connected."}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            TXT, MD, CSV and JSON content is indexed (first 50,000 characters).
            Other files use filename and description. Render demo storage resets
            on redeploy; keep your original files.
          </p>
          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
          <PrimaryButton disabled={busy || !file} className="w-full">
            {busy ? "Saving file…" : "Save to IntelliPath"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
