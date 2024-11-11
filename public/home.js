document.addEventListener('DOMContentLoaded', async () => {
    const bookContainer = document.getElementById('book-container');

    try {
        const response = await fetch('/books');
        const books = await response.json();

        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.classList.add('book-card');

            bookCard.innerHTML = `
                <h2>${book.title}</h2>
                <p><strong>Author:</strong> ${book.author_name}</p>
                <p><strong>Genre:</strong> ${book.genre}</p>
                <p><strong>Price:</strong> &#8377;${book.price}</p>
                <p><strong>In Stock:</strong> ${book.stock_quantity}</p>
                <label for="quantity-${book.book_id}">Quantity:</label>
                <input type="number" id="quantity-${book.book_id}" min="1" max="${book.stock_quantity}" value="1">
                <button onclick="addToCart(${book.book_id})">Add to Cart</button>
            `;

            bookContainer.appendChild(bookCard);
        });
    } catch (err) {
        console.error('Error fetching books:', err);
    }
});

async function addToCart(bookId) {
    const quantityInput = document.getElementById(`quantity-${bookId}`);
    const quantity = parseInt(quantityInput.value);

    try {
        const response = await fetch('/add-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bookId, quantity })
        });

        const result = await response.json();
        if (result.success) {
            alert('Book added to cart successfully!');
            location.reload();
        } else {
            alert(result.message || 'Error adding to cart.');
        }
    } catch (err) {
        console.error('Error adding to cart:', err);
    }
}