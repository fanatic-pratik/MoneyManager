import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setCurrentAccount(null);
      return;
    }
    const loadAccounts = async () => {
      const res = await api.get('/accounts');
      const accs = res.data.map(a => a.account_id);

      setAccounts(accs);

      const stored = localStorage.getItem("account_id");

      if (stored) {
        const selected = accs.find(a => a._id === stored);

        if (selected) {
          setCurrentAccount(selected);
        }
          else {
            localStorage.removeItem("account_id");
          }
      }
      // const stored = localStorage.getItem("account_id");

      // if (stored) {

      //   const selected = accs.find(a => a._id === stored);

      //   if (selected) {

      //     setCurrentAccount(selected);

      //   } else {

      //     // ❌ stale account from previous user
      //     localStorage.removeItem("account_id");

      //     if (accs.length > 0) {
      //       setCurrentAccount(accs[0]);
      //       localStorage.setItem("account_id", accs[0]._id);
      //     }
      //   }

      // } else if (accs.length > 0) {

      //   // first account fallback
      //   setCurrentAccount(accs[0]);
      //   localStorage.setItem("account_id", accs[0]._id);
      // }
    };

    loadAccounts();
  }, [user]);

  const switchAccount = (id) => {
    // const selected = accounts.find(a => a._id === id);
    // setCurrentAccount(selected);
    // localStorage.setItem("account_id", id);
    localStorage.setItem("account_id", id);

    const selected = accounts.find(a => a._id === id);

    if (selected) {
      setCurrentAccount(selected);
    }
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