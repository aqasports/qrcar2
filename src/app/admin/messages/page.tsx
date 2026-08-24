'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  Badge,
  Button,
  Input,
  Spinner,
  EmptyState,
} from '@/components/ui';

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

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

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

  useEffect(() => {
    async function initDirectChat() {
      if (newToOrg && activeOrgId) {
        try {
          const res = await fetch('/api/messages/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_org_id: newToOrg,
              context_type: initialContextType,
              context_id: initialContextId,
              context_title: initialContextTitle,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setActiveConvId(data.conversation.id);
            await fetchConversations();
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        fetchConversations();
      }
    }
    initDirectChat();
  }, [newToOrg, activeOrgId]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const interval = setInterval(() => fetchMessages(activeConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !dtcAttachment && !partRefAttachment) return;
    if (!activeConvId) return;

    try {
      setSending(true);
      const res = await fetch(`/api/messages/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: messageText,
          dtc_attachment: dtcAttachment.trim() || null,
          part_ref_attachment: partRefAttachment.trim() || null,
        }),
      });

      if (res.ok) {
        setMessageText('');
        setDtcAttachment('');
        setPartRefAttachment('');
        setShowAttachments(false);
        fetchMessages(activeConvId);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Messagerie Directe B2B Inter-Ateliers"
        subtitle="Échangez instantanément entre chefs d'atelier sur les pièces de rechange, diagnostics et disponibilités"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Messagerie' },
        ]}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Chargement des conversations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] bg-surface-raised border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
          {/* Left Panel: Conversations List */}
          <div className="lg:col-span-4 border-r border-border-subtle flex flex-col bg-surface-raised">
            <div className="p-4 border-b border-border-subtle">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Discussions Actives ({conversations.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">
                  Aucune conversation en cours. Contactez un atelier depuis la Marketplace ou l&apos;Annuaire.
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeConvId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveConvId(c.id)}
                      className={`w-full text-left p-4 transition-all duration-150 flex items-start gap-3 ${
                        isActive
                          ? 'bg-surface-overlay border-l-4 border-accent'
                          : 'hover:bg-surface-overlay/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary shrink-0">
                        {c.counterpart_name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-text-primary truncate">
                            {c.counterpart_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">
                            {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        {c.context_title && (
                          <span className="text-[10px] text-accent font-medium truncate block mt-0.5">
                            {c.context_title}
                          </span>
                        )}

                        <p className="text-xs text-text-muted truncate mt-1">
                          {c.last_message_text || 'Nouvelle conversation initiée'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Thread */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-surface-base">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-raised">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-overlay border border-border-default flex items-center justify-center font-bold text-sm text-text-primary">
                      {activeConv.counterpart_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">
                        {activeConv.counterpart_name}
                      </h3>
                      <span className="text-xs text-text-muted">
                        {activeConv.counterpart_wilaya || 'Algérie'}
                        {activeConv.counterpart_phone ? ` — ${activeConv.counterpart_phone}` : ''}
                      </span>
                    </div>
                  </div>

                  {activeConv.context_title && (
                    <Badge variant="info">
                      {activeConv.context_title}
                    </Badge>
                  )}
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((m) => {
                    const isMe = m.sender_org_id === activeOrgId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-4 rounded-2xl text-xs sm:text-sm space-y-2 ${
                            isMe
                              ? 'bg-accent text-white rounded-tr-none shadow-lg shadow-blue-500/10'
                              : 'bg-surface-raised border border-border-subtle text-text-primary rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.message_text}</p>

                          {m.dtc_attachment && (
                            <div className="p-2 rounded-xl bg-black/20 font-mono text-[11px] font-bold">
                              Code DTC attaché : {m.dtc_attachment}
                            </div>
                          )}

                          {m.part_ref_attachment && (
                            <div className="p-2 rounded-xl bg-black/20 font-mono text-[11px] font-bold">
                              Réf. Pièce attachée : {m.part_ref_attachment}
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-text-muted mt-1 px-1 font-mono">
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border-subtle bg-surface-raised space-y-3">
                  {showAttachments && (
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-base border border-border-subtle">
                      <Input
                        placeholder="Attacher Code DTC (ex. P0300)"
                        value={dtcAttachment}
                        onChange={(e) => setDtcAttachment(e.target.value.toUpperCase())}
                      />
                      <Input
                        placeholder="Attacher Réf. Pièce (ex. 8200...)"
                        value={partRefAttachment}
                        onChange={(e) => setPartRefAttachment(e.target.value.toUpperCase())}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachments(!showAttachments)}
                      className="p-2.5 rounded-xl border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-overlay transition"
                      title="Attacher un code DTC ou une référence pièce"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    <div className="flex-1">
                      <Input
                        placeholder="Rédigez votre message à l'atelier..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                    </div>

                    <Button type="submit" isLoading={sending}>
                      Envoyer
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <EmptyState
                  title="Sélectionnez une discussion"
                  description="Choisissez un atelier partenaire dans la colonne de gauche pour afficher les messages."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
