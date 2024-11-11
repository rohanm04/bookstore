document.addEventListener('DOMContentLoaded', async () => {
    const cartContainer = document.getElementById('cart-container');
    const totalAmountElement = document.getElementById('total-amount');

    try {
        const response = await fetch('/cart-details');
        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Error loading cart');
            return;
        }

        const { cartBooks, totalAmount } = data;

        cartBooks.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.classList.add('cart-card');

            bookCard.innerHTML = `
                <h2>${book.title}</h2>
                <p><strong>Author:</strong> ${book.author_name}</p>
                <p><strong>Genre:</strong> ${book.genre}</p>
                <p><strong>Price:</strong> &#8377;${book.price}</p>
                <p><strong>In Stock:</strong> ${book.stock_quantity}</p>
                <label for="quantity-${book.book_id}">Quantity:</label>
                <input type="number" id="quantity-${book.book_id}" min="1" max="${book.stock_quantity}" value="${book.quantity}">
                <button onclick="updateQuantity(${book.book_id})">Update Quantity</button>
                <button onclick="removeFromCart(${book.book_id})">Remove</button>
            `;

            cartContainer.appendChild(bookCard);
        });

        totalAmountElement.textContent = totalAmount || '0';

    } catch (err) {
        console.error('Error loading cart:', err);
    }
});

async function updateQuantity(bookId) {
    const quantityInput = document.getElementById(`quantity-${bookId}`);
    const quantity = parseInt(quantityInput.value);

    try {
        const response = await fetch('/update-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, quantity })
        });

        const result = await response.json();
        if (result.success) {
            alert('Quantity updated!');
            location.reload();
        } else {
            alert(result.message || 'Error updating quantity.');
        }
    } catch (err) {
        console.error('Error updating quantity:', err);
    }
}

async function removeFromCart(bookId) {
    try {
        const response = await fetch('/remove-from-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId })
        });

        const result = await response.json();
        if (result.success) {
            alert('Book removed from cart!');
            location.reload();
        } else {
            alert(result.message || 'Error removing book from cart.');
        }
    } catch (err) {
        console.error('Error removing book from cart:', err);
    }
}