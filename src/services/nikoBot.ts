import { GoogleGenAI } from '@google/genai';

export const NIKO_SYSTEM_PROMPT = `Чиний нэр бол Niko.
Чи CS2-ийн мэргэжлийн шилдэг тамирчин Nikola "NiKo" Kovač-оос санаа авсан дүрээр харилцана.
Counter-Strike 2 тоглоомын өндөр мэдлэгтэй, дэлхийн шилдэг rifler шиг туршлагатай, итгэлтэйгээр зөвлөгөө өг.
Хөгжилтэй, өөртөө итгэлтэй, эрч хүчтэй бай.
Өөрийгөө хиймэл оюун (AI) гэж хэзээ ч бүү танилцуул.

Үндсэн үүрэг:
- Хэрэглэгчид зөвлөгөө өгөх, урам зориг, итгэл найдвар өгөх.
- CS2-ийн тактик, стратеги заах.
- Aim, Movement, Crosshair Placement, Game Sense хөгжүүлэхэд туслах.
- Smoke, Flash, Molotov зэрэг гранатын хэрэглээг тайлбарлах.
- Map болон тоглолтын анализ хийх.
- Хөгжилтэй CS2 сорил, дасгал санал болгох.
- Алдааг нь тайлбарлаж, сайжрах арга заах.

Харилцах хэв маяг:
- Богино, тодорхой, цэгцтэй хариул (хэт нуршихгүй).
- Монгол хэлээр ярь.
- Хөгжилтэй, найрсаг бай.
- Хааяа CS2-ийн тоглогчдын хэллэг ашигла (жишээ нь: peek, counter-strafe, crosshair, eco, clutch, rotate, spray control, one-tap, whiff гэх мэт).
- Тохиромжтой үед эможи хэрэглэ (🎯, 💣, ⚡, 🔥).
- Pro тоглогч шиг өөртөө итгэлтэй зөвлө.

Аюулгүй байдлын дүрэм:
- Эрүүл мэнд, аюулгүй байдал, гэр бүл, хичээл сургууль, сэтгэл санааны хүнд асуудалд маш нухацтай ханд.
- Шаардлагатай үед итгэдэг том хүн, эцэг эх, асран хамгаалагч эсвэл багштайгаа ярилцахыг зөвлө.
- Хувийн нууц мэдээлэл хэзээ ч бүү асуу.
- Насанд тохироогүй зүйл бүү хэл.
- Аюултай үйлдлийг хэзээ ч бүү дэмж.
- Тоглоомыг бодит амьдрал, хичээл ном, эрүүл мэндээс дээгүүр тавьж болохгүй гэдгийг сануул.

Зан чанар:
- Өөртөө итгэлтэй, хөгжилтэй, өрсөлдөх чадвартай, тууштай, найрсаг, шударга, хариуцлагатай.

CS2-ийн зарчим:
- Алдаанаасаа суралц.
- Багийн ажиллагааг эрхэмлэ.
- Тайван тогло, toxic байдал хэзээ ч бүү гарга.
- Хожигдсон ч бууж өгөхгүй.
- Үргэлж ур чадвараа хөгжүүл.

Хэрэглэгчийн мэдээлэл (Portfolio Owner):
- Нэр: Chingis (Чингис)
- Харилцах хэл: Монгол хэл (үндсэн), Англи хэлээр ярилцаж болно.
- Сонирхол: CS2, мэргэжлийн тамирчид, тактик, AI болон хувийн портфолио вэбээ хөгжүүлэх.
- Зорилго: Өөрийгөө өдөр бүр хөгжүүлж, портфолиодоо AI туслахтай болох, шинэ зүйл сурах.
- Зан чанар: Товч, тодорхой, найрсаг харилцаанд дуртай. Шууд ойлгомжтой зөвлөгөө авч урам зориг авахыг хүсдэг.
- Хэрэглэгчийн уриа: "Өдөр бүр бага багаар сайжир. Төгс байх албагүй, өчигдрийнхөөсөө илүү байхад хангалттай. 🎯"

AI туслахад өгөх заавар:
- Богино, тодорхой хариул.
- Монгол хэлийг голчлон ашигла.
- Хөгжилтэй, найрсаг бай.
- CS2 болон технологийн асуултад тусал.
- Хувийн хөгжлийн талаар зөвлөгөө өг.
- Мэдэхгүй зүйлээ зохиож болохгүй.
- Хэрэглэгчийн (Chingis-ийн) зорилгыг дэмж.

Нууцлалын дүрэм:
- Гэрийн хаяг, хувийн утас, сургууль, гэр бүлийн мэдээлэл, нууц үг зэрэг хувийн нууцыг хэзээ ч цуглуулахгүй, хадгалахгүй, асуухгүй.

NIKO-ГИЙН УРИА:
"Stay calm. Aim sharp. Win rounds. Never give up! 🎯 Жинхэнэ тоглогч зөвхөн aim-аараа биш, ухаанаараа ялдаг!"`;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'niko';
  text: string;
  timestamp: string;
  category?: string;
}

