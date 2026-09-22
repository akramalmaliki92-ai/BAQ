# صورة واحدة تحتوي كل شيء: التطبيق + متصفح Chromium (لازم لتصدير PDF) — مبنية عمداً
# بخطوة واحدة بلا مراحل متعددة (multi-stage) لتبقى بسيطة الصيانة لغير المطورين.
FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# متصفح Chromium الخاص بـPlaywright نفسه (--with-deps يُثبّت تلقائياً كل مكتبات النظام
# المشتركة اللازمة لتشغيله)، بدل الاعتماد على حزمة Chromium نظامية قد يختلف اسمها أو توفرها
# بين التوزيعات — هذا هو الأسلوب المدعوم رسمياً من Playwright ويعمل بشكل مطابق على أي جهاز.
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

# مجلد قاعدة البيانات (SQLite) — يُخصَّص له تخزين دائم (volume) عند التشغيل حتى لا تُفقد
# البيانات عند كل تحديث/إعادة تشغيل للحاوية.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
