import { useState } from 'react';
import { Routes, Route,Navigate } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import Dashboard from './pages/dashboard'
import BidsPage from './pages/bids'
import Login from "./login";
import AccountsPage from './pages/accountsPage';

const App = () =>{
  const accounts = [
    { username: "admin", password: "password", status: "active" },
    { username: "user1", password: "password1", status: "active" },
    { username: "user2", password: "password2", status: "active" },
    // Add more accounts as needed
  ];
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedInAccounts, setLoggedInAccounts] = useState(accounts);
  const navigate = useNavigate()

  

  const handleLogin = (username) => {
    setIsAuthenticated(true);
    setLoggedInAccounts(loggedInAccounts.map(account => 
      account.username === username ? { ...account, status: "active" } : account
    ));
    navigate("/dashboard")
     
  };





  if (!isAuthenticated) {
    return (
   
        <Routes>
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />
           <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
  
    );
  }



  return(
    <div>
      
      <Routes>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/bids' element={<BidsPage />} />
        <Route path='/profile' element={<AccountsPage />} />
      </Routes>
      
     
      
    </div>
  )
}

export default App