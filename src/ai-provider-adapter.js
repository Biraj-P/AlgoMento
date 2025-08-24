/*
 * AlgoMento - AI Coding Assistant
 * Multi-Provider API Adapter
 * 
 * Copyright (c) 2025 Biraj Paul (Biraj-P)
 * Licensed under the MIT License
 * 
 * Original Author: Biraj Paul
 * GitHub: https://github.com/Biraj-P
 * Project: https://github.com/Biraj-P/AlgoMento
 */

/**
 * Multi-Provider API Adapter
 * Handles different API request formats for various AI providers
 */

class AIProviderAdapter {
    constructor(environmentConfig) {
        this.environmentConfig = environmentConfig;
    }

    /**
     * Make API request using the appropriate format for the current model
     */
    async makeRequest(prompt, modelId = null) {
        const targetModel = modelId || this.environmentConfig.getCurrentModel();
        const modelConfig = this.environmentConfig.getModelConfig(targetModel);
        
        if (!modelConfig) {
            throw new Error(`Model '${targetModel}' not found in configuration`);
        }

        const provider = modelConfig.provider;
        const apiKey = this.environmentConfig.getApiKey(provider);
        const apiUrl = this.environmentConfig.getApiUrl(targetModel);
        const requestFormat = modelConfig.requestFormat;

        switch (requestFormat) {
            case 'gemini':
                return await this.makeGeminiRequest(apiUrl, apiKey, prompt, modelConfig);
            case 'openai':
                return await this.makeOpenAIRequest(apiUrl, apiKey, prompt, modelConfig);
            case 'anthropic':
                return await this.makeAnthropicRequest(apiUrl, apiKey, prompt, modelConfig);
            case 'cohere':
                return await this.makeCohereRequest(apiUrl, apiKey, prompt, modelConfig);
            default:
                throw new Error(`Unsupported request format: ${requestFormat}`);
        }
    }

