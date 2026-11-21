import { WorkItem, SkillCategory } from '../types';

/**
 * "Миний бүтээлүүд": Нэгдсэн нэг массив (Array)
 * Бүх бүтээлийн картууд шинэ цонхонд нээгдэнэ (target="_blank" rel="noopener noreferrer")
 */
export const MY_WORKS: WorkItem[] = [
  {
    id: 'work-1',
    title: 'Миний анхны вэб хуудас',
    category: 'web',
    categoryLabel: 'Анхны төсөл',
    year: '2025',
    description: 'HTML болон CSS өнгө загвар ашиглан бие даан бүтээсэн миний анхны танилцуулга вэб хуудас.',
    longDescription: 'Миний сонирхол, One Piece аниме, CS2 тоглоом, нас, хобби болон сурах зорилгыг өгүүлсэн HTML/CSS бүтээл. Шууд дээр нь дарж шинэ цонхонд үзэх боломжтой.',
    technologies: ['HTML5', 'CSS3', 'Web Design'],
    image: '/src/assets/images/first_web_code_mockup_1792906205684.jpg',
    link: 'https://resilient-boba-83d2de.netlify.app/',
    featured: true,
    metrics: 'Анхны бүтээл · 100% Бие дааж кодлов',
  },
  {
    id: 'work-js-hub',
    title: 'Миний вэб төслүүд (JavaScript & Апп-ууд)',
    category: 'web',
    categoryLabel: 'JavaScript & Вэб',
    year: '2026',
    description: 'JavaScript-ийн 13 интерактив бодлого, Хичээл 9–12, давталт ба массив, нууц үг солих апп болон Team Game багийн төслийг нэгтгэсэн вэб хуудас.',
    longDescription: 'Хичээл 8–12-ийн JavaScript бодлогын апп-ууд, For loop ба массивын дасгалууд, багийн тоглоом (Team game) болон танилцуулга хэсгийг багтаасан 7 төслийн нэгдсэн портал.',
    technologies: ['JavaScript', 'HTML5', 'CSS3'],
    image: '/src/assets/images/javascript_projects_hub_1795242070340.jpg',
    link: 'https://peaceful-phoenix-c07b68.netlify.app/',
    featured: true,
    metrics: '7 төсөл · 13 JS бодлого',
  },
  {
    id: 'work-4',
    title: 'Үдшийн байгаль & Нуурын толио - Гэрэл зураг',
    category: 'photography',
    categoryLabel: 'Гэрэл зураг & Байгаль',
    year: '2025',
    description: 'Миний сонгосон үдшийн нар шингэх үеийн байгалийн үзэсгэлэн, нуурын мандал дахь өнгөний тусгалыг харуулсан бүтээл.',
    longDescription: 'Байгалийн тайван уур амьсгал, үдшийн торгон агшныг мэдрүүлэх өндөр нягтралтай визуал бүтээлийн үзэсгэлэн.',
    technologies: ['Digital Photography', 'Visual Art', 'CSS'],
    image: '/assets/aistudio/image_7fc94b16.png',
    link: '/assets/aistudio/image_7fc94b16.png',
    featured: true,
    metrics: 'Өндөр нягтралтай фото бүтээл',
  },
];

