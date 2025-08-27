/*
 * AlgoMento - AI Coding Assistant
 * Environment Configuration Manager
 * 
 * Copyright (c) 2025 Biraj Paul (Biraj-P)
 * Licensed under the MIT License
 * 
 * Original Author: Biraj Paul
 * GitHub: https://github.com/Biraj-P
 * Project: https://github.com/Biraj-P/AlgoMento
 */

// Environment Configuration Manager
// Handles environment variables and sensitive configuration

class EnvironmentConfig {
    constructor() {
        this.config = {
            // API Keys - To be configured by user
            GEMINI_API_KEY: null,
            OPENAI_API_KEY: null,
            ANTHROPIC_API_KEY: null,
            COHERE_API_KEY: null,
            MISTRAL_API_KEY: null,
            GROQ_API_KEY: null,
            TOGETHER_API_KEY: null,
            
            // Default provider and model
            DEFAULT_PROVIDER: 'gemini',
            DEFAULT_MODEL: 'gemini-1.5-flash',
            
            // Provider base URLs
            GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
            OPENAI_BASE_URL: 'https://api.openai.com/v1',
            ANTHROPIC_BASE_URL: 'https://api.anthropic.com/v1',
            COHERE_BASE_URL: 'https://api.cohere.ai/v1',
            MISTRAL_BASE_URL: 'https://api.mistral.ai/v1',
            GROQ_BASE_URL: 'https://api.groq.com/openai/v1',
            TOGETHER_BASE_URL: 'https://api.together.xyz/v1',
            
            // Model availability flags - Set to true to enable
            MODEL_GEMINI: true,         // Google Gemini models
            MODEL_OPENAI: false,        // OpenAI GPT models  
            MODEL_ANTHROPIC: false,     // Anthropic Claude models
            MODEL_COHERE: false,        // Cohere models
            MODEL_MISTRAL: false,       // Mistral AI models
            MODEL_GROQ: false,          // Groq models
            MODEL_TOGETHER: false,      // Together AI models
            
            // Multi-provider models configuration
            MODELS_CONFIG: {
                'gemini-1.5-flash': {
                    provider: 'gemini',
                    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                    name: 'Gemini 1.5 Flash',
                    description: 'Fast and cost-effective',
                    apiKeyEnv: 'GEMINI_API_KEY',
                    requestFormat: 'gemini'
                },
                'gemini-1.5-pro': {
                    provider: 'gemini',
                    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
                    name: 'Gemini 1.5 Pro',
                    description: 'Advanced reasoning capabilities',
                    apiKeyEnv: 'GEMINI_API_KEY',
                    requestFormat: 'gemini'
                },
                'gpt-4': {
                    provider: 'openai',
                    url: 'https://api.openai.com/v1/chat/completions',
                    name: 'GPT-4',
                    description: 'Most capable OpenAI model',
                    apiKeyEnv: 'OPENAI_API_KEY',
                    requestFormat: 'openai'
                },
                'gpt-3.5-turbo': {
                    provider: 'openai',
                    url: 'https://api.openai.com/v1/chat/completions',
                    name: 'GPT-3.5 Turbo',
                    description: 'Fast and efficient',
                    apiKeyEnv: 'OPENAI_API_KEY',
                    requestFormat: 'openai'
                },
                'claude-3-sonnet': {
                    provider: 'anthropic',
                    url: 'https://api.anthropic.com/v1/messages',
                    name: 'Claude 3 Sonnet',
                    description: 'Balanced performance',
                    apiKeyEnv: 'ANTHROPIC_API_KEY',
                    requestFormat: 'anthropic'
                },
                'claude-3-haiku': {
                    provider: 'anthropic',
                    url: 'https://api.anthropic.com/v1/messages',
                    name: 'Claude 3 Haiku',
                    description: 'Fast and lightweight',
                    apiKeyEnv: 'ANTHROPIC_API_KEY',
                    requestFormat: 'anthropic'
                }
            }
        };
        
        // Load configuration from Chrome storage or .env auto-sync
        this.loadConfiguration();
    }
    
