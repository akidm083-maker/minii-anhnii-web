import React, { useEffect, useState } from 'react';
import { MessageSquarePlus, Trash2, LogIn, Send, MessageCircle } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  db,
  generateValidDocId,
  handleFirestoreError,
  isQuotaExceededError,
  OperationType,
} from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

type GuestbookTag = 'урам' | 'cs2' | 'санал' | 'асуулт';

interface GuestbookItem {
  id: string;
  authorId: string;
  authorName: string;
  message: string;
  tag: GuestbookTag;
  createdAt?: Timestamp | null;
}

const TAG_OPTIONS: { id: GuestbookTag; label: string }[] = [
  { id: 'урам', label: 'Урам зориг' },
  { id: 'cs2', label: 'CS2 Яриа' },
  { id: 'санал', label: 'Санал' },
  { id: 'асуулт', label: 'Асуулт' },
];

export function GuestbookSection() {
  const { user, authReady, isAdmin, signInWithGoogle, authLoading, quotaExceeded, markQuotaExceeded } = useFirebase();
  const [entries, setEntries] = useState<GuestbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [selectedTag, setSelectedTag] = useState<GuestbookTag>('урам');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    const path = 'guestbook';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(24));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: GuestbookItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            authorId: String(data.authorId || ''),
            authorName: String(data.authorName || 'Зочин'),
            message: String(data.message || ''),
            tag: (['урам', 'cs2', 'санал', 'асуулт'].includes(data.tag) ? data.tag : 'урам') as GuestbookTag,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          };
        });
        setEntries(items);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [authReady, markQuotaExceeded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified || submitting) return;

    const cleanMessage = messageText.trim().slice(0, 500);
    if (!cleanMessage) {
      setSubmitError('Сэтгэгдлээ бичнэ үү.');
      return;
    }

    const entryId = generateValidDocId('gb');
    const authorId = user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
    const authorName = (user.displayName || 'Хэрэглэгч').trim().slice(0, 60) || 'Хэрэглэгч';
    const docPath = `guestbook/${entryId}`;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await setDoc(doc(db, 'guestbook', entryId), {
        id: entryId,
        authorId,
        authorName,
        message: cleanMessage,
        tag: selectedTag,
        createdAt: serverTimestamp(),
      });
      setMessageText('');
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        setSubmitError('Өнөөдрийн өгөгдлийн сангийн хязгаар дууссан байна. Маргааш дахин оролдоно уу.');
        return;
      }
      handleFirestoreError(error, OperationType.CREATE, docPath);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    const docPath = `guestbook/${entryId}`;
    try {
      await deleteDoc(doc(db, 'guestbook', entryId));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  const formatDate = (ts?: Timestamp | null) => {
    if (!ts) return 'Дөнгөж сая';
    return ts.toDate().toLocaleDateString('mn-MN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTagLabel = (tag: GuestbookTag) => {
    return TAG_OPTIONS.find((t) => t.id === tag)?.label || tag;
  };

  return (
    <section id="guestbook-section" className="py-16 sm:py-20 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Гарчиг */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Зочны дэвтэр</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Зочдын сэтгэгдэл ба урмын үгс
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              Сайтаар зочилсон сэтгэгдэл, CS2-ын тухай яриа эсвэл урмын үг үлдээгээрэй. Бүх бичвэр Firebase өгөгдлийн санд бодит хугацаанд хадгалагдана.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums shrink-0">
            Нийт <span className="text-white font-semibold">{entries.length}</span> сэтгэгдэл
          </div>
        </div>

        {quotaExceeded && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            Өнөөдрийн үнэгүй өгөгдлийн сангийн унших/бичих хязгаар түр дүүрсэн байна. Маргааш дахин шинэчлэгдэнэ.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Сэтгэгдэл бичих хэсэг */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <MessageSquarePlus className="w-4 h-4 text-amber-400" />
              <span>Сэтгэгдэл үлдээх</span>
            </div>

            {user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-xs text-slate-400 flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span>Бичигч: <strong className="text-slate-200">{user.displayName || 'Хэрэглэгч'}</strong></span>
                  <span className="font-mono text-[11px] text-slate-500">{messageText.length}/500</span>
                </div>

                {/* Сэдвийн сонголт (Interactive filter/tag buttons) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-300 block">Ангилал</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedTag(tag.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          selectedTag === tag.id
                            ? 'bg-amber-400 text-slate-950 font-semibold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">
                    Зурвас
                  </label>
                  <textarea
                    rows={4}
                    maxLength={500}
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Урмын үг, CS2-ийн тухай эсвэл санал сэтгэгдлээ бичнэ үү..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-rose-400">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !messageText.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Хадгалж байна...' : 'Нийтлэх'}</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4 py-2">
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Спамаас хамгаалах зорилгоор та Google бүртгэлээрээ нэвтэрч зочны дэвтэрт сэтгэгдэл бичих боломжтой. Хувийн нууц мэдээлэл нийтэд харагдахгүй.
                </p>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{authLoading ? 'Нэвтэрч байна...' : 'Google-ээр нэвтэрч бичих'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Сэтгэгдлүүдийн жагсаалт */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-10 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <p className="text-sm text-slate-300 font-medium">
                  Одоогоор сэтгэгдэл алга байна.
                </p>
                <p className="text-xs text-slate-500">
                  Анхны урмын үгийг та үлдээгээрэй!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {entries.map((entry) => {
                  const canDelete = isAdmin || (user && user.uid === entry.authorId);
                  return (
                    <article
                      key={entry.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                          <span className="font-semibold text-white truncate">{entry.authorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400 font-medium whitespace-nowrap">{getTagLabel(entry.tag)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            title="Устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                        {entry.message}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
