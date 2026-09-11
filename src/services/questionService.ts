import api from './api';

export interface Question {
  id: string;
  masjid_id: string;
  user_id?: string | null;
  user_name: string;
  user_email?: string;
  title: string;
  question: string;
  reply?: string | null;
  replied_by?: string | null;
  replied_by_name?: string;
  status: 'new' | 'replied';
  created_at: string;
  replied_at?: string | null;
  masjid?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  replier?: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

export interface QuestionStatistics {
  totalQuestions: number;
  newQuestions: number;
  repliedQuestions: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeQuestion(raw: any): Question {
  return {
    id: raw.id,
    masjid_id: raw.masjid_id,
    user_id: raw.user_id ?? null,
    user_name: raw.user_name || 'Anonymous',
    user_email: raw.user_email,
    title: raw.title || '',
    question: raw.question || raw.question_text || '',
    reply: raw.reply ?? null,
    replied_by: raw.replied_by ?? null,
    replied_by_name: raw.replied_by_name || raw.replier?.name,
    status: (raw.status === 'Replied' || raw.status === 'replied' ? 'replied' : 'new') as
      | 'new'
      | 'replied',
    created_at: raw.created_at || raw.submitted_at,
    replied_at: raw.replied_at ?? null,
    masjid: raw.masjid
      ? {
          id: raw.masjid.id,
          name: raw.masjid.name,
          city: raw.masjid.city,
          state: raw.masjid.state,
        }
      : raw.masjid_name
        ? { id: raw.masjid_id, name: raw.masjid_name }
        : undefined,
    replier: raw.replier ?? null,
  };
}

function normalizeQuestions(rawList: any[]): Question[] {
  return (Array.isArray(rawList) ? rawList : []).map(normalizeQuestion);
}

class QuestionService {
  private questionsCache: Question[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 300000;
  private pendingRequest: Promise<Question[]> | null = null;

  async getQuestionsByMasjid(masjidId: string): Promise<Question[]> {
    const response = await api.get<{ data: any[] } | any[]>(`/questions/masjid/${masjidId}`);
    const list = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
    return normalizeQuestions(list);
  }

  async getQuestionById(id: string): Promise<Question> {
    const response = await api.get<{ data: any } | any>(`/questions/${id}`);
    const raw = (response.data as any).data || response.data;
    return normalizeQuestion(raw);
  }

  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
    this.questionsCache = null;
  }

  async getMasjidQuestionStatistics(masjidId: string): Promise<QuestionStatistics> {
    const response = await api.get<{ data: QuestionStatistics } | QuestionStatistics>(
      `/questions/masjid/${masjidId}/statistics`
    );
    return (response.data as any).data || response.data;
  }

  async getAllQuestions(useCache: boolean = true): Promise<Question[]> {
    const now = Date.now();
    if (useCache && this.questionsCache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.questionsCache;
    }

    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    this.pendingRequest = this.fetchQuestions(now);

    try {
      return await this.pendingRequest;
    } finally {
      this.pendingRequest = null;
    }
  }

  private async fetchQuestions(now: number): Promise<Question[]> {
    try {
      const response = await api.get<{ data: any[] } | any[]>('/questions', {
        params: { limit: 100 },
      });
      const list = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
      const questions = normalizeQuestions(list);

      this.questionsCache = questions;
      this.cacheTimestamp = now;

      return questions;
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          const masjidService = (await import('./masjidService')).default;
          const masajids = await masjidService.getAllMasajids(true);

          if (!masajids || masajids.length === 0) {
            return [];
          }

          const allQuestions: Question[] = [];

          for (let i = 0; i < masajids.length; i++) {
            try {
              const questions = await this.getQuestionsByMasjid(masajids[i].id);
              allQuestions.push(...questions);

              if (i < masajids.length - 1) {
                await delay(200);
              }
            } catch {
              // Continue with next masjid
            }
          }

          this.questionsCache = allQuestions;
          this.cacheTimestamp = now;

          return allQuestions;
        } catch {
          return this.questionsCache || [];
        }
      }

      if (error.response?.status === 429) {
        return this.questionsCache || [];
      }

      return this.questionsCache || [];
    }
  }

  clearCache(): void {
    this.questionsCache = null;
    this.cacheTimestamp = 0;
  }
}

export default new QuestionService();
