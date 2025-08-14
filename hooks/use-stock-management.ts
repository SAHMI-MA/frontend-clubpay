import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { fetchAllTeams } from '@/lib/redux/teamSlice';
import { fetchAllPlayers } from '@/lib/redux/playerSlice';
import { fetchAllStaff } from '@/lib/redux/staffSlice';
import { hrApi } from '@/lib/api/hr-api';
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
  const dispatch = useAppDispatch();
  
  // Get data from Redux slices
  const teams = useAppSelector(state => state.teams.teams);
  const players = useAppSelector(state => state.players.players);
  const staff = useAppSelector(state => state.staff.staff);
  const teamsLoading = useAppSelector(state => state.teams.loading);
  const playersLoading = useAppSelector(state => state.players.loading);
  const staffLoading = useAppSelector(state => state.staff.loading);
  
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute entities from Redux slices
  const entities = useCallback(() => {
    const allEntities: Array<{ id: number; name: string; type: string }> = [];

    // Add teams from Redux
    teams.forEach(team => {
      allEntities.push({
        id: team.id,
        name: team.name || `Team ${team.id}`,
        type: 'Club'
      });
    });

    // Add players from Redux
    players.forEach(player => {
      allEntities.push({
        id: player.id,
        name: `${player.firstName || ''} ${player.lastName || ''}`.trim() || `Player ${player.id}`,
        type: 'Player'
      });
    });

    // Add staff from Redux
    staff.forEach(staffMember => {
      allEntities.push({
        id: staffMember.id,
        name: `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || staffMember.role || `Staff ${staffMember.id}`,
        type: 'Staff'
      });
    });

    // Add employees from local state (fetched from HR API)
    allEntities.push(...employees);

    console.log('🚀 Entities computed from Redux slices:');
    console.log('- Teams:', teams.length, 'loaded');
    console.log('- Players:', players.length, 'loaded');
    console.log('- Staff:', staff.length, 'loaded');
    console.log('- Employees:', employees.length, 'loaded');
    console.log('- Total entities:', allEntities.length);

    return allEntities;
  }, [teams, players, staff, employees]);

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

  // Fetch employees from HR API
  const fetchEmployees = useCallback(async () => {
    try {
      const employeesData = await hrApi.getEmployees();
      const formattedEmployees = employeesData.map(emp => ({
        id: parseInt(emp.employeeId) || 0, // Keep numeric ID for UI consistency
        employeeId: emp.employeeId, // Preserve original string employeeId for API calls
        name: emp.fullName || `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || `Employee ${emp.employeeId}`,
        type: 'Employee'
      }));
      setEmployees(formattedEmployees);
    } catch (err: any) {
      console.warn('Failed to fetch employees:', err);
      setEmployees([]);
    }
  }, []);

  // Fetch all entity data from Redux slices
  const fetchEntitiesFromSlices = useCallback(async () => {
    try {
      setLoading(true);
      // Dispatch Redux actions to fetch data
      await Promise.all([
        dispatch(fetchAllTeams()).unwrap(),
        dispatch(fetchAllPlayers()).unwrap(),
        dispatch(fetchAllStaff()).unwrap(),
      ]);
      // Also fetch employees from HR API
      await fetchEmployees();
    } catch (err: any) {
      console.error('Failed to fetch entities from slices:', err);
      // Individual slice errors are handled by Redux, so we don't set global error here
    } finally {
      setLoading(false);
    }
  }, [dispatch, fetchEmployees]);

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
    fetchEntitiesFromSlices();
  }, [fetchAllocations, fetchEntitiesFromSlices]);

  return {
    allocations,
    entities: entities(),
    loading: loading || teamsLoading || playersLoading || staffLoading,
    error,
    fetchAllocations,
    createAllocation,
    approveAllocation,
    rejectAllocation,
    returnAllocation,
    deleteAllocation,
    refreshData: () => {
      fetchAllocations();
      fetchEntitiesFromSlices();
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
