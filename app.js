// TrackMyShop JavaScript Application
class TrackMyShop {
  constructor() {
      this.recognition = null;
      this.isListening = false;
      this.transactions = [];
      
      this.initializeElements();
      this.initializeVoiceRecognition();
      this.setupEventListeners();
  }

  initializeElements() {
      this.voiceBtn = document.getElementById('voiceBtn');
      this.statusText = document.getElementById('status');
      this.userSpeechDiv = document.getElementById('userSpeech');
      this.transactionSummaryDiv = document.getElementById('transactionSummary');
      this.recentListDiv = document.getElementById('recentList');
  }

  initializeVoiceRecognition() {
      // Check if browser supports speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          this.recognition = new SpeechRecognition();
          
          // Configure speech recognition
          this.recognition.continuous = false;
          this.recognition.interimResults = false;
          this.recognition.lang = 'en-US';
          
          this.setupVoiceEvents();
      } else {
          this.showError('Voice recognition not supported in this browser');
      }
  }

  setupVoiceEvents() {
      this.recognition.onstart = () => {
          this.isListening = true;
          this.updateVoiceButton(true);
          this.updateStatus('🎤 Listening... Speak now!');
      };

      this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          this.handleVoiceInput(transcript);
      };

      this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          
          let errorMessage = '';
          switch(event.error) {
              case 'network':
                  errorMessage = 'Network error. Check your internet connection and try again.';
                  break;
              case 'audio-capture':
                  errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
                  break;
              case 'not-allowed':
                  errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.';
                  break;
              case 'no-speech':
                  errorMessage = 'No speech detected. Please try speaking again.';
                  break;
              case 'aborted':
                  errorMessage = 'Speech recognition was aborted.';
                  break;
              default:
                  errorMessage = `Voice recognition error: ${event.error}. Try using text input instead.`;
          }
          
          this.showError(errorMessage);
          this.showTextInputFallback();
          this.stopListening();
      };

      this.recognition.onend = () => {
          this.stopListening();
      };
  }

  setupEventListeners() {
      this.voiceBtn.addEventListener('click', () => {
          if (this.isListening) {
              this.stopListening();
          } else {
              this.startListening();
          }
      });
  }

  startListening() {
      if (!this.recognition) {
          this.showError('Voice recognition not available');
          return;
      }

      try {
          this.recognition.start();
      } catch (error) {
          console.error('Failed to start voice recognition:', error);
          this.showError('Failed to start voice recognition');
      }
  }

  stopListening() {
      if (this.recognition && this.isListening) {
          this.recognition.stop();
      }
      this.isListening = false;
      this.updateVoiceButton(false);
      this.updateStatus('Ready to listen...');
  }

  updateVoiceButton(listening) {
      if (listening) {
          this.voiceBtn.classList.add('listening');
          this.voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Listening';
      } else {
          this.voiceBtn.classList.remove('listening');
          this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Use Voice';
      }
  }

  updateStatus(message) {
      this.statusText.textContent = message;
  }

  handleVoiceInput(transcript) {
      console.log('User said:', transcript);
      
      // Display what the user said
      this.userSpeechDiv.textContent = transcript;
      this.userSpeechDiv.style.fontStyle = 'normal';
      
      // Show processing status
      this.updateStatus('🤖 Processing your input...');
      this.transactionSummaryDiv.innerHTML = '<div class="loading"></div> Processing...';
      
      // Generate prompt for Claude.ai
      this.generateClaudePrompt(transcript);
      
      // Simulate AI processing delay
      setTimeout(() => {
          this.processTransaction(transcript);
      }, 1500);
  }

  generateClaudePrompt(transcript) {
      const prompt = `You are a voice command interpreter.
When given a spoken sentence like "I sold 5 bags of rice at $2 each today,"
extract and return the following in JSON format:
{
"type": "income",
"item": "rice",
"quantity": 5,
"price_per_unit": 2,
"total_amount": 10,
"category": "grocery",
"date": "${new Date().toISOString().split('T')[0]}"
}
If the sentence is not related to income or expense, respond with {"error": "Invalid input"}.
Input: ${transcript}`;

      console.log('=== CLAUDE.AI PROMPT ===');
      console.log(prompt);
      console.log('========================');
  }

  processTransaction(transcript) {
      // Simulate AI response based on common patterns
      const simulatedResponse = this.simulateAIResponse(transcript);
      
      if (simulatedResponse.error) {
          this.showTransactionError(simulatedResponse.error);
      } else {
          this.showTransactionSuccess(simulatedResponse);
          this.addToTransactionHistory(simulatedResponse);
      }
      
      this.updateStatus('Ready to listen...');
  }

  simulateAIResponse(transcript) {
      const lowerTranscript = transcript.toLowerCase();
      
      // Pattern matching for common transactions
      const patterns = [
          // Income patterns
          {
              regex: /sold (\d+) (\w+) (?:at|for) \$?(\d+(?:\.\d{2})?)(?: each)?/i,
              type: 'income',
              extract: (match) => ({
                  item: match[2],
                  quantity: parseInt(match[1]),
                  price_per_unit: parseFloat(match[3]),
                  category: this.categorizeItem(match[2])
              })
          },
          {
              regex: /earned \$?(\d+(?:\.\d{2})?) (?:from|selling) (\w+)/i,
              type: 'income',
              extract: (match) => ({
                  item: match[2],
                  quantity: 1,
                  price_per_unit: parseFloat(match[1]),
                  category: this.categorizeItem(match[2])
              })
          },
          // Expense patterns
          {
              regex: /bought (\d+) (\w+) (?:for|at) \$?(\d+(?:\.\d{2})?)/i,
              type: 'expense',
              extract: (match) => ({
                  item: match[2],
                  quantity: parseInt(match[1]),
                  price_per_unit: parseFloat(match[3]) / parseInt(match[1]),
                  category: this.categorizeItem(match[2])
              })
          },
          {
              regex: /spent \$?(\d+(?:\.\d{2})?) on (\w+)/i,
              type: 'expense',
              extract: (match) => ({
                  item: match[2],
                  quantity: 1,
                  price_per_unit: parseFloat(match[1]),
                  category: this.categorizeItem(match[2])
              })
          }
      ];

      for (const pattern of patterns) {
          const match = transcript.match(pattern.regex);
          if (match) {
              const extracted = pattern.extract(match);
              return {
                  type: pattern.type,
                  item: extracted.item,
                  quantity: extracted.quantity,
                  price_per_unit: extracted.price_per_unit,
                  total_amount: extracted.quantity * extracted.price_per_unit,
                  category: extracted.category,
                  date: new Date().toISOString().split('T')[0]
              };
          }
      }

      // If no pattern matches
      return { error: "Could not understand the transaction. Please try again with a clearer format." };
  }

  categorizeItem(item) {
      const categories = {
          rice: 'grocery',
          bread: 'grocery',
          milk: 'grocery',
          vegetables: 'grocery',
          water: 'beverage',
          soda: 'beverage',
          juice: 'beverage',
          soap: 'household',
          detergent: 'household',
          phone: 'electronics',
          charger: 'electronics'
      };
      
      return categories[item.toLowerCase()] || 'general';
  }

  showTransactionSuccess(data) {
      const emoji = data.type === 'income' ? '✅' : '💸';
      const typeText = data.type === 'income' ? 'Earned' : 'Spent';
      
      this.transactionSummaryDiv.innerHTML = `
          <div class="transaction-success">
              <h4>${emoji} Transaction Logged Successfully!</h4>
              <p><strong>Type:</strong> ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</p>
              <p><strong>Item:</strong> ${data.item}</p>
              <p><strong>Quantity:</strong> ${data.quantity}</p>
              <p><strong>Price per unit:</strong> $${data.price_per_unit.toFixed(2)}</p>
              <p><strong>Total Amount:</strong> $${data.total_amount.toFixed(2)}</p>
              <p><strong>Category:</strong> ${data.category}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <div class="summary-highlight">
                  ${emoji} ${typeText}: ${data.item} | Amount: $${data.total_amount.toFixed(2)}
              </div>
          </div>
      `;
      
      this.transactionSummaryDiv.classList.remove('error');
      this.transactionSummaryDiv.classList.add('success');
  }

  showTransactionError(error) {
      this.transactionSummaryDiv.innerHTML = `
          <div class="transaction-error">
              <h4>❌ Processing Error</h4>
              <p>${error}</p>
              <p><em>Try saying something like: "I sold 5 bags of rice at $2 each today"</em></p>
          </div>
      `;
      
      this.transactionSummaryDiv.classList.remove('success');
      this.transactionSummaryDiv.classList.add('error');
  }

  showError(message) {
      this.updateStatus(`❌ ${message}`);
      console.error('TrackMyShop Error:', message);
  }

  showTextInputFallback() {
      // Create a text input fallback when voice fails
      const fallbackDiv = document.createElement('div');
      fallbackDiv.className = 'text-input-fallback';
      fallbackDiv.innerHTML = `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4>📝 Voice not working? Use text instead:</h4>
              <input type="text" id="textInput" placeholder="Type: I sold 5 bags of rice at $2 each today" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;">
              <button onclick="trackMyShop.processTextInput()" 
                      style="background: #4facfe; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                  Process Transaction
              </button>
          </div>
      `;
      
      // Insert after voice section
      const voiceSection = document.querySelector('.voice-section');
      if (voiceSection && !document.querySelector('.text-input-fallback')) {
          voiceSection.insertAdjacentElement('afterend', fallbackDiv);
      }
  }

  processTextInput() {
      const textInput = document.getElementById('textInput');
      if (textInput && textInput.value.trim()) {
          this.handleVoiceInput(textInput.value.trim());
          textInput.value = '';
      }
  }

  addToTransactionHistory(transaction) {
      this.transactions.unshift(transaction);
      
      // Keep only last 10 transactions
      if (this.transactions.length > 10) {
          this.transactions = this.transactions.slice(0, 10);
      }
      
      this.updateTransactionsList();
  }

  updateTransactionsList() {
      if (this.transactions.length === 0) {
          this.recentListDiv.innerHTML = 'No transactions yet. Start by recording your first sale or expense!';
          return;
      }

      const transactionsHTML = this.transactions.map(transaction => {
          const emoji = transaction.type === 'income' ? '💰' : '💸';
          const amountClass = transaction.type === 'income' ? 'income' : 'expense';
          const sign = transaction.type === 'income' ? '+' : '-';
          
          return `
              <div class="transaction-item ${transaction.type}">
                  <div class="transaction-info">
                      <div class="transaction-type">${emoji} ${transaction.type}</div>
                      <div class="transaction-details-inline">
                          ${transaction.quantity}x ${transaction.item} @ $${transaction.price_per_unit.toFixed(2)} each
                      </div>
                      <div class="transaction-date">${transaction.date}</div>
                  </div>
                  <div class="transaction-amount ${amountClass}">
                      ${sign}$${transaction.total_amount.toFixed(2)}
                  </div>
              </div>
          `;
      }).join('');

      this.recentListDiv.innerHTML = transactionsHTML;
  }

  // Calculate daily summary
  getDailySummary() {
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = this.transactions.filter(t => t.date === today);
      
      const income = todayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.total_amount, 0);
          
      const expenses = todayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.total_amount, 0);
          
      return {
          income: income,
          expenses: expenses,
          profit: income - expenses,
          transactionCount: todayTransactions.length
      };
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏪 TrackMyShop App Starting...');
  const app = new TrackMyShop();
  
  // Make app globally accessible for debugging
  window.trackMyShop = app;
  
  console.log('✅ TrackMyShop App Ready!');
  console.log('💡 Click the microphone button and try saying:');
  console.log('   "I sold 5 bags of rice at $2 each today"');
  console.log('   "I bought 10 bottles of water for $15"');
  console.log('   "I earned $50 from selling vegetables"');
});