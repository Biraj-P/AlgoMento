/*
 * AlgoMento - AI Coding Assistant
 * Background Service Worker
 * 
 * Copyright (c) 2025 Biraj Paul (Biraj-P)
 * Licensed under the MIT License
 * 
 * Original Author: Biraj Paul
 * GitHub: https://github.com/Biraj-P
 * Project: https://github.com/Biraj-P/AlgoMento
 */

// Background service worker for Chrome extension
// Import configuration and AI provider adapter
importScripts('config.js');
importScripts('ai-provider-adapter.js');

// globalThis.envConfig and AIProviderAdapter are now available from imported scripts

chrome.runtime.onInstalled.addListener(() => {
    console.log('AlgoMento extension installed');
    // Initialize environment configuration
    globalThis.envConfig.loadConfiguration().then(() => {
        console.log('[AlgoMento Background] Environment config initialized');
    }).catch(error => {
        console.error('[AlgoMento Background] Failed to initialize config:', error);
    });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[AlgoMento Background] Received message:', request.action);
    
    if (request.action === 'test') {
        console.log('[AlgoMento Background] Test message received:', request.data);
        sendResponse({ success: true, message: 'Background script is working!' });
        return true;
    } else if (request.action === 'analyzeCode') {
        console.log('[AlgoMento Background] Processing code analysis...');
        handleCodeAnalysis(request.code, request.problem)
            .then(response => {
                console.log('[AlgoMento Background] Code analysis successful');
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                console.error('[AlgoMento Background] Code analysis failed:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    } else if (request.action === 'processFeature') {
        console.log('[AlgoMento Background] Processing feature:', request.featureType);
        handleFeatureRequest(request)
            .then(response => {
                console.log('[AlgoMento Background] Feature processing successful');
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                // Log technical error for debugging
                console.error('[AlgoMento Background] Feature processing failed:', error);
                
                // Send user-friendly error message
                const userMessage = error.message.includes('API') || error.message.includes('service') 
                    ? error.message 
                    : 'Unable to process your request. Please check your internet connection and try again.';
                
                console.log(`[AlgoMento] ${userMessage}`);
                sendResponse({ success: false, error: userMessage });
            });
        return true; // Keep the message channel open for async response
    } else {
        console.warn('[AlgoMento Background] Unknown action:', request.action);
    }
});

async function handleFeatureRequest(request) {
    try {
        const { featureType, prompt, code, problem, context } = request;
        
        // Ensure environment config is initialized
        if (!globalThis.envConfig || !globalThis.envConfig.get('GEMINI_API_KEY')) {
            console.log('[AlgoMento Background] Initializing environment config...');
            await globalThis.envConfig.loadConfiguration();
        }

        // Validate API key
        if (!globalThis.envConfig.getApiKey('gemini')) {
            throw new Error('Gemini API key not configured. Please set your API key in the extension popup.');
        }

        console.log(`[AlgoMento Background] Processing feature: ${featureType}`);
        console.log(`[AlgoMento Background] API Key available: ${!!globalThis.envConfig.getApiKey('gemini')}`);

        // Create enhanced prompt based on feature type
        const enhancedPrompt = createFeaturePrompt(featureType, prompt, code, problem, context);
        console.log(`[AlgoMento Background] Created enhanced prompt, length: ${enhancedPrompt.length}`);
        
        // Call AI API using the new multi-provider adapter
        console.log('[AlgoMento Background] Calling AI API...');
        const apiResponse = await callAIAPI(enhancedPrompt);
        console.log('[AlgoMento Background] Received API response');
        
        // Process the response based on feature type
        const processedData = processFeatureResponse(featureType, apiResponse, code, problem);
        
        console.log(`[AlgoMento Background] Feature ${featureType} processed successfully`);
        return processedData;
    } catch (error) {
        console.error(`[AlgoMento Background] Error processing feature ${request.featureType}:`, error);
        throw error;
    }
}

async function callAIAPI(prompt) {
    // Use the new multi-provider adapter
    const adapter = new AIProviderAdapter(globalThis.envConfig);
    
    try {
        const result = await adapter.makeRequest(prompt);
        console.log(`[AlgoMento Background] API response from ${result.provider} (${result.model})`);
        return result.text;
    } catch (error) {
        console.error('[AlgoMento Background] AI API error:', error);
        throw error;
    }
}

function createFeaturePrompt(featureType, basePrompt, code, problem, context) {
    const contextInfo = context ? `Difficulty: ${context.difficulty || 'N/A'}, Topic: ${context.topic || 'N/A'}` : '';
    
    let enhancedPrompt = basePrompt;
    
    // Add feature-specific instructions
    switch (featureType) {
        case 'discuss-approach':
            enhancedPrompt += `\n\nProvide multiple solution approaches with:
            - Clear explanations of each approach
            - Time and space complexity analysis
            - Pros and cons of each method
            - When to use each approach
            Format as structured text with clear sections.`;
            break;
            
        case 'compare-approaches':
            enhancedPrompt += `\n\nCompare different approaches by:
            - Analyzing trade-offs between solutions
            - Performance characteristics
            - Implementation complexity
            - Real-world applicability
            Provide a clear recommendation.`;
            break;
            
        case 'get-code-help':
            enhancedPrompt += `\n\nProvide step-by-step coding guidance:
            - Break down the problem into smaller steps
            - Provide code snippets for each step
            - Explain the logic behind each step
            - Include best practices and common pitfalls
            Include complete code examples.`;
            break;
            
        case 'debug-code':
            enhancedPrompt += `\n\nAnalyze for bugs and issues:
            - Identify syntax and logic errors
            - Find edge cases not handled
            - Spot performance bottlenecks
            - Check for security vulnerabilities
            - Suggest specific fixes with corrected code`;
            break;
            
        case 'review-code':
            enhancedPrompt += `\n\nPerform comprehensive code review:
            - Assess code quality and readability
            - Check adherence to best practices
            - Identify optimization opportunities
            - Suggest improvements for maintainability
            - Rate different aspects of the code`;
            break;
            
        case 'start-quiz':
        case 'concept-quiz':
        case 'complexity-quiz':
        case 'pattern-quiz':
            enhancedPrompt += `\n\nCreate an interactive quiz with:
            - 4-5 multiple choice questions
            - Each question has 4 options (A, B, C, D)
            - Include explanations for correct answers
            - Vary difficulty levels appropriately
            - Focus on practical understanding
            Format as JSON with questions array.`;
            break;
            
        case 'generate-tests':
            enhancedPrompt += `\n\nGenerate comprehensive test cases:
            - Include edge cases and boundary conditions
            - Cover different input scenarios
            - Provide expected outputs
            - Explain what each test case validates
            Format as structured test cases.`;
            break;
    }
    
    if (contextInfo) {
        enhancedPrompt = `Context: ${contextInfo}\n\n${enhancedPrompt}`;
    }
    
    return enhancedPrompt;
}

function processFeatureResponse(featureType, response, code, problem) {
    const result = {
        featureType,
        timestamp: new Date().toISOString(),
        rawResponse: response
    };

    try {
        // Handle quiz responses specially
        if (featureType.includes('quiz')) {
            result.questions = parseQuizResponse(response);
            result.description = getQuizDescription(featureType);
            result.difficulty = 'Mixed';
            return result;
        }
        
        // Extract structured information for other features
        if (featureType === 'discuss-approach' || featureType === 'compare-approaches') {
            result.approaches = extractApproaches(response);
            result.summary = extractSummary(response);
        } else if (featureType === 'get-code-help' || featureType === 'auto-complete') {
            result.codeSnippet = extractCodeSnippet(response);
            result.steps = extractSteps(response);
        } else if (featureType === 'generate-tests') {
            result.testCases = extractTestCases(response);
        } else {
            result.suggestions = extractSuggestions(response);
            if (featureType.includes('debug') || featureType.includes('review')) {
                result.issues = extractIssues(response);
            }
        }

        return result;
    } catch (error) {
        console.error('Error processing feature response:', error);
        return {
            featureType,
            rawResponse: response,
            error: 'Failed to structure response'
        };
    }
}

async function handleCodeAnalysis(code, problem) {
    try {
        // Initialize environment config if not ready
        if (!globalThis.envConfig.get('GEMINI_API_KEY')) {
            await globalThis.envConfig.loadConfiguration();
        }

        // Validate API key
        if (!globalThis.envConfig.getApiKey('gemini')) {
            throw new Error('Gemini API key not configured. Please set your API key in the extension popup.');
        }

        const apiKey = globalThis.envConfig.getApiKey('gemini');
        const apiUrl = globalThis.envConfig.get('GEMINI_BASE_URL');

        // Validate inputs
        if (!code || code.trim().length === 0) {
            throw new Error('No code provided for analysis');
        }

        console.log('[AlgoMento] Starting code analysis...');

        const requestBody = {
            contents: [{
                parts: [{
                    text: createAnalysisPrompt(code, problem)
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMessage = `API request failed: ${response.status}`;
            
            // Handle specific error codes
            switch (response.status) {
                case 400:
                    errorMessage = 'Invalid request. Please check your code and try again.';
                    break;
                case 401:
                    errorMessage = 'Invalid API key. Please check your Gemini API key configuration.';
                    break;
                case 403:
                    errorMessage = 'API access forbidden. Please check your API key permissions.';
                    break;
                case 404:
                    errorMessage = 'API endpoint not found. Please check your internet connection.';
                    break;
                case 429:
                    errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
                    break;
                case 500:
                    errorMessage = 'Gemini API server error. Please try again later.';
                    break;
            }
            
            // Try to get more details from response
            try {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    errorMessage += ` Details: ${errorData.error.message}`;
                }
            } catch (e) {
                // Ignore JSON parsing errors
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            console.log('[AlgoMento] Code analysis completed successfully');
            return parseGeminiResponse(data.candidates[0].content.parts[0].text);
        } else {
            throw new Error('Invalid response from Gemini API');
        }
    } catch (error) {
        console.error('[AlgoMento] Error in code analysis:', error);
        throw error;
    }
}

function createAnalysisPrompt(code, problem) {
    return `As an expert coding interview assistant, analyze the following coding problem and solution:

PROBLEM:
${problem || 'No problem description provided'}

CODE:
${code || 'No code provided'}

Please provide a comprehensive analysis in the following JSON format:
{
    "analysis": {
        "approach": "Brief description of the algorithmic approach used",
        "timeComplexity": "Big O time complexity with explanation",
        "spaceComplexity": "Big O space complexity with explanation",
        "correctness": "Assessment of whether the solution is correct",
        "score": "Rate the solution from 1-10"
    },
    "suggestions": [
        "List of specific improvement suggestions",
        "Optimization opportunities",
        "Edge cases to consider"
    ],
    "alternativeApproaches": [
        {
            "name": "Alternative approach name",
            "description": "Brief description",
            "timeComplexity": "Time complexity",
            "spaceComplexity": "Space complexity"
        }
    ],
    "testCases": [
        {
            "input": "Test input",
            "expectedOutput": "Expected output",
            "description": "What this test case covers"
        }
    ]
}

Keep responses concise but thorough. Focus on practical insights that help improve coding interview performance.`;
}

function parseGeminiResponse(text) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // If no JSON found, create a structured response from the text
        return {
            analysis: {
                approach: "Analysis provided",
                timeComplexity: "See detailed analysis",
                spaceComplexity: "See detailed analysis",
                correctness: "See detailed analysis",
                score: "N/A"
            },
            suggestions: ["See detailed analysis below"],
            rawResponse: text
        };
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        return {
            analysis: {
                approach: "Unable to parse response",
                timeComplexity: "N/A",
                spaceComplexity: "N/A",
                correctness: "N/A",
                score: "N/A"
            },
            suggestions: [],
            rawResponse: text,
            error: "Failed to parse AI response"
        };
    }
}

// Utility functions for processing feature responses
function parseQuizResponse(response) {
    try {
        console.log('[AlgoMento Background] Parsing quiz response...');
        
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const quizData = JSON.parse(jsonMatch[0]);
                if (quizData.questions && Array.isArray(quizData.questions)) {
                    return quizData.questions.map(validateQuestionStructure);
                }
            } catch (jsonError) {
                console.warn('[AlgoMento Background] Failed to parse JSON, falling back to manual parsing');
            }
        }
        
        // Fallback: parse manually
        const questions = [];
        const lines = response.split('\n');
        let currentQuestion = null;
        
        lines.forEach(line => {
            line = line.trim();
            if (line.match(/^\d+\./)) {
                if (currentQuestion) {
                    questions.push(validateQuestionStructure(currentQuestion));
                }
                currentQuestion = {
                    question: line.replace(/^\d+\.\s*/, ''),
                    options: [],
                    correct: 0,
                    explanation: ''
                };
            } else if (line.match(/^[A-D]\)/)) {
                if (currentQuestion) {
                    currentQuestion.options.push(line.replace(/^[A-D]\)\s*/, ''));
                }
            } else if (line.toLowerCase().includes('answer:') && currentQuestion) {
                const answerMatch = line.match(/answer:\s*([A-D])/i);
                if (answerMatch) {
                    currentQuestion.correct = answerMatch[1].charCodeAt(0) - 65; // Convert A-D to 0-3
                }
            } else if (line.toLowerCase().includes('explanation:') && currentQuestion) {
                currentQuestion.explanation = line.replace(/.*explanation:\s*/i, '');
            }
        });
        
        if (currentQuestion) {
            questions.push(validateQuestionStructure(currentQuestion));
        }
        
        console.log(`[AlgoMento Background] Parsed ${questions.length} quiz questions`);
        return questions;
    } catch (error) {
        console.error('[AlgoMento Background] Error parsing quiz response:', error);
        return [createFallbackQuestion()];
    }
}

function validateQuestionStructure(question) {
    return {
        question: question.question || question.text || 'Question not available',
        options: Array.isArray(question.options) ? question.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: typeof question.correct === 'number' ? question.correct : 0,
        explanation: question.explanation || 'No explanation provided',
        type: question.type || 'Multiple Choice'
    };
}

function createFallbackQuestion() {
    return {
        question: 'What is the time complexity of accessing an element in an array by index?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correct: 0,
        explanation: 'Array access by index is O(1) constant time because arrays store elements in contiguous memory locations.',
        type: 'Multiple Choice'
    };
}

function getQuizDescription(featureType) {
    const descriptions = {
        'start-quiz': 'Test your knowledge with this interactive coding quiz',
        'concept-quiz': 'Quiz focused on core programming concepts and algorithms',
        'complexity-quiz': 'Practice analyzing time and space complexity',
        'pattern-quiz': 'Learn to recognize common algorithmic patterns'
    };
    return descriptions[featureType] || 'Interactive coding quiz';
}

function extractApproaches(response) {
    const approaches = [];
    const sections = response.split(/\n\s*\n/);
    
    sections.forEach(section => {
        if (section.toLowerCase().includes('approach') || section.toLowerCase().includes('solution') || section.toLowerCase().includes('method')) {
            const lines = section.split('\n');
            const name = lines[0].replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            const description = lines.slice(1).join(' ').trim();
            
            if (name && description && name.length > 5) {
                approaches.push({
                    name: name,
                    description: description,
                    complexity: extractComplexity(section),
                    pros: extractPros(section),
                    cons: extractCons(section)
                });
            }
        }
    });
    
    return approaches.slice(0, 3); // Limit to 3 approaches
}

function extractSummary(response) {
    const lines = response.split('\n');
    const meaningfulLines = lines.filter(line => line.trim().length > 30);
    const firstParagraph = meaningfulLines.slice(0, 2).join(' ').trim();
    return firstParagraph.length > 50 ? firstParagraph : response.substring(0, 200) + '...';
}

function extractCodeSnippet(response) {
    const codeMatch = response.match(/```[\w]*\n?([\s\S]*?)```/);
    if (codeMatch) {
        return codeMatch[1].trim();
    }
    return null;
}

function extractSteps(response) {
    const steps = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
        if (line.match(/^\d+\./)) {
            const step = line.replace(/^\d+\.\s*/, '').trim();
            if (step.length > 10) {
                steps.push(step);
            }
        }
    });
    
    return steps;
}

