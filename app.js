const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const { connectToDatabase, getDatabase } = require('./db');
const session = require('express-session');
const { getProducts, createProduct, getProductById, updateProduct, deleteProduct, searchProducts } = require('./product');

// Cấu hình static middleware cho thư mục public
app.use(express.static('public'));
app.set('view engine', 'hbs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware for managing sessions
app.use(
  session({
    secret: 'your-secret-key', // Change this to a random and secure value
    resave: false,
    saveUninitialized: false,
  })
);

connectToDatabase();



app.get('/', async (req, res) => {
  const items = await getProducts();
  res.render('homepage', { products: items, user: req.session.user }); // Thêm thông tin người dùng vào context
});
app.get('/homepage', async (req, res) => {
  const items = await getProducts();
  const user = req.session.user; // Lấy thông tin người dùng đã lưu trong session

  // Truyền thông tin người dùng vào giao diện để hiển thị
  res.render('homepage', { products: items, user: user });
});

const users = []; // Temporary array to store registered users (replace this with a proper database implementation)

// Other routes and middleware (if any)

// Route for the register page (GET request)
app.get('/register', (req, res) => {
  res.render('register');
});

// Route for user registration (POST request)
// Route for user registration (POST request)
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation for name, email, and password
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  try {
    // Insert the new user data into the "users" collection in MongoDB
    const user = await getDatabase().collection('users').insertOne({ name, email, password });
    // Redirect to the login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});



// Route for user login (GET request)
app.get('/login', (req, res) => {
  res.render('login');
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation for email and password
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await getDatabase().collection('users').findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = user;
    res.redirect('/homepage'); // Replace '/dashboard' with the actual dashboard page route
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Route for user logout
app.get('/logout', (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
    }
    res.redirect('/homepage'); // Redirect back to the homepage after logout
  });
});

app.post('/add', async (req, res) => {
  const { name, price, image, description } = req.body;
  try {
    const newItem = await createProduct({ name, price: parseFloat(price), image, description });
    res.redirect('/toy-manager');
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/new', (req, res) => {
  res.render('new');
});

// ...

// Route for editing a product (GET request)
// Route for editing a product (GET request)
app.get('/edit/:_id', async (req, res) => {
  const { _id } = req.params; // Sửa đổi ở đây
  try {
    const product = await getProductById(_id);
    res.render('edit', { product });
  } catch (err) {
    res.status(404).json({ message: 'Product not found' });
  }
});


// Route for updating a product (POST request)
app.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, image, description } = req.body;
  try {
    await updateProduct(id, { name, price: parseFloat(price), image, description });
    res.redirect('/homepage'); // Chuyển về trang chủ sau khi cập nhật
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ...


// ... (previous code)

app.post('/delete/:_id', async (req, res) => {
  const { _id } = req.params;
  try {
    await deleteProduct(_id);
    res.redirect('/toy-manager')
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ... (remaining code)


app.get('/toy-manager', async (req, res) => {
  const items = await getProducts();
  res.render('toy-manager', { products: items });
});







// Route for viewing a product by ID
app.get('/view/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await getProductById(productId);
    if (product) {
      res.render('view', { product });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving product' });
  }
});
app.get('/about', (req, res) => {
  res.render('about');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on :${PORT}`);
});