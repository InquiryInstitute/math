/**
 * Ask Faculty Client
 * Handles communication with the ask-faculty Supabase Edge Function
 */

class AskFacultyClient {
    constructor(supabaseUrl, supabaseAnonKey) {
        // Default to Inquiry.Institute Supabase project
        this.supabaseUrl = supabaseUrl || 'https://pilmscrodlitdrygabvo.supabase.co';
        this.supabaseAnonKey = supabaseAnonKey || '';
        this.facultyId = 'a.pythagoras'; // Pythagoras
        this.conversationHistory = [];
    }

    /**
     * Ask Pythagoras a question
     * @param {string} message - The question or message
     * @returns {Promise<{response: string, error?: string}>}
     */
    async ask(message) {
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/ask-faculty`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.supabaseAnonKey}`,
                    'apikey': this.supabaseAnonKey,
                },
                body: JSON.stringify({
                    faculty_id: this.facultyId,
                    message: message,
                    conversation_history: this.conversationHistory.slice(-10), // Last 10 messages
                    context: 'dialogue',
                    use_rag: true,
                    use_commonplace: true,
                    temperature: 0.9,
                    max_tokens: 2000,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('ask-faculty error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.supabaseUrl}/functions/v1/ask-faculty`,
                    error: errorText
                });
                throw new Error(`ask-faculty error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // Update conversation history
            this.conversationHistory.push({ role: 'user', content: message });
            if (data.response) {
                this.conversationHistory.push({ role: 'assistant', content: data.response });
            }

            return {
                response: data.response || 'I apologize, but I could not generate a response.',
                sources: data.sources,
            };
        } catch (error) {
            console.error('AskFacultyClient error:', error);
            console.error('Supabase URL being used:', this.supabaseUrl);
            console.error('Full error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            return {
                response: null,
                error: error.message,
            };
        }
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }
}
