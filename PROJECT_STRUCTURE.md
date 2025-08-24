# 📁 AlgoMento Project Structure

```
AlgoMento/
├── 📄 README.md                    # Main project documentation
├── 📄 LICENSE                      # MIT License
├── 📄 NOTICE                       # Copyright and attribution notice
├── 📄 .gitignore                   # Git ignore rules
├── 📄 .env.example                 # Environment variables template
├── 📄 manifest.json                # Chrome extension configuration
├── 📄 package.json                 # Project metadata
│
├── 📂 src/                         # 🔧 Source Code
│   ├── content.js                  # Main extension logic (2605 lines)
│   ├── background.js               # Service worker
│   ├── config.js                   # Environment and API configuration
│   ├── ai-provider-adapter.js      # Multi-AI provider support
│   ├── popup.html                  # Extension popup interface
│   ├── popup.js                    # Popup functionality
│   └── popup.css                   # Popup styling
│
├── 📂 docs/                        # 📚 Documentation
│   ├── QUICK_SETUP.md              # 7-minute setup guide
│   ├── CONTRIBUTORS.md             # Project history and contribution guide
│   ├── PACKAGE_INFO.md             # Package contents summary
│   └── SERVICE_WORKER_FIXES.md     # Technical troubleshooting
│
├── 📂 examples/                    # 🧪 Examples & Tools
│   ├── setup.html                  # Interactive setup wizard
│   ├── test-config.html            # Configuration tester
│   ├── test-methods.html           # Method validation
│   ├── test-extension-flow.html    # Extension flow tester
│   └── test-compatibility.html     # Browser compatibility checker
│
└── 📂 assets/                      # 🎨 Static Assets
    └── icons/                      # Extension icons
        ├── icon16.png              # 16x16 icon
        ├── icon48.png              # 48x48 icon
        ├── icon128.png             # 128x128 icon
        ├── icon.svg                # Vector icon
        └── README.txt              # Icon information
```

## 🗂️ Directory Purpose

### **📂 src/** - Core Extension Code
Contains all the main extension source files that make AlgoMento work.

### **📂 docs/** - Documentation Hub
All guides, setup instructions, and project documentation for users and contributors.

### **📂 examples/** - Interactive Tools
Testing utilities and setup wizards to help users configure and validate their installation.

### **📂 assets/** - Static Resources
Icons, images, and other static files used by the extension.

## 🚀 Quick Navigation

- **New User?** → Start with `docs/QUICK_SETUP.md`
- **Developer?** → Check `src/` for the main code
- **Having Issues?** → Use tools in `examples/`
- **Want to Contribute?** → Read `docs/CONTRIBUTORS.md`

## 📦 Installation Files

The essential files you need to run AlgoMento:
- `manifest.json` - Extension configuration
- `src/` folder - All source code
- `assets/` folder - Icons and resources
- `.env.example` - Configuration template

## 🔧 Development Files

For developers and contributors:
- `docs/` - Complete documentation
- `examples/` - Testing and setup tools
- `.gitignore` - Git configuration
- `LICENSE` - Legal information
