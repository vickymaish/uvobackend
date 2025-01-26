import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import axios from 'axios';




const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // Send the login credentials to the backend
      const response = await axios.post(
        "http://localhost:4000/auth/login",
        { email, password },
        { withCredentials: true } // Include cookies in the request
      );

      if (response.status === 200) {
         // Clear any previous error
        alert("Login successful!");

        // Notify parent component if necessary
        if (onLogin) onLogin();

        // Redirect or update UI after successful login
      }
    } catch (err) {
      // Display an error message if the login fails
      console.error("Login failed:", err);
      
    }
  };

  return (
    <div className="flex flex-row">
      <div className="w-1/2 flex items-center justify-center bg-[#466995] h-screen shadow-xl drop-shadow-2xl ">
        <div>
        
      <img src='/uvotake1.png' alt='Logo' />
        </div>
     
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <div>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 5 }}>
      <Typography variant="h6" fontWeight="fontWeightBold" >Login</Typography>
      <TextField
        label="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mt: 2 }}
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mt: 2 }}
      />
      <Button variant="contained" onClick={handleLogin} sx={{ mt: 2 }}>
        Login
      </Button>
      <div className="mt-4">
      <p className="text-sm text-blue-700 underline">New to Uvotake? Register here</p>
      </div>
      
    </Box>
        </div>
     
      </div>
    </div>
    
  );
};

export default Login;