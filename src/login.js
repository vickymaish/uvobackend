import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // State to show error messages

  const handleLogin = async () => {
    setErrorMessage(""); // Reset error message before new attempt
    console.log("Attempting login with:", { email, password });

    try {
      const response = await axios.post(
        "http://102.37.21.212:3000/auth/login",  // ✅ Backend URL added for VM
        { email, password },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log("Login successful:", response.data);

      alert("Login successful!");
      if (onLogin) onLogin();
      
    } catch (error) {
      console.error("Login failed:", error);

      if (error.response) {
        console.error("Server response:", error.response.data);
        setErrorMessage(error.response.data.message || "Invalid credentials");
      } else {
        setErrorMessage("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-row">
      {/* Left side with logo */}
      <div className="w-1/2 flex items-center justify-center bg-[#466995] h-screen shadow-xl drop-shadow-2xl">
        <img src='/uvotake1.png' alt='Logo' />
      </div>

      {/* Right side - Login Form */}
      <div className="w-1/2 flex items-center justify-center">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 5 }}>
          <Typography variant="h6" fontWeight="bold">Login</Typography>

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mt: 2 }}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mt: 2 }}
            fullWidth
          />

          {/* Show error message */}
          {errorMessage && <Typography color="error" sx={{ mt: 1 }}>{errorMessage}</Typography>}

          <Button variant="contained" onClick={handleLogin} sx={{ mt: 2 }} fullWidth>
            Login
          </Button>

          <Typography className="mt-4 text-sm text-blue-700 underline cursor-pointer">
            New to Uvotake? Register here
          </Typography>
        </Box>
      </div>
    </div>
  );
};

export default Login;

