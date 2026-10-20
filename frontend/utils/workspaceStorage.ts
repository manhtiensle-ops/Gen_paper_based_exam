/**
 * workspaceStorage.ts
 * Client Workspace Persistence & Disaster Recovery Engine
 * 4-Tier Storage Hierarchy (URL -> SessionStorage -> LocalStorage LRU -> Server DB)
 */

export const SCHEMA_VERSION = 2;

const STORAGE_KEY_SESSION = "hsg_workspace_session_v2";
const STORAGE_KEY_RECENT_LIST = "hsg_recent_exams_v2";
const DRAFT_PREFIX = "hsg_exam_draft_v2_";
const MAX_RECENT_EXAMS = 5;
const MAX_DRAFT_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface ClientExamDraft {
  schema_version: number;
  exam_id: string;
  exam_title: string;
  active_mode: "EXAM" | "RUBRIC";
  active_sidebar_tab: string;
  split_ratio: number;
  unsaved_latex: string | null;
  is_dirty: boolean;
  last_modified_timestamp: number;
  server_sync_timestamp: number;
}

export interface WorkspaceSession {
  schema_version: number;
  active_tab: "generator" | "questions" | "ingestion" | "review" | "studio";
  active_exam_id: string | null;
  cached_exam_data: any | null;
  updated_at: number;
}

export interface RecentExamItem {
  exam_id: string;
  exam_title: string;
  last_opened_at: number;
  is_dirty: boolean;
}

/**
 * An toàn kiểm tra localStorage có khả dụng không
 */
function isStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const testKey = "__hsg_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Lưu tiến trình toàn cục (Tab hiện tại + Đề thi đang xem dở)
 */
export function saveWorkspaceSession(
  tab: "generator" | "questions" | "ingestion" | "review" | "studio",
  examId?: string | null,
  examData?: any | null
) {
  if (!isStorageAvailable()) return;
  try {
    const session: WorkspaceSession = {
      schema_version: SCHEMA_VERSION,
      active_tab: tab,
      active_exam_id: examId || null,
      cached_exam_data: examData ? sanitizeExamData(examData) : null,
      updated_at: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch (e) {
    console.warn("[workspaceStorage] Could not save session:", e);
  }
}

/**
 * Khôi phục tiến trình làm việc sau khi F5
 */
export function getWorkspaceSession(): WorkspaceSession | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.schema_version !== SCHEMA_VERSION) {
      // Version mismatch: clean up safely
      window.localStorage.removeItem(STORAGE_KEY_SESSION);
      return null;
    }
    return parsed as WorkspaceSession;
  } catch (e) {
    return null;
  }
}

/**
 * Loại bỏ ảnh base64 lớn trước khi lưu vào localStorage để tránh lỗi QUOTA_EXCEEDED (5MB)
 */
function sanitizeExamData(exam: any): any {
  if (!exam) return null;
  const clone = { ...exam };
  // Tránh lưu các chuỗi ảnh base64 nặng trong slots
  if (Array.isArray(clone.slots_state)) {
    clone.slots_state = clone.slots_state.map((s: any) => {
      const q = s.question ? { ...s.question } : null;
      if (q && q.figures_meta) {
        // Chỉ giữ metadata figure_key, không giữ base64
        q.figures_meta = q.figures_meta.map((f: any) => ({
          figure_key: f.figure_key,
          width: f.width,
          height: f.height,
        }));
      }
      return { ...s, question: q };
    });
  }
  return clone;
}

/**
 * Lưu bản nháp cục bộ (Draft) của một đề thi trong Exam Studio (LRU)
 */
export function saveExamDraft(draft: ClientExamDraft) {
  if (!isStorageAvailable() || !draft.exam_id) return;
  try {
    const key = `${DRAFT_PREFIX}${draft.exam_id}`;
    const payload: ClientExamDraft = {
      ...draft,
      schema_version: SCHEMA_VERSION,
      last_modified_timestamp: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
    updateRecentExamsList(draft.exam_id, draft.exam_title, draft.is_dirty);
  } catch (e) {
    console.warn("[workspaceStorage] Error saving exam draft:", e);
    // Nếu đầy bộ nhớ (QuotaExceeded), dọn dẹp các draft cũ rồi thử lại
    cleanupOldDrafts(true);
  }
}

/**
 * Lấy bản nháp cục bộ của một đề thi
 */
export function getExamDraft(examId: string): ClientExamDraft | null {
  if (!isStorageAvailable() || !examId) return null;
  try {
    const key = `${DRAFT_PREFIX}${examId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.schema_version !== SCHEMA_VERSION) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed as ClientExamDraft;
  } catch (e) {
    return null;
  }
}

/**
 * Xóa bản nháp sau khi đã lưu vĩnh viễn lên server
 */
export function clearExamDraft(examId: string) {
  if (!isStorageAvailable() || !examId) return;
  try {
    window.localStorage.removeItem(`${DRAFT_PREFIX}${examId}`);
    removeRecentExam(examId);
  } catch (e) {}
}

/**
 * Quản lý danh sách 5 đề gần nhất (LRU list)
 */
function updateRecentExamsList(examId: string, title: string, isDirty: boolean) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RECENT_LIST);
    let list: RecentExamItem[] = raw ? JSON.parse(raw) : [];
    // Lọc bỏ item cũ nếu đã có
    list = list.filter((it) => it.exam_id !== examId);
    // Đưa lên đầu
    list.unshift({
      exam_id: examId,
      exam_title: title || "Đề thi",
      last_opened_at: Date.now(),
      is_dirty: isDirty,
    });
    // Giới hạn tối đa MAX_RECENT_EXAMS
    if (list.length > MAX_RECENT_EXAMS) {
      const removed = list.slice(MAX_RECENT_EXAMS);
      removed.forEach((item) => {
        window.localStorage.removeItem(`${DRAFT_PREFIX}${item.exam_id}`);
      });
      list = list.slice(0, MAX_RECENT_EXAMS);
    }
    window.localStorage.setItem(STORAGE_KEY_RECENT_LIST, JSON.stringify(list));
  } catch (e) {}
}

function removeRecentExam(examId: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RECENT_LIST);
    if (!raw) return;
    let list: RecentExamItem[] = JSON.parse(raw);
    list = list.filter((it) => it.exam_id !== examId);
    window.localStorage.setItem(STORAGE_KEY_RECENT_LIST, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Dọn dẹp rác (Garbage Collection):
 * Xóa các draft cũ hơn 14 ngày hoặc dọn dẹp khi đầy bộ nhớ
 */
export function cleanupOldDrafts(forcePrune = false) {
  if (!isStorageAvailable()) return;
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(STORAGE_KEY_RECENT_LIST);
    let list: RecentExamItem[] = raw ? JSON.parse(raw) : [];

    list = list.filter((item) => {
      const isExpired = now - item.last_opened_at > MAX_DRAFT_AGE_MS;
      if (isExpired || forcePrune) {
        window.localStorage.removeItem(`${DRAFT_PREFIX}${item.exam_id}`);
        return false;
      }
      return true;
    });

    window.localStorage.setItem(STORAGE_KEY_RECENT_LIST, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Kiểm tra xem có bất kỳ bản nháp nào đang dở dang chưa lưu không
 */
export function hasAnyUnsavedDrafts(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RECENT_LIST);
    if (!raw) return false;
    const list: RecentExamItem[] = JSON.parse(raw);
    return list.some((it) => it.is_dirty);
  } catch (e) {
    return false;
  }
}
