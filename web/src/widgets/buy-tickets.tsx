import "@/index.css";

import { useState } from "react";
import { mountWidget } from "skybridge/web";
import { useOpenExternal } from "skybridge/web";
import { useLayout } from "skybridge/web";
import { useToolInfo } from "../helpers.js";

interface Session {
  id: string;
  start: string;
  description: string;
  remaining: number;
  sold: number;
  quota: number;
}

interface Ticket {
  id: string;
  name: string;
  price: number;
}

interface Meta {
  sessions: Session[];
  tickets: Ticket[];
  shopBase: string;
  coverUrl: string;
}

function formatDate(dateStr: string): { day: string; time: string } {
  const d = new Date(dateStr.replace(" ", "T"));
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const day = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  const time = `${d.getHours()}h${d.getMinutes().toString().padStart(2, "0")}`;
  return { day, time };
}

function BuyTickets() {
  const { output, isPending, responseMetadata } = useToolInfo<"buy-tickets">();
  const meta = responseMetadata as Meta | undefined;
  const openExternal = useOpenExternal();
  const [step, setStep] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const { theme } = useLayout();
  const isDark = theme === "dark";

  if (isPending || !output || !meta) {
    return (
      <div className={`card ${isDark ? "dark" : "light"}`}>
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const { sessions, tickets, shopBase, coverUrl } = meta;
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className={`card ${isDark ? "dark" : "light"}`}>
      {/* Step 0: Intro */}
      {step === 0 && (
        <div>
          <div className="poster-wrapper">
            <img src={coverUrl} alt="Esperanza" className="poster" />
          </div>
          <div className="header">
            <h1 className="title">Esperanza</h1>
            <p className="subtitle">Spectacle Musical par i-Majine</p>
            <div className="info-row">
              <span className="icon">📍</span>
              <span>La Longère de Beaupuy, Mouilleron-le-Captif</span>
            </div>
          </div>
          <div className="intro-prices">
            {tickets.map((t) => (
              <span key={t.id} className="intro-price-tag">
                {t.price}€ <span className="intro-price-label">{t.name}</span>
              </span>
            ))}
          </div>
          <button className="cta" onClick={() => setStep(1)}>
            Réserver des places
          </button>
        </div>
      )}

      {/* Step 1: Choose date */}
      {step === 1 && (
        <div>
          <div className="header-compact">
            <h1 className="title-sm">Esperanza</h1>
          </div>
          <div className="steps">
            <div className="step-dot active">1</div>
            <div className="step-line" />
            <div className="step-dot">2</div>
            <div className="step-line" />
            <div className="step-dot">3</div>
          </div>
          <div className="section">
            <button className="back-btn" onClick={() => setStep(0)}>
              ← Retour
            </button>
            <h2 className="section-title">Choisissez une séance</h2>
            <div className="dates-list">
              {sessions.map((s) => {
                const { day, time } = formatDate(s.start);
                const soldOut = s.remaining <= 0;
                const almostFull = s.remaining > 0 && s.remaining <= 30;
                return (
                  <button
                    key={s.id}
                    className={`date-card ${soldOut ? "sold-out" : ""}`}
                    onClick={() => {
                      if (!soldOut) {
                        setSelectedSessionId(s.id);
                        setStep(2);
                      }
                    }}
                    disabled={soldOut}
                  >
                    <div className="date-card-main">
                      <span className="date-label">{day}</span>
                      <span className="date-time">{time}</span>
                    </div>
                    <div className="date-card-meta">
                      {soldOut ? (
                        <span className="badge badge-sold-out">Complet</span>
                      ) : almostFull ? (
                        <span className="badge badge-warning">
                          {s.remaining} places
                        </span>
                      ) : (
                        <span className="badge badge-ok">Disponible</span>
                      )}
                      {s.description && (
                        <span className="session-note">{s.description}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Choose ticket type */}
      {step === 2 && selectedSession && (
        <div>
          <div className="header-compact">
            <h1 className="title-sm">Esperanza</h1>
          </div>
          <div className="steps">
            <div className="step-dot active">1</div>
            <div className="step-line" />
            <div className="step-dot active">2</div>
            <div className="step-line" />
            <div className="step-dot">3</div>
          </div>
          <div className="section">
            <button className="back-btn" onClick={() => { setStep(1); setSelectedSessionId(""); }}>
              ← Changer de séance
            </button>
            <div className="chosen-summary">
              {formatDate(selectedSession.start).day} à{" "}
              {formatDate(selectedSession.start).time}
            </div>
            <h2 className="section-title">Choisissez votre tarif</h2>
            <div className="tickets-list">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  className={`ticket-card ${selectedTicketId === t.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setStep(3);
                  }}
                >
                  <span className="ticket-name">{t.name}</span>
                  <span className="ticket-price">{t.price}€</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm and book */}
      {step === 3 && selectedSession && selectedTicket && (
        <div>
          <div className="header-compact">
            <h1 className="title-sm">Esperanza</h1>
          </div>
          <div className="steps">
            <div className="step-dot active">1</div>
            <div className="step-line" />
            <div className="step-dot active">2</div>
            <div className="step-line" />
            <div className="step-dot active">3</div>
          </div>
          <div className="section">
            <button className="back-btn" onClick={() => { setStep(2); setSelectedTicketId(""); }}>
              ← Changer de tarif
            </button>
            <div className="summary-card">
              <h2 className="section-title">Récapitulatif</h2>
              <div className="summary-row">
                <span className="summary-label">Séance</span>
                <span className="summary-value">
                  {formatDate(selectedSession.start).day} à{" "}
                  {formatDate(selectedSession.start).time}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Tarif</span>
                <span className="summary-value">
                  {selectedTicket.name} — {selectedTicket.price}€
                </span>
              </div>
            </div>
            <button
              className="cta"
              onClick={() => openExternal(`${shopBase}&session=${selectedSession.id}`)}
            >
              Réserver sur Billetweb
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuyTickets;

mountWidget(<BuyTickets />);
