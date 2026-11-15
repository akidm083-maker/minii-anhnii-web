import React, { useState, useRef, useEffect } from 'react';
import { Target, Send, Sparkles, Trophy, Zap, Shield, Flame, RotateCcw, Crosshair, Database } from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { askNiko, ChatMessage } from '../services/nikoBot';
import {
  db,
  generateValidDocId,
  handleFirestoreError,
  isQuotaExceededError,
  OperationType,
} from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  sender: 'niko',
  text: 'Сайн уу найз минь! Би Niko байна. 🎯 CS2-ийн тактик, aim сайжруулах, гранат хаях эсвэл сэтгэл зүйгээ тайван байлгах тухай юу ч байсан надаас асуугаарай. Хамтдаа ялна!',
  timestamp: 'Дөнгөж сая',
};

export function NikoSection() {
  const { user, authReady, markQuotaExceeded } = useFirebase();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [persistedDocIds, setPersistedDocIds] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '🎯 Aim & Crosshair', prompt: 'Crosshair placement болон Aim-ээ хэрхэн сайжруулах вэ?' },
    { label: '🏃 Counter-Strafing', prompt: 'Counter-strafing-ийг хэрхэн төгс хийж сурах вэ?' },
    { label: '💣 Mirage Smokes', prompt: 'Mirage дээр A-site болон Mid smoke-ийг хаанаас хаях вэ?' },
    { label: '🔫 Deagle нууц', prompt: 'Desert Eagle-ээр толгой руу One-tap буудах нууц юу вэ?' },
    { label: '🧘 Сэтгэл зүй / No Tilt', prompt: 'Тоглолтод хожигдож байхдаа уурлахгүй, тайван clutch хийх арга юу вэ?' },
    { label: '💪 15 мин дасгал', prompt: 'Өнөөдөр хийх 15 минутын хурдан бэлтгэл дасгал санал болгооч!' },
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!authReady) return;
    if (!user || !user.emailVerified) {
      setMessages([WELCOME_MESSAGE]);
      setPersistedDocIds([]);
      return;
    }

    const uid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
    const path = `users/${uid}/nikoChats`;
    const q = query(collection(db, 'users', uid, 'nikoChats'), where('userId', '==', uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setMessages([WELCOME_MESSAGE]);
          setPersistedDocIds([]);
          return;
        }
        const loaded = snapshot.docs
          .map((d) => {
            const data = d.data();
            const ts = data.createdAt instanceof Timestamp ? data.createdAt : null;
            return {
              id: d.id,
              sender: (data.sender === 'user' ? 'user' : 'niko') as 'user' | 'niko',
              text: String(data.text || ''),
              timestamp: ts
                ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Саяхан',
              sortOrder: ts ? ts.toMillis() : Date.now(),
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);

        setPersistedDocIds(loaded.map((m) => m.id));
        setMessages([WELCOME_MESSAGE, ...loaded.map(({ sortOrder: _s, ...rest }) => rest)]);
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
  }, [user, authReady, markQuotaExceeded]);

  const persistMessage = async (uid: string, sender: 'user' | 'niko', text: string) => {
    const messageId = generateValidDocId(sender);
    const cleanText = text.trim().slice(0, 2000);
    if (!cleanText) return;
    const docPath = `users/${uid}/nikoChats/${messageId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'nikoChats', messageId), {
        id: messageId,
        userId: uid,
        sender,
        text: cleanText,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceeded();
        return;
      }
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim().slice(0, 2000);
    if (!text || isTyping) return;

    const uid = user && user.emailVerified ? user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) : null;

    if (!uid) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
    } else {
      await persistMessage(uid, 'user', text);
    }

    setInputVal('');
    setIsTyping(true);

    try {
      const reply = await askNiko(text);
      if (!uid) {
        const nikoMsg: ChatMessage = {
          id: `niko-${Date.now()}`,
          sender: 'niko',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, nikoMsg]);
      } else {
        await persistMessage(uid, 'niko', reply);
      }
    } catch {
      const fallbackText =
        'Stay calm. Aim sharp. Win rounds. Never give up! 🎯 Байнга бэлтгэл хийж, алдаан дээрээ дүн шинжилгээ хийгээрэй найз минь!';
      if (!uid) {
        setMessages((prev) => [
          ...prev,
          {
            id: `niko-fallback-${Date.now()}`,
            sender: 'niko',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        await persistMessage(uid, 'niko', fallbackText);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = async () => {
    if (user && user.emailVerified && persistedDocIds.length > 0) {
      const uid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
      for (const id of persistedDocIds) {
        const docPath = `users/${uid}/nikoChats/${id}`;
        try {
          await deleteDoc(doc(db, 'users', uid, 'nikoChats', id));
        } catch (error) {
          if (isQuotaExceededError(error)) {
            markQuotaExceeded();
            break;
          }
          handleFirestoreError(error, OperationType.DELETE, docPath);
        }
      }
    }
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'niko',
        text: 'Дахин эхэллээ! 🎯 Чамд өнөөдөр CS2-ийн ямар зөвлөгөө, сорил хэрэгтэй байна?',
        timestamp: 'Шинэ яриа',
      },
    ]);
  };

  return (
    <section id="idol-section" className="py-16 sm:py-24 border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Хэсгийн дэд гарчиг */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <Trophy className="w-4 h-4" />
              <span>Миний Шүтээн (Idol)</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">CS2 Personal Assistant</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Nikola &quot;NiKo&quot; Kovač — Миний үлгэр жишээ
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              CS2-ийн түүхэн дэх хамгийн аугаа rifler, миний хамгийн дуртай тамирчин. Түүний зан чанар, дайчин эрмэлзлээс бүтсэн хувийн туслахтай шууд ярилцаж зөвлөгөө аваарай.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {user ? 'Ярианы түүх Firebase-д хадгалагдаж байна' : 'Нэвтэрвэл ярианы түүх хадгалагдана'}
            </span>
          </div>
        </div>

        {/* NiKo Profile & Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Зүүн тал: Зураг ба Профайл карт */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
              <img
                src="/src/assets/images/niko_cs2_esports_portrait_1794034641441.jpg"
                alt="Nikola NiKo Kovac CS2 pro player"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Nikola &quot;NiKo&quot; Kovač
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    Bosnian CS2 Superstar · The Rifle King
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700">
                    G2 / Falcons Legend
                  </span>
                </div>
              </div>
            </div>

            {/* NiKo-гийн уриа ба гол үзүүлэлтүүд */}
            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
              {/* Уриа */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" />
                  <span>NIKO-ГИЙН УРИА</span>
                </div>
                <p className="text-sm font-semibold text-white italic">
                  &quot;Stay calm. Aim sharp. Win rounds. Never give up! 🎯&quot;
                </p>
                <p className="text-xs text-slate-300">
                  Жинхэнэ тоглогч зөвхөн aim-аараа биш, ухаанаараа ялдаг!
                </p>
              </div>

              {/* Үзүүлэлтүүд */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>Headshot хувь</span>
                  </div>
                  <div className="text-base font-bold text-white font-mono tabular-nums">
                    60.5%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>MVP Цом</span>
                  </div>
                  <div className="text-base font-bold text-white font-mono tabular-nums">
                    8x HLTV MVP
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Үндсэн зэвсэг</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    AK-47 & Deagle
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Тоглох хэв маяг</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Entry & Clutch
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Баруун тал: Интерактив NiKo хувийн туслах чат консол */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl h-[560px]">
            {/* Чат толгой хэсэг */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs ring-2 ring-amber-400/30">
                  NK
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Niko</span>
                    <span className="text-[10px] text-amber-400 font-normal px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                      CS2 Pro Assistant
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Тактик, Aim, Grenade, Сэтгэл зүй & Сорил
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Яриаг шинэчлэх"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Зурвасуудын талбар */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-900/60 scrollbar-none">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-amber-400 text-slate-950 font-medium rounded-br-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.sender === 'niko' && (
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Niko зөвлөж байна:</span>
                      </div>
                    )}
                    <p>{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 text-right ${
                        msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-300 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2 border border-slate-700/60">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-slate-400 text-[11px] ml-1">Niko бичиж байна...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Түргэн асуултууд (Quick Chips) */}
            <div className="px-3 pt-2 pb-1 bg-slate-950/70 border-t border-slate-800/70 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  disabled={isTyping}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-amber-300 text-slate-300 border border-slate-800 whitespace-nowrap shrink-0 transition-colors disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Оролтын мөр */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Niko-оос асуух (жишээ: Mirage тактик, crosshair, deagle...)"
                disabled={isTyping}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputVal.trim() || isTyping}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span>Илгээх</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Niko-гийн зарчмуудын 3 багана */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-white">1. Алдаанаасаа суралц</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Алдсан round, whiff хийсэн үе болгондоо шалтаг тоочилгүй өөрийнхөө байрлал, crosshair алдаагаа дүгнэж дараагийн тоглолтод засаж тогло.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-white">2. Баг & Эерэг хандлага</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toxic байдал багийг сүйрүүлдэг. Хэзээ ч багийнхандаа уурлаж сэтгэл санааг нь бүү унага. Сайн callout өгч, багийнхаа ялалтын төлөө тогло.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-white">3. Тайван сэтгэл зүй (No Tilt)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clutch үед зүрхний цохилтоо тайван барь. Мөн хамгийн чухал нь тоглоомоо бодит амьдрал, хичээл сургууль, эрүүл мэндтэйгээ зөв хослуул.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
