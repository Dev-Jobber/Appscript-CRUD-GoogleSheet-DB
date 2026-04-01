// Google Apps Script Backend for User Management CRUD App
// Deploy this as a Web App to get your SCRIPT_URL

// Configuration
const SHEET_NAME = 'users';
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Main function to handle all API requests
function doPost(e) {
  try {
    // Parse the incoming data
    // Since we send as 'text/plain' from JS, we parse e.postData.contents
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const params = data.data || {};
    
    let result;
    
    switch (action) {
      case 'createUser': result = createUser(params); break;
      case 'getUsers': result = getUsers(); break;
      case 'getUserById': result = getUserById(params.id); break;
      case 'updateUser': result = updateUser(params); break;
      case 'deleteUser': result = deleteUser(params.id); break;
      default:
        result = { status: 'error', message: 'Invalid action: ' + action };
    }
    
    // Simply return the TextOutput. 
    // Google will automatically add the necessary CORS headers.
    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
            
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Keep your doGet, but remove the .addHeader lines
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid GET request. Use POST.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Handle GET requests (optional for testing)
function doGet(e) {
    const action = e.parameter.action;
    
    const output = ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid GET request. Use POST with action parameter.'
    })).setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers
    output.addHeader('Access-Control-Allow-Origin', '*');
    output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return output;
}

// Initialize the spreadsheet structure
function initializeSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (!sheet) {
        // Create the sheet if it doesn't exist
        const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
        
        // Set up headers
        const headers = [
            'id',
            'full_name',
            'email',
            'phone',
            'role',
            'status',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_deleted'
        ];
        
        newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        
        // Format the header row
        newSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
            .setBackground('#f0f0f0').setWrap(true);
        
        // Auto-resize columns
        newSheet.autoResizeColumns(1, headers.length);
        
        return newSheet;
    }
    
    return sheet;
}

// Generate unique user ID
function generateUserId() {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the highest existing ID
    let maxId = 0;
    for (let i = 1; i < data.length; i++) { // Skip header row
        const id = data[i][0];
        if (id && typeof id === 'string') {
            const numPart = id.replace('USR_', '');
            const num = parseInt(numPart);
            if (!isNaN(num) && num > maxId) {
                maxId = num;
            }
        }
    }
    
    // Generate new ID
    const newId = maxId + 1;
    return 'USR_' + String(newId).padStart(6, '0');
}

// Get sheet reference
function getSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
        throw new Error('Sheet "' + SHEET_NAME + '" not found. Please run initializeSheet() first.');
    }
    return sheet;
}

// Create User
function createUser(userData) {
    try {
        const sheet = getSheet();
        
        // Validate required fields
        if (!userData.full_name || !userData.email || !userData.phone || !userData.role || !userData.status) {
            return {
                status: 'error',
                message: 'Missing required fields'
            };
        }
        
        // Check for duplicate email
        const existingUser = findUserByEmail(userData.email);
        if (existingUser) {
            return {
                status: 'error',
                message: 'Email already exists'
            };
        }
        
        // Generate user ID
        const userId = generateUserId();
        
        // Get current timestamp
        const now = new Date().toISOString();
        
        // Create new row
        const newRow = [
            userId,
            userData.full_name,
            userData.email,
            userData.phone,
            userData.role,
            userData.status,
            now, // created_at
            now, // updated_at
            '',  // deleted_at
            'FALSE' // is_deleted
        ];
        
        // Append to sheet
        sheet.appendRow(newRow);
        
        // Auto-resize columns
        sheet.autoResizeColumns(1, 10);
        
        return {
            status: 'success',
            message: 'User created successfully',
            data: {
                id: userId,
                full_name: userData.full_name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                status: userData.status,
                created_at: now
            }
        };
        
    } catch (error) {
        Logger.log('Error in createUser: ' + error.toString());
        return {
            status: 'error',
            message: error.toString()
        };
    }
}

// Get All Users
function getUsers() {
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        const users = [];
        
        // Skip header row and filter non-deleted users
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const isDeleted = row[9] === 'TRUE' || row[9] === true;
            
            if (!isDeleted) {
                users.push({
                    id: row[0],
                    full_name: row[1],
                    email: row[2],
                    phone: row[3],
                    role: row[4],
                    status: row[5],
                    created_at: row[6],
                    updated_at: row[7]
                });
            }
        }
        
        return {
            status: 'success',
            data: users
        };
        
    } catch (error) {
        Logger.log('Error in getUsers: ' + error.toString());
        return {
            status: 'error',
            message: error.toString(),
            data: []
        };
    }
}

