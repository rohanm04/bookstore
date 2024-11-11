# Online Book Store Project
Database Systems university course project - Online Book Store with user accounts, multiple books and options to add books to cart, remove them from cart and change quantity. Uses HTML/CSS and JavaScript for frontend, Node.js and Express.js for backend, Oracle Database for the database.

## Initial Steps to Run
1. Run **npm install** in the terminal within the project directory to install the necessary dependencies.
2. The project was created using a local instance of Oracle Database. Hence, the tables need to be recreated with dummy values. The exact SQL queries to do so are given below.
3. Update **index.js** with your SQL username, password and relevant connection string (Lines 10, 11, 12).
4. As an alternative to Step 3, you may create the database user **C##general** with password **general** to avoid editing **index.js**. The SQL queries for this are also given below. However, make sure that the connection string (Line 12) corresponds to the service used.

## SQL Queries to Recreate Tables
1. Author:

CREATE TABLE Author (<br>
<pre>    AuthorID NUMBER(3) PRIMARY KEY,<br>
    AuthFirstName VARCHAR2(20) NOT NULL,<br>
    AuthMidName VARCHAR2(20),<br>
    AuthLastName VARCHAR2(20)<br></pre>
);

INSERT INTO Author VALUES (101, 'Stephen', '', 'King');<br>
INSERT INTO Author VALUES (102, 'Joanne', 'Kathleen', 'Rowling');<br>
INSERT INTO Author VALUES (103, 'Agatha', '', 'Christie');<br>
INSERT INTO Author VALUES (104, 'Kurt', '', 'Vonnegut');<br>
INSERT INTO Author VALUES (105, 'John', 'Edward', 'Williams');

2. Book:

CREATE TABLE Book(<br>
    BookID NUMBER(5) PRIMARY KEY,<br>
    Title VARCHAR2(50) NOT NULL,<br>
    AuthorID NUMBER(3) NOT NULL,<br>
    Genre VARCHAR2(20),<br>
    Price NUMBER(6, 2) CHECK (Price >=0),<br>
    StockQuantity NUMBER(3) CHECK (StockQuantity >= 0),<br>
    CONSTRAINT fk_author FOREIGN KEY (AuthorID) REFERENCES Author (AuthorID)<br>
);

INSERT INTO Book VALUES (10001, 'And Then There Were None', 103, 'Mystery', 245.00, 12);<br>
INSERT INTO Book VALUES (10002, 'Augustus', 105, 'History', 369.33, 4);<br>
INSERT INTO Book VALUES (10003, 'Breakfast of Champions', 104, 'Satire', 397.00, 9);<br>
INSERT INTO Book VALUES (10004, 'Butcher''s Crossing', 105, 'Western', 399.00, 48);<br>
INSERT INTO Book VALUES (10005, 'Carrie', 101, 'Horror', 389.00, 112);<br>
INSERT INTO Book VALUES (10006, 'Cat''s Cradle', 104, 'Science Fiction', 265.00, 29);<br>
INSERT INTO Book VALUES (10007, 'Death on the Nile', 103, 'Mystery', 277.00, 147);<br>
INSERT INTO Book VALUES (10008, 'God Bless You, Mr. Rosewater', 104, 'Satire', 419.69, 2);<br>
INSERT INTO Book VALUES (10009, 'Harry Potter and the Chamber of Secrets', 102, 'Fantasy', 388.00, 213);<br>
INSERT INTO Book VALUES (10010, 'Harry Potter and the Deathly Hallows', 102, 'Fantasy', 425.00, 201);<br>
INSERT INTO Book VALUES (10011, 'Harry Potter and the Goblet of Fire', 102, 'Fantasy', 524.00, 187);<br>
INSERT INTO Book VALUES (10012, 'Harry Potter and the Half-Blood Prince', 102, 'Fantasy', 449.00, 314);<br>
INSERT INTO Book VALUES (10013, 'Harry Potter and the Order of the Phoenix', 102, 'Fantasy', 578.00, 264);<br>
INSERT INTO Book VALUES (10014, 'Harry Potter and the Prisoner of Azkaban', 102, 'Fantasy', 423.00, 82);<br>
INSERT INTO Book VALUES (10015, 'Harry Potter and the Sorcerer''s Stone', 102, 'Fantasy', 499.00, 138);<br>
INSERT INTO Book VALUES (10016, 'IT', 101, 'Horror', 454.00, 104);<br>
INSERT INTO Book VALUES (10017, 'Misery', 101, 'Horror', 415.00, 20);<br>
INSERT INTO Book VALUES (10018, 'Murder on the Orient Express', 103, 'Mystery', 268.00, 223);<br>
INSERT INTO Book VALUES (10019, 'Nothing but the Night', 105, 'Coming of Age', 418.69, 4);<br>
INSERT INTO Book VALUES (10020, 'Pet Sematary', 101, 'Horror', 454.00, 43);<br>
INSERT INTO Book VALUES (10021, 'Salem''s Lot', 101, 'Horror', 635.00, 97);<br>
INSERT INTO Book VALUES (10022, 'Slaughterhouse-Five', 104, 'Science Fiction', 479.00, 34);<br>
INSERT INTO Book VALUES (10023, 'Stoner', 105, 'Fiction', 395.00, 102);<br>
INSERT INTO Book VALUES (10024, 'The Murder at the Vicarage', 103, 'Mystery', 421.00, 36);<br>
INSERT INTO Book VALUES (10025, 'The Shining', 101, 'Horror', 405.00, 66);<br>
INSERT INTO Book VALUES (10026, 'Welcome to the Monkey House', 104, 'Science Fiction', 699.69, 1);

