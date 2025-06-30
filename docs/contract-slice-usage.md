# Contract Management Redux Slice Usage Guide

## Overview

The contract slice has been refactored to align with the API endpoints and business rules for comprehensive contract management. This guide explains how to use the updated contract slice effectively.

## Key Features

### 1. Unified Contract Fetching
- Fetch all contracts with optional filtering by type and status
- Separate fetching for player and staff contracts
- Business rule validation built-in

### 2. Enhanced State Management
- Separate arrays for player contracts, staff contracts, and combined contracts
- Filter state management (status and type)
- Loading and error state handling

### 3. Business Logic Implementation
- Contract validation (date rules, status transitions)
- Active contract detection
- Expiring contract identification

## Available Actions

### Fetching Actions

```typescript
// Fetch contracts with optional filtering
dispatch(fetchContracts({ type: 'player', status: 'active' }))

// Fetch all contracts (both player and staff)
dispatch(fetchAllContracts('active'))

// Fetch only player contracts
dispatch(fetchPlayerContracts('active'))

// Fetch only staff contracts  
dispatch(fetchStaffContracts('pending'))

// Fetch specific contract by ID
dispatch(fetchPlayerContractById('contract-id'))
dispatch(fetchStaffContractById('contract-id'))
```

### CRUD Actions

```typescript
// Create contracts
dispatch(createPlayerContract({
  title: "Player Contract 2025",
  playerId: "player-123",
  salary: 50000,
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  hasBonus: true,
  signatureBonus: 5000
}))

dispatch(createStaffContract({
  title: "Coach Contract 2025",
  staffId: "staff-456", 
  salary: 75000,
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  hasBonus: false,
  benefits: {
    healthInsurance: true,
    carAllowance: 500
  }
}))

// Update contracts
dispatch(updatePlayerContract({
  id: "contract-123",
  data: { salary: 55000 }
}))

// Terminate contracts
dispatch(terminatePlayerContract({
  id: "contract-123",
  terminationDate: "2025-06-30",
  reason: "Mutual agreement"
}))

// Delete contracts
dispatch(deletePlayerContract("contract-123"))
```

### Filter Actions

```typescript
// Set filters
dispatch(setFilterStatus('active'))
dispatch(setFilterType('player'))

// Clear filters
dispatch(clearFilters())

// Clear errors
dispatch(clearError())
```

### Utility Actions

```typescript
// Get only active contracts
dispatch(getActiveContracts())

// Get contracts expiring in next 30 days (or custom period)
dispatch(getExpiringContracts(60)) // 60 days ahead

// Validate contract data before submission
dispatch(validateContractData({
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  terminationDate: "2025-06-30" // optional
}))
```

## Selectors

### Basic Selectors

```typescript
import { useSelector } from 'react-redux'
import {
  selectAllContracts,
  selectPlayerContracts,
  selectStaffContracts,
  selectSelectedContract,
  selectContractsLoading,
  selectContractsError
} from '@/lib/redux/contractSlice'

// In your component
const allContracts = useSelector(selectAllContracts)
const playerContracts = useSelector(selectPlayerContracts)
const loading = useSelector(selectContractsLoading)
const error = useSelector(selectContractsError)
```

### Advanced Selectors

```typescript
import {
  selectActiveContracts,
  selectExpiringContracts,
  selectContractsByStatus,
  selectFilteredContracts
} from '@/lib/redux/contractSlice'

// Get only active contracts
const activeContracts = useSelector(selectActiveContracts)

// Get contracts expiring soon
const expiringContracts = useSelector(state => selectExpiringContracts(state, 30))

// Get contracts by specific status
const terminatedContracts = useSelector(state => selectContractsByStatus(state, 'terminated'))

// Get filtered contracts based on current filter state
const filteredContracts = useSelector(selectFilteredContracts)
```

## Usage Examples

### 1. Contract List Component