export const PERSONAL_INFO = {
  name: 'Chingis',
  mongolianName: 'Чингис',
  age: 15,
  role: 'Portfolio Owner & Залуу технологи сонирхогч',
  languages: ['Монгол хэл (Үндсэн)', 'English (Боломжтой)'],
  email: 'akidm083@gmail.com',
  github: 'https://github.com/akidm083',
  location: 'Улаанбаатар, Монгол улс',
  status: 'Portfolio Website & AI туслахаа идэвхтэй хөгжүүлж байна',
  avatar: '/src/assets/images/chingis_profile_avatar_1794035411247.jpg',
  motto: 'Өдөр бүр бага багаар сайжир. Төгс байх албагүй, өчигдрийнхөөсөө илүү байхад хангалттай. 🎯',
  interests: [
    'Counter-Strike 2 (CS2)',
    'CS2-ийн мэргэжлийн тоглолт, тамирчдын хэв маяг',
    'Тоглоомын тактик, стратеги, ур чадвар (Aim, Movement, Utility)',
    'AI болон орчин үеийн технологи',
    'Хувийн Portfolio Website бүтээх, хөгжүүлэх',
  ],
  goals: [
    'Өөрийн Portfolio Website-ийг хөгжүүлэх',
    'Өөрийн тухай цахим орчинд мэргэжлийн байдлаар танилцуулах',
    'AI туслахыг (Niko) портфолиодоо амжилттай нэгтгэх',
    'Шинэ зүйл сурч, ур чадвараа нэмэгдүүлэх',
    'Өөрийгөө тасралтгүй хөгжүүлэх',
  ],
  traits: [
    'Товч, тодорхой харилцааг эрхэмлэдэг',
    'Хөгжилтэй, найрсаг уур амьсгалд дуртай',
    'Шууд бөгөөд ойлгомжтой зөвлөгөө авахыг хүсдэг',
    'Урам зориг, дэмжлэгийг үнэлдэг',
    'Idol (NiKo) болон CS2 тамирчны дүр төрхтэй харилцаанд дуртай',
  ],
  privacyGuarantee: 'Гэрийн хаяг, хувийн утасны дугаар, сургууль, гэр бүлийн мэдээлэл, нууц үг зэрэг хувийн нууцыг хэзээ ч цуглуулахгүй, хадгалахгүй, нийтлэхгүй. Зөвхөн нийтэд зөвшөөрөгдсөн мэдээллийг ашиглана.',
  hobby: 'Counter-Strike 2 (CS2) тоглох',
  favoriteGame: 'Counter-Strike 2 (CS2)',
  idol: 'Nikola "NiKo" Kovač',
  favoriteAnime: 'One Piece',
  favoriteFood: 'Шөлтэй хоол',
  favoriteBand: 'Одоогоор байхгүй',
  favoriteMovie: 'Одоогоор байхгүй',
  learningReason: 'Хиймэл оюун ухаан (AI) болон орчин үеийн технологийг ашиглаж сурах',
  goal: 'Хичээлдээ амжилт гаргаж, ирээдүйд хүссэн сургуульдаа орох.',
  shortBio: 'Би Chingis. Технологи, хувийн хөгжлийг сонирхдог. Өөрийн Portfolio Website-ийг тасралтгүй хөгжүүлж, CS2 болон AI чиглэлээр шинэ зүйлс сурах зорилготой.',
  detailedBio: 'Сайн байна уу! Намайг Chingis гэдэг. Би технологи, веб хөгжүүлэлт болон хувийн хөгжлийн чиглэлээр идэвхтэй сонирхон суралцаж байна. Чөлөөт цагаараа CS2 тоглох, мэргэжлийн тамирчдын тоглолтыг шинжлэх, тактик судлах дуртай. Өөрийн цахим портфолиог бие даан бүтээж, AI туслахыг амжилттай нэгтгэн өдөр бүр шинэ ур чадвар эзэмшихийг эрмэлзэж байна.',
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    category: 'Суралцаж буй технологиуд',
    description: 'Орчин үеийн веб хөгжүүлэлтийн суурь ур чадварууд',
    skills: [
      { name: 'HTML5 & Вэб бүтэц', level: 'Суурь түвшин', experience: 'Анхны вэбээ бүтээсэн' },
      { name: 'CSS3 & Өнгө загвар', level: 'Суралцаж байна', experience: 'Загвар дизайн' },
      { name: 'AI Хэрэгслүүд ашиглах', level: 'Суралцаж байна', experience: 'Идэвхтэй дадлага' },
      { name: 'JavaScript & React', level: 'Эхлэн суралцагч', experience: 'Сургалтын шат' },
    ],
  },
  {
    category: 'Миний сонирхол & Хобби',
    description: 'Чөлөөт цаг, амралт ба хичээлээс гадуурх сонирхол',
    skills: [
      { name: 'Counter-Strike 2 (CS2)', level: 'Маш дуртай', experience: 'Гол хобби' },
      { name: 'One Piece аниме', level: 'Үздэг', experience: 'Дуртай аниме' },
      { name: 'Шөлтэй хоол амтархах', level: 'Дуртай', experience: 'Үргэлж дуртай' },
      { name: 'Хичээлийн бэлтгэл', level: 'Тууштай', experience: 'Өдөр бүр' },
    ],
  },
  {
    category: 'Зорилго & Тэмүүлэл',
    description: 'Ирээдүйн чиг баримжаа ба сурах хүсэл эрмэлзэл',
    skills: [
      { name: 'Хүссэн сургуульдаа орох', level: 'Гол зорилго', experience: 'Ирээдүйн алсын хараа' },
      { name: 'Хичээлийн амжилт гаргах', level: 'Идэвхтэй', experience: 'Сурлагын өсөлт' },
      { name: 'AI-г бүтээлчээр ашиглах', level: 'Суралцаж байна', experience: 'Технологийн давуу тал' },
      { name: 'Бие даан систем бүтээх', level: 'Тэмүүлэлтэй', experience: 'Алхам алхмаар' },
    ],
  },
];