// Get User by ID
function getUserById(userId) {
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[0] === userId && row[9] !== 'TRUE' && row[9] !== true) {
                return {
                    status: 'success',
                    data: {
                        id: row[0],
                        full_name: row[1],
                        email: row[2],
                        phone: row[3],
                        role: row[4],
                        status: row[5],
                        created_at: row[6],
                        updated_at: row[7]
                    }
                };
            }
        }
        
        return {
            status: 'error',
            message: 'User not found'
        };
        
    } catch (error) {
        Logger.log('Error in getUserById: ' + error.toString());
        return {
            status: 'error',
            message: error.toString()
        };
    }
}

// Update User
function updateUser(userData) {
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        
        if (!userData.id) {
            return {
                status: 'error',
                message: 'User ID is required'
            };
        }
        
        // Validate required fields
        if (!userData.full_name || !userData.email || !userData.phone || !userData.role || !userData.status) {
            return {
                status: 'error',
                message: 'Missing required fields'
            };
        }
        
        // Find the user row
        let userRow = -1;
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === userData.id && data[i][9] !== 'TRUE' && data[i][9] !== true) {
                userRow = i + 1; // +1 for sheet row number (1-indexed)
                break;
            }
        }
        
        if (userRow === -1) {
            return {
                status: 'error',
                message: 'User not found'
            };
        }
        
        // Check for duplicate email (excluding current user)
        const existingUser = findUserByEmail(userData.email, userData.id);
        if (existingUser) {
            return {
                status: 'error',
                message: 'Email already exists'
            };
        }
        
        // Get current timestamp
        const now = new Date().toISOString();
        
        // Update the row
        sheet.getRange(userRow, 1, 1, 10).setValues([[
            userData.id,
            userData.full_name,
            userData.email,
            userData.phone,
            userData.role,
            userData.status,
            data[userRow - 1][6], // Keep original created_at
            now, // updated_at
            '',  // deleted_at
            'FALSE' // is_deleted
        ]]);
        
        return {
            status: 'success',
            message: 'User updated successfully',
            data: {
                id: userData.id,
                full_name: userData.full_name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                status: userData.status,
                updated_at: now
            }
        };
        
    } catch (error) {
        Logger.log('Error in updateUser: ' + error.toString());
        return {
            status: 'error',
            message: error.toString()
        };
    }
}

// Delete User (Soft Delete)
function deleteUser(userId) {
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        
        if (!userId) {
            return {
                status: 'error',
                message: 'User ID is required'
            };
        }
        
        // Find the user row
        let userRow = -1;
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === userId && data[i][9] !== 'TRUE' && data[i][9] !== true) {
                userRow = i + 1; // +1 for sheet row number (1-indexed)
                break;
            }
        }
        
        if (userRow === -1) {
            return {
                status: 'error',
                message: 'User not found'
            };
        }
        
        // Get current timestamp
        const now = new Date().toISOString();
        
        // Soft delete by marking as deleted
        sheet.getRange(userRow, 9, 1, 2).setValues([[
            now,    // deleted_at
            'TRUE'  // is_deleted
        ]]);
        
        return {
            status: 'success',
            message: 'User deleted successfully'
        };
        
    } catch (error) {
        Logger.log('Error in deleteUser: ' + error.toString());
        return {
            status: 'error',
            message: error.toString()
        };
    }
}

// Helper function to find user by email
function findUserByEmail(email, excludeId = null) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const isDeleted = row[9] === 'TRUE' || row[9] === true;
        
        if (!isDeleted && row[2] === email) {
            if (excludeId && row[0] === excludeId) {
                continue; // Skip the excluded user (for update operations)
            }
            return row[0]; // Return user ID
        }
    }
    
    return null;
}

// Test function (run this to test the setup)
function testSetup() {
    try {
        // Initialize sheet
        const sheet = initializeSheet();
        
        // Test creating a user
        const testUser = {
            full_name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            role: 'user',
            status: 'active'
        };
        
        const result = createUser(testUser);
        Logger.log('Test user creation result: ' + JSON.stringify(result));
        
        // Test getting users
        const usersResult = getUsers();
        Logger.log('Get users result: ' + JSON.stringify(usersResult));
        
        return 'Setup test completed. Check logs for results.';
        
    } catch (error) {
        Logger.log('Test setup error: ' + error.toString());
        return 'Test setup failed: ' + error.toString();
    }
}
