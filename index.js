const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 3000;

const dbConfig = {
    user: 'C##general',
    password: 'general',
    connectString: 'localhost:1521/XE'
};

app.use(session({
    secret: '12345678',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.post('/login', async (req, res) => {
    const { customerId, email } = req.body;

    if (!customerId || !email) {
        return res.json({ success: false, message: 'Please provide both Customer ID and Email.' });
    }

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT CartID FROM Customer WHERE CustomerID = :customerId AND Email = :email`,
            [customerId, email]
        );

        if (result.rows.length > 0) {
            const cartId = result.rows[0][0];
            req.session.cartId = cartId;
            res.json({ success: true, redirectUrl: '/home' });
        } else {
            res.json({ success: false, message: 'Invalid Customer ID or Email.' });
        }

        await connection.close();
    } catch (err) {
        res.json({ success: false, message: 'Error verifying user.' });
    }
});

app.post('/signup', async (req, res) => {
    const { firstName, middleName, lastName, email, contactNumber, birthDate } = req.body;

    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const emailCheckResult = await connection.execute(
            `SELECT COUNT(*) FROM Customer WHERE Email = :email`, [email]
        );
        const emailExists = emailCheckResult.rows[0][0] > 0;

        if (emailExists) {
            return res.json({
                success: false,
                message: 'An account with this email already exists. Please log in.'
            });
        }

        const customerResult = await connection.execute(
            `SELECT customer_id_seq.NEXTVAL AS customer_id FROM dual`
        );
        const customerId = customerResult.rows[0][0];

        await connection.execute(
            `INSERT INTO CartAmount VALUES (:customerId, 0)`,
            [customerId],
            { autoCommit: true }
        );

        await connection.execute(
            `INSERT INTO Customer VALUES (:customerId, :firstName, :middleName, :lastName, :email, :contactNumber, TO_DATE(:birthDate, 'YYYY-MM-DD'), :customerId)`,
            [customerId, firstName, middleName, lastName, email, contactNumber, birthDate, customerId],
            { autoCommit: true }
        );

        req.session.cartId = customerId;

        res.json({
            success: true,
            customerId: customerId,
            redirectUrl: '/home'
        });
    } catch (err) {
        res.json({ success: false, message: 'Error during signup process.' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/logout', (req, res) => {
    delete req.session.cartId;
    res.json({ success: true });
});

app.get('/books', async (req, res) => {
    try {
        const connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `SELECT Book.BookID, Book.Title, Author.AuthFirstName, Author.AuthMidName, Author.AuthLastName, Book.Genre, Book.Price, Book.StockQuantity 
             FROM Book 
             JOIN Author ON Book.AuthorID = Author.AuthorID`
        );

        const books = result.rows.map(row => ({
            book_id: row[0],
            title: row[1],
            author_name: [
                row[2],
                row[3] || '',
                row[4] || ''
            ].filter(Boolean).join(' '),
            genre: row[5],
            price: row[6],
            stock_quantity: row[7]
        }));

        res.json(books);
        await connection.close();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching books.' });
    }
});

app.post('/add-to-cart', async (req, res) => {
    const { bookId, quantity } = req.body;
    const userCartId = req.session.cartId;

    if (!userCartId) {
        return res.status(400).json({ success: false, message: 'Please login.' });
    }

    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT StockQuantity, Price FROM Book WHERE BookID = :bookId`, [bookId]
        );
        const [stockQuantity, pricePerUnit] = result.rows[0];

        if (quantity > stockQuantity) {
            return res.json({ success: false, message: 'Insufficient stock.' });
        }

        await connection.execute(
            `UPDATE Book SET StockQuantity = StockQuantity - :quantity WHERE BookID = :bookId`,
            [quantity, bookId],
            { autoCommit: false }
        );
        await connection.execute(
            `INSERT INTO Cart VALUES (:cartId, :bookId, :quantity)`,
            [userCartId, bookId, quantity],
            { autoCommit: false }
        );

        const totalCost = pricePerUnit * quantity;

        await connection.execute(
            `UPDATE CartAmount SET TotalAmount = TotalAmount + :totalCost WHERE CartID = :cartId`,
            [totalCost, userCartId],
            { autoCommit: true }
        );

        res.json({ success: true });
        await connection.close();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding to cart.' });
    }
});

app.get('/cart-details', async (req, res) => {
    const userCartId = req.session.cartId;

    if (!userCartId) {
        return res.status(400).json({ success: false, message: 'Please login.' });
    }

    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT B.BookID, B.Title, B.AuthorID, B.Genre, B.Price, B.StockQuantity, C.Quantity
             FROM Cart C
             JOIN Book B ON C.BookID = B.BookID
             WHERE C.CartID = :cartId`, [userCartId]
        );

        const cartBooks = result.rows.map(row => ({
            book_id: row[0],
            title: row[1],
            author_id: row[2],
            genre: row[3],
            price: row[4],
            stock_quantity: row[5],
            quantity: row[6]
        }));

        const amountResult = await connection.execute(
            `SELECT TotalAmount FROM CartAmount WHERE CartID = :cartId`, [userCartId]
        );
        const totalAmount = amountResult.rows.length > 0 ? amountResult.rows[0][0] : 0;

        for (let book of cartBooks) {
            const authorResult = await connection.execute(
                `SELECT AuthFirstName, AuthMidName, AuthLastName FROM Author WHERE AuthorID = :authorId`, [book.author_id]
            );
            book.author_name = [authorResult.rows[0][0], authorResult.rows[0][1] || '', authorResult.rows[0][2] || ''].filter(Boolean).join(' ');
        }

        res.json({success: true, cartBooks, totalAmount});
        await connection.close();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching cart.' });
    }
});

app.post('/update-cart', async (req, res) => {
    const { bookId, quantity } = req.body;
    const { cartId } = req.session;

    if (!cartId) {
        return res.status(400).json({ success: false, message: 'Please login.' });
    }

    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const stockResult = await connection.execute(
            `SELECT StockQuantity FROM Book WHERE BookID = :bookId`, [bookId]
        );
        const stockQuantity = stockResult.rows[0][0];

        const currQuantityResult = await connection.execute(
            `SELECT Quantity FROM Cart WHERE CartID = :cartId AND BookID = :bookId`, [cartId, bookId]
        );
        const currQuantity = currQuantityResult.rows[0][0];

        if (quantity > stockQuantity + currQuantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock.' });
        }

        const newStock = stockQuantity + (currQuantity - quantity);

        await connection.execute(
            `UPDATE Cart SET Quantity = :quantity WHERE CartID = :cartId AND BookID = :bookId`,
            [quantity, cartId, bookId],
            { autoCommit: true }
        );

        await connection.execute(
            `UPDATE Book SET StockQuantity = :newStock WHERE BookID = :bookId`,
            [newStock, bookId],
            { autoCommit: true }
        );

        const totalAmountResult = await connection.execute(
            `SELECT NVL(SUM(B.Price * C.Quantity), 0) FROM Cart C JOIN Book B ON C.BookID = B.BookID WHERE C.CartID = :cartId`,
            [cartId]
        );
        const totalAmount = totalAmountResult.rows[0][0];

        await connection.execute(
            `UPDATE CartAmount SET TotalAmount = :totalAmount WHERE CartID = :cartId`,
            [totalAmount, cartId],
            { autoCommit: true }
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating quantity.' });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.post('/remove-from-cart', async (req, res) => {
    const { bookId } = req.body;
    const { cartId } = req.session;

    if (!cartId) {
        return res.status(400).json({ success: false, message: 'Please login.' });
    }

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const quantityResult = await connection.execute(
            `SELECT Quantity FROM Cart WHERE CartID = :cartId AND BookID = :bookId`, 
            [cartId, bookId]
        );
        const quantity = quantityResult.rows[0][0];

        await connection.execute(
            `UPDATE Book SET StockQuantity = StockQuantity + :quantity WHERE BookID = :bookId`,
            [quantity, bookId],
            { autoCommit: true }
        );

        await connection.execute(
            `DELETE FROM Cart WHERE CartID = :cartId AND BookID = :bookId`,
            [cartId, bookId],
            { autoCommit: true }
        );

        const totalAmountResult = await connection.execute(
            `SELECT NVL(SUM(B.Price * C.Quantity), 0) FROM Cart C JOIN Book B ON C.BookID = B.BookID WHERE C.CartID = :cartId`,
            [cartId]
        );
        const totalAmount = totalAmountResult.rows[0][0];
        await connection.execute(
            `UPDATE CartAmount SET TotalAmount = :totalAmount WHERE CartID = :cartId`,
            [totalAmount, cartId],
            { autoCommit: true }
        );

        res.json({ success: true });
        await connection.close();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error removing book from cart.' });
    }
});

app.get('/account-details', async (req, res) => {
    const { cartId } = req.session;

    if (!cartId) return res.status(400).json({ success: false, message: 'Please Login.' });

    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT CustomerID, CustFirstName, CustMidName, CustLastName, Email, Contact, TO_CHAR(BirthDate, 'YYYY-MM-DD') AS BirthDate
             FROM Customer WHERE CustomerID = :customerId`,
            [cartId]
        );

        const accountInfo = result.rows.length ? {
            customerId: result.rows[0][0],
            firstName: result.rows[0][1],
            middleName: result.rows[0][2] || '',
            lastName: result.rows[0][3] || '',
            email: result.rows[0][4],
            contactNumber: result.rows[0][5],
            birthDate: result.rows[0][6]
        } : null;

        res.json({ success: true, accountInfo });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching account information.' });
    }
});

