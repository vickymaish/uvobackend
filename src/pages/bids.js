import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";

const BidsPage = () => {
  const [rows, setRows] = useState([]);

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
      date: new Date().toISOString().split("T")[0],
      item: `Item ${rows.length + 1}`,
      customer: `Customer ${String.fromCharCode(65 + rows.length)}`,
      stats: `Stat ${rows.length + 1}`,
      deadline: new Date(Date.now() + 4 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .substring(0, 16),
      pages: Math.floor(Math.random() * 100) + 1,
      topic: `Topic ${rows.length + 1}`,
      amount: (Math.random() * 100).toFixed(2),
    };
    setRows([...rows, newOrder]);
  };
  return (
    <div className="relative">
      <div className="w-[100vw]">
        <Sidebar />
      </div>
      <div className="absolute top-10 left-[290px] w-[80%]">
        <Box sx={{ p: 3 }}>
          <Button variant="contained" onClick={scrapeOrders}>
            Scrape Orders
          </Button>
          <Box
            sx={{
              height: 700,
              backgroundColor: "white",
              borderRadius: 2,
              mt: 2,
            }}
          >
            <DataGrid rows={rows} columns={columns} />
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default BidsPage;
