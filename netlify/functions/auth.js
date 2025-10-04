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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
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

  } catch (error) {
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ message: 'Server error' }) 
    };
  }
};