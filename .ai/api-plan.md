# REST API Plan

## 1. Resources

- **Users**  
  Managed by Supabase Auth. No direct endpoints are provided for user management (registration/login is handled externally).

- **Categories (kategorie)**  
  Corresponds to the "kategorie" table in the database. It is a read-only resource containing pre-defined categories seeded during migration.

- **Products (produkty)**  
  Corresponds to the "produkty" table. Each product is associated with a user and a category. Validation includes a unique constraint on the combination of (user_id, nazwa_produktu).

- **OCR Error Logs (ocr_error_logs)**  
  Corresponds to the "ocr_error_logs" table. It logs errors encountered during OCR processing and summary generation. It is primarily read-only for user-specific error diagnostics.

- **Receipts**  
  A transient resource for handling receipt image uploads and OCR processing. It is not permanently stored as a database table but is used to drive the business process (upload, OCR, auto-matching, manual adjustment, and summary generation).

## 2. Endpoints

### A. Categories

1. **List Categories**
   - **Method:** GET  
   - **URL:** `/api/categories`  
   - **Description:** Retrieve all pre-defined categories.  
   - **Query Parameters:**  
     - *None (always returns a static list)*
   - **Request Body:**  
     - *N/A*  
   - **Response:**  
    
     {
       "categories": [
         { "id": "uuid", "nazwa_kategorii": "string" },
         // ... more categories
       ]
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 401 Unauthorized if token is missing/invalid

---

### B. Products

1. **List Products**
   - **Method:** GET  
   - **URL:** `/api/products`  
   - **Description:** Retrieve a paginated list of products for the authenticated user.
   - **Query Parameters:**  
     - `page` (integer, optional)
     - `limit` (integer, optional)
     - `filter` (e.g. by category_id or partial product name)
     - `sort` (field name and order)
   - **Response:**  
    
     {
       "products": [
         {
           "id": "uuid",
           "nazwa_produktu": "string",
           "kategoria_id": "uuid",
           "user_id": "uuid",
           "created_at": "timestamp",
           "updated_at": "timestamp"
         }
       ],
       "pagination": {
         "page": 1,
         "limit": 20,
         "total": 100
       }
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 401 Unauthorized; 400 Bad Request for invalid filters

2. **Create a Product**
   - **Method:** POST  
   - **URL:** `/api/products`  
   - **Description:** Create a new product for the authenticated user.
   - **Request JSON Body:**
    
     {
       "nazwa_produktu": "string",
       "kategoria_id": "uuid"
     }
        - **Response:**  
    
     {
       "message": "Product created successfully",
       "product": {
         "id": "uuid",
         "nazwa_produktu": "string",
         "kategoria_id": "uuid",
         "user_id": "uuid",
         "created_at": "timestamp",
         "updated_at": "timestamp"
       }
     }
        - **Success Codes:** 201 Created  
   - **Errors:** 400 Bad Request (e.g., duplicate product name for user), 401 Unauthorized

3. **Get a Product**
   - **Method:** GET  
   - **URL:** `/api/products/{id}`  
   - **Description:** Retrieve details of a specific product.
   - **Path Parameters:**  
     - `id` (UUID of the product)
   - **Response:**  
    
     {
       "product": {
         "id": "uuid",
         "nazwa_produktu": "string",
         "kategoria_id": "uuid",
         "user_id": "uuid",
         "created_at": "timestamp",
         "updated_at": "timestamp"
       }
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 404 Not Found, 401 Unauthorized

4. **Update a Product**
   - **Method:** PUT  
   - **URL:** `/api/products/{id}`  
   - **Description:** Update a product’s details (e.g., change product name or reassign category).
   - **Path Parameters:**  
     - `id` (UUID of the product)
   - **Request JSON Body:**
    
     {
       "nazwa_produktu": "string",
       "kategoria_id": "uuid"
     }
        - **Response:**  
    
     {
       "message": "Product updated successfully",
       "product": {
         "id": "uuid",
         "nazwa_produktu": "string",
         "kategoria_id": "uuid",
         "user_id": "uuid",
         "created_at": "timestamp",
         "updated_at": "timestamp"
       }
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 400 Bad Request (e.g., violation of unique constraint), 404 Not Found, 401 Unauthorized

5. **Delete a Product**
   - **Method:** DELETE  
   - **URL:** `/api/products/{id}`  
   - **Description:** Remove a product from the authenticated user’s collection.
   - **Path Parameters:**  
     - `id` (UUID of the product)
   - **Response:**  
    
     {
       "message": "Product deleted successfully"
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 404 Not Found, 401 Unauthorized

6. **Assign Category to a Product** (Manual Override)
   - **Method:** POST  
   - **URL:** `/api/products/{id}/assign-category`  
   - **Description:** Manually assign or change the category for a product (used when automatic matching fails).  
   - **Path Parameters:**  
     - `id` (UUID of the product)
   - **Request JSON Body:**
    
     {
       "kategoria_id": "uuid"
     }
        - **Response:**  
    
     {
       "message": "Category assigned successfully",
       "product": {
         "id": "uuid",
         "nazwa_produktu": "string",
         "kategoria_id": "uuid",
         "user_id": "uuid",
         "created_at": "timestamp",
         "updated_at": "timestamp"
       }
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 400 Bad Request, 404 Not Found, 401 Unauthorized

---

### C. OCR Processing (Receipts)

1. **Upload and Process Receipt**
   - **Method:** POST  
   - **URL:** `/api/receipts/process`  
   - **Description:** Upload a receipt image for OCR processing. The endpoint processes the image, performs OCR, and automatically matches recognized products against the database.
   - **Request:**  
     - Form Data with:  
       - `receipt`: (image file)  
   - **Response:**  
    
     {
       "message": "OCR processing complete",
       "matched_products": [
         {
           "nazwa_produktu": "string",
           "kategoria_id": "uuid (if matched)",
           "confidence": "number"
         }
       ],
       "unmatched_products": [
         {
           "nazwa_produktu": "string",
           "suggested_categories": [
             { "id": "uuid", "nazwa_kategorii": "string" }
           ]
         }
       ]
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 400 Bad Request (if file is missing or format invalid), 500 Server Error (for processing failures)

2. **Get Receipt OCR Summary (Transient)**
   - **Method:** GET  
   - **URL:** `/api/receipts/{receiptId}/summary`  
   - **Description:** Retrieve a one-time summary of expenses by category generated from the receipt OCR processing. Note: this summary is temporary and not stored long-term.
   - **Path Parameters:**  
     - `receiptId`: Identifier for the OCR process (if tracking is implemented)
   - **Response:**  
    
     {
       "summary": [
         {
           "category": { "id": "uuid", "nazwa_kategorii": "string" },
           "total_expense": "number"
         }
       ]
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 404 Not Found, 401 Unauthorized

---

### D. OCR Error Logs

1. **List OCR Error Logs**
   - **Method:** GET  
   - **URL:** `/api/ocr-error-logs`  
   - **Description:** Retrieve a list of OCR error logs for the authenticated user.
   - **Query Parameters:**  
     - Pagination parameters (e.g., `page`, `limit`)  
   - **Response:**  
    
     {
       "error_logs": [
         {
           "id": "uuid",
           "error_type": "ocr_failed | summary_failed | parsing_error | network_error",
           "error_message": "string",
           "source_image_size": "number",
           "processing_duration": "number",
           "created_at": "timestamp"
         }
       ],
       "pagination": {
         "page": 1,
         "limit": 20,
         "total": 50
       }
     }
        - **Success Codes:** 200 OK  
   - **Errors:** 401 Unauthorized

---

## 3. Authentication and Authorization

- **Mechanism:**  
  Rely on Supabase's built-in authentication for user registration, login, and session management. Every API request (except public endpoints) must include a valid JWT in the `Authorization: Bearer <token>` header.

- **User Data Scoping:**  
  All endpoints filter data so that a user can access only their own resources. For example, queries for products and OCR logs automatically include a condition on `user_id` matching the token's user identifier.

---

## 4. Validation and Business Logic

- **Validation Rules:**  
  - Enforce unique constraint on products (unique combination of `user_id` and `nazwa_produktu`).
  - Validate foreign key relationships (e.g., `kategoria_id` must exist in categories).
  - Ensure that file uploads are valid image types (e.g., JPEG, PNG) in the receipts processing endpoint.
  - Validate pagination and sorting parameters for list endpoints.

- **Business Logic Implementation:**  
  - **OCR Processing:**  
    Upon receipt upload, the API invokes an OCR service (via an AI model) to extract product names and prices. The API then automatically matches these names against existing products in the database (case-sensitive comparison). Unmatched products are flagged for manual review.
    
  - **Automatic Matching vs. Manual Intervention:**  
    If a product is automatically matched (green-status in the UI as per PRD), it is returned as a matched product; otherwise, it appears in the `unmatched_products` list with suggested categories for manual assignment.  
    For manual overrides, the `/api/products/{id}/assign-category` endpoint lets the user assign or change a category.
  
  - **Expense Summary:**  
    After OCR processing and manual verification, the API generates a temporary summary of expenses grouped by category. The summary is used solely for user display and is not stored persistently.

- **Security & Performance Requirements:**  
  - **Security:**  
    All endpoints require valid authentication tokens. Data access is scoped to a user, and proper error messages are returned when access is not permitted.  
    Sensitive endpoints such as those involving OCR logs are rate-limited to protect against abuse.
  
  - **Performance:**  
    List endpoints support pagination, filtering, and sorting to optimize data retrieval. Indexes on `user_id`, `kategoria_id`, and `created_at` (for OCR logs) help maintain performance on large datasets.
  
  - **Error Handling:**  
    API responses include clear error messages and appropriate HTTP status codes. For instance, failures during OCR processing return a 500 error with a descriptive message, and invalid data submissions return a 400 error with details.
