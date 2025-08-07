import { useState, useEffect, useCallback } from 'react';
import { 
  stockApi, 
  allocationApi, 
  entityApi,
  internalPurchaseOrderApi,
  type Article, 
  type StockMovement, 
  type Allocation,
  type StockDashboardStats,
  type CreateArticleDto,
  type UpdateArticleDto,
  type CreateStockMovementDto,
  type CreateAllocationDto
} from '@/lib/api/stock-api';

// Hook for Stock Management
export function useStockManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dashboardStats, setDashboardStats] = useState<StockDashboardStats | null>(null);
  const [lowStockArticles, setLowStockArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles with filters
  const fetchArticles = useCallback(async (filters?: {
    search?: string;
    category?: string;
    location?: string;
    isActive?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching articles with filters:', filters);
      const response = await stockApi.getArticles(filters);
      console.log('Raw API response:', response);
      
      // Handle both response formats: { data: Article[] } or Article[]
      let articlesData: Article[];
      if (Array.isArray(response)) {
        // Direct array response
        articlesData = response;
        console.log('Using direct array response, articles count:', articlesData.length);
      } else if (response && Array.isArray(response.data)) {
        // Wrapped response with data property
        articlesData = response.data;
        console.log('Using wrapped response data, articles count:', articlesData.length);
      } else {
        // Fallback to empty array
        articlesData = [];
        console.log('Using fallback empty array, response was:', response);
      }
      
      console.log('Setting articles:', articlesData);
      setArticles(articlesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles');
      console.error('Failed to fetch articles:', err);
      // On error, ensure articles is still an array
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stock movements
  const fetchMovements = useCallback(async (filters?: {
    articleId?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setLoading(true);
      const response = await stockApi.getStockMovements(filters);
      
      // Handle both response formats: { data: StockMovement[] } or StockMovement[]
      let movementsData: StockMovement[];
      if (Array.isArray(response)) {
        // Direct array response
        movementsData = response;
      } else if (response && Array.isArray(response.data)) {
        // Wrapped response with data property
        movementsData = response.data;
      } else {
        // Fallback to empty array
        movementsData = [];
      }
      
      setMovements(movementsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch movements');
      console.error('Failed to fetch movements:', err);
      // On error, ensure movements is still an array
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const stats = await stockApi.getDashboardStats();
      setDashboardStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  // Create article
  const createArticle = useCallback(async (data: CreateArticleDto) => {
    try {
      setLoading(true);
      const newArticle = await stockApi.createArticle(data);
      // Ensure prev is always an array before spreading
      setArticles(prev => Array.isArray(prev) ? [...prev, newArticle] : [newArticle]);
      return newArticle;
    } catch (err: any) {
      setError(err.message || 'Failed to create article');
      console.error('Failed to create article:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update article
  const updateArticle = useCallback(async (id: number, data: UpdateArticleDto) => {
    try {
      setLoading(true);
      const updatedArticle = await stockApi.updateArticle(id, data);
      setArticles(prev => Array.isArray(prev) ? prev.map(article => 
        article.id === id ? updatedArticle : article
      ) : [updatedArticle]);
      return updatedArticle;
    } catch (err: any) {
      setError(err.message || 'Failed to update article');
      console.error('Failed to update article:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete article
  const deleteArticle = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await stockApi.deleteArticle(id);
      setArticles(prev => Array.isArray(prev) ? prev.filter(article => article.id !== id) : []);
    } catch (err: any) {
      setError(err.message || 'Failed to delete article');
      console.error('Failed to delete article:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create stock movement
  const createStockMovement = useCallback(async (data: CreateStockMovementDto) => {
    try {
      setLoading(true);
      const newMovement = await stockApi.createStockMovement(data);
      setMovements(prev => Array.isArray(prev) ? [newMovement, ...prev] : [newMovement]);
      
      // Update the article's current stock in local state
      setArticles(prev => Array.isArray(prev) ? prev.map(article => 
        article.id === data.articleId 
          ? { ...article, currentStock: newMovement.stockAfter }
          : article
      ) : []);
      
      return newMovement;
    } catch (err: any) {
      setError(err.message || 'Failed to create stock movement');
      console.error('Failed to create stock movement:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    // Fetch all articles first, not just active ones
    fetchArticles(); // Remove the { isActive: true } filter
    fetchMovements(); // Fetch movements without filters
    fetchDashboardStats();
  }, [fetchArticles, fetchMovements, fetchDashboardStats]);

  return {
    articles,
    movements,
    dashboardStats,
    lowStockArticles,
    loading,
    error,
    fetchArticles,
    fetchMovements,
    createArticle,
    updateArticle,
    deleteArticle,
    createStockMovement,
    refreshData: () => {
      fetchArticles(); // Remove the { isActive: true } filter
      fetchMovements(); // Fetch movements without filters  
      fetchDashboardStats();
    }
  };
}

// Hook for Allocation Management
export function useAllocationManagement() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [entities, setEntities] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch allocations with filters
  const fetchAllocations = useCallback(async (filters?: {
    search?: string;
    status?: string;
    allocationType?: string;
    entityType?: string;
    entityId?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await allocationApi.getAllocations(filters);
      // Ensure we always set an array, even if the response is unexpected
      setAllocations(Array.isArray(response?.data) ? response.data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch allocations');
      console.error('Failed to fetch allocations:', err);
      // On error, ensure allocations is still an array
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch entities for allocation
  const fetchEntities = useCallback(async () => {
    try {
      const allEntities = await entityApi.getAllEntities();
      // Ensure we always set an array, even if the response is unexpected
      setEntities(Array.isArray(allEntities) ? allEntities : []);
    } catch (err: any) {
      console.error('Failed to fetch entities:', err);
      // On error, ensure entities is still an array - this endpoint might not be implemented yet
      setEntities([]);
      // Don't set global error state for missing entities endpoint
    }
  }, []);

  // Create allocation
  const createAllocation = useCallback(async (data: CreateAllocationDto) => {
    try {
      setLoading(true);
      const newAllocation = await allocationApi.createAllocation(data);
      // Ensure prev is always an array before spreading
      setAllocations(prev => Array.isArray(prev) ? [newAllocation, ...prev] : [newAllocation]);
      return newAllocation;
    } catch (err: any) {
      setError(err.message || 'Failed to create allocation');
      console.error('Failed to create allocation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve allocation
  const approveAllocation = useCallback(async (id: number, userId: number = 1, reason?: string) => {
    try {
      setLoading(true);
      const updatedAllocation = await allocationApi.approveAllocation(id, userId, reason);
      setAllocations(prev => Array.isArray(prev) ? prev.map(allocation => 
        allocation.id === id ? updatedAllocation : allocation
      ) : [updatedAllocation]);
      return updatedAllocation;
    } catch (err: any) {
      setError(err.message || 'Failed to approve allocation');
      console.error('Failed to approve allocation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reject allocation
  const rejectAllocation = useCallback(async (id: number, reason?: string, userId: number = 1) => {
    try {
      setLoading(true);
      const updatedAllocation = await allocationApi.rejectAllocation(id, userId, reason);
      setAllocations(prev => Array.isArray(prev) ? prev.map(allocation => 
        allocation.id === id ? updatedAllocation : allocation
      ) : [updatedAllocation]);
      return updatedAllocation;
    } catch (err: any) {
      setError(err.message || 'Failed to reject allocation');
      console.error('Failed to reject allocation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Return allocation
  const returnAllocation = useCallback(async (id: number, notes?: string, actualReturnDate?: string, userId: number = 1) => {
    try {
      setLoading(true);
      const updatedAllocation = await allocationApi.returnAllocation(id, userId, notes, actualReturnDate);
      setAllocations(prev => Array.isArray(prev) ? prev.map(allocation => 
        allocation.id === id ? updatedAllocation : allocation
      ) : [updatedAllocation]);
      return updatedAllocation;
    } catch (err: any) {
      setError(err.message || 'Failed to return allocation');
      console.error('Failed to return allocation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete allocation
  const deleteAllocation = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await allocationApi.deleteAllocation(id);
      setAllocations(prev => Array.isArray(prev) ? prev.filter(allocation => allocation.id !== id) : []);
    } catch (err: any) {
      setError(err.message || 'Failed to delete allocation');
      console.error('Failed to delete allocation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllocations();
    fetchEntities();
  }, [fetchAllocations, fetchEntities]);

  return {
    allocations,
    entities,
    loading,
    error,
    fetchAllocations,
    createAllocation,
    approveAllocation,
    rejectAllocation,
    returnAllocation,
    deleteAllocation,
    refreshData: () => {
      fetchAllocations();
      fetchEntities();
    }
  };
}

// Hook for Internal Purchase Orders
export function useInternalPurchaseOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewDocument = useCallback(async (allocationId: number): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const htmlContent = await internalPurchaseOrderApi.previewDocumentHtml(allocationId);
      return htmlContent;
    } catch (err: any) {
      setError(err.message || 'Failed to preview document');
      console.error('Failed to preview document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocument = useCallback(async (allocationId: number, fileName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await internalPurchaseOrderApi.downloadDocument(allocationId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `internal-purchase-order-${allocationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download document');
      console.error('Failed to download document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    previewDocument,
    downloadDocument
  };
}
