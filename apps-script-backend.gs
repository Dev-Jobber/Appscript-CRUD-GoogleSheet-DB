// Google Apps Script Backend for User Management CRUD App
// Fully Logged Version

// Configuration
const SHEET_NAME = 'users';
const SPREADSHEET_ID = '1-7je3BMj0nGr0XdytLeZk9LZxX7I6Vo8F-9_AdUPKOk'; // Your exact Sheet ID

// Main function to handle all API requests
function doPost(e) {
  console.log('=== doPost Execution Started ===');
  
  try {
    // 1. Check if payload exists
    if (!e || !e.postData || !e.postData.contents) {
      console.error('No POST data received in request');
      throw new Error('No POST data received');
    }

    // 2. Parse payload
    console.log('Raw payload received: ', e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const params = data.data || {};
    
    console.log(`Action requested: [${action}]`);
    console.log('Parameters passed: ', JSON.stringify(params));
    
    let result;
    
    // 3. Route to specific CRUD function
    switch (action) {
      case 'createUser': result = createUser(params); break;
      case 'getUsers': result = getUsers(); break;
      case 'getUserById': result = getUserById(params.id); break;
      case 'updateUser': result = updateUser(params); break;
      case 'deleteUser': result = deleteUser(params.id); break;
      default:
        console.warn(`Invalid action requested: ${action}`);
        result = { status: 'error', message: 'Invalid action: ' + action };
    }
    
    // 4. Return successful response
    console.log('Operation completed. Final Result: ', JSON.stringify(result));
    console.log('=== doPost Execution Finished Successfully ===');
    
    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
            
  } catch (error) {
    // 5. Catch and log major errors
    console.error('FATAL ERROR in doPost: ', error.toString());
    console.error('Stack Trace: ', error.stack);
    
    return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (optional for testing)
function doGet(e) {
  console.log('doGet triggered, returning warning message.');
  return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid GET request. Use POST with action parameter.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Initialize the spreadsheet structure
function initializeSheet() {
    console.log(`Initializing sheet:[${SHEET_NAME}] in Spreadsheet: [${SPREADSHEET_ID}]`);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
        console.log(`Sheet [${SHEET_NAME}] not found. Creating a new one...`);
        sheet = ss.insertSheet(SHEET_NAME);
        
        const headers =[
            'id', 'full_name', 'email', 'phone', 'role', 
            'status', 'created_at', 'updated_at', 'deleted_at', 'is_deleted'
        ];
        
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
             .setBackground('#f0f0f0').setWrap(true);
        sheet.autoResizeColumns(1, headers.length);
        console.log('New sheet created and headers formatted.');
    } else {
        console.log(`Sheet [${SHEET_NAME}] already exists.`);
    }
    
    return sheet;
}

// Get sheet reference safely
function getSheet() {
    console.log(`Fetching reference to sheet: [${SHEET_NAME}]`);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        console.error(`Sheet [${SHEET_NAME}] not found! Need to run initializeSheet()`);
        throw new Error('Sheet "' + SHEET_NAME + '" not found. Please run initializeSheet() first.');
    }
    return sheet;
}

// Generate unique user ID
function generateUserId() {
    console.log('Generating new user ID...');
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    let maxId = 0;
    for (let i = 1; i < data.length; i++) {
        const id = data[i][0];
        if (id && typeof id === 'string') {
            const numPart = id.replace('USR_', '');
            const num = parseInt(numPart);
            if (!isNaN(num) && num > maxId) {
                maxId = num;
            }
        }
    }
    
    const newId = 'USR_' + String(maxId + 1).padStart(6, '0');
    console.log(`Highest existing ID was ${maxId}. Generated new ID: ${newId}`);
    return newId;
}

// Create User
function createUser(userData) {
    console.log('Starting createUser logic with data: ', JSON.stringify(userData));
    try {
        const sheet = getSheet();
        
        if (!userData.full_name || !userData.email || !userData.phone || !userData.role || !userData.status) {
            console.warn('createUser aborted: Missing required fields.');
            return { status: 'error', message: 'Missing required fields' };
        }
        
        const existingUser = findUserByEmail(userData.email);
        if (existingUser) {
            console.warn(`createUser aborted: Email ${userData.email} already exists for user ${existingUser}.`);
            return { status: 'error', message: 'Email already exists' };
        }
        
        const userId = generateUserId();
        const now = new Date().toISOString();
        
        const newRow =[
            userId, userData.full_name, userData.email, userData.phone,
            userData.role, userData.status, now, now, '', 'FALSE'
        ];
        
        console.log(`Appending new row to sheet for user: ${userId}`);
        sheet.appendRow(newRow);
        
        return {
            status: 'success',
            message: 'User created successfully',
            data: {
                id: userId, full_name: userData.full_name, email: userData.email,
                phone: userData.phone, role: userData.role, status: userData.status, created_at: now
            }
        };
        
    } catch (error) {
        console.error('Error in createUser: ', error.toString());
        return { status: 'error', message: error.toString() };
    }
}

// Get All Users
function getUsers() {
    console.log('Starting getUsers logic...');
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        const users =[];
        
        console.log(`Fetched ${data.length} total rows from sheet.`);
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const isDeleted = row[9] === 'TRUE' || row[9] === true;
            
            if (!isDeleted) {
                users.push({
                    id: row[0], full_name: row[1], email: row[2],
                    phone: row[3], role: row[4], status: row[5],
                    created_at: row[6], updated_at: row[7]
                });
            }
        }
        
        console.log(`Filtered out deleted users. Returning ${users.length} active users.`);
        return { status: 'success', data: users };
        
    } catch (error) {
        console.error('Error in getUsers: ', error.toString());
        return { status: 'error', message: error.toString(), data:[] };
    }
}

