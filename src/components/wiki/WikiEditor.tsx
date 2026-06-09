"use client";

import * as React from "react";
import useSWR from "swr";
import { Smile } from "lucide-react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block, PartialBlock } from "@blocknote/core";
import { ko } from "@blocknote/core/locales";
import "@blocknote/mantine/style.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

type FullPage = {
  id: string;
  title: string;
  content: string;
  icon: string | null;
};

type EmojiEntry = readonly [string, string]; // [emoji, keywords]

const EMOJI_LIST: EmojiEntry[] = [
  // 문서 · 책
  ["📝", "memo note write 메모 노트"],
  ["📄", "page document 문서 페이지"],
  ["📃", "page scroll 두루마리"],
  ["📋", "clipboard list 클립보드 리스트"],
  ["📑", "tabs bookmark 책갈피"],
  ["🗂️", "folder file 폴더"],
  ["📁", "folder 폴더"],
  ["📂", "folder open 열린 폴더"],
  ["📚", "books study 책 공부"],
  ["📖", "book read 책 읽기"],
  ["📕", "book red 빨간 책"],
  ["📗", "book green 초록 책"],
  ["📘", "book blue 파란 책"],
  ["📙", "book orange 오렌지 책"],
  ["📓", "notebook 노트북"],
  ["📔", "notebook decorate 장식 노트"],
  ["📒", "ledger 장부"],
  ["📰", "newspaper news 신문"],
  ["🔖", "bookmark 책갈피"],
  ["🏷️", "tag label 태그"],
  // 아이디어 · 별
  ["💡", "idea bulb light 아이디어 전구"],
  ["🔥", "fire hot trending 불 인기"],
  ["⭐", "star fav 별"],
  ["🌟", "glowing star sparkle 반짝"],
  ["✨", "sparkles new 반짝 새것"],
  ["🎯", "target goal 목표 타깃"],
  ["🏆", "trophy win 트로피"],
  ["🏅", "medal 메달"],
  ["🥇", "gold first 금메달"],
  ["🥈", "silver second 은메달"],
  ["🥉", "bronze third 동메달"],
  ["🚀", "rocket launch 로켓 출시"],
  // 도구 · 과학
  ["🛠️", "tools build 도구"],
  ["⚙️", "settings gear config 설정"],
  ["🔧", "wrench fix 렌치"],
  ["🔨", "hammer build 망치"],
  ["🧰", "toolbox 도구상자"],
  ["🧪", "experiment lab science 실험"],
  ["🧬", "dna science DNA"],
  ["🔬", "microscope research 현미경"],
  ["🔭", "telescope vision 망원경"],
  // 컴퓨터 · 통신
  ["💻", "laptop dev code 노트북 개발"],
  ["🖥️", "desktop computer 데스크탑"],
  ["⌨️", "keyboard 키보드"],
  ["🖱️", "mouse 마우스"],
  ["📱", "phone mobile 휴대폰"],
  ["💾", "save disk floppy 저장"],
  ["💿", "cd disc CD"],
  ["📦", "package box ship 박스"],
  ["📨", "mail email send 메일"],
  ["📧", "email mail 이메일"],
  ["✉️", "envelope 편지"],
  ["🔔", "bell notify 알림"],
  ["📢", "loud announce 확성기"],
  ["💬", "chat speech 채팅"],
  ["💭", "thought bubble 생각"],
  // 감정 · 사람
  ["🧠", "brain mind 뇌"],
  ["💪", "muscle strong 근육"],
  ["👀", "eyes look 눈"],
  ["👋", "wave hi 인사"],
  ["🙌", "celebrate hands 축하"],
  ["👏", "clap 박수"],
  ["🙏", "pray thanks 감사 기도"],
  ["🤝", "handshake deal 악수"],
  // 업무 · 데이터
  ["💼", "briefcase work job 가방 일"],
  ["📊", "chart bar stats 차트"],
  ["📈", "chart up growth 증가"],
  ["📉", "chart down 감소"],
  ["🗓️", "calendar date 달력"],
  ["📅", "calendar 달력"],
  ["📌", "pin 핀"],
  ["📍", "round pin location 위치"],
  ["🔗", "link 링크"],
  ["🔒", "lock private 잠금"],
  ["🔓", "unlock public 잠금해제"],
  ["🔑", "key 열쇠"],
  ["🛡️", "shield security 방패 보안"],
  ["⚠️", "warning alert 경고"],
  ["❗", "exclamation 느낌표"],
  ["❓", "question 물음표"],
  ["✅", "check done 완료"],
  ["❌", "x fail 실패"],
  ["⏰", "alarm time 알람"],
  ["⏱️", "stopwatch 스톱워치"],
  ["⏳", "hourglass wait 모래시계"],
  // 자연
  ["🌱", "seedling grow start 새싹 시작"],
  ["🌿", "herb leaf 허브"],
  ["🍀", "luck clover 클로버 행운"],
  ["🌳", "tree 나무"],
  ["🌸", "blossom flower 벚꽃"],
  ["🌺", "hibiscus 히비스커스"],
  ["🌻", "sunflower 해바라기"],
  ["🌷", "tulip 튤립"],
  ["🌹", "rose 장미"],
  ["🪴", "plant pot 화분"],
  ["☀️", "sun 해"],
  ["🌙", "moon 달"],
  ["☁️", "cloud 구름"],
  ["🌈", "rainbow 무지개"],
  ["❄️", "snow 눈"],
  ["💧", "drop water 물방울"],
  ["🌊", "wave ocean 파도 바다"],
  ["🌍", "earth global 지구"],
  // 장소
  ["🏠", "home house 집"],
  ["🏡", "house garden 집 정원"],
  ["🏢", "office building 회사"],
  ["🏥", "hospital 병원"],
  ["🏫", "school 학교"],
  // 음식
  ["🍳", "cook egg 요리 계란"],
  ["🍔", "burger 햄버거"],
  ["🍕", "pizza 피자"],
  ["🍜", "ramen noodle 라면"],
  ["🍣", "sushi 초밥"],
  ["🍱", "lunchbox bento 도시락"],
  ["🥗", "salad 샐러드"],
  ["🍰", "cake 케이크"],
  ["🍪", "cookie 쿠키"],
  ["🍩", "donut 도넛"],
  ["☕", "coffee 커피"],
  ["🍵", "tea 차"],
  ["🍺", "beer 맥주"],
  ["🍷", "wine 와인"],
  ["🧋", "boba milk tea 버블티"],
  // 이동
  ["✈️", "plane travel 비행기 여행"],
  ["🚗", "car 자동차"],
  ["🚂", "train 기차"],
  ["🚲", "bike 자전거"],
  // 예술 · 미디어
  ["🎨", "art paint design 예술"],
  ["🎬", "movie clapper 영화"],
  ["🎵", "music note 음악"],
  ["🎤", "mic 마이크"],
  ["🎧", "headphones 헤드폰"],
  ["📷", "camera photo 카메라"],
  ["📹", "video camera 비디오"],
  ["🎮", "game controller 게임"],
  // 스포츠
  ["⚽", "soccer ball 축구"],
  ["🏀", "basketball 농구"],
  ["🎾", "tennis 테니스"],
  ["🏃", "run jog 달리기"],
  ["🧘", "yoga meditate 요가 명상"],
  // 하트
  ["❤️", "heart red 빨간 하트"],
  ["💖", "heart pink 분홍 하트"],
  ["💛", "heart yellow 노란 하트"],
  ["💚", "heart green 초록 하트"],
  ["💙", "heart blue 파란 하트"],
  ["💜", "heart purple 보라 하트"],
  ["🖤", "heart black 검정 하트"],
  ["🤍", "heart white 흰색 하트"],
  // 동물
  ["🐶", "dog puppy 강아지"],
  ["🐱", "cat kitty 고양이"],
  ["🦊", "fox 여우"],
  ["🐧", "penguin linux 펭귄"],
  ["🐼", "panda 판다"],
  ["🐯", "tiger 호랑이"],
  ["🐰", "rabbit 토끼"],
  ["🦁", "lion 사자"],
  ["🐝", "bee 벌"],
  ["🦋", "butterfly 나비"],
  // 기타
  ["🌐", "globe www 글로벌 웹"],
  ["💎", "diamond gem 다이아"],
  ["🪙", "coin 동전"],
  ["💰", "money bag 돈"],
  ["💳", "card 카드"],
  ["🎁", "gift present 선물"],
  ["🎉", "party celebrate 파티"],
  ["🎊", "confetti 꽃가루"],
  ["🎈", "balloon 풍선"],
];

