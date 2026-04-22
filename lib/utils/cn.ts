/**
 * 조건부 Tailwind 클래스 병합 유틸
 * clsx/tailwind-merge 없이 가볍게 사용
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
