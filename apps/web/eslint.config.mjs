import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "generated/**", "next-env.d.ts"]
  }
];

export default eslintConfig;