type MetaHint = { id: string; title: string; icon: string | null } | null;

export function WikiEditor({
  id,
  onMutateTree,
  metaHint,
}: {
  id: string;
  onMutateTree: () => void;
  metaHint?: MetaHint;
}) {
  const { data } = useSWR<{ page: FullPage }>(`/api/wiki/${id}`);

  if (!data?.page) {
    return <EditorLoading hint={metaHint ?? null} />;
  }

  return (
    <EditorInner
      key={data.page.id}
      page={data.page}
      onMutateTree={onMutateTree}
    />
  );
}

function EditorLoading({ hint }: { hint: MetaHint }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-5 py-6 sm:px-10 sm:py-10">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-subtle/40 text-[26px]">
          {hint?.icon ?? <Smile className="h-5 w-5 text-fg-subtle" />}
        </div>
        <div className="flex-1 text-[28px] font-semibold tracking-tight text-fg sm:text-[34px]">
          {hint?.title ?? <span className="text-fg-subtle">제목 없음</span>}
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-bg-muted" />
      </div>
    </div>
  );
}

function parseInitialContent(raw: string): PartialBlock[] | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;
  // JSON (새 포맷) — `[`로 시작하면 BlockNote document
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed as PartialBlock[];
    } catch {
      // fall through to markdown
    }
  }
  return undefined; // 마크다운(레거시) → effect에서 비동기 변환
}

