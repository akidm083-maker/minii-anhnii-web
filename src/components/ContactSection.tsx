import React, { useEffect, useState } from 'react';
import {
  Mail,
  Copy,
  Check,
  Send,
  MapPin,
  ExternalLink,
  LogIn,
  CheckCheck,
  Trash2,
  Inbox,
  MessageSquareShare,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { PERSONAL_INFO } from '../data/works';
import {
  db,
  generateValidDocId,
  handleFirestoreError,
  isQuotaExceededError,
  OperationType,
} from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

interface ContactMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  message: string;
  status: 'new' | 'read';
  createdAt?: Timestamp | null;
}

export function ContactSection() {
  const { user, authReady, isAdmin, signInWithGoogle, authLoading, markQuotaExceeded } = useFirebase();
  const [copied, setCopied] = useState(false);
  const [discordConfigured, setDiscordConfigured] = useState<boolean | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    contact: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [inboxMessages, setInboxMessages] = useState<ContactMessageItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showMailFallback, setShowMailFallback] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/discord-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.configured === 'boolean') {
          setDiscordConfigured(data.configured);
        }
      })
      .catch(() => {
        if (active) setDiscordConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFormState((prev) => ({
        ...prev,
        name: prev.name || user.displayName || '',
        contact: prev.contact || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setInboxMessages([]);
      return;
    }

    const uid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
    const path = 'contactMessages';
    const q = isAdmin
      ? query(collection(db, path), orderBy('createdAt', 'desc'), limit(25))
      : query(collection(db, path), where('senderId', '==', uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs
          .map((d) => {
            const data = d.data();
            const ts = data.createdAt instanceof Timestamp ? data.createdAt : null;
            return {
              id: d.id,
              senderId: String(data.senderId || ''),
              senderName: String(data.senderName || 'Зочин'),
              subject: String(data.subject || ''),
              message: String(data.message || ''),
              status: (data.status === 'read' ? 'read' : 'new') as 'new' | 'read',
              createdAt: ts,
              sortMs: ts ? ts.toMillis() : Date.now(),
            };
          })
          .sort((a, b) => b.sortMs - a.sortMs)
          .map(({ sortMs: _s, ...rest }) => rest);
        setInboxMessages(loaded);
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [authReady, user, isAdmin, markQuotaExceeded]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PERSONAL_INFO.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const buildMailtoHref = () => {
    const cleanName = formState.name.trim() || 'Зочин';
    const cleanContact = formState.contact.trim();
    const cleanSubject = formState.subject.trim() || 'Хамтран ажиллах санал';
    const cleanMessage = formState.message.trim();
    const contactLine = cleanContact ? `\nХолбоо барих: ${cleanContact}` : '';
    return `mailto:${PERSONAL_INFO.email}?subject=${encodeURIComponent(
      cleanSubject
    )}&body=${encodeURIComponent(`Нэр: ${cleanName}${contactLine}\n\nЗурвас:\n${cleanMessage}`)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSentMessage(null);
    setShowMailFallback(false);

    const cleanName = formState.name.trim().slice(0, 80);
    const cleanContact = formState.contact.trim().slice(0, 120);
    const cleanSubject = (formState.subject.trim() || 'Хамтран ажиллах санал').slice(0, 120);
    const cleanMessage = formState.message.trim().slice(0, 1500);

    if (!cleanName || !cleanMessage) {
      setFormError('Нэр болон зурвасаа заавал бөглөнө үү.');
      return;
    }

    setSending(true);
    let savedToFirebase = false;
    let firebaseQuotaBlocked = false;

    try {
      if (user && user.emailVerified) {
        const messageId = generateValidDocId('msg');
        const senderId = user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
        const docPath = `contactMessages/${messageId}`;
        const firestoreMessage = cleanContact
          ? `${cleanMessage}\n\n[Холбоо барих: ${cleanContact}]`.slice(0, 1500)
          : cleanMessage;

        try {
          await setDoc(doc(db, 'contactMessages', messageId), {
            id: messageId,
            senderId,
            senderName: cleanName,
            subject: cleanSubject,
            message: firestoreMessage,
            status: 'new',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          savedToFirebase = true;
        } catch (error) {
          if (isQuotaExceededError(error)) {
            markQuotaExceeded();
            firebaseQuotaBlocked = true;
          } else {
            handleFirestoreError(error, OperationType.CREATE, docPath);
          }
        }
      }

      let sentToDiscord = false;
      let discordErrorCode: string | null = null;
      let discordErrorMsg: string | null = null;

      try {
        const res = await fetch('/api/contact-discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            contact: cleanContact || user?.email || '',
            subject: cleanSubject,
            message: cleanMessage,
            savedToFirebase,
          }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.ok) {
          sentToDiscord = true;
          setDiscordConfigured(true);
        } else {
          discordErrorCode = data?.code || null;
          discordErrorMsg = data?.error || null;
          if (discordErrorCode === 'DISCORD_NOT_CONFIGURED') {
            setDiscordConfigured(false);
          }
        }
      } catch {
        discordErrorMsg = 'Сервертэй холбогдож чадсангүй.';
      }

      if (sentToDiscord && savedToFirebase) {
        setSentMessage('Таны санал Discord болон Firebase-д амжилттай илгээгдлээ!');
        setFormState((prev) => ({ ...prev, subject: '', message: '' }));
      } else if (sentToDiscord) {
        setSentMessage('Таны хамтын ажиллагааны санал Discord руу амжилттай илгээгдлээ!');
        setFormState((prev) => ({ ...prev, subject: '', message: '' }));
      } else if (savedToFirebase) {
        setSentMessage(
          discordErrorCode === 'DISCORD_NOT_CONFIGURED'
            ? 'Таны санал Firebase-д хадгалагдлаа! (Discord Webhook тохируулсны дараа шууд Discord-д очно)'
            : 'Таны санал Firebase өгөгдлийн санд амжилттай хадгалагдлаа!'
        );
        setFormState((prev) => ({ ...prev, subject: '', message: '' }));
      } else {
        setShowMailFallback(true);
        setFormError(
          discordErrorCode === 'DISCORD_NOT_CONFIGURED'
            ? 'Discord Webhook хараахан тохируулаагүй байна. Google-ээр нэвтэрч илгээх эсвэл доорх и-мэйл товчийг ашиглана уу.'
            : firebaseQuotaBlocked
              ? 'Өгөгдлийн сангийн хязгаар дүүрсэн байна. Доорх и-мэйл товчоор шууд илгээнэ үү.'
              : discordErrorMsg || 'Зурвас илгээх үед алдаа гарлаа. И-мэйлээр илгээнэ үү.'
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (msgId: string) => {
    if (!isAdmin) return;
    const docPath = `contactMessages/${msgId}`;
    try {
      await updateDoc(doc(db, 'contactMessages', msgId), {
        status: 'read',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    const docPath = `contactMessages/${msgId}`;
    try {
      await deleteDoc(doc(db, 'contactMessages', msgId));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  return (
    <section id="contact-section" className="py-16 sm:py-20 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
            <Mail className="w-3.5 h-3.5" />
            <span>Холбоо барих</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Төсөл, хамтын ажиллагааны санал илгээх
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Шинэ веб төсөл, зөвлөгөө эсвэл хамтран ажиллах хүсэлтээ илгээвэл шууд Discord суваг руу (нэвтэрсэн бол Firebase-д давхар) хүрнэ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Зүүн тал: Шууд мэдээлэл & И-мэйл хуулах */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Шууд холбогдох и-мэйл хаяг
                </span>
                <div className="text-lg sm:text-xl font-bold text-white font-mono select-all">
                  {PERSONAL_INFO.email}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-950" />
                      <span>И-мэйл хуулагдлаа!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>И-мэйл хуулах</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span>Шууд бичих</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{PERSONAL_INFO.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MessageSquareShare className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {discordConfigured === true
                      ? 'Discord шууд мэдэгдэл идэвхтэй'
                      : 'Discord болон Firebase-ээр санал хүлээн авна'}
                  </span>
                </div>
                <div className="text-slate-400">
                  {PERSONAL_INFO.status}
                </div>
              </div>
            </div>
          </div>

          {/* Баруун тал: Интерактив зурвас илгээх маягт */}
          <div className="lg:col-span-7 space-y-6">
            <form
              onSubmit={handleSubmit}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">
                  Хамтын ажиллагааны санал илгээх
                </h3>
                {!user ? (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google-ээр нэвтэрч давхар хадгалах</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">
                    Discord + Firebase хадгалалт идэвхтэй
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Таны нэр
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    placeholder="Жишээ: Бат"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Discord / И-мэйл (Хариу авах)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={formState.contact}
                    onChange={(e) =>
                      setFormState({ ...formState, contact: e.target.value })
                    }
                    placeholder="Жишээ: @username эсвэл email"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Саналын сэдэв
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={formState.subject}
                  onChange={(e) =>
                    setFormState({ ...formState, subject: e.target.value })
                  }
                  placeholder="Жишээ: Вэб төсөл дээр хамтран ажиллах, CS2 баг..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Саналын дэлгэрэнгүй
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={1500}
                  value={formState.message}
                  onChange={(e) =>
                    setFormState({ ...formState, message: e.target.value })
                  }
                  placeholder="Төслийн зорилго, шаардлага эсвэл хамтран ажиллах саналаа бичнэ үү..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              {formError && (
                <div className="space-y-2">
                  <p className="text-xs text-rose-400">{formError}</p>
                  {showMailFallback && (
                    <a
                      href={buildMailtoHref()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>И-мэйл програмаар илгээх</span>
                    </a>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {sentMessage ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{sentMessage}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    {user
                      ? 'Discord руу мэдэгдэж, Firebase-д аюулгүй хадгална.'
                      : 'Шууд Discord суваг руу илгээгдэнэ.'}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Илгээж байна...' : 'Discord руу илгээх'}</span>
                </button>
              </div>
            </form>

            {/* Илгээсэн / Ирсэн зурвасууд (Нэвтэрсэн үед) */}
            {user && inboxMessages.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-amber-400" />
                    <span>{isAdmin ? 'Ирсэн зурвасууд (Admin)' : 'Миний илгээсэн зурвасууд'}</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {inboxMessages.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {inboxMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-white truncate">{msg.subject}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400 truncate">{msg.senderName}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className={msg.status === 'read' ? 'text-emerald-400' : 'text-amber-400'}>
                            {msg.status === 'read' ? 'Уншсан' : 'Шинэ'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAdmin && msg.status !== 'read' && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(msg.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Уншсан болгох"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
