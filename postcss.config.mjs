// autoprefixer 제거 — Node 24 + browserslist 호환 버그 우회.
// 모던 브라우저(Chrome 100+, Safari 14+, Firefox 100+)는 prefix가 거의 불필요.
export default {
  plugins: {
    tailwindcss: {},
  },
};
