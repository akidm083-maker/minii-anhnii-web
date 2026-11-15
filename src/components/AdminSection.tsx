import { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Mail,
  MessageCircle,
  Users,
  Bot,
  Search,
  CheckCheck,
  Trash2,
  Download,
  Lock,
  LogIn,
} from 'lucide-react';
import {
  collection,
  collectionGroup,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  isQuotaExceededError,
  OperationType,
} from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

type AdminTab = 'messages' | 'guestbook' | 'users' | 'chats';

interface AdminContactMsg {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  message: string;
  status: 'new' | 'read';
  createdAt?: Timestamp | null;
}

interface AdminGuestbookEntry {
  id: string;
  authorId: string;
  authorName: string;
  message: string;
  tag: string;
  createdAt?: Timestamp | null;
}

interface AdminUserRecord {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  updatedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
}

interface AdminChatRecord {
  id: string;
  userId: string;
  sender: 'user' | 'niko';
  text: string;
  createdAt?: Timestamp | null;
}

export function AdminSection() {
  const { user, authReady, isAdmin, authLoading, signInWithGoogle, quotaExceeded, markQuotaExceeded } = useFirebase();
  const [activeTab, setActiveTab] = useState<AdminTab>('messages');
  const [searchQuery, setSearchQuery] = useState('');

  const [messages, setMessages] = useState<AdminContactMsg[]>([]);
  const [guestbook, setGuestbook] = useState<AdminGuestbookEntry[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<Record<string, { uid: string; displayName: string; photoURL?: string; updatedAt?: Timestamp | null }>>({});
  const [privateInfos, setPrivateInfos] = useState<Record<string, { uid: string; email: string; createdAt?: Timestamp | null }>>({});
  const [chats, setChats] = useState<AdminChatRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!authReady || !isAdmin) {
      setMessages([]);
      setGuestbook([]);
      setPublicProfiles({});
      setPrivateInfos({});
      setChats([]);
      return;
    }

    setLoadingData(true);

    const unsubMessages = onSnapshot(
      query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              senderId: String(data.senderId || ''),
              senderName: String(data.senderName || 'Зочин'),
              subject: String(data.subject || ''),
              message: String(data.message || ''),
              status: (data.status === 'read' ? 'read' : 'new') as 'new' | 'read',
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
            };
          })
        );
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'contactMessages');
      }
    );

    const unsubGuestbook = onSnapshot(
      query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => {
        setGuestbook(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              authorId: String(data.authorId || ''),
              authorName: String(data.authorName || 'Зочин'),
              message: String(data.message || ''),
              tag: String(data.tag || 'урам'),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
            };
          })
        );
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'guestbook');
      }
    );

    const unsubPublicUsers = onSnapshot(
      collectionGroup(db, 'public'),
      (snap) => {
        const next: Record<string, { uid: string; displayName: string; photoURL?: string; updatedAt?: Timestamp | null }> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const uid = String(data.uid || '');
          if (uid) {
            next[uid] = {
              uid,
              displayName: String(data.displayName || 'Хэрэглэгч'),
              photoURL: data.photoURL ? String(data.photoURL) : undefined,
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
            };
          }
        });
        setPublicProfiles(next);
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'users/*/public');
      }
    );

    const unsubPrivateUsers = onSnapshot(
      collectionGroup(db, 'private'),
      (snap) => {
        const next: Record<string, { uid: string; email: string; createdAt?: Timestamp | null }> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const uid = String(data.uid || '');
          if (uid) {
            next[uid] = {
              uid,
              email: String(data.email || ''),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
            };
          }
        });
        setPrivateInfos(next);
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'users/*/private');
      }
    );

    const unsubChats = onSnapshot(
      collectionGroup(db, 'nikoChats'),
      (snap) => {
        const loaded = snap.docs
          .map((d) => {
            const data = d.data();
            const ts = data.createdAt instanceof Timestamp ? data.createdAt : null;
            return {
              id: d.id,
              userId: String(data.userId || ''),
              sender: (data.sender === 'user' ? 'user' : 'niko') as 'user' | 'niko',
              text: String(data.text || ''),
              createdAt: ts,
              sortMs: ts ? ts.toMillis() : 0,
            };
          })
          .sort((a, b) => b.sortMs - a.sortMs)
          .slice(0, 150)
          .map(({ sortMs: _s, ...rest }) => rest);
        setChats(loaded);
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
          return;
        }
        handleFirestoreError(error, OperationType.LIST, 'users/*/nikoChats');
      }
    );

    return () => {
      unsubMessages();
      unsubGuestbook();
      unsubPublicUsers();
      unsubPrivateUsers();
      unsubChats();
    };
  }, [authReady, isAdmin, markQuotaExceeded]);

  const usersList: AdminUserRecord[] = useMemo(() => {
    const uids = new Set([...Object.keys(publicProfiles), ...Object.keys(privateInfos)]);
    return Array.from(uids)
      .map((uid) => ({
        uid,
        displayName: publicProfiles[uid]?.displayName || 'Хэрэглэгч',
        photoURL: publicProfiles[uid]?.photoURL,
        email: privateInfos[uid]?.email,
        updatedAt: publicProfiles[uid]?.updatedAt,
        createdAt: privateInfos[uid]?.createdAt,
      }))
      .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  }, [publicProfiles, privateInfos]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.status === 'new').length,
    [messages]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredMessages = useMemo(() => {
    if (!normalizedQuery) return messages;
    return messages.filter(
      (m) =>
        m.senderName.toLowerCase().includes(normalizedQuery) ||
        m.subject.toLowerCase().includes(normalizedQuery) ||
        m.message.toLowerCase().includes(normalizedQuery)
    );
  }, [messages, normalizedQuery]);

  const filteredGuestbook = useMemo(() => {
    if (!normalizedQuery) return guestbook;
    return guestbook.filter(
      (g) =>
        g.authorName.toLowerCase().includes(normalizedQuery) ||
        g.message.toLowerCase().includes(normalizedQuery) ||
        g.tag.toLowerCase().includes(normalizedQuery)
    );
  }, [guestbook, normalizedQuery]);

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return usersList;
    return usersList.filter(
      (u) =>
        u.displayName.toLowerCase().includes(normalizedQuery) ||
        (u.email || '').toLowerCase().includes(normalizedQuery) ||
        u.uid.toLowerCase().includes(normalizedQuery)
    );
  }, [usersList, normalizedQuery]);

  const filteredChats = useMemo(() => {
    if (!normalizedQuery) return chats;
    return chats.filter((c) => {
      const userName = publicProfiles[c.userId]?.displayName || '';
      return (
        c.text.toLowerCase().includes(normalizedQuery) ||
        userName.toLowerCase().includes(normalizedQuery) ||
        c.userId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [chats, publicProfiles, normalizedQuery]);

  const formatTs = (ts?: Timestamp | null) => {
    if (!ts) return 'Саяхан';
    return ts.toDate().toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkMessageRead = async (msgId: string) => {
    const path = `contactMessages/${msgId}`;
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
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteContactMessage = async (msgId: string) => {
    const path = `contactMessages/${msgId}`;
    try {
      await deleteDoc(doc(db, 'contactMessages', msgId));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteGuestbookEntry = async (entryId: string) => {
    const path = `guestbook/${entryId}`;
    try {
      await deleteDoc(doc(db, 'guestbook', entryId));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteChatMessage = async (userId: string, msgId: string) => {
    const path = `users/${userId}/nikoChats/${msgId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'nikoChats', msgId));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleExportJson = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      contactMessages: messages.map((m) => ({ ...m, createdAt: m.createdAt?.toDate().toISOString() ?? null })),
      guestbook: guestbook.map((g) => ({ ...g, createdAt: g.createdAt?.toDate().toISOString() ?? null })),
      users: usersList.map((u) => ({
        ...u,
        updatedAt: u.updatedAt?.toDate().toISOString() ?? null,
        createdAt: u.createdAt?.toDate().toISOString() ?? null,
      })),
      nikoChats: chats.map((c) => ({ ...c, createdAt: c.createdAt?.toDate().toISOString() ?? null })),
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firebase-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="admin-section" className="py-16 sm:py-20 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Гарчиг */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <Shield className="w-4 h-4" />
              <span>Админ Самбар</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">Cloud Firestore</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Өгөгдлийн сангийн удирдлага ба хяналт
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Сайтын бүх хадгалагдсан зурвас, зочны дэвтэр, бүртгэлтэй хэрэглэгчид болон Niko чатын түүхийг нэг дороос шууд харах, удирдах хэсэг.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON нөөц татах</span>
            </button>
          )}
        </div>

        {!isAdmin ? (
          /* Админ нэвтрэлт шаардлагатай үед */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Зөвхөн Админ эрхтэй харах боломжтой
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                  {user
                    ? `Одоо "${user.email}" хаягаар нэвтэрсэн байна. Өгөгдлийн санг бүрэн харахын тулд админ бүртгэлээр (akidm083@gmail.com) нэвтэрнэ үү.`
                    : 'Өгөгдлийн санд хадгалагдсан мэдээллээ харахын тулд админ Google бүртгэлээрээ (akidm083@gmail.com) нэвтэрнэ үү.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{user ? 'Админ хаяг солих' : 'Админ нэвтрэх'}</span>
            </button>
          </div>
        ) : (
          /* Бүрэн Админ Хяналтын Самбар */
          <div className="space-y-8">
            {quotaExceeded && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                Өнөөдрийн үнэгүй өгөгдлийн сангийн унших хязгаар хэтэрсэн байна. Маргааш автоматаар сэргэнэ.
              </div>
            )}

            {/* 4 баганат тоон үзүүлэлтүүд (Tabular numerals) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Ирсэн зурвас</span>
                  <Mail className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {messages.length}
                </div>
                <div className="text-xs text-amber-400 font-mono tabular-nums">
                  {unreadCount} шинэ зурвас
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Зочны дэвтэр</span>
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {guestbook.length}
                </div>
                <div className="text-xs text-slate-500">Нийтлэгдсэн сэтгэгдэл</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Хэрэглэгчид</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {usersList.length}
                </div>
                <div className="text-xs text-slate-500">Google-ээр нэвтэрсэн</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Niko чат</span>
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {chats.length}
                </div>
                <div className="text-xs text-slate-500">Хадгалагдсан мессеж</div>
              </div>
            </div>

            {/* Табууд болон Хайлт */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'messages'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ирсэн зурвас ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guestbook')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'guestbook'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Зочны дэвтэр ({guestbook.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'users'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Хэрэглэгчид ({usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chats')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'chats'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Niko чат ({chats.length})
                </button>
              </div>

              <div className="relative w-full sm:w-72 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Нэр, имэйл, агуулгаар хайх..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Агуулгын хүснэгт / жагсаалт */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Өгөгдлийн сангаас татаж байна...
                </div>
              ) : activeTab === 'messages' ? (
                filteredMessages.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    Ирсэн зурвас одоогоор алга байна.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-white">{msg.subject}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-slate-300">{msg.senderName}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className={msg.status === 'read' ? 'text-emerald-400' : 'text-amber-400 font-semibold'}>
                              {msg.status === 'read' ? 'Уншсан' : 'Шинэ'}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                              {formatTs(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <div className="text-[11px] text-slate-600 font-mono">
                            UID: {msg.senderId}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {msg.status !== 'read' && (
                            <button
                              type="button"
                              onClick={() => handleMarkMessageRead(msg.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Уншсан</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteContactMessage(msg.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Устгах</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'guestbook' ? (
                filteredGuestbook.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    Зочны дэвтэрт бичлэг алга байна.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {filteredGuestbook.map((entry) => (
                      <div key={entry.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-white">{entry.authorName}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-amber-400 font-medium">{entry.tag}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                              {formatTs(entry.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                            {entry.message}
                          </p>
                          <div className="text-[11px] text-slate-600 font-mono">
                            UID: {entry.authorId}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGuestbookEntry(entry.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors shrink-0 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Устгах</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'users' ? (
                filteredUsers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    Бүртгэлтэй хэрэглэгч олдсонгүй.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3.5 px-5 font-semibold">Хэрэглэгч</th>
                          <th className="py-3.5 px-5 font-semibold">И-мэйл</th>
                          <th className="py-3.5 px-5 font-semibold">UID</th>
                          <th className="py-3.5 px-5 font-semibold">Сүүлд орсон</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-950/40 transition-colors">
                            <td className="py-3.5 px-5 font-medium text-white">
                              <div className="flex items-center gap-3">
                                {u.photoURL ? (
                                  <img
                                    src={u.photoURL}
                                    alt={u.displayName}
                                    referrerPolicy="no-referrer"
                                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                                    {u.displayName.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <span>{u.displayName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-slate-300 font-mono">
                              {u.email || '—'}
                            </td>
                            <td className="py-3.5 px-5 text-slate-500 font-mono">
                              {u.uid}
                            </td>
                            <td className="py-3.5 px-5 text-slate-400 font-mono tabular-nums whitespace-nowrap">
                              {formatTs(u.updatedAt || u.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : filteredChats.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  Niko чатын түүх олдсонгүй.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {filteredChats.map((chat) => {
                    const ownerName = publicProfiles[chat.userId]?.displayName || chat.userId;
                    return (
                      <div key={`${chat.userId}_${chat.id}`} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={chat.sender === 'niko' ? 'text-amber-400 font-bold' : 'text-white font-bold'}>
                              {chat.sender === 'niko' ? 'Niko (Хариу)' : ownerName}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-slate-400">Эзэмшигч: {ownerName}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                              {formatTs(chat.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                            {chat.text}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteChatMessage(chat.userId, chat.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors shrink-0 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Устгах</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
