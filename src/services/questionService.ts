import api from './api';

export interface Question {
  id: string;
  masjid_id: string;
  masjid_name?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  question_text: string;
  reply?: string;
  replied_by?: string;
  status: 'New' | 'Replied';
  submitted_at: string;
  replied_at?: string;
}

export interface QuestionStatistics {
  total_questions: number;
  pending_questions: number;
  replied_questions: number;
  average_response_time?: number;
}

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class QuestionService {
  // Cache for questions to avoid rate limiting
  private questionsCache: Question[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 300000; // 5 minutes cache (increased from 1 minute)
  private pendingRequest: Promise<Question[]> | null = null; // Prevent duplicate requests

  async getQuestionsByMasjid(masjidId: string): Promise<Question[]> {
    const response = await api.get<{ data: Question[] } | Question[]>(`/questions/masjid/${masjidId}`);
    return Array.isArray(response.data) ? response.data : (response.data as any).data || [];
  }

  async getQuestionById(id: string): Promise<Question> {
    const response = await api.get<{ data: Question } | Question>(`/questions/${id}`);
    return (response.data as any).data || response.data;
  }

  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
    // Clear cache when deleting
    this.questionsCache = null;
  }

  async getMasjidQuestionStatistics(masjidId: string): Promise<QuestionStatistics> {
    const response = await api.get<QuestionStatistics>(`/questions/masjid/${masjidId}/statistics`);
    return response.data;
  }

  async getAllQuestions(useCache: boolean = true): Promise<Question[]> {
    // Check cache first
    const now = Date.now();
    if (useCache && this.questionsCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached questions data (age: ' + Math.floor((now - this.cacheTimestamp) / 1000) + 's)');
      return this.questionsCache;
    }

    // If there's already a pending request, wait for it instead of making a new one
    if (this.pendingRequest) {
      console.log('⏳ Waiting for existing questions request...');
      return this.pendingRequest;
    }

    // Create new request
    this.pendingRequest = this.fetchQuestions(now);
    
    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      this.pendingRequest = null;
    }
  }

  private async fetchQuestions(now: number): Promise<Question[]> {
    try {
      // Try to get all questions from a dedicated endpoint
      const response = await api.get<{ data: Question[] } | Question[]>('/questions');
      const questions = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
      
      // Update cache
      this.questionsCache = questions;
      this.cacheTimestamp = now;
      
      return questions;
    } catch (error: any) {
      // If endpoint doesn't exist (404), fetch from all masajids
      if (error.response?.status === 404) {
        console.log('📌 /questions endpoint not available, fetching from masajids with rate limiting...');
        try {
          // Import masjidService to avoid circular dependency
          const masjidService = (await import('./masjidService')).default;
          // Use cache to avoid double rate limiting
          const masajids = await masjidService.getAllMasajids(true);
          
          if (!masajids || masajids.length === 0) {
            console.log('📌 No masajids found, returning empty questions array');
            return [];
          }
          
          // Fetch questions sequentially with delays to avoid rate limiting
          const allQuestions: Question[] = [];
          console.log(`📌 Fetching questions from ${masajids.length} masajids...`);
          
          for (let i = 0; i < masajids.length; i++) {
            try {
              const questions = await this.getQuestionsByMasjid(masajids[i].id);
              allQuestions.push(...questions);
              
              // Add delay between requests (except for the last one)
              if (i < masajids.length - 1) {
                await delay(200); // 200ms delay between requests
              }
            } catch (err) {
              console.warn(`Failed to fetch questions for masjid ${masajids[i].id}:`, err);
              // Continue with next masjid
            }
          }
          
          console.log(`📌 Fetched ${allQuestions.length} questions from ${masajids.length} masajids`);
          
          // Update cache
          this.questionsCache = allQuestions;
          this.cacheTimestamp = now;
          
          return allQuestions;
        } catch (masjidError) {
          console.error('Failed to fetch questions from masajids:', masjidError);
          return this.questionsCache || []; // Return cached data if available
        }
      }
      
      // Handle 429 (Too Many Requests) error
      if (error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded, using cached data');
        return this.questionsCache || [];
      }
      
      // For other errors, return cached data or empty array
      console.warn('getAllQuestions failed:', error.message);
      return this.questionsCache || [];
    }
  }

  // Method to clear cache manually
  clearCache(): void {
    this.questionsCache = null;
    this.cacheTimestamp = 0;
  }
}

export default new QuestionService();


