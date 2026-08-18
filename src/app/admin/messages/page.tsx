'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Conversation {
  id: string;
  counterpart_org_id: string;
  counterpart_name: string;
  counterpart_slug: string;
  counterpart_logo: string | null;
  counterpart_wilaya: string | null;
  counterpart_phone: string | null;
  context_type: string;
  context_id: string | null;
  context_title: string | null;
  last_message_text: string | null;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_org_id: string;
  sender_user_id: string;
  sender_user_name?: string;
  sender_org_name?: string;
  message_text: string;
  dtc_attachment: string | null;
  part_ref_attachment: string | null;
  is_read: boolean;
  created_at: string;
}

export default function DirectMessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const activeOrgId = session?.user?.organizationId;
  const newToOrg = searchParams.get('new_to_org');
  const initialContextType = searchParams.get('context_type') || 'general';
  const initialContextId = searchParams.get('context_id') || null;
  const initialContextTitle = searchParams.get('context_title') || null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Composer fields
  const [messageText, setMessageText] = useState('');
  const [dtcAttachment, setDtcAttachment] = useState('');
  const [partRefAttachment, setPartRefAttachment] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        // If no active conversation selected yet, pick first
        if (!activeConvId && data.length > 0 && !newToOrg) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch single conversation message history
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConv(data.conversation);
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Handle initial direct link parameter (?new_to_org=...)
  useEffect(() => {
    async function initDirectChat() {
      if (newToOrg && activeOrgId) {
        try {
          const res = await fetch('/api/messages/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient_org_id: newToOrg,
              context_type: initialContextType,
              context_id: initialContextId,
              context_title: initialContextTitle,
            }),
          });
          if (res.ok) {
            const conv = await res.json();
            setActiveConvId(conv.id);
            await fetchConversations();
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
    initDirectChat();
  }, [newToOrg, activeOrgId]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // When activeConvId changes, fetch messages
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  // Real-time polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConvId) {
        fetchMessages(activeConvId);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !messageText.trim() || sending) return;

    try {
      setSending(true);
      const res = await fetch(`/api/messages/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: messageText.trim(),
          dtc_attachment: dtcAttachment.trim() || null,
          part_ref_attachment: partRefAttachment.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de l’envoi du message.');

      setMessageText('');
      setDtcAttachment('');
      setPartRefAttachment('');
      setShowAttachments(false);

      await fetchMessages(activeConvId);
      await fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-7xl h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Messagerie Directe Inter-Garages</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Échangez en temps réel avec vos confrères garagistes, experts en diagnostic et fournisseurs de pièces en Algérie.
          </p>
        </div>
      </div>

      {/* Split-Pane Chat Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Pane: Conversations List (320px) */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 bg-slate-950/40">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Discussions ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucune conversation en cours. Contactez un atelier depuis la Marketplace ou l&apos;Annuaire.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === activeConvId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition ${
                      isSelected
                        ? 'bg-blue-600/10 border-l-4 border-blue-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-xs shrink-0 uppercase border border-slate-700">
                      {c.counterpart_name.slice(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-xs truncate">
                          {c.counterpart_name}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                            {c.unread_count}
                          </span>
                        )}
                      </div>

                      {c.context_title && (
                        <span className="text-[10px] text-blue-400 font-semibold truncate block mt-0.5">
                          {c.context_title}
                        </span>
                      )}

                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {c.last_message_text || 'Nouvelle conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Stream & Composer */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
          {activeConv ? (
            <>
              {/* Top Chat Bar */}
              <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-600/20">
                    {activeConv.counterpart_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-100 text-sm">{activeConv.counterpart_name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Wilaya : {activeConv.counterpart_wilaya || 'Algérie'}
                      {activeConv.context_title && ` • Réf : ${activeConv.context_title}`}
                    </p>
                  </div>
                </div>

                {activeConv.counterpart_phone && (
                  <a
                    href={`tel:${activeConv.counterpart_phone}`}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Appeler</span>
                  </a>
                )}
              </div>

              {/* Messages History List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-12">
                    Démarrez votre échange technique en écrivant un message ci-dessous.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_org_id === activeOrgId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-1.5 shadow-md ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                          }`}
                        >
                          {/* Attached Badges if present */}
                          {(m.dtc_attachment || m.part_ref_attachment) && (
                            <div className="flex flex-wrap gap-1.5 pb-1">
                              {m.dtc_attachment && (
                                <span className="px-2 py-0.5 rounded bg-slate-950/40 text-amber-300 font-mono font-bold text-[10px]">
                                  DTC: {m.dtc_attachment}
                                </span>
                              )}
                              {m.part_ref_attachment && (
                                <span className="px-2 py-0.5 rounded bg-slate-950/40 text-cyan-300 font-mono font-bold text-[10px]">
                                  RÉF: {m.part_ref_attachment}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap">{m.message_text}</p>
                        </div>

                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-mono px-1">
                          <span>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            <span>• {m.is_read ? 'Vu' : 'Envoyé'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
                {/* Optional Attachments Bar */}
                {showAttachments && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                        Code Défaut DTC lié
                      </label>
                      <input
                        type="text"
                        placeholder="ex: P0300, DF053"
                        value={dtcAttachment}
                        onChange={(e) => setDtcAttachment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-cyan-400 uppercase mb-1">
                        Réf. Pièce OEM liée
                      </label>
                      <input
                        type="text"
                        placeholder="ex: 0445110369"
                        value={partRefAttachment}
                        onChange={(e) => setPartRefAttachment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachments(!showAttachments)}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      showAttachments
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                    title="Joindre Code DTC ou Réf. Pièce"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    required
                    placeholder="Écrivez votre message à l'atelier..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    <span>Envoyer</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-slate-500 text-xs">
              Sélectionnez une discussion pour afficher les messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
