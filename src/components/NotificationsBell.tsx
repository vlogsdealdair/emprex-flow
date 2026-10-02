import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { useMarkNotificationRead, useNotifications } from "@/hooks/useCrm";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unread = notifications.filter(n => !n.read_at).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 grid place-items-center text-slate-500 hover:text-slate-300">
        <Bell size={14} />
        {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[9px] font-bold text-white grid place-items-center">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <p className="text-xs font-bold text-white">Notificaciones</p>
            <span className="text-[10px] text-slate-600">{unread} sin leer</span>
          </div>
          <div className="divide-y divide-slate-900">
            {notifications.map(n => (
              <button key={n.id} onClick={() => { if (!n.read_at) void markRead.mutateAsync(n.id); }}
                className={`w-full text-left px-4 py-3 hover:bg-slate-900 ${n.read_at ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                    {n.body && <p className="text-[11px] text-slate-500 mt-1">{n.body}</p>}
                    <p className="text-[10px] text-slate-700 mt-1">{new Date(n.created_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                  {!n.read_at && <Check size={12} className="text-blue-500 mt-1" />}
                </div>
              </button>
            ))}
            {notifications.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-600">Sin notificaciones.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
