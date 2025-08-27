/*
 * AlgoMento - AI Coding Assistant
 * Extension Popup Interface
 * 
 * Copyright (c) 2025 Biraj Paul (Biraj-P)
 * Licensed under the MIT License
 * 
 * Original Author: Biraj Paul
 * GitHub: https://github.com/Biraj-P
 * Project: https://github.com/Biraj-P/AlgoMento
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Comprehensive error suppression for external analytics and SSL issues
    const suppressExternalErrors = function(e) {
        const errorPatterns = [
            'googletagmanager',
            'google-analytics',
            'analytics.js',
            'gtag',
            'ERR_CERT_AUTHORITY_INVALID',
            'failed to install ga',
            'failed to install GTAG',
            'ERR_NETWORK',
            'ERR_INTERNET_DISCONNECTED',
            'ERR_CERT_COMMON_NAME_INVALID',
            'ERR_CERT_DATE_INVALID',
            'ERR_SSL_PROTOCOL_ERROR',
            '_app-',
            'G-CDRWKZTDEX'
        ];
        
        if (e.message || e.error || e.filename) {
            const errorText = String(e.message || e.error || e.filename || '').toLowerCase();
            
            if (errorPatterns.some(pattern => errorText.includes(pattern.toLowerCase()))) {
                console.log('[AlgoMento] Suppressed external analytics/SSL error');
                if (e.preventDefault) e.preventDefault();
                return false;
            }
        }
    };

    // Multiple event listeners for comprehensive error suppression
    window.addEventListener('error', suppressExternalErrors, true);
    window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && suppressExternalErrors({message: e.reason.message || e.reason})) {
            e.preventDefault();
        }
    });

    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const apiStatus = document.getElementById('apiStatus');
    const openSidebarBtn = document.getElementById('openSidebar');
    const quickAnalyzeBtn = document.getElementById('quickAnalyze');
    const getApiKeyLink = document.getElementById('getApiKey');
    const helpLink = document.getElementById('help');
    const loadDevKeysBtn = document.getElementById('loadDevKeys');

    // Initialize environment configuration
    if (typeof environmentConfig !== 'undefined') {
        await environmentConfig.init();
        
        // Load saved API key status
        if (environmentConfig.hasApiKey()) {
            apiKeyInput.value = '••••••••••••••••';
            updateApiStatus(true);
        }
    } else {
        // Fallback to direct Chrome storage
        chrome.storage.sync.get(['geminiApiKey'], function(result) {
            if (result.geminiApiKey) {
                apiKeyInput.value = '••••••••••••••••';
                updateApiStatus(true);
            }
        });
    }

    // Save API key
    saveApiKeyBtn.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey && !apiKey.includes('•')) {
            try {
                if (typeof environmentConfig !== 'undefined') {
                    await environmentConfig.set('GEMINI_API_KEY', apiKey);
                } else {
                    // Fallback to direct Chrome storage
                    await new Promise((resolve) => {
                        chrome.storage.sync.set({ geminiApiKey: apiKey }, resolve);
                    });
                }
                
                updateApiStatus(true);
                showNotification('API key saved successfully!', 'success');
                apiKeyInput.value = '••••••••••••••••';
            } catch (error) {
                showNotification('Failed to save API key: ' + error.message, 'error');
            }
        } else {
            showNotification('Please enter a valid API key', 'error');
        }
    });

    // Load development keys from .env
    if (loadDevKeysBtn) {
        loadDevKeysBtn.addEventListener('click', async function() {
            loadDevKeysBtn.disabled = true;
            loadDevKeysBtn.textContent = '🔄 Loading...';
            
            try {
                // Use the devConfig from dev-api-loader.js
                if (typeof devConfig !== 'undefined') {
                    await chrome.storage.sync.set(devConfig);
                    
                    // Reload environment config
                    if (typeof environmentConfig !== 'undefined') {
                        await environmentConfig.init();
                    }
                    
                    // Update UI
                    updateApiStatus(true);
                    if (apiKeyInput) {
                        apiKeyInput.value = '••••••••••••••••';
                    }
                    
                    showNotification('✅ API keys loaded from .env file!', 'success');
                    console.log('✅ [DEV] API keys loaded successfully from .env');
                } else {
                    // Fallback direct configuration
                    const fallbackConfig = {
                        geminiApiKey: "your_key",
                        defaultProvider: "gemini",
                        defaultModel: "gemini-1.5-flash",
                        debugMode: true
                    };
                    
                    await chrome.storage.sync.set(fallbackConfig);
                    
                    if (typeof environmentConfig !== 'undefined') {
                        await environmentConfig.init();
                    }
                    
                    updateApiStatus(true);
                    if (apiKeyInput) {
                        apiKeyInput.value = '••••••••••••••••';
                    }
                    showNotification('✅ API keys loaded successfully!', 'success');
                }
                
            } catch (error) {
                console.error('❌ Failed to load dev keys:', error);
                showNotification('❌ Failed to load keys: ' + error.message, 'error');
            } finally {
                loadDevKeysBtn.disabled = false;
                loadDevKeysBtn.textContent = '🔧 Load Keys from .env';
            }
        });
    }

    // Quick analyze
    quickAnalyzeBtn.addEventListener('click', async function() {
        try {
            let hasApiKey = false;
            
            if (typeof environmentConfig !== 'undefined') {
                hasApiKey = environmentConfig.hasApiKey();
            } else {
                // Fallback check
                const result = await new Promise((resolve) => {
                    chrome.storage.sync.get(['geminiApiKey'], resolve);
                });
                hasApiKey = !!result.geminiApiKey;
            }
            
            if (!hasApiKey) {
                showNotification('Please configure your API key first', 'error');
                return;
            }
            
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'quickAnalyze' });
                window.close();
            });
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    // Open sidebar
    openSidebarBtn.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'openSidebar' });
            window.close();
        });
    });

    // Get API key link
    getApiKeyLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://makersuite.google.com/app/apikey' });
    });

    // Help link
    helpLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/your-username/algomento-extension' });
    });

    // Clear API key on focus
    apiKeyInput.addEventListener('focus', function() {
        if (this.value.includes('•')) {
            this.value = '';
        }
    });

    function updateApiStatus(connected) {
        const statusIndicator = apiStatus.querySelector('.status-indicator');
        const statusText = apiStatus.querySelector('.status-text');
        
        if (connected) {
            statusIndicator.classList.add('connected');
            statusText.textContent = 'API key configured';
        } else {
            statusIndicator.classList.remove('connected');
            statusText.textContent = 'Not configured';
        }
    }

    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 15px;
            border-radius: 6px;
            color: white;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});
