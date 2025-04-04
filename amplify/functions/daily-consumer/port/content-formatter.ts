// 콘텐츠 포맷 변환 인터페이스
export interface ContentFormatter {
  format(content: string): string;
}