    /**
     * Make request to Google Gemini API
     */
    async makeGeminiRequest(apiUrl, apiKey, prompt, modelConfig) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        const response = await this.makeRequestWithRetry(apiUrl, apiKey, requestBody);

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('The AI service returned an incomplete response. Please try again.');
        }

        return {
            provider: 'gemini',
            model: modelConfig.name,
            text: data.candidates[0].content.parts[0].text,
            usage: data.usageMetadata || null
        };
    }

    /**
     * Make HTTP request with retry logic for temporary failures
     */
    async makeRequestWithRetry(apiUrl, apiKey, requestBody, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    return response;
                }

                // Check if this is a retryable error
                if (this.isRetryableError(response.status) && attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
                    console.log(`[AlgoMento] API temporarily unavailable (${response.status}). Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
                    await this.sleep(delay);
                    continue;
                }

                // Not retryable or final attempt - throw user-friendly error
                const humanizedMessage = this.getHumanizedErrorMessage(response.status, response.statusText);
                throw new Error(humanizedMessage);

            } catch (error) {
                lastError = error;
                
                // If it's a network error and we have retries left
                if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    console.log(`[AlgoMento] Network error. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
                    await this.sleep(delay);
                    continue;
                }
                
                // Final attempt or non-retryable error
                throw error;
            }
        }
        
        throw lastError;
    }

    /**
     * Make request to OpenAI API (GPT models)
     */
    async makeOpenAIRequest(apiUrl, apiKey, prompt, modelConfig) {
        const requestBody = {
            model: modelConfig.model,
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 2048
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(`OpenAI API error: ${response.status} ${errorData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response from OpenAI API');
        }

        return {
            provider: 'openai',
            model: modelConfig.name,
            text: data.choices[0].message.content,
            usage: data.usage || null
        };
    }

    /**
     * Make request to Anthropic API (Claude models)
     */
    async makeAnthropicRequest(apiUrl, apiKey, prompt, modelConfig) {
        const requestBody = {
            model: modelConfig.model,
            max_tokens: 2048,
            messages: [{
                role: 'user',
                content: prompt
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(`Anthropic API error: ${response.status} ${errorData?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error('Invalid response from Anthropic API');
        }

        return {
            provider: 'anthropic',
            model: modelConfig.name,
            text: data.content[0].text,
            usage: data.usage || null
        };
    }

    /**
     * Make request to Cohere API
     */
    async makeCohereRequest(apiUrl, apiKey, prompt, modelConfig) {
        const requestBody = {
            model: modelConfig.model || 'command',
            prompt: prompt,
            max_tokens: 2048,
            temperature: 0.7
        };

        const response = await fetch(`${apiUrl}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(`Cohere API error: ${response.status} ${errorData?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.generations || !data.generations[0] || !data.generations[0].text) {
            throw new Error('Invalid response from Cohere API');
        }

        return {
            provider: 'cohere',
            model: modelConfig.name,
            text: data.generations[0].text,
            usage: data.meta || null
        };
    }

    /**
     * Get error message for specific provider error codes
     */
    getProviderErrorMessage(error, provider) {
        const errorMessages = {
            400: 'Invalid request. Please check your input and try again.',
            401: `Invalid API key for ${provider}. Please check your API key configuration.`,
            403: `API access forbidden for ${provider}. Please check your API key permissions.`,
            404: `API endpoint not found for ${provider}. Please check your internet connection.`,
            429: `Rate limit exceeded for ${provider}. Please wait a moment and try again.`,
            500: `${provider} API server error. Please try again later.`
        };

        if (error.status && errorMessages[error.status]) {
            return errorMessages[error.status];
        }

        return `${provider} API error: ${error.message}`;
    }

    /**
     * Test connectivity for a specific model
     */
    async testModel(modelId) {
        try {
            const testPrompt = "Hello! Please respond with a simple greeting.";
            const result = await this.makeRequest(testPrompt, modelId);
            return {
                success: true,
                model: modelId,
                response: result.text.slice(0, 100) + '...',
                provider: result.provider
            };
        } catch (error) {
            return {
                success: false,
                model: modelId,
                error: error.message,
                provider: this.environmentConfig.getProviderForModel(modelId)
            };
        }
    }

    /**
     * Test all available models
     */
    async testAllModels() {
        const availableModels = this.environmentConfig.getAvailableModels();
        const results = [];

        for (const modelId of availableModels) {
            const modelConfig = this.environmentConfig.getModelConfig(modelId);
            
            // Only test models that have API keys configured
            if (this.environmentConfig.hasApiKeyForProvider(modelConfig.provider)) {
                console.log(`Testing model: ${modelId}...`);
                const result = await this.testModel(modelId);
                results.push(result);
                
                // Add delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                results.push({
                    success: false,
                    model: modelId,
                    error: `No API key configured for ${modelConfig.provider}`,
                    provider: modelConfig.provider
                });
            }
        }

        return results;
    }

    /**
     * Get user-friendly error message based on HTTP status code
     */
    getHumanizedErrorMessage(statusCode, statusText) {
        switch (statusCode) {
            case 503:
                return "The AI service is currently experiencing high demand. Please try again in a few moments.";
            case 429:
                return "You've reached the rate limit. Please wait a moment before trying again.";
            case 401:
                return "Invalid API key. Please check your API configuration in the extension settings.";
            case 403:
                return "Access denied. Please verify your API key has the necessary permissions.";
            case 404:
                return "The AI service endpoint was not found. This might be a temporary issue.";
            case 500:
                return "The AI service encountered an internal error. Please try again shortly.";
            case 502:
            case 504:
                return "The AI service is temporarily unavailable. Please try again in a few minutes.";
            default:
                return `The AI service is currently unavailable (Error ${statusCode}). Please check your internet connection and try again.`;
        }
    }

    /**
     * Check if an error is retryable (temporary issues)
     */
    isRetryableError(statusCode) {
        return [502, 503, 504, 429].includes(statusCode);
    }

    /**
     * Sleep for a given number of milliseconds
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIProviderAdapter;
} else {
    // Use globalThis for cross-context compatibility (content script and service worker)
    globalThis.AIProviderAdapter = AIProviderAdapter;
}
