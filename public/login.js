document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const customerId = document.getElementById('customer-id').value;
    const email = document.getElementById('email').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customerId, email })
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = result.redirectUrl;
        } else {
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error('Error during login:', err);
        alert('An error occurred. Please try again later.');
    }
})