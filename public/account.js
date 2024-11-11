document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/account-details');
        const { success, accountInfo } = await response.json();

        if (success) {
            document.getElementById('customerId').innerText = accountInfo.customerId;
            document.getElementById('customerName').innerText = [accountInfo.firstName, accountInfo.middleName, accountInfo.lastName].filter(Boolean).join(' ');
            document.getElementById('email').value = accountInfo.email;
            document.getElementById('contact').value = accountInfo.contactNumber;
            document.getElementById('birthDate').value = accountInfo.birthDate;
        }
    } catch (err) {
        console.error('Error fetching account info:', err);
    }
});

async function updateAccount() {
    const email = document.getElementById('email').value;
    const contact = document.getElementById('contact').value;
    const birthDate = document.getElementById('birthDate').value;

    try {
        const response = await fetch('/account-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, contact, birthDate })
        });

        const result = await response.json();
        alert(result.message);
        location.reload();
    } catch (err) {
        console.error('Error updating account:', err);
    }
}

async function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        try {
            const response = await fetch('/account-delete', { method: 'DELETE' });
            const result = await response.json();
            alert(result.message);
            if (result.success) window.location.href = '/';
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    }
}