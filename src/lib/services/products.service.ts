// src/lib/services/products.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { 
  ProductDTO, 
  ListProductsResponseDTO, 
  PaginationMetaDTO,
  ProductFilter,
  ProductSort,
  ProductSortField,
  SortOrder 
} from '../../types';

/**
 * Serwis do zarządzania produktami
 * Enkapsuluje logikę biznesową związaną z operacjami CRUD na produktach
 */
export class ProductsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Tworzy nowy produkt dla użytkownika
   * 
   * @param userId - ID użytkownika tworzącego produkt
   * @param nazwaproduktu - Nazwa produktu
   * @param kategoriaId - ID kategorii, do której należy produkt
   * @returns ProductDTO nowo utworzonego produktu
   * @throws Error gdy produkt o takiej nazwie już istnieje dla użytkownika
   * @throws Error gdy kategoria nie istnieje
   * @throws Error w przypadku innych błędów bazodanowych
   */
  async createProduct(
    userId: string,
    nazwaProductu: string,
    kategoriaId: string
  ): Promise<ProductDTO> {
    // Sprawdzenie czy kategoria istnieje
    const { data: category, error: categoryError } = await this.supabase
      .from('kategorie')
      .select('id')
      .eq('id', kategoriaId)
      .single();

    if (categoryError || !category) {
      throw new Error('Kategoria nie istnieje');
    }

    // Sprawdzenie czy produkt już istnieje dla użytkownika
    const { data: existingProduct, error: checkError } = await this.supabase
      .from('produkty')
      .select('id')
      .eq('user_id', userId)
      .eq('nazwa_produktu', nazwaProductu)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Błąd podczas sprawdzania duplikatów: ${checkError.message}`);
    }

    if (existingProduct) {
      throw new Error('Produkt o takiej nazwie już istnieje');
    }

    // Utworzenie produktu
    const { data: newProduct, error: insertError } = await this.supabase
      .from('produkty')
      .insert({
        user_id: userId,
        nazwa_produktu: nazwaProductu,
        kategoria_id: kategoriaId,
      })
      .select()
      .single();

    if (insertError || !newProduct) {
      throw new Error(`Nie udało się utworzyć produktu: ${insertError?.message || 'Nieznany błąd'}`);
    }

    // Mapowanie wyniku do DTO
    return {
      id: newProduct.id,
      nazwa_produktu: newProduct.nazwa_produktu,
      kategoria_id: newProduct.kategoria_id,
      user_id: newProduct.user_id,
      created_at: newProduct.created_at,
      updated_at: newProduct.updated_at,
    };
  }

  /**
   * Pobiera paginowaną listę produktów użytkownika z opcjonalnym filtrowaniem i sortowaniem
   * 
   * @param userId - ID użytkownika, którego produkty mają być pobrane
   * @param page - Numer strony (domyślnie 1)
   * @param limit - Liczba elementów na stronę (domyślnie 20)
   * @param filterString - Opcjonalny JSON string z filtrem (category_id lub product_name)
   * @param sortString - Opcjonalny string sortowania (format: pole:kierunek)
   * @returns ListProductsResponseDTO z listą produktów i metadanymi paginacji
   * @throws Error w przypadku błędów bazodanowych lub parsowania
   */
  async listProducts(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filterString?: string,
    sortString?: string
  ): Promise<ListProductsResponseDTO> {
    // Parsowanie filtra i sortowania
    const filter = this.parseFilter(filterString);
    const sort = this.parseSort(sortString);

    // Budowanie zapytania bazowego dla zliczenia
    let countQuery = this.supabase
      .from('produkty')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Aplikowanie filtrów do zapytania zliczającego
    if (filter?.category_id) {
      countQuery = countQuery.eq('kategoria_id', filter.category_id);
    }

    if (filter?.product_name) {
      countQuery = countQuery.ilike('nazwa_produktu', `%${filter.product_name}%`);
    }

    // Pobranie całkowitej liczby rekordów
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Supabase count error:', countError);
      throw new Error(`Błąd podczas zliczania produktów: ${countError.message}`);
    }

    const totalCount = count || 0;

    // Jeśli nie ma produktów, zwróć pustą odpowiedź
    if (totalCount === 0) {
      return {
        products: [],
        pagination: this.calculatePagination(page, limit, 0),
      };
    }

    // Budowanie zapytania dla danych
    let dataQuery = this.supabase
      .from('produkty')
      .select('*')
      .eq('user_id', userId);

    // Aplikowanie filtrów
    if (filter?.category_id) {
      dataQuery = dataQuery.eq('kategoria_id', filter.category_id);
    }

    if (filter?.product_name) {
      dataQuery = dataQuery.ilike('nazwa_produktu', `%${filter.product_name}%`);
    }

    // Aplikowanie sortowania
    if (sort) {
      dataQuery = dataQuery.order(sort.field, { ascending: sort.order === 'asc' });
    } else {
      // Domyślne sortowanie po dacie utworzenia (najnowsze pierwsze)
      dataQuery = dataQuery.order('created_at', { ascending: false });
    }

    // Obliczenie offsetu i zakresu
    const offset = (page - 1) * limit;
    
    // Upewnij się, że offset nie przekracza liczby dostępnych rekordów
    if (offset >= totalCount) {
      // Zwróć pustą stronę jeśli offset jest za duży
      return {
        products: [],
        pagination: this.calculatePagination(page, limit, totalCount),
      };
    }

    // Oblicz końcowy indeks - nie może przekroczyć liczby dostępnych rekordów
    const endIndex = Math.min(offset + limit - 1, totalCount - 1);
    
    // Aplikowanie paginacji
    dataQuery = dataQuery.range(offset, endIndex);

    // Wykonanie zapytania
    const { data: products, error } = await dataQuery;

    if (error) {
      console.error('Supabase data error:', error);
      throw new Error(`Błąd podczas pobierania produktów: ${error.message}`);
    }

    // Obliczenie metadanych paginacji
    const pagination = this.calculatePagination(page, limit, totalCount);

    // Mapowanie wyników do DTO
    const productsDTO: ProductDTO[] = (products || []).map((product) => ({
      id: product.id,
      nazwa_produktu: product.nazwa_produktu,
      kategoria_id: product.kategoria_id,
      user_id: product.user_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
    }));

    return {
      products: productsDTO,
      pagination,
    };
  }

  /**
   * Parsuje string filtra JSON do obiektu ProductFilter
   * 
   * @param filterString - JSON string z filtrem
   * @returns ProductFilter lub undefined
   * @throws Error w przypadku nieprawidłowego JSON
   * @private
   */
  private parseFilter(filterString?: string): ProductFilter | undefined {
    if (!filterString) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(filterString);
      return parsed as ProductFilter;
    } catch (error) {
      throw new Error('Nieprawidłowy format JSON w parametrze filter');
    }
  }

  /**
   * Parsuje string sortowania do obiektu ProductSort
   * 
   * @param sortString - String sortowania w formacie "pole:kierunek"
   * @returns ProductSort lub undefined
   * @private
   */
  private parseSort(sortString?: string): ProductSort | undefined {
    if (!sortString) {
      return undefined;
    }

    const [field, order] = sortString.split(':');
    
    return {
      field: field as ProductSortField,
      order: order as SortOrder,
    };
  }

  /**
   * Oblicza metadane paginacji
   * 
   * @param page - Numer bieżącej strony
   * @param limit - Liczba elementów na stronę
   * @param total - Całkowita liczba elementów
   * @returns PaginationMetaDTO z metadanymi paginacji
   * @private
   */
  private calculatePagination(
    page: number,
    limit: number,
    total: number
  ): PaginationMetaDTO {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };
  }

  /**
   * Pobiera produkt po ID dla konkretnego użytkownika
   *
   * @param userId - ID użytkownika
   * @param productId - ID produktu do pobrania
   * @returns ProductDTO lub null jeśli nie znaleziono
   * @throws Error w przypadku błędów bazodanowych
   */
  async getProductById(
    userId: string,
    productId: string
  ): Promise<ProductDTO | null> {
    // Zapytanie do bazy z filtrowaniem po user_id
    const { data: product, error } = await this.supabase
      .from('produkty')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error in getProductById:', error);
      throw new Error(`Błąd podczas pobierania produktu: ${error.message}`);
    }

    // Jeśli produkt nie został znaleziony, zwróć null
    if (!product) {
      return null;
    }

    // Mapowanie wyniku do DTO
    return {
      id: product.id,
      nazwa_produktu: product.nazwa_produktu,
      kategoria_id: product.kategoria_id,
      user_id: product.user_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }
}