3. Cart Amount:

CREATE TABLE CartAmount (<br>
    CartID NUMBER(4) PRIMARY KEY,<br>
    TotalAmount NUMBER(10, 2) DEFAULT 0 CHECK(TotalAmount >= 0)<br>
);

4. Cart:

CREATE TABLE Cart (<br>
    CartID NUMBER(4),<br>
    BookID NUMBER(5) NOT NULL,<br>
    Quantity NUMBER(3) CHECK (Quantity >= 1),<br>
    PRIMARY KEY (CartID, BookID),<br>
    FOREIGN KEY (CartID) REFERENCES CartAmount (CartID) ON DELETE CASCADE,<br>
    FOREIGN KEY (BookID) REFERENCES Book (BookID)<br>
);

5. Customer:

CREATE TABLE Customer (<br>
    CustomerID NUMBER(4) PRIMARY KEY,<br>
    CustFirstName VARCHAR2(20) NOT NULL,<br>
    CustMidName VARCHAR2(20),<br>
    CustLastName VARCHAR2(20),<br>
    Email VARCHAR2(50) NOT NULL,<br>
    Contact NUMBER(10) NOT NULL,<br>
    BirthDate DATE,<br>
    CartID NUMBER(4) UNIQUE NOT NULL,<br>
    FOREIGN KEY (CartID) REFERENCES CartAmount (CartID) ON DELETE CASCADE<br>
);

6. Customer ID Sequence:

CREATE SEQUENCE customer_id_seq START WITH 1000 INCREMENT BY 1 MINVALUE 1000 MAXVALUE 9999;

## SQL Queries to Create User
1. Login to an Oracle Database instance as dba (username: system).

CREATE USER C##general IDENTIFIED BY general;

GRANT CONNECT TO C##general;<br>
GRANT CREATE SESSION TO C##general;<br>
GRANT SELECT ON Author TO C##general;<br>
GRANT SELECT, UPDATE ON Book TO C##general;<br>
GRANT ALL ON CartAmount TO C##general;<br>
GRANT ALL ON Cart TO C##general;<br>
GRANT ALL ON Customer TO C##general;<br>
GRANT SELECT ON customer_id_seq TO C##general;

CREATE PUBLIC SYNONYM Author FOR SYSTEM.Author;<br>
CREATE PUBLIC SYNONYM Book FOR SYSTEM.Book;<br>
CREATE PUBLIC SYNONYM CartAmount FOR SYSTEM.CartAmount;<br>
CREATE PUBLIC SYNONYM Cart FOR SYSTEM.Cart;<br>
CREATE PUBLIC SYNONYM Customer FOR SYSTEM.Customer;<br>
CREATE PUBLIC SYNONYM customer_id_seq FOR SYSTEM.customer_id_seq;
