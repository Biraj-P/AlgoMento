# 🤖 AlgoMento - Your AI Coding Buddy

**Ever wished you had a coding mentor sitting right next to you while solving LeetCode problems? That's exactly what I built here.**

I got tired of getting stuck on coding problems and having to search through forums or wait for help. So I created AlgoMento - it's like having an AI coding mentor that understands exactly what you're working on and can help you think through problems step by step.

![AlgoMento Demo](https://img.shields.io/badge/Status-Ready%20to%20Use-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 **Want to Get Started Right Away?**

### 👉 **[Check out QUICK_SETUP](QUICK_SETUP.md) - I'll have you up and running in 7 minutes!** 

**First time here? The quick setup guide is definitely the way to go.**

---

## 🌟 What Makes AlgoMento Special

- **🎯 Works Everywhere**: I made sure it works on all the coding sites I actually use - LeetCode, HackerRank, Codeforces, GeeksforGeeks, you name it
- **🤖 Your Choice of AI**: Don't like being locked into one AI? Neither do I. Works with Gemini, OpenAI, Claude, and more
- **💬 Actually Usable Chat**: No tiny popup windows here - I built a proper chat interface that doesn't get in your way
- **🧠 Knows What You're Doing**: It automatically figures out what problem you're working on (no copy-pasting required)
- **⚡ Quick Actions**: Copy responses, ask follow-ups, get hints - all with one click
- **📚 Learn While You Code**: Interactive quizzes pop up after explanations to make sure you actually get it
- **🎨 Looks Good**: I spent way too much time making this look nice, with themes and smooth animations

## 🚀 Getting Started

> **💡 Want the quick version?** Jump to **[QUICK_SETUP](QUICK_SETUP.md)** - it's way faster!

*This section has all the details if you want to understand everything that's happening.*

### What You'll Need
- Chrome browser (sorry Firefox users, maybe someday!)
- Internet connection (obviously)
- An AI API key - I recommend Gemini since Google gives out free ones

### 1. Get Your AI Access (Pick What Works for You)

#### Option A: Google Gemini (This is what I use - it's free!)
1. Head over to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Hit "Create API Key"
4. Copy that key somewhere safe

#### Option B: Other AI Services (If you're already using them)
- **OpenAI**: [Platform OpenAI](https://platform.openai.com/api-keys)
- **Anthropic**: [Anthropic Console](https://console.anthropic.com/)
- **Cohere**: [Cohere Dashboard](https://dashboard.cohere.ai/api-keys)

### 2. Set Up the Extension

1. **Download this project** (fork it if you want to contribute later!)
2. **Configure your API key**:
   ```bash
   # Copy the template file
   cp .env.example .env
   
   # Edit the .env file and replace the placeholder with your real key
   # Change 'your_gemini_api_key_here' to your actual key
   ```
3. **Load it into Chrome**:
   - Open Chrome and type `chrome://extensions/` in the address bar
   - Flip the "Developer mode" switch (top right)
   - Click "Load unpacked"
   - Select the AlgoMento folder you just set up
   - You should see it appear in your extensions list

### 3. Start Solving Problems!

1. Go to any coding site (LeetCode, HackerRank, whatever you prefer)
2. Look for the little AlgoMento robot button 🤖 that appears
3. Click it and start chatting with your new AI coding buddy
4. Ask it anything - "explain this problem", "is my approach right?", "what are the edge cases?"

## 🔧 Configuration

### Environment Variables (.env file)

```bash
# Required: At least one API key
GEMINI_API_KEY=your_actual_gemini_key_here

# Optional: Additional providers
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Model enablement (set to true/false)
MODEL_GEMINI=true
MODEL_OPENAI=false
MODEL_ANTHROPIC=false

# Default settings
DEFAULT_PROVIDER=gemini
DEFAULT_MODEL=gemini-1.5-flash
```

### Manual Configuration (Alternative)

If `.env` setup doesn't work, you can manually configure through Chrome:

1. Open Chrome DevTools (F12) on any supported coding site
2. Go to Console tab
3. Run this command with your API key:
   ```javascript
   chrome.storage.local.set({ 'GEMINI_API_KEY': 'your_actual_api_key_here' });
   ```

## 💡 How I Use AlgoMento (Some Ideas for You)

### When I'm Stuck on a Problem
- **"Break down this problem for me"** - Gets a clear explanation of what's being asked
- **"What's the best way to approach this?"** - Learn different solution strategies
- **"Show me an example walkthrough"** - See how the solution works with sample data

### When I Want My Code Reviewed
- **Paste your code** and ask "What do you think of this solution?"
- **"Can I make this faster?"** - Get time and space complexity feedback
- **"Help me debug this"** - Find those annoying bugs

### When Prepping for Interviews
- **"What edge cases should I consider?"** - Don't get caught off guard
- **"How would you explain this solution in an interview?"** - Practice your explanation
- **"What follow-up questions might they ask?"** - Be ready for the next level

## 🎨 Features in Detail

### Tabbed Interface
- **Chat**: Main conversation area
- **Tools**: Quick actions and utilities  
- **Context**: Auto-detected problem information

### Smart Responses
- **Under 100 words**: WhatsApp-style concise answers
- **Interactive quizzes**: Multiple choice questions for learning
- **Follow-up suggestions**: Contextual next questions

### Theme Support
- **Auto**: Matches system preference
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes
- **High Contrast**: Accessibility-focused

## 🔍 When Things Don't Work (Troubleshooting)

> **💡 Quick tip:** If you're having setup problems, try the **[QUICK_SETUP](QUICK_SETUP.md)** guide first - it usually fixes most issues!

### Extension Won't Start?
1. **Double-check your API key** - Make sure it's actually in the `.env` file
2. **Reload the extension** - Go to `chrome://extensions/` and hit that reload button
3. **Check the console** - Press F12 and look for any red error messages
4. **Check permissions** - The extension needs internet access to talk to the AI

### Common Headaches and How I Fixed Them

#### "API key not configured" (I see this one a lot)
- Open your `.env` file and make sure your API key is actually there
- Try the manual setup method I mentioned above
- Double-check that you saved the file (I've forgotten to save more times than I care to admit)

#### The extension icon isn't showing up
- Make sure you're on a supported site (LeetCode, HackerRank, etc.)
- Refresh the page after loading the extension
- Check if the extension is actually enabled in Chrome

#### AI isn't responding to me
- Your API key might be invalid or out of credits
- Check your internet connection (obvious, but you'd be surprised)
- Look for error messages in the browser console (F12)

## 🛠️ Development

### Project Structure
```
AlgoMento/
├── manifest.json          # Extension configuration
├── src/                   # Source code
│   ├── content.js         # Main extension logic
│   ├── background.js      # Service worker
│   ├── config.js          # API configuration
│   ├── popup.html/js/css  # Extension popup
│   └── ai-provider-adapter.js # AI integrations
├── docs/                  # Documentation
│   ├── QUICK_SETUP.md     # Setup guide
│   └── CONTRIBUTORS.md    # Contribution info
├── examples/              # Testing tools
│   └── setup.html         # Setup wizard
├── assets/                # Icons and images
├── .env.example          # Environment template
└── README.md             # This file
```

📋 **See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed file organization**

### Adding New AI Providers

1. **Update config.js**: Add new provider configuration
2. **Enable in .env**: Add `MODEL_NEWPROVIDER=true`
3. **Add API key**: Include `NEWPROVIDER_API_KEY=your_key`
4. **Test**: Reload extension and verify new model appears

## 📝 License

**MIT License**

**© 2025 Biraj Paul (Biraj-P). All rights reserved.**

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

**The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.**

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**Original Author**: Biraj Paul  
**GitHub**: [@Biraj-P](https://github.com/Biraj-P)  
**Project Repository**: https://github.com/Biraj-P/AlgoMento

## 🔧 Troubleshooting

### Common Issues

#### Extension Not Loading / Service Worker Errors
If you see service worker registration errors:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. If you see "window is not defined" errors, the extension files may be corrupted
5. Try reloading the extension or re-downloading

#### API Key Issues
- **"No API key configured"**: Enter your API key in the popup settings
- **"Invalid API key"**: Verify your key is correct and has proper permissions
- **"Rate limit exceeded"**: Wait a few minutes or try a different model

#### Chat Not Appearing
1. Refresh the coding platform page
2. Check if the problem is detected (look for problem title)
3. Verify the extension icon shows as active
4. Try clicking on a problem statement to trigger detection

#### No Response from AI
1. Check your internet connection
2. Verify API key is working with a simple test
3. Try switching to a different AI model
4. Check if you've hit API rate limits

### Testing Extension Health
Open `test-compatibility.html` in your browser to verify all components are working correctly.

## 🤝 Want to Help Out?

**AlgoMento** is my baby, but I love it when other people want to make it better! Here's how you can jump in:

### How to Contribute:
1. **Fork** my [repository](https://github.com/Biraj-P/AlgoMento)
2. **Make** your awesome changes
3. **Keep** all the copyright stuff intact (please!)
4. **Send** me a pull request with details about what you did
5. **Make sure** everything follows the MIT License rules

### What Kind of Help I'm Looking For:
- 🐛 **Bug Reports**: Found something broken? Tell me about it!
- ✨ **Feature Ideas**: Got an idea that would make this cooler? I'm all ears!
- 📝 **Documentation**: Help me make these guides even better
- 🧪 **Testing**: Try it on different sites and let me know how it goes
- 🎨 **Design**: Make it prettier (I'm more of a backend guy)

### Just Remember:
- ⚠️ **Give Credit**: Always mention that I (Biraj Paul) created this originally
- ⚠️ **Don't Steal**: Please don't claim this as your own work
- ⚠️ **Follow the License**: Everything needs to comply with the MIT License
- ⚠️ **Keep Headers**: Don't remove the copyright notices in the code

**Check out [docs/CONTRIBUTORS.md](docs/CONTRIBUTORS.md) for more details about contributing.**

## 📞 Need Help?

Having trouble? Here's where to look:
1. **[docs/QUICK_SETUP.md](docs/QUICK_SETUP.md)** - Start here if you're having setup issues
2. This README - I tried to cover most problems here
3. Your browser console - Press F12 and look for red error messages
4. The AI provider docs - Sometimes it's an API key issue
5. Chrome extension developer tools - For the technical folks
6. The test-compatibility.html file - Checks if everything is working right

## 🎯 Where This Works

I've tested AlgoMento on all these sites:
- ✅ **LeetCode** (leetcode.com) - Where I spend most of my time
- ✅ **HackerRank** (hackerrank.com) - Great for interview prep
- ✅ **Codeforces** (codeforces.com) - Competitive programming heaven
- ✅ **GeeksforGeeks** (geeksforgeeks.org) - Tons of practice problems
- ✅ **CodeChef** (codechef.com) - More competitive programming
- ✅ **AtCoder** (atcoder.jp) - Japanese competitive programming site
- ✅ **SPOJ** (spoj.com) - Old school but still good
- ✅ **HackerEarth** (hackerearth.com) - Good for hackathons

*I'm always adding more platforms based on what people ask for!*

---

**Happy Coding! 🚀**

*Built this with ❤️ for everyone who gets stuck on coding problems (like me)*

**© 2025 Biraj Paul (that's me). I'm the guy who built this thing from scratch.**
