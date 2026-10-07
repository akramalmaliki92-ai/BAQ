import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ملفات محرك العرض ثلاثي الأبعاد ومشاهده: جافاسكريبت خام يُقدَّم للمتصفح
    // مباشرة من public/، وليس كود React/TypeScript — فحصه بقواعد Next/React
    // ينتج آلاف التحذيرات الوهمية (مثل اعتبار دالة اسمها useOrtho خطأً React Hook).
    "public/**",
  ]),
]);

export default eslintConfig;
