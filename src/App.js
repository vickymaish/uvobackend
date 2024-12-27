import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MenuIcon from "@mui/icons-material/Menu";
import Login from "./login";


const columns = [
  { field: "id", headerName: "ID", width: 100 },
  { field: "date", headerName: "Date", width: 150 },
  { field: "item", headerName: "Item", width: 200 },
  { field: "customer", headerName: "Customer", width: 200 },
  { field: "stats", headerName: "Stats", width: 200 },
  { field: "deadline", headerName: "Deadline", width: 200 },
  { field: "pages", headerName: "Pages", width: 100 },
  { field: "topic", headerName: "Topic", width: 200 },
  { field: "amount", headerName: "Amount ($)", width: 150 },
];

const accounts = [
  { username: "admin", password: "password", status: "active" },
  { username: "user1", password: "password1", status: "active" },
  { username: "user2", password: "password2", status: "active" },
  // Add more accounts as needed
];

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rows, setRows] = useState([]);
  const [loggedInAccounts, setLoggedInAccounts] = useState(accounts);

  useEffect(() => {
    const interval = setInterval(() => {
      scrapeOrders();
    }, 60000); // Scrape orders every minute

    return () => clearInterval(interval);
  }, []);

  const scrapeOrders = () => {
    // Implement your scraping logic here
    // For demonstration, let's add a dummy order
    const newOrder = {
      id: rows.length + 1,
      date: new Date().toISOString().split('T')[0],
      item: `Item ${rows.length + 1}`,
      customer: `Customer ${String.fromCharCode(65 + rows.length)}`,
      stats: `Stat ${rows.length + 1}`,
      deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      pages: Math.floor(Math.random() * 100) + 1,
      topic: `Topic ${rows.length + 1}`,
      amount: (Math.random() * 100).toFixed(2),
    };
    setRows([...rows, newOrder]);
  };

  const handleLogin = (username) => {
    setIsAuthenticated(true);
    setLoggedInAccounts(loggedInAccounts.map(account => 
      account.username === username ? { ...account, status: "active" } : account
    ));
  };

  const handleLogout = (username) => {
    setLoggedInAccounts(loggedInAccounts.map(account => 
      account.username === username ? { ...account, status: "inactive" } : account
    ));
 
  };



  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex ">
      <div className="w-[25%] h-screen bg-[#466995] text-white">
        <div className="mt-6 grid place-items-center">
        <div>
            <p>Uvotake</p>
          </div>
          <div className="flex flex-col gap-8 my-10">
            <p>DashBoard</p>
            <p>Bids</p>
            <p>Account</p>
            <p>Settings</p>
          </div>
        </div>
        <div className="absolute bottom-0 bg-red-700 w-[25%] py-2 cursor-pointer">
          <div className="flex justify-center">
          <button onClick={() => handleLogout()}>Log Out</button>
          </div>
        
        </div>
        
      </div>
      {/* <AppBar position="static">
        <Toolbar>
          <MenuIcon />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            uvotake
          </Typography>
        </Toolbar>
      </AppBar> */}
      <div className="w-[75%]">
      <Box sx={{ p: 3 }}>
        <Button variant="contained" onClick={scrapeOrders}>Scrape Orders</Button>
        <Box sx={{ height: 400, backgroundColor: "white", borderRadius: 2, mt: 2 }}>
          <DataGrid rows={rows} columns={columns} />
        </Box>
      </Box>
      </div>
     
    </div>
  );
};

export default App;