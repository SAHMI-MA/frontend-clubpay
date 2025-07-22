# Acquisition API Documentation

## 1. Upload Quotation File

**Endpoint:**  
`POST /acquisitions/upload-file`  
**Content-Type:** `multipart/form-data`

**Request Body:**
- `file`: (binary) The file to upload (PDF, Word, image, or text, max 40MB)

**Example (form-data):**
| Key  | Value (type)         |
|------|----------------------|
| file | (select a file)      |

**Response Body:**
```json
{
  "id": 12,
  "fileName": "1689876543210-123456789.pdf",
  "fileType": "application/pdf",
  "fileSize": 204800,
  "url": "/uploads/acquisition-files/1689876543210-123456789.pdf",
  "createdAt": "2024-07-01T12:34:56.789Z",
  "updatedAt": "2024-07-01T12:34:56.789Z",
  "description": "original-filename.pdf"
}
```
Use the returned `id` as `quotationFileId` in the next step.

---

## 2. Create Acquisition

**Endpoint:**  
`POST /acquisitions`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "acquisitionType": "RENTAL",           // or "PURCHASE"
  "itemType": "APARTMENT",               // enum value
  "itemName": "Modern 2-bedroom apartment at 123 Main Street",
  "description": "2-bedroom apartment at 123 Main Street",
  "startDate": "2025-07-01",             // optional, ISO string
  "endDate": "2026-06-30",               // optional, ISO string
  "cost": 1200,
  "supplierId": 1,                       // optional
  "teamId": 2,                           // optional
  "playerId": 3,                         // optional
  "staffId": 4,                          // optional
  "suppliesId": 5,                       // optional
  "quantity": 1,                         // optional
  "createdBy": 1,                        // required (user ID)
  "quotationFileId": 12                  // optional, from upload-file response
}
```

**Response Body:**
```json
{
  "id": 101,
  "acquisitionType": "RENTAL",
  "itemType": "APARTMENT",
  "itemName": "Modern 2-bedroom apartment at 123 Main Street",
  "description": "2-bedroom apartment at 123 Main Street",
  "startDate": "2025-07-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z",
  "cost": 1200,
  "supplier": { /* supplier object */ },
  "team": { /* team object or null */ },
  "player": { /* player object or null */ },
  "staff": { /* staff object or null */ },
  "supplies": { /* supplies object or null */ },
  "approvalStatus": "PENDING",
  "createdBy": { /* user object */ },
  "approver": null,
  "approvalDate": null,
  "approvalComments": null,
  "createdAt": "2024-07-01T12:34:56.789Z",
  "updatedAt": "2024-07-01T12:34:56.789Z",
  "quantity": 1,
  "quotationFile": {
    "id": 12,
    "fileName": "1689876543210-123456789.pdf",
    "fileType": "application/pdf",
    "fileSize": 204800,
    "url": "/uploads/acquisition-files/1689876543210-123456789.pdf",
    "createdAt": "2024-07-01T12:34:56.789Z",
    "updatedAt": "2024-07-01T12:34:56.789Z",
    "description": "original-filename.pdf"
  }
}
```

---

## 3. Get All Acquisitions

**Endpoint:**  
`GET /acquisitions`

**Response Body:**
```json
[
  {
    "id": 101,
    "acquisitionType": "RENTAL",
    "itemType": "APARTMENT",
    "itemName": "Modern 2-bedroom apartment at 123 Main Street",
    "description": "2-bedroom apartment at 123 Main Street",
    "startDate": "2025-07-01T00:00:00.000Z",
    "endDate": "2026-06-30T00:00:00.000Z",
    "cost": 1200,
    "supplier": { /* supplier object */ },
    "team": { /* team object or null */ },
    "player": { /* player object or null */ },
    "staff": { /* staff object or null */ },
    "supplies": { /* supplies object or null */ },
    "approvalStatus": "PENDING",
    "createdBy": { /* user object */ },
    "approver": null,
    "approvalDate": null,
    "approvalComments": null,
    "createdAt": "2024-07-01T12:34:56.789Z",
    "updatedAt": "2024-07-01T12:34:56.789Z",
    "quantity": 1,
    "quotationFile": {
      "id": 12,
      "fileName": "1689876543210-123456789.pdf",
      "fileType": "application/pdf",
      "fileSize": 204800,
      "url": "/uploads/acquisition-files/1689876543210-123456789.pdf",
      "createdAt": "2024-07-01T12:34:56.789Z",
      "updatedAt": "2024-07-01T12:34:56.789Z",
      "description": "original-filename.pdf"
    }
  }
  // ... more acquisitions
]
```

---

## 4. Get Acquisition by ID

**Endpoint:**  
`GET /acquisitions/:id`

**Response Body:**  
Same as a single object in the "Get All Acquisitions" response above.

---

## 5. Update Acquisition

**Endpoint:**
`PUT /acquisitions/:id`

**Content-Type:** `application/json`

**Request Body:**
- Any subset of the fields from the Create Acquisition endpoint, including `quotationFileId`.

**Response Body:**
- Same as the Create Acquisition response.

---

## 6. Approve/Reject Acquisition

**Endpoint:**
`PUT /acquisitions/:id/approve`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "approvalStatus": "APPROVED", // or "REJECTED", "DELIVERED", etc.
  "approverId": 1,               // required
  "approvalComments": "string"   // optional
}
```

**Response Body:**
- Same as the Create Acquisition response.

---

## 7. Delete Acquisition

**Endpoint:**
`DELETE /acquisitions/:id`

**Response Body:**
- 204 No Content

---

## Types

### AcquisitionFile
```ts
export interface AcquisitionFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}
```

### Acquisition (updated)
```ts
export interface Acquisition {
  id: number;
  acquisitionType: AcquisitionType;
  itemType: ItemType;
  itemName: string;
  description: string;
  startDate?: string;
  endDate?: string;
  cost: number;
  supplier?: { id: number; name: string };
  team?: { id: number; name: string } | null;
  player?: { id: number; firstName: string; lastName: string } | null;
  staff?: { id: number; firstName: string; lastName: string } | null;
  supplies?: { id: number; name: string } | null;
  approvalStatus: ApprovalStatus;
  approvalDate?: string | null;
  approvalComments?: string;
  createdAt?: string;
  updatedAt?: string;
  supplierId: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
  createdBy: User;
  approver?: User | null;
  quotationFile?: AcquisitionFile | null;
}
```

### CreateAcquisitionDto (updated)
```ts
export interface CreateAcquisitionDto {
  acquisitionType: AcquisitionType;
  itemType: ItemType;
  itemName: string;
  description: string;
  startDate?: string;
  endDate?: string;
  cost: number;
  supplierId: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
  createdBy: number;
  quotationFileId?: number;
}
```

### UpdateAcquisitionDto (updated)
```ts
export interface UpdateAcquisitionDto {
  acquisitionType?: AcquisitionType;
  itemType?: ItemType;
  itemName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  cost?: number;
  supplierId?: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
  quotationFileId?: number;
}
```

---

For more details on approval, deletion, and other endpoints, see the code or ask for specifics.
