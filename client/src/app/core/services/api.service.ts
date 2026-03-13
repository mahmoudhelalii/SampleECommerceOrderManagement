import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }
export interface ProductDto { id: string; nameEn: string; nameAr: string; descriptionEn: string | null; descriptionAr: string | null; imageUrl: string | null; price: number; stockQuantity: number; categoryId: string; categoryNameEn: string | null; categoryNameAr: string | null; sku?: string | null; averageRating?: number | null; reviewCount?: number; }
export interface ProductReviewDto { id: string; productId: string; userId: string; userName: string; rating: number; reviewText: string | null; createdAt: string; }
export interface ProductOrderImpactDto { quantityInOrders: number; orderCount: number; }
export interface CategoryDto { id: string; nameEn?: string; nameAr?: string; name?: string; description: string | null; }
export interface OrderItemResponse { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; }
export interface CreateOrderResponse { orderId: string; subTotal: number; discountAmount: number; totalAmount: number; status: string; orderItems: OrderItemResponse[]; }
export interface OrderDetailDto { id: string; subTotal: number; discountAmount: number; totalAmount: number; status: string; discountCode: string | null; items: OrderItemResponse[]; }
export interface OrderListItemDto { id: string; status: string; totalAmount: number; createdAt: string; }
export interface UserListItemDto { id: string; email: string; fullName: string; role: string; createdAt: string; }

export interface DashboardStatsDto {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: { status: string; count: number }[];
  totalProducts: number;
  totalCategories: number;
  lowStockProductCount: number;
  recentOrders: OrderListItemDto[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(params: { page?: number; pageSize?: number; search?: string; categoryId?: string; sortBy?: string; sortDesc?: boolean }): Observable<PagedResult<ProductDto>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page);
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize);
    if (params.search) p = p.set('search', params.search);
    if (params.categoryId) p = p.set('categoryId', params.categoryId);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDesc != null) p = p.set('sortDesc', params.sortDesc);
    return this.http.get<PagedResult<ProductDto>>(`${this.base}/Products`, { params: p });
  }

  getProduct(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.base}/Products/${id}`);
  }

  getProductOrderImpact(productId: string): Observable<ProductOrderImpactDto> {
    return this.http.get<ProductOrderImpactDto>(`${this.base}/Products/${productId}/order-impact`);
  }

  getProductReviews(productId: string): Observable<ProductReviewDto[]> {
    return this.http.get<ProductReviewDto[]>(`${this.base}/Products/${productId}/reviews`);
  }

  createProductReview(productId: string, body: { rating: number; reviewText?: string | null }): Observable<ProductReviewDto> {
    return this.http.post<ProductReviewDto>(`${this.base}/Products/${productId}/reviews`, body);
  }

  getFavorites(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/Favorites`);
  }

  addFavorite(productId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Favorites/${productId}`, {});
  }

  removeFavorite(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/Favorites/${productId}`);
  }

  uploadProductImage(file: File): Observable<{ path: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ path: string }>(`${this.base}/Products/upload-image`, formData);
  }

  getImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = this.base.replace(/\/api\/?$/, '');
    return base + '/' + path;
  }

  createProduct(body: { nameEn: string; nameAr: string; descriptionEn: string | null; descriptionAr: string | null; imageUrl: string | null; price: number; stockQuantity: number; categoryId: string; sku?: string | null }): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.base}/Products`, body);
  }

  updateProduct(id: string, body: { nameEn: string; nameAr: string; descriptionEn: string | null; descriptionAr: string | null; imageUrl: string | null; price: number; stockQuantity: number; categoryId: string; sku?: string | null }): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.base}/Products/${id}`, body);
  }

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.base}/Categories`);
  }

  getCategory(id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.base}/Categories/${id}`);
  }

  createCategory(body: { nameEn: string; nameAr: string; description: string | null }): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(`${this.base}/Categories`, body);
  }

  updateCategory(id: string, body: { nameEn: string; nameAr: string; description: string | null }): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.base}/Categories/${id}`, body);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/Categories/${id}`);
  }

  createOrder(body: { discountCode?: string | null; items: { productId: string; quantity: number }[] }, idempotencyKey?: string): Observable<CreateOrderResponse> {
    let headers = new HttpHeaders();
    if (idempotencyKey) headers = headers.set('Idempotency-Key', idempotencyKey);
    return this.http.post<CreateOrderResponse>(`${this.base}/Orders`, body, { headers });
  }

  getOrder(id: string): Observable<OrderDetailDto> {
    return this.http.get<OrderDetailDto>(`${this.base}/Orders/${id}`);
  }

  getOrders(params: { page?: number; pageSize?: number }): Observable<PagedResult<OrderListItemDto>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page);
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize);
    return this.http.get<PagedResult<OrderListItemDto>>(`${this.base}/Orders`, { params: p });
  }

  cancelOrder(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Orders/${id}/cancel`, {});
  }

  getDashboardStats(): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.base}/Dashboard/stats`);
  }

  getUsers(params: { page?: number; pageSize?: number }): Observable<PagedResult<UserListItemDto>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page);
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize);
    return this.http.get<PagedResult<UserListItemDto>>(`${this.base}/Users`, { params: p });
  }

  createUser(body: { email: string; password: string; fullName: string; role: string }): Observable<{ id: string; email: string; fullName: string; role: string }> {
    return this.http.post<{ id: string; email: string; fullName: string; role: string }>(`${this.base}/Users`, body);
  }

  updateUserRole(userId: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${userId}/role`, { role });
  }
}
