function logout() {
    fetch('/logout')
        .then(() => {
            window.location.href = '/';
        })
        .catch(err => console.error('Error logging out:', err));
}