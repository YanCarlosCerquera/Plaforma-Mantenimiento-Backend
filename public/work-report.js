document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const resultSection = document.getElementById('resultSection');

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const fileInput = document.getElementById('document');
        const orderIdInput = document.getElementById('orderId');
        
        if (!fileInput.files[0]) {
            alert('Please select a file');
            return;
        }

       // Modificación en work-report.js
const formData = new FormData();
formData.append('file', fileInput.files[0]);
// Ya no necesitamos append orderId aquí porque va en la URL

try {
    // Validar que el orderId sea un formato válido de MongoDB (24 caracteres hexadecimales)
    const orderId = orderIdInput.value.trim();
    if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
        throw new Error('Invalid Order ID format. Must be a valid MongoDB ObjectId');
    }

    const response = await fetch(`http://localhost:3001/work-report/upload-pdf/${orderId}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    displayResults(data);
} catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Failed to upload and process the document. Please try again.');
}
    });

    function displayResults(data) {
        // Display the result section
        resultSection.classList.remove('hidden');

        // Fill in the form fields with the extracted data
        document.getElementById('costs').value = data.costs || '';
        document.getElementById('hours').value = data.hours || '';
        document.getElementById('responses').value = data.responses || '';
        document.getElementById('observation').value = data.observation || '';
        document.getElementById('workDone').value = data.workDone || '';
        document.getElementById('status').value = data.status ? 'Completed' : 'Pending';
    }
});