    async loadConfiguration() {
        try {
            // First try to load from .env file if available (development mode)
            await this.loadFromEnvFile();
            
            // Chrome extension: Load from storage (overrides .env values if present)
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(null);
                console.log('[Config] Loaded from Chrome storage:', Object.keys(result));
                
                // Update config with stored values
                Object.keys(this.config).forEach(key => {
                    if (result[key] !== undefined) {
                        this.config[key] = result[key];
                    }
                });
            }
        } catch (error) {
            console.warn('[Config] Failed to load from storage:', error);
        }
    }

    async loadFromEnvFile() {
        try {
            // Try to fetch .env file (only works if served from a web server in development)
            const response = await fetch('.env');
            if (response.ok) {
                const envText = await response.text();
                this.parseEnvText(envText);
                console.log('[Config] Successfully loaded from .env file');
            }
        } catch (error) {
            // .env file not accessible (normal in production), try to load hardcoded values
            console.log('[Config] .env file not accessible, checking for hardcoded values');
            this.loadHardcodedEnvValues();
        }
    }

    parseEnvText(envText) {
        const lines = envText.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...valueParts] = trimmed.split('=');
                let value = valueParts.join('=').trim();
                
                // Skip placeholder values
                if (key && value && value !== 'your_gemini_api_key_here' && 
                    value !== 'your_openai_api_key_here' && 
                    value !== 'your_anthropic_api_key_here' &&
                    !value.includes('your_') && !value.includes('_key_here')) {
                    
                    // Convert boolean strings to actual booleans
                    if (value.toLowerCase() === 'true') {
                        value = true;
                    } else if (value.toLowerCase() === 'false') {
                        value = false;
                    }
                    
                    this.config[key] = value;
                    console.log(`[Config] Loaded ${key} from .env`);
                }
            }
        }
    }

    loadHardcodedEnvValues() {
        // Hardcode your API key here for development (remove in production)
        // This is a fallback when .env file is not accessible
        const hardcodedValues = {
            GEMINI_API_KEY: 'your_key',
            DEFAULT_PROVIDER: 'gemini',
            DEFAULT_MODEL: 'gemini-1.5-flash',
            MODEL_GEMINI: true,
            MODEL_GEMINI_1_5_FLASH: true,
            MODEL_GEMINI_1_5_PRO: true
        };

        Object.keys(hardcodedValues).forEach(key => {
            if (hardcodedValues[key] !== undefined && this.config[key] !== hardcodedValues[key]) {
                this.config[key] = hardcodedValues[key];
                console.log(`[Config] Loaded ${key} from hardcoded values`);
            }
        });
    }
    
    get(key) {
        return this.config[key];
    }
    
    set(key, value) {
        this.config[key] = value;
        
        // Persist to Chrome storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [key]: value });
        }
    }
    
    getApiKey(provider) {
        const keyMap = {
            'gemini': 'GEMINI_API_KEY',
            'openai': 'OPENAI_API_KEY',
            'anthropic': 'ANTHROPIC_API_KEY',
            'cohere': 'COHERE_API_KEY',
            'mistral': 'MISTRAL_API_KEY',
            'groq': 'GROQ_API_KEY',
            'together': 'TOGETHER_API_KEY'
        };
        return this.get(keyMap[provider]);
    }
    
    getAvailableModels() {
        const models = [];
        const modelConfig = this.get('MODELS_CONFIG');
        
        Object.entries(modelConfig).forEach(([modelId, config]) => {
            const provider = config.provider;
            const enableFlag = `MODEL_${provider.toUpperCase()}`;
            const flagValue = this.get(enableFlag);
            
            if ((flagValue === 'true' || flagValue === true) && this.getApiKey(provider)) {
                models.push({
                    id: modelId,
                    ...config
                });
            }
        });
        
        return models;
    }
    
    getDefaultModel() {
        const availableModels = this.getAvailableModels();
        if (availableModels.length === 0) return null;
        
        const defaultModel = this.get('DEFAULT_MODEL');
        return availableModels.find(m => m.id === defaultModel) || availableModels[0];
    }

    getCurrentModel() {
        // Get the current model, fallback to default
        const currentModel = this.get('CURRENT_MODEL') || this.get('DEFAULT_MODEL');
        return currentModel || 'gemini-1.5-flash';
    }

    setCurrentModel(modelId) {
        this.set('CURRENT_MODEL', modelId);
    }

    getModelConfig(modelId) {
        const modelsConfig = this.get('MODELS_CONFIG');
        return modelsConfig[modelId] || null;
    }

    getApiUrl(modelId) {
        const modelConfig = this.getModelConfig(modelId);
        return modelConfig ? modelConfig.url : null;
    }

    getProviderForModel(modelId) {
        const modelConfig = this.getModelConfig(modelId);
        return modelConfig ? modelConfig.provider : null;
    }

    hasApiKeyForProvider(provider) {
        const apiKey = this.getApiKey(provider);
        return apiKey && apiKey.length > 0;
    }

    getEnabledProviders() {
        const providers = [];
        const providerMap = {
            'gemini': 'MODEL_GEMINI',
            'openai': 'MODEL_OPENAI',
            'anthropic': 'MODEL_ANTHROPIC',
            'cohere': 'MODEL_COHERE',
            'mistral': 'MODEL_MISTRAL',
            'groq': 'MODEL_GROQ',
            'together': 'MODEL_TOGETHER'
        };

        Object.entries(providerMap).forEach(([provider, enableFlag]) => {
            const flagValue = this.get(enableFlag);
            if (flagValue === 'true' || flagValue === true) {
                if (this.hasApiKeyForProvider(provider)) {
                    providers.push(provider);
                }
            }
        });

        return providers;
    }

    isModelAvailable(modelId) {
        const modelConfig = this.getModelConfig(modelId);
        if (!modelConfig) return false;
        
        const provider = modelConfig.provider;
        const enableFlag = `MODEL_${provider.toUpperCase()}`;
        const flagValue = this.get(enableFlag);
        
        return (flagValue === 'true' || flagValue === true) && 
               this.hasApiKeyForProvider(provider);
    }
}

// Global instance - use globalThis for cross-context compatibility (content script + service worker)
globalThis.envConfig = new EnvironmentConfig();

// Auto-sync utility for development
if (typeof globalThis.window !== 'undefined') {
    globalThis.window.loadEnvFromFile = async function() {
        console.log('[Config] Attempting to reload from .env file...');
        try {
            await globalThis.envConfig.loadFromEnvFile();
            console.log('[Config] Successfully reloaded configuration');
            return true;
        } catch (error) {
            console.error('[Config] Failed to reload from .env:', error);
            return false;
        }
    };
}
