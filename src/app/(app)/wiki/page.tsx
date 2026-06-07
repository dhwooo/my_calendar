import { WikiClient } from "./WikiClient";

// 클라이언트 SWR이 /api/wiki로 직접 fetch — SSR DB 쿼리 제거해서 페이지 진입 즉시 표시.
export default function WikiPage() {
  return <WikiClient initialPages={[]} />;
}
