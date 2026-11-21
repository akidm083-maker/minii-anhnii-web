import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Search,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  db,
  handleFirestoreError,
  isQuotaExceededError,
  OperationType,
} from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

export type AdminMenuId = 'overview' | 'messages' | 'guestbook' | 'users' | 'chats' | 'tools';

interface AdminSectionProps {
  onBackToSite: () => void;
  onJumpToSection: (sectionId: string) => void;
}

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

interface ActivityItem {
  id: string;
  kind: 'message' | 'guestbook' | 'chat';
  title: string;
  detail: string;
  timestampMs: number;
  createdAt?: Timestamp | null;
  targetMenu: AdminMenuId;
}

const ADMIN_EMAIL = 'akidm083@gmail.com';

const MENU_LABELS: Record<AdminMenuId, string> = {
  overview: 'Ерөнхий тойм',
  messages: 'Ирсэн зурвас',
  guestbook: 'Зочны дэвтэр',
  users: 'Хэрэглэгчид',
  chats: 'Niko чат',
  tools: 'Нөөц ба Систем',
};

export function AdminSection({ onBackToSite, onJumpToSection }: AdminSectionProps) {
  const {
    user,
    authReady,
    isAdmin,
    authLoading,
    signInWithGoogle,
    signOutUser,
    quotaExceeded,
    markQuotaExceeded,
  } = useFirebase();

  const [activeMenu, setActiveMenu] = useState<AdminMenuId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'new' | 'read'>('all');
  const [guestbookTagFilter, setGuestbookTagFilter] = useState<string>('all');
  const [chatSenderFilter, setChatSenderFilter] = useState<'all' | 'user' | 'niko'>('all');
  const [batchUpdating, setBatchUpdating] = useState(false);

  const [messages, setMessages] = useState<AdminContactMsg[]>([]);
  const [guestbook, setGuestbook] = useState<AdminGuestbookEntry[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<
    Record<string, { uid: string; displayName: string; photoURL?: string; updatedAt?: Timestamp | null }>
  >({});
  const [privateInfos, setPrivateInfos] = useState<
    Record<string, { uid: string; email: string; createdAt?: Timestamp | null }>
  >({});
  const [chats, setChats] = useState<AdminChatRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [discordWebhookActive, setDiscordWebhookActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authReady || !isAdmin) return;
    let active = true;
    fetch('/api/discord-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.configured === 'boolean') {
          setDiscordWebhookActive(data.configured);
        }
      })
      .catch(() => {
        if (active) setDiscordWebhookActive(false);
      });
    return () => {
      active = false;
    };
  }, [authReady, isAdmin]);

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
        const next: Record<
          string,
          { uid: string; displayName: string; photoURL?: string; updatedAt?: Timestamp | null }
        > = {};
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

  const unreadMessages = useMemo(
    () => messages.filter((m) => m.status === 'new'),
    [messages]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (messageFilter !== 'all' && m.status !== messageFilter) return false;
      if (!normalizedQuery) return true;
      return (
        m.senderName.toLowerCase().includes(normalizedQuery) ||
        m.subject.toLowerCase().includes(normalizedQuery) ||
        m.message.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [messages, messageFilter, normalizedQuery]);

  const filteredGuestbook = useMemo(() => {
    return guestbook.filter((g) => {
      if (guestbookTagFilter !== 'all' && g.tag !== guestbookTagFilter) return false;
      if (!normalizedQuery) return true;
      return (
        g.authorName.toLowerCase().includes(normalizedQuery) ||
        g.message.toLowerCase().includes(normalizedQuery) ||
        g.tag.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [guestbook, guestbookTagFilter, normalizedQuery]);

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
    return chats.filter((c) => {
      if (chatSenderFilter !== 'all' && c.sender !== chatSenderFilter) return false;
      if (!normalizedQuery) return true;
      const userName = publicProfiles[c.userId]?.displayName || '';
      return (
        c.text.toLowerCase().includes(normalizedQuery) ||
        userName.toLowerCase().includes(normalizedQuery) ||
        c.userId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [chats, chatSenderFilter, publicProfiles, normalizedQuery]);

  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [
      ...messages.slice(0, 6).map((m) => ({
        id: `msg_${m.id}`,
        kind: 'message' as const,
        title: `Шинэ зурвас: ${m.subject}`,
        detail: `${m.senderName} — ${m.message.slice(0, 90)}`,
        timestampMs: m.createdAt ? m.createdAt.toMillis() : 0,
        createdAt: m.createdAt,
        targetMenu: 'messages' as AdminMenuId,
      })),
      ...guestbook.slice(0, 6).map((g) => ({
        id: `gb_${g.id}`,
        kind: 'guestbook' as const,
        title: `Зочны дэвтэр: ${g.authorName}`,
        detail: g.message.slice(0, 90),
        timestampMs: g.createdAt ? g.createdAt.toMillis() : 0,
        createdAt: g.createdAt,
        targetMenu: 'guestbook' as AdminMenuId,
      })),
      ...chats.slice(0, 6).map((c) => {
        const ownerName = publicProfiles[c.userId]?.displayName || c.userId;
        return {
          id: `chat_${c.userId}_${c.id}`,
          kind: 'chat' as const,
          title: c.sender === 'niko' ? `Niko хариу (${ownerName})` : `Niko чат: ${ownerName}`,
          detail: c.text.slice(0, 90),
          timestampMs: c.createdAt ? c.createdAt.toMillis() : 0,
          createdAt: c.createdAt,
          targetMenu: 'chats' as AdminMenuId,
        };
      }),
    ];
    return items.sort((a, b) => b.timestampMs - a.timestampMs).slice(0, 10);
  }, [messages, guestbook, chats, publicProfiles]);

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

  const handleMarkAllMessagesRead = async () => {
    if (unreadMessages.length === 0 || batchUpdating) return;
    setBatchUpdating(true);
    try {
      const batch = writeBatch(db);
      unreadMessages.slice(0, 450).forEach((m) => {
        batch.update(doc(db, 'contactMessages', m.id), {
          status: 'read',
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.UPDATE, 'contactMessages/*');
    } finally {
      setBatchUpdating(false);
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
      contactMessages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt?.toDate().toISOString() ?? null,
      })),
      guestbook: guestbook.map((g) => ({
        ...g,
        createdAt: g.createdAt?.toDate().toISOString() ?? null,
      })),
      users: usersList.map((u) => ({
        ...u,
        updatedAt: u.updatedAt?.toDate().toISOString() ?? null,
        createdAt: u.createdAt?.toDate().toISOString() ?? null,
      })),
      nikoChats: chats.map((c) => ({
        ...c,
        createdAt: c.createdAt?.toDate().toISOString() ?? null,
      })),
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firebase-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const escapeCsvCell = (val: unknown) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
    const csvBody = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMessagesCsv = () => {
    downloadCsv(
      `contact-messages-${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Илгээгч', 'UID', 'Сэдэв', 'Агуулга', 'Төлөв', 'Огноо'],
      messages.map((m) => [
        m.id,
        m.senderName,
        m.senderId,
        m.subject,
        m.message,
        m.status === 'read' ? 'Уншсан' : 'Шинэ',
        m.createdAt?.toDate().toISOString() ?? '',
      ])
    );
  };

  const handleExportGuestbookCsv = () => {
    downloadCsv(
      `guestbook-${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Зохиогч', 'UID', 'Ангилал', 'Сэтгэгдэл', 'Огноо'],
      guestbook.map((g) => [
        g.id,
        g.authorName,
        g.authorId,
        g.tag,
        g.message,
        g.createdAt?.toDate().toISOString() ?? '',
      ])
    );
  };

  const handleExportUsersCsv = () => {
    downloadCsv(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      ['UID', 'Нэр', 'И-мэйл', 'Сүүлд орсон'],
      usersList.map((u) => [
        u.uid,
        u.displayName,
        u.email || '',
        (u.updatedAt || u.createdAt)?.toDate().toISOString() ?? '',
      ])
    );
  };

  const sidebarItems: {
    id: AdminMenuId;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
    highlight?: boolean;
  }[] = [
    { id: 'overview', label: 'Ерөнхий тойм', icon: LayoutDashboard },
    {
      id: 'messages',
      label: 'Ирсэн зурвас',
      icon: Mail,
      count: unreadMessages.length > 0 ? unreadMessages.length : messages.length,
      highlight: unreadMessages.length > 0,
    },
    { id: 'guestbook', label: 'Зочны дэвтэр', icon: MessageCircle, count: guestbook.length },
    { id: 'users', label: 'Хэрэглэгчид', icon: Users, count: usersList.length },
    { id: 'chats', label: 'Niko чат', icon: Bot, count: chats.length },
    { id: 'tools', label: 'Нөөц ба Систем', icon: Database },
  ];

  const showSearchInput =
    activeMenu === 'messages' ||
    activeMenu === 'guestbook' ||
    activeMenu === 'users' ||
    activeMenu === 'chats';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Админ орчны дээд мөр (Dashboard Top Bar Contract) */}
      <header className="sticky top-0 z-40 h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <button
              type="button"
              onClick={onBackToSite}
              className="text-slate-400 hover:text-white transition-colors font-medium whitespace-nowrap shrink-0"
            >
              Портфолио
            </button>
            <span className="text-slate-600" aria-hidden="true">/</span>
            <span className="text-amber-400 font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Админ цэс</span>
            </span>
            {isAdmin && (
              <>
                <span className="text-slate-600 hidden sm:inline" aria-hidden="true">/</span>
                <span className="text-white font-medium truncate hidden sm:inline">
                  {MENU_LABELS[activeMenu]}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Сайт руу буцах</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={signOutUser}
                disabled={authLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                title="Системээс гарах"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Гарах</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!authReady ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-400">
            Нэвтрэлтийн мэдээллийг шалгаж байна...
          </div>
        ) : !isAdmin ? (
          /* Админ нэвтрэлт шаардлагатай үед */
          <div className="max-w-2xl mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Админы тусгай цэс — Хандалт хязгаарлагдсан
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {user
                    ? `Одоо "${user.email}" хаягаар нэвтэрсэн байна. Өгөгдлийн сангийн удирдлагын цэсийг нээхийн тулд зөвхөн админ бүртгэлээр (${ADMIN_EMAIL}) нэвтэрнэ үү.`
                    : `Өгөгдлийн сан, ирсэн зурвас, зочны дэвтэр болон Niko чатын түүхийг удирдахын тулд админ Google бүртгэлээр (${ADMIN_EMAIL}) нэвтэрнэ үү.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{user ? 'Админ хаяг солих' : 'Админ нэвтрэх'}</span>
              </button>

              <button
                type="button"
                onClick={onBackToSite}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 hover:text-white rounded-lg transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Портфолио руу буцах</span>
              </button>
            </div>
          </div>
        ) : (
          /* Бүрэн Админ Workspace (Sidebar Navigation + Main Content Viewport) */
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Зүүн талын тусгай Админ цэс (Sidebar Navigation) */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="px-2 space-y-1">
                  <div className="text-xs font-semibold text-amber-400 tracking-wide">
                    Админ удирдлага
                  </div>
                  <div className="text-xs text-slate-400 truncate font-mono">
                    {user?.email}
                  </div>
                </div>

                <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5" aria-label="Админ цэс">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveMenu(item.id);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-amber-400 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {typeof item.count === 'number' && (
                          <span
                            className={`font-mono tabular-nums text-[11px] shrink-0 ${
                              active
                                ? 'text-slate-950 font-bold'
                                : item.highlight
                                  ? 'text-amber-400 font-bold'
                                  : 'text-slate-500'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Сайтын үндсэн хэсгүүд рүү хурдан шилжих цэс */}
              <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="px-2 text-xs font-semibold text-slate-400">
                  Сайт руу хурдан очих
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'profile-section', label: 'Миний профайл' },
                    { id: 'works-section', label: 'Бүтээлүүд' },
                    { id: 'idol-section', label: 'NiKo туслах' },
                    { id: 'guestbook-section', label: 'Зочны дэвтэр' },
                    { id: 'contact-section', label: 'Холбоо барих' },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => onJumpToSection(sec.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <span>{sec.label}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Баруун талын үндсэн агуулга */}
            <div className="flex-1 min-w-0 w-full space-y-6">
              {quotaExceeded && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  Өнөөдрийн үнэгүй өгөгдлийн сангийн унших хязгаар хэтэрсэн байна. Маргааш автоматаар сэргэнэ.
                </div>
              )}

              {/* Хэсгийн толгой + хайлт */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    {MENU_LABELS[activeMenu]}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Cloud Firestore шууд холболттой удирдлагын хэсэг
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {showSearchInput && (
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Хайх..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  )}

                  {activeMenu === 'messages' && unreadMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllMessagesRead}
                      disabled={batchUpdating}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>
                        {batchUpdating
                          ? 'Шинэчилж байна...'
                          : `Бүгдийг уншсан болгох (${unreadMessages.length})`}
                      </span>
                    </button>
                  )}

                  {activeMenu === 'overview' && (
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
              </div>

              {/* 1. ЕРӨНХИЙ ТОЙМ */}
              {activeMenu === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveMenu('messages')}
                      className="text-left p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-1"
                    >
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Ирсэн зурвас</span>
                        <Mail className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                        {messages.length}
                      </div>
                      <div className="text-xs text-amber-400 font-mono tabular-nums">
                        {unreadMessages.length} шинэ зурвас
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMenu('guestbook')}
                      className="text-left p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-1"
                    >
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Зочны дэвтэр</span>
                        <MessageCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                        {guestbook.length}
                      </div>
                      <div className="text-xs text-slate-500">Нийтлэгдсэн сэтгэгдэл</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMenu('users')}
                      className="text-left p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-1"
                    >
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Хэрэглэгчид</span>
                        <Users className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                        {usersList.length}
                      </div>
                      <div className="text-xs text-slate-500">Google-ээр нэвтэрсэн</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMenu('chats')}
                      className="text-left p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-1"
                    >
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Niko чат</span>
                        <Bot className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                        {chats.length}
                      </div>
                      <div className="text-xs text-slate-500">Хадгалагдсан мессеж</div>
                    </button>
                  </div>

                  {/* Сүүлийн үйл явдлууд */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white">Сүүлийн үйл явдлууд</h2>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        Сүүлийн {recentActivity.length} бүртгэл
                      </span>
                    </div>

                    {loadingData ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Өгөгдлийн сангаас татаж байна...
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="p-10 text-center text-sm text-slate-400">
                        Одоогоор бүртгэгдсэн үйл явдал алга байна.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {recentActivity.map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setActiveMenu(act.targetMenu)}
                            className="w-full text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-950/50 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                {act.title}
                              </div>
                              <p className="text-xs text-slate-400 truncate">
                                {act.detail}
                              </p>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono tabular-nums shrink-0">
                              {formatTs(act.createdAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. ИРСЭН ЗУРВАС */}
              {activeMenu === 'messages' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
                    {[
                      { id: 'all' as const, label: `Бүгд (${messages.length})` },
                      { id: 'new' as const, label: `Шинэ (${unreadMessages.length})` },
                      {
                        id: 'read' as const,
                        label: `Уншсан (${messages.length - unreadMessages.length})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMessageFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums ${
                          messageFilter === tab.id
                            ? 'bg-amber-400 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {loadingData ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Өгөгдлийн сангаас татаж байна...
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="p-10 text-center text-sm text-slate-400">
                        Хайлт эсвэл шүүлтүүрт тохирох зурвас олдсонгүй.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {filteredMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold text-white">{msg.subject}</span>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="text-slate-300">{msg.senderName}</span>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span
                                  className={
                                    msg.status === 'read'
                                      ? 'text-emerald-400'
                                      : 'text-amber-400 font-semibold'
                                  }
                                >
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
                    )}
                  </div>
                </div>
              )}

              {/* 3. ЗОЧНЫ ДЭВТЭР */}
              {activeMenu === 'guestbook' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit overflow-x-auto max-w-full">
                    {[
                      { id: 'all', label: 'Бүгд' },
                      { id: 'урам', label: 'Урам' },
                      { id: 'cs2', label: 'CS2' },
                      { id: 'санал', label: 'Санал' },
                      { id: 'асуулт', label: 'Асуулт' },
                    ].map((tagItem) => (
                      <button
                        key={tagItem.id}
                        type="button"
                        onClick={() => setGuestbookTagFilter(tagItem.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          guestbookTagFilter === tagItem.id
                            ? 'bg-amber-400 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tagItem.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {filteredGuestbook.length === 0 ? (
                      <div className="p-10 text-center text-sm text-slate-400">
                        Зочны дэвтэрт тохирох бичлэг алга байна.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {filteredGuestbook.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors"
                          >
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
                    )}
                  </div>
                </div>
              )}

              {/* 4. ХЭРЭГЛЭГЧИД */}
              {activeMenu === 'users' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {filteredUsers.length === 0 ? (
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
                            <th className="py-3.5 px-5 font-semibold">Эрх</th>
                            <th className="py-3.5 px-5 font-semibold">UID</th>
                            <th className="py-3.5 px-5 font-semibold text-right">Сүүлд орсон</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredUsers.map((u) => {
                            const isOwnerAdmin = u.email?.toLowerCase() === ADMIN_EMAIL;
                            return (
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
                                <td className="py-3.5 px-5">
                                  <span
                                    className={
                                      isOwnerAdmin ? 'text-amber-400 font-semibold' : 'text-slate-400'
                                    }
                                  >
                                    {isOwnerAdmin ? 'Админ' : 'Хэрэглэгч'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-slate-500 font-mono">
                                  {u.uid}
                                </td>
                                <td className="py-3.5 px-5 text-slate-400 font-mono tabular-nums whitespace-nowrap text-right">
                                  {formatTs(u.updatedAt || u.createdAt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 5. NIKO ЧАТ */}
              {activeMenu === 'chats' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
                    {[
                      { id: 'all' as const, label: 'Бүгд' },
                      { id: 'user' as const, label: 'Хэрэглэгч' },
                      { id: 'niko' as const, label: 'Niko хариу' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setChatSenderFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          chatSenderFilter === tab.id
                            ? 'bg-amber-400 text-slate-950 font-semibold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {filteredChats.length === 0 ? (
                      <div className="p-10 text-center text-sm text-slate-400">
                        Niko чатын түүх олдсонгүй.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {filteredChats.map((chat) => {
                          const ownerName = publicProfiles[chat.userId]?.displayName || chat.userId;
                          return (
                            <div
                              key={`${chat.userId}_${chat.id}`}
                              className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-950/40 transition-colors"
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span
                                    className={
                                      chat.sender === 'niko'
                                        ? 'text-amber-400 font-bold'
                                        : 'text-white font-bold'
                                    }
                                  >
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

              {/* 6. НӨӨЦ БА СИСТЕМ */}
              {activeMenu === 'tools' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-white">Өгөгдлийн нөөц татах</h2>
                      <p className="text-xs text-slate-400">
                        Firestore-т хадгалагдсан мэдээллийг JSON болон Excel/Google Sheets-д шууд нээгдэх CSV хэлбэрээр татах.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        <span>Бүх өгөгдөл (JSON)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportMessagesCsv}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                        <span>Ирсэн зурвас (CSV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportGuestbookCsv}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                        <span>Зочны дэвтэр (CSV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportUsersCsv}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                        <span>Хэрэглэгчид (CSV)</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                      <h2 className="text-sm font-bold text-white">Холбогдсон Firebase мэдээлэл</h2>
                    </div>
                    <div className="divide-y divide-slate-800/80 text-xs">
                      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-slate-400">Firebase Project ID</span>
                        <span className="font-mono text-slate-200">{firebaseConfig.projectId}</span>
                      </div>
                      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-slate-400">Firestore Database ID</span>
                        <span className="font-mono text-slate-200">
                          {firebaseConfig.firestoreDatabaseId}
                        </span>
                      </div>
                      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-slate-400">Админ бүртгэл</span>
                        <span className="font-mono text-amber-400">{ADMIN_EMAIL}</span>
                      </div>
                      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-slate-400">Discord Webhook (Хамтын ажиллагаа)</span>
                        <span
                          className={`font-mono ${
                            discordWebhookActive
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {discordWebhookActive === null
                            ? 'Шалгаж байна...'
                            : discordWebhookActive
                              ? 'Холбогдсон (Идэвхтэй)'
                              : 'Тохируулаагүй (DISCORD_WEBHOOK_URL)'}
                        </span>
                      </div>
                      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-slate-400">Нийт баримт (Messages / Guestbook / Users / Chat)</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {messages.length} / {guestbook.length} / {usersList.length} / {chats.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
