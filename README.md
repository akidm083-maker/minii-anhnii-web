# Миний Бүтээлүүд & Портфолио — Chingis

Монгол хэл дээрх хувийн портфолио веб аппликейшн.

## Гол боломжууд
- **Миний & Бүтээлүүд**: Хувийн профайл, сонирхол, зорилго болон Netlify дээрх вэб төслүүд, гэрэл зургийн бүтээлүүдийн нэгдсэн үзэсгэлэн.
- **NiKo — CS2 Personal Assistant**: CS2 тоглолтын тактик, aim, гранатын зөвлөгөө өгдөг туслах болон харилцан ярианы түүх.
- **Зочны дэвтэр & Холбоо барих**: Firebase Auth (Google нэвтрэлт) болон Cloud Firestore дээрх сэтгэгдэл, зурвас хадгалалт.
- **Discord Webhook мэдэгдэл**: Төсөл, хамтын ажиллагааны санал илгээхэд `/api/contact-discord`-оор дамжуулан Discord суваг руу шууд илгээх.
- **Админ цэс (`#admin`)**: Ирсэн зурвас, зочны дэвтэр, бүртгэлтэй хэрэглэгчид болон Niko чатын түүхийг хянах, устгах, JSON/CSV нөөц татах.

## Технологиуд
- React 19, TypeScript, Vite, Tailwind CSS v4
- Firebase Authentication & Cloud Firestore
- Express (`server.ts`) болон Vercel API Functions (`api/*`)

## Локал орчинд ажиллуулах

```bash
npm install
npm run dev
```

Build шалгах:

```bash
npm run lint
npm run build
```

## Орчны хувьсагчид (Environment Variables)
Нууц утгуудыг `.env` файлд эсвэл хостинг үйлчилгээний **Environment Variables / Secrets** хэсэгт тохируулна уу (жишээ бүтэц `.env.example` файлд бий):
- `DISCORD_WEBHOOK_URL` — Хамтын ажиллагааны саналыг Discord суваг руу илгээх Webhook URL.
