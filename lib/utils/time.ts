/**
 * 상대 시간 포맷 (한국어)
 * ex) "방금 전", "5분 전", "3시간 전", "2일 전", "4월 1일"
 */
export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

/**
 * 최근 N일 이내 여부
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  return Date.now() - new Date(dateStr).getTime() < days * 86400 * 1000;
}