function EditorInner({
  page,
  onMutateTree,
}: {
  page: FullPage;
  onMutateTree: () => void;
}) {
  const [title, setTitle] = React.useState(page.title);
  const [icon, setIcon] = React.useState<string | null>(page.icon);
  const [saved, setSaved] = React.useState(true);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const initialContent = React.useMemo(
    () => parseInitialContent(page.content),
    [page.id, page.content],
  );

  const editor = useCreateBlockNote({
    initialContent,
    dictionary: ko,
  });

  // 레거시 마크다운인 경우: 비동기 변환 후 replaceBlocks
  const [ready, setReady] = React.useState(initialContent !== undefined || !page.content);
  React.useEffect(() => {
    if (ready) return;
    let cancelled = false;
    (async () => {
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(page.content);
        if (cancelled) return;
        editor.replaceBlocks(editor.document, blocks);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = React.useCallback(
    (patch: Partial<{ title: string; content: string; icon: string | null }>) => {
      setSaved(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch(`/api/wiki/${page.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setSaved(true);
        onMutateTree();
      }, 600);
    },
    [page.id, onMutateTree],
  );

  // 언로드 보호 — 미저장 상태로 탭을 닫으려 하면 경고
  React.useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!saved) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saved]);

  function handleChange() {
    if (!ready) return; // 초기 로드 중에는 onChange 무시
    const doc: Block[] = editor.document;
    persist({ content: JSON.stringify(doc) });
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-5 py-6 sm:px-10 sm:py-10">
      {/* Icon + Title */}
      <div className="mb-4 flex items-start gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-subtle/40 text-[26px] hover:bg-bg-muted"
              aria-label="아이콘 변경"
            >
              {icon ?? <Smile className="h-5 w-5 text-fg-subtle" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px] p-0">
            <EmojiPicker
              onPick={(e) => {
                setIcon(e);
                persist({ icon: e });
              }}
              onClear={() => {
                setIcon(null);
                persist({ icon: null });
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            persist({ title: e.target.value });
          }}
          placeholder="제목 없음"
          className="flex-1 bg-transparent text-[28px] font-semibold tracking-tight text-fg outline-none placeholder:text-fg-subtle sm:text-[34px]"
        />
        <span className="mt-3 shrink-0 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {saved ? "저장됨" : "저장중…"}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <BlockNoteView editor={editor} theme="light" onChange={handleChange} />
      </div>
    </div>
  );
}

function EmojiPicker({
  onPick,
  onClear,
}: {
  onPick: (emoji: string) => void;
  onClear: () => void;
}) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return EMOJI_LIST;
    return EMOJI_LIST.filter(
      ([e, k]) => e.includes(needle) || k.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-bg/95 px-2 py-2 backdrop-blur">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이모지 검색"
          className="h-7 flex-1 rounded-md border border-border bg-bg-subtle/40 px-2 text-[12px] outline-none focus:border-fg/30"
        />
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:bg-bg-muted hover:text-fg"
        >
          제거
        </button>
      </div>
      <div className="max-h-[260px] overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-[12px] text-fg-subtle">
            결과 없음
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filtered.map(([e]) => (
              <button
                key={e}
                onClick={() => onPick(e)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-[20px] hover:bg-bg-muted"
                title={e}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
