#!/bin/bash

# 🧪 Skrypt do szybkiego setupu środowiska testowego
# HomeBudget OCR - Testing Setup

echo "🚀 HomeBudget OCR - Setup środowiska testowego"
echo "==============================================="
echo ""

# Kolory dla outputu
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sprawdź czy Node.js jest zainstalowany
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie jest zainstalowany. Zainstaluj Node.js 20 lub nowszy."
    exit 1
fi

echo -e "${BLUE}📦 Instalacja zależności testowych...${NC}"
npm install

echo ""
echo -e "${BLUE}🎭 Instalacja przeglądarek Playwright...${NC}"
npx playwright install chromium --with-deps

echo ""
echo -e "${GREEN}✅ Setup zakończony pomyślnie!${NC}"
echo ""
echo -e "${YELLOW}📚 Dostępne komendy testowe:${NC}"
echo ""
echo "  Testy jednostkowe (Vitest):"
echo "    npm test              - Uruchom w trybie watch"
echo "    npm run test:run      - Uruchom raz"
echo "    npm run test:ui       - Uruchom z interfejsem UI"
echo "    npm run test:coverage - Uruchom z raportem coverage"
echo ""
echo "  Testy E2E (Playwright):"
echo "    npm run e2e           - Uruchom wszystkie testy E2E"
echo "    npm run e2e:ui        - Uruchom w trybie UI (interaktywny)"
echo "    npm run e2e:headed    - Uruchom z widoczną przeglądarką"
echo "    npm run e2e:debug     - Uruchom w trybie debug"
echo "    npm run e2e:codegen   - Generuj testy automatycznie"
echo ""
echo "  Wszystkie testy:"
echo "    npm run test:all      - Uruchom wszystkie testy"
echo ""
echo -e "${GREEN}📖 Zobacz TESTING.md dla pełnej dokumentacji${NC}"
echo ""

