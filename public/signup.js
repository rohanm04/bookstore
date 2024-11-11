document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value;
    const middleName = document.getElementById('middle-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const contactNumber = document.getElementById('contact-number').value;
    const birthDate = document.getElementById('birth-date').value || null;

    const data = {
        firstName,
        middleName,
        lastName,
        email,
        contactNumber,
        birthDate
    };

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert(`Signup successful!\nPlease make note of your Customer ID: ${result.customerId}`);
            window.location.href = result.redirectUrl;
        } else {
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error('Error during signup:', err);
        alert('An error occurred. Please try again later.');
    }
});