function extractTestCases(response) {
    const testCases = [];
    const lines = response.split('\n');
    
    let currentTest = null;
    lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('input:') || lowerLine.includes('test case')) {
            if (currentTest && currentTest.input) testCases.push(currentTest);
            currentTest = { 
                input: line.replace(/.*input:\s*/i, '').replace(/.*test case.*:\s*/i, '').trim()
            };
        } else if ((lowerLine.includes('output:') || lowerLine.includes('expected:')) && currentTest) {
            currentTest.output = line.replace(/.*(?:output|expected):\s*/i, '').trim();
        } else if (lowerLine.includes('explanation:') && currentTest) {
            currentTest.explanation = line.replace(/.*explanation:\s*/i, '').trim();
        }
    });
    
    if (currentTest && currentTest.input) testCases.push(currentTest);
    return testCases.slice(0, 5); // Limit to 5 test cases
}

function extractSuggestions(response) {
    const suggestions = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+\.\s/)) {
            const suggestion = trimmed.replace(/^[-•*\d.]\s*/, '').trim();
            if (suggestion.length > 15) {
                suggestions.push(suggestion);
            }
        }
    });
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
}

function extractIssues(response) {
    const issues = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('issue') || lowerLine.includes('bug') || 
            lowerLine.includes('error') || lowerLine.includes('problem') ||
            lowerLine.includes('fix') || lowerLine.includes('improve')) {
            const issue = line.trim();
            if (issue.length > 15) {
                issues.push(issue);
            }
        }
    });
    
    return issues.slice(0, 5);
}

function extractComplexity(text) {
    const complexityMatch = text.match(/O\([^)]+\)/);
    return complexityMatch ? complexityMatch[0] : '';
}

function extractPros(text) {
    const prosMatch = text.match(/pros?:?\s*([^.]+)/i);
    return prosMatch ? prosMatch[1].trim() : '';
}

function extractCons(text) {
    const consMatch = text.match(/cons?:?\s*([^.]+)/i);
    return consMatch ? consMatch[1].trim() : '';
}
