// Simple test to verify document upload functionality works
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Create a test image file
const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const testImagePath = '/tmp/test-image.png';
fs.writeFileSync(testImagePath, testImageContent);

async function testUpload() {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(testImagePath), 'test-image.png');
        form.append('chantierId', 'test-chantier-id');
        form.append('dossier', 'Photos');
        form.append('tags', 'test');

        const response = await fetch('http://localhost:3000/api/documents', {
            method: 'POST',
            body: form,
            headers: {
                // Note: FormData sets Content-Type automatically with boundary
                ...form.getHeaders(),
                // Add session cookie if needed for authentication
                'Cookie': 'next-auth.session-token=test-session'
            }
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Upload successful:', result);
            
            // Check if file was saved
            const expectedPath = path.join(process.cwd(), 'public', 'uploads', result.nom);
            if (fs.existsSync(expectedPath)) {
                console.log('✅ File saved to disk successfully');
            } else {
                console.log('❌ File not found on disk');
            }
        } else {
            console.log('❌ Upload failed:', response.status, result);
        }
    } catch (error) {
        console.error('❌ Error during test:', error.message);
    } finally {
        // Cleanup test file
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
    }
}

console.log('🧪 Testing document upload functionality...');
testUpload();