```typescript
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAllContracts,
  selectFilteredContracts,
  selectContractsLoading,
  setFilterStatus,
  setFilterType
} from '@/lib/redux/contractSlice'

const ContractList = () => {
  const dispatch = useDispatch()
  const contracts = useSelector(selectFilteredContracts)
  const loading = useSelector(selectContractsLoading)
  
  useEffect(() => {
    dispatch(fetchAllContracts())
  }, [dispatch])
  
  const handleStatusFilter = (status) => {
    dispatch(setFilterStatus(status))
  }
  
  const handleTypeFilter = (type) => {
    dispatch(setFilterType(type))
  }
  
  if (loading) return <div>Loading contracts...</div>
  
  return (
    <div>
      <div className="filters">
        <select onChange={(e) => handleStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
        </select>
        
        <select onChange={(e) => handleTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="player">Player Contracts</option>
          <option value="staff">Staff Contracts</option>
        </select>
      </div>
      
      <div className="contract-list">
        {contracts.map(contract => (
          <div key={contract.id} className="contract-item">
            <h3>{contract.title}</h3>
            <p>Status: {contract.status}</p>
            <p>Salary: ${contract.salary.toLocaleString()}</p>
            <p>Period: {contract.startDate} to {contract.endDate}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. Contract Creation Form

```typescript
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  createPlayerContract,
  validateContractData,
  selectContractsLoading,
  selectContractsError,
  clearError
} from '@/lib/redux/contractSlice'

const ContractForm = ({ playerId, onSuccess }) => {
  const dispatch = useDispatch()
  const loading = useSelector(selectContractsLoading)
  const error = useSelector(selectContractsError)
  
  const [formData, setFormData] = useState({
    title: '',
    salary: '',
    startDate: '',
    endDate: '',
    hasBonus: false,
    signatureBonus: ''
  })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear any previous errors
    dispatch(clearError())
    
    // Validate contract data
    const validation = await dispatch(validateContractData({
      startDate: formData.startDate,
      endDate: formData.endDate
    }))
    
    if (validation.type.endsWith('/rejected')) {
      return // Validation failed, error is in state
    }
    
    // Create contract
    const result = await dispatch(createPlayerContract({
      ...formData,
      playerId,
      salary: Number(formData.salary),
      signatureBonus: formData.hasBonus ? Number(formData.signatureBonus) : undefined
    }))
    
    if (result.type.endsWith('/fulfilled')) {
      onSuccess?.()
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <div>
        <label>Contract Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Salary</label>
        <input
          type="number"
          value={formData.salary}
          onChange={(e) => setFormData({...formData, salary: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Start Date</label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>End Date</label>
        <input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.hasBonus}
            onChange={(e) => setFormData({...formData, hasBonus: e.target.checked})}
          />
          Has Signature Bonus
        </label>
      </div>
      
      {formData.hasBonus && (
        <div>
          <label>Signature Bonus</label>
          <input
            type="number"
            value={formData.signatureBonus}
            onChange={(e) => setFormData({...formData, signatureBonus: e.target.value})}
          />
        </div>
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Contract'}
      </button>
    </form>
  )
}
```

### 3. Dashboard Summary

```typescript
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  getActiveContracts,
  getExpiringContracts,
  selectActiveContracts,
  selectExpiringContracts
} from '@/lib/redux/contractSlice'

const ContractDashboard = () => {
  const dispatch = useDispatch()
  const activeContracts = useSelector(selectActiveContracts)
  const expiringContracts = useSelector(state => selectExpiringContracts(state, 30))
  
  useEffect(() => {
    dispatch(getActiveContracts())
    dispatch(getExpiringContracts(30))
  }, [dispatch])
  
  return (
    <div className="dashboard">
      <div className="stats">
        <div className="stat-card">
          <h3>Active Contracts</h3>
          <p className="stat-number">{activeContracts.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>Expiring Soon</h3>
          <p className="stat-number">{expiringContracts.length}</p>
        </div>
      </div>
      
      {expiringContracts.length > 0 && (
        <div className="alerts">
          <h3>Contracts Expiring in Next 30 Days</h3>
          {expiringContracts.map(contract => (
            <div key={contract.id} className="alert">
              <strong>{contract.title}</strong> expires on {contract.endDate}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Business Rules Implemented

1. **Date Validation**: End date must be after start date, termination date must be between start and end dates
2. **Status Management**: Automatic handling of contract status transitions
3. **One Active Contract**: Business logic supports checking for existing active contracts
4. **Permission Integration**: Actions include error handling for permission-based operations

## Error Handling

All async actions include comprehensive error handling:
- Network errors
- Validation errors
- Permission errors
- Business rule violations

Use the `selectContractsError` selector to display errors to users and `clearError` action to dismiss them.

## Performance Considerations

- Use specific selectors to avoid unnecessary re-renders
- Filter contracts on the frontend for immediate UI response
- Cache active contracts for dashboard displays
- Validate data before API calls to reduce network requests

## Integration with Other Systems

The contract slice integrates seamlessly with:
- Player Management (via playerId references)
- Staff Management (via staffId references)  
- Authentication (permission-based actions)
- Financial Management (salary and bonus data)
