import { createAsyncThunk } from '@reduxjs/toolkit';
import { stockApi, allocationApi, Article, Allocation, ArticleCategory, Unit } from '../api/stock-api-new';

export interface InventoryHistory {
    returnedAt: any;
    notes: any;
    allocatedAt: string | number | Date;
    reference: string;
    user: any;
    allocationType: 'Club' | 'Player' | 'Staff' | 'Employee';
    allocationDuration: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'In Use' | 'Returned' | 'Cancelled';
    entityName?: string;
}

export interface InventoryItem {
    id: number;
    code: string | number;
    name: string;
    description: string;
    category: ArticleCategory;
    unit: Unit;
    location?: string;
    supplier?: string;
    isActive: boolean;
    inUserAllocation: InventoryHistory[];
    allocationHistory: InventoryHistory[];
}

export const fetchAllInventoryItems = createAsyncThunk<InventoryItem[]>(
    'inventory/fetchAll',
    async () => {
        // 1️⃣ Fetch all articles
        const articles: Article[] = await stockApi.getArticles();
        console.log('Fetched articles:', articles);

        // 2️⃣ Fetch all allocations
        const allocationsResponse = await allocationApi.getAllocations({
            search: '',
            status: '',
            allocationType: '',
            entityType: '',
            entityId: undefined,
        });

        const data: Allocation[] = allocationsResponse.data;
        const allocationsFiltered = data.filter(a => a.status !== 'Rejected');

        // 3️⃣ Build virtual inventory
        const inventoryItems: InventoryItem[] = articles.map(article => {
            // get all allocations that mention this article in their items list
            const relatedAllocations = allocationsFiltered.filter(allocation =>
                allocation.items?.some(item => item.articleId === article.id)
            );

            // build history entries
            const allocationHistory: InventoryHistory[] = relatedAllocations.flatMap(allocation =>
                allocation.items
                    ?.filter(item => item.articleId === article.id)
                    .map(item => ({
                        reference: allocation.allocationNumber,
                        user: allocation.entityId,
                        allocationType: allocation.allocationType,
                        allocationDuration: allocation.durationType,
                        status: allocation.status,
                        notes: allocation.notes ?? item.notes,
                        entityName: allocation.entityName,
                        allocatedAt: item.allocatedAt,
                        returnedAt: item.returnedAt,
                    })) ?? []
            );

            // active ones
            const inUserAllocation = allocationHistory.filter(h => h.status === 'In Use');

            return {
                id: article.id,
                code: article.code,
                name: article.name,
                description: article.description || '',
                category: article.category,
                unit: article.unit,
                location: article.location,
                supplier: article.supplier,
                isActive: article.isActive,
                allocationHistory,
                inUserAllocation,
            };
        });
        console.log('Built inventoryItems:', inventoryItems);
        return inventoryItems;
    }
);


import { createSlice } from '@reduxjs/toolkit';

// Define initial state for inventory
const initialState: InventoryItem[] = [];

// Create the inventory slice
const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchAllInventoryItems.fulfilled, (state, action) => {
            return action.payload;
        });
    },
});

export const inventoryReducer = inventorySlice.reducer;