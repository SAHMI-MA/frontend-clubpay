Here’s a concise documentation for utilizing your HR Management, Salary Payment, Absence & Leave, and Employee File Management endpoints:

---

## 1. **Employee Management**

### **List all employees**
- **GET** `/hr/employees`
- **Response:** Array of employee objects (with user, department, position, contracts).

### **Get single employee**
- **GET** `/hr/employees/:id`
- **Response:** Employee object (with all relations).

### **Create employee**
- **POST** `/hr/employees`
- **Body:**
  ```json
  {
    "userId": 1,
    "departmentId": 1,
    "positionId": 1,
    "employeeId": "HR12345",
    "hireDate": "2025-07-10",
    "dateOfBirth": "1990-01-01",
    "nationalId": "EA123456",
    "status": "Active",
    "phoneNumber": "123-456-7890",
    "personalEmail": "john@personal.com",
    "address": "123 Main St",
    "maritalStatus": "Single",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "987-654-3210",
    "emergencyContactRelationship": "Spouse",
    "bankAccountNumber": "123456789",
    "bankName": "BMCE",
    "notes": "string"
  }
  ```

### **Update employee**
- **PATCH** `/hr/employees/:id`
- **Body:** (any updatable fields, e.g. status, departmentId, etc.)

### **Delete employee**
- **DELETE** `/hr/employees/:id`

---

## 2. **Salary Payment Management**

### **List all salary payments**
- **GET** `/hr/salary-payments`

### **Create salary payment**
- **POST** `/hr/salary-payments`
- **Body:**
  ```json
  {
    "employeeId": "EMP001",
    "payPeriod": "December 2024",
    "baseSalary": 5000,
    "overtime": 500,
    "bonuses": 1000,
    "paymentMethod": "Bank Transfer",
    "status": "pending"
  }
  ```

### **Update salary payment**
- **PATCH** `/hr/salary-payments/:id`
- **Body:** (e.g. `{ "status": "processed" }`)

### **Delete salary payment**
- **DELETE** `/hr/salary-payments/:id`

---

## 3. **Absence & Leave Management**

### **List all leave requests**
- **GET** `/hr/leaves`

### **Create leave request**
- **POST** `/hr/leaves`
- **Body:**
  ```json
  {
    "employeeId": 1,
    "leaveType": "VACATION",
    "startDate": "2024-12-20",
    "endDate": "2024-12-30",
    "reason": "Christmas vacation"
  }
  ```

### **Update leave request**
- **PATCH** `/hr/leaves/:id`
- **Body:** (e.g. `{ "status": "APPROVED", "approverComments": "Enjoy your leave" }`)

### **Delete leave request**
- **DELETE** `/hr/leaves/:id`

---

## 4. **Employee File Management**

### **List all files**
- **GET** `/hr/employee-files`

### **Upload a file**
- **POST** `/hr/employee-files/upload`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file` (file to upload)
  - `employeeId` (string)
  - `category` (string)
  - `expiryDate` (optional, string, date)
  - `status` (optional, "active" | "archived" | "expired")

### **Download a file**
- **GET** `/hr/employee-files/download/:filename`
- **Response:** File download

### **Create file metadata (no upload)**
- **POST** `/hr/employee-files`
- **Body:** (same as CreateEmployeeFileDto, but you must provide a fileName and fileType manually)

### **Update file metadata**
- **PATCH** `/hr/employee-files/:id`
- **Body:** (e.g. `{ "status": "archived" }`)

### **Delete file**
- **DELETE** `/hr/employee-files/:id`

---

## **General Notes**
- All endpoints return standard HTTP status codes and error messages.
- For file upload, use `multipart/form-data` and provide the file in the `file` field.
- For file download, use the filename as stored in the database (get it from `/hr/employee-files`).

---

Let me know if you want OpenAPI/Swagger YAML/JSON, or more details for any endpoint!