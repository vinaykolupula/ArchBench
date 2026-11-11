import React, { useState } from "react";
import { Bomb, ShieldCheck, ArrowRight, RotateCcw } from "lucide-react";

interface SimProps {
  onInteract?: () => void;
}

export const SimOutboxSaga: React.FC<SimProps> = ({ onInteract }) => {
  const [pattern, setPattern] = useState<"dual_write" | "outbox" | "saga_comp">("dual_write");
  const [crashInjected, setCrashInjected] = useState<boolean>(true);

  const act = (fn: () => void) => {
    fn();
    onInteract?.();
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131519] border border-zinc-800 rounded-xl p-3.5 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "dual_write", label: "Naive Dual-Write" },
              { id: "outbox", label: "Transactional Outbox + CDC" },
              { id: "saga_comp", label: "Saga + Compensating Undo" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => act(() => setPattern(p.id))}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                pattern === p.id
                  ? "chrome-button-accent"
                  : "bg-[#1a1d24] text-zinc-400 border-zinc-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => act(() => setCrashInjected((c) => !c))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
            crashInjected
              ? "bg-red-950/60 text-red-200 border-red-700"
              : "chrome-button text-zinc-200"
          }`}
        >
          {crashInjected ? <Bomb className="w-3.5 h-3.5 text-red-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
          <span>{crashInjected ? "Crash Fault: INJECTED" : "Healthy Execution"}</span>
        </button>
      </div>

      {/* SVG Workflow Trace */}
      <div className="bg-[#111317] border border-zinc-800 rounded-xl p-3 drafting-dot-grid">
        {pattern !== "saga_comp" ? (
          <svg viewBox="0 0 740 185" className="w-full h-44">
            <defs>
              <marker id="ob-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#a1a1aa" />
              </marker>
            </defs>
            <rect x="24" y="45" width="135" height="66" rx="8" fill="#1b1e25" stroke="#52525b" />
            <text x="91" y="72" textAnchor="middle" fill="#f4f4f5" fontSize="10" fontWeight="700">
              Order Service
            </text>
            <text x="91" y="90" textAnchor="middle" fill="#a1a1aa" fontSize="8.5">
              POST /orders
            </text>

            <rect x="235" y="18" width="215" height="62" rx="8" fill="#15251f" stroke="#10b981" />
            <text x="342" y="42" textAnchor="middle" fill="#f4f4f5" fontSize="10" fontWeight="700">
              PostgreSQL Primary
            </text>
            <text x="342" y="60" textAnchor="middle" fill="#6ee7b7" fontSize="8.5">
              {pattern === "outbox"
                ? "1 ACID TX: orders + outbox_row"
                : "COMMIT INSERT INTO orders"}
            </text>

            <rect
              x="530"
              y="55"
              width="180"
              height="68"
              rx="8"
              fill={pattern === "dual_write" && crashInjected ? "#2b1618" : "#15251f"}
              stroke={pattern === "dual_write" && crashInjected ? "#ef4444" : "#10b981"}
            />
            <text x="620" y="80" textAnchor="middle" fill="#f4f4f5" fontSize="10" fontWeight="700">
              Kafka + Warehouse
            </text>
            <text
              x="620"
              y="99"
              textAnchor="middle"
              fill={pattern === "dual_write" && crashInjected ? "#fca5a5" : "#6ee7b7"}
              fontSize="8.5"
            >
              {pattern === "dual_write" && crashInjected
                ? "EVENT NEVER ARRIVED!"
                : "RELAYED AT-LEAST-ONCE"}
            </text>

            <line x1="159" y1="68" x2="231" y2="50" stroke="#10b981" strokeWidth="1.8" markerEnd="url(#ob-arrow)" />

            {pattern === "dual_write" ? (
              <g>
                <line
                  x1="159"
                  y1="92"
                  x2="526"
                  y2="92"
                  stroke={crashInjected ? "#ef4444" : "#34d399"}
                  strokeWidth="1.8"
                  strokeDasharray={crashInjected ? "5 4" : undefined}
                  markerEnd="url(#ob-arrow)"
                />
                {crashInjected && (
                  <text x="342" y="122" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="700">
                    X POD OOM CRASH BEFORE kafka.send() — SILENT PHANTOM ORDER!
                  </text>
                )}
              </g>
            ) : (
              <g>
                <rect x="265" y="102" width="165" height="52" rx="8" fill="#18202c" stroke="#38bdf8" />
                <text x="347" y="124" textAnchor="middle" fill="#bae6fd" fontSize="9.5" fontWeight="700">
                  Debezium CDC Relay
                </text>
                <text x="347" y="140" textAnchor="middle" fill="#7dd3fc" fontSize="8">
                  Tails WAL &rarr; Durable Retry
                </text>
                <line x1="342" y1="80" x2="342" y2="99" stroke="#38bdf8" strokeWidth="1.6" markerEnd="url(#ob-arrow)" />
                <line x1="430" y1="128" x2="526" y2="95" stroke="#10b981" strokeWidth="1.8" markerEnd="url(#ob-arrow)" />
              </g>
            )}
          </svg>
        ) : (
          <svg viewBox="0 0 740 185" className="w-full h-44">
            <rect x="30" y="34" width="135" height="54" rx="8" fill="#15251f" stroke="#10b981" />
            <text x="97" y="57" textAnchor="middle" fill="#f4f4f5" fontSize="9.5" fontWeight="700">
              1. Debit Wallet
            </text>
            <text x="97" y="73" textAnchor="middle" fill="#6ee7b7" fontSize="8">
              LOCAL TX COMMITTED
            </text>

            <rect x="215" y="34" width="140" height="54" rx="8" fill="#15251f" stroke="#10b981" />
            <text x="285" y="57" textAnchor="middle" fill="#f4f4f5" fontSize="9.5" fontWeight="700">
              2. Reserve Flight
            </text>
            <text x="285" y="73" textAnchor="middle" fill="#6ee7b7" fontSize="8">
              LOCAL TX COMMITTED
            </text>

            <rect
              x="405"
              y="34"
              width="155"
              height="54"
              rx="8"
              fill={crashInjected ? "#2b1618" : "#15251f"}
              stroke={crashInjected ? "#ef4444" : "#10b981"}
            />
            <text x="482" y="57" textAnchor="middle" fill="#f4f4f5" fontSize="9.5" fontWeight="700">
              3. Reserve Hotel
            </text>
            <text
              x="482"
              y="73"
              textAnchor="middle"
              fill={crashInjected ? "#fca5a5" : "#6ee7b7"}
              fontSize="8"
            >
              {crashInjected ? "SOLD OUT / TIMEOUT!" : "BOOKED SUCCESSFULLY"}
            </text>

            <line x1="165" y1="61" x2="215" y2="61" stroke="#34d399" strokeWidth="1.6" />
            <line x1="355" y1="61" x2="405" y2="61" stroke={crashInjected ? "#ef4444" : "#34d399"} strokeWidth="1.6" />

            {crashInjected && (
              <g>
                <rect x="45" y="114" width="500" height="50" rx="8" fill="#231c14" stroke="#f59e0b" />
                <text x="295" y="135" textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="700">
                  COMPENSATING SAGA ROLLBACK TRACK (Semantic Undo Actions)
                </text>
                <text x="295" y="152" textAnchor="middle" fill="#fde68a" fontSize="8.5">
                  CancelFlightSeat(idempotent) -&gt; CreditWalletRefund(idempotent) =&gt; Consistent Final State!
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      <div className="bg-[#16181e] border border-zinc-800 rounded-xl p-3 text-[11px] flex items-start gap-2.5">
        {pattern === "dual_write" && crashInjected ? (
          <ArrowRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className="text-zinc-300 leading-relaxed">
          {pattern === "dual_write"
            ? crashInjected
              ? "Failure Mode (DATA-001): Database committed the order, then pod died before Kafka ACK arrived. Warehouse never ships!"
              : "Notice: Healthy runs hide the bug! Dual-write race conditions only erupt during crashes, deploys, or broker blips."
            : pattern === "outbox"
            ? "Even when the app pod crashes right after SQL commit, the outbox record survived atomically inside PostgreSQL so Debezium CDC safely publishes it upon restart."
            : crashInjected
            ? "Sagas avoid brittle 2PC distributed database locks by executing compensating backward undo actions sequentially."
            : "All 3 independent service local transactions succeeded cleanly."}
        </div>
      </div>
    </div>
  );
};
