# HomeBudget OCR

## 1. Project Name
**HomeBudget OCR**

## 2. Project Description
HomeBudget OCR is a web application designed to simplify expense tracking by automating the receipt processing workflow. It leverages OCR technology to quickly extract product names and prices from Biedronka receipts, automatically categorizes the items, and provides a verification interface. Users can review highlighted items, with recognized items marked in green and unrecognized ones in orange, and make necessary manual adjustments. The application also offers a product management interface for CRUD operations on product mappings.

## 3. Tech Stack
- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend:** Supabase (PostgreSQL database with built-in authentication)
- **AI Integration:** Openrouter.ai for OCR processing
- **Testing:** 
  - **Unit & Component Tests:** Vitest, React Testing Library, Mock Service Worker (MSW)
  - **E2E Tests:** Playwright / Cypress
- **CI/CD & Hosting:** Github Actions & DigitalOcean

## 4. Getting Started Locally
To set up the project on your local machine:
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/HomeBudget-OCR.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd HomeBudget-OCR
   ```
3. **Ensure you are using Node version `22.14.0`:**
   ```bash
   nvm use
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```
5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 5. Available Scripts

### Development
- **dev:** Starts the Astro development server.
- **build:** Builds the project for production.
- **preview:** Serves a production Build locally for testing.
- **astro:** CLI command for Astro-specific operations.

### Testing
- **test:** Runs unit tests in watch mode (Vitest).
- **test:run:** Runs unit tests once.
- **test:ui:** Opens Vitest UI for interactive testing.
- **test:coverage:** Runs tests with coverage report.
- **test:unit:** Runs only unit tests in `src/`.
- **test:integration:** Runs only integration tests in `__tests__/`.
- **e2e:** Runs all E2E tests (Playwright).
- **e2e:ui:** Opens Playwright UI for interactive E2E testing.
- **e2e:headed:** Runs E2E tests with visible browser.
- **e2e:debug:** Runs E2E tests in debug mode.
- **e2e:report:** Shows Playwright test report.
- **e2e:codegen:** Generates E2E tests automatically.
- **test:all:** Runs all tests (unit + E2E).

### Code Quality
- **lint:** Runs ESLint to analyze code quality.
- **lint:fix:** Automatically fixes linting issues.
- **format:** Formats code using Prettier.

## 6. Project Scope
The scope of HomeBudget OCR includes:
- **Receipt Processing:** Optical Character Recognition (OCR) to extract data from Biedronka receipts.
- **Automatic Categorization:** Matching recognized items to pre-defined categories with a case-sensitive comparison.
- **Verification Interface:** Visual cues (green for recognized, orange for unrecognized) to assist user verification and manual corrections.
- **Expense Summary:** Generates a one-time summary of expenses by category (not stored permanently).
- **Product Management:** A CRUD interface for managing product mappings.
  
Please note that:
- The application currently supports receipts only from Biedronka.
- Advanced analytics, multi-store support, and dynamic category modifications are out of scope for the MVP.

## 7. Project Status
HomeBudget OCR is currently in the Minimum Viable Product (MVP) stage. While key functionalities have been implemented, further improvements and additional features are planned for future releases.

## 8. License
This project is licensed under the **MIT License**.