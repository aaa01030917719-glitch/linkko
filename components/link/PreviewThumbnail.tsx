import { extractDomain } from "@/lib/utils/url";

interface PreviewThumbnailProps {
  image: string | null;
  title: string;
  siteName?: string | null;
  url: string;
  className: string;
}

export default function PreviewThumbnail({
  image,
  title,
  siteName,
  url,
  className,
}: PreviewThumbnailProps) {
  const isInstagram = isInstagramPreview(siteName, url);

  return (
    <div className={`${className} shrink-0 overflow-hidden`}>
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover" />
      ) : isInstagram ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-white">
          <InstagramPlaceholderIcon />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300">
          <LinkPlaceholderIcon />
        </div>
      )}
    </div>
  );
}

function isInstagramPreview(siteName: string | null | undefined, url: string): boolean {
  const normalizedSiteName = siteName?.toLowerCase();
  const hostname = extractDomain(url).toLowerCase();

  return (
    normalizedSiteName === "instagram" ||
    hostname === "instagram.com" ||
    hostname.endsWith(".instagram.com")
  );
}

function InstagramPlaceholderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.6" cy="7.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LinkPlaceholderIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