// Get User by ID
function getUserById(userId) {
    console.log(`Starting getUserById logic for ID: ${userId}`);
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[0] === userId && row[9] !== 'TRUE' && row[9] !== true) {
                console.log(`User found at row ${i + 1}`);
                return {
                    status: 'success',
                    data: {
                        id: row[0], full_name: row[1], email: row[2],
                        phone: row[3], role: row[4], status: row[5],
                        created_at: row[6], updated_at: row[7]
                    }
                };
            }
        }
        
        console.warn(`User ID ${userId} not found or is marked as deleted.`);
        return { status: 'error', message: 'User not found' };
        
    } catch (error) {
        console.error('Error in getUserById: ', error.toString());
        return { status: 'error', message: error.toString() };
    }
}

// Update User
function updateUser(userData) {
    console.log(`Starting updateUser logic for ID: ${userData.id}`);
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        
        if (!userData.id) {
            console.warn('updateUser aborted: No user ID provided.');
            return { status: 'error', message: 'User ID is required' };
        }
        if (!userData.full_name || !userData.email || !userData.phone || !userData.role || !userData.status) {
            console.warn('updateUser aborted: Missing required fields.');
            return { status: 'error', message: 'Missing required fields' };
        }
        
        let userRow = -1;
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === userData.id && data[i][9] !== 'TRUE' && data[i][9] !== true) {
                userRow = i + 1; // 1-indexed for Sheets API
                break;
            }
        }
        
        if (userRow === -1) {
            console.warn(`updateUser aborted: User ID ${userData.id} not found in sheet.`);
            return { status: 'error', message: 'User not found' };
        }
        
        const existingUser = findUserByEmail(userData.email, userData.id);
        if (existingUser) {
            console.warn(`updateUser aborted: Email ${userData.email} is already taken by user ${existingUser}.`);
            return { status: 'error', message: 'Email already exists' };
        }
        
        const now = new Date().toISOString();
        
        console.log(`Updating row ${userRow} with new user data.`);
        sheet.getRange(userRow, 1, 1, 10).setValues([[
            userData.id, userData.full_name, userData.email, userData.phone,
            userData.role, userData.status, data[userRow - 1][6], // retain created_at
            now, '', 'FALSE'
        ]]);
        
        return {
            status: 'success',
            message: 'User updated successfully',
            data: {
                id: userData.id, full_name: userData.full_name, email: userData.email,
                phone: userData.phone, role: userData.role, status: userData.status, updated_at: now
            }
        };
        
    } catch (error) {
        console.error('Error in updateUser: ', error.toString());
        return { status: 'error', message: error.toString() };
    }
}

// Delete User (Soft Delete)
function deleteUser(userId) {
    console.log(`Starting deleteUser (soft delete) logic for ID: ${userId}`);
    try {
        const sheet = getSheet();
        const data = sheet.getDataRange().getValues();
        
        if (!userId) {
            console.warn('deleteUser aborted: User ID is required.');
            return { status: 'error', message: 'User ID is required' };
        }
        
        let userRow = -1;
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === userId && data[i][9] !== 'TRUE' && data[i][9] !== true) {
                userRow = i + 1; // 1-indexed for Sheets API
                break;
            }
        }
        
        if (userRow === -1) {
            console.warn(`deleteUser aborted: User ID ${userId} not found.`);
            return { status: 'error', message: 'User not found' };
        }
        
        const now = new Date().toISOString();
        
        console.log(`Marking row ${userRow} as deleted...`);
        // Soft delete by marking as deleted
        sheet.getRange(userRow, 9, 1, 2).setValues([[ now, 'TRUE' ]]);
        
        console.log(`User ${userId} successfully soft deleted.`);
        return { status: 'success', message: 'User deleted successfully' };
        
    } catch (error) {
        console.error('Error in deleteUser: ', error.toString());
        return { status: 'error', message: error.toString() };
    }
}

// Helper function to find user by email
function findUserByEmail(email, excludeId = null) {
    console.log(`Checking if email [${email}] already exists (excluding ID: ${excludeId})...`);
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const isDeleted = row[9] === 'TRUE' || row[9] === true;
        
        if (!isDeleted && row[2] === email) {
            if (excludeId && row[0] === excludeId) {
                continue; 
            }
            console.log(`Email conflict found! Belong to user: ${row[0]}`);
            return row[0]; // Return conflicting user ID
        }
    }
    
    console.log(`No email conflict found for [${email}].`);
    return null;
}

// Test function (run this to test the setup from the Editor)
function testSetup() {
    console.log('=== TEST SETUP STARTED ===');
    try {
        const sheet = initializeSheet();
        console.log('Sheet initialized successfully.');
        
        const testUser = {
            full_name: 'Test User', email: 'test@example.com',
            phone: '1234567890', role: 'user', status: 'active'
        };
        
        console.log('Attempting to create a test user...');
        const result = createUser(testUser);
        console.log('Creation Result: ', JSON.stringify(result));
        
        console.log('Attempting to fetch users...');
        const usersResult = getUsers();
        console.log('Fetch Result: ', JSON.stringify(usersResult));
        
        console.log('=== TEST SETUP COMPLETED SUCCESSFULLY ===');
        return 'Setup test completed. Check logs for results.';
        
    } catch (error) {
        console.error('Test setup FATAL ERROR: ', error.toString());
        return 'Test setup failed: ' + error.toString();
    }
}