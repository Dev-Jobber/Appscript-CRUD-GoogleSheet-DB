# User Management CRUD App

A simple web application that performs CRUD operations on user data using Google Sheets as the database and Google Apps Script as the backend API.

## Features

- ✅ Create new users
- ✅ Read and display all users
- ✅ Update existing users
- ✅ Soft delete users
- ✅ Modern, responsive UI
- ✅ Form validation
- ✅ Real-time updates
- ✅ Loading states
- ✅ Success/error messages

## Architecture

```
Frontend (HTML/CSS/JS) → Google Apps Script API → Google Sheets (Database)
```

## Project Structure

```
project/
├── index.html              # Frontend HTML structure
├── style.css              # CSS styling and responsive design
├── app.js                 # Frontend JavaScript logic
├── apps-script-backend.gs  # Google Apps Script backend
├── README.md              # This file
└── plan.txt               # Project planning document
```

## Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Rename the first sheet to `users`
4. Add the following headers in row 1:
   - A: `id`
   - B: `full_name`
   - C: `email`
   - D: `phone`
   - E: `role`
   - F: `status`
   - G: `created_at`
   - H: `updated_at`
   - I: `deleted_at`
   - J: `is_deleted`

### Step 2: Setup Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy the entire contents of `apps-script-backend.gs`
4. Paste it into the Apps Script editor
5. Save the project (Ctrl + S or click Save)

### Step 3: Deploy as Web App

1. In Apps Script, click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: User Management API
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone (for testing) or specific users
4. Click **Deploy**
5. **Important**: Copy the Web app URL - this is your `SCRIPT_URL`

### Step 4: Configure Frontend

1. Open `app.js`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your actual Web app URL from Step 3

```javascript
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    SHEET_NAME: 'users'
};
```

### Step 5: Test the Application

1. Open `index.html` in a web browser
2. Try adding a new user
3. Verify the data appears in your Google Sheet
4. Test edit and delete functionality

## Database Schema

The Google Sheet uses the following columns:

| Column | Name | Description |
|--------|------|-------------|
| A | id | Unique user ID (format: USR_000001) |
| B | full_name | User's full name |
| C | email | User's email address (unique) |
| D | phone | Phone number |
| E | role | User role (admin/user/manager) |
| F | status | Account status (active/inactive/blocked) |
| G | created_at | Creation timestamp |
| H | updated_at | Last update timestamp |
| I | deleted_at | Soft delete timestamp |
| J | is_deleted | Boolean flag for soft delete (TRUE/FALSE) |

## API Endpoints

The Apps Script backend supports the following actions:

### Create User
```javascript
POST {
    "action": "createUser",
    "data": {
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "role": "user",
        "status": "active"
    }
}
```

### Get All Users
```javascript
POST {
    "action": "getUsers"
}
```

### Get User by ID
```javascript
POST {
    "action": "getUserById",
    "data": {
        "id": "USR_000001"
    }
}
```

### Update User
```javascript
POST {
    "action": "updateUser",
    "data": {
        "id": "USR_000001",
        "full_name": "John Updated",
        "email": "john.updated@example.com",
        "phone": "0987654321",
        "role": "admin",
        "status": "active"
    }
}
```

### Delete User (Soft Delete)
```javascript
POST {
    "action": "deleteUser",
    "data": {
        "id": "USR_000001"
    }
}
```

## Features Explained

### Unique User IDs
- Automatically generated in format `USR_000001`, `USR_000002`, etc.
- Ensures no duplicate IDs

### Email Validation
- Frontend validates email format
- Backend prevents duplicate emails
- Returns error if email already exists

### Soft Delete
- Users are never permanently deleted
- `is_deleted` flag set to `TRUE`
- `deleted_at` timestamp recorded
- Deleted users don't appear in frontend

### Timestamps
- `created_at` set on user creation
- `updated_at` updated on any modification
- `deleted_at` set on soft delete

### Form Validation
- All fields are required
- Email format validation
- Phone number validation
- Role and status dropdown selection

### Responsive Design
- Works on desktop, tablet, and mobile
- Modern card-based layout
- Clean table design
- Status badges with colors

## Security Considerations

- The Web app URL should be kept private
- Consider restricting access to specific users
- Input validation on both frontend and backend
- XSS protection with HTML escaping

## Troubleshooting

### Common Issues

1. **"Sheet not found" error**
   - Make sure you have a sheet named exactly `users`
   - Run `initializeSheet()` function in Apps Script

2. **"Invalid action" error**
   - Check that the action name matches exactly
   - Verify the JSON structure is correct

3. **CORS errors**
   - Make sure the Apps Script is deployed as a Web app
   - Check that "Who has access" is set appropriately

4. **Data not appearing**
   - Check browser console for errors
   - Verify the SCRIPT_URL is correct
   - Check Apps Script execution logs

### Testing the Backend

You can test the Apps Script backend directly:

1. In Apps Script, run the `testSetup()` function
2. Check the execution logs for results
3. Verify data appears in your Google Sheet

## Future Enhancements

- Search/filter functionality
- Pagination for large datasets
- User authentication
- Export to CSV
- Bulk operations
- Audit trail
- Advanced validation rules

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Styling**: Modern CSS with flexbox/grid
- **Icons**: CSS-based (no external libraries)

## License

This project is open source and available under the MIT License.
