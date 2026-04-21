const YAKU_COLORS = {
  // 리치 계열
  '리치': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '더블리치': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '일발': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '멘탄핀': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '핑후': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '이페코': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '량페코': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  '멘젠쯔모': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  // 타점 계열
  '또이또이': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  '산안커': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  '산색동각': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  '소삼원': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  '혼로두': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  '치또이': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  // 순전대 계열
  '탄야오': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '일기통관': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '삼색동순': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '하이테이': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '호우테이': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '영상개화': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '창깡': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '혼전대요구': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  '순전대요구': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  // 자패 계열
  '혼일색': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  '청일색': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  '역패(백)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(발)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(중)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(자풍 동)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(자풍 남)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(자풍 서)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(자풍 북)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(장풍 동)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(장풍 남)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(장풍 서)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '역패(장풍 북)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  '도라 1': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  '도라 2': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  '도라 3': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  // 기본 (알 수 없는 역)
  default: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
}

export default function YakuTag({ name }) {
  const className = YAKU_COLORS[name] || YAKU_COLORS.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}>
      {name}
    </span>
  )
}