app.post('/account-update', async (req, res) => {
    const { email, contact, birthDate } = req.body;
    const { cartId } = req.session;

    if (!cartId) return res.status(400).json({ success: false, message: 'Please login.' });

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const emailCheck = await connection.execute(
            `SELECT CustomerID FROM Customer WHERE Email = :email AND CustomerID != :customerId`,
            [email, cartId]
        );
        if (emailCheck.rows.length > 0) {
            return res.json({ success: false, message: 'Email is already in use.' });
        }

        await connection.execute(
            `UPDATE Customer SET Email = :email, Contact = :contact, BirthDate = TO_DATE(:birthDate, 'YYYY-MM-DD')
             WHERE CustomerID = :customerId`,
            [email, contact, birthDate, cartId],
            { autoCommit: true }
        );

        res.json({ success: true, message: 'Account information updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating account information.' });
    }
});

app.delete('/account-delete', async (req, res) => {
    const { cartId } = req.session;

    if (!cartId) return res.status(400).json({ success: false, message: 'Please login.' });

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const cartItemsResult = await connection.execute(
            `SELECT BookID, Quantity FROM Cart WHERE CartID = :cartId`, [cartId]
        );
        const cartItems = cartItemsResult.rows;

        for (const item of cartItems) {
            const bookId = item[0];
            const cartQuantity = item[1];

            await connection.execute(
                `UPDATE Book SET StockQuantity = StockQuantity + :cartQuantity WHERE BookID = :bookId`,
                [cartQuantity, bookId],
                { autoCommit: true }
            );
        }

        await connection.execute(`DELETE FROM Customer WHERE CustomerID = :customerId`, [cartId], { autoCommit: true });
        await connection.execute(`DELETE FROM Cart WHERE CartID = :cartId`, [cartId], { autoCommit: true });
        await connection.execute(`DELETE FROM CartAmount WHERE CartID = :cartId`, [cartId], { autoCommit: true });

        delete req.session.cartId;
        res.json({ success: true, message: 'Account deleted successfully.' });
        await connection.close();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting account.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});