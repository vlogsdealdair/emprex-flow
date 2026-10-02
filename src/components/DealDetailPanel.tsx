import { useState } from "react";
import {
  CalendarClock, CheckCircle2, Circle, Clock3, Mail, MessageCircle,
  StickyNote, X, Phone, BriefcaseBusiness, Plus
} from "lucide-react";
import {
  useAddDealNote,
  useCreateDealTask,
  useCurrentProfile,
  useDealActivities,
  useDealTasks,
  useToggleTaskComplete,
} from "@/hooks/useCrm";
import { whatsappUrl, type DealView } from "@/services/crmService";
import { formatCurrency } from "@/utils/formatters";

export default function DealDetailPanel({ deal, onClose, onEdit }: {
  deal: DealView;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { data: profile } = useCurrentProfile();
  const { data: activities = [] } = useDealActivities(deal.id);
  const { data: tasks = [] } = useDealTasks(deal.id);
  const addNote = useAddDealNote();
  const createTask = useCreateDealTask();
  const toggleTask = useToggleTaskComplete();

  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  if (!profile) return null;

  const submitNote = async () => {
    const body = note.trim();
    if (!body) return;
    await addNote.mutateAsync({ dealId: deal.id, contactId: deal.contact_id, body, profileId: profile.id });
    setNote("");
  };

  const submitTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;
    await createTask.mutateAsync({
      dealId: deal.id,
      contactId: deal.contact_id,
      title,
      dueAt: taskDue ? new Date(taskDue).toISOString() : null,
      assignedTo: profile.id,
      createdBy: profile.id,
      priority: "medium",
    });
    setTaskTitle("");
    setTaskDue("");
  };

  const activityIcon = (type: string) => {
    if (type === "note") return <StickyNote size={13} />;
    if (type === "whatsapp") return <MessageCircle size={13} />;
    if (type === "email") return <Mail size={13} />;
    if (type === "call") return <Phone size={13} />;
    return <Clock3 size={13} />;
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/45" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{deal.stage.name}</p>
            <h2 className="text-base font-bold text-white truncate">{deal.contact.full_name}</h2>
            <p className="text-xs text-slate-500 mt-1">{deal.service?.name || "Sin servicio"} · {formatCurrency(Number(deal.potential_value_usd || 0))}</p>
          </div>
          <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">Editar</button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 grid place-items-center text-slate-500"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <section className="p-5 border-b border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Empresa" value={deal.contact.company || "—"} icon={<BriefcaseBusiness size={12} />} />
              <Info label="Responsable" value={deal.closer?.full_name || deal.setter?.full_name || "Sin asignar"} icon={<Circle size={10} />} />
              <Info label="Email" value={deal.contact.email || "—"} icon={<Mail size={12} />} />
              <Info label="Seguimiento" value={deal.next_follow_up_at ? new Date(deal.next_follow_up_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }) : "—"} icon={<CalendarClock size={12} />} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {deal.contact.phone_e164 && (
                <a href={whatsappUrl(deal.contact.phone_e164)} target="_blank" rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5">
                  <MessageCircle size={13} /> Abrir WhatsApp
                </a>
              )}
              {deal.contact.email && (
                <a href={`mailto:${deal.contact.email}`} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs inline-flex items-center gap-1.5">
                  <Mail size={13} /> Email
                </a>
              )}
            </div>
          </section>

          <section className="p-5 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tareas</h3>
              <span className="text-[10px] text-slate-600">{tasks.filter(t => !t.completed_at).length} pendientes</span>
            </div>

            <div className="grid grid-cols-[1fr_150px_auto] gap-2 mb-3">
              <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Nueva tarea..."
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
              <input type="datetime-local" value={taskDue} onChange={e => setTaskDue(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none" />
              <button onClick={() => void submitTask()} disabled={createTask.isPending}
                className="w-9 rounded-lg bg-blue-600 grid place-items-center text-white disabled:opacity-50"><Plus size={14} /></button>
            </div>

            <div className="space-y-2">
              {tasks.slice(0, 8).map(task => (
                <button key={task.id} onClick={() => void toggleTask.mutateAsync({ task, dealId: deal.id })}
                  className="w-full flex items-start gap-2 text-left bg-slate-900 border border-slate-800 rounded-lg p-3">
                  {task.completed_at ? <CheckCircle2 size={15} className="text-emerald-500 mt-0.5" /> : <Circle size={15} className="text-slate-600 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${task.completed_at ? "text-slate-600 line-through" : "text-slate-200"}`}>{task.title}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{task.due_at ? new Date(task.due_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }) : "Sin fecha"}</p>
                  </div>
                </button>
              ))}
              {tasks.length === 0 && <p className="text-xs text-slate-600">No hay tareas todavía.</p>}
            </div>
          </section>

          <section className="p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Actividad</h3>
            <div className="flex gap-2 mb-4">
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Añadir nota..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none resize-none" />
              <button onClick={() => void submitNote()} disabled={addNote.isPending}
                className="px-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 disabled:opacity-50">Guardar</button>
            </div>

            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 grid place-items-center text-slate-500 flex-shrink-0">
                    {activityIcon(a.type)}
                  </div>
                  <div className="flex-1 min-w-0 border-b border-slate-900 pb-3">
                    <p className="text-xs text-slate-300">{a.body || a.type}</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {a.creator?.full_name || "Sistema"} · {new Date(a.created_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-xs text-slate-600">Sin actividad registrada.</p>}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 uppercase tracking-wider mb-1">{icon}{label}</div>
      <p className="text-xs text-slate-200 truncate">{value}</p>
    </div>
  );
}
