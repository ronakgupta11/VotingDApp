import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import VotingABI from "./VotingABI.json";
import './App.css';

const VOTING_CONTRACT_ADDRESS = "0x897058DfB39113d0F4F1E5081f0C06721B7BDEd9";

function App() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [votingOpen, setVotingOpen] = useState(false);
  const [owner, setOwner] = useState("");
  const [currentAccount, setCurrentAccount] = useState(null);
  const [newCandidate, setNewCandidate] = useState("");
  const [toast, setToast] = useState({ show: false, message: '' });
  const [winner, setWinner] = useState({ name: '', votes: 0 });
  const [votingEndedAt, setVotingEndedAt] = useState(null);
  const [votingEnded, setVotingEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLogVisible, setIsLogVisible] = useState(true);
  const [candidateProgram, setCandidateProgram] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing provider and contract...");
        const _provider =  new ethers.BrowserProvider(window.ethereum);
        
        // const code = await _provider.getCode(VOTING_CONTRACT_ADDRESS);
        // console.log("Contract code at address:", code);
        
        const network = await _provider.getNetwork();
        console.log("Connected to network:", network);

        const signer = await _provider.getSigner();
        const signerAddress = await signer.getAddress();
        console.log("Signer address:", signerAddress);

        const _contract = new ethers.Contract(
          VOTING_CONTRACT_ADDRESS,
          VotingABI,
          signer
        );

        // Получаем владельца контракта
        const contractOwner = await _contract.owner();

        console.log("Contract owner:", contractOwner);
        console.log("Current signer:", signerAddress);
        
        setOwner(contractOwner.toLowerCase());
        setCurrentAccount(signerAddress.toLowerCase());
        
        // Сбрасываем все состояния при инициализации
        setVotingOpen(false);
        setVotingEnded(false);
        setVotingEndedAt(null);
        setWinner({ name: '', votes: 0 });
        setTransactions([]);
        
        // Получаем актуальные данные из контракта
        const isVotingOpen = await _contract.votingOpen();
        const endedAt = await _contract.getVotingEndedAt();
        
        console.log("Contract state:", {
          isVotingOpen,
          endedAt: Number(endedAt)
        });

        setVotingOpen(isVotingOpen);
        
        // Устанавливаем votingEndedAt только если голосование действительно завершено
        if (!isVotingOpen && Number(endedAt) > 0) {
          setVotingEnded(true);
          setVotingEndedAt(Number(endedAt));
          
          // Получаем победителя только если голосование завершено
          try {
            const winnerInfo = await _contract.getWinner();
            setWinner({
              name: winnerInfo.winnerName,
              votes: Number(winnerInfo.winnerVoteCount)
            });
          } catch (error) {
            console.error("Error getting winner:", error);
          }
        }

        setProvider(_provider);
        setContract(_contract);

        await loadTransactionHistory(_provider, _contract);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const account = accounts[0].toLowerCase();
        console.log("Account changed to:", account);
        setCurrentAccount(account);
        
        // Обновляем провайдер и контракт с новым подписантом
        if (window.ethereum) {
          const _provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await _provider.getSigner();
          const _contract = new ethers.Contract(
            VOTING_CONTRACT_ADDRESS,
            VotingABI,
            signer
          );
          setProvider(_provider);
          setContract(_contract);
          
          // Перезагружаем данные
          await loadCandidates(_contract);
        }
      } else {
        setCurrentAccount(null);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
        });
    }

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    const checkWinnerIfVotingEnded = async () => {
      if (contract && !votingOpen && candidates.length > 0) {
        try {
          const winnerInfo = await contract.getWinner();
          setWinner({
            name: winnerInfo.winnerName,
            votes: Number(winnerInfo.winnerVoteCount)
          });
        } catch (error) {
          console.error("Error fetching winner:", error);
        }
      }
    };

    checkWinnerIfVotingEnded();
  }, [contract, votingOpen, candidates.length]);

  // Функция для загрузки кандидатов из контракта
  const loadCandidates = async (_contract) => {
    const candidateCount = await _contract.getCandidateCount();
    const _candidates = [];
    for (let i = 0; i < candidateCount; i++) {
      const candidate = await _contract.getCandidate(i);
      _candidates.push({
        name: candidate.name,
        voteCount: Number(candidate.voteCount),
        avatarIpfsHash: candidate.avatarIpfsHash,
        program: candidate.program
      });
    }
    setCandidates(_candidates);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Пожалуйста установите MetaMask!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0].toLowerCase();
      console.log("Connected account:", account);
      console.log("Owner address:", owner);
      console.log("Are they equal?", account === owner);
      setCurrentAccount(account);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleStartVoting = async () => {
    try {
      setIsLoading(true);
      console.log("Sending startVoting transaction");
      const tx = await contract.startVoting();
      console.log("StartVoting transaction sent:", tx.hash);
      
      const receipt = await tx.wait(1);
      console.log("StartVoting transaction confirmed:", receipt);
      
      addTransaction(
        'Voting has begun', 
        tx.hash, 
        'Voting is open'
      );
      setVotingOpen(true);
      showToast("Voting has started successfully!");
    } catch (error) {
      console.error("StartVoting error:", error);
      showToast("Error when starting voting", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (index) => {
    try {
      setIsLoading(true);
      const tx = await contract.vote(index);
      await tx.wait(1);
      
      await loadTransactionHistory(provider, contract);
      await loadCandidates(contract);
      
      showToast("Голос успешно учтен!");
    } catch (error) {
      console.error("Vote error:", error);
      // Проверяем сообщение об ошибке из смарт-контракта
      if (error.message.includes("You have already voted")) {
        showToast("Вы уже проголосовали!", 'error');
      } else if (error.message.includes("Voting is not open")) {
        showToast("Голосование еще не началось или уже завершено", 'error');
      } else {
        showToast("Ошибка при голосовании", 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndVoting = async () => {
    try {
      setIsLoading(true);
      const tx = await contract.endVoting();
      await tx.wait(1);
      addTransaction(
        'Завершение голосования', 
        tx.hash, 
        'Голосование закрыто'
      );
      setVotingOpen(false);
      setVotingEnded(true);
      
      // Получаем время завершения из контракта
      const endedAt = await contract.getVotingEndedAt();
      setVotingEndedAt(Number(endedAt));
      
      const winnerInfo = await contract.getWinner();
      setWinner({
        name: winnerInfo.winnerName,
        votes: Number(winnerInfo.winnerVoteCount)
      });
      
      showToast("Голосование успешно завершено!");
    } catch (error) {
      showToast("Ошибка при завершении голосования", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addCandidate = async () => {
    if (!contract || !selectedFile || !newCandidate.trim() || !candidateProgram.trim()) {
      alert("Пожалуйста, заполните все поля и выберите изображение");
      return;
    }

    try {
      setIsLoading(true);
      
      console.log("Checking if voting is open...");
      const isVotingOpen = await contract.votingOpen();
      console.log("Voting open status:", isVotingOpen);
      
      if (isVotingOpen) {
        alert("Нельзя добавлять кандидатов после начала голосования");
        return;
      }
      
      const ipfsHash = await uploadToIpfs(selectedFile);
      const signer =await provider.getSigner()
      const contractWithSigner = contract.connect(signer)
      const tx = await contractWithSigner.addCandidate(
        newCandidate,
        ipfsHash,
        candidateProgram
      );
      await tx.wait(1);
      
      addTransaction(
        'Добавление кандидата',
        tx.hash,
        `Добавлен кандидат: ${newCandidate}`
      );
      
      await loadCandidates(contract);
      setNewCandidate("");
      setCandidateProgram("");
      setSelectedFile(null);
      
      showToast("Кандидат успешно добавлен!");
    } catch (error) {
      showToast(`Ошибка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const formatEndTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const addTransaction = (type, hash, details) => {
    console.log('Adding transaction:', { type, hash, details }); // Для отладки
    const newTransaction = {
      type,
      hash,
      timestamp: new Date(),
      details
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  // Выносим функцию загрузки истории в отдельную функцию
  const loadTransactionHistory = async (_provider, _contract) => {
    if (!_provider || !_contract) return;

    try {
      console.log("Starting to load transaction history...");
      const currentBlock = await _provider.getBlockNumber();
      
      const history = [];
      const methods = {
        '0xad71f8dc': { name: 'addCandidate', label: 'Добавление кандидата' },
        '0x0121b93f': { name: 'vote', label: 'Голосование' },
        '0x1ec6b60a': { name: 'startVoting', label: 'Начало голосования' },
        '0xc3403ddf': { name: 'endVoting', label: 'Завершение голосования' }
      };
      
      for (let i = 0; i <= currentBlock; i++) {
        const block = await _provider.getBlock(i);
        if (!block) continue;
        
        console.log(`\nBlock ${i} details:`, {
          number: block.number,
          hash: block.hash,
          timestamp: new Date(block.timestamp * 1000).toLocaleString(),
          gasUsed: block.gasUsed.toString(),
          gasLimit: block.gasLimit.toString(),
          transactions: block.transactions.length
        });
        
        for (const txHash of block.transactions) {
          const tx = await _provider.getTransaction(txHash);
          if (!tx || !tx.data) continue;
          
          if (tx.to && tx.to.toLowerCase() === VOTING_CONTRACT_ADDRESS.toLowerCase()) {
            const receipt = await _provider.getTransactionReceipt(tx.hash);
            
            console.log('\nTransaction details:', {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              data: tx.data,
              nonce: tx.nonce,
              gasLimit: tx.gasLimit.toString(),
              gasPrice: tx.gasPrice?.toString(),
              blockNumber: tx.blockNumber,
              blockHash: tx.blockHash,
              timestamp: new Date(block.timestamp * 1000).toLocaleString()
            });

            console.log('Transaction receipt:', {
              status: receipt.status,
              gasUsed: receipt.gasUsed.toString(),
              effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
              blockNumber: receipt.blockNumber,
              logs: receipt.logs,
              events: receipt.events
            });

            const methodId = tx.data.slice(0, 10).toLowerCase();
            const method = methods[methodId] || { name: 'unknown', label: 'Неизвестная операция' };
            
            let details = `${method.label} (Блок: ${i})`;
            
            // Обработка разных типов транзакций
            if (methodId === '0x0121b93f') { // vote
              const candidateIndex = parseInt(tx.data.slice(10), 16);
              try {
                const candidate = await _contract.candidates(candidateIndex);
                details = `Голос за кандидата: ${candidate.name} (Блок: ${i})`;
              } catch (error) {
                console.error("Error getting candidate name:", error);
              }
            } else if (methodId === '0xad71f8dc') { // addCandidate
              const abiCoder = new ethers.AbiCoder();
              try {
                const decodedData = abiCoder.decode(
                  ['string', 'string', 'string'],
                  '0x' + tx.data.slice(10)
                );
                const candidateName = decodedData[0];
                details = `Добавлен кандидат: ${candidateName} (Блок: ${i})`;
              } catch (error) {
                console.error("Error decoding candidate data:", error);
                details = `Добавление кандидата (Блок: ${i})`; // Fallback
              }
            }
            
            history.push({
              type: method.label,
              hash: tx.hash,
              timestamp: new Date(block.timestamp * 1000),
              from: tx.from,
              status: receipt.status === 1 ? 'Успешно' : 'Ошибка',
              details: details
            });
          }
        }
      }

      if (history.length > 0) {
        console.log("\nFinal transaction history:", history);
        setTransactions(history.sort((a, b) => b.timestamp - a.timestamp));
      }

    } catch (error) {
      console.error("Error loading transaction history:", error);
    }
  };

  // Подписка на новые события
  useEffect(() => {
    if (provider && contract) {
      console.log("Setting up event listeners...");
      const filter = {
        address: VOTING_CONTRACT_ADDRESS
      };
      
      const handleNewTransaction = async (log) => {
        console.log("\nNew transaction detected:", {
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          address: log.address,
          topics: log.topics,
          data: log.data,
          timestamp: new Date().toLocaleString()
        });
        
        if (provider && contract) {
          await loadTransactionHistory(provider, contract);
        }
      };
      
      provider.on(filter, handleNewTransaction);

      // Очистка при размонтировании
      return () => {
        console.log("Removing event listeners...");
        provider.removeAllListeners(filter);
      };
    }
  }, [provider, contract]); // Зависимости только provider и contract

  // Добавляем функцию загрузки файла в IPFS
  const uploadToIpfs = async (file) => {
    try {
        // console.log('Starting upload to IPFS:', file.name);
        
        // const formData = new FormData();
        // formData.append('file', file);

        // const response = await fetch('http://127.0.0.1:5001/api/v0/add?pin=true', {
        //     method: 'POST',
        //     body: formData,
        // });

        // if (!response.ok) {
        //     throw new Error(`HTTP error! status: ${response.status}`);
        // }

        // const data = await response.json();
        // console.log('File uploaded successfully:', data);
        
        // // Проверяем, что получили хеш
        // if (!data.Hash) {
        //     throw new Error('No hash received from IPFS');
        // }

        return "";
    } catch (error) {
        console.error('IPFS upload error:', {
            message: error.message,
            fileName: file.name,
            fileSize: file.size
        });
        throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  };

  const toggleProgram = (index) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="App">
      <h1>Welcome to the voting!</h1>
      
      <div className="wallet-section">
        {currentAccount ? (
          <div className="wallet-info">
            <span>Connected address:</span>
            <span className="wallet-address">
              {currentAccount}
              {currentAccount.toLowerCase() === owner.toLowerCase() && (
                <span className="admin-badge">Contract Administrator</span>
              )}
            </span>
          </div>
        ) : (
          <>
            <p>Please connect your wallet for interaction с DApp.</p>
            <button onClick={connectWallet}>Connect wallet</button>
          </>
        )}
      </div>

      {currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase() && (
        <div className="add-candidate-section">
          <div className="input-row">
            <div className="name-input">
              <input
                type="text"
                value={newCandidate}
                onChange={(e) => setNewCandidate(e.target.value.slice(0, 50))}
                placeholder="Enter candidate name"
                maxLength={50}
              />
              <small>{newCandidate.length}/50 symbols</small>
            </div>
            
            <div className="file-input">
              <input
                type="file"
                id="file-upload"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept="image/*"
                className="file-input-hidden"
              />
              <label htmlFor="file-upload" className="file-input-label">
                {selectedFile ? selectedFile.name : "Select photo"}
              </label>
              <span className="file-status">
                {selectedFile ? "✓ File selected" : "File not selected"}
              </span>
            </div>
          </div>

          <div className="program-input">
            <textarea
              value={candidateProgram}
              onChange={(e) => setCandidateProgram(e.target.value.slice(0, 1000))}
              placeholder="Enter the election program"
              maxLength={1000}
            />
            <small>{candidateProgram.length}/1000 symbols</small>
          </div>

          <div className="button-container">
            <button 
              onClick={addCandidate}
              disabled={isLoading || !newCandidate || !selectedFile || !candidateProgram}
            >
              {isLoading ? "Loading..." : "Add candidate"}
            </button>
          </div>
        </div>
      )}

      {currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase() && (
        <div className="voting-controls">
          {!votingOpen && (
            <button 
              onClick={handleStartVoting}
              disabled={isLoading || candidates.length < 2}
              className="start-voting-button"
            >
              {isLoading ? "Voting begins..." : "Start voting"}
            </button>
          )}
          {votingOpen && (
            <button 
              onClick={handleEndVoting}
              disabled={isLoading}
            >
              {isLoading ? "Voting ends..." : "End voting"}
            </button>
          )}
        </div>
      )}

      {votingEnded && votingEndedAt && (
        <>
          <div className="voting-info">
            <p>Voting is closed:{formatEndTime(votingEndedAt)}</p>
          </div>
          {winner.name && (
            <div className="winner-section">
              <h3>🎉 VOTE WINNER 🎉</h3>
              <div className="winner-content">
                {candidates.find(c => c.name === winner.name)?.avatarIpfsHash && (
                  <img 
                    src={`http://localhost:8080/ipfs/${candidates.find(c => c.name === winner.name).avatarIpfsHash}`}
                    alt="Фото победителя"
                    className="winner-avatar"
                  />
                )}
                <div className="winner-info">
                  <div className="winner-name">{winner.name}</div>
                  <div className="winner-votes">{winner.votes}votes</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="candidates-section">
        <h2>Candidate</h2>
        <ul className="candidates-list">
          {candidates.map((candidate, index) => (
            <li key={index} className="candidate-item">
              <div className="candidate-info">
                {candidate.avatarIpfsHash && (
                  <img 
                    src={`http://localhost:8080/ipfs/${candidate.avatarIpfsHash}`}
                    alt={`${candidate.name} avatar`}
                    className="candidate-avatar"
                  />
                )}
                <div className="candidate-details">
                  <h3>{candidate.name}</h3>
                  <div className="candidate-program-container">
                    <p className={`candidate-program ${expandedPrograms[index] ? 'expanded' : ''}`}>
                      {expandedPrograms[index] 
                        ? candidate.program 
                        : `${candidate.program.slice(0, 300)}${candidate.program.length > 300 ? '...' : ''}`
                      }
                    </p>
                    {candidate.program.length > 300 && (
                      <button 
                        className="toggle-program-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProgram(index);
                        }}
                      >
                        {expandedPrograms[index] ? 'Collapse' : 'Read more'}
                      </button>
                    )}
                  </div>
                  <span className="vote-count">{candidate.voteCount || '0'} votes</span>
                </div>
              </div>
              {votingOpen && (
                <button onClick={() => handleVote(index)}>Vote</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div>
            <div className="spinner"></div>
            <div className="loading-text">Please wait...</div>
          </div>
        </div>
      )}

      <div className="transactions-log">
        <div 
          className="log-header" 
          onClick={() => setIsLogVisible(!isLogVisible)}
          style={{ cursor: 'pointer' }}
        >
          <h3>Transaction history</h3>
          <span className={`arrow ${isLogVisible ? 'up' : 'down'}`}>
            {isLogVisible ? '▼' : '▲'}
          </span>
        </div>
        
        {isLogVisible && (
          <div className="log-content">
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet</p>
            ) : (
              transactions.map((tx, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-type">{tx.type}</div>
                  <div className="transaction-time">
                    {tx.timestamp.toLocaleString('ru-RU')}
                  </div>
                  <div className="transaction-details">{tx.details}</div>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="transaction-hash"
                  >
                    {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
