const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Handle different endpoints based on the path
  const path = event.path;

  try {
    // GET /auth/me - Verify token and get user data
    if (event.httpMethod === 'GET' && path.endsWith('/auth/me')) {
      const authHeader = event.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { 
          statusCode: 401, 
          headers,
          body: JSON.stringify({ message: 'No token provided' }) 
        };
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await connectDB();
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return { 
            statusCode: 401, 
            headers,
            body: JSON.stringify({ message: 'User not found' }) 
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            user: { 
              id: user._id, 
              username: user.username, 
              email: user.email 
            }
          })
        };
      } catch (error) {
        return { 
          statusCode: 401, 
          headers,
          body: JSON.stringify({ message: 'Invalid token' }) 
        };
      }
    }

    // POST /auth - Handle login/signup
    if (event.httpMethod === 'POST' && path.endsWith('/auth')) {
      await connectDB();
      
      const { action, username, email, password } = JSON.parse(event.body);

      if (action === 'signup') {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return { 
            statusCode: 400, 
            headers,
            body: JSON.stringify({ message: 'User already exists' }) 
          };
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            token, 
            user: { id: user._id, username: user.username, email: user.email },
            message: 'User created successfully!'
          })
        };
      }

      if (action === 'login') {
        // Find user and validate
        const user = await User.findOne({ email });
        if (!user) {
          return { 
            statusCode: 400, 
            headers,
            body: JSON.stringify({ message: 'Invalid credentials' }) 
          };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return { 
            statusCode: 400, 
            headers,
            body: JSON.stringify({ message: 'Invalid credentials' }) 
          };
        }

        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            token, 
            user: { id: user._id, username: user.username, email: user.email },
            message: 'Login successful!'
          })
        };
      }

      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ message: 'Invalid action' }) 
      };
    }

    return { 
      statusCode: 404, 
      headers,
      body: JSON.stringify({ message: 'Endpoint not found' }) 
    };

  } catch (error) {
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ message: 'Server error' }) 
    };
  } 
};