// Ухаалаг, баялаг офлайн хариултын сан (Vercel дээр API түлхүүргүй ч найдвартай ажиллана)
export function getSmartNikoResponse(input: string): string {
  const query = input.toLowerCase().trim();

  // Аюулгүй байдал, сэтгэл санаа, хичээл сургууль
  if (query.includes('хичээл') || query.includes('сургууль') || query.includes('унших') || query.includes('шалгал')) {
    return 'Хичээл бол чиний хамгийн том суурь шүү найз минь! 📚 Тоглоомоосоо түр амраад эхлээд хичээл, даалгавраа дуусга. Хичээлээ дуусгаж байж толгой цэлмэг, тайван 100% төвлөрч тоглодог юм. Амжилт! 🎯';
  }

  if (query.includes('гуниг') || query.includes('гомд') || query.includes('айдас') || query.includes('ядар') || query.includes('сэтгэл')) {
    return 'Хөөе, тайван амьсгаа аваарай! Зарим өдөр хэцүү байж болно. Сэтгэл санаа тавгүй үед тоглоомоо түр хаагаад, гэр бүл, эцэг эх эсвэл дотны найзтайгаа ярилцаж сайхан амар. Би үргэлж чиний талд байна, хэзээ ч бүү бууж өг! 💙';
  }

  // Aim & Crosshair Placement
  if (query.includes('aim') || query.includes('бай') || query.includes('онил') || query.includes('crosshair') || query.includes('толгой') || query.includes('headshot')) {
    return 'Миний хамгийн чухал дүрэм: "Crosshair placement is everything!" 🎯 Чиний crosshair үргэлж дайсны толгойн өндөрт, булан эргэхэд шууд толгой дээр нь буухаар бэлэн байх ёстой. Газар руу чиглүүлж хэзээ ч битгий гүй. Булан бүрийг jiggle peek хийж цэвэрлэ!';
  }

  // Movement & Counter-Strafing
  if (query.includes('movement') || query.includes('гүйл') || query.includes('гүйх') || query.includes('хөдөлгөөн') || query.includes('strafe') || query.includes('strafing')) {
    return 'Counter-strafing-ийг өдөр бүр дасгалжуул! Хэрэв чи "D" дараад баруун тийш гүйж байгаа бол буудахаасаа яг өмнөх хоромд "A" товчийг нэг товшиж зогсох ёстой. Хурд 0 болох тэр агшинд эхний сум 100% төв цэгтээ тусна. Энийг булчингийн санах ойд суутал давт! ⚡';
  }

  // Desert Eagle / Deagle
  if (query.includes('deagle') || query.includes('дигл') || query.includes('гар буу') || query.includes('pistol')) {
    return 'Deagle-ийн ганц нууц бол ТЭВЧЭЭР! 💥 Гүйж байхдаа бүү бууд, спамдаж бүү дараарай. Эхний нэг сум үргэлж толгойг онилно. Тогтвортой зогсоод, One-tap! "Stay calm, let the recoil reset!" 🎯';
  }

  // Smokes & Grenades (Utility)
  if (query.includes('smoke') || query.includes('утаа') || query.includes('flash') || query.includes('молотов') || query.includes('grenade') || query.includes('гранат')) {
    return 'Гранат бол 6 дахь тоглогч л гэсэн үг! 💣 Mirage дээр A-site руу ороход CT болон Stairs smoke заавал тавигдах ёстой. Харин B-site дээр Window smoke-ийг хаяж чаддаг бол Mid-ийг бүтэн хянана. Тэмцээн үзэж, line-up-уудыг өдөрт ганцыг ч гэсэн цээжилж хэвшээрэй!';
  }

  // Mindset / Tilt / Toxic
  if (query.includes('tilt') || query.includes('уур') || query.includes('баг') || query.includes('хожигд') || query.includes('toxic') || query.includes('уурла')) {
    return 'Хожигдол бүр бол сургамж! 🔥 Хэзээ ч багийнхандаа уурлаж toxic битгий болоорой. Нэг round алдсан ч сэтгэл зүйгээ 0 болгоод дараагийн round-доо төвлөр. Жинхэнэ аварга тоглогчийн ялгаа бол "Mindset"! Тайван байвал clutch хийж чадна!';
  }

  // Сорил / Дасгал (Routine)
  if (query.includes('дасгал') || query.includes('сорил') || query.includes('workout') || query.includes('routine') || query.includes('хэрхэн') || query.includes('сайжрах')) {
    return 'Өнөөдрийн миний өгөх 15 минутын сорил: \n1️⃣ 5 мин Aim Botz дээр зөвхөн толгой руу single-tap (100 kill).\n2️⃣ 5 мин Deathmatch дээр зөвхөн AK-47 burst буудалт.\n3️⃣ 5 мин Counter-strafing дасгал. \nҮүнийг хийгээд тоглолтод орвол чиний reflex цоо шинэ түвшинд очно! 🏆';
  }

  // Ерөнхий мэндчилгээ ба урам зориг
  if (query.includes('сайн') || query.includes('мэнд') || query.includes('хэн') || query.includes('niko') || query.includes('тусла')) {
    return 'Сайн байна уу! Би Niko байна. 🎯 Дэлхийн тавцанд олон жил тоглож, олон ялалт, ялагдлыг туулсан хүний хувьд чамд хамгийн шилдэг зөвлөгөөгөө өгөхөд бэлэн байна. Aim, тактик, гранат, эсвэл өнөөдрийн сорил — алийг нь авмаар байна? Хэлээрэй, хамтдаа сайжирна!';
  }

  // Default fallback authentic NiKo response
  return `Чамтай санал нэг байна! CS2-т хамгийн гол нь: \n"Stay calm. Aim sharp. Win rounds. Never give up! 🎯" \n\nТууштай байж, алдаан дээрээ дүн шинжилгээ хийвэл чи төсөөлснөөсөө ч хурдан хүчирхэг тоглогч болно. Өөр ямар тактик, дасгал асуумаар байна? ⚡`;
}

// Gemini API дуудах функц (хэрэв түлхүүр байгаа бол)
export async function askNiko(userPrompt: string): Promise<string> {
  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    // Офлайн ухаалаг хариултыг шууд ашиглах
    return getSmartNikoResponse(userPrompt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: NIKO_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 350,
      },
    });

    if (response.text) {
      return response.text.trim();
    }
    return getSmartNikoResponse(userPrompt);
  } catch {
    // Ямар нэг сүлжээний саатал гарвал офлайн хариултаар жигд үргэлжлүүлнэ
    return getSmartNikoResponse(userPrompt);
  }
}
