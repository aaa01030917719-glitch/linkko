export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  folder_id: string | null;
  url: string;
  custom_title: string | null;
  memo: string | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image: string | null;
  preview_site_name: string | null;
  created_at: string;
}

export interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
}

// 폴더 + 링크 수 포함 뷰
export interface FolderWithCount extends Folder {
  link_count: number;
}

// 링크 + 폴더 이름 포함 뷰
export interface LinkWithFolder extends Link {
  folder?: Pick<Folder, "id" | "name"> | null;
}
