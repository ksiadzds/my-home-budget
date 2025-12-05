// src/lib/services/receipts.service.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  ReceiptProcessingResponseDTO,
  MatchedProductDTO,
  UnmatchedProductDTO,
  CategoryDTO,
  SummaryItemDTO,
  ProductDTO,
} from "../../types";
import { OpenRouterService } from "./openrouter.service";
import { ProductsService } from "./products.service";
import { CategoriesService } from "./categories.service";

/**
 * Typ dla wyniku OCR z OpenRouter
 */
interface OCRReceiptItem {
  nazwa_produktu: string;
  cena: number;
}

interface OCRReceiptResult {
  produkty: OCRReceiptItem[];
}

/**
 * Serwis do przetwarzania paragonów
 * Integruje OpenRouter (OCR) z prostym SQL matching produktów
 */
export class ReceiptsService {
  private openRouterService: OpenRouterService;
  private productsService: ProductsService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.productsService = new ProductsService(supabase);

    // Konfiguracja OpenRouter dla OCR paragonów
    this.openRouterService = new OpenRouterService({
      model: "openai/gpt-4o-mini",
      systemMessage: `Jesteś specjalistą od analizy paragonów zakupowych. 
Twoim zadaniem jest ekstrakcja nazw produktów i ich cen z przesłanego obrazu paragonu.

Zasady ogólne:
1. Zwróć TYLKO produkty, które WYRAŹNIE widać na paragonie
2. Pomijaj pozycje typu: SUMA, PTU/VAT, OPUSTY ŁĄCZNIE, RABATY ŁĄCZNIE, nagłówki, stopki, sekcje podsumowujące
3. Dla każdego produktu podaj dokładną nazwę z paragonu oraz cenę FINALNĄ (po uwzględnieniu wszystkich rabatów)
4. Jeśli cena jest nieczytelna, pomiń produkt
5. Nazwy produktów podawaj w oryginalnym języku z paragonu
6. Jeśli produkt ma ilość i cenę jednostkową, zwróć cenę całkowitą (ilość × cena jednostkowa)
7. Jeśli paragon jest nieczytelny lub nie zawiera produktów, zwróć pustą tablicę

WAŻNE - Obsługa rabatów i odpustów:
1. Na paragonach często występują pozycje typu "OPUST", "ODPUST", "RABAT" bezpośrednio po produkcie
2. ZAWSZE odczytuj rabaty i odpusty dla produktów
3. Jeżeli rabat/odpust znajduje się bezpośrednio pod produktem - ODEJMIJ go od ceny produktu
4. W polu "cena" zwracaj TYLKO cenę finalną po odjęciu rabatu (cena brutto - rabat)
5. Dla paragonów Biedronka: odczytuj produkty znajdujące się PRZED sekcją "OPUSTY ŁĄCZNIE" lub "RABATY ŁĄCZNIE"
6. Jeśli produkt ma wielokrotne rabaty - odjmij sumę wszystkich rabatów od ceny brutto

Przykłady:
- "Chleb pszenny 500g 4.50 PLN" -> nazwa: "Chleb pszenny 500g", cena: 4.50
- "Mleko 2% 3L x 2 = 12.00 PLN" -> nazwa: "Mleko 2%", cena: 12.00
- "NapTymbGazJaAr1l 3.49 PLN\nOPUST -0.50" -> nazwa: "NapTymbGazJaAr1l", cena: 2.99
- "NapAlkGoldLoch0,33l 2x6,99=13,98 PLN\nRABAT -4.00" -> nazwa: "NapAlkGoldLoch0,33l", cena: 9.98
- "Sok pomarańczowy 1L 5.99 PLN\nODPUST -1.00\nDODATKOWY RABAT -0.50" -> nazwa: "Sok pomarańczowy 1L", cena: 4.49`,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              produkty: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nazwa_produktu: {
                      type: "string",
                      description: "Nazwa produktu z paragonu",
                    },
                    cena: {
                      type: "number",
                      description: "Cena produktu w PLN",
                    },
                  },
                  required: ["nazwa_produktu", "cena"],
                  additionalProperties: false,
                },
              },
            },
            required: ["produkty"],
            additionalProperties: false,
          },
        },
      },
      parameters: {
        temperature: 0.1, // Niska temperatura dla większej precyzji
        max_tokens: 2000,
      },
    });
  }

  /**
   * Przetwarza obraz paragonu i zwraca wyniki OCR z prostym SQL matching
   *
   * @param userId - ID użytkownika przetwarzającego paragon
   * @param receiptFile - Plik obrazu paragonu
   * @returns ReceiptProcessingResponseDTO z dopasowanymi i niedopasowanymi produktami
   */
  async processReceipt(userId: string, receiptFile: File): Promise<ReceiptProcessingResponseDTO> {
    // 1. Konwersja obrazu do base64
    const base64Image = await this.fileToBase64(receiptFile);

    // 2. Wysłanie zapytania do OpenRouter z obrazem w formacie Vision API
    const imageUrl = `data:${receiptFile.type};base64,${base64Image}`;

    const userMessage = [
      {
        type: "text" as const,
        text: "Przeanalizuj ten paragon i wyekstrahuj nazwy produktów oraz ich ceny.",
      },
      {
        type: "image_url" as const,
        image_url: {
          url: imageUrl,
        },
      },
    ];

    const ocrResponse = await this.openRouterService.sendRequest(userMessage);

    // 3. Parsowanie odpowiedzi OCR
    const ocrResult = this.openRouterService.parseResponse<OCRReceiptResult>(ocrResponse);

    // Logowanie wyniku OCR dla debugowania
    console.log("[ReceiptsService] OCR Result:", {
      productCount: ocrResult.produkty.length,
      timestamp: new Date().toISOString(),
    });

    // Jeśli OCR nie zwrócił żadnych produktów
    if (!ocrResult.produkty || ocrResult.produkty.length === 0) {
      return {
        message: "Nie znaleziono produktów na paragonie. Sprawdź czy obraz jest wyraźny.",
        matched_products: [],
        unmatched_products: [],
        summary: {
          by_category: [],
          total: 0,
        },
      };
    }

    // 4. Pobranie wszystkich kategorii (dla unmatched products)
    const allCategories = await CategoriesService.listCategories(this.supabase);

    // 5. Proste SQL matching produktów do bazy użytkownika
    const { matchedProducts, unmatchedProducts } = await this.matchProductsToDatabase(
      userId,
      ocrResult.produkty,
      allCategories
    );

    // 6. Generowanie podsumowania wydatków
    const summary = this.generateSummary(matchedProducts, allCategories);

    console.log("[ReceiptsService] Processing completed:", {
      matched: matchedProducts.length,
      unmatched: unmatchedProducts.length,
    });

    return {
      message: "Paragon został przetworzony pomyślnie",
      matched_products: matchedProducts,
      unmatched_products: unmatchedProducts,
      summary,
    };
  }

  /**
   * Konwertuje plik do base64 (Node.js / Server-side)
   *
   * @param file - Plik do konwersji
   * @returns Promise z base64 string
   * @private
   */
  private async fileToBase64(file: File): Promise<string> {
    try {
      // W Node.js używamy arrayBuffer() zamiast FileReader
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      return base64;
    } catch (error) {
      throw new Error("Nie udało się odczytać pliku");
    }
  }

  /**
   * Dopasowuje produkty z OCR do istniejących produktów użytkownika
   * Używa prostego SQL matching (dokładne lub częściowe dopasowanie nazwy)
   *
   * @param userId - ID użytkownika
   * @param ocrItems - Produkty rozpoznane przez OCR
   * @param allCategories - Wszystkie dostępne kategorie
   * @returns Obiekt z dopasowanymi i niedopasowanymi produktami
   * @private
   */
  private async matchProductsToDatabase(
    userId: string,
    ocrItems: OCRReceiptItem[],
    allCategories: CategoryDTO[]
  ): Promise<{
    matchedProducts: MatchedProductDTO[];
    unmatchedProducts: UnmatchedProductDTO[];
  }> {
    // Pobranie wszystkich produktów użytkownika (bez paginacji dla matching)
    const { products: userProducts } = await this.productsService.listProducts(
      userId,
      1,
      10000 // Duży limit aby pobrać wszystkie produkty
    );

    const matchedProducts: MatchedProductDTO[] = [];
    const unmatchedProducts: UnmatchedProductDTO[] = [];

    // Dla każdego produktu z OCR próbujemy znaleźć dopasowanie przez SQL
    for (const ocrItem of ocrItems) {
      const matchedProduct = this.findMatchingProduct(ocrItem, userProducts);

      if (matchedProduct) {
        // Produkt znaleziony w bazie - dodaj do matched
        matchedProducts.push({
          nazwa_produktu: ocrItem.nazwa_produktu,
          kategoria_id: matchedProduct.kategoria_id || undefined,
          confidence: this.calculateConfidence(ocrItem.nazwa_produktu, matchedProduct.nazwa_produktu),
          price: ocrItem.cena,
        });
      } else {
        // Produkt nie znaleziony - dodaj do unmatched
        // Użytkownik wybierze kategorię sam (wszystkie kategorie dostępne)
        unmatchedProducts.push({
          nazwa_produktu: ocrItem.nazwa_produktu,
          price: ocrItem.cena,
          suggested_categories: allCategories, // Wszystkie kategorie, użytkownik wybiera
        });
      }
    }

    return { matchedProducts, unmatchedProducts };
  }

  /**
   * Znajduje pasujący produkt w bazie użytkownika
   * Używa prostego porównania nazw (case-insensitive, trimmed)
   *
   * @param ocrItem - Produkt z OCR
   * @param userProducts - Produkty użytkownika z bazy
   * @returns Znaleziony produkt lub null
   * @private
   */
  private findMatchingProduct(ocrItem: OCRReceiptItem, userProducts: ProductDTO[]): ProductDTO | null {
    const normalizedOcrName = ocrItem.nazwa_produktu.toLowerCase().trim();

    // Dokładne dopasowanie
    const exactMatch = userProducts.find((p) => p.nazwa_produktu.toLowerCase().trim() === normalizedOcrName);

    if (exactMatch) {
      return exactMatch;
    }

    // Dopasowanie częściowe (OCR name zawiera się w nazwie produktu lub odwrotnie)
    const partialMatch = userProducts.find((p) => {
      const normalizedProductName = p.nazwa_produktu.toLowerCase().trim();
      return normalizedProductName.includes(normalizedOcrName) || normalizedOcrName.includes(normalizedProductName);
    });

    return partialMatch || null;
  }

  /**
   * Oblicza confidence score dla dopasowania
   *
   * @param ocrName - Nazwa z OCR
   * @param productName - Nazwa z bazy
   * @returns Confidence score (0-1)
   * @private
   */
  private calculateConfidence(ocrName: string, productName: string): number {
    const normalized1 = ocrName.toLowerCase().trim();
    const normalized2 = productName.toLowerCase().trim();

    // Dokładne dopasowanie = 1.0
    if (normalized1 === normalized2) {
      return 1.0;
    }

    // Dopasowanie częściowe = 0.8
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.8;
    }

    // Domyślnie 0.6 (jeśli już dopasowano, ale nie idealnie)
    return 0.6;
  }

  /**
   * Generuje podsumowanie wydatków według kategorii
   * Tylko dla matched products (które mają przypisane kategorie)
   *
   * @param matchedProducts - Produkty dopasowane do kategorii
   * @param allCategories - Wszystkie kategorie
   * @returns Obiekt podsumowania
   * @private
   */
  private generateSummary(
    matchedProducts: MatchedProductDTO[],
    allCategories: CategoryDTO[]
  ): ReceiptProcessingResponseDTO["summary"] {
    // Grupowanie produktów według kategorii
    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const product of matchedProducts) {
      if (product.kategoria_id) {
        const current = categoryMap.get(product.kategoria_id) || { total: 0, count: 0 };
        categoryMap.set(product.kategoria_id, {
          total: current.total + product.price,
          count: current.count + 1,
        });
      }
    }

    // Tworzenie listy podsumowań
    const summaryItems: SummaryItemDTO[] = [];
    let totalExpense = 0;

    for (const [categoryId, stats] of categoryMap.entries()) {
      const category = allCategories.find((cat) => cat.id === categoryId);
      if (category) {
        summaryItems.push({
          category,
          total_expense: Math.round(stats.total * 100) / 100, // Zaokrąglenie do 2 miejsc po przecinku
          items_count: stats.count,
        });
        totalExpense += stats.total;
      }
    }

    // Sortowanie według największych wydatków
    summaryItems.sort((a, b) => b.total_expense - a.total_expense);

    return {
      by_category: summaryItems,
      total: Math.round(totalExpense * 100) / 100,
    };
  }
}
