import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);

  useEffect(() => {
    const loadAccounts = async () => {
      const res = await api.get('/accounts');
      const accs = res.data.map(a => a.account_id);

      setAccounts(accs);

      const stored = localStorage.getItem("account_id");
      const selected = accs.find(a => a._id === stored) || accs[0];

      if (selected) {
        setCurrentAccount(selected);
        localStorage.setItem("account_id", selected._id);
      }
    };

    loadAccounts();
  }, []);

  const switchAccount = (id) => {
    const selected = accounts.find(a => a._id === id);
    setCurrentAccount(selected);
    localStorage.setItem("account_id", id);
  };

  return (
    <AccountContext.Provider value={{ accounts, currentAccount, switchAccount }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  return useContext(AccountContext);
};